const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const LabRequest = require('../models/LabRequest');
const Department = require('../models/Department');

const jwtSecret = () => process.env.JWT_SECRET || 'super_secret_hms_jwt_key_2026';

const hospitalLink = (req, hospitalId) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medora360.com';
  return `${frontendUrl.replace(/\/$/, '')}/hospital/${hospitalId}`;
};

const buildHospitalResponse = async (req, hospital) => {
  const userCount = await User.countDocuments({ hospitalId: hospital._id, username: { $ne: hospital.loginId } });
  return {
    id: hospital._id,
    _id: hospital._id,
    name: hospital.name,
    loginId: hospital.loginId,
    isActive: hospital.isActive,
    maxUsers: hospital.maxUsers || 10,
    userCount,
    loginLink: hospitalLink(req, hospital._id),
    createdAt: hospital.createdAt,
    updatedAt: hospital.updatedAt
  };
};

const superAdminLogin = async (req, res) => {
  const { username, password } = req.body;
  const expectedUsername = process.env.SUPER_ADMIN_LOGIN_ID || 'ravi';
  const expectedPassword = process.env.SUPER_ADMIN_PASSWORD || 'raviadmin';

  if (username !== expectedUsername || password !== expectedPassword) {
    return res.status(401).json({ message: 'Invalid super admin credentials' });
  }

  const token = jwt.sign(
    { role: 'superadmin', username: expectedUsername, sessionId: crypto.randomUUID() },
    jwtSecret(),
    { expiresIn: '24h' }
  );

  res.json({ token, user: { username: expectedUsername, role: 'superadmin' } });
};

const listHospitals = async (req, res) => {
  const hospitals = await Hospital.find({}).sort({ createdAt: -1 });
  const response = await Promise.all(hospitals.map((hospital) => buildHospitalResponse(req, hospital)));
  res.json(response);
};

const createHospital = async (req, res) => {
  let { name, loginId, password, maxUsers } = req.body;
  name = name?.trim();
  loginId = loginId?.toLowerCase().trim();

  if (!name || !loginId || !password) {
    return res.status(400).json({ message: 'Hospital name, login ID, and password are required' });
  }

  try {
    const exists = await Hospital.findOne({ loginId });
    if (exists) return res.status(400).json({ message: 'Hospital login ID already exists' });

    const hospital = await Hospital.create({ name, loginId, password, isActive: true, maxUsers: parseInt(maxUsers) || 10 });
    await User.create({
      hospitalId: hospital._id,
      username: loginId,
      password,
      role: 'admin',
      moduleAccess: [1, 2, 3, 4, 5, 6, 7, 8],
      doctorName: `${name} Administrator`,
      isActive: true
    });

    res.status(201).json(await buildHospitalResponse(req, hospital));
  } catch (error) {
    console.error('Create hospital error:', error);
    return res.status(500).json({ message: 'Unable to create hospital' });
  }
};

const updateHospital = async (req, res) => {
  const { name, loginId, password, isActive, maxUsers } = req.body;
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

  const previousLoginId = hospital.loginId;
  if (name !== undefined) hospital.name = name;
  if (maxUsers !== undefined) hospital.maxUsers = parseInt(maxUsers) || 10;
  if (loginId !== undefined) {
    const normalizedLoginId = loginId.toLowerCase().trim();
    const exists = await Hospital.findOne({ loginId: normalizedLoginId, _id: { $ne: hospital._id } });
    if (exists) return res.status(400).json({ message: 'Hospital login ID already exists' });
    hospital.loginId = normalizedLoginId;
  }
  if (password) hospital.password = password;
  if (isActive !== undefined) {
    hospital.isActive = isActive;
    if (!isActive) hospital.currentSessionId = null;
  }

  await hospital.save();

  const adminUser = await User.findOne({ hospitalId: hospital._id, role: 'admin', username: previousLoginId });
  if (adminUser) {
    adminUser.username = hospital.loginId;
    adminUser.doctorName = `${hospital.name} Administrator`;
    adminUser.isActive = hospital.isActive;
    adminUser.moduleAccess = [1, 2, 3, 4, 5, 6, 7, 8];
    if (password) adminUser.password = password;
    if (!hospital.isActive) adminUser.currentSessionId = null;
    await adminUser.save();
  }

  if (!hospital.isActive) {
    await User.updateMany({ hospitalId: hospital._id }, { isActive: false, currentSessionId: null });
  }

  res.json(await buildHospitalResponse(req, hospital));
};

const deleteHospital = async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

  await Promise.all([
    User.deleteMany({ hospitalId: hospital._id }),
    Patient.deleteMany({ hospitalId: hospital._id }),
    Consultation.deleteMany({ hospitalId: hospital._id }),
    Prescription.deleteMany({ hospitalId: hospital._id }),
    LabRequest.deleteMany({ hospitalId: hospital._id }),
    Department.deleteMany({ hospitalId: hospital._id })
  ]);
  await hospital.deleteOne();

  res.json({ message: 'Hospital and all related data deleted successfully' });
};

module.exports = {
  superAdminLogin,
  listHospitals,
  createHospital,
  updateHospital,
  deleteHospital
};
