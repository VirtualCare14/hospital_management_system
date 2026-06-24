const IpdAdmission = require('../models/IpdAdmission');
const IpdConsumable = require('../models/IpdConsumable');
const IpdMedicine = require('../models/IpdMedicine');
const IpdLabTest = require('../models/IpdLabTest');
const IpdActivityTimeline = require('../models/IpdActivityTimeline');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const User = require('../models/User');
const LabRequest = require('../models/LabRequest');
const LabTest = require('../models/LabTest');
const IpdOtRecord = require('../models/IpdOtRecord');
const OtBooking = require('../models/OtBooking');
const OperationTheatre = require('../models/OperationTheatre');
const Consultation = require('../models/Consultation');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helper to check and auto-complete OT if past scheduledEnd, and return the status
const checkAndAutoCompleteIpdOt = async (admissionId) => {
  try {
    const otRecord = await IpdOtRecord.findOne({ admissionId }).sort({ createdAt: -1 });
    if (otRecord && (otRecord.status === 'In Progress' || otRecord.status === 'Scheduled') && otRecord.otScheduling?.scheduledEnd) {
      if (new Date() > new Date(otRecord.otScheduling.scheduledEnd)) {
        otRecord.status = 'Completed';
        otRecord.schedulingStatus = 'Completed';
        await otRecord.save();
        
        if (otRecord.otScheduling.otBookingId) {
          await OtBooking.findByIdAndUpdate(otRecord.otScheduling.otBookingId, { status: 'Completed' });
        }
        if (otRecord.otScheduling.otId) {
          const activeBookings = await OtBooking.countDocuments({
            otId: otRecord.otScheduling.otId,
            status: { $in: ['Scheduled', 'In Progress'] }
          });
          if (activeBookings === 0) {
            await OperationTheatre.findByIdAndUpdate(otRecord.otScheduling.otId, { availabilityStatus: 'Available' });
          }
        }
        return 'Completed';
      }
    }
    return otRecord ? otRecord.status : null;
  } catch (err) {
    console.error('checkAndAutoCompleteIpdOt error:', err);
    return null;
  }
};

// Helper to add timeline entry
const addTimeline = async (req, admissionId, patientId, activity, description, metadata = {}) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  return IpdActivityTimeline.create({
    hospitalId: req.user.hospitalId,
    admissionId,
    patientId,
    activity,
    description,
    date: dateStr,
    time: timeStr,
    performedBy: req.user._id,
    performedByName: req.user.doctorName || req.user.username || 'System',
    metadata
  });
};

// @desc    Get all IPD admissions with full patient details (for Patient List)
// @route   GET /api/ipd/patients
// @access  Private
const getIpdPatientList = async (req, res) => {
  try {
    const { search, roomType, bedType, status, fromDate, toDate } = req.query;

    let query = tenantFilter(req);

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingPatients = await Patient.find({
        hospitalId: req.user.hospitalId,
        $or: [
          { patientName: searchRegex },
          { uhid: searchRegex },
          { mobile: searchRegex }
        ]
      }).select('_id');
      const patientIds = matchingPatients.map(p => p._id);

      query.$or = [
        { patientId: { $in: patientIds } },
        { ipdNumber: searchRegex },
        { pidNumber: searchRegex }
      ];
    }

    if (status) query.status = status;

    if (fromDate || toDate) {
      query.admissionDate = {};
      if (fromDate) query.admissionDate.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.admissionDate.$lte = endDate;
      }
    }

    const admissions = await IpdAdmission.find(query)
      .populate('patientId', 'patientName uhid mobile dob gender address')
      .populate('roomId', 'roomType')
      .populate('bedId', 'bedNumber bedType pricePerDay')
      .populate('doctorInCharge', 'doctorName username specialization')
      .populate({ path: 'referredDoctor', select: 'doctorName username' })
      .sort({ createdAt: -1 });

    let filteredAdmissions = admissions;
    if (roomType) {
      filteredAdmissions = filteredAdmissions.filter(
        a => a.roomId?.roomType?.toLowerCase() === roomType.toLowerCase()
      );
    }
    if (bedType) {
      filteredAdmissions = filteredAdmissions.filter(
        a => a.bedId?.bedType?.toLowerCase() === bedType.toLowerCase()
      );
    }

    const admissionsWithOt = await Promise.all(
      filteredAdmissions.map(async (adm) => {
        const otStatus = await checkAndAutoCompleteIpdOt(adm._id);
        return {
          ...adm.toObject(),
          otStatus
        };
      })
    );

    res.status(200).json(admissionsWithOt);
  } catch (error) {
    console.error('Get IPD Patient List Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single admission details with full patient info
// @route   GET /api/ipd/patients/:id
// @access  Private
const getIpdPatientDetails = async (req, res) => {
  try {
    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: req.params.id }))
      .populate('patientId', 'patientName uhid mobile dob gender address aadhaar')
      .populate('roomId', 'roomType description')
      .populate('bedId', 'bedNumber bedType pricePerDay')
      .populate('doctorInCharge', 'doctorName username specialization')
      .populate({ path: 'referredDoctor', select: 'doctorName username' });

    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const otStatus = await checkAndAutoCompleteIpdOt(admission._id);
    
    // Fetch allergy details from latest completed consultation
    const latestConsultation = await Consultation.findOne({
      patientId: admission.patientId?._id || admission.patientId,
      consultationStatus: 'completed'
    }).sort({ createdAt: -1 });

    const admissionObj = {
      ...admission.toObject(),
      otStatus,
      allergyDetails: latestConsultation?.vitals?.drugAllergy || 'No known allergies'
    };

    res.status(200).json(admissionObj);
  } catch (error) {
    console.error('Get IPD Patient Details Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add consumable service to IPD patient
// @route   POST /api/ipd/services/consumables
// @access  Private
const addConsumable = async (req, res) => {
  try {
    const { admissionId, serviceName, price, gst, quantity } = req.body;

    if (!admissionId || !serviceName || !price || !quantity) {
      return res.status(400).json({ message: 'Admission ID, service name, price, and quantity are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) return res.status(404).json({ message: 'Admission record not found' });

    const gstAmount = gst || 0;
    const subtotal = price * quantity;
    const totalAmount = subtotal + (subtotal * gstAmount / 100);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const consumable = await IpdConsumable.create({
      hospitalId: req.user.hospitalId,
      admissionId,
      patientId: admission.patientId,
      serviceName,
      price,
      gst: gstAmount,
      quantity,
      totalAmount: Math.round(totalAmount * 100) / 100,
      date: dateStr,
      time: timeStr,
      addedBy: req.user._id
    });

    // Add timeline entry
    await addTimeline(req, admissionId, admission.patientId, 'Service Added',
      `Consumable: ${serviceName} x ${quantity} = ₹${Math.round(totalAmount * 100) / 100}`);

    const populated = await IpdConsumable.findById(consumable._id)
      .populate('addedBy', 'username doctorName');

    res.status(201).json({ message: 'Consumable service added', consumable: populated });
  } catch (error) {
    console.error('Add Consumable Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get consumables for an admission
// @route   GET /api/ipd/services/consumables/:admissionId
// @access  Private
const getConsumables = async (req, res) => {
  try {
    const consumables = await IpdConsumable.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    )
      .populate('addedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.status(200).json(consumables);
  } catch (error) {
    console.error('Get Consumables Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a consumable record
// @route   DELETE /api/ipd/services/consumables/:id
// @access  Private
const deleteConsumable = async (req, res) => {
  try {
    const consumable = await IpdConsumable.findOneAndDelete(
      tenantFilter(req, { _id: req.params.id })
    );
    if (!consumable) return res.status(404).json({ message: 'Consumable record not found' });
    res.status(200).json({ message: 'Consumable record deleted' });
  } catch (error) {
    console.error('Delete Consumable Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add medicine to IPD patient
// @route   POST /api/ipd/services/medicines
// @access  Private
const addMedicine = async (req, res) => {
  try {
    const { admissionId, medicineName, quantity, unitPrice, gst, baseUnitPrice } = req.body;

    if (!admissionId || !medicineName || !quantity || !unitPrice) {
      return res.status(400).json({ message: 'Admission ID, medicine name, quantity, and unit price are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) return res.status(404).json({ message: 'Admission record not found' });

    // totalAmount is quantity * unitPrice (unitPrice expected to be GST-inclusive when gst provided)
    const totalAmount = quantity * unitPrice;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const medicine = await IpdMedicine.create({
      hospitalId: req.user.hospitalId,
      admissionId,
      patientId: admission.patientId,
      medicineName,
      quantity,
      unitPrice,
      gst: gst || 0,
      baseUnitPrice: baseUnitPrice || unitPrice,
      totalAmount,
      date: dateStr,
      time: timeStr,
      addedBy: req.user._id
    });

    // Add timeline entry
    await addTimeline(req, admissionId, admission.patientId, 'Medicine Added',
      `Medicine: ${medicineName} x ${quantity} = ₹${totalAmount}`);

    const populated = await IpdMedicine.findById(medicine._id)
      .populate('addedBy', 'username doctorName');

    res.status(201).json({ message: 'Medicine added', medicine: populated });
  } catch (error) {
    console.error('Add Medicine Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medicines for an admission
// @route   GET /api/ipd/services/medicines/:admissionId
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const medicines = await IpdMedicine.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    )
      .populate('addedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.status(200).json(medicines);
  } catch (error) {
    console.error('Get Medicines Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a medicine record
// @route   DELETE /api/ipd/services/medicines/:id
// @access  Private
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await IpdMedicine.findOneAndDelete(
      tenantFilter(req, { _id: req.params.id })
    );
    if (!medicine) return res.status(404).json({ message: 'Medicine record not found' });
    res.status(200).json({ message: 'Medicine record deleted' });
  } catch (error) {
    console.error('Delete Medicine Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add lab test to IPD patient + Auto-create Lab Request
// @route   POST /api/ipd/services/lab-tests
// @access  Private
const addLabTest = async (req, res) => {
  try {
    const { admissionId, testName, testCategory, testPrice, testId } = req.body;

    if (!admissionId || !testName) {
      return res.status(400).json({ message: 'Admission ID and test name are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }))
      .populate('patientId', 'patientName uhid');
    if (!admission) return res.status(404).json({ message: 'Admission record not found' });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Find doctor in charge for lab request
    const doctorInCharge = admission.doctorInCharge || req.user._id;

    // Auto-create Lab Request
    const labRequest = await LabRequest.create({
      hospitalId: req.user.hospitalId,
      patientId: admission.patientId._id,
      doctorId: doctorInCharge,
      tests: [testName],
      bookingDate: now,
      collectionType: 'Lab Visit',
      reportStatus: 'Pending',
      status: 'pending',
      remarks: `IPD Admission: ${admission.ipdNumber}`,
      statusHistory: [{
        status: 'pending',
        updatedAt: now,
        assistantName: req.user.doctorName || req.user.username,
        notes: 'Lab test requested from IPD'
      }]
    });

    // Find lab test for price info
    let finalPrice = parseFloat(testPrice) || 0;
    let finalCategory = testCategory || '';
    if (!finalPrice || !finalCategory) {
      const labTestMaster = await LabTest.findOne({
        $or: [
          { title: { $regex: `^${testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
          { test: { $regex: `^${testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
        ]
      });
      if (labTestMaster) {
        finalPrice = labTestMaster.totalAmount || labTestMaster.basePrice || 0;
        finalCategory = labTestMaster.category || testCategory || '';
      }
    }

    // Create IPD lab test record
    const ipdLabTest = await IpdLabTest.create({
      hospitalId: req.user.hospitalId,
      admissionId,
      patientId: admission.patientId._id,
      labRequestId: labRequest._id,
      testName,
      testCategory: finalCategory,
      testPrice: finalPrice,
      date: dateStr,
      time: timeStr,
      addedBy: req.user._id,
      reportStatus: 'Pending'
    });

    // Add timeline entry
    await addTimeline(req, admissionId, admission.patientId._id, 'Lab Test Ordered',
      `Test: ${testName} (₹${finalPrice}) - Lab Request #${labRequest.labId}`,
      { labRequestId: labRequest._id, labId: labRequest.labId });

    const populated = await IpdLabTest.findById(ipdLabTest._id)
      .populate('addedBy', 'username doctorName');

    res.status(201).json({
      message: 'Lab test added and request created automatically',
      labTest: populated,
      labRequest: { _id: labRequest._id, labId: labRequest.labId }
    });
  } catch (error) {
    console.error('Add Lab Test Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get lab tests for an admission
// @route   GET /api/ipd/services/lab-tests/:admissionId
// @access  Private
const getLabTests = async (req, res) => {
  try {
    const labTests = await IpdLabTest.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    )
      .populate('addedBy', 'username doctorName')
      .populate('labRequestId', 'labId reportStatus status sampleStatus report')
      .sort({ createdAt: -1 });

    // Sync report status from lab request
    const updatedTests = await Promise.all(labTests.map(async (test) => {
      if (test.labRequestId) {
        const request = await LabRequest.findById(test.labRequestId).select('reportStatus report');
        if (request) {
          if (request.reportStatus === 'Ready' || request.reportStatus === 'Completed') {
            test.reportStatus = 'Completed';
            test.reportDate = request.report?.completionDate || test.date;
            await test.save();
          }
        }
      }
      return test;
    }));

    res.status(200).json(updatedTests);
  } catch (error) {
    console.error('Get Lab Tests Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an IPD lab test record
// @route   DELETE /api/ipd/services/lab-tests/:id
// @access  Private
const deleteLabTest = async (req, res) => {
  try {
    const labTest = await IpdLabTest.findOneAndDelete(
      tenantFilter(req, { _id: req.params.id })
    );
    if (!labTest) return res.status(404).json({ message: 'Lab test record not found' });
    res.status(200).json({ message: 'Lab test record deleted' });
  } catch (error) {
    console.error('Delete Lab Test Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get activity timeline for an admission
// @route   GET /api/ipd/services/timeline/:admissionId
// @access  Private
const getTimeline = async (req, res) => {
  try {
    const timeline = await IpdActivityTimeline.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    )
      .sort({ createdAt: -1 });

    res.status(200).json(timeline);
  } catch (error) {
    console.error('Get Timeline Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient dashboard stats for an admission
// @route   GET /api/ipd/services/dashboard/:admissionId
// @access  Private
const getPatientDashboard = async (req, res) => {
  try {
    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: req.params.admissionId }))
      .populate('patientId', 'patientName uhid mobile dob gender')
      .populate('roomId', 'roomType')
      .populate('bedId', 'bedNumber bedType pricePerDay')
      .populate('doctorInCharge', 'doctorName username');

    if (!admission) return res.status(404).json({ message: 'Admission record not found' });

    const [consumables, medicines, labTests, timeline] = await Promise.all([
      IpdConsumable.countDocuments(tenantFilter(req, { admissionId: req.params.admissionId })),
      IpdMedicine.countDocuments(tenantFilter(req, { admissionId: req.params.admissionId })),
      IpdLabTest.find(tenantFilter(req, { admissionId: req.params.admissionId })),
      IpdActivityTimeline.countDocuments(tenantFilter(req, { admissionId: req.params.admissionId }))
    ]);

    const pendingReports = labTests.filter(t => t.reportStatus === 'Pending' || t.reportStatus === 'In Progress').length;
    const completedReports = labTests.filter(t => t.reportStatus === 'Completed' || t.reportStatus === 'Approved').length;

    // Calculate billing
    const bedPricePerDay = admission.bedId?.pricePerDay || 0;
    const admissionDate = new Date(admission.admissionDate);
    const currentDate = admission.status === 'Discharged' && admission.dischargeDate
      ? new Date(admission.dischargeDate) : new Date();
    const daysAdmitted = Math.max(1, Math.ceil((currentDate - admissionDate) / (1000 * 60 * 60 * 24)));
    const roomCharges = bedPricePerDay * daysAdmitted;

    const consumableCharges = (await IpdConsumable.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    )).reduce((sum, c) => sum + c.totalAmount, 0);

    const medicineCharges = (await IpdMedicine.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    )).reduce((sum, m) => sum + m.totalAmount, 0);

    const labCharges = labTests.reduce((sum, t) => sum + (t.testPrice || 0), 0);
    const currentTotal = roomCharges + consumableCharges + medicineCharges + labCharges;

    res.status(200).json({
      admission: {
        ipdNumber: admission.ipdNumber,
        pidNumber: admission.pidNumber,
        status: admission.status,
        admissionDate: admission.admissionDate,
        daysAdmitted
      },
      patient: admission.patientId,
      bed: {
        roomType: admission.roomId?.roomType,
        bedType: admission.bedId?.bedType,
        bedNumber: admission.bedId?.bedNumber,
        pricePerDay: bedPricePerDay
      },
      doctor: admission.doctorInCharge,
      billing: {
        roomCharges: Math.round(roomCharges * 100) / 100,
        consumableCharges: Math.round(consumableCharges * 100) / 100,
        medicineCharges: Math.round(medicineCharges * 100) / 100,
        labCharges: Math.round(labCharges * 100) / 100,
        currentTotal: Math.round(currentTotal * 100) / 100
      },
      counts: {
        consumables,
        medicines,
        labTests: labTests.length,
        pendingReports,
        completedReports,
        timelineEntries: timeline
      }
    });
  } catch (error) {
    console.error('Get Patient Dashboard Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get billing summary for an admission (with lab charges)
// @route   GET /api/ipd/services/billing/:admissionId
// @access  Private
const getBillingSummary = async (req, res) => {
  try {
    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: req.params.admissionId }))
      .populate('bedId', 'pricePerDay');

    if (!admission) return res.status(404).json({ message: 'Admission record not found' });

    const bedPricePerDay = admission.bedId?.pricePerDay || 0;
    const admissionDate = new Date(admission.admissionDate);
    const currentDate = admission.status === 'Discharged' && admission.dischargeDate
      ? new Date(admission.dischargeDate) : new Date();
    const daysAdmitted = Math.max(1, Math.ceil((currentDate - admissionDate) / (1000 * 60 * 60 * 24)));

    const roomCharges = bedPricePerDay * daysAdmitted;
    const bedCharges = 0; // Included in room charges

    const consumables = await IpdConsumable.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    );
    const consumableCharges = consumables.reduce((sum, c) => sum + c.totalAmount, 0);
    const consumableGST = consumables.reduce((sum, c) => {
      const baseAmount = c.price * c.quantity;
      return sum + (baseAmount * c.gst / 100);
    }, 0);
    const consumableSubtotal = consumableCharges - consumableGST;

    const medicines = await IpdMedicine.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    );
    const medicineCharges = medicines.reduce((sum, m) => sum + m.totalAmount, 0);

    const labTests = await IpdLabTest.find(
      tenantFilter(req, { admissionId: req.params.admissionId })
    );
    const labCharges = labTests.reduce((sum, t) => sum + (t.testPrice || 0), 0);

    const subTotal = roomCharges + consumableSubtotal + medicineCharges + labCharges;
    const grandTotal = roomCharges + consumableCharges + medicineCharges + labCharges;

    res.status(200).json({
      roomCharges: Math.round(roomCharges * 100) / 100,
      bedCharges: Math.round(bedCharges * 100) / 100,
      consumableCharges: Math.round(consumableCharges * 100) / 100,
      consumableSubtotal: Math.round(consumableSubtotal * 100) / 100,
      consumableGST: Math.round(consumableGST * 100) / 100,
      medicineCharges: Math.round(medicineCharges * 100) / 100,
      labCharges: Math.round(labCharges * 100) / 100,
      subTotal: Math.round(subTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      daysAdmitted,
      bedPricePerDay,
      consumableCount: consumables.length,
      medicineCount: medicines.length,
      labTestCount: labTests.length,
      // Details for display
      consumableDetails: consumables.map(c => ({
        serviceName: c.serviceName,
        quantity: c.quantity,
        price: c.price,
        gst: c.gst,
        totalAmount: c.totalAmount,
        date: c.date
      })),
      medicineDetails: medicines.map(m => ({
        medicineName: m.medicineName,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        totalAmount: m.totalAmount,
        date: m.date
      })),
      labTestDetails: labTests.map(t => ({
        testName: t.testName,
        testCategory: t.testCategory,
        testPrice: t.testPrice,
        reportStatus: t.reportStatus,
        date: t.date
      }))
    });
  } catch (error) {
    console.error('Get Billing Summary Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getIpdPatientList,
  getIpdPatientDetails,
  addConsumable,
  getConsumables,
  deleteConsumable,
  addMedicine,
  getMedicines,
  deleteMedicine,
  addLabTest,
  getLabTests,
  deleteLabTest,
  getTimeline,
  getPatientDashboard,
  getBillingSummary
};