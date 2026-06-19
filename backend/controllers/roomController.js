const Room = require('../models/Room');
const Bed = require('../models/Bed');
const IpdAdminSettings = require('../models/IpdAdminSettings');

// Helper to filter queries by hospitalId for multi-tenant isolation
const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helpers to generate prefixes for bed numbers
const getRoomPrefix = (roomType) => {
  const clean = roomType.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean.substring(0, 3).padEnd(3, 'R');
};

const getBedPrefix = (bedType) => {
  const clean = bedType.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();
  const words = clean.split(' ').filter(Boolean);
  if (words.length > 0) {
    const firstWord = words[0];
    if (['SINGLE', 'DOUBLE', 'TRIPLE', 'ICU', 'VENTILATOR'].includes(firstWord)) {
      return firstWord[0];
    }
  }
  return clean[0] || 'B';
};

const generateUniqueBedNumbers = (existingBedNumbers, roomPrefix, bedPrefix, count) => {
  const usedNumbers = new Set(existingBedNumbers);
  let maxIndex = 0;

  existingBedNumbers.forEach((bedNumber) => {
    const parts = bedNumber.split('-');
    const idx = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(idx) && idx > maxIndex) {
      maxIndex = idx;
    }
  });

  const generated = [];
  let nextIndex = maxIndex + 1;

  while (generated.length < count) {
    const bedNumber = `${roomPrefix}-${bedPrefix}-${String(nextIndex).padStart(3, '0')}`;
    if (!usedNumbers.has(bedNumber)) {
      usedNumbers.add(bedNumber);
      generated.push(bedNumber);
    }
    nextIndex += 1;
  }

  return generated;
};

// Lazy cleanup helper for expired bed reservations
const lazyCleanupReservations = async (hospitalId) => {
  if (!hospitalId) return;
  try {
    const settings = await IpdAdminSettings.findOne({ hospitalId });
    const timeoutMins = settings ? settings.reservationTimeout : 15;
    const cutoffTime = new Date(Date.now() - timeoutMins * 60 * 1000);

    // Release expired reservations
    await Bed.updateMany({
      hospitalId,
      status: 'Reserved',
      reservedAt: { $lt: cutoffTime }
    }, {
      $set: {
        status: 'Available',
        reservedAt: null,
        reservedFor: null
      }
    });
  } catch (err) {
    console.error('Lazy reservation cleanup failed:', err.message);
  }
};

// @desc    Get all rooms with total/available/occupied beds count
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
  try {
    if (req.user.hospitalId) {
      await lazyCleanupReservations(req.user.hospitalId);
    }

    const rooms = await Room.find(tenantFilter(req)).sort({ createdAt: -1 });
    
    // Fetch stats for each room
    const roomsWithStats = await Promise.all(rooms.map(async (room) => {
      const beds = await Bed.find({ roomId: room._id });
      
      const totalBeds = beds.length;
      const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
      const availableBeds = beds.filter(b => b.status === 'Available').length;
      const reservedBeds = beds.filter(b => b.status === 'Reserved').length;
      const maintenanceBeds = beds.filter(b => b.status === 'Maintenance').length;
      
      // Calculate price range
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      beds.forEach(b => {
        if (b.pricePerDay < minPrice) minPrice = b.pricePerDay;
        if (b.pricePerDay > maxPrice) maxPrice = b.pricePerDay;
      });
      
      const priceRange = minPrice === Infinity 
        ? 'N/A' 
        : (minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`);

      const bedTypesList = room.bedConfigurations.map(config => `${config.bedType} (${config.numberOfBeds})`).join(', ');

      return {
        _id: room._id,
        roomType: room.roomType,
        description: room.description || '',
        totalBeds: room.totalBeds,
        availableBeds,
        occupiedBeds,
        reservedBeds,
        maintenanceBeds,
        bedTypes: bedTypesList,
        priceRange,
        status: availableBeds > 0 ? 'Available' : 'Full',
        bedConfigurations: room.bedConfigurations
      };
    }));

    res.status(200).json(roomsWithStats);
  } catch (error) {
    console.error('Get Rooms Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create room configuration and generate beds
// @route   POST /api/rooms
// @access  Private/Admin
const createRoom = async (req, res) => {
  try {
    const { roomType, totalBeds, bedConfigurations, description } = req.body;

    if (!roomType || !totalBeds || !bedConfigurations || !Array.isArray(bedConfigurations)) {
      return res.status(400).json({ message: 'Room type, total beds and configurations are required' });
    }

    if (Number(totalBeds) <= 0) {
      return res.status(400).json({ message: 'Total beds must be greater than 0' });
    }

    // Validate total beds = sum of configuration beds
    const configSum = bedConfigurations.reduce((acc, curr) => acc + Number(curr.numberOfBeds), 0);
    if (configSum !== Number(totalBeds)) {
      return res.status(400).json({ message: 'Total configured beds must match Total Beds.' });
    }

    // Check for duplicate room type
    const roomExists = await Room.findOne(tenantFilter(req, { roomType: { $regex: new RegExp(`^${roomType}$`, 'i') } }));
    if (roomExists) {
      return res.status(400).json({ message: `Room type configuration for "${roomType}" already exists.` });
    }

    const newRoom = new Room({
      hospitalId: req.user.hospitalId,
      roomType,
      description: description || '',
      totalBeds,
      bedConfigurations
    });

    const savedRoom = await newRoom.save();

    // Generate bed records
    const roomPrefix = getRoomPrefix(roomType);
    const generatedBeds = [];

    for (const config of bedConfigurations) {
      const customBedCodes = config.bedCodes && config.bedCodes.filter(c => c && c.trim());
      
      if (customBedCodes.length > 0) {
        // Use custom bed codes provided by admin
        customBedCodes.forEach((customCode, index) => {
          const price = config.applySamePrice 
            ? config.pricePerDay 
            : (config.individualPrices && config.individualPrices[index] !== undefined ? config.individualPrices[index] : config.pricePerDay);

          generatedBeds.push({
            hospitalId: req.user.hospitalId,
            roomId: savedRoom._id,
            bedNumber: customCode.trim(),
            bedType: config.bedType,
            pricePerDay: price,
            status: 'Available'
          });
        });
      } else {
        // Auto-generate bed numbers
        const bedPrefix = getBedPrefix(config.bedType);
        const existingBeds = await Bed.find(tenantFilter(req, {
          bedNumber: { $regex: new RegExp(`^${roomPrefix}-${bedPrefix}-`) }
        })).select('bedNumber');

        const existingBedNumbers = existingBeds.map((b) => b.bedNumber);
        const bedNumbers = generateUniqueBedNumbers(existingBedNumbers, roomPrefix, bedPrefix, Number(config.numberOfBeds));

        bedNumbers.forEach((bedNumber, index) => {
          const price = config.applySamePrice 
            ? config.pricePerDay 
            : (config.individualPrices && config.individualPrices[index] !== undefined ? config.individualPrices[index] : config.pricePerDay);

          generatedBeds.push({
            hospitalId: req.user.hospitalId,
            roomId: savedRoom._id,
            bedNumber,
            bedType: config.bedType,
            pricePerDay: price,
            status: 'Available'
          });
        });
      }
    }

    if (generatedBeds.length === 0) {
      return res.status(400).json({ message: 'No new beds could be generated. Please verify the bed configuration.' });
    }

    await Bed.insertMany(generatedBeds);

    res.status(201).json({ message: 'Room configuration and beds created successfully', room: savedRoom });
  } catch (error) {
    console.error('Create Room Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update room configuration and synchronize beds
// @route   PUT /api/rooms/:id
// @access  Private/Admin
const updateRoom = async (req, res) => {
  try {
    const { roomType, totalBeds, bedConfigurations, description } = req.body;

    if (!roomType || !totalBeds || !bedConfigurations || !Array.isArray(bedConfigurations)) {
      return res.status(400).json({ message: 'Room type, total beds and configurations are required' });
    }

    if (Number(totalBeds) <= 0) {
      return res.status(400).json({ message: 'Total beds must be greater than 0' });
    }

    // Validate total beds = sum of configurations
    const configSum = bedConfigurations.reduce((acc, curr) => acc + Number(curr.numberOfBeds), 0);
    if (configSum !== Number(totalBeds)) {
      return res.status(400).json({ message: 'Total configured beds must match Total Beds.' });
    }

    const room = await Room.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!room) {
      return res.status(404).json({ message: 'Room configuration not found.' });
    }

    // Check duplicate room type name (if name changed)
    if (room.roomType.toLowerCase() !== roomType.toLowerCase()) {
      const duplicate = await Room.findOne(tenantFilter(req, { 
        _id: { $ne: room._id },
        roomType: { $regex: new RegExp(`^${roomType}$`, 'i') } 
      }));
      if (duplicate) {
        return res.status(400).json({ message: `Room type "${roomType}" already exists.` });
      }
    }

    // Load all current beds for this room
    const existingBeds = await Bed.find(tenantFilter(req, { roomId: room._id }));

    // Verify removed bed configurations
    const newBedTypes = bedConfigurations.map(c => c.bedType);
    const existingBedTypes = [...new Set(existingBeds.map(b => b.bedType))];
    
    for (const oldType of existingBedTypes) {
      if (!newBedTypes.includes(oldType)) {
        // Bed type is completely removed. Check if any beds of this type are occupied.
        const occupied = existingBeds.filter(b => b.bedType === oldType && b.status === 'Occupied');
        if (occupied.length > 0) {
          return res.status(400).json({ 
            message: `Cannot remove bed type "${oldType}" because some beds of this type are currently occupied by patients.` 
          });
        }
      }
    }

    // Prepare arrays for operations
    const bedsToDelete = [];
    const bedsToCreate = [];
    const bedsToUpdate = [];

    const roomPrefix = getRoomPrefix(roomType);

    // Sync each configuration
    for (const config of bedConfigurations) {
      const { bedType, numberOfBeds, pricePerDay, applySamePrice, individualPrices, bedCodes } = config;
      const currentBeds = existingBeds.filter(b => b.bedType === bedType);
      const customBedCodes = bedCodes && bedCodes.filter(c => c && c.trim());

      if (numberOfBeds > currentBeds.length) {
        // Increment bed count: keep existing, add new ones
        
        // Determine how many new beds to add
        const diff = Number(numberOfBeds) - currentBeds.length;

        // Update existing beds prices first
        currentBeds.forEach((bed, index) => {
          const price = applySamePrice 
            ? pricePerDay 
            : (individualPrices && individualPrices[index] !== undefined ? individualPrices[index] : pricePerDay);
          
          bedsToUpdate.push({
            _id: bed._id,
            bedNumber: bed.bedNumber,
            pricePerDay: price
          });
        });

        if (customBedCodes && customBedCodes.length >= diff) {
          // Use custom bed codes for new beds
          const existingCodeSet = new Set(currentBeds.map(b => b.bedNumber));
          const newCodes = customBedCodes.filter(c => !existingCodeSet.has(c.trim())).slice(0, diff);
          
          newCodes.forEach((bedNumber, index) => {
            const price = applySamePrice 
              ? pricePerDay 
              : (individualPrices && individualPrices[currentBeds.length + index] !== undefined 
                  ? individualPrices[currentBeds.length + index] 
                  : pricePerDay);

            bedsToCreate.push({
              hospitalId: req.user.hospitalId,
              roomId: room._id,
              bedNumber: bedNumber.trim(),
              bedType,
              pricePerDay: price,
              status: 'Available'
            });
          });
        } else {
          // Auto-generate bed numbers
          const bedPrefix = getBedPrefix(bedType);
          const hospitalBeds = await Bed.find(tenantFilter(req, {
            bedNumber: { $regex: new RegExp(`^${roomPrefix}-${bedPrefix}-`) }
          })).select('bedNumber');

          const existingBedNumbers = hospitalBeds.map((b) => b.bedNumber);
          const newBedNumbers = generateUniqueBedNumbers(existingBedNumbers, roomPrefix, bedPrefix, diff);

          newBedNumbers.forEach((bedNumber, index) => {
            const price = applySamePrice 
              ? pricePerDay 
              : (individualPrices && individualPrices[currentBeds.length + index] !== undefined 
                  ? individualPrices[currentBeds.length + index] 
                  : pricePerDay);

            bedsToCreate.push({
              hospitalId: req.user.hospitalId,
              roomId: room._id,
              bedNumber,
              bedType,
              pricePerDay: price,
              status: 'Available'
            });
          });
        }

      } else if (numberOfBeds < currentBeds.length) {
        // Decrement bed count: delete excess unoccupied beds
        const diff = currentBeds.length - numberOfBeds;
        const availableBeds = currentBeds.filter(b => b.status === 'Available');

        if (availableBeds.length < diff) {
          return res.status(400).json({
            message: `Cannot reduce count of "${bedType}" from ${currentBeds.length} to ${numberOfBeds} because ${currentBeds.length - availableBeds.length} beds are currently occupied.`
          });
        }

        // Sort available beds by number descending to remove the latest ones
        availableBeds.sort((a, b) => b.bedNumber.localeCompare(a.bedNumber));
        const toRemove = availableBeds.slice(0, diff);
        toRemove.forEach(b => bedsToDelete.push(b._id));

        // Get the beds that remain to update their prices
        const toKeepIds = toRemove.map(b => b._id.toString());
        const remainingBeds = currentBeds.filter(b => !toKeepIds.includes(b._id.toString()));

        remainingBeds.forEach((bed, index) => {
          const price = applySamePrice 
            ? pricePerDay 
            : (individualPrices && individualPrices[index] !== undefined ? individualPrices[index] : pricePerDay);

          bedsToUpdate.push({
            _id: bed._id,
            bedNumber: bed.bedNumber,
            pricePerDay: price
          });
        });

      } else {
        // Bed count is unchanged: just update prices of existing beds
        currentBeds.forEach((bed, index) => {
          const price = applySamePrice 
            ? pricePerDay 
            : (individualPrices && individualPrices[index] !== undefined ? individualPrices[index] : pricePerDay);

          bedsToUpdate.push({
            _id: bed._id,
            bedNumber: bed.bedNumber,
            pricePerDay: price
          });
        });
      }
    }

    // Delete completely removed bed configurations (non-occupied)
    for (const oldType of existingBedTypes) {
      if (!newBedTypes.includes(oldType)) {
        const toDelete = existingBeds.filter(b => b.bedType === oldType);
        toDelete.forEach(b => bedsToDelete.push(b._id));
      }
    }

    // Apply database changes
    // 1. Delete excess beds
    if (bedsToDelete.length > 0) {
      await Bed.deleteMany({ _id: { $in: bedsToDelete } });
    }

    // 2. Create new beds
    if (bedsToCreate.length > 0) {
      await Bed.insertMany(bedsToCreate);
    }

    // 3. Update remaining beds (including adjusting prefix if room type changed)
    for (const updateItem of bedsToUpdate) {
      let updatedBedNumber = updateItem.bedNumber;
      
      // If room type name changed, adjust the room prefix part in the bed number
      if (room.roomType.toLowerCase() !== roomType.toLowerCase()) {
        const oldRoomPrefix = getRoomPrefix(room.roomType);
        if (updatedBedNumber.startsWith(`${oldRoomPrefix}-`)) {
          updatedBedNumber = updatedBedNumber.replace(`${oldRoomPrefix}-`, `${roomPrefix}-`);
        }
      }

      await Bed.findByIdAndUpdate(updateItem._id, {
        bedNumber: updatedBedNumber,
        pricePerDay: updateItem.pricePerDay
      });
    }

    // Update Room Config document
    room.roomType = roomType;
    room.totalBeds = totalBeds;
    room.description = description || '';
    room.bedConfigurations = bedConfigurations;
    await room.save();

    res.status(200).json({ message: 'Room configuration updated successfully', room });
  } catch (error) {
    console.error('Update Room Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete room configuration and associated beds
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!room) {
      return res.status(404).json({ message: 'Room configuration not found.' });
    }

    // Verify if any bed in this room is occupied
    const occupiedBeds = await Bed.find({ roomId: room._id, status: 'Occupied' });
    if (occupiedBeds.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete room configuration. Some beds in this room are currently occupied by patients.' 
      });
    }

    // Delete all beds and then the room
    await Bed.deleteMany({ roomId: room._id });
    await room.deleteOne();

    res.status(200).json({ message: 'Room configuration and associated beds deleted successfully' });
  } catch (error) {
    console.error('Delete Room Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all beds of a roomType populated with occupancy status & price (used in IPD Admission)
// @route   GET /api/rooms/beds
// @access  Private
const getBedsForAdmission = async (req, res) => {
  try {
    const { roomType } = req.query;
    if (!roomType) {
      return res.status(400).json({ message: 'roomType query parameter is required' });
    }

    if (req.user.hospitalId) {
      await lazyCleanupReservations(req.user.hospitalId);
    }

    // Find the room configurations of this type
    const rooms = await Room.find(tenantFilter(req, { roomType }));
    const roomIds = rooms.map(r => r._id);

    // Fetch all beds in these rooms
    const beds = await Bed.find({ roomId: { $in: roomIds } })
      .populate('patientId', 'patientName uhid')
      .sort({ bedNumber: 1 });

    res.status(200).json(beds);
  } catch (error) {
    console.error('Get Beds for Admission Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all beds in the hospital (used in Bed Management)
// @route   GET /api/rooms/all-beds
// @access  Private
const getAllBeds = async (req, res) => {
  try {
    if (req.user.hospitalId) {
      await lazyCleanupReservations(req.user.hospitalId);
    }

    const beds = await Bed.find(tenantFilter(req))
      .populate('roomId', 'roomType')
      .populate('patientId', 'patientName uhid')
      .sort({ bedNumber: 1 });

    res.status(200).json(beds);
  } catch (error) {
    console.error('Get All Beds Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change bed status (Available, Reserved, Maintenance)
// @route   PUT /api/rooms/beds/:bedId/status
// @access  Private/Admin
const updateBedStatus = async (req, res) => {
  try {
    const { bedId } = req.params;
    const { status, reservedFor, maintenanceNotes } = req.body;

    if (!status || !['Available', 'Reserved', 'Maintenance'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const bed = await Bed.findOne(tenantFilter(req, { _id: bedId }));
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({ message: 'Occupied beds cannot change status directly. Please discharge the patient first.' });
    }

    bed.status = status;
    if (status === 'Reserved') {
      bed.reservedAt = new Date();
      bed.reservedFor = reservedFor || 'Reserved Patient';
      bed.maintenanceNotes = '';
    } else if (status === 'Maintenance') {
      bed.reservedAt = null;
      bed.reservedFor = null;
      bed.maintenanceNotes = maintenanceNotes || 'Maintenance mode';
    } else {
      // Available
      bed.reservedAt = null;
      bed.reservedFor = null;
      bed.maintenanceNotes = '';
    }

    await bed.save();
    res.status(200).json({ message: 'Bed status updated successfully', bed });
  } catch (error) {
    console.error('Update Bed Status Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getBedsForAdmission,
  getAllBeds,
  updateBedStatus
};
