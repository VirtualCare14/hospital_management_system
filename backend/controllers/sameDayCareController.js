const SameDayTreatment = require('../models/SameDayTreatment');
const SdtItem = require('../models/SdtItem');
const IpdAdminSettings = require('../models/IpdAdminSettings');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Create or save care record
// @route   POST /api/same-day-care/treatment
// @access  Private
const createTreatment = async (req, res) => {
  try {
    const {
      patientId, patientName, uhid, mobile, gender, age,
      treatmentType, treatmentDate, diagnosis, treatmentNotes,
      prescription, followUpRequired, followUpDate,
      price, isFixedPrice, status
    } = req.body;

    if (!patientId || !treatmentType) {
      return res.status(400).json({ message: 'Patient ID and care type are required' });
    }

    // Get default price from settings if not provided
    let finalPrice = price || 0;
    let finalIsFixedPrice = isFixedPrice !== undefined ? isFixedPrice : true;

    if (!price) {
      const settings = await IpdAdminSettings.findOne(tenantFilter(req));
      if (settings?.sameDayTreatmentPrices) {
        const service = settings.sameDayTreatmentPrices.find(s => s.name === treatmentType);
        if (service) finalPrice = service.price;
      }
    }

    const record = new SameDayTreatment({
      hospitalId: req.user.hospitalId,
      patientId, patientName, uhid, mobile, gender, age,
      treatmentType,
      treatmentDate: treatmentDate || new Date(),
      diagnosis: diagnosis || '',
      treatmentNotes: treatmentNotes || '',
      prescription: prescription || '',
      followUpRequired: followUpRequired || '',
      followUpDate: followUpDate || null,
      price: finalPrice,
      isFixedPrice: finalIsFixedPrice,
      status: status === 'Completed' ? 'Completed' : 'Draft',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await record.save();
    res.status(201).json({ message: 'Same day care record saved', record });
  } catch (error) {
    console.error('Create Care Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update care record
// @route   PUT /api/same-day-care/treatment/:id
// @access  Private
const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    const fields = [
      'diagnosis', 'treatmentNotes', 'prescription', 'followUpRequired', 'followUpDate',
      'treatmentDate', 'price', 'isFixedPrice', 'status', 'patientName', 'uhid', 'mobile', 'gender', 'age'
    ];
    fields.forEach(f => { if (updateData[f] !== undefined) record[f] = updateData[f]; });

    record.updatedBy = req.user._id;
    await record.save();
    res.json({ message: 'Care record updated', record });
  } catch (error) {
    console.error('Update Care Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get care records for a patient
// @route   GET /api/same-day-care/treatment/patient/:patientId
// @access  Private
const getTreatmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await SameDayTreatment.find(tenantFilter(req, { patientId }))
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get Care Records Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single care record
// @route   GET /api/same-day-care/treatment/:id
// @access  Private
const getTreatmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName');
    if (!record) return res.status(404).json({ message: 'Care record not found' });
    res.json(record);
  } catch (error) {
    console.error('Get Care Record Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all care records (with filters)
// @route   GET /api/same-day-care/treatment
// @access  Private
const getAllTreatments = async (req, res) => {
  try {
    const { treatmentType, status, fromDate, toDate } = req.query;
    let query = tenantFilter(req);
    if (treatmentType) query.treatmentType = treatmentType;
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const records = await SameDayTreatment.find(query)
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get All Care Records Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get care pricing for admin display
// @route   GET /api/same-day-care/treatment/pricing
// @access  Private
const getTreatmentPricing = async (req, res) => {
  try {
    const settings = await IpdAdminSettings.findOne(tenantFilter(req));
    const defaultPrices = {
      'Fracture': 500, 'Minor Injury': 300, 'Minor Stitches': 400,
      'Small Burns': 350, 'Mild Allergic Reactions': 250, 'Dialysis': 2000
    };
    const prices = settings?.sameDayTreatmentPrices || [];
    // Merge defaults with any saved custom prices
    const merged = Object.entries(defaultPrices).map(([name, defaultPrice]) => {
      const saved = prices.find(p => p.name === name);
      return {
        name,
        price: saved ? saved.price : defaultPrice,
        isActive: saved ? saved.isActive : true
      };
    });
    res.json(merged);
  } catch (error) {
    console.error('Get Care Pricing Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to care record
// @route   POST /api/same-day-care/treatment/:id/items
// @access  Private
const addItemToTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemType, itemName, quantity, price } = req.body;

    if (!itemType || !itemName || !quantity || !price) {
      return res.status(400).json({ message: 'itemType, itemName, quantity, and price are required' });
    }

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    const newItem = {
      itemType,
      itemName,
      quantity,
      price,
      createdAt: new Date()
    };

    if (!record.items) record.items = [];
    record.items.push(newItem);
    record.updatedBy = req.user._id;
    await record.save();

    res.status(201).json({ message: 'Item added', record });
  } catch (error) {
    console.error('Add Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from care record
// @route   DELETE /api/same-day-care/treatment/:id/items/:itemId
// @access  Private
const removeItemFromTreatment = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    if (!record.items || !record.items.id(itemId)) {
      return res.status(404).json({ message: 'Item not found' });
    }

    record.items.id(itemId).deleteOne();
    record.updatedBy = req.user._id;
    await record.save();

    res.json({ message: 'Item removed', record });
  } catch (error) {
    console.error('Remove Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get items for a care record
// @route   GET /api/same-day-care/treatment/:id/items
// @access  Private
const getItemsForTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Care record not found' });

    res.json(record.items || []);
  } catch (error) {
    console.error('Get Items Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTreatment, updateTreatment,
  getTreatmentsByPatient, getTreatmentById, getAllTreatments,
  getTreatmentPricing,
  addItemToTreatment, removeItemFromTreatment, getItemsForTreatment
};
