const PharmacyBill = require('../models/PharmacyBill');
const PharmacySetting = require('../models/PharmacySetting');
const PharmacyStockMovement = require('../models/PharmacyStockMovement');
const PharmacyInventory = require('../models/PharmacyInventory');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const HospitalSettings = require('../models/HospitalSettings');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Search patients with prescription details
// @route   GET /api/pharmacy/billing/prescriptions
// @access  Private
const searchPrescriptions = async (req, res) => {
  try {
    const { search } = req.query;
    let query = tenantFilter(req);

    if (search) {
      // 1. Search Patient records by Name, UHID, Mobile
      const patients = await Patient.find(tenantFilter(req, {
        $or: [
          { patientName: { $regex: search, $options: 'i' } },
          { uhid: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      }));
      const matchedPatientIds = patients.map(p => p._id);

      // 2. Search Visit records by OPD registration number
      const visits = await Visit.find(tenantFilter(req, {
        registrationNumber: { $regex: search, $options: 'i' },
        visitType: 'OPD'
      }));
      const visitPatientIds = visits.map(v => v.patientId);

      // Combine matching patient IDs
      const combinedPatientIds = [...new Set([...matchedPatientIds, ...visitPatientIds])];
      query.patientId = { $in: combinedPatientIds };
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'patientName uhid mobile gender dob age')
      .populate('doctorId', 'doctorName username department')
      .sort({ updatedAt: -1 });

    const formatted = await Promise.all(prescriptions.map(async (p) => {
      // Find latest OPD visit to fetch OPD Registration Number and Consultation Date
      const latestVisit = await Visit.findOne(tenantFilter(req, {
        patientId: p.patientId?._id,
        visitType: 'OPD'
      })).sort({ registrationDate: -1 });

      return {
        _id: p._id,
        patientDetails: p.patientId,
        doctorName: p.doctorId?.doctorName || p.doctorId?.username || 'N/A',
        consultationDate: p.updatedAt,
        prescriptionDetails: {
          medicines: p.medicines || [],
          language: p.language || 'English',
          pdfUrl: p.pdfUrl || ''
        },
        opdRegistrationNumber: latestVisit?.registrationNumber || 'N/A',
        visitDate: latestVisit?.registrationDate || null
      };
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Search Prescriptions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a pharmacy bill (Deduct stock, log movement)
// @route   POST /api/pharmacy/billing/bills
// @access  Private
const createBill = async (req, res) => {
  try {
    const {
      prescriptionId,
      patientId,
      customerDetails,
      doctorId,
      doctorName,
      items,
      subTotal,
      discount,
      gstAmount,
      grandTotal,
      paidAmount,
      paymentMethod,
      mixedPayments,
      paymentStatus
    } = req.body;

    const hospitalId = req.user.hospitalId;
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Bill must contain at least one item' });
    }

    // Verify stock and deduct
    for (const item of items) {
      const invItem = await PharmacyInventory.findOne({
        hospitalId,
        itemName: { $regex: new RegExp('^' + item.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        batch: item.batch
      });

      if (!invItem) {
        return res.status(400).json({ message: `Inventory batch not found for ${item.itemName} (Batch: ${item.batch})` });
      }

      if (invItem.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.itemName} (Batch: ${item.batch}). Available: ${invItem.quantity}, Requested: ${item.quantity}`
        });
      }

      // Deduct quantity
      const previousStock = invItem.quantity;
      invItem.quantity -= item.quantity;
      invItem.amount = invItem.rate * invItem.quantity;
      await invItem.save();

      // Create Stock Movement log
      await PharmacyStockMovement.create({
        hospitalId,
        itemName: item.itemName,
        batch: item.batch,
        type: 'Sale',
        quantity: -item.quantity,
        previousStock,
        newStock: invItem.quantity,
        performedBy: userId,
        remarks: `Sold via Bill generation`
      });
    }

    // Generate Bill Number
    const count = await PharmacyBill.countDocuments({ hospitalId });
    const billNumber = `PB-${10001 + count}`;
    const balanceAmount = Math.max(0, grandTotal - (paidAmount || 0));

    const finalBill = await PharmacyBill.create({
      hospitalId,
      billNumber,
      prescriptionId: prescriptionId || null,
      patientId: patientId || null,
      customerDetails: customerDetails || { name: '', mobile: '', age: null, gender: '' },
      doctorId: doctorId || null,
      doctorName: doctorName || '',
      items,
      subTotal,
      discount: discount || 0,
      gstAmount: gstAmount || 0,
      grandTotal,
      paidAmount: paidAmount || 0,
      balanceAmount,
      paymentMethod,
      mixedPayments: mixedPayments || [],
      paymentStatus,
      status: 'Active',
      auditTrail: [{
        action: 'Bill Created',
        performedBy: userId,
        performedByName: req.user.doctorName || req.user.username || 'System',
        timestamp: new Date(),
        remarks: `Bill generated with amount ₹${grandTotal.toFixed(2)}`
      }]
    });

    // Update Stock movements with bill references
    await PharmacyStockMovement.updateMany(
      { hospitalId, referenceId: null, timestamp: { $gte: new Date(Date.now() - 15000) } },
      { referenceId: finalBill._id }
    );

    res.status(201).json({ message: 'Pharmacy bill created successfully', bill: finalBill });
  } catch (error) {
    console.error('Create Bill Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pharmacy bills list
// @route   GET /api/pharmacy/billing/bills
// @access  Private
const getBills = async (req, res) => {
  try {
    const { search, paymentStatus, fromDate, toDate } = req.query;
    let query = tenantFilter(req);

    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (fromDate || toDate) {
      query.billDate = {};
      if (fromDate) query.billDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.billDate.$lte = end;
      }
    }

    const bills = await PharmacyBill.find(query)
      .populate('patientId', 'patientName uhid mobile')
      .populate('doctorId', 'doctorName username')
      .sort({ createdAt: -1 });

    let filtered = bills;
    if (search) {
      const regex = new RegExp(search, 'i');
      filtered = bills.filter(b => 
        b.billNumber.match(regex) ||
        b.patientId?.patientName.match(regex) ||
        b.customerDetails?.name?.match(regex) ||
        b.customerDetails?.mobile?.match(regex) ||
        b.doctorName?.match(regex)
      );
    }

    res.status(200).json(filtered);
  } catch (error) {
    console.error('Get Bills Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single bill details (including hospital settings and pharmacy settings)
// @route   GET /api/pharmacy/billing/bills/:id
// @access  Private
const getBillDetails = async (req, res) => {
  try {
    const bill = await PharmacyBill.findOne(tenantFilter(req, { _id: req.params.id }))
      .populate('patientId', 'patientName uhid dob gender mobile address')
      .populate('doctorId', 'doctorName username department');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Load hospital info
    const hospitalSettings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    const pharmacySetting = await PharmacySetting.findOne({ hospitalId: req.user.hospitalId });

    res.status(200).json({
      bill,
      hospitalSettings,
      pharmacySetting
    });
  } catch (error) {
    console.error('Get Bill Details Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process medicine returns (Accept / Reject returns, update stock)
// @route   POST /api/pharmacy/billing/bills/:id/returns
// @access  Private
const processReturn = async (req, res) => {
  try {
    const { items, remarks } = req.body;
    const hospitalId = req.user.hospitalId;
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Return details list is required' });
    }

    const bill = await PharmacyBill.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    let hasAcceptedReturn = false;

    for (const ret of items) {
      const billItem = bill.items.find(it => it.itemName.toLowerCase() === ret.itemName.toLowerCase() && it.batch === ret.batch);
      if (!billItem) {
        return res.status(400).json({ message: `Item ${ret.itemName} (Batch: ${ret.batch}) not found in the original invoice` });
      }

      const returnQty = parseInt(ret.quantity) || 0;
      if (returnQty <= 0) continue;

      if (billItem.returnedQty + returnQty > billItem.quantity) {
        return res.status(400).json({
          message: `Cannot return ${returnQty} of ${ret.itemName}. Max returnable quantity: ${billItem.quantity - billItem.returnedQty}`
        });
      }

      billItem.returnedQty += returnQty;

      if (ret.returnAccepted) {
        hasAcceptedReturn = true;
        // Increase stock back in inventory
        const invItem = await PharmacyInventory.findOne({
          hospitalId,
          itemName: { $regex: new RegExp('^' + ret.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          batch: ret.batch
        });

        if (invItem) {
          const previousStock = invItem.quantity;
          invItem.quantity += returnQty;
          invItem.amount = invItem.rate * invItem.quantity;
          await invItem.save();

          // Log Stock Movement
          await PharmacyStockMovement.create({
            hospitalId,
            itemName: ret.itemName,
            batch: ret.batch,
            type: 'Sales Return',
            quantity: returnQty,
            previousStock,
            newStock: invItem.quantity,
            referenceId: bill._id,
            performedBy: userId,
            remarks: `Sales Return accepted (Refunded)`
          });
        }
      } else {
        // Rejected returns log
        await PharmacyStockMovement.create({
          hospitalId,
          itemName: ret.itemName,
          batch: ret.batch,
          type: 'Manual Adjustment',
          quantity: 0,
          previousStock: 0,
          newStock: 0,
          referenceId: bill._id,
          performedBy: userId,
          remarks: `Sales Return rejected (Wasted/Damaged): Qty ${returnQty}`
        });
      }
    }

    // Determine status of invoice
    const allItemsReturned = bill.items.every(it => it.returnedQty === it.quantity);
    const someItemsReturned = bill.items.some(it => it.returnedQty > 0);

    bill.status = allItemsReturned ? 'Returned' : (someItemsReturned ? 'Partially Returned' : 'Active');

    bill.auditTrail.push({
      action: 'Returns Processed',
      performedBy: userId,
      performedByName: req.user.doctorName || req.user.username || 'Pharmacist',
      timestamp: new Date(),
      remarks: remarks || `Returned quantities verified. Status: ${bill.status}`
    });

    await bill.save();

    res.status(200).json({ message: `Returns processed successfully. Status: ${bill.status}`, bill });
  } catch (error) {
    console.error('Process Return Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pharmacy settings
// @route   GET /api/pharmacy/billing/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await PharmacySetting.findOne({ hospitalId: req.user.hospitalId });
    if (!settings) {
      settings = await PharmacySetting.create({
        hospitalId: req.user.hospitalId
      });
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update pharmacy settings
// @route   PUT /api/pharmacy/billing/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const { gstEnabled, emailAddress, gstNumber, termsAndConditions, thankYouMessage } = req.body;
    let settings = await PharmacySetting.findOne({ hospitalId: req.user.hospitalId });
    
    if (settings) {
      settings.gstEnabled = gstEnabled !== undefined ? gstEnabled : settings.gstEnabled;
      settings.emailAddress = emailAddress !== undefined ? emailAddress : settings.emailAddress;
      settings.gstNumber = gstNumber !== undefined ? gstNumber : settings.gstNumber;
      settings.termsAndConditions = termsAndConditions !== undefined ? termsAndConditions : settings.termsAndConditions;
      settings.thankYouMessage = thankYouMessage !== undefined ? thankYouMessage : settings.thankYouMessage;
      await settings.save();
    } else {
      settings = await PharmacySetting.create({
        hospitalId: req.user.hospitalId,
        gstEnabled,
        emailAddress,
        gstNumber,
        termsAndConditions,
        thankYouMessage
      });
    }

    res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Today's Statistics
// @route   GET /api/pharmacy/billing/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      hospitalId: req.user.hospitalId,
      billDate: { $gte: today, $lt: tomorrow }
    };

    const todayBills = await PharmacyBill.find(query);
    const totalBills = todayBills.length;
    const totalRevenue = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalGSTCollected = todayBills.reduce((sum, b) => sum + b.gstAmount, 0);

    let totalMedicinesSold = 0;
    todayBills.forEach(b => {
      b.items.forEach(it => {
        totalMedicinesSold += it.quantity;
      });
    });

    res.status(200).json({
      totalBills,
      totalRevenue,
      totalMedicinesSold,
      totalGSTCollected
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pharmacy reports
// @route   GET /api/pharmacy/billing/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const { reportType } = req.query; // 'sales' | 'financial' | 'inventory'
    const hospitalId = req.user.hospitalId;

    if (reportType === 'sales') {
      const bills = await PharmacyBill.find({ hospitalId }).populate('patientId', 'patientName');
      
      const dailySales = {};
      const monthlySales = {};
      const yearlySales = {};
      const medicineSales = {};
      const doctorSales = {};
      const patientSales = {};

      bills.forEach(b => {
        const dateStr = b.billDate.toISOString().split('T')[0];
        const monthStr = dateStr.substring(0, 7); // YYYY-MM
        const yearStr = dateStr.substring(0, 4); // YYYY

        dailySales[dateStr] = (dailySales[dateStr] || 0) + b.grandTotal;
        monthlySales[monthStr] = (monthlySales[monthStr] || 0) + b.grandTotal;
        yearlySales[yearStr] = (yearlySales[yearStr] || 0) + b.grandTotal;

        const docName = b.doctorName || 'Walk-in / Direct';
        doctorSales[docName] = (doctorSales[docName] || 0) + b.grandTotal;

        const patName = b.patientId?.patientName || b.customerDetails?.name || 'Walk-in Customer';
        patientSales[patName] = (patientSales[patName] || 0) + b.grandTotal;

        b.items.forEach(it => {
          if (!medicineSales[it.itemName]) {
            medicineSales[it.itemName] = { quantity: 0, revenue: 0 };
          }
          medicineSales[it.itemName].quantity += it.quantity;
          medicineSales[it.itemName].revenue += it.amount;
        });
      });

      return res.status(200).json({
        dailySales: Object.entries(dailySales).map(([date, val]) => ({ date, amount: val })).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 30),
        monthlySales: Object.entries(monthlySales).map(([month, amount]) => ({ month, amount })).sort((a,b) => b.month.localeCompare(a.month)),
        yearlySales: Object.entries(yearlySales).map(([year, amount]) => ({ year, amount })).sort((a,b) => b.year.localeCompare(a.year)),
        doctorSales: Object.entries(doctorSales).map(([doctor, amount]) => ({ doctor, amount })).sort((a,b) => b.amount - a.amount),
        patientSales: Object.entries(patientSales).map(([patient, amount]) => ({ patient, amount })).sort((a,b) => b.amount - a.amount).slice(0, 20),
        medicineSales: Object.entries(medicineSales).map(([medicine, data]) => ({ medicine, quantity: data.quantity, revenue: data.revenue })).sort((a,b) => b.revenue - a.revenue)
      });
    }

    if (reportType === 'financial') {
      const bills = await PharmacyBill.find({ hospitalId }).populate('patientId', 'patientName');
      
      const gstReport = [];
      const discountReport = [];
      const revenueReport = [];
      const outstandingPayments = [];

      bills.forEach(b => {
        const dateStr = b.billDate.toISOString().split('T')[0];
        gstReport.push({ billNumber: b.billNumber, date: dateStr, amount: b.gstAmount });
        discountReport.push({ billNumber: b.billNumber, date: dateStr, amount: b.discount });
        revenueReport.push({ billNumber: b.billNumber, date: dateStr, amount: b.grandTotal });

        if (b.paymentStatus !== 'Paid' && b.balanceAmount > 0) {
          outstandingPayments.push({
            billNumber: b.billNumber,
            date: dateStr,
            customerName: b.patientId?.patientName || b.customerDetails?.name || 'Walk-in Customer',
            grandTotal: b.grandTotal,
            paidAmount: b.paidAmount,
            balanceAmount: b.balanceAmount,
            status: b.paymentStatus
          });
        }
      });

      return res.status(200).json({
        gstReport: gstReport.slice(-50),
        discountReport: discountReport.slice(-50),
        revenueReport: revenueReport.slice(-50),
        outstandingPayments
      });
    }

    if (reportType === 'inventory') {
      const movements = await PharmacyStockMovement.find({ hospitalId })
        .populate('performedBy', 'username doctorName')
        .sort({ timestamp: -1 })
        .limit(50);

      const lowStock = await PharmacyInventory.find({
        hospitalId,
        quantity: { $lt: 50 }
      }).sort({ quantity: 1 });

      const bills = await PharmacyBill.find({ hospitalId });
      const quantitiesMap = {};
      
      bills.forEach(b => {
        b.items.forEach(it => {
          quantitiesMap[it.itemName] = (quantitiesMap[it.itemName] || 0) + it.quantity;
        });
      });

      const sortedSold = Object.entries(quantitiesMap)
        .map(([medicine, quantity]) => ({ medicine, quantity }))
        .sort((a, b) => b.quantity - a.quantity);

      const fastMoving = sortedSold.slice(0, 10);
      const slowMoving = sortedSold.slice(-10).reverse();

      return res.status(200).json({
        movements,
        lowStock,
        fastMoving,
        slowMoving
      });
    }

    res.status(400).json({ message: 'Invalid report type' });
  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  searchPrescriptions,
  createBill,
  getBills,
  getBillDetails,
  processReturn,
  getSettings,
  updateSettings,
  getDashboardStats,
  getReports
};
