const PharmacyInventory = require('../models/PharmacyInventory');
const PharmacyUploadHistory = require('../models/PharmacyUploadHistory');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Get dashboard stats
// @route   GET /api/pharmacy/inventory/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Total Items: total unique medicine-batches in stock
    const totalItems = await PharmacyInventory.countDocuments(tenantFilter(req));

    // Out of Stock: Quantity < 50
    const outOfStockCount = await PharmacyInventory.countDocuments(
      tenantFilter(req, { quantity: { $lt: 50 } })
    );

    // Expiry Warning: Expiring within next 30 days (future expiry)
    const expiryWarningCount = await PharmacyInventory.countDocuments(
      tenantFilter(req, {
        expiry: { $gt: today, $lte: thirtyDaysLater }
      })
    );

    // Expired Medicines: Already expired
    const expiredCount = await PharmacyInventory.countDocuments(
      tenantFilter(req, {
        expiry: { $lte: today }
      })
    );

    res.status(200).json({
      totalItems,
      outOfStockCount,
      expiryWarningCount,
      expiredCount
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get inventory list with pagination, search, sort and status filters
// @route   GET /api/pharmacy/inventory
// @access  Private
const getInventory = async (req, res) => {
  try {
    const { search, status, sortBy = 'itemName', sortOrder = 'asc', page = 1, limit = 10 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    let query = tenantFilter(req);

    // Apply Search
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { batch: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply Status Filter
    if (status) {
      if (status === 'Green') {
        // Valid: quantity >= 50, not expired, not near expiry
        query.quantity = { $gte: 50 };
        query.expiry = { $gt: thirtyDaysLater };
      } else if (status === 'Yellow') {
        // Quantity < 50, not expired, not near expiry
        query.quantity = { $lt: 50 };
        query.expiry = { $gt: thirtyDaysLater };
      } else if (status === 'Red') {
        // Expired
        query.expiry = { $lte: today };
      } else if (status === 'Blue') {
        // Expired/Near Expiry AND Quantity < 50
        query.quantity = { $lt: 50 };
        query.expiry = { $lte: thirtyDaysLater };
      } else if (status === 'Orange') {
        // Near Expiry AND Quantity >= 50
        query.quantity = { $gte: 50 };
        query.expiry = { $gt: today, $lte: thirtyDaysLater };
      }
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const items = await PharmacyInventory.find(query)
      .sort(sort)
      .skip(skipNum)
      .limit(limitNum);

    const total = await PharmacyInventory.countDocuments(query);

    res.status(200).json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get Inventory Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload medicine list from parsed Excel
// @route   POST /api/pharmacy/inventory/upload
// @access  Private
const uploadInventory = async (req, res) => {
  try {
    const { items, fileName } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for upload' });
    }

    const hospitalId = req.user.hospitalId;
    const uploadedBy = req.user._id;

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      // Clean and normalize fields, default empty fields to 0
      const itemName = String(item.itemName || '').trim();
      const batch = String(item.batch || '').trim();

      if (!itemName || !batch) continue; // skip invalid rows

      const quantity = parseInt(item.quantity) || 0;
      const free = parseInt(item.free) || 0;
      const rate = parseFloat(item.rate) || 0;
      const mrp = parseFloat(item.mrp) || 0;
      const oldMrp = parseFloat(item.oldMrp) || 0;
      const dis = parseFloat(item.dis) || 0;
      const amount = parseFloat(item.amount) || 0;
      const nRate = parseFloat(item.nRate) || 0;
      const sgst = parseFloat(item.sgst) || 0;
      const cst = parseFloat(item.cst) || 0;
      const sNo = parseInt(item.sNo) || 0;
      const hsn = String(item.hsn || '0').trim();
      const pack = String(item.pack || '0').trim();

      // Normalize expiry date
      let expiryDate = new Date();
      if (item.expiry) {
        expiryDate = new Date(item.expiry);
        if (isNaN(expiryDate.getTime())) {
          expiryDate = new Date(); // fallback
        }
      }

      // Check if item already exists for this hospital, medicine name, and batch
      const existing = await PharmacyInventory.findOne({
        hospitalId,
        itemName: { $regex: new RegExp('^' + itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        batch: { $regex: new RegExp('^' + batch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      });

      if (existing) {
        // Accumulate quantity
        existing.quantity += quantity;
        existing.sNo = sNo;
        existing.oldMrp = oldMrp;
        existing.pack = pack;
        existing.mrp = mrp;
        existing.free = free;
        existing.rate = rate;
        existing.dis = dis;
        existing.expiry = expiryDate;
        existing.nRate = nRate;
        existing.hsn = hsn;
        existing.sgst = sgst;
        existing.cst = cst;
        existing.amount = amount;

        await existing.save();
        updatedCount++;
      } else {
        // Create new item
        await PharmacyInventory.create({
          hospitalId,
          sNo,
          itemName,
          oldMrp,
          pack,
          mrp,
          quantity,
          free,
          rate,
          dis,
          batch,
          expiry: expiryDate,
          nRate,
          hsn,
          sgst,
          cst,
          amount
        });
        insertedCount++;
      }
    }

    // Save to upload history
    await PharmacyUploadHistory.create({
      hospitalId,
      fileName: fileName || 'excel_upload',
      uploadedBy,
      totalRows: items.length,
      insertedCount,
      updatedCount
    });

    res.status(200).json({
      success: true,
      message: 'Excel processed successfully',
      insertedCount,
      updatedCount,
      totalRows: items.length
    });
  } catch (error) {
    console.error('Upload Inventory Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expiring or expired medicines
// @route   GET /api/pharmacy/inventory/expiry
// @access  Private
const getExpiryMedicines = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expired = await PharmacyInventory.find(
      tenantFilter(req, { expiry: { $lte: today } })
    ).sort({ expiry: 1 });

    const nearExpiry = await PharmacyInventory.find(
      tenantFilter(req, { expiry: { $gt: today, $lte: thirtyDaysLater } })
    ).sort({ expiry: 1 });

    res.status(200).json({
      expired,
      nearExpiry
    });
  } catch (error) {
    console.error('Get Expiry Medicines Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get out of stock medicines
// @route   GET /api/pharmacy/inventory/out-of-stock
// @access  Private
const getOutOfStockMedicines = async (req, res) => {
  try {
    const items = await PharmacyInventory.find(
      tenantFilter(req, { quantity: { $lt: 50 } })
    ).sort({ quantity: 1 });

    res.status(200).json(items);
  } catch (error) {
    console.error('Get Out of Stock Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getInventory,
  uploadInventory,
  getExpiryMedicines,
  getOutOfStockMedicines
};
