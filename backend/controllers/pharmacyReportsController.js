const Purchase = require('../models/Purchase');
const PurchaseReturn = require('../models/PurchaseReturn');
const PharmacyBill = require('../models/PharmacyBill');
const PharmacyInventory = require('../models/PharmacyInventory');
const Supplier = require('../models/Supplier');
const PharmacyAdjustment = require('../models/PharmacyAdjustment');
const PharmacyStockMovement = require('../models/PharmacyStockMovement');

// Helper to calculate date ranges
const getDateRange = (fromDate, toDate) => {
  const start = fromDate ? new Date(fromDate) : new Date(0);
  const end = toDate ? new Date(toDate) : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get pharmacy dashboard analytics
// @route   GET /api/pharmacy/analytics/dashboard
// @access  Private
const getAnalyticsDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

    // 1. Summary Statistics Queries
    const todaySales = await PharmacyBill.aggregate([
      { $match: { hospitalId, billDate: { $gte: startOfToday, $lte: endOfToday }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const monthlySales = await PharmacyBill.aggregate([
      { $match: { hospitalId, billDate: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const todayPurchase = await Purchase.aggregate([
      { $match: { hospitalId, invoiceDate: { $gte: startOfToday, $lte: endOfToday }, purchaseStatus: { $ne: 'Returned' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const monthlyPurchase = await Purchase.aggregate([
      { $match: { hospitalId, invoiceDate: { $gte: startOfMonth }, purchaseStatus: { $ne: 'Returned' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Current Inventory Valuation (Amount Ex GST and Amount Inc GST)
    const inventoryTotals = await PharmacyInventory.aggregate([
      { $match: { hospitalId } },
      {
        $group: {
          _id: null,
          totalExGst: {
            $sum: {
              $ifNull: ['$amountExGst', { $multiply: [{ $ifNull: ['$rateExGst', 0] }, { $ifNull: ['$quantityPacks', 0] }] }]
            }
          },
          totalIncGst: {
            $sum: {
              $ifNull: ['$amountIncGst', { $multiply: [{ $ifNull: ['$mrp', 0] }, { $ifNull: ['$quantityPacks', 0] }] }]
            }
          }
        }
      }
    ]);

    // Low stock, Expiring, Expired counts
    const lowStockCount = await PharmacyInventory.countDocuments({
      hospitalId,
      $expr: { $lte: ["$quantityUnits", "$thresholdMedicineNumber"] }
    });
    const expiringSoonCount = await PharmacyInventory.countDocuments({ hospitalId, expiry: { $gt: new Date(), $lte: ninetyDaysLater } });
    const expiredCount = await PharmacyInventory.countDocuments({ hospitalId, expiry: { $lte: new Date() } });

    // Pending supplier payments
    const pendingSupplierPayments = await Purchase.aggregate([
      { $match: { hospitalId, paymentStatus: { $in: ['Pending', 'Partially Paid', 'Overdue'] } } },
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
    ]);

    const totalSuppliers = await Supplier.countDocuments({ hospitalId, status: 'Active' });
    const totalMedicines = await PharmacyInventory.distinct('itemName', { hospitalId });
    const totalPurchaseInvoices = await Purchase.countDocuments({ hospitalId });
    const totalSalesInvoices = await PharmacyBill.countDocuments({ hospitalId, status: { $ne: 'Cancelled' } });

    // 2. Graphical Reports Data
    // Daily Sales (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailySalesData = await PharmacyBill.aggregate([
      { $match: { hospitalId, billDate: { $gte: thirtyDaysAgo }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } }, sales: { $sum: '$grandTotal' } } },
      { $sort: { _id: 1 } }
    ]);

    // Monthly Sales Trend (Last 12 Months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const monthlySalesData = await PharmacyBill.aggregate([
      { $match: { hospitalId, billDate: { $gte: twelveMonthsAgo }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$billDate' } }, sales: { $sum: '$grandTotal' } } },
      { $sort: { _id: 1 } }
    ]);

    // Purchase Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const purchaseTrendData = await Purchase.aggregate([
      { $match: { hospitalId, invoiceDate: { $gte: sixMonthsAgo }, purchaseStatus: { $ne: 'Returned' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } }, purchases: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]);

    // Top Selling Medicines
    const topSellingMeds = await PharmacyBill.aggregate([
      { $match: { hospitalId, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemName', totalQty: { $sum: '$items.quantity' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);

    // Top Purchased Medicines
    const topPurchasedMeds = await Purchase.aggregate([
      { $match: { hospitalId, purchaseStatus: { $ne: 'Returned' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemName', totalQty: { $sum: '$items.quantity' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);

    // Supplier Purchase Share
    const supplierPurchases = await Purchase.aggregate([
      { $match: { hospitalId } },
      {
        $group: {
          _id: {
            supplierId: '$supplierId',
            supplierName: '$supplierName'
          },
          totalPurchases: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id.supplierId',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          supplierName: {
            $ifNull: ['$supplier.name', { $ifNull: ['$_id.supplierName', 'Direct Purchase'] }]
          },
          totalPurchases: 1
        }
      },
      { $sort: { totalPurchases: -1 } }
    ]);

    res.status(200).json({
      summary: {
        todaySales: todaySales[0]?.total || 0,
        monthlySales: monthlySales[0]?.total || 0,
        todayPurchase: todayPurchase[0]?.total || 0,
        monthlyPurchase: monthlyPurchase[0]?.total || 0,
        totalExGst: inventoryTotals[0]?.totalExGst || 0,
        totalIncGst: inventoryTotals[0]?.totalIncGst || 0,
        lowStock: lowStockCount,
        expiringSoon: expiringSoonCount,
        expired: expiredCount,
        pendingSupplierPayments: pendingSupplierPayments[0]?.total || 0,
        totalSuppliers,
        totalMedicines: totalMedicines.length,
        totalPurchaseInvoices,
        totalSalesInvoices
      },
      graphs: {
        dailySales: dailySalesData,
        monthlySales: monthlySalesData,
        purchaseTrend: purchaseTrendData,
        topSellingMeds,
        topPurchasedMeds,
        supplierPurchases
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error fetching dashboard analytics.' });
  }
};

// @desc    Get comprehensive reports matching filters
// @route   GET /api/pharmacy/reports
// @access  Private
const getComprehensiveReports = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    const { reportType, fromDate, toDate, supplierId, itemName, paymentMode, doctorName, patientName } = req.query;

    const { start, end } = getDateRange(fromDate, toDate);

    if (!reportType) {
      return res.status(400).json({ message: 'reportType is required' });
    }

    let records = [];

    switch (reportType) {
      case 'purchase': {
        const query = { hospitalId, invoiceDate: { $gte: start, $lte: end } };
        if (supplierId) query.supplierId = supplierId;
        records = await Purchase.find(query).populate('supplierId', 'name code gstin').sort({ invoiceDate: -1 });
        break;
      }
      case 'purchase-return': {
        const query = { hospitalId, createdAt: { $gte: start, $lte: end } };
        records = await PurchaseReturn.find(query).populate('supplierId', 'name code').populate('purchaseId', 'purchaseInvoiceNumber').sort({ createdAt: -1 });
        break;
      }
      case 'sales': {
        const query = { hospitalId, billDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } };
        if (paymentMode) query.paymentMethod = paymentMode;
        if (patientName) {
          query['customerDetails.name'] = new RegExp(patientName, 'i');
        }
        records = await PharmacyBill.find(query).populate('patientId', 'name age gender mobile').sort({ billDate: -1 });
        break;
      }
      case 'sales-return': {
        const query = { hospitalId, billDate: { $gte: start, $lte: end }, status: { $in: ['Returned', 'Partially Returned'] } };
        records = await PharmacyBill.find(query).populate('patientId', 'name age gender mobile').sort({ billDate: -1 });
        break;
      }
      case 'inventory':
      case 'current-stock': {
        const query = { hospitalId };
        if (itemName) query.itemName = new RegExp(itemName, 'i');
        records = await PharmacyInventory.find(query).populate('supplierId', 'name code').sort({ itemName: 1 });
        break;
      }
      case 'expiry': {
        const query = { hospitalId, expiry: { $lte: end } };
        if (fromDate) query.expiry.$gte = start;
        records = await PharmacyInventory.find(query).populate('supplierId', 'name code').sort({ expiry: 1 });
        break;
      }
      case 'out-of-stock': {
        records = await PharmacyInventory.find({
          hospitalId,
          $expr: { $lte: ["$quantityUnits", "$thresholdMedicineNumber"] }
        }).populate('supplierId', 'name code').sort({ quantityUnits: 1 });
        break;
      }
      case 'stock-adjustment': {
        const query = { hospitalId, createdAt: { $gte: start, $lte: end } };
        records = await PharmacyAdjustment.find(query).sort({ createdAt: -1 });
        break;
      }
      case 'supplier-outstanding': {
        const suppliersList = await Supplier.find({ hospitalId, status: 'Active' });
        records = await Promise.all(
          suppliersList.map(async (sup) => {
            const outstanding = await Purchase.aggregate([
              { $match: { hospitalId, supplierId: sup._id, paymentStatus: { $in: ['Pending', 'Partially Paid', 'Overdue'] } } },
              { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
            ]);
            return {
              supplierId: sup._id,
              name: sup.name,
              code: sup.code,
              gstin: sup.gstin,
              outstandingAmount: outstanding[0]?.total || 0
            };
          })
        );
        break;
      }
      case 'profit': {
        const sales = await PharmacyBill.find({ hospitalId, billDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } });
        
        // Cache inventory purchase rates per item/batch for speed
        const inventoryCache = await PharmacyInventory.find({ hospitalId });

        records = [];
        sales.forEach(bill => {
          bill.items.forEach(item => {
            const matchingBatch = inventoryCache.find(inv => inv.itemName === item.itemName && inv.batch === item.batch);
            const purchaseRate = matchingBatch ? matchingBatch.rate : (item.unitPrice * 0.7); // Fallback: 30% margin

            const discountAmount = item.discount || 0;
            const grossSale = item.amount;
            const totalPurchaseCost = purchaseRate * item.quantity;
            const netProfit = grossSale - totalPurchaseCost;
            const profitPercent = totalPurchaseCost > 0 ? (netProfit / totalPurchaseCost) * 100 : 0;

            records.push({
              billNumber: bill.billNumber,
              billDate: bill.billDate,
              itemName: item.itemName,
              batch: item.batch,
              quantity: item.quantity,
              purchaseRate,
              sellingPrice: item.unitPrice,
              discount: discountAmount,
              gstAmount: item.gstAmount,
              netSale: grossSale,
              grossProfit: netProfit,
              profitPercent
            });
          });
        });
        break;
      }
      case 'gst': {
        // Collect Sales GST
        const salesGst = await PharmacyBill.aggregate([
          { $match: { hospitalId, billDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
          { $group: { _id: null, totalTax: { $sum: '$gstAmount' } } }
        ]);

        // Collect Purchases GST
        const purchasesGst = await Purchase.aggregate([
          { $match: { hospitalId, invoiceDate: { $gte: start, $lte: end }, purchaseStatus: { $ne: 'Returned' } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: null,
              totalCGST: { $sum: { $multiply: [{ $divide: ['$items.cgst', 100] }, { $multiply: ['$items.rate', '$items.quantity'] }] } },
              totalSGST: { $sum: { $multiply: [{ $divide: ['$items.sgst', 100] }, { $multiply: ['$items.rate', '$items.quantity'] }] } },
              totalIGST: { $sum: { $multiply: [{ $divide: ['$items.igst', 100] }, { $multiply: ['$items.rate', '$items.quantity'] }] } }
            }
          }
        ]);

        records = [{
          salesGstAmount: salesGst[0]?.totalTax || 0,
          purchaseCGST: purchasesGst[0]?.totalCGST || 0,
          purchaseSGST: purchasesGst[0]?.totalSGST || 0,
          purchaseIGST: purchasesGst[0]?.totalIGST || 0,
          netGstLiability: (salesGst[0]?.totalTax || 0) - ((purchasesGst[0]?.totalCGST || 0) + (purchasesGst[0]?.totalSGST || 0) + (purchasesGst[0]?.totalIGST || 0))
        }];
        break;
      }
      case 'doctor': {
        const query = { hospitalId, billDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } };
        if (doctorName) query.doctorName = new RegExp(doctorName, 'i');
        records = await PharmacyBill.find(query).sort({ billDate: -1 });
        break;
      }
      case 'patient': {
        const query = { hospitalId, billDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } };
        if (patientName) query['customerDetails.name'] = new RegExp(patientName, 'i');
        records = await PharmacyBill.find(query).populate('patientId', 'name age gender mobile').sort({ billDate: -1 });
        break;
      }
      case 'ipd': {
        records = await PharmacyBill.find({
          hospitalId,
          billDate: { $gte: start, $lte: end },
          status: { $ne: 'Cancelled' },
          admissionId: { $ne: null }
        }).populate('patientId', 'name').sort({ billDate: -1 });
        break;
      }
      case 'walk-in': {
        records = await PharmacyBill.find({
          hospitalId,
          billDate: { $gte: start, $lte: end },
          status: { $ne: 'Cancelled' },
          patientId: null
        }).sort({ billDate: -1 });
        break;
      }
      case 'stock-ledger': {
        const query = { hospitalId, timestamp: { $gte: start, $lte: end } };
        if (itemName) query.itemName = new RegExp(itemName, 'i');
        if (supplierId) query.remarks = new RegExp(supplierId, 'i'); // Search within remarks or similar
        records = await PharmacyStockMovement.find(query).populate('performedBy', 'username').sort({ timestamp: -1 });
        break;
      }
      default:
        return res.status(400).json({ message: 'Invalid reportType specified' });
    }

    res.status(200).json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error generating report.' });
  }
};

module.exports = {
  getAnalyticsDashboard,
  getComprehensiveReports
};
