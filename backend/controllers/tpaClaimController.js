const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const TpaClaim = require('../models/TpaClaim');
const Patient = require('../models/Patient');
const IpdAdmission = require('../models/IpdAdmission');
const PatientInsurance = require('../models/PatientInsurance');
const InsuranceCompany = require('../models/InsuranceCompany');
const TpaMaster = require('../models/TpaMaster');
const PreAuthorization = require('../models/PreAuthorization');
const Billing = require('../models/Billing');

// Configure Cloudinary SDK using existing environment variables
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper to escape regex special characters in search input
const escapeRegex = (string = '') => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Multi-tenant filter helper ensuring hospitalId isolation
const tenantFilter = (req, query = {}) => {
  if (!req.user || !req.user.hospitalId) {
    return { ...query, _id: null }; // Failsafe: return empty if no tenant context
  }
  return { ...query, hospitalId: req.user.hospitalId };
};

// Document validation constants & helpers
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const sanitizeFileName = (fileName = '') => {
  return String(fileName)
    .replace(/^.*[\\\/]/, '') // Strip path directories
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Sanitize special characters
    .substring(0, 150);
};

const parseAndValidateBase64 = (dataUri) => {
  if (typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
    return { error: 'Invalid file payload. Base64 Data URI expected.' };
  }

  const matches = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    return { error: 'Malformed Data URI structure.' };
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];

  if (!base64Data || base64Data.length === 0) {
    return { error: 'Empty file payload.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { error: `Unsupported file type "${mimeType}". Allowed types: PDF, JPG, PNG, WEBP.` };
  }

  // Calculate approximate decoded binary size in bytes
  const padding = (base64Data.endsWith('==') ? 2 : (base64Data.endsWith('=') ? 1 : 0));
  const fileSizeInBytes = (base64Data.length * 3 / 4) - padding;

  if (fileSizeInBytes > MAX_DOCUMENT_SIZE_BYTES) {
    const sizeMb = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
    return { error: `File exceeds maximum allowed size of 20 MB (Selected file: ${sizeMb} MB).` };
  }

  return { mimeType, fileSizeInBytes };
};

// ====================================================================
//                    TPA CLAIM CONTROLLERS
// ====================================================================

// @desc    Create a new TPA Claim (Draft claim dossier)
// @route   POST /api/tpa/claims
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const createClaim = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    const {
      patientId,
      ipdAdmissionId,
      patientInsuranceId,
      insuranceCompanyId,
      tpaId,
      preAuthorizationId,
      billingId,
      claimNumber,
      portalClaimId,
      totalHospitalBill,
      finalAuthorizedAmount,
      claimedAmount,
      nonPayableAmount,
      copayAmount,
      deductibleAmount,
      submissionType,
      submissionDate,
      courierName,
      trackingNumber,
      dispatchDate,
      acknowledgmentDocUrl,
      documents
    } = req.body;

    // 1. Mandatory field validation
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Valid Patient ID is required.' });
    }
    if (!ipdAdmissionId || !mongoose.Types.ObjectId.isValid(ipdAdmissionId)) {
      return res.status(400).json({ message: 'Valid IPD Admission ID is required.' });
    }
    if (!patientInsuranceId || !mongoose.Types.ObjectId.isValid(patientInsuranceId)) {
      return res.status(400).json({ message: 'Valid Patient Insurance ID is required.' });
    }
    if (!insuranceCompanyId || !mongoose.Types.ObjectId.isValid(insuranceCompanyId)) {
      return res.status(400).json({ message: 'Valid Insurance Company ID is required.' });
    }
    if (!claimNumber || !claimNumber.trim()) {
      return res.status(400).json({ message: 'Claim Number is required.' });
    }

    // 2. Fetch mandatory referenced records in tenant hospital
    const [patient, admission, insurancePolicy, insuranceCompany] = await Promise.all([
      Patient.findOne({ _id: patientId, hospitalId }),
      IpdAdmission.findOne({ _id: ipdAdmissionId, hospitalId }),
      PatientInsurance.findOne({ _id: patientInsuranceId, hospitalId }),
      InsuranceCompany.findOne({ _id: insuranceCompanyId, hospitalId })
    ]);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found in hospital records.' });
    }
    if (!admission) {
      return res.status(404).json({ message: 'IPD Admission not found in hospital records.' });
    }
    if (!insurancePolicy) {
      return res.status(404).json({ message: 'Patient Insurance Policy not found in hospital records.' });
    }
    if (!insuranceCompany) {
      return res.status(404).json({ message: 'Insurance Company not found in hospital records.' });
    }

    // 3. Relational cross-checks
    if (insurancePolicy.patientId.toString() !== patientId.toString()) {
      return res.status(400).json({ message: 'Patient Insurance Policy does not belong to the specified patient.' });
    }
    if (admission.patientId.toString() !== patientId.toString()) {
      return res.status(400).json({ message: 'IPD Admission does not belong to the specified patient.' });
    }
    if (insurancePolicy.insuranceCompanyId.toString() !== insuranceCompanyId.toString()) {
      return res.status(400).json({ message: 'Insurance Company does not match the company on the policy record.' });
    }

    // 4. Optional reference validations
    let validTpaId = null;
    if (tpaId && mongoose.Types.ObjectId.isValid(tpaId)) {
      const tpa = await TpaMaster.findOne({ _id: tpaId, hospitalId });
      if (!tpa) {
        return res.status(404).json({ message: 'TPA Provider not found in hospital records.' });
      }
      validTpaId = tpa._id;
    } else if (insurancePolicy.tpaId) {
      validTpaId = insurancePolicy.tpaId;
    }

    let validPreAuthId = null;
    if (preAuthorizationId && mongoose.Types.ObjectId.isValid(preAuthorizationId)) {
      const preAuth = await PreAuthorization.findOne({ _id: preAuthorizationId, hospitalId });
      if (!preAuth) {
        return res.status(404).json({ message: 'Pre-Authorization record not found in hospital records.' });
      }
      if (preAuth.patientId.toString() !== patientId.toString()) {
        return res.status(400).json({ message: 'Pre-Authorization does not belong to the specified patient.' });
      }
      if (preAuth.ipdAdmissionId.toString() !== ipdAdmissionId.toString()) {
        return res.status(400).json({ message: 'Pre-Authorization does not belong to the specified IPD admission.' });
      }
      validPreAuthId = preAuth._id;
    }

    let validBillingId = null;
    if (billingId && mongoose.Types.ObjectId.isValid(billingId)) {
      const bill = await Billing.findOne({ _id: billingId, hospitalId });
      if (!bill) {
        return res.status(404).json({ message: 'Billing record not found in hospital records.' });
      }
      if (bill.patientId.toString() !== patientId.toString()) {
        return res.status(400).json({ message: 'Billing record does not belong to the specified patient.' });
      }
      validBillingId = bill._id;
    }

    // 5. Unique Claim Number validation within hospital
    const trimmedClaimNumber = claimNumber.trim();
    const existingClaim = await TpaClaim.findOne({ hospitalId, claimNumber: trimmedClaimNumber });
    if (existingClaim) {
      return res.status(409).json({
        message: `A TPA Claim with claim number "${trimmedClaimNumber}" already exists in this hospital.`
      });
    }

    // 6. Monetary snapshot checks
    const numTotalBill = Number(totalHospitalBill) >= 0 ? Number(totalHospitalBill) : 0;
    const numFinalAuth = Number(finalAuthorizedAmount) >= 0 ? Number(finalAuthorizedAmount) : 0;
    const numClaimed = Number(claimedAmount) >= 0 ? Number(claimedAmount) : (numFinalAuth > 0 ? numFinalAuth : numTotalBill);
    const numNonPayable = Number(nonPayableAmount) >= 0 ? Number(nonPayableAmount) : 0;
    const numCopay = Number(copayAmount) >= 0 ? Number(copayAmount) : 0;
    const numDeductible = Number(deductibleAmount) >= 0 ? Number(deductibleAmount) : 0;

    // 7. Initialize Document array if provided
    const validDocs = Array.isArray(documents)
      ? documents.map(d => ({
          category: d.category || 'Other',
          title: d.title?.trim() || 'Claim Document',
          fileName: d.fileName?.trim() || '',
          fileUrl: d.fileUrl?.trim() || '',
          cloudinaryPublicId: d.cloudinaryPublicId?.trim() || '',
          fileType: d.fileType?.trim() || 'pdf',
          uploadedAt: d.uploadedAt || new Date(),
          uploadedBy: req.user._id
        })).filter(d => Boolean(d.fileUrl && d.title))
      : [];

    const newClaim = new TpaClaim({
      hospitalId,
      patientId,
      ipdAdmissionId,
      patientInsuranceId,
      insuranceCompanyId,
      tpaId: validTpaId,
      preAuthorizationId: validPreAuthId,
      billingId: validBillingId,
      claimNumber: trimmedClaimNumber,
      portalClaimId: portalClaimId?.trim() || '',
      totalHospitalBill: numTotalBill,
      finalAuthorizedAmount: numFinalAuth,
      claimedAmount: numClaimed,
      nonPayableAmount: numNonPayable,
      copayAmount: numCopay,
      deductibleAmount: numDeductible,
      settledAmount: 0,
      tdsDeducted: 0,
      disallowedAmount: 0,
      netReceivedAmount: 0,
      submissionType: submissionType || 'TPA Portal',
      submissionDate: submissionDate || null,
      courierName: courierName?.trim() || '',
      trackingNumber: trackingNumber?.trim() || '',
      dispatchDate: dispatchDate || null,
      acknowledgmentDocUrl: acknowledgmentDocUrl?.trim() || '',
      status: 'Draft',
      documents: validDocs,
      queryHistory: [],
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await newClaim.save();

    const populated = await TpaClaim.findById(newClaim._id)
      .populate('patientId', 'uhid patientName mobile gender category dob address')
      .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate status provisionalDiagnosis doctorInCharge roomId bedId')
      .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance validFrom validTill')
      .populate('insuranceCompanyId', 'name code payerType customPayerType cashlessEmail claimEmail tollFreeNumber')
      .populate('tpaId', 'name code preauthEmail contactPhone claimsEmail')
      .populate('preAuthorizationId', 'claimNumber preauthStatus totalApprovedAmount finalAuthorizedAmount')
      .populate('billingId', 'billNo invoiceNo grandTotal dueAmount amountPaid paymentStatus')
      .populate('createdBy', 'username role')
      .populate('updatedBy', 'username role');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create TPA Claim Error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A claim with this claim number already exists.' });
    }
    res.status(500).json({ message: error.message || 'Server error creating TPA Claim.' });
  }
};

// @desc    List TPA Claims (with filters, search, pagination)
// @route   GET /api/tpa/claims
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing, Reception, IPD, Doctor, Nursing)
const getClaims = async (req, res) => {
  try {
    const {
      patientId,
      ipdAdmissionId,
      patientInsuranceId,
      insuranceCompanyId,
      tpaId,
      preAuthorizationId,
      billingId,
      status,
      submissionType,
      search,
      page,
      limit
    } = req.query;

    let query = tenantFilter(req);

    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      query.patientId = patientId;
    }
    if (ipdAdmissionId && mongoose.Types.ObjectId.isValid(ipdAdmissionId)) {
      query.ipdAdmissionId = ipdAdmissionId;
    }
    if (patientInsuranceId && mongoose.Types.ObjectId.isValid(patientInsuranceId)) {
      query.patientInsuranceId = patientInsuranceId;
    }
    if (insuranceCompanyId && mongoose.Types.ObjectId.isValid(insuranceCompanyId)) {
      query.insuranceCompanyId = insuranceCompanyId;
    }
    if (tpaId && mongoose.Types.ObjectId.isValid(tpaId)) {
      query.tpaId = tpaId;
    }
    if (preAuthorizationId && mongoose.Types.ObjectId.isValid(preAuthorizationId)) {
      query.preAuthorizationId = preAuthorizationId;
    }
    if (billingId && mongoose.Types.ObjectId.isValid(billingId)) {
      query.billingId = billingId;
    }
    if (status && status.trim()) {
      query.status = status.trim();
    }
    if (submissionType && submissionType.trim()) {
      query.submissionType = submissionType.trim();
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { claimNumber: { $regex: escaped, $options: 'i' } },
        { portalClaimId: { $regex: escaped, $options: 'i' } },
        { trackingNumber: { $regex: escaped, $options: 'i' } },
        { courierName: { $regex: escaped, $options: 'i' } },
        { settlementRef: { $regex: escaped, $options: 'i' } },
        { utrNumber: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Pagination
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const limitVal = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (currentPage - 1) * limitVal;

    const [totalRecords, records] = await Promise.all([
      TpaClaim.countDocuments(query),
      TpaClaim.find(query)
        .populate('patientId', 'uhid patientName mobile gender category')
        .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate status provisionalDiagnosis')
        .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance')
        .populate('insuranceCompanyId', 'name code payerType customPayerType cashlessEmail claimEmail')
        .populate('tpaId', 'name code preauthEmail contactPhone claimsEmail')
        .populate('preAuthorizationId', 'claimNumber preauthStatus totalApprovedAmount finalAuthorizedAmount')
        .populate('billingId', 'billNo invoiceNo grandTotal dueAmount amountPaid paymentStatus')
        .populate('createdBy', 'username role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitVal)
        .lean()
    ]);

    const totalPages = Math.ceil(totalRecords / limitVal) || 1;

    res.json({
      records,
      pagination: {
        totalRecords,
        totalPages,
        currentPage,
        limit: limitVal
      }
    });
  } catch (error) {
    console.error('Get TPA Claims Error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching TPA Claims.' });
  }
};

// @desc    Get single TPA Claim by ID
// @route   GET /api/tpa/claims/:id
// @access  Private
const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Claim ID.' });
    }

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }))
      .populate('patientId', 'uhid patientName mobile gender category dob address bloodGroup')
      .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate dischargeDate status provisionalDiagnosis doctorInCharge roomId bedId')
      .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance validFrom validTill primaryInsuredName relationshipToPatient corporateName employeeId cardImageUrl')
      .populate('insuranceCompanyId', 'name code payerType customPayerType cashlessEmail claimEmail tollFreeNumber portalUrl settlementTatDays address')
      .populate('tpaId', 'name code preauthEmail contactPhone claimsEmail portalUrl contactPerson')
      .populate('preAuthorizationId', 'claimNumber preauthStatus initialRequestedAmount totalApprovedAmount finalAuthorizedAmount settledAmount queryHistory enhancementHistory')
      .populate('billingId', 'billNo invoiceNo items subtotal gstAmount discountAmount grandTotal advanceAdjusted amountPaid dueAmount paymentStatus paymentMode transactionRef')
      .populate('documents.uploadedBy', 'username doctorName role')
      .populate('createdBy', 'username role')
      .populate('updatedBy', 'username role');

    if (!claim) {
      return res.status(404).json({ message: 'TPA Claim record not found.' });
    }

    res.json(claim);
  } catch (error) {
    console.error('Get TPA Claim By ID Error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching TPA Claim.' });
  }
};

// @desc    Update editable Claim fields (Only while status is Draft or Documents Pending)
// @route   PUT /api/tpa/claims/:id
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const updateDraftClaim = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Claim ID.' });
    }

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) {
      return res.status(404).json({ message: 'TPA Claim record not found.' });
    }

    // Lock update if claim is already submitted or beyond
    if (!['Draft', 'Documents Pending'].includes(claim.status)) {
      return res.status(409).json({
        message: `Cannot edit claim: Claim is currently in "${claim.status}" status. Full updates are only permitted while in Draft or Documents Pending state.`
      });
    }

    const {
      patientInsuranceId,
      insuranceCompanyId,
      tpaId,
      preAuthorizationId,
      billingId,
      claimNumber,
      portalClaimId,
      totalHospitalBill,
      finalAuthorizedAmount,
      claimedAmount,
      nonPayableAmount,
      copayAmount,
      deductibleAmount,
      submissionType,
      submissionDate,
      courierName,
      trackingNumber,
      dispatchDate,
      acknowledgmentDocUrl
    } = req.body;

    // Validate claim number uniqueness if modified
    if (claimNumber && claimNumber.trim() && claimNumber.trim() !== claim.claimNumber) {
      const duplicate = await TpaClaim.findOne({
        hospitalId: req.user.hospitalId,
        claimNumber: claimNumber.trim(),
        _id: { $ne: claim._id }
      });
      if (duplicate) {
        return res.status(409).json({ message: `Claim number "${claimNumber.trim()}" is already in use by another claim.` });
      }
      claim.claimNumber = claimNumber.trim();
    }

    // Optional reference updates
    if (patientInsuranceId && mongoose.Types.ObjectId.isValid(patientInsuranceId)) {
      const pol = await PatientInsurance.findOne({ _id: patientInsuranceId, hospitalId: req.user.hospitalId });
      if (pol) claim.patientInsuranceId = pol._id;
    }
    if (insuranceCompanyId && mongoose.Types.ObjectId.isValid(insuranceCompanyId)) {
      const comp = await InsuranceCompany.findOne({ _id: insuranceCompanyId, hospitalId: req.user.hospitalId });
      if (comp) claim.insuranceCompanyId = comp._id;
    }
    if (tpaId !== undefined) {
      if (tpaId && mongoose.Types.ObjectId.isValid(tpaId)) {
        const tpa = await TpaMaster.findOne({ _id: tpaId, hospitalId: req.user.hospitalId });
        if (tpa) claim.tpaId = tpa._id;
      } else {
        claim.tpaId = null;
      }
    }
    if (preAuthorizationId !== undefined) {
      if (preAuthorizationId && mongoose.Types.ObjectId.isValid(preAuthorizationId)) {
        const preAuth = await PreAuthorization.findOne({ _id: preAuthorizationId, hospitalId: req.user.hospitalId });
        if (preAuth) claim.preAuthorizationId = preAuth._id;
      } else {
        claim.preAuthorizationId = null;
      }
    }
    if (billingId !== undefined) {
      if (billingId && mongoose.Types.ObjectId.isValid(billingId)) {
        const bill = await Billing.findOne({ _id: billingId, hospitalId: req.user.hospitalId });
        if (bill) claim.billingId = bill._id;
      } else {
        claim.billingId = null;
      }
    }

    // Financial updates
    if (totalHospitalBill !== undefined && Number(totalHospitalBill) >= 0) claim.totalHospitalBill = Number(totalHospitalBill);
    if (finalAuthorizedAmount !== undefined && Number(finalAuthorizedAmount) >= 0) claim.finalAuthorizedAmount = Number(finalAuthorizedAmount);
    if (claimedAmount !== undefined && Number(claimedAmount) >= 0) claim.claimedAmount = Number(claimedAmount);
    if (nonPayableAmount !== undefined && Number(nonPayableAmount) >= 0) claim.nonPayableAmount = Number(nonPayableAmount);
    if (copayAmount !== undefined && Number(copayAmount) >= 0) claim.copayAmount = Number(copayAmount);
    if (deductibleAmount !== undefined && Number(deductibleAmount) >= 0) claim.deductibleAmount = Number(deductibleAmount);

    // Submission logistics
    if (submissionType && ['TPA Portal', 'Physical Courier', 'Email', 'In-Person Desk'].includes(submissionType)) {
      claim.submissionType = submissionType;
    }
    if (portalClaimId !== undefined) claim.portalClaimId = portalClaimId.trim();
    if (courierName !== undefined) claim.courierName = courierName.trim();
    if (trackingNumber !== undefined) claim.trackingNumber = trackingNumber.trim();
    if (submissionDate !== undefined) claim.submissionDate = submissionDate;
    if (dispatchDate !== undefined) claim.dispatchDate = dispatchDate;
    if (acknowledgmentDocUrl !== undefined) claim.acknowledgmentDocUrl = acknowledgmentDocUrl.trim();

    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'TPA Claim updated successfully.', claim });
  } catch (error) {
    console.error('Update Draft Claim Error:', error);
    res.status(500).json({ message: error.message || 'Server error updating TPA Claim.' });
  }
};

// ====================================================================
//                    WORKFLOW & STATUS CONTROLLERS
// ====================================================================

// @desc    Mark claim as Documents Pending
// @route   PATCH /api/tpa/claims/:id/documents-pending
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const markDocumentsPending = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (claim.status !== 'Draft') {
      return res.status(400).json({
        message: `Cannot transition to Documents Pending: Claim status is "${claim.status}". Only Draft claims can transition to Documents Pending.`
      });
    }

    claim.status = 'Documents Pending';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'Claim marked as Documents Pending.', claim });
  } catch (error) {
    console.error('Mark Documents Pending Error:', error);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

// @desc    Mark claim as Ready for Submission
// @route   PATCH /api/tpa/claims/:id/ready-for-submission
// @access  Private (Admin, SuperAdmin, TPA Desk)
const markReadyForSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (!['Draft', 'Documents Pending'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot mark Ready for Submission: Claim status is "${claim.status}". Transition is only permitted from Draft or Documents Pending.`
      });
    }

    // Validate minimum claim readiness
    if (!claim.patientId || !claim.ipdAdmissionId || !claim.patientInsuranceId || !claim.insuranceCompanyId || !claim.claimNumber) {
      return res.status(400).json({
        message: 'Claim is missing required core records (Patient, Admission, Insurance Policy, or Claim Number).'
      });
    }

    claim.status = 'Ready for Submission';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'Claim marked Ready for Submission.', claim });
  } catch (error) {
    console.error('Mark Ready For Submission Error:', error);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

// @desc    Submit Claim to TPA (Via Portal, Courier, Email, Desk)
// @route   PATCH /api/tpa/claims/:id/submit
// @access  Private (Admin, SuperAdmin, TPA Desk)
const submitClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (claim.status !== 'Ready for Submission') {
      return res.status(400).json({
        message: `Cannot submit claim: Claim status is "${claim.status}". Only claims marked "Ready for Submission" can be submitted.`
      });
    }

    const {
      submissionType,
      submissionDate,
      portalClaimId,
      courierName,
      trackingNumber,
      dispatchDate,
      acknowledgmentDocUrl
    } = req.body;

    const finalSubmissionType = submissionType || claim.submissionType || 'TPA Portal';

    // Validate type-specific submission details
    if (finalSubmissionType === 'Physical Courier') {
      if (!courierName && !claim.courierName) {
        return res.status(400).json({ message: 'Courier Company Name is required for Physical Courier submission.' });
      }
      if (!trackingNumber && !claim.trackingNumber) {
        return res.status(400).json({ message: 'Tracking / AWB Number is required for Physical Courier submission.' });
      }
      claim.courierName = courierName?.trim() || claim.courierName;
      claim.trackingNumber = trackingNumber?.trim() || claim.trackingNumber;
      claim.dispatchDate = dispatchDate || claim.dispatchDate || new Date();
    } else if (finalSubmissionType === 'TPA Portal') {
      if (portalClaimId) claim.portalClaimId = portalClaimId.trim();
    }

    claim.submissionType = finalSubmissionType;
    claim.submissionDate = submissionDate || new Date();
    if (acknowledgmentDocUrl) claim.acknowledgmentDocUrl = acknowledgmentDocUrl.trim();

    claim.status = 'Submitted';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'TPA Claim submitted successfully.', claim });
  } catch (error) {
    console.error('Submit TPA Claim Error:', error);
    res.status(500).json({ message: error.message || 'Server error submitting TPA Claim.' });
  }
};

// @desc    Log a TPA Query on a submitted claim
// @route   POST /api/tpa/claims/:id/query
// @access  Private (Admin, SuperAdmin, TPA Desk)
const addClaimQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { queryText, queryDate, queryDocUrl } = req.body;

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({ message: 'Query description / text is required.' });
    }

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (!['Submitted', 'Approved', 'Query Responded'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot add query: Claim is in "${claim.status}" status. Queries can only be logged against Submitted or Approved claims.`
      });
    }

    claim.queryHistory.push({
      queryText: queryText.trim(),
      queryDate: queryDate || new Date(),
      queryDocUrl: queryDocUrl?.trim() || '',
      responseText: '',
      responseDate: null,
      responseDocUrl: '',
      status: 'Open'
    });

    claim.status = 'Under Query';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.status(201).json({ message: 'TPA Query logged successfully. Claim status set to Under Query.', claim });
  } catch (error) {
    console.error('Add Claim Query Error:', error);
    res.status(500).json({ message: error.message || 'Server error logging query.' });
  }
};

// @desc    Respond to an open TPA Query
// @route   PATCH /api/tpa/claims/:id/query/:queryId/respond
// @access  Private (Admin, SuperAdmin, TPA Desk)
const respondToClaimQuery = async (req, res) => {
  try {
    const { id, queryId } = req.params;
    const { responseText, responseDate, responseDocUrl } = req.body;

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ message: 'Hospital response text is required.' });
    }

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (claim.status !== 'Under Query') {
      return res.status(400).json({
        message: `Cannot respond: Claim status is "${claim.status}". Only claims in "Under Query" state can be responded to.`
      });
    }

    const querySubdoc = claim.queryHistory.id(queryId);
    if (!querySubdoc) {
      return res.status(404).json({ message: 'Query record not found on this claim.' });
    }

    if (querySubdoc.status !== 'Open') {
      return res.status(400).json({ message: `Query is already marked as "${querySubdoc.status}".` });
    }

    querySubdoc.responseText = responseText.trim();
    querySubdoc.responseDate = responseDate || new Date();
    if (responseDocUrl) querySubdoc.responseDocUrl = responseDocUrl.trim();
    querySubdoc.status = 'Responded';

    claim.status = 'Query Responded';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'Query response submitted successfully.', claim });
  } catch (error) {
    console.error('Respond To Claim Query Error:', error);
    res.status(500).json({ message: error.message || 'Server error responding to query.' });
  }
};

// @desc    Approve / Sanction TPA Claim
// @route   PATCH /api/tpa/claims/:id/approve
// @access  Private (Admin, SuperAdmin, TPA Desk)
const approveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalAuthorizedAmount, claimedAmount } = req.body;

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (!['Submitted', 'Query Responded'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot approve claim: Claim status is "${claim.status}". Transition is only permitted from Submitted or Query Responded.`
      });
    }

    if (finalAuthorizedAmount !== undefined && Number(finalAuthorizedAmount) >= 0) {
      claim.finalAuthorizedAmount = Number(finalAuthorizedAmount);
    }
    if (claimedAmount !== undefined && Number(claimedAmount) >= 0) {
      claim.claimedAmount = Number(claimedAmount);
    }

    claim.status = 'Approved';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'TPA Claim approved successfully.', claim });
  } catch (error) {
    console.error('Approve TPA Claim Error:', error);
    res.status(500).json({ message: error.message || 'Server error approving claim.' });
  }
};

// @desc    Reject TPA Claim (Terminal state)
// @route   PATCH /api/tpa/claims/:id/reject
// @access  Private (Admin, SuperAdmin, TPA Desk)
const rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (!['Submitted', 'Under Query', 'Query Responded', 'Ready for Submission', 'Draft', 'Documents Pending'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot reject claim: Claim is already in "${claim.status}" state.`
      });
    }

    claim.status = 'Rejected';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'TPA Claim marked as Rejected (Terminal state).', claim });
  } catch (error) {
    console.error('Reject TPA Claim Error:', error);
    res.status(500).json({ message: error.message || 'Server error rejecting claim.' });
  }
};

// @desc    Cancel Claim (Non-terminal states only)
// @route   PATCH /api/tpa/claims/:id/cancel
// @access  Private (Admin, SuperAdmin, TPA Desk)
const cancelClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (['Settled', 'Rejected', 'Cancelled'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot cancel claim: Claim is already in terminal state "${claim.status}".`
      });
    }

    claim.status = 'Cancelled';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'TPA Claim cancelled successfully.', claim });
  } catch (error) {
    console.error('Cancel TPA Claim Error:', error);
    res.status(500).json({ message: error.message || 'Server error cancelling claim.' });
  }
};

// ====================================================================
//                    SETTLEMENT CONTROLLERS
// ====================================================================

// @desc    Record partial settlement on approved claim
// @route   PATCH /api/tpa/claims/:id/partially-settle
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const partiallySettleClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      settledAmount,
      tdsDeducted,
      disallowedAmount,
      netReceivedAmount,
      settlementRef,
      utrNumber,
      settlementDate,
      settlementRemarks
    } = req.body;

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (!['Approved', 'Partially Settled'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot record partial settlement: Claim status is "${claim.status}". Only Approved or Partially Settled claims can receive settlement disbursements.`
      });
    }

    if (settledAmount !== undefined && Number(settledAmount) >= 0) claim.settledAmount = Number(settledAmount);
    if (tdsDeducted !== undefined && Number(tdsDeducted) >= 0) claim.tdsDeducted = Number(tdsDeducted);
    if (disallowedAmount !== undefined && Number(disallowedAmount) >= 0) claim.disallowedAmount = Number(disallowedAmount);
    if (netReceivedAmount !== undefined && Number(netReceivedAmount) >= 0) claim.netReceivedAmount = Number(netReceivedAmount);

    if (settlementRef !== undefined) claim.settlementRef = settlementRef.trim();
    if (utrNumber !== undefined) claim.utrNumber = utrNumber.trim();
    if (settlementDate) claim.settlementDate = settlementDate;
    if (settlementRemarks !== undefined) claim.settlementRemarks = settlementRemarks.trim();

    claim.status = 'Partially Settled';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'Partial settlement recorded successfully.', claim });
  } catch (error) {
    console.error('Partially Settle Claim Error:', error);
    res.status(500).json({ message: error.message || 'Server error recording partial settlement.' });
  }
};

// @desc    Record final settlement and close claim (Terminal state)
// @route   PATCH /api/tpa/claims/:id/settle
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const settleClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      settledAmount,
      tdsDeducted,
      disallowedAmount,
      netReceivedAmount,
      settlementRef,
      utrNumber,
      settlementDate,
      settlementRemarks
    } = req.body;

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (!['Approved', 'Partially Settled'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot settle claim: Claim status is "${claim.status}". Settle is only permitted from Approved or Partially Settled status.`
      });
    }

    if (settledAmount !== undefined && Number(settledAmount) >= 0) claim.settledAmount = Number(settledAmount);
    if (tdsDeducted !== undefined && Number(tdsDeducted) >= 0) claim.tdsDeducted = Number(tdsDeducted);
    if (disallowedAmount !== undefined && Number(disallowedAmount) >= 0) claim.disallowedAmount = Number(disallowedAmount);
    if (netReceivedAmount !== undefined && Number(netReceivedAmount) >= 0) claim.netReceivedAmount = Number(netReceivedAmount);

    if (settlementRef !== undefined) claim.settlementRef = settlementRef.trim();
    if (utrNumber !== undefined) claim.utrNumber = utrNumber.trim();
    claim.settlementDate = settlementDate || new Date();
    if (settlementRemarks !== undefined) claim.settlementRemarks = settlementRemarks.trim();

    claim.status = 'Settled';
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({ message: 'TPA Claim fully settled and closed (Terminal state).', claim });
  } catch (error) {
    console.error('Settle TPA Claim Error:', error);
    res.status(500).json({ message: error.message || 'Server error recording settlement.' });
  }
};

// ====================================================================
//                    DOCUMENT METADATA CONTROLLERS
// ====================================================================

// @desc    Upload document file to Cloudinary and attach metadata to claim
// @route   POST /api/tpa/claims/:id/documents/upload
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const uploadClaimDocument = async (req, res) => {
  let uploadedPublicId = null;
  try {
    const { id } = req.params;
    const { fileData, category, title, fileName } = req.body;

    // 1. Validate required text inputs
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Document title is required.' });
    }
    if (!fileData) {
      return res.status(400).json({ message: 'File payload (Base64 Data URI) is required.' });
    }

    // 2. Validate MIME type and 20MB file size limit
    const validation = parseAndValidateBase64(fileData);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    // 3. Locate claim belonging to tenant
    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) {
      return res.status(404).json({ message: 'TPA Claim record not found.' });
    }

    // 4. Validate claim status (non-terminal states only)
    if (['Settled', 'Cancelled', 'Rejected'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot upload document: Claim is in terminal state "${claim.status}".`
      });
    }

    // 5. Validate category
    const validCategories = [
      'Identity', 'Policy', 'PreAuth', 'Clinical', 'Discharge',
      'Lab', 'Pharmacy', 'Billing', 'ClaimForm', 'Other'
    ];
    const finalCategory = validCategories.includes(category) ? category : 'Other';
    const safeFileName = sanitizeFileName(fileName) || `claim_doc_${Date.now()}.${validation.mimeType.split('/')[1] || 'pdf'}`;

    // 6. Upload to Cloudinary under tenant-scoped folder
    const targetFolder = `hospital_${req.user.hospitalId}/tpa_claims/${claim._id}`;
    const uploadResult = await cloudinary.uploader.upload(fileData, {
      folder: targetFolder,
      resource_type: 'auto'
    });

    uploadedPublicId = uploadResult.public_id;

    // 7. Append document subdocument
    const newDoc = {
      category: finalCategory,
      title: title.trim(),
      fileName: safeFileName,
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      fileType: uploadResult.format || uploadResult.resource_type || validation.mimeType.split('/')[1] || 'pdf',
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    };

    claim.documents.push(newDoc);
    claim.updatedBy = req.user._id;

    await claim.save();

    const savedDoc = claim.documents[claim.documents.length - 1];
    res.status(201).json({
      message: 'Document uploaded and attached successfully.',
      document: savedDoc,
      claim
    });
  } catch (error) {
    console.error('Upload Claim Document Error:', error.message || error);

    // Orphan Cleanup: If Cloudinary upload succeeded but DB save failed, remove from Cloudinary
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'auto' });
      } catch (cleanupErr) {
        console.error('Failed to cleanup orphan Cloudinary asset:', cleanupErr.message || cleanupErr);
      }
    }

    res.status(500).json({ message: error.message || 'Server error uploading claim document.' });
  }
};

// @desc    Add document metadata to claim checklist
// @route   POST /api/tpa/claims/:id/documents
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const addClaimDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, fileUrl, fileName, cloudinaryPublicId, fileType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Document title is required.' });
    }
    if (!fileUrl || !fileUrl.trim()) {
      return res.status(400).json({ message: 'Document file URL is required.' });
    }

    const validCategories = [
      'Identity', 'Policy', 'PreAuth', 'Clinical', 'Discharge',
      'Lab', 'Pharmacy', 'Billing', 'ClaimForm', 'Other'
    ];
    const finalCategory = validCategories.includes(category) ? category : 'Other';

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (['Cancelled', 'Rejected'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot attach document: Claim is in terminal "${claim.status}" state.`
      });
    }

    const newDoc = {
      category: finalCategory,
      title: title.trim(),
      fileName: fileName?.trim() || '',
      fileUrl: fileUrl.trim(),
      cloudinaryPublicId: cloudinaryPublicId?.trim() || '',
      fileType: fileType?.trim() || 'pdf',
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    };

    claim.documents.push(newDoc);
    claim.updatedBy = req.user._id;
    await claim.save();

    const addedDoc = claim.documents[claim.documents.length - 1];

    res.status(201).json({ message: 'Document metadata added successfully.', document: addedDoc, claim });
  } catch (error) {
    console.error('Add Claim Document Error:', error);
    res.status(500).json({ message: error.message || 'Server error adding document metadata.' });
  }
};

// @desc    Remove document metadata from claim and delete asset from Cloudinary
// @route   DELETE /api/tpa/claims/:id/documents/:documentId
// @access  Private (Admin, SuperAdmin, TPA Desk, Billing)
const deleteClaimDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;

    const claim = await TpaClaim.findOne(tenantFilter(req, { _id: id }));
    if (!claim) return res.status(404).json({ message: 'TPA Claim not found.' });

    if (['Settled', 'Cancelled', 'Rejected'].includes(claim.status)) {
      return res.status(400).json({
        message: `Cannot delete document: Claim is in terminal "${claim.status}" state.`
      });
    }

    const docSubdoc = claim.documents.id(documentId);
    if (!docSubdoc) {
      return res.status(404).json({ message: 'Document not found on this claim.' });
    }

    // Attempt Cloudinary asset cleanup if public ID exists
    let cloudDeleted = true;
    if (docSubdoc.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(docSubdoc.cloudinaryPublicId, { resource_type: 'auto' });
      } catch (cloudErr) {
        console.error('Cloudinary Asset Delete Warning:', cloudErr.message || cloudErr);
        cloudDeleted = false;
      }
    }

    claim.documents.pull(documentId);
    claim.updatedBy = req.user._id;
    await claim.save();

    res.json({
      message: cloudDeleted
        ? 'Document removed successfully.'
        : 'Document metadata removed from claim, with cloud cleanup warning.',
      claim
    });
  } catch (error) {
    console.error('Delete Claim Document Error:', error);
    res.status(500).json({ message: error.message || 'Server error removing document metadata.' });
  }
};

module.exports = {
  createClaim,
  getClaims,
  getClaimById,
  updateDraftClaim,
  markDocumentsPending,
  markReadyForSubmission,
  submitClaim,
  addClaimQuery,
  respondToClaimQuery,
  approveClaim,
  rejectClaim,
  cancelClaim,
  partiallySettleClaim,
  settleClaim,
  uploadClaimDocument,
  addClaimDocument,
  deleteClaimDocument
};
