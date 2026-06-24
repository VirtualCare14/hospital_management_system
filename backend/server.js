const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
app.use('/api/nursing', require('./routes/sameDayTreatmentRoutes'));
app.use('/api', require('./routes/billingRoutes'));

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
