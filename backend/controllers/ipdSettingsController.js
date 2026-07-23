const IpdAdminSettings = require('../models/IpdAdminSettings');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Get IPD configuration settings
// @route   GET /api/ipd/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await IpdAdminSettings.findOne(tenantFilter(req));
    
    if (!settings) {
      settings = new IpdAdminSettings({
        hospitalId: req.user.hospitalId,
        ipdPrefix: 'IPD',
        ipdStartNumber: 1,
        ipdCurrentNumber: 1,
        pidPrefix: 'PID',
        pidStartNumber: 1,
        pidCurrentNumber: 1,
        admissionStatuses: ['Admitted', 'Under Observation', 'Shifted', 'Discharged'],
        reservationTimeout: 15,
        sameDayCareCategories: [{
          name: 'Dialysis',
          subServices: [{
            name: 'Dialysis',
            price: 2000,
            isActive: true
          }],
          isActive: true
        }]
      });
      await settings.save();
    } else {
      let hasDialysis = false;
      if (settings.sameDayCareCategories && settings.sameDayCareCategories.length > 0) {
        hasDialysis = settings.sameDayCareCategories.some(c => c.name.toLowerCase() === 'dialysis');
      } else {
        settings.sameDayCareCategories = [];
      }

      if (!hasDialysis) {
        settings.sameDayCareCategories.push({
          name: 'Dialysis',
          subServices: [{
            name: 'Dialysis',
            price: 2000,
            isActive: true
          }],
          isActive: true
        });
        settings.markModified('sameDayCareCategories');
        await settings.save();
      }
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update IPD configuration settings
// @route   PUT /api/ipd/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const { 
      ipdPrefix, 
      ipdStartNumber, 
      pidPrefix, 
      pidStartNumber, 
      admissionStatuses, 
      reservationTimeout,
      consumableServices,
      medicines
    } = req.body;

    let settings = await IpdAdminSettings.findOne(tenantFilter(req));

    if (!settings) {
      settings = new IpdAdminSettings({
        hospitalId: req.user.hospitalId
      });
    }

    if (ipdPrefix !== undefined) settings.ipdPrefix = ipdPrefix.trim();
    if (pidPrefix !== undefined) settings.pidPrefix = pidPrefix.trim();
    
    if (ipdStartNumber !== undefined) {
      const startNum = Number(ipdStartNumber);
      if (isNaN(startNum) || startNum < 1) {
        return res.status(400).json({ message: 'IPD starting number must be a valid number >= 1' });
      }
      if (settings.ipdCurrentNumber < startNum) {
        settings.ipdCurrentNumber = startNum;
      }
      settings.ipdStartNumber = startNum;
    }

    if (pidStartNumber !== undefined) {
      const startNum = Number(pidStartNumber);
      if (isNaN(startNum) || startNum < 1) {
        return res.status(400).json({ message: 'PID starting number must be a valid number >= 1' });
      }
      if (settings.pidCurrentNumber < startNum) {
        settings.pidCurrentNumber = startNum;
      }
      settings.pidStartNumber = startNum;
    }

    if (admissionStatuses !== undefined) {
      if (!Array.isArray(admissionStatuses) || admissionStatuses.length === 0) {
        return res.status(400).json({ message: 'Admission statuses must be a non-empty array' });
      }
      settings.admissionStatuses = admissionStatuses.map(s => s.trim()).filter(Boolean);
    }

    if (reservationTimeout !== undefined) {
      const timeout = Number(reservationTimeout);
      if (isNaN(timeout) || timeout < 1) {
        return res.status(400).json({ message: 'Bed reservation timeout must be a valid number >= 1' });
      }
      settings.reservationTimeout = timeout;
    }

    if (consumableServices !== undefined) {
      if (!Array.isArray(consumableServices)) {
        return res.status(400).json({ message: 'Consumable services must be an array' });
      }
      settings.consumableServices = consumableServices.map(s => ({
        name: s.name.trim(),
        price: Number(s.price),
        gst: Number(s.gst || 0),
        description: s.description || '',
        isActive: s.isActive !== undefined ? s.isActive : true
      }));
      settings.markModified('consumableServices');
    }

    if (medicines !== undefined) {
      if (!Array.isArray(medicines)) {
        return res.status(400).json({ message: 'Medicines must be an array' });
      }
      settings.medicines = medicines.map(m => ({
        name: m.name.trim(),
        totalBoxPrice: Number(m.totalBoxPrice || 0),
        totalUnits: Number(m.totalUnits || 1),
        price: Number(m.price || 0),
        gst: Number(m.gst || 0),
        description: m.description || '',
        isActive: m.isActive !== undefined ? m.isActive : true
      }));
      settings.markModified('medicines');
    }

    if (req.body.sameDayCareCategories !== undefined) {
      if (!Array.isArray(req.body.sameDayCareCategories)) {
        return res.status(400).json({ message: 'Same Day Care categories must be an array' });
      }
      
      const categories = req.body.sameDayCareCategories.map(c => {
        const subServices = Array.isArray(c.subServices) 
          ? c.subServices.map(s => ({
              name: s.name.trim(),
              price: Number(s.price || 0),
              isActive: s.isActive !== undefined ? s.isActive : true,
              investigations: Array.isArray(s.investigations)
                ? s.investigations.map(inv => ({
                    name: inv.name.trim()
                  }))
                : []
            }))
          : [];
        return {
          name: c.name.trim(),
          subServices,
          isActive: c.isActive !== undefined ? c.isActive : true
        };
      });

      // Ensure Dialysis exists and is protected
      let dialysisCat = categories.find(c => c.name.toLowerCase() === 'dialysis');
      if (!dialysisCat) {
        dialysisCat = {
          name: 'Dialysis',
          subServices: [{
            name: 'Dialysis',
            price: 2000,
            isActive: true
          }],
          isActive: true
        };
        categories.push(dialysisCat);
      } else {
        dialysisCat.name = 'Dialysis';
        dialysisCat.isActive = true;
        let dialysisSub = dialysisCat.subServices.find(s => s.name.toLowerCase() === 'dialysis');
        if (!dialysisSub) {
          dialysisSub = {
            name: 'Dialysis',
            price: 2000,
            isActive: true
          };
          dialysisCat.subServices.push(dialysisSub);
        } else {
          dialysisSub.name = 'Dialysis';
          dialysisSub.isActive = true;
        }
      }

      settings.sameDayCareCategories = categories;
      settings.markModified('sameDayCareCategories');
    }

    if (req.body.sameDayTreatmentPrices !== undefined) {
      if (!Array.isArray(req.body.sameDayTreatmentPrices)) {
        return res.status(400).json({ message: 'Treatment prices must be an array' });
      }
      settings.sameDayTreatmentPrices = req.body.sameDayTreatmentPrices.map(p => ({
        name: p.name.trim(),
        price: Number(p.price),
        isActive: p.isActive !== undefined ? p.isActive : true
      }));
      settings.markModified('sameDayTreatmentPrices');
    }

    await settings.save();
    res.status(200).json({ message: 'IPD Admin Settings updated successfully', settings });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};