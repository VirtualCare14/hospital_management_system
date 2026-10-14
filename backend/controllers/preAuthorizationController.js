const mongoose = require('mongoose');
const PreAuthorization = require('../models/PreAuthorization');
const PatientInsurance = require('../models/PatientInsurance');
const IpdAdmission = require('../models/IpdAdmission');
const Patient = require('../models/Patient');
const InsuranceCompany = require('../models/InsuranceCompany');
const TpaMaster = require('../models/TpaMaster');

// Helper to escape regex special characters in search input
const escapeRegex = (string = '') => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Multi-tenant filter helper ensuring hospitalId isolation
const tenantFilter = (req, query = {}) => {
  if (!req.user || !req.user.hospitalId) {
    return { ...query, _id: null }; // Failsafe: return empty if no tenant context
  }
  return { ...query, hospitalId: req.user.hospitalId };
};

// ====================================================================
//                 PRE-AUTHORIZATION CONTROLLERS
// ====================================================================

// @desc    Create a new Pre-Authorization request (Draft status)
// @route   POST /api/pre-auth
// @access  Private (Admin, TPA Desk, IPD, Billing)
const createPreAuthorization = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    const {
      patientId,
      ipdAdmissionId,
      patientInsuranceId,
      insuranceCompanyId,
      tpaId,
      claimNumber,
      diagnosis,
      treatmentPlan,
      estimatedStayDays,
      doctorInCharge,
      initialRequestedAmount,
      preauthFormUrl,
      notes
    } = req.body || {};

    // 1. Mandatory ID validations
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

    // 2. Fetch referenced entities within hospital tenant
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

    // 3. Strict cross-patient and cross-reference validation
    if (admission.patientId.toString() !== patientId.toString()) {
      return res.status(400).json({ message: 'The specified IPD Admission does not belong to this patient.' });
    }
    if (insurancePolicy.patientId.toString() !== patientId.toString()) {
      return res.status(400).json({ message: 'The selected Insurance Policy does not belong to this patient.' });
    }
    if (insurancePolicy.insuranceCompanyId.toString() !== insuranceCompanyId.toString()) {
      return res.status(400).json({ message: 'The selected Insurance Company does not match the patient policy record.' });
    }

    // 4. Validate TPA if provided
    let validTpaId = null;
    if (tpaId && tpaId.toString().trim()) {
      if (!mongoose.Types.ObjectId.isValid(tpaId)) {
        return res.status(400).json({ message: 'Invalid TPA Provider ID format.' });
      }
      const tpa = await TpaMaster.findOne({ _id: tpaId, hospitalId });
      if (!tpa) {
        return res.status(404).json({ message: 'TPA Provider not found in hospital records.' });
      }
      validTpaId = tpa._id;
    } else if (insurancePolicy.tpaId) {
      validTpaId = insurancePolicy.tpaId;
    }

    // 5. SINGLE PRIMARY CASHLESS POLICY RULE:
    // Check if an active PreAuthorization already exists for this IPD admission
    const activePreAuth = await PreAuthorization.findOne({
      hospitalId,
      ipdAdmissionId,
      preauthStatus: { $in: ['Draft', 'Submitted', 'Queried', 'Approved', 'Enhancement Requested', 'Final Authorized'] }
    });

    if (activePreAuth) {
      return res.status(409).json({
        message: `An active Pre-Authorization already exists for this IPD admission (Claim: "${activePreAuth.claimNumber || activePreAuth._id}", Status: "${activePreAuth.preauthStatus}"). Only one primary cashless insurance policy is permitted per admission.`,
        existingPreAuthId: activePreAuth._id,
        existingClaimNumber: activePreAuth.claimNumber,
        existingStatus: activePreAuth.preauthStatus
      });
    }

    // 6. Generate claim number if omitted
    let finalClaimNumber = claimNumber?.trim() || '';
    if (!finalClaimNumber) {
      const count = await PreAuthorization.countDocuments({ hospitalId });
      finalClaimNumber = `CLM-${admission.ipdNumber || 'IPD'}-${1001 + count}`;
    }

    const numInitialRequested = Number(initialRequestedAmount) >= 0 ? Number(initialRequestedAmount) : 0;
    const numStayDays = Number(estimatedStayDays) >= 0 ? Number(estimatedStayDays) : 0;

    // Doctor in charge defaults to admission doctor if not passed
    let effectiveDoctor = doctorInCharge && mongoose.Types.ObjectId.isValid(doctorInCharge)
      ? doctorInCharge
      : admission.doctorInCharge;

    const newPreAuth = new PreAuthorization({
      hospitalId,
      patientId,
      ipdAdmissionId,
      patientInsuranceId,
      insuranceCompanyId,
      tpaId: validTpaId,
      claimNumber: finalClaimNumber,
      preauthStatus: 'Draft',
      diagnosis: diagnosis?.trim() || admission.provisionalDiagnosis || '',
      treatmentPlan: treatmentPlan?.trim() || '',
      estimatedStayDays: numStayDays,
      doctorInCharge: effectiveDoctor,
      initialRequestedAmount: numInitialRequested,
      initialApprovedAmount: 0,
      totalApprovedAmount: 0,
      finalAuthorizedAmount: 0,
      copayPercentage: 0,
      copayAmount: 0,
      deductibleAmount: 0,
      nonPayableAmount: 0,
      patientPayableAmount: 0,
      tpaReceivableAmount: 0,
      enhancementHistory: [],
      queryHistory: [],
      preauthFormUrl: preauthFormUrl?.trim() || '',
      notes: notes?.trim() || '',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await newPreAuth.save();

    const populated = await PreAuthorization.findById(newPreAuth._id)
      .populate('patientId', 'uhid patientName mobile gender category dob address')
      .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate status provisionalDiagnosis doctorInCharge roomId bedId')
      .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance validFrom validTill')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail claimEmail tollFreeNumber')
      .populate('tpaId', 'name code preauthEmail contactPhone preauthTatHours')
      .populate('doctorInCharge', 'username doctorName department specialization')
      .populate('createdBy', 'username role');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error creating Pre-Authorization.' });
  }
};

// @desc    List Pre-Authorizations (with filters, search, pagination)
// @route   GET /api/pre-auth
// @access  Private
const getPreAuthorizations = async (req, res) => {
  try {
    const {
      patientId,
      ipdAdmissionId,
      patientInsuranceId,
      insuranceCompanyId,
      tpaId,
      preauthStatus,
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
    if (preauthStatus && preauthStatus.trim()) {
      query.preauthStatus = preauthStatus.trim();
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { claimNumber: { $regex: escaped, $options: 'i' } },
        { diagnosis: { $regex: escaped, $options: 'i' } },
        { treatmentPlan: { $regex: escaped, $options: 'i' } },
        { settlementRef: { $regex: escaped, $options: 'i' } },
        { utrNumber: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Pagination
    if (page || limit) {
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
      const limitVal = Math.max(1, parseInt(limit, 10) || 20);
      const skip = (currentPage - 1) * limitVal;

      const [totalRecords, records] = await Promise.all([
        PreAuthorization.countDocuments(query),
        PreAuthorization.find(query)
          .populate('patientId', 'uhid patientName mobile gender category')
          .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate status provisionalDiagnosis')
          .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance')
          .populate('insuranceCompanyId', 'name code payerType cashlessEmail')
          .populate('tpaId', 'name code preauthEmail contactPhone preauthTatHours')
          .populate('doctorInCharge', 'username doctorName department')
          .populate('createdBy', 'username role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitVal)
          .lean()
      ]);

      const totalPages = Math.ceil(totalRecords / limitVal) || 1;

      return res.status(200).json({
        preAuthorizations: records,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }

    // Unpaginated full list
    const records = await PreAuthorization.find(query)
      .populate('patientId', 'uhid patientName mobile gender category')
      .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate status provisionalDiagnosis')
      .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail')
      .populate('tpaId', 'name code preauthEmail contactPhone preauthTatHours')
      .populate('doctorInCharge', 'username doctorName department')
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(records);
  } catch (error) {
    console.error('Get Pre-Authorizations Error:', error);
    res.status(500).json({ message: 'Server error loading Pre-Authorizations.' });
  }
};

// @desc    Get single Pre-Authorization by ID
// @route   GET /api/pre-auth/:id
// @access  Private
const getPreAuthorizationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }

    const preauth = await PreAuthorization.findOne(tenantFilter(req, { _id: id }))
      .populate('patientId', 'uhid patientName mobile gender category dob address aadhaar')
      .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate status provisionalDiagnosis doctorInCharge roomId bedId guardianName guardianMobile')
      .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance validFrom validTill primaryInsuredName relationshipToPatient')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail claimEmail tollFreeNumber portalUrl settlementTatDays')
      .populate('tpaId', 'name code preauthEmail contactPhone preauthTatHours discountRatePercentage claimsEmail portalUrl')
      .populate('doctorInCharge', 'username doctorName department specialization')
      .populate('createdBy', 'username role')
      .populate('updatedBy', 'username role');

    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    res.status(200).json(preauth);
  } catch (error) {
    console.error('Get Pre-Authorization By ID Error:', error);
    res.status(500).json({ message: 'Server error retrieving Pre-Authorization.' });
  }
};

// @desc    Update Draft Pre-Authorization
// @route   PUT /api/pre-auth/:id
// @access  Private (Admin, TPA Desk)
const updateDraftPreAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    // Status transition safety: only 'Draft' pre-authorizations can be modified through general PUT
    if (preauth.preauthStatus !== 'Draft') {
      return res.status(400).json({
        message: `Only 'Draft' pre-authorizations can be modified directly. Current status is "${preauth.preauthStatus}". Use designated workflow actions (submit, query, enhancement, approval) for active claims.`
      });
    }

    const updateData = { ...(req.body || {}) };

    // Prevent altering core structural identifiers or status via generic PUT
    delete updateData.hospitalId;
    delete updateData.patientId;
    delete updateData.ipdAdmissionId;
    delete updateData.patientInsuranceId;
    delete updateData.insuranceCompanyId;
    delete updateData.preauthStatus;
    delete updateData.enhancementHistory;
    delete updateData.queryHistory;
    delete updateData.createdBy;
    delete updateData._id;

    if (updateData.doctorInCharge && !mongoose.Types.ObjectId.isValid(updateData.doctorInCharge)) {
      delete updateData.doctorInCharge;
    }
    if (updateData.initialRequestedAmount !== undefined && Number(updateData.initialRequestedAmount) < 0) {
      return res.status(400).json({ message: 'Initial requested amount must be non-negative.' });
    }
    if (updateData.estimatedStayDays !== undefined && Number(updateData.estimatedStayDays) < 0) {
      return res.status(400).json({ message: 'Estimated stay days must be non-negative.' });
    }

    updateData.updatedBy = req.user._id;

    const updated = await PreAuthorization.findOneAndUpdate(
      { _id: id, hospitalId },
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('patientId', 'uhid patientName mobile gender category')
      .populate('ipdAdmissionId', 'ipdNumber pidNumber admissionDate status')
      .populate('patientInsuranceId', 'policyNumber memberId policyType sumInsured availableBalance')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail')
      .populate('tpaId', 'name code preauthEmail contactPhone')
      .populate('doctorInCharge', 'username doctorName department');

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update Draft Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error updating draft Pre-Authorization.' });
  }
};

// @desc    Submit Pre-Authorization to TPA (Draft or Queried -> Submitted)
// @route   PATCH /api/pre-auth/:id/submit
// @access  Private (Admin, TPA Desk)
const submitPreAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    const allowedStatuses = ['Draft', 'Queried'];
    if (!allowedStatuses.includes(preauth.preauthStatus)) {
      return res.status(400).json({
        message: `Cannot submit Pre-Authorization from current status "${preauth.preauthStatus}". Allowed initial submission statuses: ${allowedStatuses.join(', ')}.`
      });
    }

    // Optional updates along with submission
    const body = req.body || {};
    if (body.initialRequestedAmount !== undefined && Number(body.initialRequestedAmount) >= 0) {
      preauth.initialRequestedAmount = Number(body.initialRequestedAmount);
    }
    if (body.claimNumber && body.claimNumber.trim()) {
      preauth.claimNumber = body.claimNumber.trim();
    }
    if (body.preauthFormUrl && body.preauthFormUrl.trim()) {
      preauth.preauthFormUrl = body.preauthFormUrl.trim();
    }
    if (body.notes && body.notes.trim()) {
      preauth.notes = body.notes.trim();
    }

    preauth.preauthStatus = 'Submitted';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: 'Pre-Authorization successfully submitted to TPA.',
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Submit Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error submitting Pre-Authorization.' });
  }
};

// @desc    Add TPA Query (Submitted / Enhancement Requested -> Queried)
// @route   POST /api/pre-auth/:id/query
// @access  Private (Admin, TPA Desk)
const addTpaQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { queryText, queryDate, queryDocUrl } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }
    if (!queryText || !queryText.trim()) {
      return res.status(400).json({ message: 'TPA query description text is required.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    const allowedStatuses = ['Submitted', 'Enhancement Requested'];
    if (!allowedStatuses.includes(preauth.preauthStatus)) {
      return res.status(400).json({
        message: `TPA Query can only be logged when pre-authorization is in Submitted or Enhancement Requested status. Current status: "${preauth.preauthStatus}".`
      });
    }

    preauth.queryHistory.push({
      queryText: queryText.trim(),
      queryDate: queryDate ? new Date(queryDate) : new Date(),
      responseText: '',
      responseDate: null,
      queryDocUrl: queryDocUrl?.trim() || '',
      responseDocUrl: '',
      status: 'Open'
    });

    preauth.preauthStatus = 'Queried';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: 'TPA query recorded successfully. Pre-authorization status changed to Queried.',
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Add TPA Query Error:', error);
    res.status(500).json({ message: error.message || 'Server error adding TPA query.' });
  }
};

// @desc    Respond to TPA Query (Queried -> Submitted when all queries addressed)
// @route   PATCH /api/pre-auth/:id/query/:queryId/respond
// @access  Private (Admin, TPA Desk)
const respondToTpaQuery = async (req, res) => {
  try {
    const { id, queryId } = req.params;
    const { responseText, responseDate, responseDocUrl } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(queryId)) {
      return res.status(400).json({ message: 'Invalid ID format.' });
    }
    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ message: 'Response text is required.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    const queryItem = preauth.queryHistory.id(queryId);
    if (!queryItem) {
      return res.status(404).json({ message: 'Specified query item not found in query history.' });
    }

    queryItem.responseText = responseText.trim();
    queryItem.responseDate = responseDate ? new Date(responseDate) : new Date();
    if (responseDocUrl && responseDocUrl.trim()) {
      queryItem.responseDocUrl = responseDocUrl.trim();
    }
    queryItem.status = 'Responded';

    // If no remaining Open queries, transition status back to Submitted
    const hasRemainingOpen = preauth.queryHistory.some(q => q.status === 'Open');
    if (!hasRemainingOpen && preauth.preauthStatus === 'Queried') {
      preauth.preauthStatus = 'Submitted';
    }

    preauth.updatedBy = req.user._id;
    await preauth.save();

    res.status(200).json({
      message: 'Response to TPA query saved successfully.',
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Respond to TPA Query Error:', error);
    res.status(500).json({ message: error.message || 'Server error responding to TPA query.' });
  }
};

// @desc    Approve Initial Pre-Authorization (Submitted / Queried -> Approved)
// @route   PATCH /api/pre-auth/:id/approve
// @access  Private (Admin, TPA Desk)
const approveInitialPreAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount, tpaApprovalLetterUrl, claimNumber, notes } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }
    if (approvedAmount === undefined || Number(approvedAmount) < 0) {
      return res.status(400).json({ message: 'Approved amount must be a non-negative number.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    const allowedStatuses = ['Submitted', 'Queried'];
    if (!allowedStatuses.includes(preauth.preauthStatus)) {
      return res.status(400).json({
        message: `Initial Pre-Authorization can only be approved from Submitted or Queried status. Current status: "${preauth.preauthStatus}".`
      });
    }

    const numApproved = Number(approvedAmount);
    preauth.initialApprovedAmount = numApproved;
    preauth.totalApprovedAmount = numApproved;

    if (tpaApprovalLetterUrl && tpaApprovalLetterUrl.trim()) {
      preauth.tpaApprovalLetterUrl = tpaApprovalLetterUrl.trim();
    }
    if (claimNumber && claimNumber.trim()) {
      preauth.claimNumber = claimNumber.trim();
    }
    if (notes && notes.trim()) {
      preauth.notes = notes.trim();
    }

    // Auto-close any lingering queries
    preauth.queryHistory.forEach(q => {
      if (q.status === 'Open' || q.status === 'Responded') {
        q.status = 'Closed';
      }
    });

    preauth.preauthStatus = 'Approved';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: `Pre-Authorization approved successfully for ₹${numApproved.toLocaleString('en-IN')}.`,
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Approve Initial Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error approving Pre-Authorization.' });
  }
};

// @desc    Request Pre-Authorization Enhancement (Approved -> Enhancement Requested)
// @route   POST /api/pre-auth/:id/enhancement
// @access  Private (Admin, TPA Desk)
const requestEnhancement = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedAmount, remarks, requestedAt } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }
    if (!requestedAmount || Number(requestedAmount) <= 0) {
      return res.status(400).json({ message: 'Requested enhancement amount must be greater than 0.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    if (preauth.preauthStatus !== 'Approved') {
      return res.status(400).json({
        message: `Enhancement can only be requested on an Approved Pre-Authorization. Current status: "${preauth.preauthStatus}".`
      });
    }

    preauth.enhancementHistory.push({
      requestedAmount: Number(requestedAmount),
      approvedAmount: 0,
      requestedAt: requestedAt ? new Date(requestedAt) : new Date(),
      approvedAt: null,
      remarks: remarks?.trim() || '',
      status: 'Requested'
    });

    preauth.preauthStatus = 'Enhancement Requested';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: 'Enhancement requested successfully. Status updated to Enhancement Requested.',
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Request Enhancement Error:', error);
    res.status(500).json({ message: error.message || 'Server error requesting enhancement.' });
  }
};

// @desc    Approve Enhancement (Enhancement Requested / Approved -> Approved)
// @route   PATCH /api/pre-auth/:id/enhancement/:enhancementId/approve
// @access  Private (Admin, TPA Desk)
const approveEnhancement = async (req, res) => {
  try {
    const { id, enhancementId } = req.params;
    const { approvedAmount, remarks, approvedAt } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(enhancementId)) {
      return res.status(400).json({ message: 'Invalid ID format.' });
    }
    if (approvedAmount === undefined || Number(approvedAmount) < 0) {
      return res.status(400).json({ message: 'Approved amount must be a non-negative number.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    const enhancement = preauth.enhancementHistory.id(enhancementId);
    if (!enhancement) {
      return res.status(404).json({ message: 'Specified enhancement record not found.' });
    }

    const numApproved = Number(approvedAmount);
    enhancement.approvedAmount = numApproved;
    enhancement.approvedAt = approvedAt ? new Date(approvedAt) : new Date();
    enhancement.status = 'Approved';
    if (remarks && remarks.trim()) {
      enhancement.remarks = remarks.trim();
    }

    // Recalculate totalApprovedAmount safely without overwriting previous history
    const totalEnhancementsApproved = preauth.enhancementHistory
      .filter(e => e.status === 'Approved')
      .reduce((sum, e) => sum + (Number(e.approvedAmount) || 0), 0);

    preauth.totalApprovedAmount = (Number(preauth.initialApprovedAmount) || 0) + totalEnhancementsApproved;
    preauth.preauthStatus = 'Approved';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: `Enhancement approved for ₹${numApproved.toLocaleString('en-IN')}. New Total Approved: ₹${preauth.totalApprovedAmount.toLocaleString('en-IN')}.`,
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Approve Enhancement Error:', error);
    res.status(500).json({ message: error.message || 'Server error approving enhancement.' });
  }
};

// @desc    Reject Pre-Authorization (Submitted / Queried / Enhancement Requested -> Rejected)
// @route   PATCH /api/pre-auth/:id/reject
// @access  Private (Admin, TPA Desk)
const rejectPreAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, denialLetterUrl } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    const allowedStatuses = ['Submitted', 'Queried', 'Enhancement Requested'];
    if (!allowedStatuses.includes(preauth.preauthStatus)) {
      return res.status(400).json({
        message: `Cannot reject Pre-Authorization from current status "${preauth.preauthStatus}". Allowed statuses: ${allowedStatuses.join(', ')}.`
      });
    }

    preauth.rejectionReason = rejectionReason.trim();
    if (denialLetterUrl && denialLetterUrl.trim()) {
      preauth.denialLetterUrl = denialLetterUrl.trim();
    }
    preauth.preauthStatus = 'Rejected';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: 'Pre-Authorization has been marked as Rejected.',
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Reject Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error rejecting Pre-Authorization.' });
  }
};

// @desc    Final Authorization at Discharge (Approved -> Final Authorized)
// @route   PATCH /api/pre-auth/:id/final-authorize
// @access  Private (Admin, TPA Desk)
const finalAuthorizePreAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      finalAuthorizedAmount,
      copayPercentage,
      copayAmount,
      deductibleAmount,
      nonPayableAmount,
      patientPayableAmount,
      tpaReceivableAmount,
      finalAuthLetterUrl,
      notes
    } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }
    if (finalAuthorizedAmount === undefined || Number(finalAuthorizedAmount) < 0) {
      return res.status(400).json({ message: 'Final authorized amount must be a non-negative number.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    if (preauth.preauthStatus !== 'Approved') {
      return res.status(400).json({
        message: `Final authorization can only be performed on an Approved Pre-Authorization. Current status: "${preauth.preauthStatus}".`
      });
    }

    // Financial breakdown validation
    const numFinalAuthorized = Number(finalAuthorizedAmount);
    const numCopayPercent = copayPercentage !== undefined ? Math.min(100, Math.max(0, Number(copayPercentage))) : 0;
    const numCopayAmount = copayAmount !== undefined ? Math.max(0, Number(copayAmount)) : 0;
    const numDeductible = deductibleAmount !== undefined ? Math.max(0, Number(deductibleAmount)) : 0;
    const numNonPayable = nonPayableAmount !== undefined ? Math.max(0, Number(nonPayableAmount)) : 0;
    const numPatientPayable = patientPayableAmount !== undefined ? Math.max(0, Number(patientPayableAmount)) : 0;
    const numTpaReceivable = tpaReceivableAmount !== undefined ? Math.max(0, Number(tpaReceivableAmount)) : numFinalAuthorized;

    preauth.finalAuthorizedAmount = numFinalAuthorized;
    preauth.copayPercentage = numCopayPercent;
    preauth.copayAmount = numCopayAmount;
    preauth.deductibleAmount = numDeductible;
    preauth.nonPayableAmount = numNonPayable; // Manual entry as per Phase 2 specification
    preauth.patientPayableAmount = numPatientPayable;
    preauth.tpaReceivableAmount = numTpaReceivable;

    if (finalAuthLetterUrl && finalAuthLetterUrl.trim()) {
      preauth.finalAuthLetterUrl = finalAuthLetterUrl.trim();
    }
    if (notes && notes.trim()) {
      preauth.notes = notes.trim();
    }

    preauth.preauthStatus = 'Final Authorized';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: `Final Authorization completed for ₹${numFinalAuthorized.toLocaleString('en-IN')}. Status changed to Final Authorized.`,
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Final Authorize Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error executing final authorization.' });
  }
};

// @desc    Mark Claim Settled (Final Authorized -> Settled)
// @route   PATCH /api/pre-auth/:id/settle
// @access  Private (Admin, TPA Desk, Billing)
const settlePreAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    const { settledAmount, settlementRef, utrNumber, tdsDeducted, settledAt, notes } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }
    if (settledAmount === undefined || Number(settledAmount) < 0) {
      return res.status(400).json({ message: 'Settled amount must be a non-negative number.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    if (preauth.preauthStatus !== 'Final Authorized') {
      return res.status(400).json({
        message: `Claim can only be settled after Final Authorization. Current status: "${preauth.preauthStatus}".`
      });
    }

    preauth.settledAmount = Number(settledAmount);
    preauth.settlementRef = settlementRef?.trim() || '';
    preauth.utrNumber = utrNumber?.trim() || '';
    preauth.tdsDeducted = tdsDeducted !== undefined && Number(tdsDeducted) >= 0 ? Number(tdsDeducted) : 0;
    preauth.settledAt = settledAt ? new Date(settledAt) : new Date();

    if (notes && notes.trim()) {
      preauth.notes = notes.trim();
    }

    preauth.preauthStatus = 'Settled';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: `Pre-Authorization claim marked as Settled for ₹${Number(settledAmount).toLocaleString('en-IN')}.`,
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Settle Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error settling claim.' });
  }
};

// @desc    Cancel Pre-Authorization
// @route   PATCH /api/pre-auth/:id/cancel
// @access  Private (Admin, TPA Desk)
const cancelPreAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pre-Authorization ID format.' });
    }
    if (!cancellationReason || !cancellationReason.trim()) {
      return res.status(400).json({ message: 'Cancellation reason is required.' });
    }

    const hospitalId = req.user.hospitalId;
    const preauth = await PreAuthorization.findOne({ _id: id, hospitalId });
    if (!preauth) {
      return res.status(404).json({ message: 'Pre-Authorization record not found.' });
    }

    const nonCancellableStatuses = ['Settled', 'Rejected', 'Cancelled'];
    if (nonCancellableStatuses.includes(preauth.preauthStatus)) {
      return res.status(400).json({
        message: `Cannot cancel Pre-Authorization with status "${preauth.preauthStatus}". Terminal states cannot be cancelled.`
      });
    }

    preauth.cancellationReason = cancellationReason.trim();
    preauth.cancelledAt = new Date();
    preauth.preauthStatus = 'Cancelled';
    preauth.updatedBy = req.user._id;

    await preauth.save();

    res.status(200).json({
      message: 'Pre-Authorization has been cancelled.',
      preAuthorization: preauth
    });
  } catch (error) {
    console.error('Cancel Pre-Authorization Error:', error);
    res.status(500).json({ message: error.message || 'Server error cancelling Pre-Authorization.' });
  }
};

module.exports = {
  createPreAuthorization,
  getPreAuthorizations,
  getPreAuthorizationById,
  updateDraftPreAuthorization,
  submitPreAuthorization,
  addTpaQuery,
  respondToTpaQuery,
  approveInitialPreAuthorization,
  requestEnhancement,
  approveEnhancement,
  rejectPreAuthorization,
  finalAuthorizePreAuthorization,
  settlePreAuthorization,
  cancelPreAuthorization
};
