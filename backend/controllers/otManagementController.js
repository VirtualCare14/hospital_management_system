const OperationTheatre = require('../models/OperationTheatre');
const OtBooking = require('../models/OtBooking');
const OtDocument = require('../models/OtDocument');
const IpdOtRecord = require('../models/IpdOtRecord');
const IpdAdmission = require('../models/IpdAdmission');
const Patient = require('../models/Patient');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL || 'cloudinary://772968243941522:hnOybQ01s3e3AfYAmm3fBjF2TPk@df3dcum5n',
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df3dcum5n',
  api_key: process.env.CLOUDINARY_API_KEY || '772968243941522',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hnOybQ01s3e3AfYAmm3fBjF2TPk'
});

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helper to generate OT code
const generateOtCode = async (hospitalId) => {
  const lastOt = await OperationTheatre.findOne({ hospitalId }).sort({ createdAt: -1 });
  const lastNum = lastOt ? parseInt(lastOt.otCode.replace('OT-', '')) || 0 : 0;
  return `OT-${String(lastNum + 1).padStart(3, '0')}`;
};

// Helper to check time overlap
const checkTimeOverlap = async (otId, surgeryDate, startTime, endTime, excludeBookingId) => {
  const query = {
    otId,
    surgeryDate: new Date(surgeryDate).setHours(0, 0, 0, 0),
    status: { $ne: 'Cancelled' },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  
  // Compare times as strings in HH:MM format
  const bookings = await OtBooking.find({
    otId,
    surgeryDate: {
      $gte: new Date(new Date(surgeryDate).setHours(0, 0, 0, 0)),
      $lte: new Date(new Date(surgeryDate).setHours(23, 59, 59, 999))
    },
    status: { $ne: 'Cancelled' }
  });

  if (excludeBookingId) {
    return bookings.some(b => 
      b._id.toString() !== excludeBookingId &&
      b.startTime < endTime && 
      b.endTime > startTime
    );
  }
  return bookings.some(b => b.startTime < endTime && b.endTime > startTime);
};

// ==================== OPERATION THEATRE CRUD ====================

const createOt = async (req, res) => {
  try {
    const { otName, description, location } = req.body;
    if (!otName) return res.status(400).json({ message: 'OT Name is required' });

    const otCode = await generateOtCode(req.user.hospitalId);
    const ot = new OperationTheatre({
      hospitalId: req.user.hospitalId,
      otCode,
      otName,
      description: description || '',
      location: location || '',
      status: 'Active',
      availabilityStatus: 'Available'
    });
    await ot.save();
    res.status(201).json({ message: 'Operation theatre created', ot });
  } catch (error) {
    console.error('Create OT Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOt = async (req, res) => {
  try {
    const { id } = req.params;
    const { otName, description, location, status } = req.body;
    const ot = await OperationTheatre.findOne(tenantFilter(req, { _id: id }));
    if (!ot) return res.status(404).json({ message: 'Operation theatre not found' });

    if (otName) ot.otName = otName;
    if (description !== undefined) ot.description = description;
    if (location !== undefined) ot.location = location;
    if (status) ot.status = status;

    await ot.save();
    res.json({ message: 'Operation theatre updated', ot });
  } catch (error) {
    console.error('Update OT Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteOt = async (req, res) => {
  try {
    const { id } = req.params;
    // Check for future bookings
    const futureBooking = await OtBooking.findOne({
      otId: id,
      surgeryDate: { $gte: new Date() },
      status: { $ne: 'Cancelled' }
    });
    if (futureBooking) {
      return res.status(400).json({ message: 'Cannot delete OT with future bookings. Cancel bookings first.' });
    }
    await OperationTheatre.findOneAndDelete(tenantFilter(req, { _id: id }));
    res.json({ message: 'Operation theatre deleted' });
  } catch (error) {
    console.error('Delete OT Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getOts = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = tenantFilter(req);
    if (search) {
      query.$or = [
        { otCode: { $regex: search, $options: 'i' } },
        { otName: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;

    const ots = await OperationTheatre.find(query).sort({ createdAt: -1 });

    // Get booking counts for each OT
    const otsWithCounts = await Promise.all(ots.map(async (ot) => {
      const totalBookings = await OtBooking.countDocuments({ otId: ot._id });
      return { ...ot.toObject(), totalBookings };
    }));

    res.json(otsWithCounts);
  } catch (error) {
    console.error('Get OTs Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailableOts = async (req, res) => {
  try {
    const { date, startTime, endTime, excludeBookingId } = req.query;
    let query = tenantFilter(req, { status: 'Active', availabilityStatus: { $ne: 'Maintenance' } });
    
    let ots = await OperationTheatre.find(query).sort({ otCode: 1 });

    if (date && startTime && endTime) {
      // Filter out OTs with overlapping bookings
      const availableOts = [];
      for (const ot of ots) {
        const hasOverlap = await checkTimeOverlap(ot._id, date, startTime, endTime, excludeBookingId);
        if (!hasOverlap) availableOts.push(ot);
      }
      return res.json(availableOts);
    }

    res.json(ots);
  } catch (error) {
    console.error('Get Available OTs Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOtAvailabilityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilityStatus } = req.body;
    const ot = await OperationTheatre.findOne(tenantFilter(req, { _id: id }));
    if (!ot) return res.status(404).json({ message: 'OT not found' });
    ot.availabilityStatus = availabilityStatus;
    await ot.save();
    res.json({ message: 'Availability status updated', ot });
  } catch (error) {
    console.error('Update OT Availability Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== OT BOOKING ====================

const createOtBooking = async (req, res) => {
  try {
    const { otId, admissionId, patientId, otRecordId, surgeryDate, startTime, endTime } = req.body;

    if (!otId || !admissionId || !patientId || !surgeryDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'All booking fields are required' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be greater than start time' });
    }

    // Check overlap
    const hasOverlap = await checkTimeOverlap(otId, surgeryDate, startTime, endTime);
    if (hasOverlap) {
      return res.status(400).json({ message: 'This OT is already booked for the selected time slot' });
    }

    const booking = new OtBooking({
      hospitalId: req.user.hospitalId,
      otId,
      admissionId,
      patientId,
      otRecordId: otRecordId || undefined,
      surgeryDate: new Date(surgeryDate),
      startTime,
      endTime,
      status: 'Scheduled',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await booking.save();

    // Update OT availability to Occupied
    await OperationTheatre.findByIdAndUpdate(otId, { availabilityStatus: 'Occupied' });

    res.status(201).json({ message: 'OT booked successfully', booking });
  } catch (error) {
    console.error('Create OT Booking Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOtBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { otId, surgeryDate, startTime, endTime, status } = req.body;

    const booking = await OtBooking.findOne(tenantFilter(req, { _id: id }));
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (startTime && endTime && endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be greater than start time' });
    }

    // Check overlap excluding current booking
    if (otId && surgeryDate && startTime && endTime) {
      const hasOverlap = await checkTimeOverlap(
        otId || booking.otId,
        surgeryDate || booking.surgeryDate,
        startTime || booking.startTime,
        endTime || booking.endTime,
        id
      );
      if (hasOverlap) {
        return res.status(400).json({ message: 'This OT is already booked for the selected time slot' });
      }
    }

    const fields = ['otId', 'surgeryDate', 'startTime', 'endTime', 'status', 'otRecordId'];
    fields.forEach(f => { if (req.body[f] !== undefined) booking[f] = req.body[f]; });
    booking.updatedBy = req.user._id;
    await booking.save();

    // Update OT availability based on status
    if (status === 'Cancelled') {
      const activeBookings = await OtBooking.countDocuments({
        otId: booking.otId,
        status: { $in: ['Scheduled', 'In Progress'] }
      });
      if (activeBookings === 0) {
        await OperationTheatre.findByIdAndUpdate(booking.otId, { availabilityStatus: 'Available' });
      }
    }

    res.json({ message: 'Booking updated', booking });
  } catch (error) {
    console.error('Update OT Booking Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getOtBookings = async (req, res) => {
  try {
    const { otId, date, status } = req.query;
    let query = tenantFilter(req);
    if (otId) query.otId = otId;
    if (date) {
      const d = new Date(date);
      query.surgeryDate = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (status) query.status = status;

    const bookings = await OtBooking.find(query)
      .populate('otId', 'otCode otName')
      .populate('patientId', 'patientName uhid')
      .populate('admissionId', 'ipdNumber pidNumber')
      .populate('otRecordId', 'surgeon proceduresPerformed')
      .populate('createdBy', 'username doctorName')
      .sort({ surgeryDate: -1, startTime: 1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get OT Bookings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getOtBookingsByAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const bookings = await OtBooking.find(tenantFilter(req, { admissionId }))
      .populate('otId', 'otCode otName')
      .populate('patientId', 'patientName uhid')
      .sort({ surgeryDate: -1, startTime: 1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get Admission OT Bookings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== OT DASHBOARD ====================

const getOtDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;
    const filter = hospitalId ? { hospitalId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalOTs = await OperationTheatre.countDocuments({ ...filter, status: 'Active' });
    const availableOTs = await OperationTheatre.countDocuments({ ...filter, status: 'Active', availabilityStatus: 'Available' });
    const occupiedOTs = await OperationTheatre.countDocuments({ ...filter, status: 'Active', availabilityStatus: 'Occupied' });
    const todaysSurgeries = await OtBooking.countDocuments({
      ...filter,
      surgeryDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'Cancelled' }
    });
    const upcomingSurgeries = await OtBooking.countDocuments({
      ...filter,
      surgeryDate: { $gt: tomorrow },
      status: { $ne: 'Cancelled' }
    });
    const completedSurgeries = await OtBooking.countDocuments({
      ...filter,
      status: 'Completed'
    });

    res.json({
      totalOTs,
      availableOTs,
      occupiedOTs,
      todaysSurgeries,
      upcomingSurgeries,
      completedSurgeries
    });
  } catch (error) {
    console.error('OT Dashboard Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== OT DOCUMENTS (Cloudinary) ====================

const uploadOtDocument = async (req, res) => {
  try {
    const { otRecordId, admissionId, patientId, documentType } = req.body;
    
    if (!req.file && !req.body.fileData) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (!otRecordId || !admissionId || !patientId || !documentType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let fileUrl, publicId, fileType;

    if (req.file) {
      // Multer file upload
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `hospital_${req.user.hospitalId}/ot_documents`,
        resource_type: 'auto'
      });
      fileUrl = result.secure_url;
      publicId = result.public_id;
      fileType = result.resource_type;
    } else {
      // Base64 data upload
      const result = await cloudinary.uploader.upload(req.body.fileData, {
        folder: `hospital_${req.user.hospitalId}/ot_documents`,
        resource_type: 'auto'
      });
      fileUrl = result.secure_url;
      publicId = result.public_id;
      fileType = result.resource_type;
    }

    const doc = new OtDocument({
      hospitalId: req.user.hospitalId,
      admissionId,
      patientId,
      otRecordId,
      documentType,
      fileName: req.body.fileName || `ot_${documentType}_${Date.now()}`,
      fileUrl,
      cloudinaryPublicId: publicId,
      fileType,
      uploadedBy: req.user._id
    });

    await doc.save();
    res.status(201).json({ message: 'Document uploaded successfully', document: doc });
  } catch (error) {
    console.error('Upload OT Document Error:', error);
    res.status(500).json({ message: 'Failed to upload document' });
  }
};

const getOtDocuments = async (req, res) => {
  try {
    const { otRecordId } = req.params;
    const docs = await OtDocument.find(tenantFilter(req, { otRecordId }))
      .populate('uploadedBy', 'username doctorName')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Get OT Documents Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteOtDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await OtDocument.findOne(tenantFilter(req, { _id: id }));
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(doc.cloudinaryPublicId, { resource_type: doc.fileType || 'image' });
    }
    await OtDocument.findOneAndDelete({ _id: id });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete OT Document Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== AUTO COMPLETE BOOKINGS (Cron-like check) ====================

const autoCompleteOverdueBookings = async (req, res) => {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Find bookings where endTime has passed and status is Scheduled/In Progress
    const overdueBookings = await OtBooking.find({
      surgeryDate: { $lte: now },
      status: { $in: ['Scheduled', 'In Progress'] }
    });

    for (const booking of overdueBookings) {
      if (booking.endTime <= currentTime || new Date(booking.surgeryDate).toDateString() < now.toDateString()) {
        booking.status = 'Completed';
        booking.updatedBy = req.user?._id || booking.createdBy;
        await booking.save();

        // Update linked OT record status/history if present
        if (booking.otRecordId) {
          try {
            const record = await IpdOtRecord.findById(booking.otRecordId);
            if (record) {
              record.schedulingStatus = 'Completed';
              record.schedulingHistory = record.schedulingHistory || [];
              record.schedulingHistory.push({ action: 'Auto Completed', by: req.user?._id || booking.createdBy, at: new Date(), notes: 'Booking auto-completed by system' });
              record.updatedBy = req.user?._id || booking.createdBy;
              await record.save();
            }
          } catch (recErr) {
            console.warn('Failed updating OT record after auto-complete', recErr);
          }
        }

        // Check if OT has no more active bookings
        const activeBookings = await OtBooking.countDocuments({
          otId: booking.otId,
          status: { $in: ['Scheduled', 'In Progress'] }
        });
        if (activeBookings === 0) {
          await OperationTheatre.findByIdAndUpdate(booking.otId, { availabilityStatus: 'Available' });
        }
      }
    }

    res.json({ message: `${overdueBookings.length} bookings processed` });
  } catch (error) {
    console.error('Auto Complete Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Schedule OT with documents for an OT Record
// @route   POST /api/ipd/ot/:otRecordId/schedule
// @access  Private
const scheduleOtWithDocuments = async (req, res) => {
  try {
    const { otRecordId } = req.params;
    const { otId, surgeryDate, startTime, endTime, documentFiles } = req.body;

    if (!otId || !surgeryDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'OT, date, start time, and end time are required' });
    }

    // Get OT record
    const otRecord = await IpdOtRecord.findOne(tenantFilter(req, { _id: otRecordId }));
    if (!otRecord) {
      return res.status(404).json({ message: 'OT record not found' });
    }



    // Check time overlap
    const hasOverlap = await checkTimeOverlap(otId, surgeryDate, startTime, endTime);
    if (hasOverlap) {
      return res.status(400).json({ message: 'This OT is already booked for the selected time slot' });
    }

    // Create booking
    const booking = new OtBooking({
      hospitalId: req.user.hospitalId,
      otId,
      admissionId: otRecord.admissionId,
      patientId: otRecord.patientId,
      otRecordId: otRecordId,
      surgeryDate: new Date(surgeryDate),
      startTime,
      endTime,
      status: 'Scheduled',
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    // Process documents if provided
    if (documentFiles && Array.isArray(documentFiles) && documentFiles.length > 0) {
      for (const docData of documentFiles) {
        if (docData.fileData) {
          try {
            const uploaded = await cloudinary.uploader.upload(docData.fileData, {
              folder: `ot_documents/${req.user.hospitalId}`,
              resource_type: 'auto',
              public_id: `ot_${otRecordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });

            booking.otDocuments.push({
              documentType: docData.documentType || 'ot_paper',
              fileName: docData.fileName || uploaded.original_filename,
              fileUrl: uploaded.secure_url,
              cloudinaryPublicId: uploaded.public_id,
              uploadedBy: req.user._id,
              uploadedAt: new Date()
            });

            // Also add to OT record
            otRecord.otDocuments.push({
              documentType: docData.documentType || 'ot_paper',
              fileName: docData.fileName || uploaded.original_filename,
              fileUrl: uploaded.secure_url,
              cloudinaryPublicId: uploaded.public_id,
              uploadedBy: req.user._id,
              uploadedAt: new Date()
            });
          } catch (uploadErr) {
            console.error('Document upload failed:', uploadErr);
            // Continue with booking even if one document fails
          }
        }
      }
    }

    await booking.save();

    // Update OT record with scheduling info (use explicit datetimes)
    const scheduledStart = new Date(`${surgeryDate}T${startTime}`);
    const scheduledEnd = new Date(`${surgeryDate}T${endTime}`);
    otRecord.otScheduling = {
      otId,
      otBookingId: booking._id,
      scheduledStart,
      scheduledEnd,
      scheduledRoom: otId,
      scheduledBy: req.user._id,
      scheduledAt: new Date()
    };
    otRecord.schedulingStatus = 'Scheduled';
    otRecord.schedulingHistory = otRecord.schedulingHistory || [];
    otRecord.schedulingHistory.push({ action: 'Scheduled', by: req.user._id, at: new Date(), notes: `Scheduled in OT ${otId}` });
    otRecord.status = 'Scheduled';
    otRecord.updatedBy = req.user._id;
    await otRecord.save();

    // Update OT availability
    await OperationTheatre.findByIdAndUpdate(otId, { availabilityStatus: 'Occupied' });

    res.status(201).json({
      message: 'OT scheduled successfully with documents',
      booking: await booking.populate([
        { path: 'otId', select: 'otCode otName' },
        { path: 'patientId', select: 'patientName uhid' },
        { path: 'admissionId', select: 'ipdNumber pidNumber' }
      ])
    });
  } catch (error) {
    console.error('Schedule OT Error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Upload documents to existing booking
// @route   POST /api/ipd/ot-management/bookings/:bookingId/documents/upload
// @access  Private
const uploadDocumentsToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { documentFiles } = req.body;

    if (!documentFiles || !Array.isArray(documentFiles) || documentFiles.length === 0) {
      return res.status(400).json({ message: 'Document files are required' });
    }

    const booking = await OtBooking.findOne(tenantFilter(req, { _id: bookingId }));
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const uploadedDocs = [];
    for (const docData of documentFiles) {
      if (docData.fileData) {
        try {
          const uploaded = await cloudinary.uploader.upload(docData.fileData, {
            folder: `ot_documents/${req.user.hospitalId}`,
            resource_type: 'auto',
            public_id: `ot_booking_${bookingId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });

          const doc = {
            documentType: docData.documentType || 'ot_paper',
            fileName: docData.fileName || uploaded.original_filename,
            fileUrl: uploaded.secure_url,
            cloudinaryPublicId: uploaded.public_id,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
          };

          booking.otDocuments.push(doc);
          uploadedDocs.push(doc);

          // Also update OT record
          if (booking.otRecordId) {
            await IpdOtRecord.findByIdAndUpdate(booking.otRecordId, {
              $push: { 'otDocuments': doc },
              updatedBy: req.user._id
            });
          }
        } catch (uploadErr) {
          console.error('Document upload failed:', uploadErr);
        }
      }
    }

    booking.updatedBy = req.user._id;
    await booking.save();

    res.status(201).json({
      message: `${uploadedDocs.length} documents uploaded successfully`,
      documents: uploadedDocs
    });
  } catch (error) {
    console.error('Upload Documents to Booking Error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  createOt, updateOt, deleteOt, getOts, getAvailableOts, updateOtAvailabilityStatus,
  createOtBooking, updateOtBooking, getOtBookings, getOtBookingsByAdmission,
  getOtDashboard,
  uploadOtDocument, getOtDocuments, deleteOtDocument,
  scheduleOtWithDocuments, uploadDocumentsToBooking,
  autoCompleteOverdueBookings
};