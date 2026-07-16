const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const PurchaseReturn = require('../models/PurchaseReturn');
const PharmacyInventory = require('../models/PharmacyInventory');
const PharmacyStockMovement = require('../models/PharmacyStockMovement');
const PharmacyAdjustment = require('../models/PharmacyAdjustment');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// Audit Trail Logger Helper
const logAudit = async (req, action, module, refId, oldVal, newVal) => {
  try {
    await PharmacyAuditLog.create({
      hospitalId: req.user.hospitalId,
      user: req.user._id,
      username: req.user.username || 'System User',
      role: req.user.role || 'Staff',
      action,
      module,
      referenceId: refId ? String(refId) : '',
      oldValue: oldVal ? String(oldVal) : '',
      newValue: newVal ? String(newVal) : '',
      ipAddress: req.ip || ''
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// ==================== SUPPLIER CONTROLLERS ====================

// @desc    Get all suppliers
// @route   GET /api/pharmacy/suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = tenantFilter(req);

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Get Suppliers Error:', error);
    res.status(500).json({ message: 'Server error loading suppliers.' });
  }
};

// @desc    Create a new supplier
// @route   POST /api/pharmacy/suppliers
// @access  Private
const createSupplier = async (req, res) => {
  try {
    const { name, gstin, drugLicenseNumber, contactPerson, mobile, email, address, city, state, pincode, paymentTerms, openingBalance, notes } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ message: 'Supplier Name and Mobile Number are required.' });
    }

    const hospitalId = req.user.hospitalId;

    // Check unique name per hospital
    const existing = await Supplier.findOne({ hospitalId, name: { $regex: new RegExp('^' + name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'A supplier with this name already exists.' });
    }

    // Auto-generate code sequentially per hospital
    const count = await Supplier.countDocuments({ hospitalId });
    const code = `SUP-${1001 + count}`;

    const newSupplier = new Supplier({
      hospitalId,
      name: name.trim(),
      code,
      gstin: gstin?.trim(),
      drugLicenseNumber: drugLicenseNumber?.trim(),
      contactPerson: contactPerson?.trim(),
      mobile: mobile.trim(),
      email: email?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
      paymentTerms: paymentTerms?.trim(),
      openingBalance: Number(openingBalance) || 0,
      notes: notes?.trim() || '',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Create Supplier Error:', error);
    res.status(500).json({ message: 'Server error registering supplier.' });
  }
};

// @desc    Update a supplier
// @route   PUT /api/pharmacy/suppliers/:id
// @access  Private
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const hospitalId = req.user.hospitalId;

    delete updateData.hospitalId;
    delete updateData.code;

    if (updateData.name) {
      const existing = await Supplier.findOne({
        hospitalId,
        _id: { $ne: id },
        name: { $regex: new RegExp('^' + updateData.name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      });
      if (existing) {
        return res.status(400).json({ message: 'Another supplier with this name already exists.' });
      }
    }

    updateData.updatedBy = req.user._id;

    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, hospitalId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error('Update Supplier Error:', error);
    res.status(500).json({ message: 'Server error updating supplier.' });
  }
};

// @desc    Delete a supplier (or set status)
// @route   DELETE /api/pharmacy/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const supplier = await Supplier.findOne({ _id: id, hospitalId });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    // Toggle status to Inactive (soft delete)
    supplier.status = supplier.status === 'Active' ? 'Inactive' : 'Active';
    supplier.updatedBy = req.user._id;
    await supplier.save();

    res.status(200).json({ message: `Supplier marked as ${supplier.status.toLowerCase()} successfully.`, supplier });
  } catch (error) {
    console.error('Delete Supplier Error:', error);
    res.status(500).json({ message: 'Server error updating supplier status.' });
  }
};

// ==================== PURCHASE CONTROLLERS ====================

// @desc    Get purchase history
// @route   GET /api/pharmacy/purchases
// @access  Private
const getPurchases = async (req, res) => {
  try {
    const { search, fromDate, toDate } = req.query;
    let query = tenantFilter(req);

    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) query.invoiceDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    let purchaseHistory = await Purchase.find(query)
      .populate('supplierId', 'name code')
      .sort({ invoiceDate: -1, createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      purchaseHistory = purchaseHistory.filter(p => 
        p.purchaseInvoiceNumber.toLowerCase().includes(searchLower) ||
        p.supplierId?.name?.toLowerCase().includes(searchLower) ||
        p.receivedBy.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json(purchaseHistory);
  } catch (error) {
    console.error('Get Purchases Error:', error);
    res.status(500).json({ message: 'Server error loading purchase history.' });
  }
};

// @desc    Get purchase details by ID
// @route   GET /api/pharmacy/purchases/:id
// @access  Private
const getPurchaseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const purchase = await Purchase.findOne({ _id: id, hospitalId }).populate('supplierId');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase invoice not found.' });
    }

    res.status(200).json(purchase);
  } catch (error) {
    console.error('Get Purchase Details Error:', error);
    res.status(500).json({ message: 'Server error loading purchase details.' });
  }
};

// Helper function to increase inventory
const increaseInventory = async (hospitalId, item, invoiceNumber, userId, supplierId = null, supplierName = '') => {
  const itemName = item.itemName.trim();
  const batch = item.batch.trim();
  const quantity = Number(item.quantity) || 0;
  const free = Number(item.free) || 0;

  const unitsPerPack = Number(item.unitsPerPack) || 1;
  const description = String(item.description || '').trim();
  const dosageForm = String(item.dosageForm || '').trim();
  const packType = String(item.packType || item.pack || '').trim();
  const purchaseRateExGst = Number(item.purchaseRateExGst) || Number(item.rate) || 0;
  const sellingRateExGst = Number(item.sellingRateExGst) || Number(item.rateExGst) || 0;
  const sgst = Number(item.sgst) || 0;
  const cgst = Number(item.cgst) || 0;
  const hsn = String(item.hsn || '0').trim();

  const sellingCgst = item.sellingCgst !== undefined ? Number(item.sellingCgst) : cgst;
  const sellingSgst = item.sellingSgst !== undefined ? Number(item.sellingSgst) : sgst;
  const thresholdMedicineNumber = item.thresholdMedicineNumber !== undefined ? Number(item.thresholdMedicineNumber) : 10;

  const mrp = sellingRateExGst * (1 + (sellingSgst + sellingCgst) / 100);

  const existingStock = await PharmacyInventory.findOne({
    hospitalId,
    itemName: { $regex: new RegExp('^' + itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
    batch: { $regex: new RegExp('^' + batch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
  });

  if (existingStock) {
    const prevUnits = existingStock.quantityUnits || 0;
    const additionalUnits = (quantity + free) * unitsPerPack;
    
    existingStock.unitsPerPack = unitsPerPack;
    existingStock.quantityUnits = prevUnits + additionalUnits;
    existingStock.quantity = existingStock.quantityUnits;
    
    existingStock.free += free;
    existingStock.rateExGst = sellingRateExGst;
    existingStock.mrp = mrp;
    existingStock.description = description || existingStock.description;
    existingStock.dosageForm = dosageForm || existingStock.dosageForm;
    existingStock.packType = packType || existingStock.packType;
    existingStock.expiry = new Date(item.expiry);
    existingStock.hsn = hsn;
    existingStock.sgst = sellingSgst;
    existingStock.cgst = sellingCgst;
    existingStock.thresholdMedicineNumber = thresholdMedicineNumber;
    existingStock.supplierId = supplierId || null;
    existingStock.supplierName = supplierName || '';
    existingStock.lastPurchaseDate = new Date();

    await existingStock.save();

    await PharmacyStockMovement.create({
      hospitalId,
      itemName: existingStock.itemName,
      batch: existingStock.batch,
      type: 'Purchase',
      quantity: additionalUnits,
      previousStock: prevUnits,
      newStock: existingStock.quantityUnits,
      performedBy: userId,
      remarks: `Purchase GRN Invoice: ${invoiceNumber}`
    });
  } else {
    const existingMedicine = await PharmacyInventory.findOne({
      hospitalId,
      itemName: { $regex: new RegExp('^' + itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
    });

    const finalDescription = description || (existingMedicine ? existingMedicine.description : '');
    const finalDosageForm = dosageForm || (existingMedicine ? existingMedicine.dosageForm : '');
    const finalPackType = packType || (existingMedicine ? existingMedicine.packType : '');
    const finalThreshold = item.thresholdMedicineNumber !== undefined ? Number(item.thresholdMedicineNumber) : (existingMedicine ? existingMedicine.thresholdMedicineNumber : 10);

    const count = await PharmacyInventory.countDocuments({ hospitalId });
    const sNo = count + 1;

    const qUnits = (quantity + free) * unitsPerPack;

    const newStock = new PharmacyInventory({
      hospitalId,
      sNo,
      itemName,
      batch,
      description: finalDescription,
      dosageForm: finalDosageForm,
      packType: finalPackType,
      quantityPacks: quantity,
      unitsPerPack,
      quantityUnits: qUnits,
      quantity: qUnits,
      free,
      rateExGst: sellingRateExGst,
      mrp,
      expiry: new Date(item.expiry),
      hsn,
      sgst: sellingSgst,
      cgst: sellingCgst,
      thresholdMedicineNumber: finalThreshold,
      supplierId: supplierId || null,
      supplierName: supplierName || '',
      lastPurchaseDate: new Date()
    });

    await newStock.save();

    await PharmacyStockMovement.create({
      hospitalId,
      itemName: newStock.itemName,
      batch: newStock.batch,
      type: 'Purchase',
      quantity: qUnits,
      previousStock: 0,
      newStock: qUnits,
      performedBy: userId,
      remarks: `Purchase GRN Invoice: ${invoiceNumber}`
    });
  }
};

// @desc    Create a new manual purchase entry
// @route   POST /api/pharmacy/purchases
// @access  Private
const createPurchase = async (req, res) => {
  try {
    const {
      purchaseInvoiceNumber, supplierId, invoiceDate, receiveDate,
      paymentType, dueDate, notes, items, totalAmount, paidAmount, pendingAmount
    } = req.body;

    const hospitalId = req.user.hospitalId;

    let finalSupplierName = '';
    if (supplierId) {
      const dbSup = await Supplier.findOne({ hospitalId, _id: supplierId });
      if (dbSup) {
        finalSupplierName = dbSup.name;
      }
    } else {
      finalSupplierName = req.body.supplierName ? req.body.supplierName.trim() : '';
    }

    if (!purchaseInvoiceNumber || (!supplierId && !finalSupplierName) || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required purchase invoice, supplier name, or medicine items.' });
    }

    // Check unique invoice number for this supplier & hospital
    const duplicateQuery = { hospitalId, purchaseInvoiceNumber };
    if (supplierId) {
      duplicateQuery.supplierId = supplierId;
    } else {
      duplicateQuery.supplierName = finalSupplierName;
      duplicateQuery.supplierId = null;
    }
    const duplicate = await Purchase.findOne(duplicateQuery);
    if (duplicate) {
      return res.status(400).json({ message: 'A purchase invoice with this number already exists for the selected supplier.' });
    }

    // Save inventory & stock movements
    for (const item of items) {
      await increaseInventory(hospitalId, item, purchaseInvoiceNumber, req.user._id, supplierId || null, finalSupplierName);
    }

    // Create purchase entry
    const newPurchase = new Purchase({
      hospitalId,
      purchaseInvoiceNumber: purchaseInvoiceNumber.trim(),
      supplierId: supplierId || null,
      supplierName: finalSupplierName,
      invoiceDate: new Date(invoiceDate),
      receiveDate: receiveDate ? new Date(receiveDate) : new Date(),
      paymentType,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      items: items.map(it => {
        const sgst = Number(it.sgst) || 0;
        const cgst = Number(it.cgst) || 0;
        const sellingCgst = it.sellingCgst !== undefined ? Number(it.sellingCgst) : cgst;
        const sellingSgst = it.sellingSgst !== undefined ? Number(it.sellingSgst) : sgst;
        const sellingRateExGst = Number(it.sellingRateExGst) || 0;
        const mrp = sellingRateExGst * (1 + (sellingSgst + sellingCgst) / 100);
        return {
          itemName: it.itemName.trim(),
          batch: it.batch.trim(),
          expiry: new Date(it.expiry),
          pack: String(it.packType || it.pack || '0').trim(),
          quantity: Number(it.quantity) || 0,
          free: Number(it.free) || 0,
          rate: Number(it.purchaseRateExGst) || Number(it.rate) || 0,
          mrp: mrp,
          discountPercent: Number(it.discountPercent) || Number(it.dis) || 0,
          discountAmount: Number(it.discountAmount) || 0,
          sgst: sgst,
          cgst: cgst,
          igst: Number(it.igst) || 0,
          hsn: String(it.hsn || '0').trim(),
          totalAmount: Number(it.totalAmount) || 0,
          returnedQty: 0,
          description: String(it.description || '').trim(),
          dosageForm: String(it.dosageForm || '').trim(),
          packType: String(it.packType || it.pack || '').trim(),
          unitsPerPack: Number(it.unitsPerPack) || 1,
          purchaseRateExGst: Number(it.purchaseRateExGst) || Number(it.rate) || 0,
          sellingRateExGst: sellingRateExGst,
          sellingCgst: sellingCgst,
          sellingSgst: sellingSgst,
          thresholdMedicineNumber: Number(it.thresholdMedicineNumber) || 10
        };
      }),
      totalAmount: Number(totalAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      pendingAmount: Number(pendingAmount) || 0,
      createdBy: req.user._id,
      receivedBy: req.user.username || 'Staff'
    });

    await newPurchase.save();
    res.status(201).json({ message: 'Purchase GRN recorded and inventory updated successfully.', purchase: newPurchase });
  } catch (error) {
    console.error('Create Purchase Error:', error);
    res.status(500).json({ message: 'Server error saving purchase entry.' });
  }
};

// @desc    Edit a purchase entry (Before stock is used)
// @route   PUT /api/pharmacy/purchases/:id
// @access  Private
const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;
    const {
      purchaseInvoiceNumber, supplierId, invoiceDate, receiveDate,
      paymentType, dueDate, notes, items, totalAmount, paidAmount, pendingAmount
    } = req.body;

    const oldPurchase = await Purchase.findOne({ _id: id, hospitalId });
    if (!oldPurchase) {
      return res.status(404).json({ message: 'Purchase invoice not found.' });
    }

    let finalSupplierName = '';
    if (supplierId) {
      const dbSup = await Supplier.findOne({ hospitalId, _id: supplierId });
      if (dbSup) {
        finalSupplierName = dbSup.name;
      }
    } else {
      finalSupplierName = req.body.supplierName ? req.body.supplierName.trim() : '';
    }

    if (!purchaseInvoiceNumber || (!supplierId && !finalSupplierName)) {
      return res.status(400).json({ message: 'Invoice number and supplier details are required.' });
    }

    // Check if stock has been used/sold/dispensed
    for (const item of oldPurchase.items) {
      const currentStock = await PharmacyInventory.findOne({
        hospitalId,
        itemName: { $regex: new RegExp('^' + item.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        batch: { $regex: new RegExp('^' + item.batch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      });

      if (!currentStock || currentStock.quantity < (item.quantity + item.free - item.returnedQty)) {
        return res.status(400).json({
          message: `Cannot edit this invoice. Stock for medicine '${item.itemName}' (Batch: ${item.batch}) has already been partially used, returned, or dispensed.`
        });
      }
    }

    // Revert old stock changes
    for (const item of oldPurchase.items) {
      const currentStock = await PharmacyInventory.findOne({
        hospitalId,
        itemName: { $regex: new RegExp('^' + item.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        batch: { $regex: new RegExp('^' + item.batch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      });

      if (currentStock) {
        const previousStock = currentStock.quantityUnits;
        const unitsToRevert = (item.quantity + item.free) * (currentStock.unitsPerPack || 1);
        currentStock.quantityUnits = Math.max(0, currentStock.quantityUnits - unitsToRevert);
        currentStock.quantity = currentStock.quantityUnits;
        currentStock.free = Math.max(0, currentStock.free - item.free);
        await currentStock.save();

        // Stock movement revert log
        await PharmacyStockMovement.create({
          hospitalId,
          itemName: currentStock.itemName,
          batch: currentStock.batch,
          type: 'Manual Adjustment',
          quantity: -unitsToRevert,
          previousStock,
          newStock: currentStock.quantityUnits,
          performedBy: req.user._id,
          remarks: `Reverted stock for Purchase Edit. Inv: ${oldPurchase.purchaseInvoiceNumber}`
        });
      }
    }

    // Apply new stock changes
    for (const item of items) {
      await increaseInventory(hospitalId, item, purchaseInvoiceNumber, req.user._id, supplierId || null, finalSupplierName);
    }

    // Update purchase invoice fields
    oldPurchase.purchaseInvoiceNumber = purchaseInvoiceNumber.trim();
    oldPurchase.supplierId = supplierId || null;
    oldPurchase.supplierName = finalSupplierName;
    oldPurchase.invoiceDate = new Date(invoiceDate);
    oldPurchase.receiveDate = receiveDate ? new Date(receiveDate) : new Date();
    oldPurchase.paymentType = paymentType;
    oldPurchase.dueDate = dueDate ? new Date(dueDate) : null;
    oldPurchase.notes = notes || '';
    oldPurchase.items = items.map(it => {
      const sgst = Number(it.sgst) || 0;
      const cgst = Number(it.cgst) || 0;
      const sellingCgst = it.sellingCgst !== undefined ? Number(it.sellingCgst) : cgst;
      const sellingSgst = it.sellingSgst !== undefined ? Number(it.sellingSgst) : sgst;
      const sellingRateExGst = Number(it.sellingRateExGst) || 0;
      const mrp = sellingRateExGst * (1 + (sellingSgst + sellingCgst) / 100);
      return {
        itemName: it.itemName.trim(),
        batch: it.batch.trim(),
        expiry: new Date(it.expiry),
        pack: String(it.packType || it.pack || '0').trim(),
        quantity: Number(it.quantity) || 0,
        free: Number(it.free) || 0,
        rate: Number(it.purchaseRateExGst) || Number(it.rate) || 0,
        mrp: mrp,
        discountPercent: Number(it.discountPercent) || Number(it.dis) || 0,
        discountAmount: Number(it.discountAmount) || 0,
        sgst: sgst,
        cgst: cgst,
        igst: Number(it.igst) || 0,
        hsn: String(it.hsn || '0').trim(),
        totalAmount: Number(it.totalAmount) || 0,
        returnedQty: it.returnedQty || 0,
        description: String(it.description || '').trim(),
        dosageForm: String(it.dosageForm || '').trim(),
        packType: String(it.packType || it.pack || '').trim(),
        unitsPerPack: Number(it.unitsPerPack) || 1,
        purchaseRateExGst: Number(it.purchaseRateExGst) || Number(it.rate) || 0,
        sellingRateExGst: sellingRateExGst,
        sellingCgst: sellingCgst,
        sellingSgst: sellingSgst,
        thresholdMedicineNumber: Number(it.thresholdMedicineNumber) || 10
      };
    });
    oldPurchase.totalAmount = Number(totalAmount) || 0;
    oldPurchase.paidAmount = Number(paidAmount) || 0;
    oldPurchase.pendingAmount = Number(pendingAmount) || 0;
    
    await oldPurchase.save();

    res.status(200).json({ message: 'Purchase invoice edited and stock updated successfully.', purchase: oldPurchase });
  } catch (error) {
    console.error('Update Purchase Error:', error);
    res.status(500).json({ message: 'Server error updating purchase entry.' });
  }
};

// @desc    Process a purchase return
// @route   POST /api/pharmacy/purchases/:id/returns
// @access  Private
const createPurchaseReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;
    const { reason, returnDate, itemsReturned } = req.body; // itemsReturned: [{ itemName, batch, quantityReturned }]

    if (!reason || !itemsReturned || itemsReturned.length === 0) {
      return res.status(400).json({ message: 'Reason and returned items details are required.' });
    }

    const purchase = await Purchase.findOne({ _id: id, hospitalId });
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase invoice not found.' });
    }

    const returnDateObj = returnDate ? new Date(returnDate) : new Date();
    const returnItemsToLog = [];

    // Verify quantities and decrease stock
    for (const retItem of itemsReturned) {
      const { itemName, batch, quantityReturned } = retItem;
      const parsedQty = Number(quantityReturned) || 0;
      if (parsedQty <= 0) continue;

      // Find item in purchase
      const purchaseItem = purchase.items.find(it => 
        it.itemName.toLowerCase() === itemName.toLowerCase() && 
        it.batch.toLowerCase() === batch.toLowerCase()
      );

      if (!purchaseItem) {
        return res.status(400).json({ message: `Medicine '${itemName}' (Batch: ${batch}) is not part of this purchase invoice.` });
      }

      // Check return limits
      const maxReturnable = purchaseItem.quantity - purchaseItem.returnedQty;
      if (parsedQty > maxReturnable) {
        return res.status(400).json({
          message: `Cannot return ${parsedQty} units. Maximum returnable quantity for '${itemName}' in this invoice is ${maxReturnable} units.`
        });
      }

      // Check current stock availability
      const currentStock = await PharmacyInventory.findOne({
        hospitalId,
        itemName: { $regex: new RegExp('^' + itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        batch: { $regex: new RegExp('^' + batch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      });

      if (!currentStock || currentStock.quantity < parsedQty) {
        return res.status(400).json({
          message: `Cannot process return. Current stock in inventory for '${itemName}' (Batch: ${batch}) is ${currentStock?.quantity || 0} units, which is less than the returned quantity of ${parsedQty}.`
        });
      }

      // Deduct stock and log stock movement
      const previousStock = currentStock.quantity;
      currentStock.quantity -= parsedQty;
      currentStock.amount = currentStock.rate * currentStock.quantity;
      await currentStock.save();

      await PharmacyStockMovement.create({
        hospitalId,
        itemName: currentStock.itemName,
        batch: currentStock.batch,
        type: 'Purchase Return',
        quantity: -parsedQty,
        previousStock,
        newStock: currentStock.quantity,
        performedBy: req.user._id,
        remarks: `Purchase Return for Inv: ${purchase.purchaseInvoiceNumber}. Reason: ${reason}`
      });

      // Update invoice item returned qty
      purchaseItem.returnedQty += parsedQty;

      returnItemsToLog.push({
        itemName: purchaseItem.itemName,
        batch: purchaseItem.batch,
        expiry: purchaseItem.expiry,
        quantityReturned: parsedQty,
        rate: purchaseItem.rate,
        mrp: purchaseItem.mrp,
        gst: purchaseItem.cgst + purchaseItem.sgst + purchaseItem.igst,
        discount: purchaseItem.discountPercent
      });
    }

    if (returnItemsToLog.length === 0) {
      return res.status(400).json({ message: 'No valid item return quantities were provided.' });
    }

    // Determine purchase invoice return status
    let allFullyReturned = true;
    let anyReturned = false;

    for (const it of purchase.items) {
      if (it.returnedQty > 0) {
        anyReturned = true;
      }
      if (it.returnedQty < it.quantity) {
        allFullyReturned = false;
      }
    }

    if (allFullyReturned) {
      purchase.purchaseStatus = 'Returned';
    } else if (anyReturned) {
      purchase.purchaseStatus = 'Partially Returned';
    }

    await purchase.save();

    // Create Purchase Return log
    const returnRecord = new PurchaseReturn({
      hospitalId,
      purchaseId: purchase._id,
      supplierId: purchase.supplierId || null,
      supplierName: purchase.supplierName || '',
      invoiceNumber: purchase.purchaseInvoiceNumber,
      reason,
      items: returnItemsToLog,
      returnDate: returnDateObj,
      createdBy: req.user._id
    });

    await returnRecord.save();

    res.status(200).json({
      message: 'Purchase return completed successfully and inventory updated.',
      returnRecord,
      purchase
    });
  } catch (error) {
    console.error('Create Purchase Return Error:', error);
    res.status(500).json({ message: 'Server error processing purchase return.' });
  }
};

// @desc    Create physical stock adjustment
// @route   POST /api/pharmacy/adjustments
// @access  Private
const createStockAdjustment = async (req, res) => {
  try {
    const role = String(req.user.role).toLowerCase().trim();
    if (role !== 'admin' && role !== 'store manager') {
      return res.status(403).json({ message: 'Forbidden. Only administrators and store managers can adjust physical stock.' });
    }

    const { itemName, batch, quantity, type, reason, remarks, approvedBy } = req.body;
    if (!itemName || !batch || !quantity || quantity <= 0 || !type || !reason) {
      return res.status(400).json({ message: 'Item name, batch, quantity, type, and reason are required.' });
    }

    const hospitalId = req.user.hospitalId;
    const stockItem = await PharmacyInventory.findOne({ hospitalId, itemName, batch });
    if (!stockItem) {
      return res.status(404).json({ message: 'Matching inventory batch not found.' });
    }

    const previousStock = stockItem.quantity;
    let newStock = previousStock;

    if (type === 'Increase') {
      newStock = previousStock + quantity;
    } else if (type === 'Decrease') {
      newStock = Math.max(0, previousStock - quantity);
    } else {
      return res.status(400).json({ message: 'Invalid adjustment type.' });
    }

    const oldVal = `Qty: ${previousStock}`;
    const newVal = `Qty: ${newStock}`;

    stockItem.quantity = newStock;
    stockItem.amount = stockItem.rate * newStock;
    await stockItem.save();

    // Create Stock Movement log
    await PharmacyStockMovement.create({
      hospitalId,
      itemName,
      batch,
      type: 'Stock Adjustment',
      quantity: type === 'Increase' ? quantity : -quantity,
      previousStock,
      newStock,
      referenceId: null,
      performedBy: req.user._id,
      remarks: `Adjustment: ${type}. Reason: ${reason}. Remarks: ${remarks || ''}. Approved by: ${approvedBy || 'Staff'}`
    });

    const adjustment = await PharmacyAdjustment.create({
      hospitalId,
      itemName,
      batch,
      quantity,
      type,
      reason,
      remarks,
      approvedBy,
      createdBy: req.user._id,
      username: req.user.username
    });

    await logAudit(
      req,
      'Inventory Adjustment',
      'Inventory',
      adjustment._id,
      oldVal,
      newVal
    );

    res.status(201).json({
      message: 'Stock adjusted successfully and ledger updated.',
      adjustment,
      stockItem
    });
  } catch (error) {
    console.error('Adjustment error:', error);
    res.status(500).json({ message: 'Server error processing stock adjustment.' });
  }
};

// @desc    Get physical stock adjustments
// @route   GET /api/pharmacy/adjustments
// @access  Private
const getAdjustments = async (req, res) => {
  try {
    const query = tenantFilter(req);
    const adjustments = await PharmacyAdjustment.find(query).sort({ createdAt: -1 });
    res.status(200).json(adjustments);
  } catch (error) {
    console.error('Get Adjustments error:', error);
    res.status(500).json({ message: 'Server error loading adjustments.' });
  }
};

// @desc    Get inventory audit logs
// @route   GET /api/pharmacy/audit-logs
// @access  Private
const getAuditLogs = async (req, res) => {
  try {
    const query = tenantFilter(req);
    const logs = await PharmacyAuditLog.find(query)
      .populate('user', 'username role')
      .sort({ createdAt: -1 })
      .limit(1000);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Get Audit Logs error:', error);
    res.status(500).json({ message: 'Server error loading audit logs.' });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchases,
  getPurchaseDetails,
  createPurchase,
  updatePurchase,
  createPurchaseReturn,
  createStockAdjustment,
  getAdjustments,
  getAuditLogs
};
