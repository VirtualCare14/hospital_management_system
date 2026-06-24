import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, CheckCircle, FileText, Clock, User,
  Calendar, CalendarDays, Stethoscope, Syringe, Pill, FlaskRound as Flask,
  FileSignature, ClipboardCheck, Scissors, IndianRupee,
  Printer, Upload, X, Save, Eye, Camera, AlertCircle,
  Building2, RefreshCw, Plus, Send, Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';
import { formatDate } from '../../utils/dateFormat';
import OtSchedulingModal from './OtSchedulingModal';
import TemplateEditor from '../../components/TemplateEditor';

const STEPS = {
  CONSULTATION: 1,
  SCHEDULING: 2,
  CHARGES: 3,
  PHARMACY_REQUEST: 4,
  ACTIVE: 5,
  COMPLETED: 6
};

const IpdOtFlow = () => {
  const { id } = useParams(); // admissionId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otRecord, setOtRecord] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);

  // Consultation template state
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [consultationHeading, setConsultationHeading] = useState('');
  const [consultationContent, setConsultationContent] = useState('');
  const [additionalParagraph1, setAdditionalParagraph1] = useState('');
  const [additionalParagraph2, setAdditionalParagraph2] = useState('');
  const [rawTemplateContent, setRawTemplateContent] = useState('');
  const [surgicalProcedureInput, setSurgicalProcedureInput] = useState('');
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [isEditingConsultation, setIsEditingConsultation] = useState(false);
  const [viewStep, setViewStep] = useState(null);

  // Scheduling
  const [showScheduling, setShowScheduling] = useState(false);

  // Services
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Operative Report
  const [showOperativeReport, setShowOperativeReport] = useState(false);
  const [showPatientConsultModal, setShowPatientConsultModal] = useState(false);

  // Doctor Pharmacy Request
  const [reqMedicines, setReqMedicines] = useState([{ medicineName: '', dosage: '', quantity: 1, unit: 'nos' }]);
  const [reqConsumables, setReqConsumables] = useState([{ consumableName: '', quantity: 1, unit: 'nos' }]);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: admissionData } = await client.get(`/ipd/patients/${id}`);
      setAdmission(admissionData);

      try {
        const { data: hospitalData } = await client.get('/ipd/ot/hospital-info');
        setHospitalInfo(hospitalData);
      } catch (err) { /* ignore */ }

      // Check for existing OT record
      const { data: otRecords } = await client.get(`/ipd/ot/admission/${id}`);
      let currentOtRecord = null;
      if (otRecords && otRecords.length > 0) {
        const latestRecord = otRecords[0];
        const { data: fullRecord } = await client.get(`/ipd/ot/${latestRecord._id}/full`);
        currentOtRecord = fullRecord;
      } else {
        // Auto-create OT record since scheduling is step 1
        const patient = admissionData?.patientId || {};
        const payload = {
          admissionId: id,
          patientId: patient._id || '',
          uhid: patient.uhid || '',
          pidNumber: admissionData?.pidNumber || '',
          ipdNumber: admissionData?.ipdNumber || '',
          patientName: patient.patientName || '',
          gender: patient.gender || '',
          consultantDoctor: admissionData?.doctorInCharge?.doctorName || admissionData?.doctorInCharge?.username || '',
          status: 'Draft'
        };
        if (patient.dob) {
          payload.dateOfBirth = new Date(patient.dob);
          payload.age = Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000));
        }
        if (admissionData?.admissionDate) payload.admissionDate = new Date(admissionData.admissionDate);

        const { data } = await client.post('/ipd/ot', payload);
        const { data: fullRecord } = await client.get(`/ipd/ot/${data.record._id}/full`);
        currentOtRecord = fullRecord;
      }
      
      setOtRecord(currentOtRecord);
      if (currentOtRecord?.consultation?.isConsultationCompleted) {
        setConsultationContent(currentOtRecord.consultation.consultationNotes || '');
        setConsultationHeading(currentOtRecord.consultation.templateHeading || 'OT Consultation Report');
        setSelectedTemplate(currentOtRecord.consultation.templateId || '');
      }
    } catch (err) {
      toast.error('Failed to load patient data');
      navigate('/ipd/patients');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derive patient from admission data when it loads
  const patient = admission?.patientId || {};

  // Determine current step
  const getCurrentStep = () => {
    if (!otRecord) return STEPS.CONSULTATION;
    if (!otRecord.consultation?.isConsultationCompleted) return STEPS.CONSULTATION;
    if (otRecord.schedulingStatus !== 'Scheduled' && otRecord.schedulingStatus !== 'Completed') return STEPS.SCHEDULING;
    if (!otRecord.otCharges || otRecord.otCharges.length === 0) return STEPS.CHARGES;
    if (!otRecord.pharmacyRequestSent) return STEPS.PHARMACY_REQUEST;
    if (otRecord.status === 'Completed' || otRecord.status === 'Completed Surgery' || otRecord.schedulingStatus === 'Completed') return STEPS.COMPLETED;
    return STEPS.ACTIVE;
  };

  const currentStep = getCurrentStep();
  const activeStep = viewStep !== null ? viewStep : currentStep;

  useEffect(() => {
    setViewStep(null);
  }, [currentStep]);

  useEffect(() => {
    if (activeStep === STEPS.SCHEDULING) {
      setShowScheduling(true);
    } else {
      setShowScheduling(false);
    }
  }, [activeStep]);

  // Auto-create OT record if none exists
  const ensureOtRecord = async () => {
    if (otRecord) return otRecord;
    try {
      const patient = admission?.patientId || {};
      const payload = {
        admissionId: id,
        patientId: patient._id || '',
        uhid: patient.uhid || '',
        pidNumber: admission?.pidNumber || '',
        ipdNumber: admission?.ipdNumber || '',
        patientName: patient.patientName || '',
        gender: patient.gender || '',
        consultantDoctor: admission?.doctorInCharge?.doctorName || admission?.doctorInCharge?.username || '',
        status: 'Draft'
      };
      if (patient.dob) {
        payload.dateOfBirth = new Date(patient.dob);
        payload.age = Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000));
      }
      if (admission?.admissionDate) payload.admissionDate = new Date(admission.admissionDate);

      const { data } = await client.post('/ipd/ot', payload);
      const savedRecord = data.record;
      const { data: fullRecord } = await client.get(`/ipd/ot/${savedRecord._id}/full`);
      setOtRecord(fullRecord);
      return fullRecord;
    } catch (err) {
      toast.error('Failed to create OT record');
      return null;
    }
  };

  // Load active templates on mount
  const loadActiveTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const { data } = await client.get('/ipd/ot-templates?active=true');
      setActiveTemplates(data);
    } catch (err) {
      console.error('Failed to load active templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadActiveTemplates();
  }, [loadActiveTemplates]);

  // Parse template variables
  const parseTemplate = (htmlContent, surgicalProc = '', addPara1 = '', addPara2 = '') => {
    if (!htmlContent) return '';
    let parsed = htmlContent;

    const patientAge = patient.dob
      ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))
      : '';

    const replacements = {
      '{Patient Name}': patient.patientName || '',
      '{Age}': patientAge || '',
      '{Sex}': patient.gender || '',
      '{Address}': patient.address || '',
      '{Mobile Number}': patient.mobile || '',
      '{Aadhaar Number}': patient.aadhaar || '',
      '{Doctor Name}': otRecord?.surgeon || admission?.doctorInCharge?.doctorName || admission?.doctorInCharge?.username || '',
      '{Referring Doctor Name}': admission?.referredDoctor?.doctorName || admission?.referredDoctor?.username || 'N/A',
      '{Surgical Procedure}': surgicalProc || otRecord?.proceduresPerformed || '',
      '{Additional Paragraph 1}': addPara1 || '',
      '{Additional Paragraph 2}': addPara2 || '',
      '{Current Date}': new Date().toLocaleDateString('en-IN'),
      '{Hospital Name}': hospitalInfo?.hospitalName || '',
      '{Hospital Logo}': hospitalInfo?.logoUrl ? '<img src="' + hospitalInfo.logoUrl + '" alt="Hospital Logo" style="max-height: 50px; object-fit: contain; display: inline-block; vertical-align: middle;" />' : ''
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      parsed = parsed.split(placeholder).join(value);
    });

    return parsed;
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      setRawTemplateContent('');
      setConsultationHeading('');
      setConsultationContent('');
      return;
    }
    const selected = activeTemplates.find(t => t._id === templateId);
    if (selected) {
      setRawTemplateContent(selected.content);
      setConsultationHeading(selected.templateHeading);
      const parsed = parseTemplate(
        selected.content,
        surgicalProcedureInput || otRecord?.proceduresPerformed || '',
        additionalParagraph1,
        additionalParagraph2
      );
      setConsultationContent(parsed);
    }
  };

  const handleManualFieldChange = (field, val) => {
    let newSurg = surgicalProcedureInput;
    let newP1 = additionalParagraph1;
    let newP2 = additionalParagraph2;

    if (field === 'surgical') {
      newSurg = val;
      setSurgicalProcedureInput(val);
    } else if (field === 'p1') {
      newP1 = val;
      setAdditionalParagraph1(val);
    } else if (field === 'p2') {
      newP2 = val;
      setAdditionalParagraph2(val);
    }

    if (rawTemplateContent) {
      const parsed = parseTemplate(rawTemplateContent, newSurg, newP1, newP2);
      setConsultationContent(parsed);
    }
  };

  const handleSaveConsultation = async (shouldPrint = false) => {
    if (!consultationContent.trim()) {
      toast.error('Consultation content cannot be empty');
      return;
    }

    setSavingConsultation(true);
    try {
      const record = await ensureOtRecord();
      if (!record) {
        setSavingConsultation(false);
        return;
      }

      const selected = activeTemplates.find(t => t._id === selectedTemplate);
      const templateName = selected ? selected.templateName : 'Manual Template';

      const updatePayload = {
        consultationNotes: consultationContent,
        templateId: selectedTemplate || null,
        templateName: templateName,
        templateHeading: consultationHeading || 'OT Consultation Report'
      };

      const { data } = await client.put(`/ipd/ot/${record._id}/consultation`, updatePayload);

      if (surgicalProcedureInput.trim()) {
        await client.put(`/ipd/ot/${record._id}`, {
          proceduresPerformed: surgicalProcedureInput.trim()
        });
      }

      const { data: fullRecord } = await client.get(`/ipd/ot/${record._id}/full`);

      setOtRecord(fullRecord);
      setIsEditingConsultation(false);
      toast.success('Consultation template saved successfully');

      if (shouldPrint) {
        handlePrintConsultation(fullRecord);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save consultation template');
    } finally {
      setSavingConsultation(false);
    }
  };

  const handleEditConsultation = () => {
    setConsultationHeading(otRecord?.consultation?.templateHeading || 'OT Consultation Report');
    setConsultationContent(otRecord?.consultation?.consultationNotes || '');
    setSelectedTemplate(otRecord?.consultation?.templateId || '');
    setIsEditingConsultation(true);
  };

  const handlePrintConsultation = (customRecord = null) => {
    const activeRecord = customRecord ? customRecord : otRecord;
    if (!activeRecord) return;
    const patientObj = admission?.patientId || {};
    const consentNotes = activeRecord.consultation?.consultationNotes || '';
    const heading = activeRecord.consultation?.templateHeading || 'OT Consultation / Consent Form';
    const dateStr = activeRecord.consultation?.signatureSignedAt 
      ? new Date(activeRecord.consultation.signatureSignedAt).toLocaleDateString('en-IN') 
      : new Date().toLocaleDateString('en-IN');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${heading}</title>
          <style>
            @media print {
              @page { size: A4; margin: 15mm; }
              body { font-size: 11pt; }
            }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; }
            .header-container { border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; }
            .hospital-logo { max-height: 60px; max-width: 150px; object-fit: contain; }
            .hospital-details h1 { font-size: 20px; font-weight: 800; margin: 0; color: #1e293b; }
            .hospital-details p { font-size: 12px; margin: 2px 0 0 0; color: #64748b; }
            
            .doc-title { text-align: center; font-size: 16px; font-weight: 800; margin: 20px 0; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; }
            
            .patient-box { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; padding: 12px 16px; background-color: #f8fafc; font-size: 13px; }
            .patient-box h4 { font-weight: 800; margin: 0 0 8px 0; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .patient-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 6px 20px; }
            .patient-grid div { display: flex; }
            .patient-grid span.label { font-weight: bold; color: #64748b; width: 140px; flex-shrink: 0; }
            .patient-grid span.val { color: #1e293b; }

            .consent-content { font-size: 14px; color: #0f172a; margin-bottom: 50px; text-align: justify; }
            
            .footer-section { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; }
            .signature-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 20px; }
            .sig-col { border-top: 1px dashed #94a3b8; padding-top: 6px; text-align: center; color: #475569; font-weight: bold; margin-top: 50px; }
            .date-row { text-align: right; font-size: 12px; color: #64748b; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${hospitalInfo?.logoUrl ? '<img src="' + hospitalInfo.logoUrl + '" class="hospital-logo" alt="Logo" />' : ''}
            <div class="hospital-details">
              <h1>${hospitalInfo?.hospitalName || 'Hospital Name'}</h1>
              <p>${hospitalInfo?.address || ''}</p>
            </div>
          </div>

          <div class="doc-title">${heading}</div>

          <div class="patient-box">
            <h4>Patient Demographics</h4>
            <div class="patient-grid">
              <div><span class="label">Patient Name:</span><span class="val">${activeRecord.patientName || patientObj.patientName || 'N/A'}</span></div>
              <div><span class="label">Age / Sex:</span><span class="val">${activeRecord.age || 'N/A'} Yrs / ${activeRecord.gender || patientObj.gender || 'N/A'}</span></div>
              <div><span class="label">Address:</span><span class="val">${patientObj.address || 'N/A'}</span></div>
              <div><span class="label">Mobile Number:</span><span class="val">${patientObj.mobile || 'N/A'}</span></div>
              <div><span class="label">Aadhaar Number:</span><span class="val">${patientObj.aadhaar || 'N/A'}</span></div>
              <div><span class="label">UHID / MRN:</span><span class="val">${formatUhid(activeRecord.uhid || patientObj.uhid)}</span></div>
            </div>
          </div>

          <div class="consent-content">
            ${consentNotes}
          </div>

          <div class="footer-section">
            <div class="signature-grid">
              <div class="sig-col">Patient Signature / Thumb Impression</div>
              <div class="sig-col">Witness Signature / Thumb Impression</div>
            </div>
            <div class="date-row">Date: ${dateStr}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleScheduleSuccess = async (booking) => {
    if (otRecord?._id) {
      const { data: fullRecord } = await client.get(`/ipd/ot/${otRecord._id}/full`);
      setOtRecord(fullRecord);
    }
    toast.success('OT scheduled successfully! Charges can be configured by Admin.');
  };

  const addReqMedRow = () => setReqMedicines([...reqMedicines, { medicineName: '', dosage: '', quantity: 1, unit: 'nos' }]);
  const removeReqMed = (idx) => setReqMedicines(reqMedicines.filter((_, i) => i !== idx));
  const updateReqMed = (idx, field, val) => {
    setReqMedicines(reqMedicines.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const addReqConRow = () => setReqConsumables([...reqConsumables, { consumableName: '', quantity: 1, unit: 'nos' }]);
  const removeReqCon = (idx) => setReqConsumables(reqConsumables.filter((_, i) => i !== idx));
  const updateReqCon = (idx, field, val) => {
    setReqConsumables(reqConsumables.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  };

  const handleSendPharmacyRequest = async () => {
    const filteredMeds = reqMedicines.filter(m => m.medicineName.trim()).map(m => ({
      ...m,
      quantity: Number(m.quantity) || 1,
      isRequested: true,
      requestedAt: new Date(),
      requestedBy: user?._id
    }));
    const filteredCons = reqConsumables.filter(c => c.consumableName.trim()).map(c => ({
      ...c,
      quantity: Number(c.quantity) || 1,
      isRequested: true,
      requestedAt: new Date(),
      requestedBy: user?._id
    }));

    setSubmittingRequest(true);
    try {
      const { data } = await client.put(`/ipd/ot/${otRecord._id}`, {
        pharmacyRequestSent: true,
        otMedicines: filteredMeds,
        otConsumables: filteredCons,
        status: 'In Progress'
      });
      setOtRecord(data.record);
      toast.success('Pharmacy request sent and OT is now In Progress!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send pharmacy request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleMarkOtDone = async () => {
    if (!window.confirm('Are you sure you want to mark this OT procedure as completed?')) return;
    try {
      const { data } = await client.put(`/ipd/ot/${otRecord._id}`, {
        status: 'Completed'
      });
      setOtRecord(data.record);
      toast.success('OT procedure marked as Completed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete OT procedure');
    }
  };

  const getStepStatus = (step) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-bold">Loading OT workflow...</span>
        </div>
      </div>
    );
  }

  if (!admission) return null;

  // patient is already defined above (admission?.patientId || {})
  const stepStatus = getStepStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/ipd/patients')} className="p-2 rounded-xl hover:bg-orange-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">OT Workflow</h1>
          <p className="text-sm text-gray-500">
            {patient.patientName || 'Patient'} | UHID: {formatUhid(patient.uhid)} | IPD: {admission.ipdNumber}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
          otRecord?.schedulingStatus === 'Scheduled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {otRecord?.schedulingStatus || 'Pending'}
        </span>
      </div>

      {/* Patient Summary */}
      <div className="card p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <User className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-orange-700">{formatUhid(patient.uhid)}</p>
            <h2 className="text-lg font-extrabold text-gray-900">{patient.patientName}</h2>
            <p className="text-xs text-gray-500">
              {patient.gender} • {admission.pidNumber} • Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => setShowPatientConsultModal(true)} className="btn-secondary text-sm py-2 px-3 flex items-center gap-2">
            <Eye className="h-4 w-4" /> View Patient & Consultation
          </button>
          <button onClick={() => navigate(`/ipd/patient/${id}`)} className="btn-secondary text-sm py-2 px-3 flex items-center gap-2">
            <User className="h-4 w-4" /> Open Patient Details
          </button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {[
          { step: STEPS.CONSULTATION, label: 'Consultation Form', icon: ClipboardCheck },
          { step: STEPS.SCHEDULING, label: 'Schedule OT', icon: CalendarDays },
          { step: STEPS.CHARGES, label: 'OT Charges', icon: IndianRupee },
          { step: STEPS.PHARMACY_REQUEST, label: 'Pharmacy Request', icon: Pill },
          { step: STEPS.ACTIVE, label: 'OT Active', icon: Scissors },
          { step: STEPS.COMPLETED, label: 'Completed', icon: CheckCircle }
        ].map(({ step, label, icon: Icon }) => {
          const status = stepStatus(step);
          const isClickable = step <= currentStep;
          return (
            <button
              key={step}
              disabled={!isClickable}
              onClick={() => setViewStep(step)}
              className={`p-3 rounded-xl border-2 flex items-center gap-2 text-left w-full transition-all ${
                step === activeStep ? 'border-orange-400 bg-orange-50' :
                status === 'completed' ? 'border-green-400 bg-green-50 hover:bg-green-100/50 cursor-pointer' :
                'border-gray-200 bg-white opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${
                step === activeStep ? 'bg-orange-100' :
                status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Icon className={`h-4 w-4 ${
                  step === activeStep ? 'text-orange-600' :
                  status === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <span className={`text-xs font-bold truncate ${
                step === activeStep ? 'text-orange-700' :
                status === 'completed' ? 'text-green-700' : 'text-gray-500'
              }`}>{label}</span>
              {status === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Step Content: OT Scheduling */}
      {activeStep === STEPS.SCHEDULING && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-orange-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-600" />
              <h2 className="font-extrabold text-gray-900">Step 2: Schedule OT Procedure</h2>
            </div>
            {otRecord?.schedulingStatus === 'Scheduled' || otRecord?.schedulingStatus === 'Completed' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">
                <CheckCircle className="h-3 w-3" /> Scheduled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-bold">
                <Clock className="h-3 w-3 animate-pulse" /> Pending Schedule
              </span>
            )}
          </div>

          {otRecord?.schedulingStatus === 'Scheduled' || otRecord?.schedulingStatus === 'Completed' ? (
            <div className="text-center py-6 bg-green-50/10 border border-green-100 rounded-2xl max-w-xl mx-auto space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold text-green-700">OT Procedure Already Scheduled</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold text-gray-700">Scheduled Room:</span> {otRecord.otScheduling?.otId?.otName || 'N/A'}</p>
                <p><span className="font-semibold text-gray-700">Date:</span> {otRecord.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleDateString('en-IN') : 'N/A'}</p>
                <p>
                  <span className="font-semibold text-gray-700">Time Window:</span> {otRecord.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} - {otRecord.otScheduling?.scheduledEnd ? new Date(otRecord.otScheduling.scheduledEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </p>
              </div>
              <div className="mt-6 flex gap-3 justify-center">
                <button onClick={() => setShowScheduling(true)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4" /> Reschedule OT
                </button>
                {currentStep > STEPS.SCHEDULING && (
                  <button onClick={() => setViewStep(null)} className="btn text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
                    Proceed to Next Step
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-orange-50/20 border-2 border-dashed border-orange-200 rounded-2xl max-w-md mx-auto space-y-4">
              <Calendar className="h-12 w-12 text-orange-400 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No OT Schedule Configured</h3>
              <p className="text-sm text-gray-500 px-4">Please schedule the OT procedure by selecting an available OT room, date, and timeslot.</p>
              <button
                onClick={() => setShowScheduling(true)}
                className="btn px-6 py-2.5 flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Calendar className="h-4 w-4" /> Open Scheduling Form
              </button>
            </div>
          )}

          {showScheduling && otRecord && (
            <OtSchedulingModal
              otRecord={otRecord}
              admissionId={id}
              onClose={() => setShowScheduling(false)}
              onScheduleSuccess={handleScheduleSuccess}
            />
          )}
        </div>
      )}

      {/* Step Content: Consultation Form */}
      {activeStep === STEPS.CONSULTATION && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-orange-200 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-orange-500" />
              <h2 className="font-extrabold text-gray-900">Step 1: OT Consultation / Consent Template</h2>
            </div>
            <div className="flex items-center gap-2">
              {otRecord?.consultation?.isConsultationCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">
                  <CheckCircle className="h-3 w-3" /> Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-bold">
                  <Clock className="h-3 w-3 animate-pulse" /> Pending Fill
                </span>
              )}
            </div>
          </div>

          {!otRecord?.consultation?.isConsultationCompleted || isEditingConsultation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 font-bold text-gray-700">
                    Select Template
                  </label>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading templates...
                    </div>
                  ) : activeTemplates.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">
                      No active consultation templates found. Please configure them in Admin OT Settings.
                    </p>
                  ) : (
                    <select
                      className="input py-2.5 text-sm"
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                    >
                      <option value="">Choose a Template...</option>
                      {activeTemplates.map(t => (
                        <option key={t._id} value={t._id}>{t.templateName}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 font-bold text-gray-700">
                    Template Heading / Title
                  </label>
                  <input
                    type="text"
                    className="input py-2.5 text-sm"
                    value={consultationHeading}
                    onChange={(e) => setConsultationHeading(e.target.value)}
                    placeholder="e.g. Consent for Surgery"
                  />
                </div>
              </div>

              {/* Manual Fields Section */}
              <div className="border border-orange-100 rounded-xl bg-orange-50/20 p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950 uppercase tracking-wide border-b border-orange-100 pb-2">
                  <Edit3 className="h-4 w-4 text-orange-600" />
                  <span>Manual Form Fields</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 font-bold text-gray-700">
                      Surgical Procedure
                    </label>
                    <input
                      type="text"
                      className="input py-2 text-sm bg-white"
                      value={surgicalProcedureInput}
                      onChange={(e) => handleManualFieldChange('surgical', e.target.value)}
                      placeholder="Enter surgical procedure (e.g. Laparoscopic Cholecystectomy)"
                    />
                    <p className="text-[9px] text-gray-400 mt-0.5">Fills {'{Surgical Procedure}'} and updates the main form's procedure field.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 font-bold text-gray-700">
                        Additional Paragraph 1
                      </label>
                      <textarea
                        className="input py-2 text-sm bg-white min-h-[60px] resize-y"
                        value={additionalParagraph1}
                        onChange={(e) => handleManualFieldChange('p1', e.target.value)}
                        placeholder="Enter custom text for {'{Additional Paragraph 1}'}..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 font-bold text-gray-700">
                        Additional Paragraph 2
                      </label>
                      <textarea
                        className="input py-2 text-sm bg-white min-h-[60px] resize-y"
                        value={additionalParagraph2}
                        onChange={(e) => handleManualFieldChange('p2', e.target.value)}
                        placeholder="Enter custom text for {'{Additional Paragraph 2}'}..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500 font-bold text-gray-700">
                  Consultation Content
                </label>
                <TemplateEditor
                  value={consultationContent}
                  onChange={setConsultationContent}
                  placeholder="Select a template above to auto-populate content, or start typing here..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-orange-100">
                {otRecord?.consultation?.isConsultationCompleted && (
                  <button
                    type="button"
                    onClick={() => setIsEditingConsultation(false)}
                    className="btn-secondary text-sm py-2 px-4 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveConsultation(false)}
                  disabled={savingConsultation}
                  className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2 cursor-pointer"
                >
                  {savingConsultation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Form
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConsultation(true)}
                  disabled={savingConsultation}
                  className="btn text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer"
                >
                  {savingConsultation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  Save & Print Form
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-orange-100 rounded-xl bg-white p-5 shadow-sm space-y-4">
                <div className="text-center border-b border-gray-100 pb-3">
                  <h4 className="font-extrabold text-lg text-gray-900 uppercase tracking-wide">
                    {otRecord.consultation?.templateHeading}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Template: {otRecord.consultation?.templateName || 'Custom'} | Completed on: {otRecord.consultation?.signatureSignedAt ? new Date(otRecord.consultation.signatureSignedAt).toLocaleString('en-IN') : 'N/A'}
                  </p>
                </div>
                <div
                  className="prose prose-sm max-w-none text-gray-800 min-h-[100px]"
                  dangerouslySetInnerHTML={{ __html: otRecord.consultation?.consultationNotes }}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleEditConsultation}
                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" /> Edit Content
                </button>
                <button
                  onClick={() => handlePrintConsultation()}
                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print Consultation
                </button>
                {currentStep > STEPS.CONSULTATION && (
                  <button
                    onClick={() => setViewStep(null)}
                    className="btn text-sm py-2 px-4 flex items-center gap-2 cursor-pointer"
                  >
                    Proceed to Next Step
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Content: OT Charges (Pending Admin) */}
      {activeStep === STEPS.CHARGES && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-green-100 pb-3">
            <IndianRupee className="h-5 w-5 text-green-600" />
            <h2 className="font-extrabold text-gray-900">Step 3: OT Charges (Pending Admin)</h2>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              OT has been scheduled and consultation done. Please wait for the Admin to configure OT charges for this patient.
              Once charges are set, you can request medicines and consumables.
            </p>
          </div>
          {otRecord?.otCharges?.length > 0 && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <p className="font-bold text-green-800">Charge Items Configured:</p>
              {otRecord.otCharges.filter(c => c.isActive !== false).map((charge, i) => (
                <div key={i} className="text-sm py-1">
                  <span>{charge.chargeName}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={loadData} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Refresh Status</button>
        </div>
      )}

      {/* Step Content: Pharmacy Request */}
      {activeStep === STEPS.PHARMACY_REQUEST && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <Pill className="h-5 w-5 text-orange-600" />
            <h2 className="font-extrabold text-gray-900">Step 4: Pharmacy Request</h2>
          </div>
          <p className="text-sm text-gray-600">Request the required medicines and consumables for the scheduled procedure from the pharmacy. Sending this request will start the OT procedure.</p>

          <div className="space-y-4">
            {/* Medicines List */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Pill className="h-4 w-4 text-orange-500" /> Medicines Requested
              </h3>
              <div className="space-y-2">
                {reqMedicines.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      className="input text-xs py-2"
                      value={item.medicineName}
                      onChange={(e) => updateReqMed(index, 'medicineName', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      className="input text-xs py-2"
                      value={item.dosage}
                      onChange={(e) => updateReqMed(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      className="input text-xs py-2"
                      value={item.quantity}
                      onChange={(e) => updateReqMed(index, 'quantity', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeReqMed(index)}
                      className="text-xs text-red-600 hover:text-red-800 text-left font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addReqMedRow}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 mt-2"
                >
                  <Plus className="h-3 w-3" /> Add Medicine Row
                </button>
              </div>
            </div>

            {/* Consumables List */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Flask className="h-4 w-4 text-orange-500" /> Consumables Requested
              </h3>
              <div className="space-y-2">
                {reqConsumables.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Consumable Name"
                      className="input text-xs py-2"
                      value={item.consumableName}
                      onChange={(e) => updateReqCon(index, 'consumableName', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      className="input text-xs py-2"
                      value={item.quantity}
                      onChange={(e) => updateReqCon(index, 'quantity', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeReqCon(index)}
                      className="text-xs text-red-600 hover:text-red-800 text-left font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addReqConRow}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 mt-2"
                >
                  <Plus className="h-3 w-3" /> Add Consumable Row
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={handleSendPharmacyRequest}
              disabled={submittingRequest}
              className="btn px-6 py-2.5 flex items-center gap-2"
            >
              {submittingRequest ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4" /> Send Request & Start OT</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step Content: OT Active */}
      {activeStep === STEPS.ACTIVE && (
        <div className="card p-6 text-center space-y-6">
          <div className="animate-pulse flex flex-col items-center justify-center space-y-3">
            <span className="relative flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-red-500"></span>
            </span>
            <h2 className="text-2xl font-black text-red-600 tracking-tight uppercase">OT is going on</h2>
            <p className="text-sm text-gray-500 font-semibold">The procedure is currently active and in progress.</p>
          </div>

          <div className="border border-orange-100 rounded-2xl p-5 bg-orange-50/20 max-w-md mx-auto text-left text-sm space-y-2.5">
            <div><span className="font-bold text-gray-700">Scheduled Room:</span> {otRecord?.otScheduling?.otId?.otName || 'N/A'}</div>
            <div><span className="font-bold text-gray-700">Surgery Date:</span> {otRecord?.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleDateString('en-IN') : 'N/A'}</div>
            <div><span className="font-bold text-gray-700">Time Window:</span> {otRecord?.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} - {otRecord?.otScheduling?.scheduledEnd ? new Date(otRecord.otScheduling.scheduledEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
            <div><span className="font-bold text-gray-700">Surgeon:</span> Dr. {otRecord?.surgeon || 'N/A'}</div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
            <button 
              onClick={handleMarkOtDone}
              className="btn bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-2.5 flex items-center gap-2 justify-center"
            >
              <CheckCircle className="h-5 w-5" /> Mark OT Done
            </button>
            <button 
              onClick={() => navigate(`/ipd/ot/${id}?otId=${otRecord?._id}`)} 
              className="btn-secondary flex items-center gap-2 justify-center"
            >
              <FileText className="h-4 w-4" /> Open Operative Report / OT Form
            </button>
          </div>
        </div>
      )}

      {/* Step Content: Completed */}
      {activeStep === STEPS.COMPLETED && (
        <div className="card p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-green-700">OT Process Completed</h2>
          <p className="text-sm text-gray-600 mt-2">All steps have been completed for this OT case.</p>
          {otRecord && (
            <button onClick={() => navigate(`/ipd/ot/${id}?otId=${otRecord._id}`)}
              className="btn mt-4"><Eye className="h-4 w-4" /> View Operative Report</button>
          )}
        </div>
      )}

      {showPatientConsultModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Patient & Consultation Details</h2>
                <p className="text-sm text-gray-500">Review the allocated patient data and consultation form from the OT workflow.</p>
              </div>
              <button onClick={() => setShowPatientConsultModal(false)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Patient Details</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div><span className="font-semibold">Name:</span> {patient.patientName || 'N/A'}</div>
                    <div><span className="font-semibold">UHID:</span> {formatUhid(patient.uhid) || 'N/A'}</div>
                    <div><span className="font-semibold">PID:</span> {admission.pidNumber || 'N/A'}</div>
                    <div><span className="font-semibold">IPD No:</span> {admission.ipdNumber || 'N/A'}</div>
                    <div><span className="font-semibold">Gender:</span> {patient.gender || 'N/A'}</div>
                    <div><span className="font-semibold">Age:</span> {patient.age || 'N/A'}</div>
                    <div><span className="font-semibold">Admitted Bed:</span> {admission.bedId?.bedNumber || 'N/A'} ({admission.roomId?.roomType || 'N/A'})</div>
                    <div><span className="font-semibold">Consultant:</span> Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}</div>
                    <div><span className="font-semibold">Admission Date:</span> {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Consultation Form</h3>
                  {otRecord?.consultation?.isConsultationCompleted ? (
                    <div className="space-y-3 text-sm text-gray-700">
                      <div><span className="font-semibold">Heading:</span> {otRecord.consultation.templateHeading || 'OT Consent'}</div>
                      <div><span className="font-semibold">Template Name:</span> {otRecord.consultation.templateName || 'Custom'}</div>
                      <div><span className="font-semibold">Completed on:</span> {otRecord.consultation.signatureSignedAt ? formatDate(otRecord.consultation.signatureSignedAt) : new Date().toLocaleDateString('en-IN')}</div>
                      <div><span className="font-semibold">Consent Notes / Content:</span></div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-800 max-h-[300px] overflow-y-auto prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: otRecord.consultation.consultationNotes }} />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      <div className="mb-2"><span className="font-semibold">Status:</span> Not completed</div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-gray-600">
                        Consultation template details and content will appear here after completion.
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowPatientConsultModal(false)} className="btn-secondary">Close</button>
                {otRecord?.consultation?.isConsultationCompleted && (
                  <button onClick={handlePrintConsultation} className="btn"><Printer className="h-4 w-4" /> Print Consultation</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print styles for consultation form */}
      <style>{`
        @media print {
          body { background: white; font-size: 12pt; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  );
};

export default IpdOtFlow;