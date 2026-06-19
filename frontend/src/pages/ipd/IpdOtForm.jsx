import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Loader2,
  Save,
  Eye,
  Printer,
  Download,
  CheckCircle,
  FileText,
  Clock,
  User,
  CalendarDays,
  Stethoscope,
  Syringe,
  AlertCircle,
  Pill,
  FlaskRound as Flask,
  FileSignature,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';
import { formatDate } from '../../utils/dateFormat';
import OtSchedulingModal from './OtSchedulingModal';
import OtConsentForm from './OtConsentForm';
import OtConsultationForm from './OtConsultationForm';

const IpdOtForm = () => {
  const { id } = useParams(); // admissionId
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef();

  const otId = searchParams.get('otId'); // if editing existing record

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otRecord, setOtRecord] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Form fields
  const [form, setForm] = useState({
    admissionId: id || '',
    patientId: '',
    uhid: '',
    pidNumber: '',
    ipdNumber: '',
    patientName: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    admissionDate: '',
    consultantDoctor: '',
    dateOfSurgery: '',
    surgeon: '',
    assistantSurgeon: '',
    anesthesia: '',
    preOperativeDiagnosis: '',
    postOperativeDiagnosis: '',
    proceduresPerformed: '',
    indicationsForSurgery: '',
    findings: '',
    descriptionOfProcedure: '',
    status: 'Draft',
    consent: { isConsentCompleted: false },
    consultation: { isConsultationCompleted: false },
    schedulingStatus: 'Pending',
    pharmacyRequestSent: false,
    otCharges: [],
    totalCharges: 0,
    otChargesTemplate: []
  });

  // Load admission details
  const loadOtRecord = useCallback(async (otRecordId) => {
    try {
      const { data: otData } = await client.get(`/ipd/ot/${otRecordId}/full`);
      setOtRecord(otData);
      return otData;
    } catch (err) {
      console.error('Failed to load OT record:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load admission
        const { data: admissionData } = await client.get(`/ipd/patients/${id}`);
        setAdmission(admissionData);

        // Load hospital info
        try {
          const { data: hospitalData } = await client.get('/ipd/ot/hospital-info');
          setHospitalInfo(hospitalData);
        } catch (err) {
          console.warn('Could not load hospital info:', err);
        }

        const patient = admissionData.patientId || {};
        const patientAge = patient.dob
          ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : '';

        // If editing existing OT record
        if (otId) {
          const otData = await loadOtRecord(otId);
          if (otData) {
            setForm({
              admissionId: id,
              patientId: patient._id || '',
              uhid: otData.uhid || patient.uhid || '',
              pidNumber: otData.pidNumber || admissionData.pidNumber || '',
              ipdNumber: otData.ipdNumber || admissionData.ipdNumber || '',
              patientName: otData.patientName || patient.patientName || '',
              dateOfBirth: otData.dateOfBirth
                ? new Date(otData.dateOfBirth).toISOString().split('T')[0]
                : (patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : ''),
              age: otData.age || patientAge || '',
              gender: otData.gender || patient.gender || '',
              admissionDate: otData.admissionDate
                ? new Date(otData.admissionDate).toISOString().split('T')[0]
                : (admissionData.admissionDate ? new Date(admissionData.admissionDate).toISOString().split('T')[0] : ''),
              consultantDoctor: otData.consultantDoctor || admissionData.doctorInCharge?.doctorName || admissionData.doctorInCharge?.username || '',
              dateOfSurgery: otData.dateOfSurgery ? new Date(otData.dateOfSurgery).toISOString().split('T')[0] : '',
              surgeon: otData.surgeon || '',
              assistantSurgeon: otData.assistantSurgeon || '',
              anesthesia: otData.anesthesia || '',
              preOperativeDiagnosis: otData.preOperativeDiagnosis || '',
              postOperativeDiagnosis: otData.postOperativeDiagnosis || '',
              proceduresPerformed: otData.proceduresPerformed || '',
              indicationsForSurgery: otData.indicationsForSurgery || '',
              findings: otData.findings || '',
              descriptionOfProcedure: otData.descriptionOfProcedure || '',
              status: otData.status || 'Draft',
              consent: otData.consent || { isConsentCompleted: false },
              consultation: otData.consultation || { isConsultationCompleted: false },
              schedulingStatus: otData.schedulingStatus || 'Pending',
              pharmacyRequestSent: otData.pharmacyRequestSent || false,
              otCharges: otData.otCharges || [],
              totalCharges: otData.totalCharges || 0,
              otChargesTemplate: otData.otCharges || []
            });
          }
        } else {
          // New record - auto-fill from admission
          setForm(prev => ({
            ...prev,
            patientId: patient._id || '',
            uhid: patient.uhid || '',
            pidNumber: admissionData.pidNumber || '',
            ipdNumber: admissionData.ipdNumber || '',
            patientName: patient.patientName || '',
            dateOfBirth: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
            age: patientAge || '',
            gender: patient.gender || '',
            admissionDate: admissionData.admissionDate ? new Date(admissionData.admissionDate).toISOString().split('T')[0] : '',
            consultantDoctor: admissionData.doctorInCharge?.doctorName || admissionData.doctorInCharge?.username || ''
          }));
        }
      } catch (err) {
        toast.error('Failed to load patient data');
        navigate('/ipd/patients');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, otId, navigate, loadOtRecord]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (field === 'dateOfBirth' && value) {
      const age = Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      setForm(prev => ({ ...prev, age: age > 0 ? age : '' }));
    }
  };

  const validate = (isFinalize = false) => {
    const errors = {};
    if (!form.surgeon?.trim()) errors.surgeon = 'Surgeon name is required';
    if (isFinalize) {
      if (!form.dateOfSurgery) errors.dateOfSurgery = 'Date of surgery is required';
      if (!form.preOperativeDiagnosis?.trim()) errors.preOperativeDiagnosis = 'Pre-operative diagnosis is required';
      if (!form.proceduresPerformed?.trim()) errors.proceduresPerformed = 'Procedures performed is required';
      if (!form.descriptionOfProcedure?.trim()) errors.descriptionOfProcedure = 'Description of procedure is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (finalize = false) => {
    if (!validate(finalize)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        admissionId: id,
        status: finalize ? 'Completed' : 'Draft',
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
        admissionDate: form.admissionDate ? new Date(form.admissionDate) : null,
        dateOfSurgery: form.dateOfSurgery ? new Date(form.dateOfSurgery) : null,
        age: form.age ? Number(form.age) : null
      };

      let response;
      if (otRecord || form._id) {
        const recordId = otRecord?._id || form._id;
        response = await client.put(`/ipd/ot/${recordId}`, payload);
        toast.success(finalize ? 'OT record completed successfully' : 'OT record updated as Draft');
      } else {
        response = await client.post('/ipd/ot', payload);
        toast.success(finalize ? 'OT record saved and completed' : 'OT record saved as Draft');
      }

      const savedRecord = response?.data?.record;
      setOtRecord(savedRecord);
      setForm(prev => ({ ...prev, ...savedRecord, status: savedRecord.status }));

      if (savedRecord?._id && !otId) {
        navigate(`/ipd/ot/${id}?otId=${savedRecord._id}`, { replace: true });
      }

      if (finalize && savedRecord) {
        setTimeout(() => setShowScheduling(true), 500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save OT record');
    } finally {
      setSaving(false);
    }
  };

  // Auto-open consultation form when coming from patient list
  useEffect(() => {
    const openConsultation = searchParams.get('openConsultation');
    if (openConsultation === 'true' && otRecord && !showConsultationForm) {
      // Wait a moment for the record to fully load, then open consultation
      const timer = setTimeout(() => {
        setShowConsultationForm(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, otRecord, showConsultationForm]);

  useEffect(() => {
    if (user && !form.surgeon) {
      setForm(prev => ({ ...prev, surgeon: user.doctorName || user.username || '' }));
    }
  }, [user, form.surgeon]);

  // Handle consent printed callback
  const handleConsentPrinted = async (consentData) => {
    // Just mark that consent was printed - actual signed upload happens in backend separately
    try {
      if (otRecord?._id) {
        await client.put(`/ipd/ot/${otRecord._id}/consent`, {
          consentSignedBy: consentData.patientSignature || consentData.guardianSignature || 'Patient/Relative'
        });
        // Reload the record
        const updated = await loadOtRecord(otRecord._id);
        if (updated) {
          setOtRecord(updated);
          setForm(prev => ({ ...prev, consent: updated.consent }));
        }
        toast.success('Consent form printed and tracked');
      }
    } catch (err) {
      console.error('Failed to save consent tracking:', err);
    }
  };

  // Handle consultation completed callback
  const handleConsultationCompleted = (record) => {
    setOtRecord(record);
    setForm(prev => ({
      ...prev,
      consultation: record.consultation
    }));
  };


  // Handle OT scheduled callback from modal
  const handleScheduleSuccess = async (booking) => {
    // Reload the full record
    if (otRecord?._id) {
      const updated = await loadOtRecord(otRecord._id);
      if (updated) {
        setOtRecord(updated);
        setForm(prev => ({
          ...prev,
          schedulingStatus: updated.schedulingStatus
        }));
      }
    }
    toast.success('OT has been scheduled successfully!');
    setTimeout(() => navigate('/ipd/ot-management'), 1000);
  };

  // Check if ready for scheduling
  const isReadyForScheduling = () => {
    return true;
  };

  const handlePrint = () => {
    if (!form.status) return;
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!otRecord && !form._id) {
      toast.error('Please save the record first before downloading PDF');
      return;
    }
    toast.success('PDF download initiated - use browser Print → Save as PDF');
    window.print();
  };

  const inputClass = (field) =>
    `input py-2.5 text-sm ${validationErrors[field] ? 'border-red-400 ring-1 ring-red-200' : ''}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-bold">Loading patient data...</span>
        </div>
      </div>
    );
  }

  if (!admission) return null;

  const currentFormStep = (() => {
    if (form.schedulingStatus !== 'Scheduled' && form.schedulingStatus !== 'Completed') return 1;
    if (!form.consultation?.isConsultationCompleted) return 2;
    if (!form.otCharges || form.otCharges.length === 0) return 3;
    if (form.status !== 'Completed' && !form.pharmacyRequestSent) return 4;
    return 5;
  })();

  const getStepClass = (stepNum) => {
    if (stepNum < currentFormStep) return 'border-green-400 bg-green-50';
    if (stepNum === currentFormStep) return 'border-orange-400 bg-orange-50';
    return 'border-gray-200 bg-white';
  };

  const getIconClass = (stepNum) => {
    if (stepNum < currentFormStep) return 'bg-green-100 text-green-600';
    if (stepNum === currentFormStep) return 'bg-orange-100 text-orange-600';
    return 'bg-gray-100 text-gray-400';
  };

  return (
    <>
    <div className="space-y-6 print:space-y-4">
      {/* Header - Hidden when printing */}
      <div className="no-print">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => navigate('/ipd/patients')} className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">OT Form / Operative Report</h1>
            <p className="text-sm text-gray-500">
              {otRecord ? `Editing OT Record` : `New OT Record`} | IPD: {form.ipdNumber} | PID: {form.pidNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
              form.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {form.status === 'Completed' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {form.status}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
              form.schedulingStatus === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <CalendarDays className="h-3 w-3" />
              {form.schedulingStatus}
            </span>
          </div>
        </div>

        {/* Workflow Status Bar */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Step 1: Schedule OT */}
          <div className={`p-3 rounded-xl border-2 ${getStepClass(1)} flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${getIconClass(1)}`}>
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-600">Step 1</p>
              <p className="text-sm font-semibold truncate">
                {form.schedulingStatus === 'Scheduled' || form.schedulingStatus === 'Completed' ? 'OT Scheduled' : 'Pending Schedule'}
              </p>
            </div>
            {(form.schedulingStatus === 'Scheduled' || form.schedulingStatus === 'Completed') && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
          </div>

          {/* Step 2: Consultation Form */}
          <div className={`p-3 rounded-xl border-2 ${getStepClass(2)} flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${getIconClass(2)}`}>
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-600">Step 2</p>
              <p className="text-sm font-semibold truncate">
                {form.consultation?.isConsultationCompleted ? 'Consultation Completed' : 'Consultation Required'}
              </p>
            </div>
            {form.consultation?.isConsultationCompleted && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
          </div>

          {/* Step 3: OT Charges */}
          <div className={`p-3 rounded-xl border-2 ${getStepClass(3)} flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${getIconClass(3)}`}>
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-600">Step 3</p>
              <p className="text-sm font-semibold truncate">
                {form.otCharges?.length > 0 ? 'Charges Configured' : 'Pending Charges'}
              </p>
            </div>
            {form.otCharges?.length > 0 && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
          </div>

          {/* Step 4: Pharmacy Request / Active */}
          <div className={`p-3 rounded-xl border-2 ${getStepClass(4)} flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${getIconClass(4)}`}>
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-600">Step 4</p>
              <p className="text-sm font-semibold truncate">
                {form.status === 'Completed' ? 'Completed' : (form.pharmacyRequestSent || form.status === 'In Progress' ? 'OT is going on' : 'Pharmacy Request')}
              </p>
            </div>
            {form.status === 'Completed' && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Save/Scheduling Buttons */}
          <button onClick={() => handleSave(false)} disabled={saving}
            className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button onClick={() => handleSave(true)}
            disabled={saving || form.status === 'Completed'}
            className={`btn text-sm py-2.5 px-4 flex items-center gap-2 ${form.status === 'Completed' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Complete OT Record
          </button>

          {/* Workflow Action Buttons */}
          <button onClick={() => setShowConsentForm(true)}
            disabled={!otRecord && !form._id}
            className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            Consent Form
          </button>
          <button onClick={() => setShowConsultationForm(true)}
            disabled={!otRecord && !form._id}
            className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Consultation Form
          </button>

          {/* View/Print Buttons */}
          <button onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'View Report'}
          </button>
          {(otRecord || form._id) && (
            <>
              <button onClick={handlePrint} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
                <Printer className="h-4 w-4" /> Print
              </button>
              <button onClick={handleDownloadPdf} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Preview - Full Page Print Layout */}
      {showPreview && (otRecord || form._id) && (
        <div className="no-print mb-6">
          <div className="card p-6 border-2 border-orange-200 bg-orange-50/20">
            <div className="flex items-center gap-2 text-orange-600 mb-4">
              <FileText className="h-5 w-5" />
              <h3 className="font-extrabold">Operative Report Preview</h3>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg print:shadow-none" ref={printRef}>
              {renderOperativeReport(form, hospitalInfo, user)}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient Information */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <User className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Patient Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input type="text" className="input py-2.5 text-sm" value={form.patientName}
                onChange={(e) => handleChange('patientName', e.target.value)} placeholder="Patient name" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Date of Birth</label>
              <input type="date" className="input py-2.5 text-sm" value={form.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Age</label>
              <input type="number" min="0" className="input py-2.5 text-sm" value={form.age}
                onChange={(e) => handleChange('age', e.target.value)} placeholder="Age" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Gender</label>
              <select className="input py-2.5 text-sm" value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                UHID / MRN <span className="text-red-500">*</span>
              </label>
              <input type="text" className="input py-2.5 text-sm font-mono" value={formatUhid(form.uhid)}
                onChange={(e) => handleChange('uhid', e.target.value)} placeholder="UHID" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">PID Number</label>
              <input type="text" className="input py-2.5 text-sm font-mono" value={form.pidNumber}
                onChange={(e) => handleChange('pidNumber', e.target.value)} placeholder="PID" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">IPD Number</label>
              <input type="text" className="input py-2.5 text-sm font-mono" value={form.ipdNumber}
                onChange={(e) => handleChange('ipdNumber', e.target.value)} placeholder="IPD" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Admission Date</label>
              <input type="date" className="input py-2.5 text-sm" value={form.admissionDate}
                onChange={(e) => handleChange('admissionDate', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Consultant Doctor</label>
              <input type="text" className="input py-2.5 text-sm" value={form.consultantDoctor}
                onChange={(e) => handleChange('consultantDoctor', e.target.value)} placeholder="Consultant doctor name" />
            </div>
          </div>
        </div>

        {/* Surgery Information */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <Syringe className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Surgery Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Date of Surgery {validationErrors.dateOfSurgery && <span className="text-red-500">*</span>}
              </label>
              <input type="date" className={inputClass('dateOfSurgery')} value={form.dateOfSurgery}
                onChange={(e) => handleChange('dateOfSurgery', e.target.value)} />
              {validationErrors.dateOfSurgery && <p className="text-xs text-red-500 mt-1">{validationErrors.dateOfSurgery}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Surgeon(s) <span className="text-red-500">*</span>
              </label>
              <input type="text" className={inputClass('surgeon')} value={form.surgeon}
                onChange={(e) => handleChange('surgeon', e.target.value)} placeholder="Primary surgeon name(s)" />
              {validationErrors.surgeon && <p className="text-xs text-red-500 mt-1">{validationErrors.surgeon}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Assistant Surgeon(s)</label>
              <input type="text" className="input py-2.5 text-sm" value={form.assistantSurgeon}
                onChange={(e) => handleChange('assistantSurgeon', e.target.value)} placeholder="Assistant surgeon name(s)" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Anesthesia</label>
              <input type="text" className="input py-2.5 text-sm" value={form.anesthesia}
                onChange={(e) => handleChange('anesthesia', e.target.value)} placeholder="Type of anesthesia" />
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <Stethoscope className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Diagnosis</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Pre-operative Diagnosis {validationErrors.preOperativeDiagnosis && <span className="text-red-500">*</span>}
              </label>
              <textarea className={`${inputClass('preOperativeDiagnosis')} min-h-[100px] resize-y`} value={form.preOperativeDiagnosis}
                onChange={(e) => handleChange('preOperativeDiagnosis', e.target.value)} placeholder="Pre-operative diagnosis details..." />
              {validationErrors.preOperativeDiagnosis && <p className="text-xs text-red-500 mt-1">{validationErrors.preOperativeDiagnosis}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Post-operative Diagnosis</label>
              <textarea className="input py-2.5 text-sm min-h-[100px] resize-y" value={form.postOperativeDiagnosis}
                onChange={(e) => handleChange('postOperativeDiagnosis', e.target.value)} placeholder="Post-operative diagnosis details..." />
            </div>
          </div>
        </div>

        {/* Procedure Information */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <FileText className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Procedure Information</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Procedure(s) Performed {validationErrors.proceduresPerformed && <span className="text-red-500">*</span>}
              </label>
              <textarea className={`${inputClass('proceduresPerformed')} min-h-[120px] resize-y`} value={form.proceduresPerformed}
                onChange={(e) => handleChange('proceduresPerformed', e.target.value)} placeholder="List procedure(s) performed..." />
              {validationErrors.proceduresPerformed && <p className="text-xs text-red-500 mt-1">{validationErrors.proceduresPerformed}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Indications for Surgery</label>
              <textarea className="input py-2.5 text-sm min-h-[120px] resize-y" value={form.indicationsForSurgery}
                onChange={(e) => handleChange('indicationsForSurgery', e.target.value)} placeholder="Indications for surgery..." />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Findings</label>
              <textarea className="input py-2.5 text-sm min-h-[120px] resize-y" value={form.findings}
                onChange={(e) => handleChange('findings', e.target.value)} placeholder="Operative findings..." />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Description of Procedure {validationErrors.descriptionOfProcedure && <span className="text-red-500">*</span>}
              </label>
              <textarea className={`${inputClass('descriptionOfProcedure')} min-h-[120px] resize-y`} value={form.descriptionOfProcedure}
                onChange={(e) => handleChange('descriptionOfProcedure', e.target.value)} placeholder="Detailed description of procedure..." />
              {validationErrors.descriptionOfProcedure && <p className="text-xs text-red-500 mt-1">{validationErrors.descriptionOfProcedure}</p>}
            </div>
          </div>
        </div>

        {/* Pharmacy Integration Section (Future Ready) */}
        {otRecord && (
          <div className="card p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
              <Pill className="h-5 w-5 text-orange-500" />
              <h3 className="font-extrabold text-gray-900">OT Medicines & Consumables <span className="text-[10px] font-normal text-gray-500">(Future: Pharmacy Integration)</span></h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medicines Summary */}
              <div className="border border-orange-100 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-orange-500" />
                  Medicines ({otRecord?.otMedicines?.length || 0})
                </h4>
                {otRecord?.otMedicines?.length > 0 ? (
                  <div className="space-y-1">
                    {otRecord.otMedicines.slice(0, 5).map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium">{med.medicineName}</span>
                        <span className="text-gray-500">{med.quantity} {med.unit}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No medicines added yet</p>
                )}
              </div>

              {/* Consumables Summary */}
              <div className="border border-orange-100 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Flask className="h-4 w-4 text-orange-500" />
                  Consumables ({otRecord?.otConsumables?.length || 0})
                </h4>
                {otRecord?.otConsumables?.length > 0 ? (
                  <div className="space-y-1">
                    {otRecord.otConsumables.slice(0, 5).map((con, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium">{con.consumableName}</span>
                        <span className="text-gray-500">{con.quantity} {con.unit}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No consumables added yet</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 italic">
              Pharmacy integration is future-ready. Medicines and consumables can be managed from the Pharmacy module once integration is active.
            </p>
          </div>
        )}
      </div>

      {/* Print-only Operative Report */}
      <div className="hidden print:block">
        {renderOperativeReport(form, hospitalInfo, user)}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; font-size: 12pt; }
          .no-print { display: none !important; }
          .print\\:block { display: block !important; }
          .card { border: 1px solid #ddd !important; box-shadow: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>

    {/* Modals */}
    {showConsentForm && otRecord && (
      <OtConsentForm
        patient={admission?.patientId}
        otRecord={otRecord}
        hospitalInfo={hospitalInfo}
        user={user}
        onClose={() => setShowConsentForm(false)}
        onConsentPrinted={handleConsentPrinted}
      />
    )}
    {showConsultationForm && otRecord && (
      <OtConsultationForm
        otRecord={otRecord}
        onClose={() => setShowConsultationForm(false)}
        onConsultationCompleted={handleConsultationCompleted}
      />
    )}
    {showScheduling && otRecord && (
      <OtSchedulingModal
        otRecord={otRecord}
        admissionId={id}
        onClose={() => setShowScheduling(false)}
        onScheduleSuccess={handleScheduleSuccess}
      />
    )}
  </>
  );
};

// Operative Report render function (used in preview and print)
const renderOperativeReport = (form, hospitalInfo, user) => {
  const now = new Date();
  const formattedDate = formatDate(now);
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="p-8 text-gray-900">
      {/* Hospital Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          {hospitalInfo?.logoUrl && (
            <img
              src={hospitalInfo.logoUrl}
              alt="Hospital Logo"
              className="h-16 w-16 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div>
            <h1 className="text-xl font-black text-gray-900">{hospitalInfo?.hospitalName || 'Hospital Name'}</h1>
            <p className="text-sm text-gray-600">{hospitalInfo?.address || ''}</p>
            <p className="text-sm text-gray-600">
              {hospitalInfo?.phoneNumbers?.length > 0 ? `Phone: ${hospitalInfo.phoneNumbers.join(', ')}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Report Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-black uppercase tracking-wide text-gray-900">OPERATIVE REPORT</h2>
      </div>

      {/* Patient Information */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Patient Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 text-sm">
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Patient Name:</span>
            <span className="text-gray-900">{form.patientName || '_________________________'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">UHID / MRN:</span>
            <span className="text-gray-900 font-mono">{formatUhid(form.uhid) || '_________________________'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Date of Birth:</span>
            <span className="text-gray-900">
              {form.dateOfBirth ? formatDate(form.dateOfBirth) : '_________________________'}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Age / Gender:</span>
            <span className="text-gray-900">{form.age || '___'} years / {form.gender || '_________'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Admission Date:</span>
            <span className="text-gray-900">
              {form.admissionDate ? formatDate(form.admissionDate) : '_________________________'}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Consultant:</span>
            <span className="text-gray-900">Dr. {form.consultantDoctor || '_________________________'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">IPD Number:</span>
            <span className="text-gray-900 font-mono">{form.ipdNumber || '_________________________'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">PID Number:</span>
            <span className="text-gray-900 font-mono">{form.pidNumber || '_________________________'}</span>
          </div>
        </div>
      </div>

      {/* Surgery Information */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Surgery Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 text-sm">
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Date of Surgery:</span>
            <span className="text-gray-900">
              {form.dateOfSurgery ? formatDate(form.dateOfSurgery) : '_________________________'}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Surgeon(s):</span>
            <span className="text-gray-900">{form.surgeon || '_________________________'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Assistant Surgeon(s):</span>
            <span className="text-gray-900">{form.assistantSurgeon || '_________________________'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Anesthesia:</span>
            <span className="text-gray-900">{form.anesthesia || '_________________________'}</span>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Diagnosis</h3>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div>
            <span className="font-bold text-gray-600">Pre-operative Diagnosis:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.preOperativeDiagnosis || '________________________________________'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Post-operative Diagnosis:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.postOperativeDiagnosis || '________________________________________'}</p>
          </div>
        </div>
      </div>

      {/* Procedure Information */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Procedure Information</h3>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div>
            <span className="font-bold text-gray-600">Procedure(s) Performed:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.proceduresPerformed || '________________________________________'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Indications for Surgery:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.indicationsForSurgery || '________________________________________'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Findings:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.findings || '________________________________________'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Description of Procedure:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.descriptionOfProcedure || '________________________________________'}</p>
          </div>
        </div>
      </div>

      {/* OT Charges Summary */}
      {form.otCharges?.length > 0 && (
        <div className="border border-gray-800 rounded-lg mb-4">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
            <h3 className="font-bold text-sm uppercase">OT Charges Summary</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2 text-sm text-gray-800">
              {form.otCharges.filter(c => c.isActive !== false).map((charge, i) => (
                <div key={i} className="py-1">
                  <span>{charge.chargeName}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Detailed pricing is not shown in the IPD module.
            </div>
          </div>
        </div>
      )}

      {/* Consent & Consultation Status */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Consent & Documentation Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Consent Form</p>
            <p className={`font-bold ${form.consent?.isConsentCompleted ? 'text-green-700' : 'text-red-700'}`}>
              {form.consent?.isConsentCompleted ? '✓ Completed' : '✗ Pending'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Consultation Form</p>
            <p className={`font-bold ${form.consultation?.isConsultationCompleted ? 'text-green-700' : 'text-red-700'}`}>
              {form.consultation?.isConsultationCompleted ? '✓ Completed' : '✗ Pending'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">OT Scheduling Status</p>
            <p className="font-bold text-gray-700">{form.schedulingStatus || 'Pending'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">OT Record Status</p>
            <p className="font-bold text-gray-700">{form.status || 'Draft'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 pt-4 mt-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Generated Date & Time</p>
            <p className="font-bold text-gray-700">{formattedDate} {formattedTime}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Generated By</p>
            <p className="font-bold text-gray-700">{user?.doctorName || user?.username || '________________'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-8">Doctor's Signature</p>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-500">Authorized Signatory</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-4">
          <div className="inline-block border border-gray-400 px-6 py-2">
            <p className="text-xs font-bold text-gray-500">HOSPITAL SEAL</p>
          </div>
        </div>
      </div>
    </div>
  );
};  

export default IpdOtForm;