const LabRequest = require('../models/LabRequest');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const LabProfile = require('../models/LabProfile');
const LabSignatory = require('../models/LabSignatory');
const LabAssistantProfile = require('../models/LabAssistantProfile');
const DiagnosisTemplate = require('../models/DiagnosisTemplate');
const User = require('../models/User');
const Patient = require('../models/Patient');
const PatientHistory = require('../models/PatientHistory');
const Consultation = require('../models/Consultation');
const LabBill = require('../models/LabBill');
const {
  DIAGNOSIS_CATEGORY_NAME,
  DIAGNOSIS_SYSTEM_KEY,
  DIAGNOSIS_TESTS,
  ensureSystemCategoryForHospital,
  ensureDiagnosisTestForHospital
} = require('../seeds/seedDiagnosisCategory');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL || 'cloudinary://772968243941522:hnOybQ01s3e3AfYAmm3fBjF2TPk@df3dcum5n',
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df3dcum5n',
  api_key: process.env.CLOUDINARY_API_KEY || '772968243941522',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hnOybQ01s3e3AfYAmm3fBjF2TPk'
});

const STATUS_FLOW = [
  'assigned',
  'on_the_way_to_patient',
  'sample_collected',
  'on_the_way_to_lab',
  'sample_submitted',
  'testing_in_progress',
  'report_ready',
  'delivered'
];

const SAMPLE_FLOW = [
  'Not Collected',
  'Home Sample Assigned',
  'On The Way To Patient',
  'Sample Collected',
  'On The Way To Lab',
  'Sample Submitted',
  'Closed'
];

const REPORT_FLOW = ['Pending', 'In Progress', 'Ready', 'Delivered', 'Closed'];

const sampleToLegacyStatus = {
  'Not Collected': 'pending',
  'Home Sample Assigned': 'assigned',
  'On The Way To Patient': 'on_the_way_to_patient',
  'Sample Collected': 'sample_collected',
  'On The Way To Lab': 'on_the_way_to_lab',
  'Sample Submitted': 'sample_submitted',
  Closed: 'completed'
};

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

const combineAnd = (...clauses) => {
  const active = clauses.filter((clause) => clause && Object.keys(clause).length);
  if (active.length === 0) return {};
  if (active.length === 1) return active[0];
  return { $and: active };
};

const testMasterReadQuery = (req, extra = {}) => (
  req.user.hospitalId
    ? combineAnd(
      { $or: [{ hospitalId: req.user.hospitalId }, { hospitalId: null }, { hospitalId: { $exists: false } }] },
      extra
    )
    : extra
);

const hospitalReadScope = (hospitalId) => (
  hospitalId
    ? { $or: [{ hospitalId }, { hospitalId: null }, { hospitalId: { $exists: false } }] }
    : {}
);

const normalizeKey = (value) => String(value || '').trim().toLowerCase();
const DEFAULT_TAX_PERCENTAGE = 0;
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const calculateBilling = ({ baseAmount, basePrice, taxPercentage = DEFAULT_TAX_PERCENTAGE }) => {
  const base = Number(baseAmount ?? basePrice) || 0;
  const taxRate = Number(taxPercentage) || DEFAULT_TAX_PERCENTAGE;
  const taxAmount = Number(((base * taxRate) / 100).toFixed(2));
  const computedTotal = Number((base + taxAmount).toFixed(2));
  return {
    baseAmount: base,
    taxPercentage: taxRate,
    taxAmount,
    totalAmount: computedTotal,
    isManualTotal: false
  };
};

const calculateTestBilling = (labTest) => calculateBilling({
  basePrice: labTest?.basePrice || 0,
  taxPercentage: labTest?.taxPercentage ?? DEFAULT_TAX_PERCENTAGE
});

const findTestByTitle = (req, title) => LabTest.findOne(testMasterReadQuery(req, {
  $or: [
    { testKey: normalizeKey(title) },
    { title: { $regex: `^${escapeRegex(title)}$`, $options: 'i' } },
    { test: { $regex: `^${escapeRegex(title)}$`, $options: 'i' } }
  ]
}));

const findDiagnosisTestForRequest = async (req, request) => {
  const requestTests = request?.tests || [];
  if (!Array.isArray(requestTests) || requestTests.length === 0) return null;

  const testMasters = await LabTest.find(testMasterReadQuery(req, {
    $or: [
      { testKey: { $in: requestTests.map(normalizeKey) } },
      { title: { $in: requestTests } },
      { test: { $in: requestTests } }
    ]
  })).select('category categoryKey testKey title test');

  return testMasters.find((test) => normalizeKey(test.category) === normalizeKey(DIAGNOSIS_CATEGORY_NAME)) || null;
};

const ensureCategory = async (req, name) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  return LabTestCategory.findOneAndUpdate(
    tenantQuery(req, { nameKey: normalizeKey(trimmed) }),
    { $setOnInsert: { hospitalId: req.user.hospitalId, name: trimmed, nameKey: normalizeKey(trimmed), status: 'Active' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

// Make sure the current hospital always has the system "Diagnosis" category and the
// predefined diagnosis test names configured. Runs on every listTests / listTestCategories
// call so the category + default tests show up the first time a hospital admin opens
// Lab Settings, without requiring a manual seed.
const provisionDiagnosisForHospital = async (req) => {
  try {
    const hospitalId = req.user.hospitalId || null;
    await ensureSystemCategoryForHospital(hospitalId);
    for (const testName of DIAGNOSIS_TESTS) {
      await ensureDiagnosisTestForHospital(hospitalId, testName);
    }
  } catch (error) {
    console.error('Provision Diagnosis category error:', error.message);
  }
};

const sanitizePatientName = (name) => {
  if (!name) return 'Patient';
  return String(name).trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').replace(/^_|_$/g, '') || 'Patient';
};

const createBillOnTheFly = async (req) => {
  const testDetails = [];
  let baseAmount = 0;
  let taxAmount = 0;
  let totalAmount = 0;

  for (const testTitle of req.tests || []) {
    const labTest = await LabTest.findOne(combineAnd(
      hospitalReadScope(req.hospitalId),
      {
        $or: [
        { testKey: normalizeKey(testTitle) },
        { title: { $regex: `^${escapeRegex(testTitle)}$`, $options: 'i' } },
        { test: { $regex: `^${escapeRegex(testTitle)}$`, $options: 'i' } }
        ]
      }
    ));
    if (labTest) {
      const billing = calculateTestBilling(labTest);
      testDetails.push({
        name: labTest.title,
        category: labTest.category,
        basePrice: billing.baseAmount,
        taxPercentage: billing.taxPercentage,
        taxAmount: billing.taxAmount,
        totalAmount: billing.totalAmount
      });
      baseAmount += billing.baseAmount;
      taxAmount += billing.taxAmount;
      totalAmount += billing.totalAmount;
    } else {
      const billing = calculateBilling(req.billing || {});
      testDetails.push({
        name: testTitle,
        category: 'General',
        basePrice: billing.baseAmount,
        taxPercentage: billing.taxPercentage,
        taxAmount: billing.taxAmount,
        totalAmount: billing.totalAmount
      });
      baseAmount += billing.baseAmount;
      taxAmount += billing.taxAmount;
      totalAmount += billing.totalAmount;
    }
  }

  const bill = new LabBill({
    hospitalId: req.hospitalId,
    labRequestId: req._id,
    labId: req.labId,
    patientId: req.patientId?._id || req.patientId,
    doctorId: req.doctorId?._id || req.doctorId,
    testDetails,
    baseAmount,
    taxPercentage: testDetails.length === 1 ? testDetails[0].taxPercentage : DEFAULT_TAX_PERCENTAGE,
    taxAmount,
    totalAmount,
    paidAmount: 0,
    dueAmount: totalAmount,
    paymentStatus: 'Unpaid',
    payments: [],
    createdBy: req.doctorId?._id || req.doctorId || req.user?._id
  });

  await bill.save();
  return bill;
};

const uploadToCloudinary = async (dataUri, folder) => {
  if (!dataUri) return null;
  const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_URL ||
    process.env.CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_API_SECRET
  );
  if (!hasCloudinaryConfig) {
    throw new Error('Cloudinary upload is not configured');
  }

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image'
  });
  return { url: uploaded.secure_url, publicId: uploaded.public_id };
};

const uploadCloudinaryImage = async (req, res) => {
  try {
    const { imageData, folder = 'hms/uploads' } = req.body;
    if (!imageData) return res.status(400).json({ message: 'Image file is required' });

    const uploaded = await uploadToCloudinary(imageData, folder);
    res.status(201).json(uploaded);
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ message: error.message || 'Cloudinary upload failed' });
  }
};

const deleteCloudinaryImage = async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId is required' });

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    res.status(500).json({ message: error.message || 'Cloudinary delete failed' });
  }
};

// Diagnosis Report Template Designer APIs
const getDiagnosisTemplateForTest = async (req, res) => {
  try {
    const test = await LabTest.findOne(testMasterReadQuery(req, { _id: req.params.testId })).select('category title test');
    if (!test) return res.status(404).json({ message: 'Diagnosis test not found' });
    if (normalizeKey(test.category) !== normalizeKey(DIAGNOSIS_CATEGORY_NAME)) {
      return res.status(400).json({ message: 'Templates can be managed only for Diagnosis tests' });
    }

    const template = await DiagnosisTemplate.findOne(tenantQuery(req, { testId: test._id })).sort({ updatedAt: -1 });
    res.json(template || null);
  } catch (error) {
    console.error('Get Diagnosis Template Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const saveDiagnosisTemplateForTest = async (req, res) => {
  try {
    const isLabUser = req.user?.role === 'lab' || req.user?.moduleAccess?.includes(4);
    if (!(req.user.role === 'admin' || isLabUser)) {
      return res.status(403).json({ message: 'Access denied. Only authorized lab users can manage diagnosis templates.' });
    }

    const test = await LabTest.findOne(testMasterReadQuery(req, { _id: req.params.testId })).select('category title test');
    if (!test) return res.status(404).json({ message: 'Diagnosis test not found' });
    if (normalizeKey(test.category) !== normalizeKey(DIAGNOSIS_CATEGORY_NAME)) {
      return res.status(400).json({ message: 'Templates can be saved only for Diagnosis tests' });
    }

    const { templateName, templateStructure, isActive = true } = req.body;
    if (!templateName || !String(templateName).trim()) {
      return res.status(400).json({ message: 'Template name is required' });
    }
    if (!Array.isArray(templateStructure)) {
      return res.status(400).json({ message: 'templateStructure must be an array' });
    }

    const filter = tenantQuery(req, { testId: test._id });
    const update = {
      hospitalId: req.user.hospitalId || null,
      testId: test._id,
      templateName: String(templateName).trim(),
      templateStructure,
      isActive: Boolean(isActive),
      updatedBy: req.user._id
    };

    const saved = await DiagnosisTemplate.findOneAndUpdate(
      filter,
      { $set: update, $setOnInsert: { createdBy: req.user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(saved);
  } catch (error) {
    console.error('Save Diagnosis Template Error:', error);
    if (String(error?.code) === '11000') {
      return res.status(409).json({ message: 'A template already exists for this test' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message || 'Invalid template data' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const getAssistantLabel = async (userId) => {
  if (!userId) return {};
  const profile = await LabAssistantProfile.findOne({ userId }).select('name employeeId');
  if (profile) return { assistantName: `${profile.name} (${profile.employeeId})` };
  const user = await User.findById(userId).select('username doctorName');
  return user ? { assistantName: user.doctorName || user.username } : {};
};

const getDashboard = async (req, res) => {
  try {
    const query = tenantQuery(req);
    
    // Apply date filtering
    const filter = req.query.filter; // today | week | month | custom
    if (filter) {
      const now = new Date();
      if (filter === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.createdAt = { $gte: startOfToday };
      } else if (filter === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        query.createdAt = { $gte: startOfWeek };
      } else if (filter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query.createdAt = { $gte: startOfMonth };
      } else if (filter === 'custom' && (req.query.startDate || req.query.endDate)) {
        query.createdAt = {};
        if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
        if (req.query.endDate) {
          const end = new Date(req.query.endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    const [
      totalRequests,
      uniquePatientIds,
      totalSampleCollected,
      pendingSampleCollection,
      totalReportsGenerated,
      totalReportsDelivered,
      closedRequests,
      homeSampleRequests,
      tests,
      assistants
    ] = await Promise.all([
      LabRequest.countDocuments(query),
      LabRequest.distinct('patientId', query),
      LabRequest.countDocuments({ ...query, sampleStatus: { $in: ['Sample Collected', 'Sample Submitted'] } }),
      LabRequest.countDocuments({ ...query, sampleStatus: { $in: ['Not Collected', 'Home Sample Assigned', 'On The Way To Patient'] } }),
      LabRequest.countDocuments({ ...query, reportStatus: { $in: ['Completed', 'Ready'] } }),
      LabRequest.countDocuments({ ...query, reportStatus: 'Delivered' }),
      LabRequest.countDocuments({ ...query, $or: [{ status: 'completed' }, { sampleStatus: 'Closed' }, { reportStatus: 'Closed' }] }),
      LabRequest.countDocuments({ ...query, collectionType: 'Home Sample Collection' }),
      LabTest.countDocuments(tenantQuery(req)),
      LabAssistantProfile.countDocuments({ ...tenantQuery(req), status: 'Active' })
    ]);

    // Compute Billing metrics
    const billQuery = tenantQuery(req);
    if (filter) {
      const now = new Date();
      if (filter === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        billQuery.createdAt = { $gte: startOfToday };
      } else if (filter === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        billQuery.createdAt = { $gte: startOfWeek };
      } else if (filter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        billQuery.createdAt = { $gte: startOfMonth };
      } else if (filter === 'custom' && (req.query.startDate || req.query.endDate)) {
        billQuery.createdAt = {};
        if (req.query.startDate) billQuery.createdAt.$gte = new Date(req.query.startDate);
        if (req.query.endDate) {
          const end = new Date(req.query.endDate);
          end.setHours(23, 59, 59, 999);
          billQuery.createdAt.$lte = end;
        }
      }
    }

    const bills = await LabBill.find(billQuery);
    let totalRevenue = 0;
    let todayCollection = 0;
    let monthlyCollection = 0;
    let unpaidBills = 0;
    let partialPayments = 0;
    let paidBills = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    bills.forEach(bill => {
      totalRevenue += bill.paidAmount || 0;
      if (bill.paymentStatus === 'Unpaid') unpaidBills++;
      else if (bill.paymentStatus === 'Partial') partialPayments++;
      else if (bill.paymentStatus === 'Paid') paidBills++;

      (bill.payments || []).forEach(pmt => {
        const pmtDate = new Date(pmt.date);
        if (pmtDate >= todayStart) {
          todayCollection += pmt.amount;
        }
        if (pmtDate >= monthStart) {
          monthlyCollection += pmt.amount;
        }
      });
    });

    res.json({
      totalRequests,
      totalPatients: uniquePatientIds.length,
      totalSampleCollected,
      pendingSampleCollection,
      totalReportsGenerated,
      totalReportsDelivered,
      closedRequests,
      homeSampleRequests,
      tests,
      assistants,
      billingSummary: {
        totalRevenue,
        todayCollection,
        monthlyCollection,
        unpaidBills,
        partialPayments,
        paidBills
      }
    });
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLabRequests = async (req, res) => {
  const query = tenantQuery(req);
  if (req.query.status) query.status = req.query.status;
  if (req.query.sampleStatus) query.sampleStatus = req.query.sampleStatus;
  if (req.query.reportStatus) query.reportStatus = req.query.reportStatus;
  if (req.query.collectionType) query.collectionType = req.query.collectionType;
  if (req.query.homeOnly === 'true') query.collectionType = 'Home Sample Collection';
  
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (req.query.q) {
    const patients = await Patient.find({
      $or: [
        { uhid: { $regex: req.query.q, $options: 'i' } },
        { patientName: { $regex: req.query.q, $options: 'i' } },
        { mobile: { $regex: req.query.q, $options: 'i' } }
      ]
    }).select('_id');
    const patientIds = patients.map(p => p._id);
    
    query.$or = [
      { labId: { $regex: req.query.q, $options: 'i' } },
      { tests: { $regex: req.query.q, $options: 'i' } },
      { patientId: { $in: patientIds } }
    ];
  }

  const requests = await LabRequest.find(query)
    .populate('patientId', 'uhid patientName mobile gender dob address department appointmentDate slot')
    .populate('doctorId', 'doctorName username department')
    .populate('assignedAssistantId', 'username doctorName mobile')
    .populate('collectedBy', 'username doctorName mobile')
    .populate('cancelledBy', 'username doctorName mobile')
    .populate('report.signatoryId', 'name designation qualification signatureImageUrl')
    .sort({ createdAt: -1 });

  const missingLabIds = requests.filter((request) => !request.labId);
  if (missingLabIds.length) {
    await Promise.all(missingLabIds.map((request) => request.save()));
  }

  const populatedRequests = await Promise.all(
    requests.map(async (req) => {
      const reqObj = req.toObject();
      let bill = await LabBill.findOne({ labRequestId: req._id })
        .populate('payments.receivedBy', 'username doctorName');
      if (!bill) {
        bill = await createBillOnTheFly(req);
      }
      reqObj.billingRecord = bill;
      return reqObj;
    })
  );

  res.json(populatedRequests);
};

const updateLabRequest = async (req, res) => {
  const request = await LabRequest.findOne(tenantQuery(req, { _id: req.params.id }));
  if (!request) return res.status(404).json({ message: 'Lab request not found' });

  if (req.body.status || req.body.sampleStatus || req.body.reportStatus) {
    const nextSampleStatus = req.body.sampleStatus || request.sampleStatus;
    const nextReportStatus = req.body.reportStatus || request.reportStatus;
    if ((nextSampleStatus === 'Closed' || nextReportStatus === 'Closed') && !req.body.cancellationReason && !request.cancellationReason) {
      return res.status(400).json({ message: 'Cancellation reason / remarks is required before closing a lab request' });
    }

    if (req.body.status) request.status = req.body.status;
    if (req.body.sampleStatus) {
      request.sampleStatus = req.body.sampleStatus;
      request.status = sampleToLegacyStatus[req.body.sampleStatus] || request.status;
    }
    if (req.body.reportStatus) request.reportStatus = req.body.reportStatus;

    const assistantId = req.body.assistantId || (req.user.role === 'lab' ? req.user._id : request.assignedAssistantId);
    const label = await getAssistantLabel(assistantId);
    request.statusHistory.push({
      status: req.body.status || `${nextSampleStatus} / ${nextReportStatus}`,
      assistantId,
      ...label,
      notes: req.body.notes || ''
    });
  }

  if (req.body.assignedAssistantId) {
    request.assignedAssistantId = req.body.assignedAssistantId;
    request.assignedAt = new Date();
    if (request.collectionType === 'Home Sample Collection') {
      request.sampleStatus = 'Home Sample Assigned';
      request.reportStatus = 'Pending';
      request.status = 'assigned';
      const label = await getAssistantLabel(req.body.assignedAssistantId);
      request.statusHistory.push({
        status: 'Home Sample Assigned',
        assistantId: req.body.assignedAssistantId,
        ...label,
        notes: req.body.notes || 'Home sample assigned'
      });
    }
  }
  if (req.body.collectionTime !== undefined) request.collectionTime = req.body.collectionTime;
  if (req.body.collectionType) request.collectionType = req.body.collectionType;
  if (req.body.bookingDate) request.bookingDate = req.body.bookingDate;
  if (req.body.remarks !== undefined) request.remarks = req.body.remarks;
  if (req.body.expectedCollectionDate) request.expectedCollectionDate = req.body.expectedCollectionDate;
  if (req.body.collectionDate) request.collectionDate = req.body.collectionDate;
  if (req.body.collectedBy) request.collectedBy = req.body.collectedBy;
  if (req.body.collectedByName !== undefined) request.collectedByName = req.body.collectedByName;
  if (req.body.markCollectedNow) {
    request.sampleStatus = 'Sample Collected';
    request.reportStatus = 'Pending';
    request.status = 'sample_collected';
    request.collectionDate = req.body.collectionDate || new Date();
    request.collectionTime = req.body.collectionTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    request.collectedBy = req.user._id;
    request.collectedByName = req.user.doctorName || req.user.username;
    request.statusHistory.push({
      status: 'Sample Collected',
      assistantId: req.user._id,
      assistantName: request.collectedByName,
      notes: req.body.notes || 'Same day sample collected'
    });
  }
  if (req.body.cancellationReason) {
    request.sampleStatus = 'Closed';
    request.reportStatus = 'Closed';
    request.status = 'completed';
    request.cancellationReason = req.body.cancellationReason;
    request.cancellationRemarks = req.body.cancellationRemarks || req.body.remarks || '';
    request.cancelledAt = new Date();
    request.cancelledBy = req.user._id;
    request.statusHistory.push({
      status: 'Closed',
      assistantId: req.user._id,
      assistantName: req.user.doctorName || req.user.username,
      notes: `${req.body.cancellationReason}${request.cancellationRemarks ? ` - ${request.cancellationRemarks}` : ''}`
    });
  }
  if (req.body.billing) request.billing = calculateBilling(req.body.billing);
  if (req.body.report) {
    request.report = { ...request.report?.toObject?.(), ...req.body.report, generatedAt: req.body.report.generatedAt || new Date() };
    request.reportStatus = req.body.reportStatus || 'Ready';
    request.status = 'report_ready';
  }

  await request.save();
  const populated = await request.populate([
    { path: 'patientId', select: 'uhid patientName mobile gender dob address department appointmentDate slot' },
    { path: 'doctorId', select: 'doctorName username department' },
    { path: 'assignedAssistantId', select: 'username doctorName mobile' },
    { path: 'collectedBy', select: 'username doctorName mobile' },
    { path: 'cancelledBy', select: 'username doctorName mobile' },
    { path: 'report.signatoryId', select: 'name designation qualification signatureImageUrl' }
  ]);
  res.json(populated);
};

const listTests = async (req, res) => {
  await provisionDiagnosisForHospital(req);
  const query = testMasterReadQuery(req);
  if (req.query.category) query.category = req.query.category;
  if (req.query.q) {
    query.$or = [
      { title: { $regex: req.query.q, $options: 'i' } },
      { category: { $regex: req.query.q, $options: 'i' } }
    ];
  }
  const tests = await LabTest.find(query).sort({ category: 1, test: 1, title: 1 });
  res.json(tests);
};

const listTestCategories = async (req, res) => {
  await provisionDiagnosisForHospital(req);
  const [savedCategories, testCategories] = await Promise.all([
    LabTestCategory.find(tenantQuery(req, { status: 'Active' })).sort({ name: 1 }),
    LabTest.distinct('category', testMasterReadQuery(req))
  ]);

  const categoryMap = new Map();
  savedCategories.forEach((category) => {
    categoryMap.set(normalizeKey(category.name), {
      _id: category._id,
      name: category.name,
      status: category.status,
      isSystem: Boolean(category.isSystem),
      systemKey: category.systemKey || '',
      source: 'category'
    });
  });
  testCategories.filter(Boolean).forEach((name) => {
    const key = normalizeKey(name);
    if (!categoryMap.has(key)) {
      const isSystem = key === normalizeKey(DIAGNOSIS_CATEGORY_NAME);
      categoryMap.set(key, {
        name,
        isSystem,
        systemKey: isSystem ? DIAGNOSIS_SYSTEM_KEY : '',
        source: 'test'
      });
    }
  });

  // Always include the Diagnosis system category even if the hospital has
  // not yet created any custom diagnosis tests.
  const diagnosisKey = normalizeKey(DIAGNOSIS_CATEGORY_NAME);
  if (!categoryMap.has(diagnosisKey)) {
    categoryMap.set(diagnosisKey, {
      name: DIAGNOSIS_CATEGORY_NAME,
      isSystem: true,
      systemKey: DIAGNOSIS_SYSTEM_KEY,
      source: 'system'
    });
  }

  res.json(Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
};

const saveTestCategory = async (req, res) => {
  const name = String(req.body.name || req.body.category || '').trim();
  if (!name) return res.status(400).json({ message: 'Category name is required' });

  // The Diagnosis category is a system category. Make sure it is always
  // available and never duplicated.
  if (normalizeKey(name) === normalizeKey(DIAGNOSIS_CATEGORY_NAME)) {
    const category = await ensureSystemCategoryForHospital(req.user.hospitalId || null);
    return res.status(200).json(category);
  }

  try {
    const category = await ensureCategory(req, name);
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Category already exists' });
    }
    throw error;
  }
};

const saveTest = async (req, res) => {
  const body = req.body;
  if (!body.category || !body.title) return res.status(400).json({ message: 'Category and test title are required' });
  const category = String(body.category).trim();
  const testName = String(body.test || body.title).trim();
  const title = String(body.title || testName).trim();
  const duplicate = await LabTest.findOne(testMasterReadQuery(req, {
    $and: [
      {
        $or: [
          { categoryKey: normalizeKey(category) },
          { category: { $regex: `^${escapeRegex(category)}$`, $options: 'i' } }
        ]
      },
      {
        $or: [
          { testKey: normalizeKey(testName) },
          { test: { $regex: `^${escapeRegex(testName)}$`, $options: 'i' } },
          { title: { $regex: `^${escapeRegex(testName)}$`, $options: 'i' } }
        ]
      }
    ],
    ...(req.params.id ? { _id: { $ne: req.params.id } } : {})
  }));
  if (duplicate) return res.status(409).json({ message: 'Test already exists in this category' });

  await ensureCategory(req, category);
  const billing = calculateBilling({ basePrice: body.basePrice, taxPercentage: body.taxPercentage });
  const payload = {
    hospitalId: req.user.hospitalId,
    category,
    categoryKey: normalizeKey(category),
    test: testName,
    testKey: normalizeKey(testName),
    title,
    description: body.description || '',
    notes: body.notes || '',
    basePrice: billing.baseAmount,
    taxPercentage: billing.taxPercentage,
    totalAmount: billing.totalAmount,
    isManualTotal: false,
    parameters: body.parameters || [],
    signatoryId: body.signatoryId || null,
    status: body.status || 'Active'
  };

  const test = req.params.id
    ? await LabTest.findOneAndUpdate(testMasterReadQuery(req, { _id: req.params.id }), payload, { new: true, runValidators: true })
    : await LabTest.create(payload);

  if (!test) return res.status(404).json({ message: 'Lab test not found' });
  res.status(req.params.id ? 200 : 201).json(test);
};

const deleteTest = async (req, res) => {
  const deleted = await LabTest.findOneAndDelete(testMasterReadQuery(req, { _id: req.params.id }));
  if (!deleted) return res.status(404).json({ message: 'Lab test not found' });
  res.json({ message: 'Lab test deleted' });
};

const listProfiles = async (req, res) => {
  res.json(await LabProfile.find(tenantQuery(req)).sort({ createdAt: -1 }));
};

const saveProfile = async (req, res) => {
  const payload = { ...req.body, hospitalId: req.user.hospitalId };
  if (payload.logoImageData) {
    const uploaded = await uploadToCloudinary(payload.logoImageData, 'hms/lab-logos');
    payload.logoUrl = uploaded.url;
    delete payload.logoImageData;
  }
  const profile = req.params.id
    ? await LabProfile.findOneAndUpdate(tenantQuery(req, { _id: req.params.id }), payload, { new: true, runValidators: true })
    : await LabProfile.create(payload);
  if (!profile) return res.status(404).json({ message: 'Lab details not found' });
  res.status(req.params.id ? 200 : 201).json(profile);
};

const deleteProfile = async (req, res) => {
  const deleted = await LabProfile.findOneAndDelete(tenantQuery(req, { _id: req.params.id }));
  if (!deleted) return res.status(404).json({ message: 'Lab details not found' });
  res.json({ message: 'Lab details deleted' });
};

const listSignatories = async (req, res) => {
  res.json(await LabSignatory.find(tenantQuery(req)).sort({ createdAt: -1 }));
};

const saveSignatory = async (req, res) => {
  const payload = { ...req.body, hospitalId: req.user.hospitalId };
  if (payload.signatureImageData) {
    const uploaded = await uploadToCloudinary(payload.signatureImageData, 'hms/lab-signatures');
    payload.signatureImageUrl = uploaded.url;
    payload.cloudinaryPublicId = uploaded.publicId;
    delete payload.signatureImageData;
  }
  const signatory = req.params.id
    ? await LabSignatory.findOneAndUpdate(tenantQuery(req, { _id: req.params.id }), payload, { new: true, runValidators: true })
    : await LabSignatory.create(payload);
  if (!signatory) return res.status(404).json({ message: 'Signatory not found' });
  res.status(req.params.id ? 200 : 201).json(signatory);
};

const deleteSignatory = async (req, res) => {
  const deleted = await LabSignatory.findOneAndDelete(tenantQuery(req, { _id: req.params.id }));
  if (!deleted) return res.status(404).json({ message: 'Signatory not found' });
  res.json({ message: 'Signatory deleted' });
};

const listAssistants = async (req, res) => {
  const query = tenantQuery(req);
  if (req.query.q) {
    query.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { employeeId: { $regex: req.query.q, $options: 'i' } },
      { mobile: { $regex: req.query.q, $options: 'i' } }
    ];
  }
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const [items, total] = await Promise.all([
    LabAssistantProfile.find(query).populate('userId', 'username isActive mobile').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    LabAssistantProfile.countDocuments(query)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};

const saveAssistant = async (req, res) => {
  const { employeeId, name, mobile, username, password, workRole, status = 'Active' } = req.body;
  if (!employeeId || !name || !mobile || !username || !workRole) {
    return res.status(400).json({ message: 'Employee ID, name, mobile, username, and work role are required' });
  }

  let user;
  if (req.params.id) {
    const profile = await LabAssistantProfile.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!profile) return res.status(404).json({ message: 'Assistant not found' });
    user = await User.findById(profile.userId);
    user.username = username.toLowerCase().trim();
    user.mobile = mobile;
    user.doctorName = name;
    user.isActive = status === 'Active';
    if (password) user.password = password;
    await user.save();
    profile.employeeId = employeeId;
    profile.name = name;
    profile.mobile = mobile;
    profile.workRole = workRole;
    profile.status = status;
    await profile.save();
    return res.json(await profile.populate('userId', 'username isActive mobile'));
  }

  user = await User.create({
    hospitalId: req.user.hospitalId,
    username: username.toLowerCase().trim(),
    password: password || employeeId,
    role: 'lab',
    moduleAccess: [4],
    doctorName: name,
    mobile,
    isActive: status === 'Active'
  });

  const profile = await LabAssistantProfile.create({
    hospitalId: req.user.hospitalId,
    userId: user._id,
    employeeId,
    name,
    mobile,
    workRole,
    status
  });
  res.status(201).json(await profile.populate('userId', 'username isActive mobile'));
};

const deleteAssistant = async (req, res) => {
  const profile = await LabAssistantProfile.findOneAndDelete(tenantQuery(req, { _id: req.params.id }));
  if (!profile) return res.status(404).json({ message: 'Assistant not found' });
  await User.findByIdAndUpdate(profile.userId, { isActive: false });
  res.json({ message: 'Assistant deleted' });
};

const saveReportDraft = async (req, res) => {
  try {
    const request = await LabRequest.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!request) return res.status(404).json({ message: 'Lab request not found' });
    
    if (request.sampleStatus !== 'Sample Collected' && request.sampleStatus !== 'Sample Submitted') {
      return res.status(400).json({ message: 'Sample collection is pending.' });
    }

    if (request.report?.isLocked) {
      return res.status(400).json({ message: 'Report is generated and locked. Ask an admin to unlock it.' });
    }

    const { notes, remarks, interpretation, parameters, signatoryId, dynamicFields, dynamicTemplateId } = req.body;

    const diagnosisTest = await findDiagnosisTestForRequest(req, request);
    const isDiagnosis = Boolean(diagnosisTest);

    request.report = {
      ...request.report,
      notes: notes !== undefined ? notes : request.report?.notes,
      remarks: remarks !== undefined ? remarks : request.report?.remarks,
      interpretation: interpretation !== undefined ? interpretation : request.report?.interpretation,
      parameters: parameters !== undefined ? parameters : request.report?.parameters,
      dynamicFields: isDiagnosis
        ? (dynamicFields !== undefined ? dynamicFields : request.report?.dynamicFields)
        : request.report?.dynamicFields,
      dynamicTemplateId: isDiagnosis
        ? (dynamicTemplateId !== undefined ? dynamicTemplateId : request.report?.dynamicTemplateId)
        : request.report?.dynamicTemplateId,
      signatoryId: signatoryId !== undefined ? signatoryId : request.report?.signatoryId,
      updatedBy: req.user._id,
      updatedAt: new Date(),
      createdBy: request.report?.createdBy || req.user._id
    };

    request.reportStatus = 'In Progress';
    request.status = 'testing_in_progress';

    await request.save();
    
    const populated = await request.populate([
      { path: 'patientId', select: 'uhid patientName mobile gender dob address department appointmentDate slot' },
      { path: 'doctorId', select: 'doctorName username department' },
      { path: 'assignedAssistantId', select: 'username doctorName mobile' },
      { path: 'collectedBy', select: 'username doctorName mobile' },
      { path: 'cancelledBy', select: 'username doctorName mobile' },
      { path: 'report.signatoryId', select: 'name designation qualification signatureImageUrl' }
    ]);
    res.json(populated);
  } catch (error) {
    console.error('Save Draft Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateReport = async (req, res) => {
  try {
    const request = await LabRequest.findOne(tenantQuery(req, { _id: req.params.id }))
      .populate('patientId')
      .populate('report.signatoryId');
    if (!request) return res.status(404).json({ message: 'Lab request not found' });

    if (request.sampleStatus !== 'Sample Collected' && request.sampleStatus !== 'Sample Submitted') {
      return res.status(400).json({ message: 'Sample collection is pending.' });
    }

    const { notes, remarks, interpretation, parameters, signatoryId, dynamicFields, dynamicTemplateId } = req.body;

    const diagnosisTest = await findDiagnosisTestForRequest(req, request);
    const isDiagnosis = Boolean(diagnosisTest);

    let resolvedDynamicFields = dynamicFields !== undefined ? dynamicFields : request.report?.dynamicFields;
    let resolvedParameters = parameters;
    let resolvedTemplate = null;

    if (isDiagnosis) {
      resolvedTemplate = dynamicTemplateId
        ? await DiagnosisTemplate.findOne(tenantQuery(req, { _id: dynamicTemplateId }))
        : await DiagnosisTemplate.findOne(tenantQuery(req, { testId: diagnosisTest._id }));

      if (!resolvedTemplate || !resolvedTemplate.isActive) {
        return res.status(400).json({ message: 'No active diagnosis template found for this test.' });
      }

      if (!resolvedDynamicFields || typeof resolvedDynamicFields !== 'object') {
        return res.status(400).json({ message: 'Diagnosis report data is missing.' });
      }

      // Diagnosis reports do not require parameter-based results.
      if (!Array.isArray(resolvedParameters)) {
        resolvedParameters = Array.isArray(request.report?.parameters) ? request.report.parameters : [];
      }
    } else {
      if (!resolvedParameters || !Array.isArray(resolvedParameters) || resolvedParameters.length === 0) {
        return res.status(400).json({ message: 'Test parameters are missing.' });
      }

      for (const param of resolvedParameters) {
        if (param.value === undefined || param.value === null || param.value.toString().trim() === '') {
          return res.status(400).json({ message: `Please enter result value for parameter: ${param.name}` });
        }
      }
    }

    let signatoryObj = null;
    const sigId = signatoryId || request.report?.signatoryId;
    if (sigId) {
      signatoryObj = await LabSignatory.findById(sigId);
    }

    const now = new Date();
    const completionDate = now;
    const completionTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    request.report = {
      ...request.report,
      notes: notes !== undefined ? notes : request.report?.notes,
      remarks: remarks !== undefined ? remarks : request.report?.remarks,
      interpretation: interpretation !== undefined ? interpretation : request.report?.interpretation,
      parameters: isDiagnosis ? resolvedParameters : resolvedParameters,
      dynamicFields: isDiagnosis ? resolvedDynamicFields : request.report?.dynamicFields,
      dynamicTemplateId: isDiagnosis ? resolvedTemplate?._id : request.report?.dynamicTemplateId,
      signatoryId: sigId,
      generatedBy: req.user._id,
      generatedAt: now,
      isLocked: true,
      completionDate,
      completionTime,
      createdBy: request.report?.createdBy || req.user._id,
      updatedBy: req.user._id,
      updatedAt: now
    };

    request.reportStatus = 'Completed';
    request.status = 'completed';

    request.statusHistory.push({
      status: 'Completed',
      assistantId: req.user._id,
      assistantName: req.user.doctorName || req.user.username,
      notes: 'Report generated and locked.'
    });

    await request.save();

    const patient = request.patientId;
    
    const requestTests = request.tests || [];
    const testMasters = await LabTest.find(tenantQuery(req, {
      $or: [
        { testKey: { $in: requestTests.map(normalizeKey) } },
        { title: { $in: requestTests } },
        { test: { $in: requestTests } }
      ]
    }));
    const testMasterByKey = new Map(testMasters.map((test) => [test.testKey, test]));
    const testCategory = requestTests
      .map((testName) => testMasterByKey.get(normalizeKey(testName))?.category)
      .filter(Boolean)
      .filter((category, index, list) => list.indexOf(category) === index)
      .join(', ');

    const pdfFileName = `${sanitizePatientName(patient.patientName)}_${request.labId}.pdf`;

    const historyPayload = {
      hospitalId: req.user.hospitalId,
      patientId: patient._id,
      uhid: patient.uhid,
      labId: request.labId,
      testName: requestTests.join(', '),
      testCategory: testCategory,
      reportData: {
        parameters: request.report.parameters || [],
        dynamicFields: request.report.dynamicFields,
        dynamicTemplateId: request.report.dynamicTemplateId,
        remarks: request.report.remarks || '',
        notes: request.report.notes || '',
        interpretation: request.report.interpretation || '',
        signatory: signatoryObj ? {
          name: signatoryObj.name,
          designation: signatoryObj.designation,
          qualification: signatoryObj.qualification,
          signatureImageUrl: signatoryObj.signatureImageUrl
        } : undefined
      },
      generatedBy: req.user._id,
      generatedByName: req.user.doctorName || req.user.username,
      generatedDate: completionDate,
      generatedTime: completionTime,
      pdfFileRef: pdfFileName,
      reportStatus: 'Completed'
    };

    await PatientHistory.deleteMany({ labId: request.labId });
    await new PatientHistory(historyPayload).save();

    // Store pdfFileRef on the request.report for future reference (backward compatible)
    request.report = request.report || {};
    request.report.pdfFileRef = pdfFileName;
    await request.save();

    const populated = await request.populate([
      { path: 'patientId', select: 'uhid patientName mobile gender dob address department appointmentDate slot' },
      { path: 'doctorId', select: 'doctorName username department' },
      { path: 'assignedAssistantId', select: 'username doctorName mobile' },
      { path: 'collectedBy', select: 'username doctorName mobile' },
      { path: 'cancelledBy', select: 'username doctorName mobile' },
      { path: 'report.signatoryId', select: 'name designation qualification signatureImageUrl' }
    ]);
    res.json(populated);
  } catch (error) {
    console.error('Generate Report Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deliverReport = async (req, res) => {
  try {
    const request = await LabRequest.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!request) return res.status(404).json({ message: 'Lab request not found' });

    if (request.reportStatus !== 'Completed') {
      return res.status(400).json({ message: 'Report must be completed/generated before marking as delivered.' });
    }

    const now = new Date();
    const deliveryDate = now;
    const deliveryTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    request.reportStatus = 'Delivered';
    request.status = 'completed';
    
    request.report = {
      ...request.report,
      deliveredBy: req.user._id,
      deliveredAt: now,
      deliveryDate,
      deliveryTime
    };

    request.statusHistory.push({
      status: 'Delivered',
      assistantId: req.user._id,
      assistantName: req.user.doctorName || req.user.username,
      notes: 'Report marked as delivered.'
    });

    await request.save();

    await PatientHistory.findOneAndUpdate(
      { labId: request.labId },
      { reportStatus: 'Delivered' }
    );

    const populated = await request.populate([
      { path: 'patientId', select: 'uhid patientName mobile gender dob address department appointmentDate slot' },
      { path: 'doctorId', select: 'doctorName username department' },
      { path: 'assignedAssistantId', select: 'username doctorName mobile' },
      { path: 'collectedBy', select: 'username doctorName mobile' },
      { path: 'cancelledBy', select: 'username doctorName mobile' },
      { path: 'report.signatoryId', select: 'name designation qualification signatureImageUrl' }
    ]);
    res.json(populated);
  } catch (error) {
    console.error('Deliver Report Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const unlockReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admin can unlock reports.' });
    }

    const request = await LabRequest.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!request) return res.status(404).json({ message: 'Lab request not found' });

    request.report = {
      ...request.report,
      isLocked: false
    };

    request.statusHistory.push({
      status: 'Unlocked',
      assistantId: req.user._id,
      assistantName: req.user.doctorName || req.user.username,
      notes: 'Report unlocked by admin.'
    });

    await request.save();
    
    const populated = await request.populate([
      { path: 'patientId', select: 'uhid patientName mobile gender dob address department appointmentDate slot' },
      { path: 'doctorId', select: 'doctorName username department' },
      { path: 'assignedAssistantId', select: 'username doctorName mobile' },
      { path: 'collectedBy', select: 'username doctorName mobile' },
      { path: 'cancelledBy', select: 'username doctorName mobile' },
      { path: 'report.signatoryId', select: 'name designation qualification signatureImageUrl' }
    ]);
    res.json(populated);
  } catch (error) {
    console.error('Unlock Report Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    const query = tenantQuery(req);
    
    if (req.query.q) {
      const patients = await Patient.find({
        $or: [
          { uhid: { $regex: req.query.q, $options: 'i' } },
          { patientName: { $regex: req.query.q, $options: 'i' } },
          { mobile: { $regex: req.query.q, $options: 'i' } }
        ]
      }).select('_id');
      const patientIds = patients.map(p => p._id);
      query.$or = [
        { labId: { $regex: req.query.q, $options: 'i' } },
        { patientId: { $in: patientIds } }
      ];
    }

    const histories = await PatientHistory.find(query)
      .populate('patientId')
      .populate('generatedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.json(histories);
  } catch (error) {
    console.error('Get Patient History Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const collectReport = async (req, res) => {
  try {
    const request = await LabRequest.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!request) return res.status(404).json({ message: 'Lab request not found' });

    if (request.reportStatus !== 'Completed' && request.reportStatus !== 'Delivered') {
      return res.status(400).json({ message: 'Report must be completed/generated before marking as collected.' });
    }

    const now = new Date();
    const collectedDate = now;
    const collectedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    request.report.collectionStatus = 'Collected';
    request.report.collectedBy = req.user._id;
    request.report.collectedAt = now;
    request.report.collectedDate = collectedDate;
    request.report.collectedTime = collectedTime;

    request.reportStatus = 'Delivered';
    request.status = 'completed';

    request.statusHistory.push({
      status: 'Report Collected',
      assistantId: req.user._id,
      assistantName: req.user.doctorName || req.user.username,
      notes: 'Report collected by patient.'
    });

    await request.save();

    await PatientHistory.findOneAndUpdate(
      { labId: request.labId },
      {
        reportStatus: 'Delivered',
        reportCollectionStatus: 'Collected',
        reportCollectedBy: req.user._id,
        reportCollectedByName: req.user.doctorName || req.user.username,
        reportCollectedAt: now,
        reportCollectedTime: collectedTime
      }
    );

    const populated = await request.populate([
      { path: 'patientId', select: 'uhid patientName mobile gender dob address department appointmentDate slot' },
      { path: 'doctorId', select: 'doctorName username department' },
      { path: 'assignedAssistantId', select: 'username doctorName mobile' },
      { path: 'collectedBy', select: 'username doctorName mobile' },
      { path: 'cancelledBy', select: 'username doctorName mobile' },
      { path: 'report.signatoryId', select: 'name designation qualification signatureImageUrl' }
    ]);
    res.json(populated);
  } catch (error) {
    console.error('Collect Report Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createDirectLabRequest = async (req, res) => {
  try {
    const { patientId, tests, collectionType, bookingDate, remarks } = req.body;
    if (!patientId) {
      return res.status(400).json({ message: 'Patient UHID is mandatory.' });
    }
    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({ message: 'At least one test must be selected.' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Resolve doctorId
    let doctorId = req.body.doctorId;
    if (!doctorId) {
      const latestConsultation = await Consultation.findOne(tenantQuery(req, { patientId })).sort({ createdAt: -1 });
      if (latestConsultation) {
        doctorId = latestConsultation.doctorId;
      }
    }
    if (!doctorId) {
      const doctorUser = await User.findOne({ hospitalId: req.user.hospitalId, role: 'doctor', isActive: true });
      if (doctorUser) {
        doctorId = doctorUser._id;
      } else {
        doctorId = req.user._id; // Fallback
      }
    }

    const isHomeCollection = collectionType === 'Home Sample Collection';
    const createdRequests = [];

    for (const testTitle of tests) {
      const labTest = await findTestByTitle(req, testTitle);
      let billing = { baseAmount: 0, taxPercentage: 0, taxAmount: 0, totalAmount: 0 };
      if (labTest) {
        billing = calculateTestBilling(labTest);
      }

      const newRequest = new LabRequest({
        patientId,
        hospitalId: req.user.hospitalId,
        doctorId,
        tests: [testTitle],
        collectionType: collectionType || 'Lab Visit',
        bookingDate: bookingDate || new Date(),
        remarks: remarks || '',
        sampleStatus: isHomeCollection ? 'Home Sample Assigned' : 'Not Collected',
        reportStatus: 'Pending',
        status: isHomeCollection ? 'assigned' : 'pending',
        statusHistory: [{
          status: isHomeCollection ? 'Home Sample Assigned' : 'Not Collected',
          assistantId: req.user._id,
          assistantName: req.user.doctorName || req.user.username,
          notes: isHomeCollection ? 'Direct home sample collection request created' : 'Direct lab request created'
        }],
        billing
      });
      await newRequest.save();
      createdRequests.push(newRequest);
    }

    res.status(201).json({
      message: `${createdRequests.length} lab request(s) created successfully.`,
      requests: createdRequests
    });
  } catch (error) {
    console.error('Create Direct Lab Request Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecommendedTests = async (req, res) => {
  try {
    const { patientId } = req.params;
    const latestConsultation = await Consultation.findOne(tenantQuery(req, { patientId }))
      .sort({ createdAt: -1 })
      .populate('doctorId', 'doctorName username department');

    if (!latestConsultation) {
      return res.json({ recommendedTests: [], consultation: null });
    }

    res.json({
      recommendedTests: latestConsultation.tests || [],
      consultation: {
        _id: latestConsultation._id,
        doctorId: latestConsultation.doctorId?._id,
        doctorName: latestConsultation.doctorId?.doctorName || latestConsultation.doctorId?.username,
        department: latestConsultation.doctorId?.department,
        createdAt: latestConsultation.createdAt
      }
    });
  } catch (error) {
    console.error('Get Recommended Tests Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBills = async (req, res) => {
  try {
    const query = tenantQuery(req);
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;
    
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (req.query.q) {
      const patients = await Patient.find({
        $or: [
          { uhid: { $regex: req.query.q, $options: 'i' } },
          { patientName: { $regex: req.query.q, $options: 'i' } },
          { mobile: { $regex: req.query.q, $options: 'i' } }
        ]
      }).select('_id');
      const patientIds = patients.map(p => p._id);

      query.$or = [
        { billNo: { $regex: req.query.q, $options: 'i' } },
        { labId: { $regex: req.query.q, $options: 'i' } },
        { patientId: { $in: patientIds } }
      ];
    }

    const bills = await LabBill.find(query)
      .populate('patientId', 'uhid patientName mobile gender dob address')
      .populate('doctorId', 'doctorName username department')
      .populate('payments.receivedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    console.error('Get Bills Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const receivePayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionRef, remarks } = req.body;
    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero.' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required.' });
    }

    const bill = await LabBill.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!bill) {
      return res.status(404).json({ message: 'Billing record not found.' });
    }

    const receiveAmt = Number(amount);
    if (receiveAmt > bill.dueAmount) {
      return res.status(400).json({ message: `Cannot receive Rs. ${receiveAmt}. Max due amount is Rs. ${bill.dueAmount}.` });
    }

    const now = new Date();
    const paymentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    bill.payments.push({
      amount: receiveAmt,
      paymentMethod,
      transactionRef: transactionRef || '',
      remarks: remarks || '',
      receivedBy: req.user._id,
      receivedByName: req.user.doctorName || req.user.username,
      date: now,
      time: paymentTime
    });

    bill.paidAmount = Number((bill.paidAmount + receiveAmt).toFixed(2));
    bill.dueAmount = Number((bill.totalAmount - bill.paidAmount).toFixed(2));

    if (bill.dueAmount === 0) {
      bill.paymentStatus = 'Paid';
    } else if (bill.paidAmount > 0) {
      bill.paymentStatus = 'Partial';
    } else {
      bill.paymentStatus = 'Unpaid';
    }

    bill.updatedBy = req.user._id;
    await bill.save();

    const populated = await LabBill.findById(bill._id)
      .populate('patientId', 'uhid patientName mobile gender dob address')
      .populate('doctorId', 'doctorName username department')
      .populate('payments.receivedBy', 'username doctorName');

    res.json(populated);
  } catch (error) {
    console.error('Receive Payment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  STATUS_FLOW,
  SAMPLE_FLOW,
  REPORT_FLOW,
  uploadCloudinaryImage,
  deleteCloudinaryImage,
  getDiagnosisTemplateForTest,
  saveDiagnosisTemplateForTest,
  getDashboard,
  getLabRequests,
  updateLabRequest,
  listTests,
  listTestCategories,
  saveTestCategory,
  saveTest,
  deleteTest,
  listProfiles,
  saveProfile,
  deleteProfile,
  listSignatories,
  saveSignatory,
  deleteSignatory,
  listAssistants,
  saveAssistant,
  deleteAssistant,
  saveReportDraft,
  generateReport,
  deliverReport,
  unlockReport,
  getPatientHistory,
  collectReport,
  createDirectLabRequest,
  getRecommendedTests,
  getBills,
  receivePayment
};
