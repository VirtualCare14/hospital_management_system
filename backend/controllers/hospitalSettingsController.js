const HospitalSettings = require('../models/HospitalSettings');
const { v2: cloudinary } = require('cloudinary');
const asyncHandler = require('../utils/asyncHandler');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df3dcum5n',
  api_key: process.env.CLOUDINARY_API_KEY || '772968243941522',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hnOybQ01s3e3AfYAmm3fBjF2TPk'
});

// @desc    Get hospital settings
// @route   GET /api/admin/hospital-settings
// @access  Private/Admin
const getHospitalSettings = asyncHandler(async (req, res) => {
  try {
    // Check if settings exist for this hospital
    let settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    
    if (!settings) {
      // Return empty settings if none exist
      return res.status(200).json({
        exists: false,
        data: null
      });
    }
    
    res.status(200).json({
      exists: true,
      data: settings
    });
  } catch (error) {
    console.error('Get Hospital Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create or update hospital settings
// @route   POST /api/admin/hospital-settings
// @access  Private/Admin
const createOrUpdateHospitalSettings = asyncHandler(async (req, res) => {
  try {
    const { 
      hospitalName, mobileNumbers, address, hospitalHeading, logoUrl, logoPublicId,
      alternateMobileNumber, emailAddress, website, gstNumber, panNumber, registrationNumber, invoiceFooterMessage,
      invoicePrefix, invoiceCounter, invoiceFormat,
      gstEnabled, gstPercentage, gstRules,
      discountEnabled, discountReasons,
      discountPercentage, discountFixedAmount, patientSpecificDiscounts,
      sdtPricingInBilling
    } = req.body;
    
    // Validate required fields
    if (!hospitalName || !mobileNumbers || !Array.isArray(mobileNumbers) || mobileNumbers.length === 0 || !address) {
      return res.status(400).json({ 
        message: 'Hospital name, at least one mobile number, and address are required' 
      });
    }
    
    // Check if settings already exist for this hospital
    let settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId });
    
    // Handle logo upload if new logo is provided
    let newLogoData = null;
    if (logoUrl && logoPublicId) {
      newLogoData = { url: logoUrl, publicId: logoPublicId };
    }
    
    const settingsData = {
      hospitalName,
      mobileNumbers,
      address,
      hospitalHeading: hospitalHeading || '',
      logoUrl: newLogoData ? newLogoData.url : (settings ? settings.logoUrl : ''),
      logoPublicId: newLogoData ? newLogoData.publicId : (settings ? settings.logoPublicId : ''),
      alternateMobileNumber: alternateMobileNumber || '',
      emailAddress: emailAddress || '',
      website: website || '',
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      registrationNumber: registrationNumber || '',
      invoiceFooterMessage: invoiceFooterMessage || '',
      invoicePrefix: invoicePrefix || 'HOSP-INV-2026-',
      invoiceCounter: invoiceCounter !== undefined ? Number(invoiceCounter) : 1,
      invoiceFormat: invoiceFormat || '{PREFIX}{COUNTER}',
      gstEnabled: gstEnabled !== undefined ? Boolean(gstEnabled) : true,
      gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : 18,
      gstRules: gstRules || '',
      discountEnabled: discountEnabled !== undefined ? Boolean(discountEnabled) : true,
      discountReasons: discountReasons || ['General Discount', 'Staff Discount', 'EWS Discount', 'Emergency Discount'],
      discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : 0,
      discountFixedAmount: discountFixedAmount !== undefined ? Number(discountFixedAmount) : 0,
      patientSpecificDiscounts: patientSpecificDiscounts || 'Staff:10,EWS:100',
      sdtPricingInBilling: sdtPricingInBilling !== undefined ? Boolean(sdtPricingInBilling) : true
    };

    if (settings) {
      // Generate audit logs for modifications to GST and Discounts
      const auditLogs = [];
      const fieldsToCheck = [
        { key: 'discountEnabled', label: 'Discount Active Status' },
        { key: 'discountPercentage', label: 'Standard Discount Percentage' },
        { key: 'discountFixedAmount', label: 'Standard Discount Fixed Amount' },
        { key: 'patientSpecificDiscounts', label: 'Patient Specific Discount Rules' },
        { key: 'gstEnabled', label: 'GST Active Status' },
        { key: 'gstPercentage', label: 'GST Percentage Rate' }
      ];

      fieldsToCheck.forEach(field => {
        const reqValue = settingsData[field.key];
        if (reqValue !== undefined && settings[field.key] !== undefined) {
          const oldStr = String(settings[field.key]);
          const newStr = String(reqValue);
          if (oldStr !== newStr) {
            auditLogs.push({
              fieldChanged: field.label,
              oldValue: oldStr,
              newValue: newStr,
              performedBy: req.user._id,
              performedByName: req.user.username || 'Admin'
            });
          }
        }
      });

      if (auditLogs.length > 0) {
        settingsData.$push = { settingsAuditTrail: { $each: auditLogs } };
      }

      // Update existing settings
      settings = await HospitalSettings.findByIdAndUpdate(
        settings._id,
        settingsData,
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        message: 'Hospital settings updated successfully',
        exists: true,
        data: settings
      });
    } else {
      // Create new settings
      const newSettings = new HospitalSettings({
        hospitalId: req.user.hospitalId,
        ...settingsData
      });
      
      await newSettings.save();
      
      res.status(201).json({
        message: 'Hospital settings created successfully',
        exists: true,
        data: newSettings
      });
    }
  } catch (error) {
    console.error('Create/Update Hospital Settings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Upload logo to Cloudinary
// @route   POST /api/admin/hospital-settings/upload-logo
// @access  Private/Admin
const uploadLogo = asyncHandler(async (req, res) => {
  try {
    const { imageData, folder = 'hms/hospital-settings' } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    
    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(imageData, {
      folder,
      resource_type: 'image',
      transformation: {
        width: 200,
        height: 200,
        crop: 'limit'
      }
    });
    
    res.status(200).json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id
    });
  } catch (error) {
    console.error('Logo Upload Error:', error);
    res.status(500).json({ message: error.message || 'Logo upload failed' });
  }
});

// @desc    Delete logo from Cloudinary
// @route   DELETE /api/admin/hospital-settings/delete-logo
// @access  Private/Admin
const deleteLogo = asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    
    res.status(200).json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Logo Delete Error:', error);
    res.status(500).json({ message: error.message || 'Logo deletion failed' });
  }
});

module.exports = {
  getHospitalSettings,
  createOrUpdateHospitalSettings,
  uploadLogo,
  deleteLogo
};
