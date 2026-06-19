const SameDayTreatment = require('../models/SameDayTreatment');
const SdtItem = require('../models/SdtItem');
const IpdAdminSettings = require('../models/IpdAdminSettings');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Create or save treatment
// @route   POST /api/nursing/treatment
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
      return res.status(400).json({ message: 'Patient ID and treatment type are required' });
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
    res.status(201).json({ message: 'Treatment record saved', record });
  } catch (error) {
    console.error('Create Treatment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update treatment
// @route   PUT /api/nursing/treatment/:id
// @access  Private
const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Treatment record not found' });

    const fields = [
      'diagnosis', 'treatmentNotes', 'prescription', 'followUpRequired', 'followUpDate',
      'treatmentDate', 'price', 'isFixedPrice', 'status', 'patientName', 'uhid', 'mobile', 'gender', 'age'
    ];
    fields.forEach(f => { if (updateData[f] !== undefined) record[f] = updateData[f]; });

    record.updatedBy = req.user._id;
    await record.save();
    res.json({ message: 'Treatment updated', record });
  } catch (error) {
    console.error('Update Treatment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get treatments for a patient
// @route   GET /api/nursing/treatment/patient/:patientId
// @access  Private
const getTreatmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await SameDayTreatment.find(tenantFilter(req, { patientId }))
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get Treatments Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single treatment
// @route   GET /api/nursing/treatment/:id
// @access  Private
const getTreatmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName');
    if (!record) return res.status(404).json({ message: 'Treatment not found' });
    res.json(record);
  } catch (error) {
    console.error('Get Treatment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all treatments (with filters)
// @route   GET /api/nursing/treatment
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
    console.error('Get All Treatments Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get treatment pricing for admin display
// @route   GET /api/nursing/treatment/pricing
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
    console.error('Get Pricing Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to treatment
// @route   POST /api/nursing/treatment/:id/items
// @access  Private
const addItemToTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemType, itemName, quantity, price } = req.body;

    if (!itemType || !itemName || !quantity || !price) {
      return res.status(400).json({ message: 'itemType, itemName, quantity, and price are required' });
    }

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Treatment record not found' });

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

// @desc    Remove item from treatment
// @route   DELETE /api/nursing/treatment/:id/items/:itemId
// @access  Private
const removeItemFromTreatment = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Treatment record not found' });

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

// @desc    Get items for a treatment
// @route   GET /api/nursing/treatment/:id/items
// @access  Private
const getItemsForTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await SameDayTreatment.findOne(tenantFilter(req, { _id: id }));
    if (!record) return res.status(404).json({ message: 'Treatment record not found' });

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