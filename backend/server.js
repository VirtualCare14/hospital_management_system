const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, 'env') });

// Connect to Database
connectDB();

// Start Medication grace period background checker
const { startMedicationScheduler } = require('./utils/medicationScheduler');
startMedicationScheduler();

const app = express();

// Middleware - Multi-Domain & Subdomain CORS Handler
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  const requestedHeaders = req.headers['access-control-request-headers'];
  if (requestedHeaders) {
    res.header('Access-Control-Allow-Headers', requestedHeaders);
  } else {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-abha-token, X-Abha-Token, request-id, x-request-id');
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-abha-token', 'X-Abha-Token', 'request-id', 'x-request-id']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ABDM Milestone 2 (HIP) Webhook Routes (Public for Gateway callbacks)
app.use('/api/abdm/m2/webhooks', require('./modules/abdm-m2').m2WebhookRoutes);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/super-admin', require('./routes/superAdminRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/hospital-settings', require('./routes/hospitalSettingsRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/consultation', require('./routes/consultationRoutes'));
app.use('/api/prescription', require('./routes/prescriptionRoutes'));
app.use('/api/lab', require('./routes/labRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/ipd', require('./routes/ipdRoutes'));
app.use('/api/ipd/settings', require('./routes/ipdSettingsRoutes'));
app.use('/api/ipd/reports', require('./routes/ipdReportsRoutes'));
app.use('/api/ipd', require('./routes/ipdServicesRoutes'));
app.use('/api/ipd', require('./routes/ipdMedicationRoutes'));
app.use('/api/pharmacy', require('./routes/pharmacyRoutes'));
app.use('/api/ipd', require('./routes/otRoutes'));
app.use('/api/ipd', require('./routes/dischargeRoutes'));
app.use('/api/ipd', require('./routes/otManagementRoutes'));
app.use('/api/ipd', require('./routes/ipdReferralRoutes'));
app.use('/api/same-day-care', require('./routes/sameDayCareRoutes'));
app.use('/api/demo-request', require('./routes/demoRequestRoutes'));
app.use('/api', require('./routes/billingRoutes'));
app.use('/api/abha', require('./routes/abhaRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('Hospital Management System API is running...');
});

app.use(notFound);
app.use(errorHandler);

// Port Configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
