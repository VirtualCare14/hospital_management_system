const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const IpdConsumable = require('../models/IpdConsumable');
const IpdMedicine = require('../models/IpdMedicine');
const IpdLabTest = require('../models/IpdLabTest');
const IpdAdmission = require('../models/IpdAdmission');
const SameDayTreatment = require('../models/SameDayTreatment');
const SdtItem = require('../models/SdtItem');
const PharmacyDispense = require('../models/PharmacyDispense');
const LabBill = require('../models/LabBill');
const LabRequest = require('../models/LabRequest');
const Bed = require('../models/Bed');
const HospitalSettings = require('../models/HospitalSettings');
const IpdOtRecord = require('../models/IpdOtRecord');
const PharmacyBill = require('../models/PharmacyBill');
const AdvancePayment = require('../models/AdvancePayment');
const Visit = require('../models/Visit');


const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helper to get patient by UHID
const getPatientByUhid = async (req, uhid) => {
  const patient = await Patient.findOne(tenantFilter(req, { uhid }));
  if (!patient) return null;
  const age = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  return { ...patient.toObject(), patientAge: age };
};

// Helper to format date
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

// @desc    Get patients eligible for billing (patients with billable services)
// @route   GET /api/billing/eligible-patients
// @access  Private
const getEligiblePatients = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Build patient search filter
    let patientFilter = tenantFilter(req);
    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      patientFilter = {
        ...patientFilter,
        $or: [
          { uhid: regex },
          { patientName: regex },
          { mobile: regex }
        ]
      };
    }

    // Find all patients matching search
    const allPatients = await Patient.find(patientFilter).limit(100).sort({ createdAt: -1 });

    // For each patient, check if they have any billable items
    const eligiblePatients = [];

    for (const patient of allPatients) {
      const hasBillableItems = await checkBillableItems(patient._id);
      if (hasBillableItems.hasItems) {
        const advances = await AdvancePayment.find({ patientId: patient._id, isAdjusted: false });
        const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);
        const adjustedPendingAmount = Math.max(0, hasBillableItems.totalPendingAmount - totalAdvance);

        const age = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
        eligiblePatients.push({
          _id: patient._id,
          patientName: patient.patientName,
          uhid: patient.uhid,
          mobile: patient.mobile,
          gender: patient.gender,
          patientAge: age,
          dob: patient.dob,
          address: patient.address,
          categories: hasBillableItems.categories,
          totalPendingAmount: adjustedPendingAmount
        });
      }
    }

    res.json(eligiblePatients);
  } catch (error) {
    console.error('Get Eligible Patients Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper: Check if a patient has any billable items
const checkBillableItems = async (patientId) => {
  const categories = [];
  let totalPendingAmount = 0;

  // Find all finalized items to avoid duplicate billing
  const finalizedBills = await Billing.find({ patientId, status: 'Final' });
  const billedSourceIds = new Set();
  finalizedBills.forEach(b => {
    if (b.items) {
      b.items.forEach(item => {
        if (item.sourceId) {
          billedSourceIds.add(item.sourceId.toString());
        }
      });
    }
  });

  // Check if patient already has a Final bill
  const hasExistingBills = finalizedBills.length > 0;

  // Check OPD Consultations
  const consultations = await Consultation.find({ patientId }).populate('doctorId', 'opdFees');
  const opdConsultations = consultations.filter(c => (c.doctorId?.opdFees || 0) > 0 && !billedSourceIds.has(c._id.toString()));
  if (opdConsultations.length > 0) {
    categories.push('OPD');
    totalPendingAmount += opdConsultations.reduce((sum, c) => sum + (c.doctorId?.opdFees || 0), 0);
  }

  // Include Registration fee if they have never been billed
  if (!hasExistingBills) {
    categories.push('OPD');
    totalPendingAmount += 200; // Registration fee matches generateBillItems
  }

  // Check Same Day Treatments (Completed)
  const treatments = await SameDayTreatment.find({ patientId, status: 'Completed' });
  const pendingTreatments = treatments.filter(t => !billedSourceIds.has(t._id.toString()));
  if (pendingTreatments.length > 0) {
    categories.push('SameDayTreatment');
    totalPendingAmount += pendingTreatments.reduce((sum, t) => sum + (t.price || 0), 0);
  }

  // Check SDT Items
  const sdtItems = await SdtItem.find({ patientId }).populate('treatmentId', 'status');
  const completedSdtItems = sdtItems.filter(item => item.treatmentId?.status === 'Completed' && !billedSourceIds.has(item._id.toString()));
  if (completedSdtItems.length > 0) {
    if (!categories.includes('SameDayTreatment')) categories.push('SameDayTreatment');
    totalPendingAmount += completedSdtItems.reduce((sum, item) => sum + (item.totalAmount || (item.price * item.quantity) || 0), 0);
  }

  // Check Lab Tests (IPD)
  const ipdLabTests = await IpdLabTest.find({ patientId });
  const pendingIpdLabTests = ipdLabTests.filter(t => !billedSourceIds.has(t._id.toString()));
  if (pendingIpdLabTests.length > 0) {
    categories.push('Lab');
    totalPendingAmount += pendingIpdLabTests.reduce((sum, t) => sum + (t.testPrice || 0), 0);
  }

  // Check Lab Bills
  const labBills = await LabBill.find({ patientId });
  const pendingLabBills = labBills.filter(lb => !billedSourceIds.has(lb._id.toString()));
  if (pendingLabBills.length > 0) {
    if (!categories.includes('Lab')) categories.push('Lab');
    totalPendingAmount += pendingLabBills.reduce((sum, lb) => sum + (lb.totalAmount || 0), 0);
  }

  // Check IPD Admissions (Bed Charges, Consumables, Medicines)
  const admissions = await IpdAdmission.find({ patientId });
  const activeAdmissions = admissions.filter(admission => !billedSourceIds.has(admission._id.toString()));
  if (activeAdmissions.length > 0) {
    for (const admission of activeAdmissions) {
      // Bed charges
      const bed = await Bed.findById(admission.bedId);
      if (bed?.pricePerDay) {
        const daysAdmitted = Math.ceil((new Date(admission.dischargeDate || new Date()) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)) || 1;
        const roomCharge = bed.pricePerDay * daysAdmitted;
        if (!categories.includes('BedCharge')) categories.push('BedCharge');
        totalPendingAmount += roomCharge;

        // Add dynamic Nursing charges (e.g. flat 300 per day stay) matching generateBillItems
        if (!categories.includes('IPD')) categories.push('IPD');
        totalPendingAmount += 300 * daysAdmitted;
      }

      // Consumables
      const consumables = await IpdConsumable.find({ admissionId: admission._id });
      const pendingConsumables = consumables.filter(c => !billedSourceIds.has(c._id.toString()));
      if (pendingConsumables.length > 0) {
        if (!categories.includes('Consumable')) categories.push('Consumable');
        totalPendingAmount += pendingConsumables.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
      }

      // Medicines
      const medicines = await IpdMedicine.find({ admissionId: admission._id });
      const pendingMedicines = medicines.filter(m => !billedSourceIds.has(m._id.toString()));
      if (pendingMedicines.length > 0) {
        if (!categories.includes('Medicine')) categories.push('Medicine');
        totalPendingAmount += pendingMedicines.reduce((sum, m) => sum + (m.totalAmount || 0), 0);
      }
    }
  }

  // Check Pharmacy Bills (consistently with generateBillItems)
  const pharmacyBills = await PharmacyBill.find({ patientId, paymentStatus: { $ne: 'Paid' } });
  const pendingPharmacyBills = pharmacyBills.filter(pb => !billedSourceIds.has(pb._id.toString()));
  if (pendingPharmacyBills.length > 0) {
    if (!categories.includes('Medicine')) categories.push('Medicine');
    pendingPharmacyBills.forEach(pBill => {
      pBill.items.forEach(pItem => {
        const remainingQty = pItem.quantity - pItem.returnedQty;
        if (remainingQty > 0) {
          totalPendingAmount += pItem.amount || (pItem.unitPrice * remainingQty) || 0;
        }
      });
    });
  }

  // Check OT charges
  const otRecords = await IpdOtRecord.find({ patientId });
  let pendingOtCharges = 0;
  otRecords.forEach(rec => {
    if (rec.otCharges && rec.otCharges.length > 0) {
      rec.otCharges.forEach(charge => {
        if (!charge.isActive) return;
        if (billedSourceIds.has(charge._id.toString())) return;
        pendingOtCharges += charge.chargeAmount;
      });
    }
  });
  if (pendingOtCharges > 0) {
    categories.push('OT');
    totalPendingAmount += pendingOtCharges;
  }

  return {
    hasItems: categories.length > 0,
    categories: [...new Set(categories)],
    totalPendingAmount,
    hasFinalBill: finalizedBills.length > 0,
    existingBillCount: finalizedBills.length
  };
};

// @desc    Search patients by name/UHID for billing
// @route   GET /api/billing/search/:query
// @access  Private
const searchPatient = async (req, res) => {
  try {
    const { query } = req.params;
    const patients = await Patient.find(tenantFilter(req, {
      $or: [
        { uhid: { $regex: query, $options: 'i' } },
        { patientName: { $regex: query, $options: 'i' } },
        { mobile: { $regex: query, $options: 'i' } }
      ]
    })).limit(20);
    res.json(patients);
  } catch (error) {
    console.error('Search Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate bill items for a patient by UHID
// @route   GET /api/billing/generate/:uhid
// @access  Private
const generateBillItems = async (req, res) => {
  try {
    const { uhid } = req.params;
    const { billType } = req.query; // OPD, SameDayTreatment, Lab, IPD, All

    const patient = await getPatientByUhid(req, uhid);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Fetch hospital configurations
    const settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    const gstEnabled = settings ? settings.gstEnabled : true;
    const gstPercentage = settings ? settings.gstPercentage : 18;
    const discountEnabled = settings ? settings.discountEnabled : true;
    const discountReasons = settings ? settings.discountReasons : [];

    // Find all finalized items to avoid duplicate billing
    const finalizedBills = await Billing.find(tenantFilter(req, { patientId: patient._id, status: 'Final' }));
    const billedSourceIds = new Set();
    finalizedBills.forEach(b => {
      if (b.items) {
        b.items.forEach(item => {
          if (item.sourceId) {
            billedSourceIds.add(item.sourceId.toString());
          }
        });
      }
    });

    // Check if this is the patient's first bill ever in the system
    const hasExistingBills = await Billing.exists(tenantFilter(req, { patientId: patient._id }));

    // Fetch details for doctor name, registration, and admission
    const latestVisit = await Visit.findOne(tenantFilter(req, { patientId: patient._id })).populate('doctorId', 'doctorName').sort({ createdAt: -1 });
    const latestConsultation = await Consultation.findOne(tenantFilter(req, { patientId: patient._id })).populate('doctorId', 'doctorName').sort({ createdAt: -1 });
    const latestAdmission = await IpdAdmission.findOne(tenantFilter(req, { patientId: patient._id }))
      .populate('roomId', 'roomType')
      .populate('bedId', 'bedNumber pricePerDay')
      .populate('doctorInCharge', 'doctorName')
      .sort({ createdAt: -1 });

    const doctorName = latestAdmission?.doctorInCharge?.doctorName || latestConsultation?.doctorId?.doctorName || latestVisit?.doctorId?.doctorName || 'Not Assigned';
    const registrationDate = patient.createdAt;
    const admissionDetails = latestAdmission ? {
      admissionDate: latestAdmission.admissionDate,
      dischargeDate: latestAdmission.dischargeDate,
      status: latestAdmission.status,
      roomType: latestAdmission.roomId?.roomType || 'N/A',
      bedNumber: latestAdmission.bedId?.bedNumber || 'N/A',
      ipdNumber: latestAdmission.ipdNumber,
      pidNumber: latestAdmission.pidNumber,
      doctorInCharge: latestAdmission.doctorInCharge?.doctorName || 'N/A'
    } : null;

    let items = [];

    // 1. OPD Charges
    if (!billType || billType === 'All' || billType === 'OPD') {
      // Registration Fee (apply only on the first bill, default to 200 or config)
      if (!hasExistingBills) {
        items.push({
          category: 'OPD',
          date: fmtDate(patient.createdAt),
          description: 'OPD Registration Fee',
          price: 200,
          quantity: 1,
          total: 200,
          sourceId: patient._id, // use patientId as a dummy source to prevent double billing
          sourceModel: 'Patient'
        });
      }

      // Consultation Fees
      const consultations = await Consultation.find({ patientId: patient._id })
        .populate('doctorId', 'doctorName opdFees')
        .sort({ createdAt: -1 });
        
      consultations.forEach(c => {
        if (billedSourceIds.has(c._id.toString())) return;
        const fee = c.doctorId?.opdFees || 0;
        if (fee > 0) {
          items.push({
            category: 'OPD',
            date: fmtDate(c.createdAt),
            description: `OPD Consultation - Dr. ${c.doctorId?.doctorName || 'Doctor'}`,
            price: fee,
            quantity: 1,
            total: fee,
            sourceId: c._id,
            sourceModel: 'Consultation'
          });
        }
      });
    }

    // 2. Same Day Treatment (SDT)
    const includeSdtItems = !billType || billType === 'All' || billType === 'SameDayTreatment' || billType === 'Lab';
    if (!billType || billType === 'All' || billType === 'SameDayTreatment') {
      const treatments = await SameDayTreatment.find({ patientId: patient._id, status: 'Completed' }).sort({ createdAt: -1 });
      treatments.forEach(t => {
        if (billedSourceIds.has(t._id.toString())) return;
        const price = t.price || 0;
        if (price > 0) {
          items.push({
            category: 'SameDayTreatment',
            date: fmtDate(t.treatmentDate),
            description: `${t.treatmentType} Treatment`,
            price: price,
            quantity: 1,
            total: price,
            sourceId: t._id,
            sourceModel: 'SameDayTreatment'
          });
        }
      });
    }

    if (includeSdtItems) {
      const treatmentItems = await SdtItem.find({ patientId: patient._id }).populate('treatmentId', 'status').sort({ createdAt: -1 });
      treatmentItems.forEach(item => {
        if (billedSourceIds.has(item._id.toString())) return;
        const itemStatus = item.treatmentId?.status;
        if (itemStatus && itemStatus !== 'Completed') return;
        if (billType === 'Lab' && item.itemType !== 'Lab Test') return;
        
        const category = item.itemType === 'Lab Test' ? 'Lab' : item.itemType;
        items.push({
          category,
          date: item.date || fmtDate(item.createdAt),
          description: `${item.name} (${item.itemType})`,
          price: item.price || 0,
          quantity: item.quantity || 1,
          total: item.totalAmount || (item.price * item.quantity) || 0,
          sourceId: item._id,
          sourceModel: 'SdtItem'
        });
      });
    }

    // 3. Laboratory Charges
    if (!billType || billType === 'All' || billType === 'Lab') {
      // Lab tests from IPD
      const ipdLabTests = await IpdLabTest.find({ patientId: patient._id }).populate('admissionId', 'ipdNumber').sort({ createdAt: -1 });
      ipdLabTests.forEach(t => {
        if (billedSourceIds.has(t._id.toString())) return;
        items.push({
          category: 'Lab',
          date: t.date || fmtDate(t.createdAt),
          description: `Lab Test: ${t.testName}${t.admissionId?.ipdNumber ? ` (IPD: ${t.admissionId.ipdNumber})` : ''}`,
          price: t.testPrice || 0,
          quantity: 1,
          total: t.testPrice || 0,
          sourceId: t._id,
          sourceModel: 'IpdLabTest'
        });
      });

      // Lab bills from lab module that are unpaid/partially paid
      const labBills = await LabBill.find(tenantFilter(req, { patientId: patient._id, paymentStatus: { $ne: 'Paid' } })).sort({ createdAt: -1 });
      labBills.forEach(lb => {
        if (billedSourceIds.has(lb._id.toString())) return;
        lb.testDetails.forEach((test, tIdx) => {
          items.push({
            category: 'Lab',
            date: fmtDate(lb.createdAt),
            description: `Lab Bill ${lb.billNo}: ${test.name}`,
            price: test.basePrice || 0,
            quantity: 1,
            total: test.totalAmount || test.basePrice || 0,
            sourceId: lb._id,
            sourceModel: 'LabBill'
          });
        });
      });
    }

    // 4. IPD Charges
    if (!billType || billType === 'All' || billType === 'IPD') {
      const admissions = await IpdAdmission.find(tenantFilter(req, { patientId: patient._id }))
        .populate('roomId', 'roomType')
        .populate('bedId', 'bedNumber pricePerDay bedType')
        .sort({ createdAt: -1 });

      for (const admission of admissions) {
        if (billedSourceIds.has(admission._id.toString())) continue;
        
        // Bed charges
        if (admission.bedId?.pricePerDay) {
          const daysAdmitted = Math.ceil((new Date(admission.dischargeDate || new Date()) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)) || 1;
          const roomCharge = admission.bedId.pricePerDay * daysAdmitted;
          items.push({
            category: 'BedCharge',
            date: fmtDate(admission.admissionDate),
            description: `Room Stay: ${admission.roomId?.roomType || 'N/A'} (Bed: ${admission.bedId?.bedNumber || 'N/A'}) - ${daysAdmitted} day(s) @ ₹${admission.bedId.pricePerDay}/day`,
            price: admission.bedId.pricePerDay,
            quantity: daysAdmitted,
            total: roomCharge,
            sourceId: admission._id,
            sourceModel: 'IpdAdmission'
          });

          // Add dynamic Nursing charges (e.g. flat 300 per day stay)
          const nursingCharge = 300 * daysAdmitted;
          items.push({
            category: 'IPD',
            date: fmtDate(admission.admissionDate),
            description: `Nursing Charges - ${daysAdmitted} day(s) @ ₹300/day`,
            price: 300,
            quantity: daysAdmitted,
            total: nursingCharge,
            sourceId: admission._id,
            sourceModel: 'IpdAdmissionNursing'
          });
        }

        // IPD Consumables
        const consumables = await IpdConsumable.find({ admissionId: admission._id });
        consumables.forEach(c => {
          if (billedSourceIds.has(c._id.toString())) return;
          items.push({
            category: 'Consumable',
            date: c.date || fmtDate(c.createdAt),
            description: `${c.serviceName}${c.gst ? ` (GST: ${c.gst}%)` : ''}`,
            price: c.price || 0,
            quantity: c.quantity || 1,
            total: c.totalAmount || 0,
            sourceId: c._id,
            sourceModel: 'IpdConsumable'
          });
        });

        // IPD Medicines
        const medicines = await IpdMedicine.find({ admissionId: admission._id });
        medicines.forEach(m => {
          if (billedSourceIds.has(m._id.toString())) return;
          items.push({
            category: 'Medicine',
            date: m.date || fmtDate(m.createdAt),
            description: m.medicineName,
            price: m.unitPrice || 0,
            quantity: m.quantity || 1,
            total: m.totalAmount || 0,
            sourceId: m._id,
            sourceModel: 'IpdMedicine'
          });
        });
      }
    }

    // 5. OT Charges
    if (!billType || billType === 'All' || billType === 'OT') {
      const otRecords = await IpdOtRecord.find(tenantFilter(req, { patientId: patient._id }));
      otRecords.forEach(rec => {
        if (rec.otCharges && rec.otCharges.length > 0) {
          rec.otCharges.forEach(charge => {
            if (!charge.isActive) return;
            if (billedSourceIds.has(charge._id.toString())) return;

            items.push({
              category: 'OT',
              date: fmtDate(charge.addedAt || rec.dateOfSurgery || rec.createdAt),
              description: `${charge.chargeName} (Procedure: ${rec.proceduresPerformed || 'OT Surgery'})`,
              price: charge.chargeAmount,
              quantity: 1,
              total: charge.chargeAmount,
              sourceId: charge._id,
              sourceModel: 'IpdOtRecordCharge'
            });
          });
        }
      });
    }

    // 6. Pharmacy Charges (from unpaid Pharmacy Bills)
    if (!billType || billType === 'All' || billType === 'Pharmacy') {
      const pharmacyBills = await PharmacyBill.find(tenantFilter(req, { patientId: patient._id, paymentStatus: { $ne: 'Paid' } })).sort({ createdAt: -1 });
      pharmacyBills.forEach(pBill => {
        if (billedSourceIds.has(pBill._id.toString())) return;
        pBill.items.forEach((pItem, pIdx) => {
          const remainingQty = pItem.quantity - pItem.returnedQty;
          if (remainingQty > 0) {
            items.push({
              category: 'Medicine',
              date: fmtDate(pBill.billDate || pBill.createdAt),
              description: `Pharmacy Bill ${pBill.billNumber}: ${pItem.itemName}`,
              price: pItem.unitPrice || 0,
              quantity: remainingQty,
              total: pItem.amount || (pItem.unitPrice * remainingQty) || 0,
              sourceId: pBill._id,
              sourceModel: 'PharmacyBill'
            });
          }
        });
      });
    }

    // Filter items based on whether their source IDs have already been finalized
    const activeItems = items.filter(i => !billedSourceIds.has(i.sourceId?.toString() || ''));
    const subtotal = activeItems.reduce((sum, i) => sum + i.total, 0);

    // Fetch active unadjusted advance payments
    const activeAdvances = await AdvancePayment.find(tenantFilter(req, { patientId: patient._id, isAdjusted: false }));
    const totalAdvance = activeAdvances.reduce((sum, adv) => sum + adv.amount, 0);

    res.json({
      patient: {
        _id: patient._id,
        patientName: patient.patientName,
        uhid: patient.uhid,
        mobile: patient.mobile,
        gender: patient.gender,
        patientAge: patient.patientAge,
        address: patient.address,
        doctorName,
        registrationDate: fmtDate(registrationDate),
        admissionDetails,
        category: patient.category || 'General'
      },
      items: activeItems,
      subtotal,
      totalAdvance,
      activeAdvances,
      settings: {
        gstEnabled,
        gstPercentage,
        discountEnabled,
        discountPercentage: settings ? settings.discountPercentage : 0,
        discountFixedAmount: settings ? settings.discountFixedAmount : 0,
        patientSpecificDiscounts: settings ? settings.patientSpecificDiscounts : '',
        discountReasons,
        sdtPricingInBilling: settings ? settings.sdtPricingInBilling : true
      }
    });
  } catch (error) {
    console.error('Generate Bill Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create / Save Bill
// @route   POST /api/billing
// @access  Private
const createBill = async (req, res) => {
  try {
    const { 
      patientId, uhid, patientName, patientMobile, patientGender, patientAge, doctorName,
      billType, items, gstPercentage, discountPercentage, status,
      paymentMode, transactionRef, mixedPayments, remarks, advanceAdjusted, amountPaid, dueAmount, paymentStatus,
      discountRequestStatus
    } = req.body;

    if (!patientId || !uhid || !billType) {
      return res.status(400).json({ message: 'Patient ID, UHID, and bill type are required' });
    }

    if (status === 'Final' && !paymentMode) {
      return res.status(400).json({ message: 'Payment mode is required to finalize the bill' });
    }

    const activeItems = items.filter(i => !i.isRemoved);
    const removedItems = items.filter(i => i.isRemoved);
    const subtotal = activeItems.reduce((sum, i) => sum + i.total, 0);

    // Use the GST rate sent in request directly
    const finalGstPercentage = parseFloat(gstPercentage || 0);

    const discountAmt = subtotal * (parseFloat(discountPercentage || 0) / 100);
    const discountedSubtotal = Math.max(0, subtotal - discountAmt);
    const gstAmt = discountedSubtotal * (finalGstPercentage / 100);
    const grandTotal = discountedSubtotal + gstAmt;

    let invoiceNo = undefined;
    if (status === 'Final') {
      // Fetch settings again to atomically increment counter
      const settingsWithCounter = await HospitalSettings.findOneAndUpdate(
        { hospitalId: req.user.hospitalId },
        { $inc: { invoiceCounter: 1 } },
        { new: false } // returns settings prior to increment
      );

      if (settingsWithCounter) {
        const prefix = settingsWithCounter.invoicePrefix || 'HOSP-INV-2026-';
        const counter = settingsWithCounter.invoiceCounter || 1;
        const paddedCounter = String(counter).padStart(4, '0');
        invoiceNo = `${prefix}${paddedCounter}`;
      } else {
        invoiceNo = `INV${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // Set up audit trail
    const auditTrail = [{
      action: status === 'Final' ? 'Finalized' : 'Draft Created',
      performedBy: req.user._id,
      performedByName: req.user.username || 'Staff',
      timestamp: new Date(),
      remarks: status === 'Final' ? `Invoice finalized. Invoice No: ${invoiceNo}. Payment Mode: ${paymentMode}` : 'Draft invoice saved'
    }];

    const bill = new Billing({
      hospitalId: req.user.hospitalId,
      patientId, uhid, patientName, patientMobile, patientGender, patientAge, doctorName: doctorName || '',
      billType,
      items: activeItems,
      subtotal,
      gstPercentage: finalGstPercentage,
      gstAmount: gstAmt,
      discountPercentage: parseFloat(discountPercentage || 0),
      discountAmount: discountAmt,
      grandTotal,
      removedItems,
      status: status === 'Final' ? 'Final' : 'Draft',
      discountRequestStatus: discountRequestStatus || 'None',
      
      // Payment Info
      paymentMode: paymentMode || '',
      transactionRef: transactionRef || '',
      mixedPayments: mixedPayments || [],
      remarks: remarks || '',
      advanceAdjusted: parseFloat(advanceAdjusted || 0),
      amountPaid: parseFloat(amountPaid || 0),
      dueAmount: parseFloat(dueAmount || 0),
      paymentStatus: paymentStatus || 'Unpaid',
      invoiceNo,
      auditTrail,

      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await bill.save();

    // Sync SameDayTreatment price on finalization
    if (status === 'Final') {
      const SameDayTreatment = require('../models/SameDayTreatment');
      for (const item of activeItems) {
        if (item.sourceModel === 'SameDayTreatment' && item.sourceId) {
          try {
            await SameDayTreatment.findByIdAndUpdate(item.sourceId, { price: item.price });
          } catch (err) {
            console.error('Failed to sync SameDayTreatment price:', err);
          }
        }
      }
    }

    // Mark adjusted advance payments
    if (status === 'Final' && advanceAdjusted > 0) {
      let remainingToAdjust = parseFloat(advanceAdjusted);
      const advances = await AdvancePayment.find({ patientId, isAdjusted: false }).sort({ createdAt: 1 });
      for (const adv of advances) {
        if (remainingToAdjust <= 0) break;
        if (adv.amount <= remainingToAdjust) {
          remainingToAdjust -= adv.amount;
          adv.isAdjusted = true;
          adv.adjustedInInvoice = bill._id;
          await adv.save();
        } else {
          // Split the advance payment
          const splitAmount = adv.amount - remainingToAdjust;
          adv.amount = remainingToAdjust;
          adv.isAdjusted = true;
          adv.adjustedInInvoice = bill._id;
          await adv.save();

          const remainingAdv = new AdvancePayment({
            hospitalId: req.user.hospitalId,
            patientId: adv.patientId,
            uhid: adv.uhid,
            amount: splitAmount,
            date: adv.date,
            time: adv.time,
            paymentMode: adv.paymentMode,
            remarks: 'Remaining advance balance from invoice adjustments',
            collectedBy: adv.collectedBy,
            collectedByName: adv.collectedByName,
            isAdjusted: false
          });
          await remainingAdv.save();
          remainingToAdjust = 0;
        }
      }
    }

    res.status(201).json({ message: 'Bill created successfully', bill });
  } catch (error) {
    console.error('Create Bill Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      gstPercentage, discountPercentage, items, status,
      paymentMode, transactionRef, mixedPayments, remarks, advanceAdjusted, amountPaid, dueAmount, paymentStatus,
      doctorName, discountRequestStatus
    } = req.body;

    const bill = await Billing.findOne(tenantFilter(req, { _id: id }));
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const transitionToFinal = status === 'Final' && bill.status !== 'Final';

    if (transitionToFinal && !paymentMode) {
      return res.status(400).json({ message: 'Payment mode is required to finalize the bill' });
    }

    const logs = [];
    if (gstPercentage !== undefined && bill.gstPercentage !== parseFloat(gstPercentage)) {
      logs.push(`GST rate updated from ${bill.gstPercentage}% to ${gstPercentage}%`);
    }
    if (discountPercentage !== undefined && bill.discountPercentage !== parseFloat(discountPercentage)) {
      logs.push(`Discount rate updated from ${bill.discountPercentage}% to ${discountPercentage}%`);
    }
    if (paymentMode !== undefined && bill.paymentMode !== paymentMode) {
      logs.push(`Payment mode updated from "${bill.paymentMode || 'None'}" to "${paymentMode}"`);
    }
    if (paymentStatus !== undefined && bill.paymentStatus !== paymentStatus) {
      logs.push(`Payment status updated from "${bill.paymentStatus}" to "${paymentStatus}"`);
    }
    if (status !== undefined && bill.status !== status) {
      logs.push(`Invoice status updated from "${bill.status}" to "${status}"`);
    }

    if (gstPercentage !== undefined) bill.gstPercentage = parseFloat(gstPercentage);
    if (discountPercentage !== undefined) bill.discountPercentage = parseFloat(discountPercentage);
    if (items) {
      const activeItems = items.filter(i => !i.isRemoved);
      const removedItems = items.filter(i => i.isRemoved);
      bill.items = activeItems;
      bill.removedItems = removedItems;
    }
    
    if (paymentMode !== undefined) bill.paymentMode = paymentMode;
    if (transactionRef !== undefined) bill.transactionRef = transactionRef;
    if (mixedPayments !== undefined) bill.mixedPayments = mixedPayments;
    if (remarks !== undefined) bill.remarks = remarks;
    if (advanceAdjusted !== undefined) bill.advanceAdjusted = parseFloat(advanceAdjusted);
    if (amountPaid !== undefined) bill.amountPaid = parseFloat(amountPaid);
    if (dueAmount !== undefined) bill.dueAmount = parseFloat(dueAmount);
    if (paymentStatus !== undefined) bill.paymentStatus = paymentStatus;
    if (doctorName !== undefined) bill.doctorName = doctorName;

    if (discountRequestStatus !== undefined) bill.discountRequestStatus = discountRequestStatus;
    if (status) bill.status = status;

    const subtotal = bill.items.reduce((sum, i) => sum + i.total, 0);
    bill.subtotal = subtotal;

    // Use the GST rate sent in request directly
    let finalGstPercentage = parseFloat(bill.gstPercentage || 0);
    bill.gstPercentage = finalGstPercentage;

    bill.discountAmount = subtotal * (bill.discountPercentage / 100);
    const discountedSubtotal = Math.max(0, subtotal - bill.discountAmount);
    bill.gstAmount = discountedSubtotal * (bill.gstPercentage / 100);
    bill.grandTotal = discountedSubtotal + bill.gstAmount;
    bill.updatedBy = req.user._id;

    let invoiceNo = bill.invoiceNo;
    if (transitionToFinal) {
      // Fetch settings and atomically increment counter
      const settings = await HospitalSettings.findOneAndUpdate(
        { hospitalId: req.user.hospitalId },
        { $inc: { invoiceCounter: 1 } },
        { new: false }
      );

      if (settings) {
        const prefix = settings.invoicePrefix || 'HOSP-INV-2026-';
        const counter = settings.invoiceCounter || 1;
        const paddedCounter = String(counter).padStart(4, '0');
        invoiceNo = `${prefix}${paddedCounter}`;
      } else {
        invoiceNo = `INV${Math.floor(100000 + Math.random() * 900000)}`;
      }
      bill.invoiceNo = invoiceNo;
    }

    // Add audit log
    const auditAction = transitionToFinal ? 'Finalized' : 'Updated';
    let auditRemarks = transitionToFinal ? `Invoice finalized. Invoice No: ${invoiceNo}. Payment Mode: ${paymentMode}` : 'Draft invoice updated';
    if (logs.length > 0) {
      auditRemarks += ` | Changes: ${logs.join(', ')}`;
    }
    bill.auditTrail.push({
      action: auditAction,
      performedBy: req.user._id,
      performedByName: req.user.username || 'Staff',
      timestamp: new Date(),
      remarks: auditRemarks
    });

    await bill.save();

    // Sync SameDayTreatment price on finalization
    if (status === 'Final') {
      const SameDayTreatment = require('../models/SameDayTreatment');
      for (const item of bill.items) {
        if (item.sourceModel === 'SameDayTreatment' && item.sourceId) {
          try {
            await SameDayTreatment.findByIdAndUpdate(item.sourceId, { price: item.price });
          } catch (err) {
            console.error('Failed to sync SameDayTreatment price:', err);
          }
        }
      }
    }

    // Mark adjusted advance payments
    if (transitionToFinal && advanceAdjusted > 0) {
      let remainingToAdjust = parseFloat(advanceAdjusted);
      const advances = await AdvancePayment.find({ patientId: bill.patientId, isAdjusted: false }).sort({ createdAt: 1 });
      for (const adv of advances) {
        if (remainingToAdjust <= 0) break;
        if (adv.amount <= remainingToAdjust) {
          remainingToAdjust -= adv.amount;
          adv.isAdjusted = true;
          adv.adjustedInInvoice = bill._id;
          await adv.save();
        } else {
          // Split the advance payment
          const splitAmount = adv.amount - remainingToAdjust;
          adv.amount = remainingToAdjust;
          adv.isAdjusted = true;
          adv.adjustedInInvoice = bill._id;
          await adv.save();

          const remainingAdv = new AdvancePayment({
            hospitalId: req.user.hospitalId,
            patientId: adv.patientId,
            uhid: adv.uhid,
            amount: splitAmount,
            date: adv.date,
            time: adv.time,
            paymentMode: adv.paymentMode,
            remarks: 'Remaining advance balance from invoice adjustments',
            collectedBy: adv.collectedBy,
            collectedByName: adv.collectedByName,
            isAdjusted: false
          });
          await remainingAdv.save();
          remainingToAdjust = 0;
        }
      }
    }

    res.json({ message: 'Bill updated', bill });
  } catch (error) {
    console.error('Update Bill Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientBills = async (req, res) => {
  try {
    const { uhid } = req.params;
    const bills = await Billing.find(tenantFilter(req, { uhid }))
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error('Get Patient Bills Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Billing.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    console.error('Get Bill Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllBills = async (req, res) => {
  try {
    const { billType, status, fromDate, toDate, searchQuery, invoiceNo, paymentMode } = req.query;
    let query = tenantFilter(req);
    
    if (billType) query.billType = billType;
    if (status) query.status = status;
    if (invoiceNo) query.invoiceNo = { $regex: invoiceNo, $options: 'i' };
    if (paymentMode) query.paymentMode = paymentMode;

    if (searchQuery) {
      query.$or = [
        { uhid: { $regex: searchQuery, $options: 'i' } },
        { patientName: { $regex: searchQuery, $options: 'i' } },
        { patientMobile: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }
    const bills = await Billing.find(query)
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error('Get All Bills Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record patient advance payment
// @route   POST /api/billing/advance
// @access  Private
const createAdvance = async (req, res) => {
  try {
    const { patientId, uhid, amount, paymentMode, remarks, date, time } = req.body;
    if (!patientId || !uhid || !amount || !paymentMode) {
      return res.status(400).json({ message: 'Patient ID, UHID, amount, and payment mode are required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const now = new Date();
    // Auto-detect from system (prefer client-passed value, fall back to backend local date/time)
    const localDate = date || now.toLocaleDateString('sv-SE');
    const localTime = time || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const advance = new AdvancePayment({
      hospitalId: req.user.hospitalId,
      patientId,
      uhid,
      amount: Number(amount),
      date: localDate,
      time: localTime,
      paymentMode,
      remarks: remarks || '',
      collectedBy: req.user._id,
      collectedByName: req.user.username || 'Staff'
    });

    await advance.save();
    res.status(201).json({ message: 'Advance payment recorded successfully', advance });
  } catch (error) {
    console.error('Create Advance Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient active advances
// @route   GET /api/billing/advance/:uhid
// @access  Private
const getPatientAdvances = async (req, res) => {
  try {
    const { uhid } = req.params;
    const advances = await AdvancePayment.find(tenantFilter(req, { uhid }))
      .populate('collectedBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(advances);
  } catch (error) {
    console.error('Get Patient Advances Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel Bill
// @route   PUT /api/billing/cancel/:id
// @access  Private/Admin
const cancelBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const bill = await Billing.findOne(tenantFilter(req, { _id: id }));
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    if (bill.status === 'Cancelled') {
      return res.status(400).json({ message: 'Bill is already cancelled' });
    }

    bill.status = 'Cancelled';
    bill.paymentStatus = 'Cancelled';
    bill.dueAmount = 0;
    bill.amountPaid = 0;
    bill.advanceAdjusted = 0;
    
    // Add audit log
    bill.auditTrail.push({
      action: 'Cancelled',
      performedBy: req.user._id,
      performedByName: req.user.username || 'Staff',
      timestamp: new Date(),
      remarks: remarks || 'Invoice cancelled by authority'
    });

    // Revert/unadjust any advances associated with this bill
    await AdvancePayment.updateMany(
      { adjustedInInvoice: bill._id },
      { $set: { isAdjusted: false, adjustedInInvoice: null } }
    );

    await bill.save();
    res.json({ message: 'Invoice cancelled successfully', bill });
  } catch (error) {
    console.error('Cancel Bill Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Billing Dashboard Stats
// @route   GET /api/billing/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const allBills = await Billing.find(tenantFilter(req, { status: { $ne: 'Draft' } }));

    let todayCollection = 0;
    let monthlyCollection = 0;
    let outstanding = 0;
    let discountToday = 0;
    
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;
    let cancelledCount = 0;

    allBills.forEach(bill => {
      const createdAt = new Date(bill.createdAt);
      
      if (bill.status === 'Cancelled') {
        cancelledCount++;
      } else {
        if (bill.paymentStatus === 'Paid') paidCount++;
        else if (bill.paymentStatus === 'Partially Paid') partialCount++;
        else unpaidCount++;

        outstanding += bill.dueAmount || 0;
      }

      if (createdAt >= startOfToday && createdAt <= endOfToday) {
        if (bill.status !== 'Cancelled') {
          todayCollection += bill.amountPaid || 0;
          discountToday += bill.discountAmount || 0;
        }
      }

      if (createdAt >= startOfMonth) {
        if (bill.status !== 'Cancelled') {
          monthlyCollection += bill.amountPaid || 0;
        }
      }
    });

    res.json({
      todayCollection,
      monthlyCollection,
      outstandingPayments: outstanding,
      discountSummary: discountToday,
      billCounts: {
        paid: paidCount,
        unpaid: unpaidCount,
        partiallyPaid: partialCount,
        cancelled: cancelledCount
      }
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending discount requests for admin
const getDiscountRequests = async (req, res) => {
  try {
    const requests = await Billing.find(tenantFilter(req, {
      status: 'Draft',
      discountRequestStatus: 'Pending'
    })).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Get Discount Requests Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve discount request and finalize invoice
const approveDiscountRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountPercentage } = req.body;

    const pct = parseFloat(discountPercentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ message: 'Valid discount percentage between 0 and 100 is required' });
    }

    const bill = await Billing.findOne(tenantFilter(req, { _id: id }));
    if (!bill) return res.status(404).json({ message: 'Bill request not found' });

    bill.discountPercentage = pct;
    bill.discountAmount = bill.subtotal * (pct / 100);
    const discountedSubtotal = Math.max(0, bill.subtotal - bill.discountAmount);
    bill.gstAmount = discountedSubtotal * (bill.gstPercentage / 100);
    bill.grandTotal = discountedSubtotal + bill.gstAmount;

    // Apply any advance adjustment
    const advanceAdjusted = bill.advanceAdjusted || 0;
    bill.amountPaid = Math.max(0, bill.grandTotal - advanceAdjusted);
    bill.dueAmount = 0;
    bill.paymentStatus = 'Paid';

    // Atomically increment invoice counter and generate invoiceNo
    const settings = await HospitalSettings.findOneAndUpdate(
      { hospitalId: req.user.hospitalId },
      { $inc: { invoiceCounter: 1 } },
      { new: true }
    );

    let invoiceNo;
    if (settings) {
      const prefix = settings.invoicePrefix || 'HOSP-INV-2026-';
      const counter = settings.invoiceCounter || 1;
      const paddedCounter = String(counter).padStart(4, '0');
      invoiceNo = `${prefix}${paddedCounter}`;
    } else {
      invoiceNo = `INV${Math.floor(100000 + Math.random() * 900000)}`;
    }

    bill.invoiceNo = invoiceNo;
    bill.status = 'Final';
    bill.discountRequestStatus = 'Approved';
    bill.updatedBy = req.user._id;

    // Log in audit trail
    bill.auditTrail.push({
      action: 'Finalized',
      performedBy: req.user._id,
      performedByName: req.user.username || 'Admin',
      timestamp: new Date(),
      remarks: `Discount approved at ${pct}%. Invoice finalized. Invoice No: ${invoiceNo}.`
    });

    let savedBill = null;
    let saveAttempt = 0;
    const maxSaveAttempts = 3;

    while (saveAttempt < maxSaveAttempts) {
      try {
        savedBill = await bill.save();
        break;
      } catch (saveError) {
        if (saveError.code === 11000 && saveError.keyPattern?.invoiceNo) {
          saveAttempt += 1;
          bill.invoiceNo = `INV${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
          continue;
        }
        throw saveError;
      }
    }

    if (!savedBill) {
      throw new Error('Unable to save approved bill after retrying invoice number generation');
    }

    // Mark adjusted advances in database
    if (advanceAdjusted > 0) {
      let remainingToAdjust = advanceAdjusted;
      const advances = await AdvancePayment.find({ patientId: bill.patientId, isAdjusted: false }).sort({ createdAt: 1 });
      for (const adv of advances) {
        if (remainingToAdjust <= 0) break;
        if (adv.amount <= remainingToAdjust) {
          remainingToAdjust -= adv.amount;
          adv.isAdjusted = true;
          adv.adjustedInInvoice = bill._id;
          await adv.save();
        } else {
          const splitAmount = adv.amount - remainingToAdjust;
          adv.amount = remainingToAdjust;
          adv.isAdjusted = true;
          adv.adjustedInInvoice = bill._id;
          await adv.save();

          const remainingAdv = new AdvancePayment({
            hospitalId: req.user.hospitalId,
            patientId: adv.patientId,
            uhid: adv.uhid,
            amount: splitAmount,
            date: adv.date,
            time: adv.time,
            paymentMode: adv.paymentMode,
            remarks: 'Remaining advance balance from invoice adjustments',
            collectedBy: adv.collectedBy,
            collectedByName: adv.collectedByName,
            isAdjusted: false
          });
          await remainingAdv.save();
          remainingToAdjust = 0;
        }
      }
    }

    res.json({ message: 'Discount approved and invoice finalized', bill: savedBill });
  } catch (error) {
    console.error('Approve Discount Request Error:', error.message || error, error.stack || '');
    if (error.code === 11000 && error.keyPattern?.invoiceNo) {
      return res.status(500).json({ message: 'Invoice number conflict occurred while approving the discount. Please retry.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject discount request
const rejectDiscountRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Billing.findOne(tenantFilter(req, { _id: id }));
    if (!bill) return res.status(404).json({ message: 'Bill request not found' });

    bill.discountRequestStatus = 'Rejected';
    bill.discountPercentage = 0;
    bill.discountAmount = 0;
    bill.gstAmount = bill.subtotal * (bill.gstPercentage / 100);
    bill.grandTotal = bill.subtotal + bill.gstAmount;
    bill.updatedBy = req.user._id;

    bill.auditTrail.push({
      action: 'Discount Rejected',
      performedBy: req.user._id,
      performedByName: req.user.username || 'Admin',
      timestamp: new Date(),
      remarks: 'Discount request rejected by administrator.'
    });

    await bill.save();
    res.json({ message: 'Discount request rejected', bill });
  } catch (error) {
    console.error('Reject Discount Request Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  generateBillItems, createBill, updateBill,
  getPatientBills, getBillById, getAllBills,
  searchPatient, getEligiblePatients,
  createAdvance, getPatientAdvances, cancelBill, getDashboardStats,
  getDiscountRequests, approveDiscountRequest, rejectDiscountRequest
};