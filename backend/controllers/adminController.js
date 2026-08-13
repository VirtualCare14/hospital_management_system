const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const HospitalSettings = require('../models/HospitalSettings');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Billing = require('../models/Billing');
const IpdAdmission = require('../models/IpdAdmission');
const SameDayTreatment = require('../models/SameDayTreatment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const LabRequest = require('../models/LabRequest');
const PatientHistory = require('../models/PatientHistory');
const PharmacyBill = require('../models/PharmacyBill');
const IpdMedicine = require('../models/IpdMedicine');
const IpdActivityTimeline = require('../models/IpdActivityTimeline');
const IpdDischarge = require('../models/IpdDischarge');
const PharmacyDispense = require('../models/PharmacyDispense');
const SdtItem = require('../models/SdtItem');
const LabBill = require('../models/LabBill');
const IpdConsumable = require('../models/IpdConsumable');
const IpdLabTest = require('../models/IpdLabTest');
const IpdReferral = require('../models/IpdReferral');
const IpdOtRecord = require('../models/IpdOtRecord');
const OtBooking = require('../models/OtBooking');
const OtDocument = require('../models/OtDocument');
const Bed = require('../models/Bed');
const { v2: cloudinary } = require('cloudinary');

const hospitalFilter = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df3dcum5n',
  api_key: process.env.CLOUDINARY_API_KEY || '772968243941522',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hnOybQ01s3e3AfYAmm3fBjF2TPk'
});

// @desc    Get hospital settings
// @route   GET /api/admin/hospital-settings
// @access  Private/Admin
const getHospitalSettings = async (req, res) => {
  try {
    // Check if settings exist for this hospital
    let settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    
    if (!settings) {
      // Return empty settings if none exist
      return res.status(200).json({
        exists: false,
        data: null
      });
    }
    
    res.status(200).json({
      exists: true,
      data: settings
    });
  } catch (error) {
    console.error('Get Hospital Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create or update hospital settings
// @route   POST /api/admin/hospital-settings
// @access  Private/Admin
const createOrUpdateHospitalSettings = async (req, res) => {
  try {
    const { hospitalName, mobileNumbers, address, hospitalHeading, logoUrl, logoPublicId } = req.body;
    
    // Validate required fields
    if (!hospitalName || !mobileNumbers || !Array.isArray(mobileNumbers) || mobileNumbers.length === 0 || !address) {
      return res.status(400).json({ 
        message: 'Hospital name, at least one mobile number, and address are required' 
      });
    }
    
    // Check if settings already exist for this hospital
    let settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    
    // Handle logo upload if new logo is provided
    let newLogoData = null;
    if (logoUrl && logoPublicId) {
      newLogoData = { url: logoUrl, publicId: logoPublicId };
    }
    
    if (settings) {
      // Update existing settings
      const updateData = {
        hospitalName,
        mobileNumbers,
        address,
        hospitalHeading: hospitalHeading || '',
        logoUrl: newLogoData ? newLogoData.url : settings.logoUrl,
        logoPublicId: newLogoData ? newLogoData.publicId : settings.logoPublicId
      };
      
      settings = await HospitalSettings.findByIdAndUpdate(
        settings._id,
        updateData,
        { returnDocument: 'after', runValidators: true }
      );
      
      res.status(200).json({
        message: 'Hospital settings updated successfully',
        exists: true,
        data: settings
      });
    } else {
      // Create new settings
      const newSettings = new HospitalSettings({
        hospitalId: req.user.hospitalId,
        hospitalName,
        mobileNumbers,
        address,
        hospitalHeading: hospitalHeading || '',
        logoUrl: newLogoData ? newLogoData.url : '',
        logoPublicId: newLogoData ? newLogoData.publicId : ''
      });
      
      await newSettings.save();
      
      res.status(201).json({
        message: 'Hospital settings created successfully',
        exists: true,
        data: newSettings
      });
    }
  } catch (error) {
    console.error('Create/Update Hospital Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload logo to Cloudinary
// @route   POST /api/admin/hospital-settings/upload-logo
// @access  Private/Admin
const uploadLogo = async (req, res) => {
  try {
    const { imageData, folder = 'hms/hospital-settings' } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    
    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(imageData, {
      folder,
      resource_type: 'image',
      transformation: {
        width: 200,
        height: 200,
        crop: 'limit'
      }
    });
    
    res.status(200).json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id
    });
  } catch (error) {
    console.error('Logo Upload Error:', error);
    res.status(500).json({ message: error.message || 'Logo upload failed' });
  }
};

// @desc    Delete logo from Cloudinary
// @route   DELETE /api/admin/hospital-settings/delete-logo
// @access  Private/Admin
const deleteLogo = async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    
    res.status(200).json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Logo Delete Error:', error);
    res.status(500).json({ message: error.message || 'Logo deletion failed' });
  }
};

// @desc    Create a new user (Receptionist, Doctor, etc.)
// @route   POST /api/admin/create-user
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { username, password, role, moduleAccess, doctorName, department, specialization, mobile, opdFees } = req.body;
    const normalizedRole = role?.toLowerCase?.().trim();

    if (!username || !password || !normalizedRole) {
      return res.status(400).json({ message: 'Username, password, and role are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne(hospitalFilter(req, { username: username.toLowerCase() }));
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Enforce maxUsers limit
    const hospital = await Hospital.findById(req.user.hospitalId);
    const maxUsers = hospital?.maxUsers || 10;
    const currentUserCount = await User.countDocuments({ hospitalId: req.user.hospitalId });
    if (currentUserCount >= maxUsers) {
      return res.status(400).json({ message: `User creation limit of ${maxUsers} reached. Please contact super admin.` });
    }

    // Set default module access based on role if not provided
    let finalModuleAccess = moduleAccess || [];
    if (finalModuleAccess.length === 0) {
      if (normalizedRole === 'admin') {
        finalModuleAccess = [1, 2, 3, 4, 5, 6, 7, 8];
      } else if (normalizedRole === 'reception') {
        finalModuleAccess = [1];
      } else if (normalizedRole === 'doctor') {
        finalModuleAccess = [2, 3];
      } else if (normalizedRole === 'lab') {
        finalModuleAccess = [4];
      } else if (normalizedRole === 'pharmacy') {
        finalModuleAccess = [7];
      } else if (normalizedRole === 'billing') {
        finalModuleAccess = [8];
      } else {
        finalModuleAccess = []; // other roles
      }
    }

    const newUser = new User({
      username: username.toLowerCase(),
      hospitalId: req.user.hospitalId,
      password, // Will be hashed in User model pre-save hook
      role: normalizedRole,
      moduleAccess: finalModuleAccess,
      doctorName: normalizedRole === 'doctor' ? doctorName : undefined,
      department: department || undefined,
      specialization: normalizedRole === 'doctor' ? (specialization || '') : undefined,
      opdFees: normalizedRole === 'doctor' ? (opdFees || 0) : 0,
      mobile: mobile || undefined,
      isActive: true
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        moduleAccess: newUser.moduleAccess,
        doctorName: newUser.doctorName,
        department: newUser.department,
        specialization: newUser.specialization
      }
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find(hospitalFilter(req)).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user details (Reset password, disable/enable, modules, department)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { password, moduleAccess, department, specialization, doctorName, mobile, isActive, role, opdFees } = req.body;
    const user = await User.findOne(hospitalFilter(req, { _id: req.params.id }));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Do not allow self-disabling
    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({ message: 'You cannot disable your own admin account' });
    }

    // Update fields if provided
    if (password !== undefined && password !== '') {
      user.password = password; // Will trigger pre-save hashing
    }
    if (moduleAccess !== undefined) {
      user.moduleAccess = moduleAccess;
    }
    if (role !== undefined) {
      user.role = role.toLowerCase?.().trim();
    }
    if (department !== undefined) {
      user.department = department;
    }
    if (specialization !== undefined) {
      user.specialization = specialization;
    }
    if (opdFees !== undefined) {
      user.opdFees = opdFees;
    }
    if (doctorName !== undefined) {
      user.doctorName = doctorName;
    }
    if (mobile !== undefined) {
      user.mobile = mobile;
    }
    if (isActive !== undefined) {
      user.isActive = isActive;
      // If user is disabled, invalidate their active session
      if (!isActive) {
        user.currentSessionId = null;
      }
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne(hospitalFilter(req, { _id: req.params.id }));
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }
    await user.deleteOne();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a clinical department
// @route   POST /api/admin/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  try {
    const { departmentName } = req.body;
    if (!departmentName) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const deptExists = await Department.findOne(hospitalFilter(req, { departmentName: { $regex: new RegExp(`^${departmentName}$`, 'i') } }));
    if (deptExists) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const newDept = new Department({ hospitalId: req.user.hospitalId, departmentName });
    await newDept.save();

    res.status(201).json(newDept);
  } catch (error) {
    console.error('Create Department Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all clinical departments
// @route   GET /api/admin/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find(hospitalFilter(req));
    res.status(200).json(departments);
  } catch (error) {
    console.error('Get Departments Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a department status
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  try {
    const { isActive, departmentName } = req.body;
    const dept = await Department.findOne(hospitalFilter(req, { _id: req.params.id }));

    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (dept.departmentName?.toLowerCase() === 'same day care') {
      if (isActive === false) {
        return res.status(400).json({ message: 'Same Day Care department cannot be disabled' });
      }
      if (departmentName !== undefined && departmentName.toLowerCase() !== 'same day care') {
        return res.status(400).json({ message: 'Same Day Care department cannot be renamed' });
      }
    }

    if (isActive !== undefined) dept.isActive = isActive;
    if (departmentName !== undefined) dept.departmentName = departmentName;

    await dept.save();
    res.status(200).json(dept);
  } catch (error) {
    console.error('Update Department Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findOne(hospitalFilter(req, { _id: req.params.id }));
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (dept.departmentName?.toLowerCase() === 'same day care') {
      return res.status(400).json({ message: 'Same Day Care department cannot be deleted' });
    }

    await dept.deleteOne();
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete Department Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get active doctors list (filtered by department optionally)
// @route   GET /api/admin/doctors
// @access  Private
const getDoctors = async (req, res) => {
  try {
    const { department, includeInactive } = req.query;
    const query = hospitalFilter(req, { role: { $in: ['doctor', 'nursing'] } });
    if (includeInactive !== 'true' || req.user.role !== 'admin') {
      query.isActive = true;
    }
    if (department) {
      query.department = department;
    }
    const doctors = await User.find(query).select('-password -currentSessionId').sort({ doctorName: 1 });
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Get Doctors Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update doctor availability time slots
// @route   PUT /api/admin/doctors/:id/availability
// @access  Private/Admin
const updateDoctorAvailability = async (req, res) => {
  try {
    const { availableSlots, slotGap } = req.body;
    const doctor = await User.findOne(hospitalFilter(req, { _id: req.params.id, role: { $in: ['doctor', 'nursing'] } }));

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!Array.isArray(availableSlots)) {
      return res.status(400).json({ message: 'availableSlots must be an array' });
    }

    doctor.availableSlots = availableSlots;
    if (slotGap !== undefined) {
      doctor.slotGap = Number(slotGap);
    }
    await doctor.save();

    res.status(200).json({ message: 'Doctor availability updated successfully', doctor });
  } catch (error) {
    console.error('Update Doctor Availability Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctor availability time slots
// @route   GET /api/admin/doctors/:id/availability
// @access  Private
const getDoctorAvailability = async (req, res) => {
  try {
    const doctor = await User.findOne(hospitalFilter(req, { _id: req.params.id, role: { $in: ['doctor', 'nursing'] } })).select('availableSlots slotGap doctorName username');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json(doctor);
  } catch (error) {
    console.error('Get Doctor Availability Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getHospitalTracking = async (req, res) => {
  try {
    const filter = hospitalFilter(req);
    const hospitalScope = req.user?.hospitalId ? { hospitalId: req.user.hospitalId } : {};

    // 1. Billing stats
    const bills = await Billing.find(filter);
    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;
    bills.forEach(b => {
      if (b.status !== 'Cancelled') {
        totalBilled += b.grandTotal || 0;
        totalPaid += b.amountPaid || 0;
        totalDue += b.dueAmount || 0;
      }
    });

    // 2. Total Patient
    const totalPatients = await Patient.countDocuments(filter);

    // 3. Treatment Going On
    const [activeIpdCount, activeIpd] = await Promise.all([
      IpdAdmission.countDocuments({ ...filter, status: 'Admitted' }),
      IpdAdmission.find({ ...filter, status: 'Admitted' })
        .populate('patientId')
        .populate('doctorInCharge', 'doctorName username')
    ]);

    const [pendingOpdCount, pendingOpd] = await Promise.all([
      Visit.countDocuments({ ...filter, visitType: 'OPD', consultationStatus: 'pending' }),
      Visit.find({ ...filter, visitType: 'OPD', consultationStatus: 'pending' })
        .populate('patientId')
        .populate('doctorId', 'doctorName username')
    ]);

    const [draftSdtCount, draftSdt] = await Promise.all([
      SameDayTreatment.countDocuments({ ...filter, status: 'Draft' }),
      SameDayTreatment.find({ ...filter, status: 'Draft' })
        .populate('patientId')
    ]);

    const treatmentGoingOnCount = activeIpdCount + pendingOpdCount + draftSdtCount;

    // 4. Treatment Done
    const [dischargedIpdCount, dischargedIpd] = await Promise.all([
      IpdAdmission.countDocuments({ ...filter, status: 'Discharged' }),
      IpdAdmission.find({ ...filter, status: 'Discharged' })
        .populate('patientId')
        .populate('doctorInCharge', 'doctorName username')
        .sort({ updatedAt: -1 })
        .limit(10)
    ]);

    const [completedOpdCount, completedOpd] = await Promise.all([
      Visit.countDocuments({ ...filter, visitType: 'OPD', consultationStatus: 'completed' }),
      Visit.find({ ...filter, visitType: 'OPD', consultationStatus: 'completed' })
        .populate('patientId')
        .populate('doctorId', 'doctorName username')
        .sort({ updatedAt: -1 })
        .limit(10)
    ]);

    const [completedSdtCount, completedSdt] = await Promise.all([
      SameDayTreatment.countDocuments({ ...filter, status: 'Completed' }),
      SameDayTreatment.find({ ...filter, status: 'Completed' })
        .populate('patientId')
        .sort({ updatedAt: -1 })
        .limit(10)
    ]);

    const treatmentDoneCount = dischargedIpdCount + completedOpdCount + completedSdtCount;

    // 5. Edited Invoice Dates (Pharmacy + General)
    const [pharmacyEdited, billingEdited] = await Promise.all([
      PharmacyBill.find({ ...hospitalScope, 'auditTrail.action': 'Invoice Date Modified' }).lean(),
      Billing.find({ ...hospitalScope, 'auditTrail.action': 'Invoice Date Modified' }).lean()
    ]);

    const editedLogs = [];

    pharmacyEdited.forEach(bill => {
      const trail = Array.isArray(bill.auditTrail) ? bill.auditTrail : [];
      trail.forEach(log => {
        if (log.action === 'Invoice Date Modified') {
          editedLogs.push({
            billId: bill._id,
            billNumber: bill.billNumber,
            billType: 'Pharmacy',
            patientName: bill.customerDetails?.name || 'Walk-in Customer',
            uhid: bill.uhid || 'N/A',
            remarks: log.remarks,
            performedByName: log.performedByName,
            timestamp: log.timestamp
          });
        }
      });
    });

    billingEdited.forEach(bill => {
      const trail = Array.isArray(bill.auditTrail) ? bill.auditTrail : [];
      trail.forEach(log => {
        if (log.action === 'Invoice Date Modified') {
          editedLogs.push({
            billId: bill._id,
            billNumber: bill.invoiceNo || bill.billNo || 'N/A',
            billType: bill.billType || 'General',
            patientName: bill.patientName || 'N/A',
            uhid: bill.uhid || 'N/A',
            remarks: log.remarks,
            performedByName: log.performedByName,
            timestamp: log.timestamp
          });
        }
      });
    });

    // Sort editedLogs by timestamp descending (newest first)
    editedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      billing: {
        totalBilled,
        totalPaid,
        totalDue,
        billsCount: bills.length
      },
      totalPatients,
      treatmentGoingOn: {
        total: treatmentGoingOnCount,
        ipdCount: activeIpdCount,
        opdCount: pendingOpdCount,
        sdtCount: draftSdtCount,
        ipdList: activeIpd,
        opdList: pendingOpd,
        sdtList: draftSdt
      },
      treatmentDone: {
        total: treatmentDoneCount,
        ipdCount: dischargedIpdCount,
        opdCount: completedOpdCount,
        sdtCount: completedSdtCount,
        ipdList: dischargedIpd,
        opdList: completedOpd,
        sdtList: completedSdt
      },
      editedInvoices: editedLogs
    });
  } catch (error) {
    console.error('Get Hospital Tracking Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDeleteDataPermission = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.hospitalId).select('allowDataDeletion');
    res.status(200).json({ enabled: Boolean(hospital?.allowDataDeletion) });
  } catch (error) {
    console.error('Get Delete Data Permission Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePatientData = async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const hospital = await Hospital.findById(req.user.hospitalId).select('allowDataDeletion');
    if (!hospital?.allowDataDeletion) {
      return res.status(403).json({ message: 'Delete data is not enabled for this hospital' });
    }

    const patient = await Patient.findOne(hospitalFilter(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const visits = await Visit.find(hospitalFilter(req, { patientId }));
    const visitIds = visits.map((visit) => visit._id);
    const relatedPatientIds = [patientId, ...visitIds.map(String)];
    const deleteQuery = { patientId: { $in: relatedPatientIds } };
    const tenantDeleteQuery = hospitalFilter(req, deleteQuery);

    await Promise.all([
      Consultation.deleteMany(tenantDeleteQuery),
      Prescription.deleteMany(tenantDeleteQuery),
      LabRequest.deleteMany(tenantDeleteQuery),
      LabBill.deleteMany(tenantDeleteQuery),
      Billing.deleteMany(tenantDeleteQuery),
      PharmacyBill.deleteMany(tenantDeleteQuery),
      SameDayTreatment.deleteMany(tenantDeleteQuery),
      SdtItem.deleteMany(tenantDeleteQuery),
      PharmacyDispense.deleteMany(tenantDeleteQuery),
      PatientHistory.deleteMany(tenantDeleteQuery),
      IpdAdmission.deleteMany(tenantDeleteQuery),
      IpdDischarge.deleteMany(tenantDeleteQuery),
      IpdConsumable.deleteMany(tenantDeleteQuery),
      IpdMedicine.deleteMany(tenantDeleteQuery),
      IpdLabTest.deleteMany(tenantDeleteQuery),
      IpdReferral.deleteMany(tenantDeleteQuery),
      IpdActivityTimeline.deleteMany(tenantDeleteQuery),
      IpdOtRecord.deleteMany(tenantDeleteQuery),
      OtBooking.deleteMany(tenantDeleteQuery),
      OtDocument.deleteMany(tenantDeleteQuery)
    ]);

    await Bed.updateMany(hospitalFilter(req, { patientId }), {
      $set: {
        patientId: null,
        admissionId: null,
        status: 'Available',
        reservedAt: null,
        reservedFor: null
      }
    });

    await Promise.all([
      Visit.deleteMany(hospitalFilter(req, { patientId })),
      Patient.deleteOne(hospitalFilter(req, { _id: patientId }))
    ]);

    res.status(200).json({ message: 'Patient and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete Patient Data Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search items for deletion page based on category
// @route   GET /api/admin/delete-data/search
// @access  Private (Admin only)
const searchDeleteItems = async (req, res) => {
  try {
    const { query, category } = req.query;
    const hospitalId = req.user.hospitalId;

    if (!query || query.trim().length < 2) {
      return res.status(200).json([]);
    }

    const searchQuery = query.trim();
    const results = [];

    if (category === 'patient') {
      const patients = await Patient.find({
        hospitalId,
        $or: [
          { patientName: new RegExp(searchQuery, 'i') },
          { uhid: new RegExp(searchQuery, 'i') },
          { mobile: new RegExp(searchQuery, 'i') }
        ]
      }).limit(10);
      patients.forEach(p => {
        results.push({
          id: p._id,
          title: p.patientName,
          subtitle: `UHID: ${p.uhid} | Mobile: ${p.mobile}`,
          details: p
        });
      });
    } else if (category === 'pharmacy') {
      const bills = await PharmacyBill.find({
        hospitalId,
        billNumber: new RegExp(searchQuery, 'i')
      }).limit(10);
      bills.forEach(b => {
        results.push({
          id: b._id,
          title: `Bill No: ${b.billNumber}`,
          subtitle: `Customer: ${b.customerDetails?.name || 'Walk-in'} | Date: ${new Date(b.billDate || b.createdAt).toLocaleDateString('en-GB')} | Total: ₹${b.totalAmount}`,
          details: b
        });
      });
    } else if (category === 'billing') {
      const bills = await Billing.find({
        hospitalId,
        $or: [
          { invoiceNo: new RegExp(searchQuery, 'i') },
          { billNo: new RegExp(searchQuery, 'i') }
        ]
      }).limit(10);
      bills.forEach(b => {
        results.push({
          id: b._id,
          title: `Invoice No: ${b.invoiceNo || b.billNo}`,
          subtitle: `Patient: ${b.patientName || 'Walk-in'} | Date: ${new Date(b.createdAt).toLocaleDateString('en-GB')} | Total: ₹${b.grandTotal}`,
          details: b
        });
      });
    } else if (category === 'prescription') {
      const prescriptions = await Prescription.find({ hospitalId })
        .populate('patientId', 'patientName uhid')
        .populate('doctorId', 'doctorName username')
        .lean();

      const searchRegex = new RegExp(searchQuery, 'i');
      const filtered = prescriptions.filter(p => {
        return (
          p._id.toString().includes(searchQuery) ||
          (p.patientId && searchRegex.test(p.patientId.patientName)) ||
          (p.patientId && searchRegex.test(p.patientId.uhid)) ||
          (p.medicines && p.medicines.some(m => searchRegex.test(m.medicine)))
        );
      }).slice(0, 10);

      filtered.forEach(p => {
        results.push({
          id: p._id,
          title: `Prescription ID: ${p._id.toString().slice(-6).toUpperCase()}`,
          subtitle: `Patient: ${p.patientId?.patientName || 'N/A'} | Doctor: ${p.doctorId?.doctorName || p.doctorId?.username || 'N/A'} | Meds Count: ${p.medicines?.length || 0}`,
          details: p
        });
      });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Search Delete Items Error:', error);
    res.status(500).json({ message: 'Server error searching items for deletion.' });
  }
};

// @desc    Delete a specific pharmacy invoice
// @route   DELETE /api/admin/delete-data/pharmacy-bill/:id
// @access  Private (Admin only)
const deletePharmacyInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const hospital = await Hospital.findById(hospitalId).select('allowDataDeletion');
    if (!hospital?.allowDataDeletion) {
      return res.status(403).json({ message: 'Delete data is not enabled for this hospital' });
    }

    const bill = await PharmacyBill.findOne({ _id: id, hospitalId });
    if (!bill) {
      return res.status(404).json({ message: 'Pharmacy bill not found' });
    }

    await PharmacyBill.deleteOne({ _id: id, hospitalId });
    res.status(200).json({ message: 'Pharmacy invoice deleted successfully' });
  } catch (error) {
    console.error('Delete Pharmacy Invoice Error:', error);
    res.status(500).json({ message: 'Server error deleting pharmacy invoice' });
  }
};

// @desc    Delete a specific general billing invoice
// @route   DELETE /api/admin/delete-data/billing-invoice/:id
// @access  Private (Admin only)
const deleteGeneralInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const hospital = await Hospital.findById(hospitalId).select('allowDataDeletion');
    if (!hospital?.allowDataDeletion) {
      return res.status(403).json({ message: 'Delete data is not enabled for this hospital' });
    }

    const bill = await Billing.findOne({ _id: id, hospitalId });
    if (!bill) {
      return res.status(404).json({ message: 'General invoice not found' });
    }

    await Billing.deleteOne({ _id: id, hospitalId });
    res.status(200).json({ message: 'General invoice deleted successfully' });
  } catch (error) {
    console.error('Delete General Invoice Error:', error);
    res.status(500).json({ message: 'Server error deleting general invoice' });
  }
};

// @desc    Delete a specific prescription
// @route   DELETE /api/admin/delete-data/prescription/:id
// @access  Private (Admin only)
const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const hospital = await Hospital.findById(hospitalId).select('allowDataDeletion');
    if (!hospital?.allowDataDeletion) {
      return res.status(403).json({ message: 'Delete data is not enabled for this hospital' });
    }

    const prescription = await Prescription.findOne({ _id: id, hospitalId });
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    await Prescription.deleteOne({ _id: id, hospitalId });
    res.status(200).json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete Prescription Error:', error);
    res.status(500).json({ message: 'Server error deleting prescription' });
  }
};

const getPatientSummary = async (req, res) => {
  try {
    const patientId = req.params.id;
    const filter = hospitalFilter(req, { patientId });

    // 1. Patient info
    const patient = await Patient.findOne(hospitalFilter(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2. Visits count & details
    const visits = await Visit.find(filter)
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    // 3. Treatments
    const ipdAdmissions = await IpdAdmission.find(filter)
      .populate('roomId')
      .populate('bedId')
      .populate('doctorInCharge', 'doctorName username')
      .sort({ createdAt: -1 });
    const sameDayTreatments = await SameDayTreatment.find(filter).sort({ createdAt: -1 });

    // 4. Lab Requests / Lab tests
    const labRequests = await LabRequest.find(filter)
      .populate('doctorId', 'doctorName username')
      .sort({ createdAt: -1 });
    const labReports = await PatientHistory.find(filter).sort({ createdAt: -1 });

    // 5. Prescriptions
    const prescriptions = await Prescription.find(filter)
      .populate('doctorId', 'doctorName username')
      .sort({ createdAt: -1 });

    // 6. Diagnosis (from consultations, ipd, same day treatment)
    const consultations = await Consultation.find(filter)
      .populate('doctorId', 'doctorName username')
      .sort({ createdAt: -1 });

    // Collect all diagnosis information
    const diagnoses = [];
    consultations.forEach(c => {
      if (c.diagnosisRemark) {
        diagnoses.push({
          source: 'Consultation',
          date: c.createdAt,
          remarks: c.diagnosisRemark,
          doctorName: c.doctorId?.doctorName || c.doctorId?.username || 'N/A'
        });
      }
    });
    ipdAdmissions.forEach(ipd => {
      if (ipd.provisionalDiagnosis) {
        diagnoses.push({
          source: `IPD Admission (${ipd.ipdNumber})`,
          date: ipd.admissionDate,
          remarks: ipd.provisionalDiagnosis,
          doctorName: ipd.doctorInCharge?.doctorName || ipd.doctorInCharge?.username || 'N/A'
        });
      }
    });
    sameDayTreatments.forEach(sdt => {
      if (sdt.diagnosis) {
        diagnoses.push({
          source: `Same Day Treatment (${sdt.treatmentType})`,
          date: sdt.treatmentDate,
          remarks: sdt.diagnosis,
          doctorName: 'N/A'
        });
      }
    });

    // 7. Medicine with pricing
    const pharmacyBills = await PharmacyBill.find({ hospitalId: req.user.hospitalId, patientId }).sort({ createdAt: -1 });
    const ipdMedicines = await IpdMedicine.find(filter).sort({ createdAt: -1 });

    // Collect all medicine charges
    const medicinesList = [];
    pharmacyBills.forEach(bill => {
      bill.items.forEach(item => {
        medicinesList.push({
          name: item.itemName,
          source: `Pharmacy Bill (${bill.billNumber})`,
          date: bill.billDate,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.amount,
          status: bill.status
        });
      });
    });

    ipdMedicines.forEach(med => {
      medicinesList.push({
        name: med.medicineName,
        source: 'IPD Medicine',
        date: med.createdAt,
        quantity: med.quantity,
        unitPrice: med.unitPrice,
        totalPrice: med.totalAmount,
        status: 'Billed'
      });
    });

    res.status(200).json({
      patient,
      visitsCount: visits.length,
      visits,
      treatments: {
        ipdAdmissions,
        sameDayTreatments
      },
      tests: {
        labRequests,
        labReports
      },
      prescriptions,
      diagnoses,
      medicines: medicinesList
    });
  } catch (error) {
    console.error('Get Patient Summary Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserLimit = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.hospitalId);
    const maxUsers = hospital?.maxUsers || 10;
    const userCount = await User.countDocuments({ hospitalId: req.user.hospitalId });
    res.status(200).json({ maxUsers, userCount });
  } catch (error) {
    console.error('Get User Limit Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientTrackingTimeline = async (req, res) => {
  try {
    const { patientId } = req.params;
    const hospitalId = req.user.hospitalId;
    const filter = { hospitalId, patientId };

    const events = [];

    // 1. OPD Visits
    const visits = await Visit.find(filter)
      .populate('doctorId', 'username doctorName role')
      .lean();
    visits.forEach(visit => {
      // Visit creation
      events.push({
        type: 'OPD Visit',
        activity: 'OPD Visit Registered',
        description: `Registration Number: ${visit.registrationNumber} | Visit #${visit.visitNumber} to Department "${visit.department}"`,
        date: visit.registrationDate ? new Date(visit.registrationDate).toLocaleDateString() : new Date(visit.createdAt).toLocaleDateString(),
        time: visit.registrationDate ? new Date(visit.registrationDate).toLocaleTimeString() : new Date(visit.createdAt).toLocaleTimeString(),
        performedBy: 'Receptionist',
        timestamp: visit.registrationDate || visit.createdAt
      });

      // Consultation completion
      if (visit.consultationStatus === 'completed') {
        events.push({
          type: 'OPD Visit',
          activity: 'OPD Consultation Completed',
          description: `Completed by Dr. ${visit.doctorId?.doctorName || visit.doctorId?.username || 'N/A'}`,
          date: visit.consultationCompletedDate ? new Date(visit.consultationCompletedDate).toLocaleDateString() : new Date(visit.updatedAt).toLocaleDateString(),
          time: visit.consultationCompletedDate ? new Date(visit.consultationCompletedDate).toLocaleTimeString() : new Date(visit.updatedAt).toLocaleTimeString(),
          performedBy: visit.doctorId ? `${visit.doctorId.doctorName || visit.doctorId.username} (${visit.doctorId.role === 'nursing' ? 'same day care' : visit.doctorId.role})` : 'Doctor',
          timestamp: visit.consultationCompletedDate || visit.updatedAt
        });
      }
    });

    // 2. Doctor Consultations
    const consultations = await Consultation.find(filter)
      .populate('doctorId', 'username doctorName role')
      .lean();
    consultations.forEach(consultation => {
      const vitalsText = consultation.vitals 
        ? `BP: ${consultation.vitals.bloodPressure || '-'}, Pulse: ${consultation.vitals.pulse || '-'}, Temp: ${consultation.vitals.temperature ? `${consultation.vitals.temperature} °C` : '-'}`
        : '';
      events.push({
        type: 'Consultation',
        activity: 'Doctor Consultation Details Recorded',
        description: `Diagnosis: ${consultation.diagnosisRemark || 'None'}. Chief Complaint: ${consultation.chiefComplaint || 'None'}. ${vitalsText}`,
        date: new Date(consultation.createdAt).toLocaleDateString(),
        time: new Date(consultation.createdAt).toLocaleTimeString(),
        performedBy: consultation.doctorId ? `${consultation.doctorId.doctorName || consultation.doctorId.username} (${consultation.doctorId.role === 'nursing' ? 'same day care' : consultation.doctorId.role})` : 'Doctor',
        timestamp: consultation.createdAt
      });
    });

    // 3. Prescriptions
    const prescriptions = await Prescription.find(filter)
      .populate('doctorId', 'username doctorName role')
      .lean();
    prescriptions.forEach(prescription => {
      const medsCount = prescription.medicines?.length || 0;
      events.push({
        type: 'Prescription',
        activity: 'Prescription Issued',
        description: `Medicines (${medsCount}): ${prescription.medicines?.map(m => m.medicineName).join(', ') || 'None'}`,
        date: new Date(prescription.createdAt).toLocaleDateString(),
        time: new Date(prescription.createdAt).toLocaleTimeString(),
        performedBy: prescription.doctorId ? `${prescription.doctorId.doctorName || prescription.doctorId.username} (${prescription.doctorId.role === 'nursing' ? 'same day care' : prescription.doctorId.role})` : 'Doctor',
        timestamp: prescription.createdAt
      });
    });

    // 4. IPD Admissions
    const ipdAdmissions = await IpdAdmission.find(filter)
      .populate('doctorInCharge', 'username doctorName role')
      .populate('roomId', 'roomName')
      .populate('bedId', 'bedNumber')
      .lean();
    ipdAdmissions.forEach(ipd => {
      events.push({
        type: 'IPD Admission',
        activity: 'IPD Patient Admitted',
        description: `IPD Number: ${ipd.ipdNumber} | Room: ${ipd.roomId?.roomName || 'N/A'} - Bed: ${ipd.bedId?.bedNumber || 'N/A'} | Diagnosis: ${ipd.provisionalDiagnosis || 'None'}`,
        date: new Date(ipd.admissionDate).toLocaleDateString(),
        time: new Date(ipd.admissionDate).toLocaleTimeString(),
        performedBy: ipd.doctorInCharge ? `${ipd.doctorInCharge.doctorName || ipd.doctorInCharge.username} (Doctor)` : 'Admin',
        timestamp: ipd.admissionDate || ipd.createdAt
      });
    });

    // 5. IPD Activity Timeline
    const ipdTimelines = await IpdActivityTimeline.find(filter)
      .populate('performedBy', 'username doctorName role')
      .lean();
    ipdTimelines.forEach(ipd => {
      events.push({
        type: 'IPD Activity',
        activity: ipd.activity,
        description: ipd.description,
        date: ipd.date || new Date(ipd.createdAt).toLocaleDateString(),
        time: ipd.time || new Date(ipd.createdAt).toLocaleTimeString(),
        performedBy: ipd.performedBy ? `${ipd.performedBy.doctorName || ipd.performedBy.username} (${ipd.performedBy.role === 'nursing' ? 'same day care' : ipd.performedBy.role})` : ipd.performedByName || 'System',
        timestamp: ipd.createdAt
      });
    });

    // 6. IPD Discharges
    const discharges = await IpdDischarge.find(filter).lean();
    discharges.forEach(discharge => {
      events.push({
        type: 'IPD Discharge',
        activity: 'IPD Patient Discharged',
        description: `Reason: ${discharge.dischargeReason || 'Completed'} | Summary: ${discharge.treatmentSummary || 'None'}`,
        date: new Date(discharge.dischargeDate).toLocaleDateString(),
        time: discharge.dischargeTime || new Date(discharge.dischargeDate).toLocaleTimeString(),
        performedBy: discharge.dischargingPhysicianFirstName ? `Dr. ${discharge.dischargingPhysicianFirstName}` : 'Doctor',
        timestamp: discharge.dischargeDate || discharge.createdAt
      });
    });

    // 7. Same Day Care (SDT)
    const sameDayTreatments = await SameDayTreatment.find(filter)
      .populate('createdBy', 'username doctorName role')
      .populate('updatedBy', 'username doctorName role')
      .populate('auditTrail.performedBy', 'username doctorName role')
      .lean();
    sameDayTreatments.forEach(sdt => {
      // Creation event
      events.push({
        type: 'Same Day Care',
        activity: 'Same Day Care Registered',
        description: `Treatment: ${sdt.treatmentType} | Source: ${sdt.source} | Status: ${sdt.status}`,
        date: new Date(sdt.createdAt).toLocaleDateString(),
        time: new Date(sdt.createdAt).toLocaleTimeString(),
        performedBy: sdt.createdBy ? `${sdt.createdBy.doctorName || sdt.createdBy.username} (${sdt.createdBy.role === 'nursing' ? 'same day care' : sdt.createdBy.role})` : 'Staff',
        timestamp: sdt.createdAt
      });

      // Audit Trail
      sdt.auditTrail?.forEach(audit => {
        events.push({
          type: 'Same Day Care Audit',
          activity: audit.action,
          description: audit.remarks || `Status updated for same day care: ${sdt.treatmentType}`,
          date: new Date(audit.timestamp).toLocaleDateString(),
          time: new Date(audit.timestamp).toLocaleTimeString(),
          performedBy: audit.performedBy ? `${audit.performedBy.doctorName || audit.performedBy.username} (${audit.performedBy.role === 'nursing' ? 'same day care' : audit.performedBy.role})` : audit.performedByName || 'Staff',
          timestamp: audit.timestamp
        });
      });

      // Dialysis Sessions
      sdt.dialysisSessions?.forEach(session => {
        events.push({
          type: 'Dialysis Session',
          activity: 'Dialysis Session Logged',
          description: `Fluid removed: ${session.fluidRemoved || 0} L | Starting BP: ${session.startingBP || '-'} | Ending BP: ${session.endingBP || '-'} | Comments: ${session.comments || 'None'}`,
          date: new Date(session.date).toLocaleDateString(),
          time: session.time || 'N/A',
          performedBy: 'Same Day Care Nurse',
          timestamp: session.date
        });
      });
    });

    // 8. Lab Requests
    const labRequests = await LabRequest.find(filter)
      .populate('doctorId', 'username doctorName role')
      .lean();
    labRequests.forEach(req => {
      events.push({
        type: 'Lab Request',
        activity: 'Lab Test Ordered',
        description: `Tests: ${req.tests?.map(t => t.name).join(', ')} | Status: ${req.status}`,
        date: new Date(req.createdAt).toLocaleDateString(),
        time: new Date(req.createdAt).toLocaleTimeString(),
        performedBy: req.doctorId ? `${req.doctorId.doctorName || req.doctorId.username} (${req.doctorId.role === 'nursing' ? 'same day care' : req.doctorId.role})` : 'Doctor',
        timestamp: req.createdAt
      });
    });

    // 9. PatientHistory / Lab Reports
    const labReports = await PatientHistory.find(filter)
      .populate('generatedBy', 'username doctorName role')
      .lean();
    labReports.forEach(report => {
      events.push({
        type: 'Lab Report',
        activity: 'Lab Report Generated',
        description: `Test: ${report.testName} | Status: ${report.reportStatus}`,
        date: report.generatedDate ? new Date(report.generatedDate).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString(),
        time: report.generatedTime || (report.generatedDate ? new Date(report.generatedDate).toLocaleTimeString() : new Date(report.createdAt).toLocaleTimeString()),
        performedBy: report.generatedBy ? `${report.generatedBy.doctorName || report.generatedBy.username} (${report.generatedBy.role === 'nursing' ? 'same day care' : report.generatedBy.role})` : report.generatedByName || 'Lab Staff',
        timestamp: report.generatedDate || report.createdAt
      });
    });

    // 10. Pharmacy Bills
    const pharmacyBills = await PharmacyBill.find({ hospitalId, patientId })
      .populate('createdBy', 'username doctorName role')
      .lean();
    pharmacyBills.forEach(bill => {
      events.push({
        type: 'Pharmacy Bill',
        activity: `Pharmacy Bill ${bill.status}`,
        description: `Invoice: ${bill.billNumber} | Amount: ₹${bill.totalAmount} | Items: ${bill.items?.length || 0}`,
        date: new Date(bill.billDate).toLocaleDateString(),
        time: new Date(bill.createdAt).toLocaleTimeString(),
        performedBy: bill.createdBy ? `${bill.createdBy.doctorName || bill.createdBy.username} (${bill.createdBy.role === 'nursing' ? 'same day care' : bill.createdBy.role})` : 'Pharmacist',
        timestamp: bill.createdAt
      });

      bill.auditTrail?.forEach(log => {
        events.push({
          type: 'Invoice Date Modification Tracking',
          activity: log.action,
          description: log.remarks || `Action: ${log.action}`,
          date: new Date(log.timestamp).toLocaleDateString(),
          time: new Date(log.timestamp).toLocaleTimeString(),
          performedBy: log.performedByName || 'Pharmacist',
          timestamp: log.timestamp
        });
      });
    });

    // 11. General Bills
    const generalBills = await Billing.find({ hospitalId, patientId }).lean();
    generalBills.forEach(b => {
      events.push({
        type: 'General Bill',
        activity: `General Bill ${b.status}`,
        description: `Invoice: ${b.invoiceNo || b.billNo || 'N/A'} | Amount: ₹${b.grandTotal} | Status: ${b.status}`,
        date: new Date(b.createdAt).toLocaleDateString(),
        time: new Date(b.createdAt).toLocaleTimeString(),
        performedBy: 'Billing Staff',
        timestamp: b.createdAt
      });

      b.auditTrail?.forEach(log => {
        events.push({
          type: 'Invoice Date Modification Tracking',
          activity: log.action,
          description: log.remarks || `Action: ${log.action}`,
          date: new Date(log.timestamp).toLocaleDateString(),
          time: new Date(log.timestamp).toLocaleTimeString(),
          performedBy: log.performedByName || 'Admin',
          timestamp: log.timestamp
        });
      });
    });

    // Sort events by timestamp descending (newest first)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json(events);
  } catch (error) {
    console.error('Get Patient Tracking Timeline Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get COMBINED bills list (Pharmacy + Billing) for a patient
// @route   GET /api/admin/bills/patient/:patientId
// @access  Private (Admin only)
// @desc    Get COMBINED bills list (Pharmacy + Billing) for a patient
// @route   GET /api/admin/bills/patient/:patientId
// @access  Private (Admin only)
const getPatientBills = async (req, res) => {
  try {
    const { patientId } = req.params;
    const hospitalId = req.user.hospitalId;

    const patientObj = await Patient.findById(patientId);

    // Fetch General Bills for this patient
    const generalBills = await Billing.find({ hospitalId, patientId }).sort({ createdAt: -1 });

    // Fetch Pharmacy Bills for this patient (with fallback to patient name & mobile if patientId is not populated on the bill)
    let pharmacyQuery = { hospitalId };
    if (patientObj) {
      pharmacyQuery.$or = [
        { patientId },
        { 'customerDetails.mobile': patientObj.mobile },
        { 'customerDetails.name': new RegExp('^' + patientObj.patientName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      ];
    } else {
      pharmacyQuery.patientId = patientId;
    }
    const pharmacyBills = await PharmacyBill.find(pharmacyQuery).sort({ billDate: -1 });

    // Combine them
    const combined = [];

    pharmacyBills.forEach(b => {
      combined.push({
        _id: b._id,
        billNumber: b.billNumber,
        billType: 'Pharmacy',
        date: b.billDate || b.createdAt,
        amount: b.totalAmount || b.grandTotal || 0,
        status: b.status,
        paymentStatus: b.paymentStatus
      });
    });

    generalBills.forEach(b => {
      combined.push({
        _id: b._id,
        billNumber: b.invoiceNo || b.billNo,
        billType: b.billType || 'General',
        date: b.createdAt,
        amount: b.grandTotal || 0,
        status: b.status,
        paymentStatus: b.paymentStatus
      });
    });

    // Sort combined by date descending
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(combined);
  } catch (error) {
    console.error('Get Patient Bills Error:', error);
    res.status(500).json({ message: 'Server error loading patient bills.' });
  }
};

// @desc    Search patients and invoices/bills by name, mobile, UHID, or invoice number
// @route   GET /api/admin/bills/search
// @access  Private (Admin only)
const searchBills = async (req, res) => {
  try {
    const { query } = req.query;
    const hospitalId = req.user.hospitalId;

    if (!query || query.trim().length < 2) {
      return res.status(200).json([]);
    }

    const searchQuery = query.trim();
    const results = [];

    // 1. Search Patients
    const patients = await Patient.find({
      hospitalId,
      $or: [
        { patientName: new RegExp(searchQuery, 'i') },
        { uhid: new RegExp(searchQuery, 'i') },
        { mobile: new RegExp(searchQuery, 'i') }
      ]
    }).limit(10);

    patients.forEach(p => {
      results.push({
        type: 'patient',
        id: p._id,
        title: p.patientName,
        subtitle: `UHID: ${p.uhid} | Mobile: ${p.mobile}`,
        data: p
      });
    });

    // 2. Search Pharmacy Bills directly by Bill Number
    const pharmacyBills = await PharmacyBill.find({
      hospitalId,
      billNumber: new RegExp(searchQuery, 'i')
    }).limit(10);

    pharmacyBills.forEach(b => {
      results.push({
        type: 'bill',
        id: b._id,
        billType: 'Pharmacy',
        title: `Pharmacy Bill: ${b.billNumber}`,
        subtitle: `Customer: ${b.customerDetails?.name || 'Walk-in'} | Date: ${new Date(b.billDate).toLocaleDateString('en-GB')} | Amt: ₹${b.totalAmount}`,
        data: {
          _id: b._id,
          billNumber: b.billNumber,
          billType: 'Pharmacy',
          date: b.billDate || b.createdAt,
          amount: b.totalAmount || 0,
          status: b.status
        }
      });
    });

    // 3. Search General Bills directly by Invoice/Bill Number
    const generalBills = await Billing.find({
      hospitalId,
      $or: [
        { invoiceNo: new RegExp(searchQuery, 'i') },
        { billNo: new RegExp(searchQuery, 'i') }
      ]
    }).limit(10);

    generalBills.forEach(b => {
      results.push({
        type: 'bill',
        id: b._id,
        billType: b.billType || 'General',
        title: `General Invoice: ${b.invoiceNo || b.billNo}`,
        subtitle: `Patient: ${b.patientName || 'Walk-in'} | Date: ${new Date(b.createdAt).toLocaleDateString('en-GB')} | Amt: ₹${b.grandTotal}`,
        data: {
          _id: b._id,
          billNumber: b.invoiceNo || b.billNo,
          billType: b.billType || 'General',
          date: b.createdAt,
          amount: b.grandTotal || 0,
          status: b.status
        }
      });
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Search Bills Error:', error);
    res.status(500).json({ message: 'Server error searching bills.' });
  }
};

// @desc    Update bill date of a pharmacy or general billing invoice
// @route   PUT /api/admin/bills/:billType/:billId/date
// @access  Private (Admin only)
const updateBillDate = async (req, res) => {
  try {
    const { billType, billId } = req.params;
    const { newDate } = req.body;
    const hospitalId = req.user.hospitalId;

    if (!newDate) {
      return res.status(400).json({ message: 'New date is required.' });
    }

    const parsedDate = new Date(newDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    if (billType.toLowerCase() === 'pharmacy') {
      const bill = await PharmacyBill.findOne({ _id: billId, hospitalId });
      if (!bill) {
        return res.status(404).json({ message: 'Pharmacy bill not found.' });
      }

      const oldDateStr = new Date(bill.billDate || bill.createdAt).toLocaleString('en-IN');
      const newDateStr = new Date(parsedDate).toLocaleString('en-IN');
      const logRemarks = `Invoice date changed from ${oldDateStr} to ${newDateStr}`;

      // Update both billDate and createdAt
      await PharmacyBill.updateOne(
        { _id: billId, hospitalId },
        { 
          $set: { 
            billDate: parsedDate,
            createdAt: parsedDate 
          },
          $push: {
            auditTrail: {
              action: 'Invoice Date Modified',
              performedBy: req.user._id,
              performedByName: req.user.doctorName || req.user.username || 'Admin',
              timestamp: new Date(),
              remarks: logRemarks
            }
          }
        },
        { timestamps: false }
      );
      
      return res.status(200).json({ message: 'Pharmacy bill date updated successfully.' });
    } else {
      const bill = await Billing.findOne({ _id: billId, hospitalId });
      if (!bill) {
        return res.status(404).json({ message: 'Billing module invoice not found.' });
      }

      const oldDateStr = new Date(bill.createdAt).toLocaleString('en-IN');
      const newDateStr = new Date(parsedDate).toLocaleString('en-IN');
      const logRemarks = `Invoice date changed from ${oldDateStr} to ${newDateStr}`;

      // Update createdAt
      await Billing.updateOne(
        { _id: billId, hospitalId },
        { 
          $set: { 
            createdAt: parsedDate 
          },
          $push: {
            auditTrail: {
              action: 'Invoice Date Modified',
              performedBy: req.user._id,
              performedByName: req.user.doctorName || req.user.username || 'Admin',
              timestamp: new Date(),
              remarks: logRemarks
            }
          }
        },
        { timestamps: false }
      );

      return res.status(200).json({ message: 'General invoice date updated successfully.' });
    }
  } catch (error) {
    console.error('Update Bill Date Error:', error);
    res.status(500).json({ message: 'Server error updating invoice date.' });
  }
};

module.exports = {
  getHospitalSettings,
  createOrUpdateHospitalSettings,
  uploadLogo,
  deleteLogo,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getDoctors,
  updateDoctorAvailability,
  getDoctorAvailability,
  getHospitalTracking,
  getDeleteDataPermission,
  deletePatientData,
  searchDeleteItems,
  deletePharmacyInvoice,
  deleteGeneralInvoice,
  deletePrescription,
  getPatientSummary,
  getUserLimit,
  getPatientTrackingTimeline,
  getPatientBills,
  searchBills,
  updateBillDate
};
