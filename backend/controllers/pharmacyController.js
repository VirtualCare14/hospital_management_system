const PharmacyDispense = require('../models/PharmacyDispense');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Dispense medicine to patient
// @route   POST /api/pharmacy/dispense
// @access  Private
const dispenseMedicine = async (req, res) => {
  try {
    const { patientId, medicineName, quantity } = req.body;

    if (!patientId || !medicineName || !quantity) {
      return res.status(400).json({ message: 'Patient ID, medicine name, and quantity are required' });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const dispense = await PharmacyDispense.create({
      hospitalId: req.user.hospitalId,
      patientId,
      medicineName,
      quantity: parseInt(quantity),
      date: dateStr,
      time: timeStr,
      dispensedBy: req.user._id
    });

    const populated = await PharmacyDispense.findById(dispense._id)
      .populate('dispensedBy', 'username doctorName');

    res.status(201).json({ message: 'Medicine dispensed successfully', dispense: populated });
  } catch (error) {
    console.error('Dispense Medicine Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dispensing history for a patient
// @route   GET /api/pharmacy/dispense/:patientId
// @access  Private
const getDispenseHistory = async (req, res) => {
  try {
    const dispenses = await PharmacyDispense.find(
      tenantFilter(req, { patientId: req.params.patientId })
    )
      .populate('dispensedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.status(200).json(dispenses);
  } catch (error) {
    console.error('Get Dispense History Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  dispenseMedicine,
  getDispenseHistory
};