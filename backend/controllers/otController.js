const IpdOtRecord = require('../models/IpdOtRecord');
const IpdAdmission = require('../models/IpdAdmission');
const Patient = require('../models/Patient');
const HospitalSettings = require('../models/HospitalSettings');
const IpdActivityTimeline = require('../models/IpdActivityTimeline');
const OperationTheatre = require('../models/OperationTheatre');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df3dcum5n',
  api_key: process.env.CLOUDINARY_API_KEY || '772968243941522',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hnOybQ01s3e3AfYAmm3fBjF2TPk'
});

// Helper to filter queries by hospitalId for multi-tenant isolation
const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helper to check and auto-complete record if past scheduledEnd
const checkAndAutoCompleteRecord = async (record) => {
  if (!record || !record.otScheduling?.scheduledStart || !record.otScheduling?.scheduledEnd) {
    return;
  }

  const now = new Date();
  const start = new Date(record.otScheduling.scheduledStart);
  const end = new Date(record.otScheduling.scheduledEnd);

  let updated = false;

  if (now >= end) {
    // If current time is after scheduledEnd, status should be 'Completed'
    if (record.status !== 'Completed' || record.schedulingStatus !== 'Completed') {
      record.status = 'Completed';
      record.schedulingStatus = 'Completed';
      updated = true;

      // Update linked booking
      const OtBooking = require('../models/OtBooking');
      if (record.otScheduling.otBookingId) {
        await OtBooking.findByIdAndUpdate(record.otScheduling.otBookingId, { status: 'Completed' });
      }
      if (record.otScheduling.otId) {
        const OperationTheatre = require('../models/OperationTheatre');
        const activeBookings = await OtBooking.countDocuments({
          otId: record.otScheduling.otId,
          status: { $in: ['Scheduled', 'In Progress'] }
        });
        if (activeBookings === 0) {
          await OperationTheatre.findByIdAndUpdate(record.otScheduling.otId, { availabilityStatus: 'Available' });
        }
      }
    }
  } else if (now >= start && now < end) {
    // If current time is between start and end, status should be 'In Progress'
    if (record.status !== 'In Progress' || record.schedulingStatus !== 'Ongoing') {
      record.status = 'In Progress';
      record.schedulingStatus = 'Ongoing';
      updated = true;

      // Update linked booking
      const OtBooking = require('../models/OtBooking');
      if (record.otScheduling.otBookingId) {
        await OtBooking.findByIdAndUpdate(record.otScheduling.otBookingId, { status: 'In Progress' });
      }
    }
  } else {
    // If current time is before start, status should be 'Scheduled'
    if (record.status !== 'Scheduled' || record.schedulingStatus !== 'Scheduled') {
      record.status = 'Scheduled';
      record.schedulingStatus = 'Scheduled';
      updated = true;

      // Update linked booking
      const OtBooking = require('../models/OtBooking');
      if (record.otScheduling.otBookingId) {
        await OtBooking.findByIdAndUpdate(record.otScheduling.otBookingId, { status: 'Scheduled' });
      }
    }
  }

  if (updated) {
    await record.save();
  }
};

const populateOtRecord = async (id) => {
  return IpdOtRecord.findById(id)
    .populate('createdBy', 'username doctorName')
    .populate('updatedBy', 'username doctorName')
    .populate('otScheduling.otId', 'otCode otName')
    .populate('otScheduling.scheduledRoom', 'otCode otName')
    .populate('otScheduling.scheduledBy', 'username doctorName');
};

// @desc    Create a new OT record (Save Draft)
// @route   POST /api/ipd/ot
// @access  Private
const createOtRecord = async (req, res) => {
  try {
    const {
      admissionId, patientId, uhid, pidNumber, ipdNumber,
      patientName, dateOfBirth, age, gender, admissionDate, consultantDoctor,
      dateOfSurgery, surgeon, assistantSurgeon, anesthesia,
      preOperativeDiagnosis, postOperativeDiagnosis,
      proceduresPerformed, indicationsForSurgery, findings, descriptionOfProcedure,
      status
    } = req.body;

    if (!admissionId || !patientId) {
      return res.status(400).json({ message: 'Admission ID and Patient ID are required' });
    }

    // Verify admission exists
    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const recordStatus = status === 'Completed' ? 'Completed' : 'Draft';

    const otRecord = new IpdOtRecord({
      hospitalId: req.user.hospitalId,
      admissionId,
      patientId,
      uhid: uhid || '',
      pidNumber: pidNumber || '',
      ipdNumber: ipdNumber || '',
      patientName: patientName || '',
      dateOfBirth: dateOfBirth || null,
      age: age || null,
      gender: gender || '',
      admissionDate: admissionDate || null,
      consultantDoctor: consultantDoctor || '',
      dateOfSurgery: dateOfSurgery || null,
      surgeon: surgeon || '',
      assistantSurgeon: assistantSurgeon || '',
      anesthesia: anesthesia || '',
      preOperativeDiagnosis: preOperativeDiagnosis || '',
      postOperativeDiagnosis: postOperativeDiagnosis || '',
      proceduresPerformed: proceduresPerformed || '',
      indicationsForSurgery: indicationsForSurgery || '',
      findings: findings || '',
      descriptionOfProcedure: descriptionOfProcedure || '',
      status: recordStatus,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const saved = await otRecord.save();
    res.status(201).json({ message: 'OT record saved successfully', record: saved });
  } catch (error) {
    console.error('Create OT Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an OT record
// @route   PUT /api/ipd/ot/:id
// @access  Private
const updateOtRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    // Update fields
    const updatableFields = [
      'patientName', 'dateOfBirth', 'age', 'gender', 'admissionDate', 'consultantDoctor',
      'dateOfSurgery', 'surgeon', 'assistantSurgeon', 'anesthesia',
      'preOperativeDiagnosis', 'postOperativeDiagnosis',
      'proceduresPerformed', 'indicationsForSurgery', 'findings', 'descriptionOfProcedure',
      'status', 'uhid', 'pidNumber', 'ipdNumber',
      'pharmacyRequestSent', 'pharmacyRequestAt', 'pharmacyRequestBy', 'otMedicines', 'otConsumables'
    ];

    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        record[field] = updateData[field];
      }
    });

    if (updateData.pharmacyRequestSent === true && !record.pharmacyRequestSent) {
      record.pharmacyRequestSent = true;
      record.pharmacyRequestAt = new Date();
      record.pharmacyRequestBy = req.user._id;

      // Create PharmacyRequest document
      try {
        const PharmacyRequest = require('../models/PharmacyRequest');
        const count = await PharmacyRequest.countDocuments({ hospitalId: record.hospitalId });
        const requestNumber = `PR-${10001 + count}`;

        const items = [];
        if (record.otMedicines && record.otMedicines.length > 0) {
          record.otMedicines.forEach(m => {
            if (m.medicineName && m.medicineName.trim()) {
              items.push({
                itemName: m.medicineName.trim() + (m.dosage && m.dosage.trim() ? ` (${m.dosage.trim()})` : ''),
                requestedQty: parseInt(m.quantity) || 1,
                pendingQty: parseInt(m.quantity) || 1
              });
            }
          });
        }
        if (record.otConsumables && record.otConsumables.length > 0) {
          record.otConsumables.forEach(c => {
            if (c.consumableName && c.consumableName.trim()) {
              items.push({
                itemName: c.consumableName.trim(),
                requestedQty: parseInt(c.quantity) || 1,
                pendingQty: parseInt(c.quantity) || 1
              });
            }
          });
        }

        if (items.length > 0) {
          await PharmacyRequest.create({
            hospitalId: record.hospitalId,
            requestNumber,
            admissionId: record.admissionId,
            patientId: record.patientId,
            doctorId: req.user._id,
            procedureName: `OT - ${record.proceduresPerformed || 'Surgery'}`,
            status: 'Pending',
            items,
            auditTrail: [{
              status: 'Pending',
              action: 'Request Created',
              performedBy: req.user._id,
              performedByName: req.user.doctorName || req.user.username || 'Doctor',
              timestamp: new Date(),
              remarks: `Requested items from OT Workspace`
            }]
          });

          // Log timeline
          await IpdActivityTimeline.create({
            hospitalId: record.hospitalId,
            admissionId: record.admissionId,
            patientId: record.patientId,
            activity: 'Service Added',
            description: `OT Pharmacy Request #${requestNumber} created`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            performedBy: req.user._id,
            performedByName: req.user.doctorName || req.user.username || 'Doctor'
          });
        }
      } catch (err) {
        console.error('Error creating PharmacyRequest from OT:', err);
      }
    }

    // If status is being set to Completed, ensure it's valid and sync booking/room status
    if (updateData.status === 'Completed') {
      record.status = 'Completed';
      record.schedulingStatus = 'Completed';

      // Update linked booking
      if (record.otScheduling?.otBookingId) {
        const OtBooking = require('../models/OtBooking');
        await OtBooking.findByIdAndUpdate(record.otScheduling.otBookingId, { status: 'Completed' });
      }

      if (record.otScheduling?.otId) {
        const OtBooking = require('../models/OtBooking');
        const OperationTheatre = require('../models/OperationTheatre');
        const activeBookings = await OtBooking.countDocuments({
          otId: record.otScheduling.otId,
          status: { $in: ['Scheduled', 'In Progress'] }
        });
        if (activeBookings === 0) {
          await OperationTheatre.findByIdAndUpdate(record.otScheduling.otId, { availabilityStatus: 'Available' });
        }
      }
    }

    record.updatedBy = req.user._id;
    const updated = await record.save();
    const populated = await populateOtRecord(updated._id);

    res.json({ message: 'OT record updated successfully', record: populated });
  } catch (error) {
    console.error('Update OT Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all OT records for an admission
// @route   GET /api/ipd/ot/admission/:admissionId
// @access  Private
const getOtRecordsByAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const records = await IpdOtRecord.find(
      tenantFilter(req, { admissionId })
    )
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName')
      .populate('otScheduling.otId', 'otCode otName')
      .populate('otScheduling.scheduledRoom', 'otCode otName')
      .populate('otScheduling.scheduledBy', 'username doctorName')
      .sort({ createdAt: -1 });

    for (const record of records) {
      await checkAndAutoCompleteRecord(record);
    }

    res.json(records);
  } catch (error) {
    console.error('Get OT Records Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all OT records for a patient
// @route   GET /api/ipd/ot/patient/:patientId
// @access  Private
const getOtRecordsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await IpdOtRecord.find(
      tenantFilter(req, { patientId })
    )
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get Patient OT Records Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single OT record by ID
// @route   GET /api/ipd/ot/:id
// @access  Private
const getOtRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName');

    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    await checkAndAutoCompleteRecord(record);

    res.json(record);
  } catch (error) {
    console.error('Get OT Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get hospital settings for print/PDF
// @route   GET /api/ipd/ot/hospital-info
// @access  Private
const getHospitalInfo = async (req, res) => {
  try {
    const settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    if (!settings) {
      return res.json({
        hospitalName: 'Hospital Care',
        address: 'Default Address',
        phoneNumbers: [],
        logoUrl: '',
        hospitalHeading: 'General Consent',
        emailAddress: '',
        gstNumber: '',
        website: '',
        invoiceFooterMessage: ''
      });
    }
    res.json({
      hospitalName: settings.hospitalName,
      address: settings.address,
      phoneNumbers: settings.mobileNumbers,
      logoUrl: settings.logoUrl,
      hospitalHeading: settings.hospitalHeading,
      emailAddress: settings.emailAddress || '',
      gstNumber: settings.gstNumber || '',
      website: settings.website || '',
      invoiceFooterMessage: settings.invoiceFooterMessage || ''
    });
  } catch (error) {
    console.error('Get Hospital Info Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload OT document (OT paper/form) via Cloudinary
// @route   POST /api/ipd/ot/:otRecordId/documents/upload
// @access  Private
const uploadOtDocument = async (req, res) => {
  try {
    const { otRecordId } = req.params;
    const { fileData, documentType = 'ot_paper', fileName } = req.body;

    if (!fileData) {
      return res.status(400).json({ message: 'File data is required' });
    }

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: otRecordId }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(fileData, {
      folder: `ot_documents/${req.user.hospitalId}`,
      resource_type: 'auto',
      public_id: `ot_${otRecordId}_${Date.now()}`
    });

    // Add document to record's otDocuments array
    const document = {
      documentType,
      fileName: fileName || uploaded.original_filename,
      fileUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    record.otDocuments.push(document);
    record.updatedBy = req.user._id;
    await record.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Upload OT Document Error:', error);
    res.status(500).json({ message: error.message || 'Document upload failed' });
  }
};

// @desc    Delete OT document
// @route   DELETE /api/ipd/ot/:otRecordId/documents/:docIndex
// @access  Private
const deleteOtDocument = async (req, res) => {
  try {
    const { otRecordId, docIndex } = req.params;
    const index = parseInt(docIndex);

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: otRecordId }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    if (index < 0 || index >= record.otDocuments.length) {
      return res.status(400).json({ message: 'Invalid document index' });
    }

    const doc = record.otDocuments[index];
    if (doc.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(doc.cloudinaryPublicId);
    }

    record.otDocuments.splice(index, 1);
    record.updatedBy = req.user._id;
    await record.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete OT Document Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get OT record with documents
// @route   GET /api/ipd/ot/:id/full
// @access  Private
const getOtRecordFull = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName')
      .populate('otScheduling.otId', 'otCode otName')
      .populate('otScheduling.scheduledRoom', 'otCode otName')
      .populate('otScheduling.scheduledBy', 'username doctorName');

    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    await checkAndAutoCompleteRecord(record);

    res.json(record);
  } catch (error) {
    console.error('Get Full OT Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save consultation form for an OT record
// @route   PUT /api/ipd/ot/:id/consultation
// @access  Private
const saveConsultationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      consultationNotes,
      templateId,
      templateName,
      templateHeading,
      signatureFileUrl,
      signatureCloudinaryId,
      signatureSignedBy
    } = req.body;

    if (!consultationNotes) {
      return res.status(400).json({ message: 'Consultation notes are required' });
    }

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    record.consultation = {
      isConsultationCompleted: true,
      templateId: templateId || null,
      templateName: templateName || '',
      templateHeading: templateHeading || '',
      consultationNotes: consultationNotes.trim(),
      signatureFileUrl: signatureFileUrl || '',
      signatureCloudinaryId: signatureCloudinaryId || '',
      signatureSignedBy: signatureSignedBy ? signatureSignedBy.trim() : '',
      signatureSignedAt: signatureFileUrl ? new Date() : null,
      consultationCompletedBy: req.user._id
    };

    record.updatedBy = req.user._id;
    const updated = await record.save();

    // Create activity timeline entry (Patient history)
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      await IpdActivityTimeline.create({
        hospitalId: req.user.hospitalId,
        admissionId: record.admissionId,
        patientId: record.patientId,
        activity: 'OT Consent / Consultation Completed',
        description: `Consent form template "${templateName || 'Manual'}" completed. Title: "${templateHeading || 'OT Consent'}"`,
        date: dateStr,
        time: timeStr,
        performedBy: req.user._id,
        performedByName: req.user.doctorName || req.user.username || 'System',
        metadata: {
          templateId: templateId || null,
          templateName: templateName || '',
          templateHeading: templateHeading || ''
        }
      });
    } catch (timelineErr) {
      console.warn('Failed to save activity timeline entry:', timelineErr);
    }

    const populated = await populateOtRecord(updated._id);
    res.json({ message: 'Consultation form saved successfully', record: populated });
  } catch (error) {
    console.error('Save Consultation Form Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save consent tracking info for an OT record
// @route   PUT /api/ipd/ot/:id/consent
// @access  Private
const saveConsentForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { consentFormSignedFileUrl, consentFormSignedCloudinaryId, consentSignedBy } = req.body;

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    record.consent = {
      ...record.consent,
      isConsentCompleted: true,
      consentFormSignedFileUrl: consentFormSignedFileUrl || record.consent?.consentFormSignedFileUrl || '',
      consentFormSignedCloudinaryId: consentFormSignedCloudinaryId || record.consent?.consentFormSignedCloudinaryId || '',
      consentSignedBy: consentSignedBy || record.consent?.consentSignedBy || '',
      consentSignedAt: new Date(),
      consentVerifiedBy: req.user._id
    };

    const updated = await record.save();
    const populated = await populateOtRecord(updated._id);

    res.json({ message: 'Consent form saved successfully', record: populated });
  } catch (error) {
    console.error('Save Consent Form Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update OT charges for a record
// @route   PUT /api/ipd/ot/:id/charges
// @access  Private
const updateOtCharges = async (req, res) => {
  try {
    const { id } = req.params;
    const { otCharges } = req.body;

    if (!otCharges || !Array.isArray(otCharges)) {
      return res.status(400).json({ message: 'OT charges array is required' });
    }

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    if (record.schedulingStatus === 'Pending') {
      return res.status(400).json({ message: 'OT must be scheduled before updating charges' });
    }

    const chargesWithUser = otCharges.map(c => ({
      chargeName: c.chargeName,
      chargeAmount: Number(c.chargeAmount),
      isActive: c.isActive !== false,
      addedBy: req.user._id,
      addedAt: c.addedAt || new Date()
    }));

    record.otCharges = chargesWithUser;
    record.totalCharges = chargesWithUser
      .filter(c => c.isActive)
      .reduce((sum, c) => sum + c.chargeAmount, 0);
    const updated = await record.save();
    const populated = await populateOtRecord(updated._id);

    res.json({ message: 'OT charges updated', record: populated });
  } catch (error) {
    console.error('Update OT Charges Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add OT medicines for pharmacy integration (future-ready)
// @route   POST /api/ipd/ot/:id/medicines
// @access  Private
const addOtMedicines = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ message: 'Medicines array is required' });
    }

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    const medsWithUser = medicines.map(m => ({
      medicineName: m.medicineName,
      dosage: m.dosage || '',
      quantity: Number(m.quantity) || 1,
      unit: m.unit || 'nos',
      isRequested: true,
      requestedAt: new Date(),
      requestedBy: req.user._id,
      notes: m.notes || ''
    }));

    record.otMedicines.push(...medsWithUser);
    const updated = await record.save();
    const populated = await populateOtRecord(updated._id);

    res.status(201).json({ message: 'Medicines added successfully', record: populated });
  } catch (error) {
    console.error('Add OT Medicines Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add OT consumables for pharmacy integration (future-ready)
// @route   POST /api/ipd/ot/:id/consumables
// @access  Private
const addOtConsumables = async (req, res) => {
  try {
    const { id } = req.params;
    const { consumables } = req.body;

    if (!consumables || !Array.isArray(consumables)) {
      return res.status(400).json({ message: 'Consumables array is required' });
    }

    const record = await IpdOtRecord.findOne(tenantFilter(req, { _id: id }));
    if (!record) {
      return res.status(404).json({ message: 'OT record not found' });
    }

    const consWithUser = consumables.map(c => ({
      consumableName: c.consumableName,
      quantity: Number(c.quantity) || 1,
      unit: c.unit || 'nos',
      isRequested: true,
      requestedAt: new Date(),
      requestedBy: req.user._id,
      notes: c.notes || ''
    }));

    record.otConsumables.push(...consWithUser);
    const updated = await record.save();
    const populated = await populateOtRecord(updated._id);

    res.status(201).json({ message: 'Consumables added successfully', record: populated });
  } catch (error) {
    console.error('Add OT Consumables Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOtRecord,
  updateOtRecord,
  getOtRecordsByAdmission,
  getOtRecordsByPatient,
  getOtRecordById,
  getOtRecordFull,
  getHospitalInfo,
  uploadOtDocument,
  deleteOtDocument,
  saveConsultationForm,
  saveConsentForm,
  updateOtCharges,
  addOtMedicines,
  addOtConsumables
};
