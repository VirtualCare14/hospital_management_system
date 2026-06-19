const PharmacyRequest = require('../models/PharmacyRequest');
const PharmacyInventory = require('../models/PharmacyInventory');
const IpdAdmission = require('../models/IpdAdmission');
const IpdMedicine = require('../models/IpdMedicine');
const IpdActivityTimeline = require('../models/IpdActivityTimeline');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helper to add timeline entry
const addTimeline = async (req, admissionId, patientId, activity, description, metadata = {}) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  return IpdActivityTimeline.create({
    hospitalId: req.user.hospitalId,
    admissionId,
    patientId,
    activity,
    description,
    date: dateStr,
    time: timeStr,
    performedBy: req.user._id,
    performedByName: req.user.doctorName || req.user.username || 'System',
    metadata
  });
};

// @desc    Get all pharmacy requests
// @route   GET /api/pharmacy/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    const { patientId, admissionId, status, search } = req.query;
    let query = tenantFilter(req);

    if (patientId) query.patientId = patientId;
    if (admissionId) query.admissionId = admissionId;
    if (status) query.status = status;

    const requests = await PharmacyRequest.find(query)
      .populate('patientId', 'patientName uhid gender dob')
      .populate('doctorId', 'username doctorName')
      .populate({
        path: 'admissionId',
        select: 'ipdNumber pidNumber status bedId roomId',
        populate: { path: 'bedId', select: 'bedNumber' }
      })
      .sort({ createdAt: -1 });

    let filtered = requests;
    if (search) {
      const regex = new RegExp(search, 'i');
      filtered = requests.filter(r => 
        r.requestNumber.match(regex) ||
        r.procedureName.match(regex) ||
        r.patientId?.patientName.match(regex) ||
        r.doctorId?.doctorName?.match(regex) ||
        r.doctorId?.username?.match(regex)
      );
    }

    res.status(200).json(filtered);
  } catch (error) {
    console.error('Get Requests Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single request details
// @route   GET /api/pharmacy/requests/:id
// @access  Private
const getRequestDetails = async (req, res) => {
  try {
    const request = await PharmacyRequest.findOne(tenantFilter(req, { _id: req.params.id }))
      .populate('patientId', 'patientName uhid gender dob')
      .populate('doctorId', 'username doctorName')
      .populate({
        path: 'admissionId',
        select: 'ipdNumber pidNumber status bedId roomId',
        populate: [
          { path: 'bedId', select: 'bedNumber' },
          { path: 'roomId', select: 'roomType' }
        ]
      });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error('Get Request Details Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create doctor pharmacy request
// @route   POST /api/pharmacy/requests
// @access  Private
const createRequest = async (req, res) => {
  try {
    const { admissionId, procedureName, items } = req.body;

    if (!admissionId || !procedureName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Admission ID, procedure name, and requested items are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const hospitalId = req.user.hospitalId;
    const doctorId = req.user._id;

    // Generate Request Number
    const count = await PharmacyRequest.countDocuments({ hospitalId });
    const requestNumber = `PR-${10001 + count}`;

    // Map items, setting all initial quantites
    const parsedItems = items.map(item => ({
      itemName: String(item.itemName).trim(),
      requestedQty: parseInt(item.requestedQty) || 1,
      approvedQty: 0,
      issuedQty: 0,
      usedQty: 0,
      returnedQty: 0,
      damagedQty: 0,
      pendingQty: 0,
      rejectedQty: 0,
      batch: ''
    })).filter(i => i.itemName);

    if (parsedItems.length === 0) {
      return res.status(400).json({ message: 'No valid items provided' });
    }

    const newRequest = await PharmacyRequest.create({
      hospitalId,
      requestNumber,
      admissionId,
      patientId: admission.patientId,
      doctorId,
      procedureName,
      status: 'Pending',
      items: parsedItems,
      auditTrail: [{
        status: 'Pending',
        action: 'Request Created',
        performedBy: doctorId,
        performedByName: req.user.doctorName || req.user.username || 'Doctor',
        timestamp: new Date(),
        remarks: `Requested items for procedure: ${procedureName}`
      }]
    });

    // Add Timeline Log in IPD
    await addTimeline(req, admissionId, admission.patientId, 'Service Added', 
      `Pharmacy Request #${requestNumber} created for procedure: ${procedureName}`
    );

    res.status(201).json({ message: 'Pharmacy request created successfully', request: newRequest });
  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pharmacy review request (Approve/Reject/Partial)
// @route   PUT /api/pharmacy/requests/:id/review
// @access  Private
const reviewRequest = async (req, res) => {
  try {
    const { items, remarks } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const request = await PharmacyRequest.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending requests can be reviewed' });
    }

    let allRejected = true;
    let hasPending = false;

    // Process each item
    request.items = request.items.map(origItem => {
      const reviewItem = items.find(i => i.itemName.toLowerCase() === origItem.itemName.toLowerCase());
      
      if (!reviewItem || reviewItem.isRejected) {
        origItem.rejectedQty = origItem.requestedQty;
        origItem.approvedQty = 0;
        origItem.pendingQty = 0;
      } else {
        allRejected = false;
        const appQty = parseInt(reviewItem.approvedQty) || 0;
        origItem.approvedQty = appQty;
        origItem.batch = String(reviewItem.batch || '').trim();
        origItem.rejectedQty = 0;
        origItem.pendingQty = Math.max(0, origItem.requestedQty - appQty);

        if (origItem.pendingQty > 0) {
          hasPending = true;
        }
      }
      return origItem;
    });

    let newStatus = 'Approved';
    if (allRejected) {
      newStatus = 'Rejected';
    } else if (hasPending) {
      newStatus = 'Partially Approved';
    }

    request.status = newStatus;
    request.remarks = remarks || '';
    request.auditTrail.push({
      status: newStatus,
      action: 'Request Reviewed',
      performedBy: req.user._id,
      performedByName: req.user.doctorName || req.user.username || 'Pharmacist',
      timestamp: new Date(),
      remarks: remarks || `Reviewed request. Status set to ${newStatus}`
    });

    await request.save();

    // Log to IPD Timeline
    await addTimeline(req, request.admissionId, request.patientId, 'Bill Updated',
      `Pharmacy Request #${request.requestNumber} reviewed: ${newStatus}`
    );

    res.status(200).json({ message: `Request successfully ${newStatus}`, request });
  } catch (error) {
    console.error('Review Request Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pharmacy issue approved items (Decrease stock)
// @route   POST /api/pharmacy/requests/:id/issue
// @access  Private
const issueRequest = async (req, res) => {
  try {
    const { issuedTo, remarks } = req.body;

    if (!issuedTo) {
      return res.status(400).json({ message: 'Issued To receiver field is required' });
    }

    const request = await PharmacyRequest.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'Approved' && request.status !== 'Partially Approved') {
      return res.status(400).json({ message: 'Only Approved or Partially Approved requests can be issued' });
    }

    // Verify stock availability and deduct
    for (const item of request.items) {
      if (item.approvedQty > 0 && item.issuedQty === 0) {
        if (!item.batch) {
          return res.status(400).json({ message: `No batch selected for medicine: ${item.itemName}` });
        }

        const invItem = await PharmacyInventory.findOne({
          hospitalId: req.user.hospitalId,
          itemName: { $regex: new RegExp('^' + item.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          batch: item.batch
        });

        if (!invItem) {
          return res.status(400).json({ message: `Inventory batch not found for ${item.itemName} (Batch: ${item.batch})` });
        }

        if (invItem.quantity < item.approvedQty) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.itemName} (Batch: ${item.batch}). Available: ${invItem.quantity}, Required: ${item.approvedQty}`
          });
        }

        // Deduct quantity
        invItem.quantity -= item.approvedQty;
        invItem.amount = invItem.rate * invItem.quantity;
        await invItem.save();

        item.issuedQty = item.approvedQty;
      }
    }

    request.status = 'Issued';
    request.issuedTo = issuedTo;
    request.auditTrail.push({
      status: 'Issued',
      action: 'Items Issued',
      performedBy: req.user._id,
      performedByName: req.user.doctorName || req.user.username || 'Pharmacist',
      timestamp: new Date(),
      remarks: `Items issued to ${issuedTo}. ${remarks || ''}`
    });

    await request.save();

    // Log to IPD Timeline
    await addTimeline(req, request.admissionId, request.patientId, 'Service Added',
      `Pharmacy Request #${request.requestNumber} items issued to ${issuedTo}`
    );

    res.status(200).json({ message: 'Items issued successfully and inventory updated', request });
  } catch (error) {
    console.error('Issue Request Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Doctor record item consumption (Used, Unused, Damaged)
// @route   POST /api/pharmacy/requests/:id/consume
// @access  Private
const recordConsumption = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items consumption data array is required' });
    }

    const request = await PharmacyRequest.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'Issued' && request.status !== 'Remaining Items Issued') {
      return res.status(400).json({ message: 'Consumption can only be recorded after items are issued' });
    }

    let hasUnused = false;

    // Update quantities
    request.items = request.items.map(origItem => {
      const consumed = items.find(i => i.itemName.toLowerCase() === origItem.itemName.toLowerCase());
      if (consumed) {
        const used = parseInt(consumed.usedQty) || 0;
        const unused = parseInt(consumed.unusedQty) || 0;
        const damaged = parseInt(consumed.damagedQty) || 0;

        // Validation check
        if (used + unused + damaged !== origItem.issuedQty) {
          throw new Error(`Item ${origItem.itemName} mismatch: Used(${used}) + Unused(${unused}) + Damaged(${damaged}) must equal Issued(${origItem.issuedQty})`);
        }

        origItem.usedQty = used;
        origItem.returnedQty = unused; // returns are registered here
        origItem.damagedQty = damaged;

        if (unused > 0) {
          hasUnused = true;
        }
      }
      return origItem;
    });

    const newStatus = hasUnused ? 'Return Requested' : 'Completed';
    request.status = newStatus;
    request.auditTrail.push({
      status: newStatus,
      action: 'Consumption Recorded',
      performedBy: req.user._id,
      performedByName: req.user.doctorName || req.user.username || 'Doctor',
      timestamp: new Date(),
      remarks: hasUnused ? 'Recorded consumption. Return requested for unused items.' : 'Recorded consumption. Request marked complete.'
    });

    await request.save();

    // Log to Timeline
    await addTimeline(req, request.admissionId, request.patientId, 'OT Record Completed',
      `Pharmacy Request #${request.requestNumber} consumption recorded. Status: ${newStatus}`
    );

    // If no returns are needed (Completed), write billing immediately
    if (newStatus === 'Completed') {
      await autoPostToBilling(req, request);
    }

    res.status(200).json({ message: 'Consumption recorded successfully', request });
  } catch (error) {
    console.error('Record Consumption Error:', error.message);
    res.status(400).json({ message: error.message || 'Server error' });
  }
};

// @desc    Pharmacy verify returned items (Accept / Reject)
// @route   POST /api/pharmacy/requests/:id/verify-return
// @access  Private
const verifyReturn = async (req, res) => {
  try {
    const { items, remarks } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items verification list is required' });
    }

    const request = await PharmacyRequest.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'Return Requested') {
      return res.status(400).json({ message: 'Only Return Requested items can be verified' });
    }

    let returnsAccepted = false;

    // Verify and update stock
    for (const item of request.items) {
      if (item.returnedQty > 0) {
        const verifyItem = items.find(i => i.itemName.toLowerCase() === item.itemName.toLowerCase());
        
        if (verifyItem && verifyItem.returnAccepted) {
          returnsAccepted = true;
          // Increase stock in PharmacyInventory
          const invItem = await PharmacyInventory.findOne({
            hospitalId: req.user.hospitalId,
            itemName: { $regex: new RegExp('^' + item.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
            batch: item.batch
          });

          if (invItem) {
            invItem.quantity += item.returnedQty;
            invItem.amount = invItem.rate * invItem.quantity;
            await invItem.save();
          }
        } else {
          // If return is rejected, unused items become wasted/damaged (stock does not increase)
          item.damagedQty += item.returnedQty;
          item.returnedQty = 0;
        }
      }
    }

    const newStatus = returnsAccepted ? 'Return Accepted' : 'Return Rejected';
    request.status = newStatus;
    request.remarks = remarks || '';
    request.auditTrail.push({
      status: newStatus,
      action: 'Returns Verified',
      performedBy: req.user._id,
      performedByName: req.user.doctorName || req.user.username || 'Pharmacist',
      timestamp: new Date(),
      remarks: `Returns verified. Result: ${newStatus}. Remarks: ${remarks || ''}`
    });

    await request.save();

    // Log to Timeline
    await addTimeline(req, request.admissionId, request.patientId, 'Bill Updated',
      `Pharmacy Request #${request.requestNumber} returns verified: ${newStatus}`
    );

    res.status(200).json({ message: `Returns verified as ${newStatus}`, request });
  } catch (error) {
    console.error('Verify Return Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pharmacy issue remaining pending stock after replenishment
// @route   POST /api/pharmacy/requests/:id/issue-remaining
// @access  Private
const issueRemainingPending = async (req, res) => {
  try {
    const { items } = req.body; // array of [{ itemName, batch }] to satisfy pending

    const request = await PharmacyRequest.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const allowedStatuses = ['Partially Approved', 'Issued', 'Return Accepted', 'Return Rejected'];
    if (!allowedStatuses.includes(request.status)) {
      return res.status(400).json({ message: 'Remaining quantities can only be issued for Partially Approved, Issued, or Return Verified requests' });
    }

    // Process pending items
    for (const item of request.items) {
      if (item.pendingQty > 0) {
        const itemConfig = items?.find(i => i.itemName.toLowerCase() === item.itemName.toLowerCase());
        const selectedBatch = itemConfig?.batch || item.batch;

        if (!selectedBatch) {
          return res.status(400).json({ message: `No batch selected for pending medicine: ${item.itemName}` });
        }

        const invItem = await PharmacyInventory.findOne({
          hospitalId: req.user.hospitalId,
          itemName: { $regex: new RegExp('^' + item.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          batch: selectedBatch
        });

        if (!invItem) {
          return res.status(400).json({ message: `No inventory stock batch found for ${item.itemName} (Batch: ${selectedBatch})` });
        }

        if (invItem.quantity < item.pendingQty) {
          return res.status(400).json({
            message: `Insufficient replenished stock for ${item.itemName}. Available: ${invItem.quantity}, Pending: ${item.pendingQty}`
          });
        }

        // Deduct inventory
        invItem.quantity -= item.pendingQty;
        invItem.amount = invItem.rate * invItem.quantity;
        await invItem.save();

        // Update request item stats
        item.batch = selectedBatch;
        item.approvedQty += item.pendingQty;
        item.issuedQty += item.pendingQty;
        item.pendingQty = 0;
      }
    }

    request.status = 'Remaining Items Issued';
    request.auditTrail.push({
      status: 'Remaining Items Issued',
      action: 'Remaining Items Issued',
      performedBy: req.user._id,
      performedByName: req.user.doctorName || req.user.username || 'Pharmacist',
      timestamp: new Date(),
      remarks: 'Replenished pending stock issued to doctor/department.'
    });

    await request.save();

    // Log to Timeline
    await addTimeline(req, request.admissionId, request.patientId, 'Service Added',
      `Pharmacy Request #${request.requestNumber} remaining pending items issued`
    );

    res.status(200).json({ message: 'Remaining pending items issued successfully', request });
  } catch (error) {
    console.error('Issue Remaining Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pharmacy complete request & post billing summary
// @route   POST /api/pharmacy/requests/:id/complete
// @access  Private
const completeRequest = async (req, res) => {
  try {
    const request = await PharmacyRequest.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const lockStates = ['Issued', 'Return Accepted', 'Return Rejected', 'Remaining Items Issued'];
    if (!lockStates.includes(request.status)) {
      return res.status(400).json({ message: 'Request must have recorded consumption and verified returns before completion' });
    }

    request.status = 'Completed';
    request.auditTrail.push({
      status: 'Completed',
      action: 'Request Completed',
      performedBy: req.user._id,
      performedByName: req.user.doctorName || req.user.username || 'Pharmacist',
      timestamp: new Date(),
      remarks: 'Request fully completed. Inventory lock applied. Billing entries posted.'
    });

    await request.save();

    // Post billing entries
    await autoPostToBilling(req, request);

    // Timeline Log
    await addTimeline(req, request.admissionId, request.patientId, 'OT Record Completed',
      `Pharmacy Request #${request.requestNumber} marked as COMPLETED and locked`
    );

    res.status(200).json({ message: 'Request completed and billing entries generated', request });
  } catch (error) {
    console.error('Complete Request Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to auto-post medicine consumption to IPD Patient billing
const autoPostToBilling = async (req, request) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  for (const item of request.items) {
    const consumedQty = item.usedQty + item.damagedQty; // items used or wasted are billable
    if (consumedQty > 0) {
      // Find prices from inventory batch
      const invItem = await PharmacyInventory.findOne({
        hospitalId: request.hospitalId,
        itemName: { $regex: new RegExp('^' + item.itemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        batch: item.batch
      });

      const unitPrice = invItem ? invItem.mrp : 0;
      const gst = invItem ? (invItem.sgst + invItem.cst) : 0;
      const basePrice = invItem ? invItem.rate : 0;
      const totalAmount = consumedQty * unitPrice;

      // Auto-create IPD billing entry
      await IpdMedicine.create({
        hospitalId: request.hospitalId,
        admissionId: request.admissionId,
        patientId: request.patientId,
        medicineName: item.itemName,
        quantity: consumedQty,
        unitPrice,
        gst,
        baseUnitPrice: basePrice,
        totalAmount,
        date: dateStr,
        time: timeStr,
        addedBy: request.doctorId
      });

      // Timeline entry for each billed item
      await addTimeline(req, request.admissionId, request.patientId, 'Medicine Added',
        `Procedure Medicine Billed: ${item.itemName} x ${consumedQty} = ₹${totalAmount}`
      );
    }
  }
};

module.exports = {
  getRequests,
  getRequestDetails,
  createRequest,
  reviewRequest,
  issueRequest,
  recordConsumption,
  verifyReturn,
  issueRemainingPending,
  completeRequest
};
