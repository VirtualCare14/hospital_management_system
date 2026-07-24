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
const PharmacyInventory = require('../models/PharmacyInventory');
const IpdAdminSettings = require('../models/IpdAdminSettings');
const Prescription = require('../models/Prescription');



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

// Helper to calculate quantity for medicine if qty is missing or 0
const calculateMedicineQty = (med) => {
  if (med.qty && Number(med.qty) > 0) {
    return Number(med.qty);
  }
  let dailyDoses = 0;
  if (med.morning) dailyDoses += 1;
  if (med.afternoon) dailyDoses += 1;
  if (med.night) dailyDoses += 1;

  if (dailyDoses === 0 && med.frequency) {
    const parts = String(med.frequency).split('-').map(p => Number(p.trim())).filter(n => !isNaN(n));
    if (parts.length > 0) {
      dailyDoses = parts.reduce((sum, n) => sum + n, 0);
    }
  }

  let days = 1;
  if (med.duration) {
    const match = String(med.duration).match(/\d+/);
    if (match) days = Number(match[0]);
  }

  const calculated = dailyDoses * days;
  return calculated > 0 ? calculated : 1;
};

// @desc    Get patients eligible for billing (patients with billable services)
// @route   GET /api/billing/eligible-patients
// @access  Private
const getEligiblePatients = async (req, res) => {
  try {
    const { search, module, page = 1, limit = 20 } = req.query;
    
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

    let allPatients = [];

    if (module === 'SameDayCare') {
      // Direct lookup of patients with completed Same Day Care treatments for ultra-fast load
      const sdtRecords = await SameDayTreatment.find(tenantFilter(req, { status: 'Completed' }), 'patientId').lean();
      const sdtPatientIds = [...new Set(sdtRecords.map(r => r.patientId?.toString()).filter(Boolean))];
      if (sdtPatientIds.length === 0) {
        if (req.query.page || req.query.limit) {
          return res.json({ patients: [], page: 1, pageSize: parseInt(limit) || 20, totalRecords: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
        }
        return res.json([]);
      }
      patientFilter = {
        ...patientFilter,
        _id: { $in: sdtPatientIds }
      };
      allPatients = await Patient.find(patientFilter).sort({ createdAt: -1 }).lean();
    } else {
      allPatients = await Patient.find(patientFilter).sort({ createdAt: -1 }).lean();
    }

    // Parallelize checking of billable items for all patients concurrently
    const results = await Promise.all(
      allPatients.map(async (patient) => {
        const hasBillableItems = await checkBillableItems(patient._id);
        if (!hasBillableItems.hasItems) return null;

        const advances = await AdvancePayment.find({ patientId: patient._id, isAdjusted: false }).lean();
        const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);
        const adjustedPendingAmount = Math.max(0, hasBillableItems.totalPendingAmount - totalAdvance);

        const age = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
        return {
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
        };
      })
    );

    const eligiblePatients = results.filter(Boolean);

    if (req.query.page || req.query.limit) {
      const currentPage = Math.max(1, parseInt(page) || 1);
      const limitVal = Math.max(1, parseInt(limit) || 20);
      const totalRecords = eligiblePatients.length;
      const totalPages = Math.ceil(totalRecords / limitVal) || 1;
      const paginated = eligiblePatients.slice((currentPage - 1) * limitVal, currentPage * limitVal);

      return res.json({
        patients: paginated,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
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

  // Fetch all pharmacy bills for the patient
  const pharmacyBills = await PharmacyBill.find({ patientId });

  // Build a map of paid medicine quantities
  const paidMedicinesQty = {}; // medicineName.toLowerCase() -> quantity
  pharmacyBills.forEach(pBill => {
    if (pBill.paymentStatus === 'Paid' && pBill.status !== 'Cancelled') {
      pBill.items.forEach(pItem => {
        const nameKey = pItem.itemName.toLowerCase().trim();
        const qty = pItem.quantity - pItem.returnedQty;
        if (qty > 0) {
          paidMedicinesQty[nameKey] = (paidMedicinesQty[nameKey] || 0) + qty;
        }
      });
    }
  });

  // Check OPD Visits (Registrations)
  const visits = await Visit.find({ patientId, visitType: 'OPD' }).populate('doctorId', 'opdFees');
  const pendingVisits = visits.filter(v => !billedSourceIds.has(v._id.toString()));
  if (pendingVisits.length > 0) {
    categories.push('OPD');
    totalPendingAmount += pendingVisits.reduce((sum, v) => sum + (v.doctorId?.opdFees || 0), 0);
  }

  // Check Same Day Treatments (Completed)
  const treatments = await SameDayTreatment.find({ patientId, status: 'Completed' });
  const pendingTreatments = treatments.filter(t => !billedSourceIds.has(t._id.toString()));
  if (pendingTreatments.length > 0) {
    categories.push('SameDayTreatment');
    totalPendingAmount += pendingTreatments.reduce((sum, t) => sum + (t.price || 0), 0);
  }

  // Register categories for medicines & consumables in completed Same Day Treatments
  treatments.forEach(t => {
    if (t.prescriptionMedicines && t.prescriptionMedicines.length > 0) {
      t.prescriptionMedicines.forEach(m => {
        const cat = m.itemType === 'Consumable' ? 'Consumable' : 'Medicine';
        if (!categories.includes(cat)) categories.push(cat);
      });
    }
  });

  // Check SDT Items
  const sdtItems = await SdtItem.find({ patientId }).populate('treatmentId', 'status');
  const completedSdtItems = sdtItems.filter(item => item.treatmentId?.status === 'Completed' && !billedSourceIds.has(item._id.toString()));
  if (completedSdtItems.length > 0) {
    if (!categories.includes('SameDayTreatment')) categories.push('SameDayTreatment');
    completedSdtItems.forEach(item => {
      if (item.itemType === 'Medicine' && !categories.includes('Medicine')) {
        categories.push('Medicine');
      }
      if (item.itemType === 'Consumable' && !categories.includes('Consumable')) {
        categories.push('Consumable');
      }
    });
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
      if (admission.bedHistory && admission.bedHistory.length > 0) {
        admission.bedHistory.forEach(hist => {
          const startDate = new Date(hist.startDate);
          const endDate = hist.endDate ? new Date(hist.endDate) : new Date();
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
          const charge = (hist.pricePerDay || 0) * days;
          if (!categories.includes('BedCharge')) categories.push('BedCharge');
          totalPendingAmount += charge;
        });
      } else {
        const bed = await Bed.findById(admission.bedId);
        if (bed?.pricePerDay) {
          const daysAdmitted = Math.ceil((new Date(admission.dischargeDate || new Date()) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)) || 1;
          const roomCharge = bed.pricePerDay * daysAdmitted;
          if (!categories.includes('BedCharge')) categories.push('BedCharge');
          totalPendingAmount += roomCharge;
        }
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
        let hasUnpaidMeds = false;
        pendingMedicines.forEach(m => {
          const nameKey = m.medicineName.toLowerCase().trim();
          let unpaidQty = m.quantity;
          if (paidMedicinesQty[nameKey] && paidMedicinesQty[nameKey] > 0) {
            if (paidMedicinesQty[nameKey] >= m.quantity) {
              paidMedicinesQty[nameKey] -= m.quantity;
              unpaidQty = 0;
            } else {
              unpaidQty = m.quantity - paidMedicinesQty[nameKey];
              paidMedicinesQty[nameKey] = 0;
            }
          }
          if (unpaidQty > 0) {
            hasUnpaidMeds = true;
            totalPendingAmount += (m.unitPrice || 0) * unpaidQty;
          }
        });
        if (hasUnpaidMeds && !categories.includes('Medicine')) {
          categories.push('Medicine');
        }
      }
    }
  }

  // Check Pharmacy Bills (consistently with generateBillItems)
  const pendingPharmacyBills = pharmacyBills.filter(pb => pb.paymentStatus !== 'Paid' && pb.status !== 'Cancelled' && !billedSourceIds.has(pb._id.toString()));
  const billedPharmacyMedNames = new Set(); // track medicine names already in a pharmacy bill
  if (pendingPharmacyBills.length > 0) {
    if (!categories.includes('Medicine')) categories.push('Medicine');
    pendingPharmacyBills.forEach(pBill => {
      pBill.items.forEach(pItem => {
        const remainingQty = pItem.quantity - (pItem.returnedQty || 0);
        if (remainingQty > 0) {
          billedPharmacyMedNames.add(pItem.itemName.trim().toLowerCase());
          totalPendingAmount += pItem.amount || (pItem.unitPrice * remainingQty) || 0;
        }
      });
    });
  }

  // Check Prescriptions (medicines prescribed but no invoice or pharmacy bill created yet)
  const billedRxInvoices = await Billing.find({
    patientId,
    status: { $ne: 'Cancelled' },
    'items.sourceModel': 'Prescription'
  });
  const billedRxIds = new Set();
  billedRxInvoices.forEach(b => {
    b.items.forEach(i => {
      if (i.sourceModel === 'Prescription' && i.sourceId) {
        billedRxIds.add(i.sourceId.toString());
      }
    });
  });
  const pharmacyBillsWithRx = await PharmacyBill.find({
    patientId,
    status: { $ne: 'Cancelled' },
    prescriptionId: { $ne: null }
  });
  pharmacyBillsWithRx.forEach(pb => {
    if (pb.prescriptionId) billedRxIds.add(pb.prescriptionId.toString());
  });

  const prescriptions = await Prescription.find({ patientId });
  prescriptions.forEach(rx => {
    if (!rx.medicines || rx.medicines.length === 0) return;
    if (billedSourceIds.has(rx._id.toString()) || billedRxIds.has(rx._id.toString())) return;
    const hasUnbilledMeds = rx.medicines.some(med => {
      const medName = (med.medicine || '').trim().toLowerCase();
      return medName && !billedPharmacyMedNames.has(medName);
    });
    if (hasUnbilledMeds) {
      if (!categories.includes('Medicine')) categories.push('Medicine');
    }
  });

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
const getItemPharmacyDetails = async (hospitalId, itemName, category, fallbackPrice, adminSettings) => {
  try {
    const cleanName = itemName.trim().toLowerCase();

    // 1. Check Pharmacy Inventory first
    const pharmacyItem = await PharmacyInventory.findOne({
      hospitalId,
      itemName: { $regex: new RegExp('^' + cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
    }).select('mrp mrpExGst rateExGst cgst sgst unitsPerPack').sort({ createdAt: -1 }).lean();

    if (pharmacyItem) {
      const cgst = pharmacyItem.cgst || 0;
      const sgst = pharmacyItem.sgst || 0;
      const totalGstPercent = cgst + sgst;
      const mrpIncGst = pharmacyItem.mrp || 0;
      let mrpExGst = pharmacyItem.mrpExGst || pharmacyItem.rateExGst || 0;
      if (!mrpExGst && mrpIncGst > 0) {
        mrpExGst = totalGstPercent > 0 ? Number((mrpIncGst / (1 + totalGstPercent / 100)).toFixed(2)) : mrpIncGst;
      }
      return {
        price: mrpIncGst,
        mrpIncGst,
        mrpExGst: mrpExGst || mrpIncGst,
        cgst,
        sgst,
        totalGstPercent,
        unitsPerPack: pharmacyItem.unitsPerPack > 0 ? pharmacyItem.unitsPerPack : 1
      };
    }

    // 2. Check Admin Settings (IpdAdminSettings)
    if (adminSettings) {
      if (category === 'Consumable' && adminSettings.consumableServices) {
        const consumable = adminSettings.consumableServices.find(
          c => c.name.trim().toLowerCase() === cleanName
        );
        if (consumable) return { price: consumable.price || 0, mrpIncGst: consumable.price || 0, mrpExGst: consumable.price || 0, cgst: 0, sgst: 0, totalGstPercent: 0, unitsPerPack: 1 };
      }
      if (category === 'Medicine' && adminSettings.medicines) {
        const medicine = adminSettings.medicines.find(
          m => m.name.trim().toLowerCase() === cleanName
        );
        if (medicine) return { price: medicine.price || 0, mrpIncGst: medicine.price || 0, mrpExGst: medicine.price || 0, cgst: 0, sgst: 0, totalGstPercent: 0, unitsPerPack: 1 };
      }
    }

    return { price: fallbackPrice || 0, mrpIncGst: fallbackPrice || 0, mrpExGst: fallbackPrice || 0, cgst: 0, sgst: 0, totalGstPercent: 0, unitsPerPack: 1 };
  } catch (error) {
    console.error('Error fetching pharmacy details for item:', itemName, error);
    return { price: fallbackPrice || 0, mrpIncGst: fallbackPrice || 0, mrpExGst: fallbackPrice || 0, cgst: 0, sgst: 0, totalGstPercent: 0, unitsPerPack: 1 };
  }
};

const getItemLatestPrice = async (hospitalId, itemName, category, fallbackPrice, adminSettings) => {
  const details = await getItemPharmacyDetails(hospitalId, itemName, category, fallbackPrice, adminSettings);
  return details.price;
};

const generateBillItems = async (req, res) => {
  try {
    const { uhid } = req.params;
    const { billType } = req.query; // OPD, SameDayTreatment, Lab, IPD, All

    const patient = await getPatientByUhid(req, uhid);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Fetch hospital configurations
    const settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    const adminSettings = await IpdAdminSettings.findOne({ hospitalId: req.user.hospitalId });
    const gstEnabled = settings ? settings.gstEnabled : true;
    const gstPercentage = settings ? settings.gstPercentage : 18;
    const discountEnabled = settings ? settings.discountEnabled : true;
    const discountReasons = settings ? settings.discountReasons : [];

    // Find all finalized items to avoid duplicate billing (Final bills only for OPD/IPD/Lab)
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

    // For prescriptions specifically: exclude from any non-cancelled bill (Draft or Final)
    // This ensures once a prescription's medicines are invoiced they don't appear again
    const prescriptionBills = await Billing.find(tenantFilter(req, {
      patientId: patient._id,
      status: { $ne: 'Cancelled' },
      'items.sourceModel': 'Prescription'
    }));
    const billedPrescriptionIds = new Set(); // prescription _id already in any active bill
    const billedPrescriptionMedKeys = new Set(); // "prescriptionId_medicineName" keys already billed
    prescriptionBills.forEach(b => {
      if (b.items) {
        b.items.forEach(item => {
          if (item.sourceModel === 'Prescription' && item.sourceId) {
            billedPrescriptionIds.add(item.sourceId.toString());
            // Also track per medicine name from description (format: "MedName — Rx by Dr. X...")
            const medName = (item.description || '').split(' \u2014')[0].trim().toLowerCase();
            if (medName) {
              billedPrescriptionMedKeys.add(`${item.sourceId}_${medName}`);
            }
          }
        });
      }
    });

    const pharmacyBillsForRx = await PharmacyBill.find(tenantFilter(req, {
      patientId: patient._id,
      status: { $ne: 'Cancelled' },
      prescriptionId: { $ne: null }
    }));
    pharmacyBillsForRx.forEach(pb => {
      if (pb.prescriptionId) {
        billedPrescriptionIds.add(pb.prescriptionId.toString());
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
    if (!billType || billType === 'All' || billType === 'OPD' || billType === 'SameDayTreatment') {
      const visits = await Visit.find(tenantFilter(req, { patientId: patient._id, visitType: 'OPD' }))
        .populate('doctorId', 'doctorName opdFees')
        .sort({ createdAt: -1 });

      visits.forEach(v => {
        if (billedSourceIds.has(v._id.toString())) return;

        // Add OPD Consultation Fee
        const fee = v.doctorId?.opdFees || 0;
        if (fee > 0) {
          items.push({
            category: 'OPD',
            date: fmtDate(v.createdAt),
            description: `OPD Consultation - Dr. ${v.doctorId?.doctorName || 'Doctor'} (${v.registrationNumber})`,
            price: fee,
            quantity: 1,
            total: fee,
            sourceId: v._id,
            sourceModel: 'Visit'
          });
        }
      });
    }

    // 2. Same Day Treatment (SDT)
    const includeSdtItems = !billType || billType === 'All' || billType === 'SameDayTreatment' || billType === 'Lab' || billType === 'Pharmacy';
    if (includeSdtItems) {
      const sdtTreatments = await SameDayTreatment.find(tenantFilter(req, { patientId: patient._id, status: 'Completed' })).sort({ createdAt: -1 });
      const pushedSdtMedKeys = new Set();

      for (const t of sdtTreatments) {
        // Base treatment charge (if billType is All or SameDayTreatment)
        if (!billType || billType === 'All' || billType === 'SameDayTreatment') {
          if (!billedSourceIds.has(t._id.toString())) {
            const price = t.price || 0;
            if (price > 0) {
              items.push({
                category: 'SameDayTreatment',
                date: fmtDate(t.treatmentDate),
                description: `${t.treatmentType || 'Same Day Care'} Treatment`,
                price: price,
                quantity: 1,
                total: price,
                sourceId: t._id,
                sourceModel: 'SameDayTreatment'
              });
            }
          }
        }

        // Prescription medicines / consumables from SameDayTreatment prescriptionMedicines array
        if (t.prescriptionMedicines && t.prescriptionMedicines.length > 0) {
          for (let idx = 0; idx < t.prescriptionMedicines.length; idx++) {
            const med = t.prescriptionMedicines[idx];
            const medName = (med.medicineName || '').trim();
            if (!medName) continue;

            const itemCategory = med.itemType === 'Consumable' ? 'Consumable' : 'Medicine';

            if (billType === 'Pharmacy' && itemCategory !== 'Medicine') continue;
            if (billType === 'Lab') continue;

            const dedupKey = `sdt_${t._id}_${medName.toLowerCase()}`;
            if (pushedSdtMedKeys.has(dedupKey)) continue;
            pushedSdtMedKeys.add(dedupKey);

            const itemSourceId = med._id ? med._id.toString() : `${t._id}_med_${idx}`;
            if (billedSourceIds.has(itemSourceId)) continue;

            const unitQty = calculateMedicineQty(med);
            const { price, mrpIncGst, mrpExGst, cgst, sgst, totalGstPercent, unitsPerPack } = await getItemPharmacyDetails(req.user.hospitalId, medName, itemCategory, 0, adminSettings);
            const packQty = (unitsPerPack > 1 && itemCategory === 'Medicine') ? Number((unitQty / unitsPerPack).toFixed(3)) : unitQty;
            const lineTotal = Number((price * packQty).toFixed(2));

            items.push({
              category: itemCategory,
              date: fmtDate(t.treatmentDate || t.createdAt),
              description: `${medName}${med.dosageForm ? ` (${med.dosageForm})` : ''}${med.duration ? ` - ${med.duration}` : ''}`,
              price,
              mrpIncGst: mrpIncGst || price,
              mrpExGst: mrpExGst || price,
              cgst: cgst || 0,
              sgst: sgst || 0,
              gstPercentage: totalGstPercent || 0,
              quantity: packQty,
              total: lineTotal,
              sourceId: itemSourceId,
              sourceModel: 'SameDayTreatmentMedicine'
            });
          }
        }
      }

      // Also check standalone SdtItem documents if any
      const treatmentItems = await SdtItem.find({ patientId: patient._id }).populate('treatmentId', 'status').sort({ createdAt: -1 });
      for (const item of treatmentItems) {
        if (billedSourceIds.has(item._id.toString())) continue;
        const itemStatus = item.treatmentId?.status;
        if (itemStatus && itemStatus !== 'Completed') continue;
        if (billType === 'Lab' && item.itemType !== 'Lab Test') continue;
        if (billType === 'Pharmacy' && item.itemType !== 'Medicine') continue;

        const category = item.itemType === 'Lab Test' ? 'Lab' : item.itemType;
        const dedupKey = `sdt_${item.treatmentId?._id || item.treatmentId}_${(item.name || '').toLowerCase()}`;
        if (pushedSdtMedKeys.has(dedupKey)) continue;
        pushedSdtMedKeys.add(dedupKey);

        const { price, mrpIncGst, mrpExGst, cgst, sgst, totalGstPercent, unitsPerPack } = await getItemPharmacyDetails(req.user.hospitalId, item.name, category, item.price || 0, adminSettings);
        const unitQty = item.quantity || 1;
        const packQty = (unitsPerPack > 1 && category === 'Medicine') ? Number((unitQty / unitsPerPack).toFixed(3)) : unitQty;
        const lineTotal = Number((mrpIncGst * packQty).toFixed(2));

        items.push({
          category,
          date: item.date || fmtDate(item.createdAt),
          description: `${item.name} (${item.itemType})`,
          price: mrpIncGst,
          mrpIncGst: mrpIncGst || price,
          mrpExGst: mrpExGst || price,
          cgst: cgst || 0,
          sgst: sgst || 0,
          gstPercentage: totalGstPercent || 0,
          quantity: packQty,
          total: lineTotal,
          sourceId: item._id,
          sourceModel: 'SdtItem'
        });
      }
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
        .populate('bedHistory.roomId', 'roomType')
        .populate('bedHistory.bedId', 'bedNumber pricePerDay bedType')
        .sort({ createdAt: -1 });

      const pharmacyBillsAll = await PharmacyBill.find(tenantFilter(req, { patientId: patient._id }));
      const paidMedicinesQty = {}; // medicineName.toLowerCase() -> { quantity: number, paymentTimes: Date[] }
      pharmacyBillsAll.forEach(pBill => {
        if (pBill.paymentStatus === 'Paid' && pBill.status !== 'Cancelled') {
          pBill.items.forEach(pItem => {
            const nameKey = pItem.itemName.toLowerCase().trim();
            const qty = pItem.quantity - pItem.returnedQty;
            if (qty > 0) {
              if (!paidMedicinesQty[nameKey]) {
                paidMedicinesQty[nameKey] = {
                  quantity: 0,
                  paymentTimes: []
                };
              }
              paidMedicinesQty[nameKey].quantity += qty;
              paidMedicinesQty[nameKey].paymentTimes.push(pBill.updatedAt || pBill.createdAt);
            }
          });
        }
      });

      for (const admission of admissions) {
        if (billedSourceIds.has(admission._id.toString())) continue;
        
        // Bed charges
        if (admission.bedHistory && admission.bedHistory.length > 0) {
          admission.bedHistory.forEach((hist) => {
            if (!hist.bedId) return;
            const startDate = new Date(hist.startDate);
            const endDate = hist.endDate ? new Date(hist.endDate) : new Date();
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
            const charge = (hist.pricePerDay || 0) * days;
            items.push({
              category: 'BedCharge',
              date: fmtDate(startDate),
              description: `Bed Assignment: ${hist.roomId?.roomType || 'N/A'} (Bed: ${hist.bedId?.bedNumber || 'N/A'}) - ${days} day(s) @ ₹${hist.pricePerDay || 0}/day`,
              price: hist.pricePerDay || 0,
              quantity: days,
              total: charge,
              sourceId: admission._id,
              sourceModel: 'IpdAdmission'
            });
          });
        } else if (admission.bedId?.pricePerDay) {
          const daysAdmitted = Math.ceil((new Date(admission.dischargeDate || new Date()) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)) || 1;
          const roomCharge = admission.bedId.pricePerDay * daysAdmitted;
          items.push({
            category: 'BedCharge',
            date: fmtDate(admission.admissionDate),
            description: `Bed Assignment: ${admission.roomId?.roomType || 'N/A'} (Bed: ${admission.bedId?.bedNumber || 'N/A'}) - ${daysAdmitted} day(s) @ ₹${admission.bedId.pricePerDay}/day`,
            price: admission.bedId.pricePerDay,
            quantity: daysAdmitted,
            total: roomCharge,
            sourceId: admission._id,
            sourceModel: 'IpdAdmission'
          });
        }

        // IPD Consumables
        const consumables = await IpdConsumable.find({ admissionId: admission._id });
        for (const c of consumables) {
          if (billedSourceIds.has(c._id.toString())) continue;
          const { price, unitsPerPack } = await getItemPharmacyDetails(req.user.hospitalId, c.serviceName, 'Consumable', c.price, adminSettings);
          const unitQty = c.quantity || 1;
          const packQty = unitsPerPack > 1 ? Number((unitQty / unitsPerPack).toFixed(3)) : unitQty;
          const lineTotal = Number((price * packQty).toFixed(2));
          items.push({
            category: 'Consumable',
            date: c.date || fmtDate(c.createdAt),
            description: `${c.serviceName}${c.gst ? ` (GST: ${c.gst}%)` : ''}`,
            price,
            quantity: packQty,
            total: lineTotal,
            sourceId: c._id,
            sourceModel: 'IpdConsumable'
          });
        }

        // IPD Medicines
        const medicines = await IpdMedicine.find({ admissionId: admission._id });
        for (const m of medicines) {
          if (billedSourceIds.has(m._id.toString())) continue;
          const nameKey = m.medicineName.toLowerCase().trim();
          const { price, unitsPerPack } = await getItemPharmacyDetails(req.user.hospitalId, m.medicineName, 'Medicine', m.unitPrice, adminSettings);
          
          let isPaid = false;
          let paidTimeStr = '';
          
          if (paidMedicinesQty[nameKey] && paidMedicinesQty[nameKey].quantity > 0) {
            const mQty = m.quantity;
            const paidQty = paidMedicinesQty[nameKey].quantity;
            
            if (paidQty >= mQty) {
              isPaid = true;
              paidMedicinesQty[nameKey].quantity -= mQty;
            } else {
              isPaid = true;
              paidMedicinesQty[nameKey].quantity = 0;
              m.quantity = mQty - paidQty;
            }
            
            const pTime = paidMedicinesQty[nameKey].paymentTimes[0] || new Date();
            paidTimeStr = new Date(pTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          }

          const unitQty = m.quantity || 1;
          const packQty = unitsPerPack > 1 ? Number((unitQty / unitsPerPack).toFixed(3)) : unitQty;
          const lineTotal = Number((price * packQty).toFixed(2));

          if (isPaid && m.quantity === 0) {
            items.push({
              category: 'Medicine',
              date: m.date || fmtDate(m.createdAt),
              description: `${m.medicineName} (Paid at Pharmacy on ${paidTimeStr})`,
              price: 0,
              quantity: packQty,
              total: 0,
              sourceId: m._id,
              sourceModel: 'IpdMedicine'
            });
          } else if (isPaid && m.quantity > 0) {
            items.push({
              category: 'Medicine',
              date: m.date || fmtDate(m.createdAt),
              description: `${m.medicineName} (${m.quantity} unpaid, others paid at Pharmacy on ${paidTimeStr})`,
              price,
              quantity: packQty,
              total: lineTotal,
              sourceId: m._id,
              sourceModel: 'IpdMedicine'
            });
          } else {
            items.push({
              category: 'Medicine',
              date: m.date || fmtDate(m.createdAt),
              description: m.medicineName,
              price,
              quantity: packQty,
              total: lineTotal,
              sourceId: m._id,
              sourceModel: 'IpdMedicine'
            });
          }
        }
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

    // 6. Pharmacy Charges
    // Shows: (a) prescription medicines with live pharmacy inventory price (mirrors pharmacy module logic)
    //        (b) any existing unpaid pharmacy bills for medicines not yet dispensed
    // Deduplication: tracks medicine names already covered by a pharmacy bill to avoid double billing
    if (!billType || billType === 'All' || billType === 'Pharmacy') {

      // ---- 6a. Unpaid / Partially-paid Pharmacy Bills ----
      // Track medicine names that already have a pharmacy bill so we don't double-bill from prescriptions
      const billedMedicineNames = new Set(); // lowercase medicine names already covered by a pharmacy bill

      const pharmacyBills = await PharmacyBill.find(tenantFilter(req, {
        patientId: patient._id,
        paymentStatus: { $ne: 'Paid' },
        status: { $ne: 'Cancelled' }
      })).sort({ createdAt: -1 });

      for (const pBill of pharmacyBills) {
        if (billedSourceIds.has(pBill._id.toString())) continue;

        for (const pItem of pBill.items) {
          const remainingQty = (pItem.quantity || 0) - (pItem.returnedQty || 0);
          if (remainingQty <= 0) continue;

          billedMedicineNames.add(pItem.itemName.trim().toLowerCase());

          let itemCategory = 'Medicine';
          if (adminSettings?.consumableServices) {
            const isConsumable = adminSettings.consumableServices.some(
              c => c.name.trim().toLowerCase() === pItem.itemName.trim().toLowerCase()
            );
            if (isConsumable) itemCategory = 'Consumable';
          }

          const unitPrice = pItem.unitPrice || 0;
          const itemDiscount = pItem.discount || 0;
          const effectivePrice = unitPrice * (1 - itemDiscount / 100);
          const lineTotal = parseFloat((effectivePrice * remainingQty).toFixed(2));

          items.push({
            category: itemCategory,
            date: fmtDate(pBill.billDate || pBill.createdAt),
            description: pBill.paymentStatus === 'Partially Paid'
              ? `Pharmacy Bill ${pBill.billNumber}: ${pItem.itemName} (Partially Paid)`
              : `Pharmacy Bill ${pBill.billNumber}: ${pItem.itemName}`,
            price: effectivePrice,
            quantity: remainingQty,
            total: lineTotal,
            sourceId: pBill._id,
            sourceModel: 'PharmacyBill'
          });
        }
      }

      // ---- 6b. Prescription Medicines (not yet invoiced) ----
      // Mirrors pharmacy billing module logic: show prescribed medicines with live inventory prices.
      // Uses billedPrescriptionMedKeys (per-medicine granularity) so individual medicines that were
      // already billed are excluded, while unbilled medicines from the same prescription still show.
      const prescriptions = await Prescription.find(tenantFilter(req, { patientId: patient._id }))
        .populate('doctorId', 'doctorName')
        .sort({ createdAt: -1 });

      // Dedup: track (prescriptionId_medicineName) pairs already pushed in this response
      const pushedPrescriptionMeds = new Set();

      for (const prescription of prescriptions) {
        if (!prescription.medicines || prescription.medicines.length === 0) continue;

        // If this prescription was billed and we have per-medicine keys, use those (granular).
        // If billed but NO per-medicine keys (e.g. older bills), skip the whole prescription.
        const prescIdStr = prescription._id.toString();
        // If an invoice/bill is generated for this prescription, skip it completely
        if (billedPrescriptionIds.has(prescIdStr)) continue;

        for (const med of prescription.medicines) {
          const medName = (med.medicine || '').trim();
          if (!medName) continue;

          const dedupKey = `${prescIdStr}_${medName.toLowerCase()}`;

          // Skip if already pushed in this request (prevents duplicates across multiple prescriptions)
          if (pushedPrescriptionMeds.has(dedupKey)) continue;
          pushedPrescriptionMeds.add(dedupKey);

          // Skip if this specific medicine is already in any active (non-cancelled) bill
          if (billedPrescriptionMedKeys.has(dedupKey)) continue;

          // Skip if a pharmacy bill already covers this medicine
          if (billedMedicineNames.has(medName.toLowerCase())) continue;

          const unitQty = calculateMedicineQty(med);
          const { price, mrpIncGst, mrpExGst, cgst, sgst, totalGstPercent, unitsPerPack } = await getItemPharmacyDetails(req.user.hospitalId, medName, 'Medicine', 0, adminSettings);
          const packQty = unitsPerPack > 1 ? Number((unitQty / unitsPerPack).toFixed(3)) : unitQty;
          const lineTotal = Number((price * packQty).toFixed(2));

          const doctorLabel = prescription.doctorId?.doctorName || 'Doctor';
          const dateLabel = fmtDate(prescription.prescriptionDateTime || prescription.createdAt);

          items.push({
            category: 'Medicine',
            date: dateLabel,
            description: `${medName} \u2014 Rx by Dr. ${doctorLabel}${med.strength ? ` (${med.strength})` : ''}${med.duration ? `, ${med.duration}` : ''}`,
            price,
            mrpIncGst: mrpIncGst || price,
            mrpExGst: mrpExGst || price,
            cgst: cgst || 0,
            sgst: sgst || 0,
            gstPercentage: totalGstPercent || 0,
            quantity: packQty,
            total: lineTotal,
            sourceId: prescription._id,
            sourceModel: 'Prescription'
          });
        }
      }
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
        sdtPricingInBilling: settings ? settings.sdtPricingInBilling : true,
        accessDiscount: settings ? settings.accessDiscount : false
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
    
    let computedSubtotal = 0;
    let computedGstAmount = 0;
    
    activeItems.forEach(i => {
      const baseAmount = (parseFloat(i.price) - parseFloat(i.discountAmount || 0)) * parseInt(i.quantity || 1);
      const gstAmt = baseAmount * (parseFloat(i.gstPercentage || 0) / 100);
      i.gstAmount = Number(gstAmt.toFixed(2));
      i.total = Number((baseAmount + gstAmt).toFixed(2));
      
      computedSubtotal += baseAmount;
      computedGstAmount += gstAmt;
    });

    const finalGstPercentage = parseFloat(gstPercentage || 0);
    const percentDiscountAmt = computedSubtotal * (parseFloat(discountPercentage || 0) / 100);
    const discountedSubtotal = Math.max(0, computedSubtotal - percentDiscountAmt);
    const invoiceGstAmt = discountedSubtotal * (finalGstPercentage / 100);
    
    const gstAmt = computedGstAmount + invoiceGstAmt;
    const grandTotal = discountedSubtotal + gstAmt;
    const itemDiscountTotal = activeItems.reduce((sum, i) => sum + ((parseFloat(i.discountAmount || 0)) * parseInt(i.quantity || 1)), 0);
    const discountAmt = itemDiscountTotal + percentDiscountAmt;

    const subtotal = computedSubtotal;

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

    let computedSubtotal = 0;
    let computedGstAmount = 0;
    
    bill.items.forEach(i => {
      const baseAmount = (parseFloat(i.price) - parseFloat(i.discountAmount || 0)) * parseInt(i.quantity || 1);
      const gstAmt = baseAmount * (parseFloat(i.gstPercentage || 0) / 100);
      i.gstAmount = Number(gstAmt.toFixed(2));
      i.total = Number((baseAmount + gstAmt).toFixed(2));
      
      computedSubtotal += baseAmount;
      computedGstAmount += gstAmt;
    });

    bill.subtotal = computedSubtotal;
    let finalGstPercentage = parseFloat(bill.gstPercentage || 0);
    bill.gstPercentage = finalGstPercentage;

    const itemDiscountTotal = bill.items.reduce((sum, i) => sum + ((parseFloat(i.discountAmount || 0)) * parseInt(i.quantity || 1)), 0);
    const percentDiscountAmt = computedSubtotal * (bill.discountPercentage / 100);
    bill.discountAmount = itemDiscountTotal + percentDiscountAmt;
    const discountedSubtotal = Math.max(0, computedSubtotal - percentDiscountAmt);
    const invoiceGstAmt = discountedSubtotal * (finalGstPercentage / 100);
    
    bill.gstAmount = computedGstAmount + invoiceGstAmt;
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
    const { billType, status, fromDate, toDate, searchQuery, invoiceNo, paymentMode, page = 1, limit = 20 } = req.query;
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

    if (req.query.page || req.query.limit) {
      const currentPage = Math.max(1, parseInt(page) || 1);
      const limitVal = Math.max(1, parseInt(limit) || 20);
      const totalRecords = bills.length;
      const totalPages = Math.ceil(totalRecords / limitVal) || 1;
      const paginated = bills.slice((currentPage - 1) * limitVal, currentPage * limitVal);

      return res.json({
        bills: paginated,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }

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