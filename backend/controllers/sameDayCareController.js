const SameDayTreatment = require('../models/SameDayTreatment');
const SdtItem = require('../models/SdtItem');
const IpdAdminSettings = require('../models/IpdAdminSettings');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const IpdAdmission = require('../models/IpdAdmission');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Create or save care record
// @route   POST /api/same-day-care/treatment
// @access  Private
const createTreatment = async (req, res) => {
  try {
    const {
      patientId, patientName, uhid, mobile, gender, age,
      treatmentType, treatmentDate, diagnosis, treatmentNotes,
      prescription, followUpRequired, followUpDate,
      price, isFixedPrice, status,
      source, referredByDoctorName,
      chiefComplaint, presentIllness, clinicalFindings,
      medicalHistory, surgicalHistory, drugAllergies,
      vitals, selectedInvestigations, attachments,
      treatmentPlan, procedure, productsMedicinesUsed,
      procedureNotes, anaesthesiaUsed, anaesthesiaType,
      complications, prescriptionMedicines,
      reviewNotes, nextProcedurePlanned,
      referredByDoctorRemarks, assignedStaffId, assignedStaffName,
      printNotes, printAdvice
    } = req.body;

    if (!patientId || !treatmentType) {
      return res.status(400).json({ message: 'Patient ID and care type are required' });
    }

    // Get default price from settings if not provided
    let finalPrice = price || 0;
    let finalIsFixedPrice = isFixedPrice !== undefined ? isFixedPrice : true;

    if (!price) {
      const settings = await IpdAdminSettings.findOne(tenantFilter(req));
      let foundPrice = null;

      if (settings?.sameDayCareCategories) {
        for (const cat of settings.sameDayCareCategories) {
          const sub = cat.subServices.find(s => s.name.toLowerCase() === treatmentType.toLowerCase());
          if (sub) {
            foundPrice = sub.price;
            break;
          }
        }
      }

      if (foundPrice === null && settings?.sameDayTreatmentPrices) {
        const service = settings.sameDayTreatmentPrices.find(s => s.name.toLowerCase() === treatmentType.toLowerCase());
        if (service) foundPrice = service.price;
      }

      if (foundPrice !== null) {
        finalPrice = foundPrice;
      } else {
        const defaultPrices = {
          'Fracture': 500, 'Minor Injury': 300, 'Minor Stitches': 400,
          'Small Burns': 350, 'Mild Allergic Reactions': 250, 'Dialysis': 2000
        };
        finalPrice = defaultPrices[treatmentType] || 0;
      }
    }

    let finalSource = source || 'Registration';
    let finalReferredBy = referredByDoctorName || '';
    if (req.user && req.user.role === 'doctor') {
      finalSource = 'Doctor Referral';
      finalReferredBy = req.user.doctorName || req.user.username;
    }

    const record = new SameDayTreatment({
      hospitalId: req.user.hospitalId,
      patientId, patientName, uhid, mobile, gender, age,
      treatmentType,
      treatmentDate: treatmentDate || new Date(),
      diagnosis: diagnosis || '',
      treatmentNotes: treatmentNotes || '',
      prescription: prescription || '',
      followUpRequired: followUpRequired || '',
      followUpDate: followUpDate || null,
      price: finalPrice,
      isFixedPrice: finalIsFixedPrice,
      status: status === 'Completed' ? 'Completed' : 'Draft',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      source: finalSource,
      referredByDoctorName: finalReferredBy,
      referredByDoctorRemarks: referredByDoctorRemarks || '',
      assignedStaffId: assignedStaffId || (req.user && req.user.role === 'doctor' ? req.user._id : null),
      assignedStaffName: assignedStaffName || (req.user && req.user.role === 'doctor' ? (req.user.doctorName || req.user.username) : ''),
      chiefComplaint: chiefComplaint || '',
      presentIllness: presentIllness || '',
      clinicalFindings: clinicalFindings || '',
      medicalHistory: medicalHistory || '',
      surgicalHistory: surgicalHistory || '',
      drugAllergies: drugAllergies || '',
      vitals: vitals || {},
      selectedInvestigations: selectedInvestigations || [],
      attachments: attachments || [],
      treatmentPlan: treatmentPlan || '',
      procedure: procedure || '',
      productsMedicinesUsed: productsMedicinesUsed || '',
      procedureNotes: procedureNotes || '',
      anaesthesiaUsed: anaesthesiaUsed || '',
      anaesthesiaType: anaesthesiaType || '',
      complications: complications || '',
      prescriptionMedicines: prescriptionMedicines || [],
      printNotes: printNotes || [],
      printAdvice: printAdvice || [],
      reviewNotes: reviewNotes || '',
      nextProcedurePlanned: nextProcedurePlanned || '',
      auditTrail: [{
        action: 'Add',
        performedBy: req.user._id,
        performedByName: req.user.doctorName || req.user.username || 'Staff',
        performedByRole: req.user.role || 'Staff',
        timestamp: new Date(),
        remarks: `Record initialized in ${status === 'Completed' ? 'Completed' : 'Draft'} status`,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '',
        changedFields: []
      }]
    });

    await record.save();

    // Sync SdtItem records for completed treatments to make them billable
    if (record.status === 'Completed') {
      await SdtItem.deleteMany({ treatmentId: record._id });
      if (record.prescriptionMedicines && record.prescriptionMedicines.length > 0) {
        for (const item of record.prescriptionMedicines) {
          const sdtItem = new SdtItem({
            hospitalId: record.hospitalId,
            patientId: record.patientId,
            treatmentId: record._id,
            itemType: item.itemType === 'Consumable' ? 'Consumable' : 'Medicine',
            name: item.medicineName,
            price: 0,
            quantity: item.qty || 1,
            totalAmount: 0,
            addedBy: req.user._id,
            date: record.treatmentDate ? new Date(record.treatmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });
          await sdtItem.save();
        }
      }
    }

    res.status(201).json({ message: 'Same day care record saved', record });
  } catch (error) {
    console.error('Create Care Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update care record
// @route   PUT /api/same-day-care/treatment/:id
// @access  Private
const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    const fields = [
      'treatmentType', 'diagnosis', 'treatmentNotes', 'prescription', 'followUpRequired', 'followUpDate',
      'treatmentDate', 'price', 'isFixedPrice', 'status', 'patientName', 'uhid', 'mobile', 'gender', 'age',
      'chiefComplaint', 'presentIllness', 'clinicalFindings', 'medicalHistory', 'surgicalHistory', 'drugAllergies',
      'vitals', 'selectedInvestigations', 'attachments', 'treatmentPlan', 'procedure', 'productsMedicinesUsed',
      'procedureNotes', 'anaesthesiaUsed', 'anaesthesiaType', 'complications', 'prescriptionMedicines',
      'reviewNotes', 'nextProcedurePlanned', 'source', 'referredByDoctorName',
      'printNotes', 'printAdvice'
    ];

    // Compute diffs
    const diffs = [];
    fields.forEach(f => {
      if (updateData[f] === undefined) return;
      let oldVal = record[f];
      let newVal = updateData[f];
      let strOld = '';
      let strNew = '';

      if (f === 'vitals') {
        const oldV = oldVal || {};
        const newV = newVal || {};
        const vitalKeys = ['bloodPressure', 'pulse', 'temperature', 'height', 'weight', 'bmi'];
        vitalKeys.forEach(vk => {
          if (oldV[vk] !== newV[vk]) {
            diffs.push({
              fieldName: `Vitals - ${vk}`,
              oldValue: String(oldV[vk] !== undefined && oldV[vk] !== null ? oldV[vk] : 'N/A'),
              newValue: String(newV[vk] !== undefined && newV[vk] !== null ? newV[vk] : 'N/A')
            });
          }
        });
        return;
      }

      if (f === 'selectedInvestigations' || f === 'printNotes' || f === 'printAdvice') {
        strOld = Array.isArray(oldVal) ? oldVal.join(', ') : '';
        strNew = Array.isArray(newVal) ? newVal.join(', ') : '';
      } else if (f === 'prescriptionMedicines') {
        strOld = Array.isArray(oldVal) ? oldVal.map(m => `${m.medicineName} (${m.dosage})`).join('; ') : '';
        strNew = Array.isArray(newVal) ? newVal.map(m => `${m.medicineName} (${m.dosage})`).join('; ') : '';
      } else if (f === 'attachments') {
        strOld = Array.isArray(oldVal) ? oldVal.map(a => a.name).join(', ') : '';
        strNew = Array.isArray(newVal) ? newVal.map(a => a.name).join(', ') : '';
      } else if (oldVal instanceof Date || (typeof oldVal === 'string' && !isNaN(Date.parse(oldVal)) && f.toLowerCase().includes('date'))) {
        strOld = oldVal ? new Date(oldVal).toISOString().split('T')[0] : '';
        strNew = newVal ? new Date(newVal).toISOString().split('T')[0] : '';
      } else {
        strOld = oldVal !== undefined && oldVal !== null ? String(oldVal) : '';
        strNew = newVal !== undefined && newVal !== null ? String(newVal) : '';
      }

      if (strOld !== strNew) {
        diffs.push({
          fieldName: f,
          oldValue: strOld || 'N/A',
          newValue: strNew || 'N/A'
        });
      }
    });

    // Apply updates
    fields.forEach(f => { if (updateData[f] !== undefined) record[f] = updateData[f]; });

    // Look up default price from settings if treatmentType is newly set and price is 0
    if (updateData.treatmentType && (!record.price || record.price === 0)) {
      try {
        const settings = await IpdAdminSettings.findOne(tenantFilter(req));
        let foundPrice = null;

        if (settings?.sameDayCareCategories) {
          for (const cat of settings.sameDayCareCategories) {
            const sub = cat.subServices.find(s => s.name.toLowerCase() === updateData.treatmentType.toLowerCase());
            if (sub) {
              foundPrice = sub.price;
              break;
            }
          }
        }

        if (foundPrice === null && settings?.sameDayTreatmentPrices) {
          const service = settings.sameDayTreatmentPrices.find(s => s.name.toLowerCase() === updateData.treatmentType.toLowerCase());
          if (service) foundPrice = service.price;
        }

        if (foundPrice !== null) {
          record.price = foundPrice;
        } else {
          const defaultPrices = {
            'Fracture': 500, 'Minor Injury': 300, 'Minor Stitches': 400,
            'Small Burns': 350, 'Mild Allergic Reactions': 250, 'Dialysis': 2000
          };
          record.price = defaultPrices[updateData.treatmentType] || 0;
        }
      } catch (err) {
        console.warn("Failed to update care price from settings", err);
      }
    }

    // Determine action type & remarks
    let actionType = 'Edit';
    let remarks = 'Record edited and updated';

    const statusDiff = diffs.find(d => d.fieldName === 'status');
    if (statusDiff) {
      actionType = 'Status Change';
      remarks = `Status transitioned from ${statusDiff.oldValue} to ${statusDiff.newValue}`;
    }

    if (diffs.length > 0) {
      record.auditTrail.push({
        action: actionType,
        performedBy: req.user._id,
        performedByName: req.user.doctorName || req.user.username || 'Staff',
        performedByRole: req.user.role || 'Staff',
        timestamp: new Date(),
        remarks: remarks,
        changedFields: diffs,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || ''
      });
    }

    record.updatedBy = req.user._id;
    await record.save();

    // Sync SdtItem records for completed treatments to make them billable
    await SdtItem.deleteMany({ treatmentId: record._id });
    if (record.status === 'Completed' && record.prescriptionMedicines && record.prescriptionMedicines.length > 0) {
      for (const item of record.prescriptionMedicines) {
        const sdtItem = new SdtItem({
          hospitalId: record.hospitalId,
          patientId: record.patientId,
          treatmentId: record._id,
          itemType: item.itemType === 'Consumable' ? 'Consumable' : 'Medicine',
          name: item.medicineName,
          price: 0,
          quantity: item.qty || 1,
          totalAmount: 0,
          addedBy: req.user._id,
          date: record.treatmentDate ? new Date(record.treatmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        await sdtItem.save();
      }
    }

    res.json({ message: 'Care record updated', record });
  } catch (error) {
    console.error('Update Care Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get care records for a patient
// @route   GET /api/same-day-care/treatment/patient/:patientId
// @access  Private
const getTreatmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await SameDayTreatment.find(tenantFilter(req, { patientId }))
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get Care Records Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single care record
// @route   GET /api/same-day-care/treatment/:id
// @access  Private
const getTreatmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName');
    if (!record) return res.status(404).json({ message: 'Care record not found' });
    res.json(record);
  } catch (error) {
    console.error('Get Care Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all care records (with filters)
// @route   GET /api/same-day-care/treatment
// @access  Private
const getAllTreatments = async (req, res) => {
  try {
    const { treatmentType, status, fromDate, toDate, followUpRequired, followUpDate } = req.query;
    let query = tenantFilter(req);
    
    if (req.user && req.user.role === 'doctor') {
      query.assignedStaffId = req.user._id;
    }

    if (treatmentType) query.treatmentType = treatmentType;
    if (status) query.status = status;
    if (followUpRequired) query.followUpRequired = followUpRequired;
    if (followUpDate) {
      const dStart = new Date(followUpDate);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(followUpDate);
      dEnd.setHours(23, 59, 59, 999);
      query.followUpDate = { $gte: dStart, $lte: dEnd };
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const records = await SameDayTreatment.find(query)
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get All Care Records Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get care pricing for admin display
// @route   GET /api/same-day-care/treatment/pricing
// @access  Private
const getTreatmentPricing = async (req, res) => {
  try {
    const settings = await IpdAdminSettings.findOne(tenantFilter(req));
    const defaultPrices = {
      'Fracture': 500, 'Minor Injury': 300, 'Minor Stitches': 400,
      'Small Burns': 350, 'Mild Allergic Reactions': 250, 'Dialysis': 2000
    };
    const prices = settings?.sameDayTreatmentPrices || [];
    // Merge defaults with any saved custom prices
    const merged = Object.entries(defaultPrices).map(([name, defaultPrice]) => {
      const saved = prices.find(p => p.name === name);
      return {
        name,
        price: saved ? saved.price : defaultPrice,
        isActive: saved ? saved.isActive : true
      };
    });
    res.json(merged);
  } catch (error) {
    console.error('Get Care Pricing Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to care record
// @route   POST /api/same-day-care/treatment/:id/items
// @access  Private
const addItemToTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemType, itemName, quantity, price } = req.body;

    if (!itemType || !itemName || !quantity || !price) {
      return res.status(400).json({ message: 'itemType, itemName, quantity, and price are required' });
    }

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    const newItem = {
      itemType,
      itemName,
      quantity,
      price,
      createdAt: new Date()
    };

    if (!record.items) record.items = [];
    record.items.push(newItem);
    record.updatedBy = req.user._id;
    await record.save();

    res.status(201).json({ message: 'Item added', record });
  } catch (error) {
    console.error('Add Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from care record
// @route   DELETE /api/same-day-care/treatment/:id/items/:itemId
// @access  Private
const removeItemFromTreatment = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    if (!record.items || !record.items.id(itemId)) {
      return res.status(404).json({ message: 'Item not found' });
    }

    record.items.id(itemId).deleteOne();
    record.updatedBy = req.user._id;
    await record.save();

    res.json({ message: 'Item removed', record });
  } catch (error) {
    console.error('Remove Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get items for a care record
// @route   GET /api/same-day-care/treatment/:id/items
// @access  Private
const getItemsForTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    res.json(record.items || []);
  } catch (error) {
    console.error('Get Items Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDialysisPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = tenantFilter(req);

    // Retrieve patients registered for same-day care or who already have daycare records
    let sdtQuery = tenantFilter(req);
    let visitQuery = {
      $or: [
        { department: { $regex: /^same day care$/i } },
        { visitType: 'Same Day Treatment' }
      ]
    };

    if (req.user && req.user.role === 'doctor') {
      sdtQuery.assignedStaffId = req.user._id;
      visitQuery.doctorId = req.user._id;
    }

    const sdtPatientIds = await SameDayTreatment.find(sdtQuery).distinct('patientId');
    const sdtVisitPatientIds = await Visit.find(tenantFilter(req, visitQuery)).distinct('patientId');

    const allowedPatientIds = [...new Set([
      ...sdtPatientIds.map(id => id.toString()),
      ...sdtVisitPatientIds.map(id => id.toString())
    ])];

    query._id = { $in: allowedPatientIds };

    if (search) {
      query.$and = [
        { _id: { $in: allowedPatientIds } },
        {
          $or: [
            { patientName: { $regex: search, $options: 'i' } },
            { uhid: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete query._id;
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error('Get Dialysis Patients Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get detailed patient info with active admission and latest SDT visit
// @route   GET /api/same-day-care/dialysis/patient/:id
// @access  Private
const getDialysisPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findOne(tenantFilter(req, { _id: id }));
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Find active IPD admission if any
    const activeIpd = await IpdAdmission.findOne(tenantFilter(req, { patientId: id, status: 'Admitted' }));
    
    // Find latest Same Day Treatment visit if any
    const latestSdtVisit = await Visit.findOne(tenantFilter(req, { patientId: id, visitType: 'Same Day Treatment' }))
      .sort({ createdAt: -1 });

    const details = {
      ...patient.toObject(),
      ipdNumber: activeIpd?.ipdNumber || '',
      registrationNumber: latestSdtVisit?.registrationNumber || ''
    };

    res.json(details);
  } catch (error) {
    console.error('Get Dialysis Patient Details Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dialysis records with search and filter parameters
// @route   GET /api/same-day-care/dialysis/records
// @access  Private
const getDialysisRecords = async (req, res) => {
  try {
    const { search, physicianName, fromDate, toDate, status } = req.query;
    let query = tenantFilter(req, { treatmentType: 'Dialysis' });

    if (req.user && req.user.role === 'doctor') {
      query.assignedStaffId = req.user._id;
    }

    if (status) {
      query.status = status;
    }
    if (physicianName) {
      query.physicianName = { $regex: physicianName, $options: 'i' };
    }
    if (fromDate || toDate) {
      query.treatmentDate = {};
      if (fromDate) query.treatmentDate.$gte = new Date(fromDate);
      if (toDate) query.treatmentDate.$lte = new Date(toDate + 'T23:59:59.999Z');
    }
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { uhid: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const records = await SameDayTreatment.find(query)
      .populate('createdBy', 'username doctorName')
      .sort({ treatmentDate: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get Dialysis Records Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single dialysis record by ID
// @route   GET /api/same-day-care/dialysis/record/:id
// @access  Private
const getDialysisRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName');
    if (!record) return res.status(404).json({ message: 'Dialysis record not found' });
    res.json(record);
  } catch (error) {
    console.error('Get Dialysis Record By ID Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new dialysis record
// @route   POST /api/same-day-care/dialysis/record
// @access  Private
const createDialysisRecord = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase?.();
    if (!['admin', 'doctor', 'nursing'].includes(role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    const {
      patientId, patientName, uhid, mobile, gender, age,
      physicianName, physicianContact, emergencyContact, ipNumber, dayCareVisitNumber,
      dialysisSessions, status
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Get default pricing for Dialysis if not provided
    const settings = await IpdAdminSettings.findOne(tenantFilter(req));
    let finalPrice = 2000; // default
    let foundPrice = null;
    if (settings?.sameDayCareCategories) {
      for (const cat of settings.sameDayCareCategories) {
        const sub = cat.subServices.find(s => s.name.toLowerCase() === 'dialysis');
        if (sub) {
          foundPrice = sub.price;
          break;
        }
      }
    }
    if (foundPrice === null && settings?.sameDayTreatmentPrices) {
      const service = settings.sameDayTreatmentPrices.find(s => s.name === 'Dialysis');
      if (service) foundPrice = service.price;
    }
    if (foundPrice !== null) finalPrice = foundPrice;

    const auditTrail = [{
      action: 'Add',
      performedBy: req.user._id,
      performedByName: req.user.doctorName || req.user.username || 'Staff',
      performedByRole: req.user.role || 'Staff',
      timestamp: new Date(),
      remarks: `Dialysis record created with ${dialysisSessions?.length || 0} session(s)`,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '',
      changedFields: []
    }];

    const record = new SameDayTreatment({
      hospitalId: req.user.hospitalId,
      patientId, patientName, uhid, mobile, gender, age,
      treatmentType: 'Dialysis',
      treatmentDate: new Date(),
      physicianName: physicianName || '',
      physicianContact: physicianContact || '',
      emergencyContact: emergencyContact || '',
      ipNumber: ipNumber || '',
      dayCareVisitNumber: dayCareVisitNumber || '',
      dialysisSessions: dialysisSessions || [],
      price: finalPrice,
      isFixedPrice: true,
      status: status === 'Completed' ? 'Completed' : 'Draft',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      auditTrail
    });

    await record.save();
    res.status(201).json({ message: 'Dialysis record saved successfully', record });
  } catch (error) {
    console.error('Create Dialysis Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an existing dialysis record
// @route   PUT /api/same-day-care/dialysis/record/:id
// @access  Private
const updateDialysisRecord = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase?.();
    if (!['admin', 'doctor', 'nursing'].includes(role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    const { id } = req.params;
    const {
      physicianName, physicianContact, emergencyContact, ipNumber, dayCareVisitNumber,
      dialysisSessions, status, auditTrailRemark
    } = req.body;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Dialysis record not found' });

    // Track modifications for audit log
    const prevSessionsCount = record.dialysisSessions?.length || 0;
    const newSessionsCount = dialysisSessions?.length || 0;

    const fields = ['physicianName', 'physicianContact', 'emergencyContact', 'ipNumber', 'dayCareVisitNumber', 'dialysisSessions', 'status'];
    const diffs = [];
    fields.forEach(f => {
      let oldVal = record[f];
      let newVal = req.body[f];
      if (newVal === undefined) return;

      let strOld = '';
      let strNew = '';

      if (f === 'dialysisSessions') {
        strOld = Array.isArray(oldVal) ? oldVal.map(s => `Session on ${s.date ? new Date(s.date).toISOString().split('T')[0] : ''} (${s.startingWeight}kg BP:${s.startingBP} -> ${s.endingWeight}kg BP:${s.endingBP})`).join('; ') : '';
        strNew = Array.isArray(newVal) ? newVal.map(s => `Session on ${s.date ? new Date(s.date).toISOString().split('T')[0] : ''} (${s.startingWeight}kg BP:${s.startingBP} -> ${s.endingWeight}kg BP:${s.endingBP})`).join('; ') : '';
      } else {
        strOld = oldVal !== undefined && oldVal !== null ? String(oldVal) : '';
        strNew = newVal !== undefined && newVal !== null ? String(newVal) : '';
      }

      if (strOld !== strNew) {
        diffs.push({
          fieldName: f,
          oldValue: strOld || 'N/A',
          newValue: strNew || 'N/A'
        });
      }
    });

    record.physicianName = physicianName !== undefined ? physicianName : record.physicianName;
    record.physicianContact = physicianContact !== undefined ? physicianContact : record.physicianContact;
    record.emergencyContact = emergencyContact !== undefined ? emergencyContact : record.emergencyContact;
    record.ipNumber = ipNumber !== undefined ? ipNumber : record.ipNumber;
    record.dayCareVisitNumber = dayCareVisitNumber !== undefined ? dayCareVisitNumber : record.dayCareVisitNumber;
    record.dialysisSessions = dialysisSessions !== undefined ? dialysisSessions : record.dialysisSessions;
    record.status = status === 'Completed' ? 'Completed' : 'Draft';
    record.updatedBy = req.user._id;

    let actionType = 'Edit';
    let remarks = auditTrailRemark || `Dialysis record updated (sessions count: ${prevSessionsCount} -> ${newSessionsCount})`;

    const statusDiff = diffs.find(d => d.fieldName === 'status');
    if (statusDiff) {
      actionType = 'Status Change';
      remarks = `Status transitioned from ${statusDiff.oldValue} to ${statusDiff.newValue}`;
    }

    if (diffs.length > 0) {
      record.auditTrail.push({
        action: actionType,
        performedBy: req.user._id,
        performedByName: req.user.doctorName || req.user.username || 'Staff',
        performedByRole: req.user.role || 'Staff',
        timestamp: new Date(),
        remarks: remarks,
        changedFields: diffs,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || ''
      });
    }

    await record.save();
    res.json({ message: 'Dialysis record updated successfully', record });
  } catch (error) {
    console.error('Update Dialysis Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a dialysis record
// @route   DELETE /api/same-day-care/dialysis/record/:id
// @access  Private
const deleteDialysisRecord = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase?.();
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin role required to delete records' });
    }

    const { id } = req.params;
    const record = await SameDayTreatment.findOneAndDelete(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Dialysis record not found' });

    res.json({ message: 'Dialysis record deleted successfully' });
  } catch (error) {
    console.error('Delete Dialysis Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTreatment, updateTreatment,
  getTreatmentsByPatient, getTreatmentById, getAllTreatments,
  getTreatmentPricing,
  addItemToTreatment, removeItemFromTreatment, getItemsForTreatment,
  getDialysisPatients, getDialysisPatientDetails, getDialysisRecords,
  getDialysisRecordById, createDialysisRecord, updateDialysisRecord,
  deleteDialysisRecord
};

