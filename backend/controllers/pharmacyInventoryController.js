const PharmacyInventory = require('../models/PharmacyInventory');
const PharmacyUploadHistory = require('../models/PharmacyUploadHistory');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const PharmacyStockMovement = require('../models/PharmacyStockMovement');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

const saveOrUpdateInventoryItem = async ({
  hospitalId,
  uploadedBy,
  supplier,
  invoiceNumber,
  itemData,
  isExcelImport = false
}) => {
  const sNo = parseInt(itemData.sNo) || 0;
  const itemName = String(itemData.itemName || '').trim();
  const description = String(itemData.description || '').trim();
  const dosageForm = String(itemData.dosageForm || '').trim();
  const packType = String(itemData.packType || '').trim();
  const unitsPerPack = parseInt(itemData.unitsPerPack) || 1;
  const quantityPacks = parseInt(itemData.quantityPacks) || 0;
  const batch = String(itemData.batch || '').trim();
  const sgst = parseFloat(itemData.sgst) || 0;
  const cgst = parseFloat(itemData.cgst) || 0;
  const rateExGst = parseFloat(itemData.rateExGst) || 0;
  const mrpInput = parseFloat(itemData.mrp) || 0;
  const hsn = String(itemData.hsn || '0').trim();
  const thresholdMedicineNumber = parseInt(itemData.thresholdMedicineNumber) || 10;

  let expiryDate = new Date();
  if (itemData.expiry) {
    expiryDate = new Date(itemData.expiry);
    if (isNaN(expiryDate.getTime())) {
      expiryDate = new Date();
    }
  }

  let mrp = mrpInput;
  if (!mrp) {
    mrp = rateExGst * (1 + ((sgst + cgst) / 100));
  }

  const existingMedicine = await PharmacyInventory.findOne({
    hospitalId,
    itemName: { $regex: new RegExp('^' + itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
  });

  const existing = await PharmacyInventory.findOne({
    hospitalId,
    itemName: { $regex: new RegExp('^' + itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
    batch: { $regex: new RegExp('^' + batch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
  });

  const additionalUnits = quantityPacks * unitsPerPack;

  if (existing) {
    const previousStock = existing.quantityUnits;
    
    if (isExcelImport) {
      existing.quantityUnits = additionalUnits;
    } else {
      existing.quantityUnits += additionalUnits;
    }
    
    existing.sNo = sNo || existing.sNo;
    existing.description = description || existing.description;
    existing.dosageForm = dosageForm || existing.dosageForm;
    existing.packType = packType || existing.packType;
    existing.unitsPerPack = unitsPerPack || existing.unitsPerPack;
    existing.rateExGst = rateExGst;
    existing.sgst = sgst;
    existing.cgst = cgst;
    existing.mrp = mrp;
    existing.purchaseRateExGst = existing.purchaseRateExGst || rateExGst;
    existing.purchaseRateIncGst = existing.purchaseRateIncGst || (rateExGst * (1 + (sgst + cgst) / 100));
    existing.mrpExGst = existing.mrpExGst || (mrp / (1 + (sgst + cgst) / 100)) || rateExGst;
    existing.purchaseInvoiceNumber = existing.purchaseInvoiceNumber || invoiceNumber || '';
    existing.hsn = hsn;
    existing.expiry = expiryDate;
    existing.thresholdMedicineNumber = thresholdMedicineNumber;

    // Track supplier through batch/system: only assign if not already set, checking other batches or fallback
    existing.supplierId = existing.supplierId || (existingMedicine ? existingMedicine.supplierId : null) || (supplier ? supplier._id : null);
    existing.supplierName = existing.supplierName || (existingMedicine ? existingMedicine.supplierName : '') || (supplier ? supplier.name : '');

    existing.lastPurchaseDate = new Date();

    await existing.save();

    const netChange = isExcelImport ? (existing.quantityUnits - previousStock) : additionalUnits;

    await PharmacyStockMovement.create({
      hospitalId,
      itemName: existing.itemName,
      batch: existing.batch,
      type: isExcelImport ? 'Excel Upload' : 'Manual Adjustment',
      quantity: netChange,
      previousStock,
      newStock: existing.quantityUnits,
      performedBy: uploadedBy,
      remarks: isExcelImport 
        ? `Excel import update. Inv: ${invoiceNumber} (Net change: ${netChange})` 
        : `Manual stock add (Qty: ${quantityPacks} packs)`
    });

    return { type: 'update', item: existing };
  } else {
    const finalDescription = description || (existingMedicine ? existingMedicine.description : '');
    const finalDosageForm = dosageForm || (existingMedicine ? existingMedicine.dosageForm : '');
    const finalPackType = packType || (existingMedicine ? existingMedicine.packType : '');
    const finalUnitsPerPack = unitsPerPack || (existingMedicine ? existingMedicine.unitsPerPack : 1);
    const finalHsn = hsn || (existingMedicine ? existingMedicine.hsn : '0');
    const finalThreshold = thresholdMedicineNumber !== undefined ? thresholdMedicineNumber : (existingMedicine ? existingMedicine.thresholdMedicineNumber : 10);

    const finalSupplierId = (existingMedicine ? existingMedicine.supplierId : null) || (supplier ? supplier._id : null);
    const finalSupplierName = (existingMedicine ? existingMedicine.supplierName : '') || (supplier ? supplier.name : '');

    const newStock = await PharmacyInventory.create({
      hospitalId,
      sNo,
      itemName,
      description: finalDescription,
      dosageForm: finalDosageForm,
      packType: finalPackType,
      unitsPerPack: finalUnitsPerPack,
      quantityPacks,
      quantityUnits: additionalUnits,
      batch,
      expiry: expiryDate,
      rateExGst,
      sgst,
      cgst,
      mrp,
      purchaseRateExGst: rateExGst,
      purchaseRateIncGst: rateExGst * (1 + (sgst + cgst) / 100),
      mrpExGst: (mrp / (1 + (sgst + cgst) / 100)) || rateExGst,
      purchaseInvoiceNumber: invoiceNumber || '',
      hsn: finalHsn,
      thresholdMedicineNumber: finalThreshold,
      supplierId: finalSupplierId,
      supplierName: finalSupplierName,
      lastPurchaseDate: new Date()
    });

    await PharmacyStockMovement.create({
      hospitalId,
      itemName: newStock.itemName,
      batch: newStock.batch,
      type: isExcelImport ? 'Excel Upload' : 'Manual Adjustment',
      quantity: additionalUnits,
      previousStock: 0,
      newStock: newStock.quantityUnits,
      performedBy: uploadedBy,
      remarks: isExcelImport 
        ? `Excel import insert. Inv: ${invoiceNumber}` 
        : `Manual stock create (Qty: ${quantityPacks} packs)`
    });

    return { type: 'insert', item: newStock };
  }
};

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

    // Out of Stock: quantityUnits <= thresholdMedicineNumber
    const outOfStockCount = await PharmacyInventory.countDocuments(
      tenantFilter(req, {
        $expr: { $lte: ["$quantityUnits", "$thresholdMedicineNumber"] }
      })
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
        // Valid: quantityUnits > threshold, not expired, not near expiry
        query.$expr = { $gt: ["$quantityUnits", "$thresholdMedicineNumber"] };
        query.expiry = { $gt: thirtyDaysLater };
      } else if (status === 'Yellow') {
        // quantityUnits <= threshold, not expired, not near expiry
        query.$expr = { $lte: ["$quantityUnits", "$thresholdMedicineNumber"] };
        query.expiry = { $gt: thirtyDaysLater };
      } else if (status === 'Red') {
        // Expired
        query.expiry = { $lte: today };
      } else if (status === 'Blue') {
        // Expired/Near Expiry AND quantityUnits <= threshold
        query.$expr = { $lte: ["$quantityUnits", "$thresholdMedicineNumber"] };
        query.expiry = { $lte: thirtyDaysLater };
      } else if (status === 'Orange') {
        // Near Expiry AND quantityUnits > threshold
        query.$expr = { $gt: ["$quantityUnits", "$thresholdMedicineNumber"] };
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
      const itemName = String(item.itemName || '').trim();
      const batch = String(item.batch || '').trim();

      if (!itemName || !batch) continue; // skip invalid rows

      const result = await saveOrUpdateInventoryItem({
        hospitalId,
        uploadedBy,
        supplier,
        invoiceNumber,
        itemData: item,
        isExcelImport: true
      });

      if (result.type === 'update') {
        updatedCount++;
      } else {
        insertedCount++;
      }

      // Add to purchase item list (taxable + tax)
      const quantityPacks = parseInt(item.quantityPacks) || 0;
      const rateExGst = parseFloat(item.rateExGst) || 0;
      const sgst = parseFloat(item.sgst) || 0;
      const cgst = parseFloat(item.cgst) || 0;
      const mrp = result.item.mrp;
      const packType = result.item.packType;
      const expiryDate = result.item.expiry;
      const hsn = result.item.hsn;

      const taxable = quantityPacks * rateExGst;
      const tax = taxable * (sgst + cgst) / 100;
      const rowTotal = taxable + tax;

      purchaseItems.push({
        itemName: result.item.itemName,
        batch: result.item.batch,
        expiry: expiryDate,
        pack: packType,
        quantity: quantityPacks,
        free: 0,
        rate: rateExGst,
        mrp,
        discountPercent: 0,
        discountAmount: 0,
        sgst,
        cgst,
        igst: 0,
        hsn,
        totalAmount: rowTotal,
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
      tenantFilter(req, {
        $expr: { $lte: ["$quantityUnits", "$thresholdMedicineNumber"] }
      })
    ).sort({ quantityUnits: 1 });

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

    const item = await PharmacyInventory.findOne(tenantFilter(req, { _id: id }));

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Set new updates and save to trigger Mongoose pre-save middleware
    Object.assign(item, updateData);
    await item.save();

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
    const hospitalId = req.user.hospitalId;
    const uploadedBy = req.user._id;

    if (!itemData.itemName || !itemData.itemName.trim() || !itemData.batch || !itemData.batch.trim()) {
      return res.status(400).json({ message: 'Medicine Name and Batch are required.' });
    }

    const result = await saveOrUpdateInventoryItem({
      hospitalId,
      uploadedBy,
      supplier: null,
      invoiceNumber: '',
      itemData,
      isExcelImport: false
    });

    res.status(201).json({
      message: result.type === 'update' 
        ? 'Medicine quantity updated successfully in stock!' 
        : 'Medicine added to inventory successfully',
      item: result.item
    });
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
