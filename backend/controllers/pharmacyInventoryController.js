const PharmacyInventory = require('../models/PharmacyInventory');
const PharmacyUploadHistory = require('../models/PharmacyUploadHistory');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const PharmacyStockMovement = require('../models/PharmacyStockMovement');

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
    const { items, fileName, totalRows, failedRowsCount, importLog, supplierId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for upload' });
    }

    const hospitalId = req.user.hospitalId;
    const uploadedBy = req.user._id;

    // Find selected or default Excel Upload supplier
    let supplier;
    if (supplierId) {
      supplier = await Supplier.findOne({ hospitalId, _id: supplierId });
    }
    if (!supplier) {
      supplier = await Supplier.findOne({ hospitalId, name: 'Excel Import Supplier' });
    }
    if (!supplier) {
      supplier = await Supplier.create({
        hospitalId,
        name: 'Excel Import Supplier',
        code: 'SUP-EXCEL',
        mobile: '9999999999',
        email: 'excel-import@hms.com',
        address: 'System Generated Supplier Profile for Excel Imports',
        status: 'Active',
        createdBy: uploadedBy,
        updatedBy: uploadedBy
      });
    }

    const invoiceNumber = `INV-EXCEL-${Date.now()}`;
    const purchaseItems = [];
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

      const previousStock = existing ? existing.quantity : 0;

      if (existing) {
        // Increase quantity (exactly like manual purchase save logic)
        existing.quantity += quantity;
        existing.free += free;
        existing.sNo = sNo || existing.sNo;
        existing.oldMrp = oldMrp || existing.oldMrp;
        existing.pack = pack;
        existing.mrp = mrp;
        existing.rate = rate;
        existing.dis = dis;
        existing.expiry = expiryDate;
        existing.nRate = nRate;
        existing.hsn = hsn;
        existing.sgst = sgst;
        existing.cst = cst;
        existing.amount = existing.rate * existing.quantity;
        existing.supplierId = supplier._id;
        existing.supplierName = supplier.name;
        existing.lastPurchaseDate = new Date();

        await existing.save();

        await PharmacyStockMovement.create({
          hospitalId,
          itemName: existing.itemName,
          batch: existing.batch,
          type: 'Excel Upload',
          quantity,
          previousStock,
          newStock: existing.quantity,
          performedBy: uploadedBy,
          remarks: `Excel import update. Inv: ${invoiceNumber}`
        });

        updatedCount++;
      } else {
        // Create new item
        const newStock = await PharmacyInventory.create({
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
          amount,
          supplierId: supplier._id,
          supplierName: supplier.name,
          lastPurchaseDate: new Date()
        });

        await PharmacyStockMovement.create({
          hospitalId,
          itemName: newStock.itemName,
          batch: newStock.batch,
          type: 'Excel Upload',
          quantity,
          previousStock: 0,
          newStock: newStock.quantity,
          performedBy: uploadedBy,
          remarks: `Excel import insert. Inv: ${invoiceNumber}`
        });

        insertedCount++;
      }

      // Add to purchase item list
      purchaseItems.push({
        itemName,
        batch,
        expiry: expiryDate,
        pack,
        quantity,
        free,
        rate,
        mrp,
        discountPercent: dis,
        discountAmount: (rate * quantity) * (dis / 100),
        sgst,
        cgst: cst, // CST mapped to CGST
        igst: 0,
        hsn,
        totalAmount: amount,
        returnedQty: 0
      });
    }

    // Save corresponding Purchase Entry if items were uploaded
    if (purchaseItems.length > 0) {
      const totalPurchaseAmt = purchaseItems.reduce((sum, item) => sum + item.totalAmount, 0);

      await Purchase.create({
        hospitalId,
        purchaseInvoiceNumber: invoiceNumber,
        supplierId: supplier._id,
        invoiceDate: new Date(),
        receiveDate: new Date(),
        paymentType: 'Cash',
        purchaseStatus: 'Completed',
        notes: `Automatically created from excel file upload: ${fileName || 'excel_upload'}`,
        items: purchaseItems,
        totalAmount: totalPurchaseAmt,
        paidAmount: totalPurchaseAmt,
        pendingAmount: 0,
        createdBy: uploadedBy,
        receivedBy: req.user.username || 'Staff'
      });
    }

    // Save to upload history
    const successfulRows = insertedCount + updatedCount;
    const failedRows = Number(failedRowsCount) || 0;
    const finalTotalRows = Number(totalRows) || (successfulRows + failedRows);

    await PharmacyUploadHistory.create({
      hospitalId,
      fileName: fileName || 'excel_upload',
      uploadedBy,
      totalRows: finalTotalRows,
      successfulRows,
      failedRows,
      purchaseInvoiceCreated: invoiceNumber,
      status: failedRows > 0 ? (successfulRows > 0 ? 'Partial' : 'Failed') : 'Completed',
      importLog: importLog || []
    });

    res.status(200).json({
      success: true,
      message: 'Excel processed and purchase invoice generated successfully.',
      insertedCount,
      updatedCount,
      totalRows: finalTotalRows
    });
  } catch (error) {
    console.error('Upload Inventory Error:', error);
    res.status(500).json({ message: 'Server error during excel upload processing' });
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

// @desc    Update a pharmacy inventory item
// @route   PUT /api/pharmacy/inventory/:id
// @access  Private
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Do not allow updating hospitalId
    delete updateData.hospitalId;

    const item = await PharmacyInventory.findOneAndUpdate(
      tenantFilter(req, { _id: id }),
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json({ message: 'Inventory item updated successfully', item });
  } catch (error) {
    console.error('Update Inventory Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a pharmacy inventory item
// @route   DELETE /api/pharmacy/inventory/:id
// @access  Private
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await PharmacyInventory.findOneAndDelete(
      tenantFilter(req, { _id: id })
    );

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete Inventory Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new pharmacy inventory item
// @route   POST /api/pharmacy/inventory
// @access  Private
const createInventoryItem = async (req, res) => {
  try {
    const itemData = req.body;
    
    // Add hospitalId
    itemData.hospitalId = req.user.hospitalId;

    // Check unique index: hospitalId, itemName, batch
    const existing = await PharmacyInventory.findOne({
      hospitalId: req.user.hospitalId,
      itemName: itemData.itemName.trim(),
      batch: itemData.batch.trim()
    });

    if (existing) {
      return res.status(400).json({ message: 'A medicine with this item name and batch already exists in stock' });
    }

    // Resolve default fields
    if (itemData.quantity === undefined) itemData.quantity = 0;
    if (itemData.rate === undefined) itemData.rate = 0;
    
    // Auto-calculate amount
    itemData.amount = (itemData.quantity || 0) * (itemData.rate || 0);

    const newItem = new PharmacyInventory(itemData);
    await newItem.save();

    res.status(201).json({ message: 'Medicine added to inventory successfully', item: newItem });
  } catch (error) {
    console.error('Create Inventory Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Excel upload history
// @route   GET /api/pharmacy/inventory/upload-history
// @access  Private
const getUploadHistory = async (req, res) => {
  try {
    const history = await PharmacyUploadHistory.find(tenantFilter(req))
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error('Get Upload History Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getInventory,
  uploadInventory,
  getExpiryMedicines,
  getOutOfStockMedicines,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryItem,
  getUploadHistory
};
