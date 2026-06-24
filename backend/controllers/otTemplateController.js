const OtConsultationTemplate = require('../models/OtConsultationTemplate');

// @desc    Get all consultation templates for the hospital
// @route   GET /api/ipd/ot-templates
// @access  Private
const getTemplates = async (req, res) => {
  try {
    const filter = { hospitalId: req.user.hospitalId };
    
    if (req.query.active === 'true') {
      filter.isActive = true;
    }

    const templates = await OtConsultationTemplate.find(filter)
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (error) {
    console.error('Get Templates Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new consultation template
// @route   POST /api/ipd/ot-templates
// @access  Private
const createTemplate = async (req, res) => {
  try {
    const { templateName, templateHeading, content, isActive } = req.body;

    if (!templateName || !templateHeading || !content) {
      return res.status(400).json({ message: 'Template Name, Heading, and Content are required' });
    }

    const template = new OtConsultationTemplate({
      hospitalId: req.user.hospitalId,
      templateName,
      templateHeading,
      content,
      isActive: isActive !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const saved = await template.save();
    res.status(201).json({ message: 'Template created successfully', template: saved });
  } catch (error) {
    console.error('Create Template Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a consultation template
// @route   PUT /api/ipd/ot-templates/:id
// @access  Private
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { templateName, templateHeading, content, isActive } = req.body;

    const template = await OtConsultationTemplate.findOne({ _id: id, hospitalId: req.user.hospitalId });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (templateName !== undefined) template.templateName = templateName;
    if (templateHeading !== undefined) template.templateHeading = templateHeading;
    if (content !== undefined) template.content = content;
    if (isActive !== undefined) template.isActive = isActive;

    template.updatedBy = req.user._id;
    const updated = await template.save();

    res.json({ message: 'Template updated successfully', template: updated });
  } catch (error) {
    console.error('Update Template Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a consultation template
// @route   DELETE /api/ipd/ot-templates/:id
// @access  Private
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await OtConsultationTemplate.findOneAndDelete({ _id: id, hospitalId: req.user.hospitalId });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete Template Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
