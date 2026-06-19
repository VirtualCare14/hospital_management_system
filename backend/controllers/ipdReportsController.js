const IpdAdmission = require('../models/IpdAdmission');
const Room = require('../models/Room');
const Bed = require('../models/Bed');

// Helper to filter queries by hospitalId for multi-tenant isolation
const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Get Room Utilization Report (Room Type, Capacity, Occupancy)
// @route   GET /api/ipd/reports/utilization
// @access  Private/Admin
const getRoomUtilization = async (req, res) => {
  try {
    const rooms = await Room.find(tenantFilter(req));
    const utilization = await Promise.all(rooms.map(async (room) => {
      const beds = await Bed.find({ roomId: room._id });
      
      const capacity = beds.length;
      const occupied = beds.filter(b => b.status === 'Occupied').length;
      const available = beds.filter(b => b.status === 'Available').length;
      const reserved = beds.filter(b => b.status === 'Reserved').length;
      const maintenance = beds.filter(b => b.status === 'Maintenance').length;
      
      const occupancyPercentage = capacity > 0 
        ? Math.round((occupied / capacity) * 100) 
        : 0;

      return {
        roomId: room._id,
        roomType: room.roomType,
        capacity,
        occupied,
        available,
        reserved,
        maintenance,
        occupancyPercentage
      };
    }));

    res.status(200).json(utilization);
  } catch (error) {
    console.error('Room Utilization Report Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Admission Statistics (Daily, Monthly, Yearly counts)
// @route   GET /api/ipd/reports/admission-stats
// @access  Private/Admin
const getAdmissionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = tenantFilter(req);
    if (startDate || endDate) {
      filter.admissionDate = {};
      if (startDate) filter.admissionDate.$gte = new Date(startDate);
      if (endDate) filter.admissionDate.$lte = new Date(endDate);
    }

    const admissions = await IpdAdmission.find(filter).select('admissionDate');

    // Process daily stats
    const dailyMap = {};
    const monthlyMap = {};
    const yearlyMap = {};

    admissions.forEach(adm => {
      const date = new Date(adm.admissionDate);
      if (isNaN(date)) return;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');

      const dayKey = `${yyyy}-${mm}-${dd}`;
      const monthKey = `${yyyy}-${mm}`;
      const yearKey = `${yyyy}`;

      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
      yearlyMap[yearKey] = (yearlyMap[yearKey] || 0) + 1;
    });

    // Format sorting
    const formatStats = (map) => Object.entries(map)
      .map(([key, count]) => ({ label: key, count }))
      .sort((a, b) => a.label.localeCompare(b.label));

    res.status(200).json({
      daily: formatStats(dailyMap),
      monthly: formatStats(monthlyMap),
      yearly: formatStats(yearlyMap)
    });
  } catch (error) {
    console.error('Admission Stats Report Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Inpatient Revenue Report (calculated daily rates)
// @route   GET /api/ipd/reports/revenue
// @access  Private/Admin
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = tenantFilter(req);
    if (startDate || endDate) {
      filter.admissionDate = {};
      if (startDate) filter.admissionDate.$gte = new Date(startDate);
      if (endDate) filter.admissionDate.$lte = new Date(endDate);
    }

    const admissions = await IpdAdmission.find(filter)
      .populate('roomId', 'roomType')
      .populate('bedId', 'bedNumber bedType pricePerDay');

    let totalRevenue = 0;
    const roomRevenueMap = {};
    const bedTypeRevenueMap = {};

    admissions.forEach(adm => {
      if (!adm.bedId) return;

      const price = adm.bedId.pricePerDay || 0;
      const start = new Date(adm.admissionDate);
      const end = adm.status === 'Discharged' && adm.dischargeDate 
        ? new Date(adm.dischargeDate) 
        : new Date();

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // min 1 day charge
      const earned = price * diffDays;

      totalRevenue += earned;

      // Group by room type
      const roomType = adm.roomId?.roomType || 'Unknown Room';
      roomRevenueMap[roomType] = (roomRevenueMap[roomType] || 0) + earned;

      // Group by bed type
      const bedType = adm.bedId?.bedType || 'Unknown Bed Type';
      bedTypeRevenueMap[bedType] = (bedTypeRevenueMap[bedType] || 0) + earned;
    });

    const roomRevenue = Object.entries(roomRevenueMap).map(([name, value]) => ({ name, value }));
    const bedTypeRevenue = Object.entries(bedTypeRevenueMap).map(([name, value]) => ({ name, value }));

    res.status(200).json({
      totalRevenue,
      roomRevenue,
      bedTypeRevenue
    });
  } catch (error) {
    console.error('Revenue Report Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRoomUtilization,
  getAdmissionStats,
  getRevenueReport
};
