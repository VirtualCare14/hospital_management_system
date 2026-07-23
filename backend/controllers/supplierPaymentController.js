const Purchase = require('../models/Purchase');
const SupplierPayment = require('../models/SupplierPayment');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// Log Audit Helper
const logAudit = async (req, action, module, refId, oldVal, newVal) => {
  try {
    await PharmacyAuditLog.create({
      hospitalId: req.user.hospitalId,
      user: req.user.id,
      username: req.user.username || 'System User',
      role: req.user.role || 'Staff',
      action,
      module,
      referenceId: String(refId),
      oldValue: oldVal ? String(oldVal) : '',
      newValue: newVal ? String(newVal) : '',
      ipAddress: req.ip || ''
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

// @desc    Add payment against purchase invoice
// @route   POST /api/pharmacy/purchases/:id/payments
// @access  Private
const addSupplierPayment = async (req, res) => {
  try {
    const role = String(req.user.role).toLowerCase().trim();
    if (role !== 'admin' && role !== 'finance/admin' && role !== 'store manager') {
      return res.status(403).json({ message: 'Forbidden. You do not have permission to log supplier payments.' });
    }

    const { id } = req.params;
    const { amountPaid, paymentMode, referenceNumber, transactionId, notes, paymentDate } = req.body;

    if (!amountPaid || amountPaid <= 0 || !paymentMode) {
      return res.status(400).json({ message: 'Valid amount paid and payment mode are required.' });
    }

    const purchase = await Purchase.findOne({ _id: id, hospitalId: req.user.hospitalId });
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase invoice not found.' });
    }

    if (purchase.pendingAmount <= 0) {
      return res.status(400).json({ message: 'This purchase invoice is already fully paid.' });
    }

    const actualAmountToPay = Math.min(amountPaid, purchase.pendingAmount);

    const oldPaid = purchase.paidAmount;
    const oldPending = purchase.pendingAmount;
    const oldStatus = purchase.paymentStatus;

    purchase.paidAmount += actualAmountToPay;
    purchase.pendingAmount = Math.max(0, purchase.totalAmount - purchase.paidAmount);

    // Update payment status
    if (purchase.pendingAmount === 0) {
      purchase.paymentStatus = 'Paid';
    } else {
      purchase.paymentStatus = 'Partially Paid';
    }

    // Overdue check
    if (purchase.pendingAmount > 0 && purchase.dueDate && new Date(purchase.dueDate) < new Date()) {
      purchase.paymentStatus = 'Overdue';
    }

    await purchase.save();

    const payment = await SupplierPayment.create({
      hospitalId: req.user.hospitalId,
      purchaseId: purchase._id,
      supplierId: purchase.supplierId || null,
      supplierName: purchase.supplierName || '',
      amountPaid: actualAmountToPay,
      paymentDate: paymentDate || new Date(),
      paymentMode,
      referenceNumber,
      transactionId,
      notes,
      createdBy: req.user.id
    });

    // Write audit log
    await logAudit(
      req,
      'Supplier Payment Created',
      'Purchases',
      purchase._id,
      `Paid: ${oldPaid}, Pending: ${oldPending}, Status: ${oldStatus}`,
      `Paid: ${purchase.paidAmount}, Pending: ${purchase.pendingAmount}, Status: ${purchase.paymentStatus}`
    );

    res.status(201).json({
      message: 'Payment logged successfully.',
      payment,
      purchase
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error processing supplier payment.' });
  }
};

// @desc    Get payments for a purchase invoice
// @route   GET /api/pharmacy/purchases/:id/payments
// @access  Private
const getSupplierPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await SupplierPayment.find({
      purchaseId: id,
      hospitalId: req.user.hospitalId
    }).populate('createdBy', 'username');

    res.status(200).json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error fetching payments.' });
  }
};

module.exports = {
  addSupplierPayment,
  getSupplierPayments
};
