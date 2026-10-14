const mongoose = require('mongoose');
const InsuranceCompany = require('../models/InsuranceCompany');
const TpaMaster = require('../models/TpaMaster');

// Helper to escape regex special characters in user input
const escapeRegex = (string = '') => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Multi-tenant filter helper ensuring hospitalId isolation
const tenantFilter = (req, query = {}) => {
  if (!req.user || !req.user.hospitalId) {
    return { ...query, _id: null }; // Failsafe: return empty if no tenant context
  }
  return { ...query, hospitalId: req.user.hospitalId };
};

// ====================================================================
//                    INSURANCE COMPANY CONTROLLERS
// ====================================================================

// @desc    Get all insurance companies (with search, filter, pagination)
// @route   GET /api/tpa/insurance-companies
// @access  Private
const getInsuranceCompanies = async (req, res) => {
  try {
    const { search, payerType, status, page, limit } = req.query;
    let query = tenantFilter(req);

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (payerType && payerType.trim()) {
      query.payerType = payerType.trim();
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { code: { $regex: escaped, $options: 'i' } },
        { tollFreeNumber: { $regex: escaped, $options: 'i' } },
        { claimEmail: { $regex: escaped, $options: 'i' } },
        { cashlessEmail: { $regex: escaped, $options: 'i' } },
        { city: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Check if pagination is requested
    if (page || limit) {
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
      const limitVal = Math.max(1, parseInt(limit, 10) || 20);
      const skip = (currentPage - 1) * limitVal;

      const [totalRecords, companies] = await Promise.all([
        InsuranceCompany.countDocuments(query),
        InsuranceCompany.find(query)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limitVal)
          .lean()
      ]);

      const totalPages = Math.ceil(totalRecords / limitVal) || 1;

      return res.status(200).json({
        insuranceCompanies: companies,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }

    // Default: return list sorted by name
    const companies = await InsuranceCompany.find(query).sort({ name: 1 }).lean();
    res.status(200).json(companies);
  } catch (error) {
    console.error('Get Insurance Companies Error:', error);
    res.status(500).json({ message: 'Server error loading insurance companies.' });
  }
};

// @desc    Get lightweight list of active insurance companies (for dropdowns)
// @route   GET /api/tpa/insurance-companies/active
// @access  Private
const getActiveInsuranceCompanies = async (req, res) => {
  try {
    const query = tenantFilter(req, { isActive: true });
    const companies = await InsuranceCompany.find(query)
      .select('_id name code payerType cashlessEmail claimEmail hasInHouseTpa settlementTatDays')
      .sort({ name: 1 })
      .lean();
    res.status(200).json(companies);
  } catch (error) {
    console.error('Get Active Insurance Companies Error:', error);
    res.status(500).json({ message: 'Server error loading active insurance companies.' });
  }
};

// @desc    Get single insurance company by ID
// @route   GET /api/tpa/insurance-companies/:id
// @access  Private
const getInsuranceCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance company ID format.' });
    }

    const company = await InsuranceCompany.findOne(tenantFilter(req, { _id: id }));
    if (!company) {
      return res.status(404).json({ message: 'Insurance company not found.' });
    }

    res.status(200).json(company);
  } catch (error) {
    console.error('Get Insurance Company By ID Error:', error);
    res.status(500).json({ message: 'Server error retrieving insurance company.' });
  }
};

// @desc    Create a new insurance company
// @route   POST /api/tpa/insurance-companies
// @access  Private (Admin / TPA Desk)
const createInsuranceCompany = async (req, res) => {
  try {
    const {
      name,
      code,
      payerType,
      tollFreeNumber,
      claimEmail,
      cashlessEmail,
      portalUrl,
      address,
      city,
      state,
      pincode,
      gstin,
      panNumber,
      hasInHouseTpa,
      settlementTatDays,
      notes
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Insurance Company Name is required.' });
    }

    const hospitalId = req.user.hospitalId;
    const trimmedName = name.trim();

    // Check unique name per hospital (case-insensitive)
    const existingName = await InsuranceCompany.findOne({
      hospitalId,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
    });
    if (existingName) {
      return res.status(400).json({ message: 'An insurance company with this name already exists in your hospital records.' });
    }

    // Generate code if not provided
    let finalCode = code && code.trim() ? code.trim().toUpperCase() : '';
    if (!finalCode) {
      const count = await InsuranceCompany.countDocuments({ hospitalId });
      finalCode = `INS-${1001 + count}`;
    } else {
      // Check unique code per hospital
      const existingCode = await InsuranceCompany.findOne({
        hospitalId,
        code: finalCode
      });
      if (existingCode) {
        return res.status(400).json({ message: 'An insurance company with this code already exists.' });
      }
    }

    const newCompany = new InsuranceCompany({
      hospitalId,
      name: trimmedName,
      code: finalCode,
      payerType: payerType || 'Private',
      tollFreeNumber: tollFreeNumber?.trim() || '',
      claimEmail: claimEmail?.trim().toLowerCase() || '',
      cashlessEmail: cashlessEmail?.trim().toLowerCase() || '',
      portalUrl: portalUrl?.trim() || '',
      address: address?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      pincode: pincode?.trim() || '',
      gstin: gstin?.trim() || '',
      panNumber: panNumber?.trim() || '',
      hasInHouseTpa: Boolean(hasInHouseTpa),
      settlementTatDays: Number(settlementTatDays) > 0 ? Number(settlementTatDays) : 30,
      notes: notes?.trim() || '',
      isActive: true,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    console.error('Create Insurance Company Error:', error);
    res.status(500).json({ message: error.message || 'Server error creating insurance company.' });
  }
};

// @desc    Update an existing insurance company
// @route   PUT /api/tpa/insurance-companies/:id
// @access  Private (Admin / TPA Desk)
const updateInsuranceCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance company ID format.' });
    }

    const hospitalId = req.user.hospitalId;
    const updateData = { ...req.body };

    // Prevent overriding tenant boundary or primary keys
    delete updateData.hospitalId;
    delete updateData.createdBy;
    delete updateData._id;

    if (updateData.name && updateData.name.trim()) {
      const trimmedName = updateData.name.trim();
      const existingName = await InsuranceCompany.findOne({
        hospitalId,
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
      });
      if (existingName) {
        return res.status(400).json({ message: 'Another insurance company with this name already exists.' });
      }
      updateData.name = trimmedName;
    }

    if (updateData.code && updateData.code.trim()) {
      const finalCode = updateData.code.trim().toUpperCase();
      const existingCode = await InsuranceCompany.findOne({
        hospitalId,
        _id: { $ne: id },
        code: finalCode
      });
      if (existingCode) {
        return res.status(400).json({ message: 'Another insurance company with this code already exists.' });
      }
      updateData.code = finalCode;
    }

    if (updateData.claimEmail !== undefined) {
      updateData.claimEmail = updateData.claimEmail.trim().toLowerCase();
    }
    if (updateData.cashlessEmail !== undefined) {
      updateData.cashlessEmail = updateData.cashlessEmail.trim().toLowerCase();
    }

    updateData.updatedBy = req.user._id;

    const company = await InsuranceCompany.findOneAndUpdate(
      { _id: id, hospitalId },
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Insurance company not found.' });
    }

    res.status(200).json(company);
  } catch (error) {
    console.error('Update Insurance Company Error:', error);
    res.status(500).json({ message: error.message || 'Server error updating insurance company.' });
  }
};

// @desc    Toggle active status of insurance company
// @route   PATCH /api/tpa/insurance-companies/:id/status
// @access  Private (Admin / TPA Desk)
const toggleInsuranceCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance company ID format.' });
    }

    const company = await InsuranceCompany.findOne(tenantFilter(req, { _id: id }));
    if (!company) {
      return res.status(404).json({ message: 'Insurance company not found.' });
    }

    const newStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !company.isActive;
    company.isActive = newStatus;
    company.updatedBy = req.user._id;
    await company.save();

    res.status(200).json({
      message: `Insurance company ${company.isActive ? 'activated' : 'deactivated'} successfully.`,
      company
    });
  } catch (error) {
    console.error('Toggle Insurance Company Status Error:', error);
    res.status(500).json({ message: 'Server error updating company status.' });
  }
};

// @desc    Delete insurance company (with dependency verification)
// @route   DELETE /api/tpa/insurance-companies/:id
// @access  Private (Admin Only)
const deleteInsuranceCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid insurance company ID format.' });
    }

    const hospitalId = req.user.hospitalId;

    // Check if any TPA references this insurance company
    const linkedTpa = await TpaMaster.findOne({
      hospitalId,
      associatedInsurers: id
    });
    if (linkedTpa) {
      return res.status(400).json({
        message: `Cannot delete: This insurance company is associated with TPA "${linkedTpa.name}". Remove the association or disable the company instead.`
      });
    }

    const deleted = await InsuranceCompany.findOneAndDelete({ _id: id, hospitalId });
    if (!deleted) {
      return res.status(404).json({ message: 'Insurance company not found.' });
    }

    res.status(200).json({ message: 'Insurance company deleted successfully.' });
  } catch (error) {
    console.error('Delete Insurance Company Error:', error);
    res.status(500).json({ message: 'Server error deleting insurance company.' });
  }
};

// ====================================================================
//                       TPA MASTER CONTROLLERS
// ====================================================================

// @desc    Get all TPAs (with search, filter, pagination, populated insurers)
// @route   GET /api/tpa/providers
// @access  Private
const getTpas = async (req, res) => {
  try {
    const { search, insurerId, status, page, limit } = req.query;
    let query = tenantFilter(req);

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (insurerId && mongoose.Types.ObjectId.isValid(insurerId)) {
      query.associatedInsurers = insurerId;
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { code: { $regex: escaped, $options: 'i' } },
        { irdaiLicenseNo: { $regex: escaped, $options: 'i' } },
        { contactPerson: { $regex: escaped, $options: 'i' } },
        { contactPhone: { $regex: escaped, $options: 'i' } },
        { preauthEmail: { $regex: escaped, $options: 'i' } },
        { claimsEmail: { $regex: escaped, $options: 'i' } },
        { city: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Check if pagination is requested
    if (page || limit) {
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
      const limitVal = Math.max(1, parseInt(limit, 10) || 20);
      const skip = (currentPage - 1) * limitVal;

      const [totalRecords, providers] = await Promise.all([
        TpaMaster.countDocuments(query),
        TpaMaster.find(query)
          .populate('associatedInsurers', 'name code payerType cashlessEmail hasInHouseTpa')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limitVal)
          .lean()
      ]);

      const totalPages = Math.ceil(totalRecords / limitVal) || 1;

      return res.status(200).json({
        tpaProviders: providers,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }

    // Default: return list sorted by name
    const providers = await TpaMaster.find(query)
      .populate('associatedInsurers', 'name code payerType cashlessEmail hasInHouseTpa')
      .sort({ name: 1 })
      .lean();

    res.status(200).json(providers);
  } catch (error) {
    console.error('Get TPAs Error:', error);
    res.status(500).json({ message: 'Server error loading TPAs.' });
  }
};

// @desc    Get lightweight list of active TPAs (for dropdowns)
// @route   GET /api/tpa/providers/active
// @access  Private
const getActiveTpas = async (req, res) => {
  try {
    const query = tenantFilter(req, { isActive: true });
    const providers = await TpaMaster.find(query)
      .select('_id name code preauthEmail contactPhone preauthTatHours discountRatePercentage associatedInsurers')
      .populate('associatedInsurers', 'name code payerType')
      .sort({ name: 1 })
      .lean();
    res.status(200).json(providers);
  } catch (error) {
    console.error('Get Active TPAs Error:', error);
    res.status(500).json({ message: 'Server error loading active TPAs.' });
  }
};

// @desc    Get single TPA by ID
// @route   GET /api/tpa/providers/:id
// @access  Private
const getTpaById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid TPA ID format.' });
    }

    const tpa = await TpaMaster.findOne(tenantFilter(req, { _id: id }))
      .populate('associatedInsurers', 'name code payerType cashlessEmail claimEmail hasInHouseTpa');

    if (!tpa) {
      return res.status(404).json({ message: 'TPA not found.' });
    }

    res.status(200).json(tpa);
  } catch (error) {
    console.error('Get TPA By ID Error:', error);
    res.status(500).json({ message: 'Server error retrieving TPA details.' });
  }
};

// @desc    Create a new TPA provider
// @route   POST /api/tpa/providers
// @access  Private (Admin / TPA Desk)
const createTpa = async (req, res) => {
  try {
    const {
      name,
      code,
      irdaiLicenseNo,
      associatedInsurers,
      contactPerson,
      contactPhone,
      preauthEmail,
      claimsEmail,
      portalUrl,
      address,
      city,
      state,
      pincode,
      preauthTatHours,
      discountRatePercentage,
      notes
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'TPA Name is required.' });
    }
    if (!contactPhone || !contactPhone.trim()) {
      return res.status(400).json({ message: 'TPA Contact Phone is required.' });
    }
    if (!preauthEmail || !preauthEmail.trim()) {
      return res.status(400).json({ message: 'Pre-authorization Email is required.' });
    }

    const hospitalId = req.user.hospitalId;
    const trimmedName = name.trim();

    // Check unique name per hospital (case-insensitive)
    const existingName = await TpaMaster.findOne({
      hospitalId,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
    });
    if (existingName) {
      return res.status(400).json({ message: 'A TPA with this name already exists in your hospital records.' });
    }

    // Generate code if not provided
    let finalCode = code && code.trim() ? code.trim().toUpperCase() : '';
    if (!finalCode) {
      const count = await TpaMaster.countDocuments({ hospitalId });
      finalCode = `TPA-${1001 + count}`;
    } else {
      // Check unique code per hospital
      const existingCode = await TpaMaster.findOne({
        hospitalId,
        code: finalCode
      });
      if (existingCode) {
        return res.status(400).json({ message: 'A TPA with this code already exists.' });
      }
    }

    // Validate associated insurers object IDs if provided
    let validInsurers = [];
    if (Array.isArray(associatedInsurers) && associatedInsurers.length > 0) {
      validInsurers = associatedInsurers.filter(id => mongoose.Types.ObjectId.isValid(id));
    }

    const newTpa = new TpaMaster({
      hospitalId,
      name: trimmedName,
      code: finalCode,
      irdaiLicenseNo: irdaiLicenseNo?.trim() || '',
      associatedInsurers: validInsurers,
      contactPerson: contactPerson?.trim() || '',
      contactPhone: contactPhone.trim(),
      preauthEmail: preauthEmail.trim().toLowerCase(),
      claimsEmail: claimsEmail?.trim().toLowerCase() || '',
      portalUrl: portalUrl?.trim() || '',
      address: address?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      pincode: pincode?.trim() || '',
      preauthTatHours: Number(preauthTatHours) > 0 ? Number(preauthTatHours) : 6,
      discountRatePercentage: Number(discountRatePercentage) >= 0 ? Math.min(100, Number(discountRatePercentage)) : 0,
      notes: notes?.trim() || '',
      isActive: true,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await newTpa.save();
    const populated = await TpaMaster.findById(newTpa._id).populate('associatedInsurers', 'name code payerType cashlessEmail');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create TPA Error:', error);
    res.status(500).json({ message: error.message || 'Server error creating TPA.' });
  }
};

// @desc    Update an existing TPA provider
// @route   PUT /api/tpa/providers/:id
// @access  Private (Admin / TPA Desk)
const updateTpa = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid TPA ID format.' });
    }

    const hospitalId = req.user.hospitalId;
    const updateData = { ...req.body };

    // Prevent overriding tenant boundary or primary keys
    delete updateData.hospitalId;
    delete updateData.createdBy;
    delete updateData._id;

    if (updateData.name && updateData.name.trim()) {
      const trimmedName = updateData.name.trim();
      const existingName = await TpaMaster.findOne({
        hospitalId,
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
      });
      if (existingName) {
        return res.status(400).json({ message: 'Another TPA with this name already exists.' });
      }
      updateData.name = trimmedName;
    }

    if (updateData.code && updateData.code.trim()) {
      const finalCode = updateData.code.trim().toUpperCase();
      const existingCode = await TpaMaster.findOne({
        hospitalId,
        _id: { $ne: id },
        code: finalCode
      });
      if (existingCode) {
        return res.status(400).json({ message: 'Another TPA with this code already exists.' });
      }
      updateData.code = finalCode;
    }

    if (updateData.preauthEmail !== undefined) {
      updateData.preauthEmail = updateData.preauthEmail.trim().toLowerCase();
    }
    if (updateData.claimsEmail !== undefined) {
      updateData.claimsEmail = updateData.claimsEmail.trim().toLowerCase();
    }
    if (Array.isArray(updateData.associatedInsurers)) {
      updateData.associatedInsurers = updateData.associatedInsurers.filter(insId => mongoose.Types.ObjectId.isValid(insId));
    }

    updateData.updatedBy = req.user._id;

    const tpa = await TpaMaster.findOneAndUpdate(
      { _id: id, hospitalId },
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    ).populate('associatedInsurers', 'name code payerType cashlessEmail');

    if (!tpa) {
      return res.status(404).json({ message: 'TPA not found.' });
    }

    res.status(200).json(tpa);
  } catch (error) {
    console.error('Update TPA Error:', error);
    res.status(500).json({ message: error.message || 'Server error updating TPA.' });
  }
};

// @desc    Toggle active status of TPA
// @route   PATCH /api/tpa/providers/:id/status
// @access  Private (Admin / TPA Desk)
const toggleTpaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid TPA ID format.' });
    }

    const tpa = await TpaMaster.findOne(tenantFilter(req, { _id: id }));
    if (!tpa) {
      return res.status(404).json({ message: 'TPA not found.' });
    }

    const newStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !tpa.isActive;
    tpa.isActive = newStatus;
    tpa.updatedBy = req.user._id;
    await tpa.save();

    res.status(200).json({
      message: `TPA ${tpa.isActive ? 'activated' : 'deactivated'} successfully.`,
      tpa
    });
  } catch (error) {
    console.error('Toggle TPA Status Error:', error);
    res.status(500).json({ message: 'Server error updating TPA status.' });
  }
};

// @desc    Delete a TPA provider
// @route   DELETE /api/tpa/providers/:id
// @access  Private (Admin Only)
const deleteTpa = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid TPA ID format.' });
    }

    const hospitalId = req.user.hospitalId;
    const deleted = await TpaMaster.findOneAndDelete({ _id: id, hospitalId });

    if (!deleted) {
      return res.status(404).json({ message: 'TPA not found.' });
    }

    res.status(200).json({ message: 'TPA deleted successfully.' });
  } catch (error) {
    console.error('Delete TPA Error:', error);
    res.status(500).json({ message: 'Server error deleting TPA.' });
  }
};

module.exports = {
  // Insurance Company Controllers
  getInsuranceCompanies,
  getActiveInsuranceCompanies,
  getInsuranceCompanyById,
  createInsuranceCompany,
  updateInsuranceCompany,
  toggleInsuranceCompanyStatus,
  deleteInsuranceCompany,

  // TPA Master Controllers
  getTpas,
  getActiveTpas,
  getTpaById,
  createTpa,
  updateTpa,
  toggleTpaStatus,
  deleteTpa
};
