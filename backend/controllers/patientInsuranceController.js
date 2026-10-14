const mongoose = require('mongoose');
const PatientInsurance = require('../models/PatientInsurance');
const PreAuthorization = require('../models/PreAuthorization');
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
//                 PATIENT INSURANCE CONTROLLERS
// ====================================================================

// @desc    Create a new patient insurance policy
// @route   POST /api/patient-insurance
// @access  Private (Admin, TPA, Reception, Billing, IPD)
const createPatientInsurance = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    const {
      patientId,
      insuranceCompanyId,
      tpaId,
      policyNumber,
      memberId,
      policyType,
      primaryInsuredName,
      relationshipToPatient,
      corporateName,
      employeeId,
      sumInsured,
      availableBalance,
      validFrom,
      validTill,
      cardImageUrl,
      cardImagePublicId,
      notes
    } = req.body;

    // 1. Mandatory field validation
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Valid Patient ID is required.' });
    }
    if (!insuranceCompanyId || !mongoose.Types.ObjectId.isValid(insuranceCompanyId)) {
      return res.status(400).json({ message: 'Valid Insurance Company ID is required.' });
    }
    if (!policyNumber || !policyNumber.trim()) {
      return res.status(400).json({ message: 'Policy Number is required.' });
    }
    if (!memberId || !memberId.trim()) {
      return res.status(400).json({ message: 'Member / TPA Card ID is required.' });
    }

    // 2. Multi-tenant entity verification
    const [patient, insuranceCompany] = await Promise.all([
      Patient.findOne({ _id: patientId, hospitalId }),
      InsuranceCompany.findOne({ _id: insuranceCompanyId, hospitalId })
    ]);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found in this hospital records.' });
    }
    if (!insuranceCompany) {
      return res.status(404).json({ message: 'Insurance Company not found in this hospital records.' });
    }

    // 3. TPA verification if provided
    let validTpaId = null;
    if (tpaId && tpaId.toString().trim()) {
      if (!mongoose.Types.ObjectId.isValid(tpaId)) {
        return res.status(400).json({ message: 'Invalid TPA ID format.' });
      }
      const tpa = await TpaMaster.findOne({ _id: tpaId, hospitalId });
      if (!tpa) {
        return res.status(404).json({ message: 'TPA Provider not found in this hospital records.' });
      }
      validTpaId = tpa._id;
    }

    // 4. Enum validation
    const validPolicyTypes = ['Individual', 'Family Floater', 'Corporate / Group', 'Government Scheme'];
    if (policyType && !validPolicyTypes.includes(policyType)) {
      return res.status(400).json({ message: `Invalid policy type. Must be one of: ${validPolicyTypes.join(', ')}` });
    }

    const validRelationships = ['Self', 'Spouse', 'Child', 'Parent', 'Other'];
    if (relationshipToPatient && !validRelationships.includes(relationshipToPatient)) {
      return res.status(400).json({ message: `Invalid relationship to patient. Must be one of: ${validRelationships.join(', ')}` });
    }

    // 5. Date validation
    let parsedValidFrom = validFrom ? new Date(validFrom) : null;
    let parsedValidTill = validTill ? new Date(validTill) : null;

    if (parsedValidFrom && isNaN(parsedValidFrom.getTime())) {
      return res.status(400).json({ message: 'Invalid validFrom date format.' });
    }
    if (parsedValidTill && isNaN(parsedValidTill.getTime())) {
      return res.status(400).json({ message: 'Invalid validTill date format.' });
    }
    if (parsedValidFrom && parsedValidTill && parsedValidTill < parsedValidFrom) {
      return res.status(400).json({ message: 'Policy validTill date cannot be earlier than validFrom date.' });
    }

    // 6. Monetary amount validation
    const numSumInsured = Number(sumInsured) >= 0 ? Number(sumInsured) : 0;
    const numAvailableBalance = availableBalance !== undefined && Number(availableBalance) >= 0
      ? Number(availableBalance)
      : numSumInsured;

    // 7. Duplicate policy check per patient in hospital
    const duplicate = await PatientInsurance.findOne({
      hospitalId,
      patientId,
      policyNumber: policyNumber.trim(),
      memberId: memberId.trim()
    });
    if (duplicate) {
      return res.status(400).json({ message: 'A policy with this policy number and member ID already exists for this patient.' });
    }

    // 8. Create document
    const newPolicy = new PatientInsurance({
      hospitalId,
      patientId,
      insuranceCompanyId,
      tpaId: validTpaId,
      policyNumber: policyNumber.trim(),
      memberId: memberId.trim(),
      policyType: policyType || 'Individual',
      primaryInsuredName: primaryInsuredName?.trim() || patient.patientName || '',
      relationshipToPatient: relationshipToPatient || 'Self',
      corporateName: corporateName?.trim() || '',
      employeeId: employeeId?.trim() || '',
      sumInsured: numSumInsured,
      availableBalance: numAvailableBalance,
      validFrom: parsedValidFrom,
      validTill: parsedValidTill,
      cardImageUrl: cardImageUrl?.trim() || '',
      cardImagePublicId: cardImagePublicId?.trim() || '',
      isActive: true,
      notes: notes?.trim() || '',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await newPolicy.save();

    const populated = await PatientInsurance.findById(newPolicy._id)
      .populate('patientId', 'uhid patientName mobile gender category')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail claimEmail tollFreeNumber')
      .populate('tpaId', 'name code preauthEmail contactPhone');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create Patient Insurance Error:', error);
    res.status(500).json({ message: error.message || 'Server error creating patient insurance policy.' });
  }
};

// @desc    List patient insurance policies (with search, filter, pagination)
// @route   GET /api/patient-insurance
// @access  Private
const getPatientInsurances = async (req, res) => {
  try {
    const {
      patientId,
      insuranceCompanyId,
      tpaId,
      isActive,
      search,
      page,
      limit
    } = req.query;

    let query = tenantFilter(req);

    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      query.patientId = patientId;
    }

    if (insuranceCompanyId && mongoose.Types.ObjectId.isValid(insuranceCompanyId)) {
      query.insuranceCompanyId = insuranceCompanyId;
    }

    if (tpaId && mongoose.Types.ObjectId.isValid(tpaId)) {
      query.tpaId = tpaId;
    }

    if (isActive === 'true' || isActive === true) {
      query.isActive = true;
    } else if (isActive === 'false' || isActive === false) {
      query.isActive = false;
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { policyNumber: { $regex: escaped, $options: 'i' } },
        { memberId: { $regex: escaped, $options: 'i' } },
        { primaryInsuredName: { $regex: escaped, $options: 'i' } },
        { corporateName: { $regex: escaped, $options: 'i' } },
        { employeeId: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Pagination
    if (page || limit) {
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
      const limitVal = Math.max(1, parseInt(limit, 10) || 20);
      const skip = (currentPage - 1) * limitVal;

      const [totalRecords, policies] = await Promise.all([
        PatientInsurance.countDocuments(query),
        PatientInsurance.find(query)
          .populate('patientId', 'uhid patientName mobile gender category')
          .populate('insuranceCompanyId', 'name code payerType cashlessEmail claimEmail tollFreeNumber')
          .populate('tpaId', 'name code preauthEmail contactPhone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitVal)
          .lean()
      ]);

      const totalPages = Math.ceil(totalRecords / limitVal) || 1;

      return res.status(200).json({
        patientInsurances: policies,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }

    // Unpaginated full list
    const policies = await PatientInsurance.find(query)
      .populate('patientId', 'uhid patientName mobile gender category')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail claimEmail tollFreeNumber')
      .populate('tpaId', 'name code preauthEmail contactPhone')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(policies);
  } catch (error) {
    console.error('Get Patient Insurances Error:', error);
    res.status(500).json({ message: 'Server error loading patient insurance records.' });
  }
};

// @desc    Get single patient insurance policy by ID
// @route   GET /api/patient-insurance/:id
// @access  Private
const getPatientInsuranceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance policy ID format.' });
    }

    const policy = await PatientInsurance.findOne(tenantFilter(req, { _id: id }))
      .populate('patientId', 'uhid patientName mobile gender category address dob')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail claimEmail tollFreeNumber portalUrl settlementTatDays')
      .populate('tpaId', 'name code preauthEmail contactPhone preauthTatHours discountRatePercentage');

    if (!policy) {
      return res.status(404).json({ message: 'Patient insurance policy not found.' });
    }

    res.status(200).json(policy);
  } catch (error) {
    console.error('Get Patient Insurance By ID Error:', error);
    res.status(500).json({ message: 'Server error retrieving insurance policy.' });
  }
};

// @desc    Update an existing patient insurance policy
// @route   PUT /api/patient-insurance/:id
// @access  Private (Admin, TPA, Reception, Billing)
const updatePatientInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance policy ID format.' });
    }

    const hospitalId = req.user.hospitalId;
    const policy = await PatientInsurance.findOne({ _id: id, hospitalId });
    if (!policy) {
      return res.status(404).json({ message: 'Patient insurance policy not found.' });
    }

    const updateData = { ...req.body };

    // Prevent overriding tenant boundary or primary references
    delete updateData.hospitalId;
    delete updateData.patientId;
    delete updateData.createdBy;
    delete updateData._id;

    // Verify insurance company if changing
    if (updateData.insuranceCompanyId && updateData.insuranceCompanyId.toString() !== policy.insuranceCompanyId.toString()) {
      if (!mongoose.Types.ObjectId.isValid(updateData.insuranceCompanyId)) {
        return res.status(400).json({ message: 'Invalid insurance company ID format.' });
      }
      const company = await InsuranceCompany.findOne({ _id: updateData.insuranceCompanyId, hospitalId });
      if (!company) {
        return res.status(404).json({ message: 'Specified insurance company not found in hospital records.' });
      }
    }

    // Verify TPA if changing
    if (updateData.tpaId !== undefined) {
      if (updateData.tpaId && updateData.tpaId.toString().trim()) {
        if (!mongoose.Types.ObjectId.isValid(updateData.tpaId)) {
          return res.status(400).json({ message: 'Invalid TPA ID format.' });
        }
        const tpa = await TpaMaster.findOne({ _id: updateData.tpaId, hospitalId });
        if (!tpa) {
          return res.status(404).json({ message: 'Specified TPA provider not found in hospital records.' });
        }
      } else {
        updateData.tpaId = null;
      }
    }

    // Enum validations
    const validPolicyTypes = ['Individual', 'Family Floater', 'Corporate / Group', 'Government Scheme'];
    if (updateData.policyType && !validPolicyTypes.includes(updateData.policyType)) {
      return res.status(400).json({ message: `Invalid policy type. Must be one of: ${validPolicyTypes.join(', ')}` });
    }

    const validRelationships = ['Self', 'Spouse', 'Child', 'Parent', 'Other'];
    if (updateData.relationshipToPatient && !validRelationships.includes(updateData.relationshipToPatient)) {
      return res.status(400).json({ message: `Invalid relationship to patient. Must be one of: ${validRelationships.join(', ')}` });
    }

    // Date validations
    const effectiveValidFrom = updateData.validFrom !== undefined ? updateData.validFrom : policy.validFrom;
    const effectiveValidTill = updateData.validTill !== undefined ? updateData.validTill : policy.validTill;

    if (effectiveValidFrom && effectiveValidTill) {
      const fromDate = new Date(effectiveValidFrom);
      const tillDate = new Date(effectiveValidTill);
      if (tillDate < fromDate) {
        return res.status(400).json({ message: 'Policy validTill date cannot be earlier than validFrom date.' });
      }
    }

    // Amount validations
    if (updateData.sumInsured !== undefined && Number(updateData.sumInsured) < 0) {
      return res.status(400).json({ message: 'Sum insured must be non-negative.' });
    }
    if (updateData.availableBalance !== undefined && Number(updateData.availableBalance) < 0) {
      return res.status(400).json({ message: 'Available balance must be non-negative.' });
    }

    updateData.updatedBy = req.user._id;

    const updated = await PatientInsurance.findOneAndUpdate(
      { _id: id, hospitalId },
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    )
      .populate('patientId', 'uhid patientName mobile gender category')
      .populate('insuranceCompanyId', 'name code payerType cashlessEmail claimEmail tollFreeNumber')
      .populate('tpaId', 'name code preauthEmail contactPhone');

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update Patient Insurance Error:', error);
    res.status(500).json({ message: error.message || 'Server error updating insurance policy.' });
  }
};

// @desc    Toggle active status of patient insurance policy
// @route   PATCH /api/patient-insurance/:id/status
// @access  Private (Admin, TPA, Reception, Billing)
const togglePatientInsuranceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance policy ID format.' });
    }

    const policy = await PatientInsurance.findOne(tenantFilter(req, { _id: id }));
    if (!policy) {
      return res.status(404).json({ message: 'Patient insurance policy not found.' });
    }

    const newStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !policy.isActive;
    policy.isActive = newStatus;
    policy.updatedBy = req.user._id;
    await policy.save();

    res.status(200).json({
      message: `Patient insurance policy ${policy.isActive ? 'activated' : 'deactivated'} successfully.`,
      patientInsurance: policy
    });
  } catch (error) {
    console.error('Toggle Patient Insurance Status Error:', error);
    res.status(500).json({ message: 'Server error updating policy status.' });
  }
};

// @desc    Delete patient insurance policy (with PreAuthorization safety check)
// @route   DELETE /api/patient-insurance/:id
// @access  Private (Admin Only)
const deletePatientInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance policy ID format.' });
    }

    const hospitalId = req.user.hospitalId;

    const policy = await PatientInsurance.findOne({ _id: id, hospitalId });
    if (!policy) {
      return res.status(404).json({ message: 'Patient insurance policy not found.' });
    }

    // Safety determination: Check if policy is referenced by any PreAuthorization record
    const linkedPreAuth = await PreAuthorization.findOne({
      hospitalId,
      patientInsuranceId: id
    });

    if (linkedPreAuth) {
      return res.status(400).json({
        message: `Cannot delete policy: This policy is linked to Pre-Authorization claim "${linkedPreAuth.claimNumber || linkedPreAuth._id}". Deactivate the policy instead of deleting it to preserve audit history.`,
        hasPreAuthReference: true
      });
    }

    await PatientInsurance.findOneAndDelete({ _id: id, hospitalId });

    res.status(200).json({ message: 'Patient insurance policy deleted successfully.' });
  } catch (error) {
    console.error('Delete Patient Insurance Error:', error);
    res.status(500).json({ message: 'Server error deleting insurance policy.' });
  }
};

module.exports = {
  createPatientInsurance,
  getPatientInsurances,
  getPatientInsuranceById,
  updatePatientInsurance,
  togglePatientInsuranceStatus,
  deletePatientInsurance
};
