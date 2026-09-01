import { useEffect, useState } from 'react';
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
  AlertCircle,
  UserCircle,
  Phone,
  Building2,
  Bed,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const IpdDischargeForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const dischargeId = searchParams.get('dischargeId');
  const viewMode = searchParams.get('view') === 'true';

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dischargeRecord, setDischargeRecord] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const { data } = await client.get('/ipd/discharge/reviewers');
        setReviewers(data);
      } catch (err) {
        console.warn('Failed to load discharge reviewers:', err);
      }
    };
    fetchReviewers();
  }, []);

  const [form, setForm] = useState({
    admissionId: id || '',
    patientId: '',
    uhid: '',
    pidNumber: '',
    ipdNumber: '',
    patientName: '',
    admissionDate: '',
    reason: '',
    diagnosisAtInternment: '',
    treatmentSummary: '',
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    physicianApproval: '',
    dischargeReason: '',
    otherDischargeReason: '',
    futureTreatmentRequired: '',
    medicationPrescribed: '',
    dischargingPhysicianTitle: '',
    dischargingPhysicianFirstName: '',
    dischargingPhysicianMiddleName: '',
    dischargingPhysicianLastName: '',
    dischargingPhysicianInitials: '',
    status: 'Draft'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: admissionData } = await client.get(`/ipd/patients/${id}`);
        setAdmission(admissionData);

        try {
          const { data: hospitalData } = await client.get('/ipd/ot/hospital-info');
          setHospitalInfo(hospitalData);
        } catch (err) {
          console.warn('Could not load hospital info:', err);
        }

        const patient = admissionData.patientId || {};

        // Build doctor name parts
        const doctorName = admissionData.doctorInCharge?.doctorName || admissionData.doctorInCharge?.username || '';
        const nameParts = doctorName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const initials = nameParts.map(n => n.charAt(0).toUpperCase()).join('').slice(0, 3);

        let activeDischargeId = dischargeId;
        if (!activeDischargeId) {
          try {
            const { data: disList } = await client.get(`/ipd/discharge/admission/${id}`);
            if (disList && disList.length > 0) {
              activeDischargeId = disList[0]._id;
            }
          } catch (err) {
            console.warn('Could not load existing discharge records', err);
          }
        }

        if (activeDischargeId) {
          const { data: disData } = await client.get(`/ipd/discharge/${activeDischargeId}`);
          setDischargeRecord(disData);
          setForm({
            admissionId: id,
            patientId: patient._id || '',
            uhid: disData.uhid || patient.uhid || '',
            pidNumber: disData.pidNumber || admissionData.pidNumber || '',
            ipdNumber: disData.ipdNumber || admissionData.ipdNumber || '',
            patientName: disData.patientName || patient.patientName || '',
            admissionDate: disData.admissionDate
              ? new Date(disData.admissionDate).toISOString().split('T')[0]
              : (admissionData.admissionDate ? new Date(admissionData.admissionDate).toISOString().split('T')[0] : ''),
            reason: disData.reason || '',
            diagnosisAtInternment: disData.diagnosisAtInternment || admissionData.provisionalDiagnosis || '',
            treatmentSummary: disData.treatmentSummary || '',
            dischargeDate: disData.dischargeDate
              ? new Date(disData.dischargeDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            dischargeTime: disData.dischargeTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            physicianApproval: disData.physicianApproval || '',
            dischargeReason: disData.dischargeReason || '',
            otherDischargeReason: disData.otherDischargeReason || '',
            futureTreatmentRequired: disData.futureTreatmentRequired || '',
            medicationPrescribed: disData.medicationPrescribed || '',
            dischargingPhysicianTitle: disData.dischargingPhysicianTitle || 'Dr.',
            dischargingPhysicianFirstName: disData.dischargingPhysicianFirstName || firstName,
            dischargingPhysicianMiddleName: disData.dischargingPhysicianMiddleName || '',
            dischargingPhysicianLastName: disData.dischargingPhysicianLastName || lastName,
            dischargingPhysicianInitials: disData.dischargingPhysicianInitials || initials,
            status: disData.status || 'Draft'
          });
        } else {
          setForm(prev => ({
            ...prev,
            patientId: patient._id || '',
            uhid: patient.uhid || '',
            pidNumber: admissionData.pidNumber || '',
            ipdNumber: admissionData.ipdNumber || '',
            patientName: patient.patientName || '',
            admissionDate: admissionData.admissionDate ? new Date(admissionData.admissionDate).toISOString().split('T')[0] : '',
            diagnosisAtInternment: admissionData.provisionalDiagnosis || '',
            dischargingPhysicianTitle: 'Dr.',
            dischargingPhysicianFirstName: firstName,
            dischargingPhysicianMiddleName: '',
            dischargingPhysicianLastName: lastName,
            dischargingPhysicianInitials: initials
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
  }, [id, dischargeId, navigate]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (isFinalize = false) => {
    const errors = {};
    if (isFinalize) {
      if (!form.physicianApproval) errors.physicianApproval = 'Physician approval is required';
      if (!form.dischargeReason) errors.dischargeReason = 'Discharge reason is required';
      if (form.dischargeReason === 'Other' && !form.otherDischargeReason?.trim())
        errors.otherDischargeReason = 'Please specify the discharge reason';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate(false)) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        admissionId: id,
        admissionDate: form.admissionDate ? new Date(form.admissionDate) : null,
        dischargeDate: form.dischargeDate ? new Date(form.dischargeDate) : new Date(),
        status: 'Draft'
      };

      if (dischargeRecord?._id) {
        await client.put(`/ipd/discharge/${dischargeRecord._id}`, payload);
        toast.success('Discharge draft saved');
      } else {
        const { data } = await client.post('/ipd/discharge', payload);
        toast.success('Discharge draft saved');
        if (data?.record?._id) {
          navigate(`/ipd/discharge/${id}?dischargeId=${data.record._id}`, { replace: true });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteDischarge = async () => {
    if (!validate(true)) {
      toast.error('Please complete all required fields');
      return;
    }

    if (!window.confirm('Are you sure you want to discharge this patient? This action will free the bed and change the patient status to Discharged.')) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        admissionId: id,
        admissionDate: form.admissionDate ? new Date(form.admissionDate) : null,
        dischargeDate: form.dischargeDate ? new Date(form.dischargeDate) : new Date(),
        dischargeId: dischargeRecord?._id || undefined
      };

      await client.post('/ipd/discharge/complete', payload);
      toast.success('Patient discharged successfully');
      navigate(`/ipd/patient/${id}?tab=patient-info`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete discharge');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async (e) => {
    if (e) e.preventDefault();
    if (!selectedReviewer) {
      toast.error('Please select a doctor to review');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        ...form,
        admissionId: id,
        admissionDate: form.admissionDate ? new Date(form.admissionDate) : null,
        dischargeDate: form.dischargeDate ? new Date(form.dischargeDate) : new Date()
      };
      
      let currentDischargeId = dischargeRecord?._id || form._id;
      if (!currentDischargeId) {
        const { data } = await client.post('/ipd/discharge', payload);
        currentDischargeId = data.record._id;
      } else {
        await client.put(`/ipd/discharge/${currentDischargeId}`, payload);
      }

      await client.post('/ipd/discharge/submit-review', {
        dischargeId: currentDischargeId,
        reviewerId: selectedReviewer
      });

      toast.success('Discharge summary submitted to doctor for review');
      setShowSubmitModal(false);
      navigate(`/ipd/patient/${id}?tab=discharge-records`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!dischargeRecord && !form._id) {
      toast.error('Save the record first');
      return;
    }
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!dischargeRecord && !form._id) {
      toast.error('Save the record first');
      return;
    }
    toast.success('Use browser Print → Save as PDF');
    window.print();
  };

  const isEffectiveViewMode = viewMode || form.status === 'Pending Review' || form.status === 'Completed';
  const isEditable = !viewMode && (form.status === 'Draft' || form.status === 'Rejected');

  const inputClass = (field) =>
    `input py-2.5 text-sm ${validationErrors[field] ? 'border-red-400 ring-1 ring-red-200' : ''} ${isEffectiveViewMode ? 'bg-gray-50' : ''}`;

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

  const patient = admission.patientId || {};
  const isDischarged = admission.status === 'Discharged' || form.status === 'Completed';

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header - Hidden when printing */}
      <div className="no-print space-y-4">
        {form.status === 'Rejected' && dischargeRecord?.rejectionRemarks && (
          <div className="card p-4 border border-red-200 bg-red-50 flex items-start gap-3">
            <AlertCircle className="text-red-650 h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-red-800 text-xs uppercase tracking-wider">Sent Back by Doctor</h4>
              <p className="text-xs text-red-700 mt-1 font-semibold">Remark: "{dischargeRecord.rejectionRemarks}"</p>
              <p className="text-[10px] text-red-500 mt-0.5">Please update the discharge summary fields below and re-submit for review.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 border border-orange-100 rounded-3xl">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/ipd/patient/${id}?tab=discharge-records`)} className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                {isEffectiveViewMode ? 'Discharge Summary (Read Only)' : 'Discharge Summary Form'}
              </h1>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">
                IPD: {form.ipdNumber} | PID: {form.pidNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {form.status === 'Completed' ? (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="h-3 w-3" /> Discharged
              </span>
            ) : form.status === 'Pending Review' ? (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Clock className="h-3 w-3 animate-pulse" /> Pending Review
              </span>
            ) : form.status === 'Rejected' ? (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                <AlertCircle className="h-3 w-3" /> Sent Back
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                <Clock className="h-3 w-3" /> Draft
              </span>
            )}
          </div>
        </div>

        {isEditable && (
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button onClick={() => setShowSubmitModal(true)} disabled={saving} className="btn text-sm py-2 px-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Submit for Review
            </button>
            <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
              <Eye className="h-4 w-4" /> {showPreview ? 'Hide Preview' : 'View Report'}
            </button>
          </div>
        )}

        {form.status === 'Completed' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={handlePrint} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={handleDownloadPdf} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Report Preview */}
      {showPreview && (dischargeRecord || form._id) && (
        <div className="no-print mb-6">
          <div className="card p-6 border-2 border-blue-200 bg-blue-50/20">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <FileText className="h-5 w-5" />
              <h3 className="font-extrabold">Discharge Summary Preview</h3>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg print:shadow-none">
              {renderDischargeReport(form, hospitalInfo, user, dischargeRecord)}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="grid gap-6 lg:grid-cols-2 no-print">
        {/* Patient & Admission Information */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <UserCircle className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Patient & Admission Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Patient Name</label>
              <input type="text" className={inputClass()} value={form.patientName} readOnly={viewMode}
                onChange={(e) => handleChange('patientName', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">UHID</label>
              <input type="text" className="input py-2.5 text-sm font-mono bg-gray-50" value={formatUhid(form.uhid)} readOnly />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Admission Date</label>
              <input type="date" className="input py-2.5 text-sm bg-gray-50" value={form.admissionDate} readOnly />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Reason for Admission</label>
              <textarea className="input py-2.5 text-sm min-h-[60px] resize-y" value={form.reason}
                readOnly={viewMode} onChange={(e) => handleChange('reason', e.target.value)}
                placeholder="Reason for admission..." />
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <Stethoscope className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Diagnosis Information</h3>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Diagnosis at Internment</label>
            <textarea className="input py-2.5 text-sm min-h-[80px] resize-y" value={form.diagnosisAtInternment}
              readOnly={viewMode} onChange={(e) => handleChange('diagnosisAtInternment', e.target.value)}
              placeholder="Diagnosis at time of internment..." />
          </div>
        </div>

        {/* Treatment Information */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <FileText className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Treatment Information</h3>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Treatment Taken / Treatment Summary</label>
            <textarea className="input py-2.5 text-sm min-h-[120px] resize-y" value={form.treatmentSummary}
              readOnly={viewMode} onChange={(e) => handleChange('treatmentSummary', e.target.value)}
              placeholder="Detailed treatment summary..." />
          </div>
        </div>

        {/* Discharge Information */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Discharge Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Date Discharged</label>
              <input type="date" className="input py-2.5 text-sm" value={form.dischargeDate}
                readOnly={viewMode} onChange={(e) => handleChange('dischargeDate', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Time Discharged</label>
              <input type="time" className="input py-2.5 text-sm" value={form.dischargeTime}
                readOnly={viewMode} onChange={(e) => handleChange('dischargeTime', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Physician Approval <span className="text-red-500">*</span>
              </label>
              <select className={inputClass('physicianApproval')} value={form.physicianApproval}
                disabled={viewMode} onChange={(e) => handleChange('physicianApproval', e.target.value)}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {validationErrors.physicianApproval && <p className="text-xs text-red-500 mt-1">{validationErrors.physicianApproval}</p>}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Reason for Discharge <span className="text-red-500">*</span>
              </label>
              <select className={inputClass('dischargeReason')} value={form.dischargeReason}
                disabled={viewMode} onChange={(e) => handleChange('dischargeReason', e.target.value)}>
                <option value="">Select...</option>
                <option value="Patient Deceased">Patient Deceased</option>
                <option value="Patient Treated">Patient Treated</option>
                <option value="Patient Transferred">Patient Transferred</option>
                <option value="Patient Left Against Advice">Patient Left Against Advice</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.dischargeReason && <p className="text-xs text-red-500 mt-1">{validationErrors.dischargeReason}</p>}
            </div>
            {form.dischargeReason === 'Other' && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Specify Other Reason <span className="text-red-500">*</span>
                </label>
                <input type="text" className={inputClass('otherDischargeReason')} value={form.otherDischargeReason}
                  readOnly={viewMode} onChange={(e) => handleChange('otherDischargeReason', e.target.value)}
                  placeholder="Please specify..." />
                {validationErrors.otherDischargeReason && <p className="text-xs text-red-500 mt-1">{validationErrors.otherDischargeReason}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Additional Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Future Treatment Needed</label>
              <select className="input py-2.5 text-sm" value={form.futureTreatmentRequired}
                disabled={viewMode} onChange={(e) => handleChange('futureTreatmentRequired', e.target.value)}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Was Patient Prescribed Medication?</label>
              <select className="input py-2.5 text-sm" value={form.medicationPrescribed}
                disabled={viewMode} onChange={(e) => handleChange('medicationPrescribed', e.target.value)}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Discharging Physician */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <User className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900">Discharging Physician</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Title</label>
              <input type="text" className="input py-2.5 text-sm" value={form.dischargingPhysicianTitle}
                readOnly={viewMode} onChange={(e) => handleChange('dischargingPhysicianTitle', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">First Name</label>
              <input type="text" className="input py-2.5 text-sm" value={form.dischargingPhysicianFirstName}
                readOnly={viewMode} onChange={(e) => handleChange('dischargingPhysicianFirstName', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Middle Name</label>
              <input type="text" className="input py-2.5 text-sm" value={form.dischargingPhysicianMiddleName}
                readOnly={viewMode} onChange={(e) => handleChange('dischargingPhysicianMiddleName', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Last Name</label>
              <input type="text" className="input py-2.5 text-sm" value={form.dischargingPhysicianLastName}
                readOnly={viewMode} onChange={(e) => handleChange('dischargingPhysicianLastName', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Initials</label>
              <input type="text" className="input py-2.5 text-sm" value={form.dischargingPhysicianInitials}
                readOnly={viewMode} onChange={(e) => handleChange('dischargingPhysicianInitials', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Print-only Discharge Summary */}
      <div className="hidden print:block">
        {renderDischargeReport(form, hospitalInfo, user, dischargeRecord)}
      </div>

      {/* Submit for Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-orange-50 pb-3">
              <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <Clock className="text-orange-500 h-5 w-5" />
                Submit for Physician Review
              </h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForReview} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Select Doctor / SDC Operator</label>
                <select 
                  className="input py-2 text-xs" 
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                  required
                >
                  <option value="">-- Choose Reviewer --</option>
                  {reviewers.map((rev) => (
                    <option key={rev._id} value={rev._id}>
                      {rev.name} ({rev.role === 'doctor' ? 'Doctor' : rev.role === 'admin' ? 'Admin / Consultant' : 'Nursing'}) {rev.department && `| Dept: ${rev.department}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-orange-50 pt-4">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-secondary text-xs py-2 px-4 cursor-pointer">Cancel</button>
                <button type="submit" className="btn text-xs py-2 px-4 cursor-pointer bg-indigo-600 hover:bg-indigo-700">
                  Send Review Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Printable Discharge Summary Container for window.print() */}
      <div id="ipd-discharge-print-container" className="hidden print:block bg-white w-full max-w-[210mm] mx-auto p-2 text-gray-900">
        {renderDischargeReport(form, hospitalInfo, user, dischargeRecord)}
      </div>
    </div>
  );
};

const renderDischargeReport = (form, hospitalInfo, user, dischargeRecord) => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const physicianName = [
    form.dischargingPhysicianFirstName,
    form.dischargingPhysicianMiddleName,
    form.dischargingPhysicianLastName
  ].filter(Boolean).join(' ');

  const physicianDisplay = form.dischargingPhysicianTitle
    ? `${form.dischargingPhysicianTitle}. ${physicianName}${form.dischargingPhysicianInitials ? ` (${form.dischargingPhysicianInitials})` : ''}`
    : physicianName;

  return (
    <div className="p-8 text-gray-900">
      {/* Hospital Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          {hospitalInfo?.logoUrl && (
            <img src={hospitalInfo.logoUrl} alt="Hospital Logo" className="h-16 w-16 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }} />
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
        <h2 className="text-lg font-black uppercase tracking-wide text-gray-900">DISCHARGE SUMMARY</h2>
      </div>

      {/* Patient & Admission */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Patient & Admission Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 text-sm">
          <div className="flex"><span className="font-bold text-gray-600 w-36">Patient Name:</span><span className="text-gray-900">{form.patientName || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-32">UHID:</span><span className="text-gray-900 font-mono">{formatUhid(form.uhid) || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-36">PID Number:</span><span className="text-gray-900 font-mono">{form.pidNumber || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-32">IPD Number:</span><span className="text-gray-900 font-mono">{form.ipdNumber || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-36">Date Admitted:</span><span className="text-gray-900">{form.admissionDate ? new Date(form.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-32">Reason:</span><span className="text-gray-900">{form.reason || '_________________________'}</span></div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Diagnosis Information</h3>
        </div>
        <div className="p-4 text-sm">
          <span className="font-bold text-gray-600">Diagnosis at Internment:</span>
          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.diagnosisAtInternment || '________________________________________'}</p>
        </div>
      </div>

      {/* Treatment */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Treatment Information</h3>
        </div>
        <div className="p-4 text-sm">
          <span className="font-bold text-gray-600">Treatment Taken / Summary:</span>
          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.treatmentSummary || '________________________________________'}</p>
        </div>
      </div>

      {/* Discharge Information */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Discharge Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 text-sm">
          <div className="flex"><span className="font-bold text-gray-600 w-36">Date Discharged:</span><span className="text-gray-900">{form.dischargeDate ? new Date(form.dischargeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-36">Time Discharged:</span><span className="text-gray-900">{form.dischargeTime || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-36">Physician Approval:</span><span className="text-gray-900">{form.physicianApproval || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-36">Discharge Reason:</span><span className="text-gray-900">{form.dischargeReason === 'Other' ? form.otherDischargeReason : form.dischargeReason || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-36">Future Treatment:</span><span className="text-gray-900">{form.futureTreatmentRequired || '_________________________'}</span></div>
          <div className="flex"><span className="font-bold text-gray-600 w-36">Medication Prescribed:</span><span className="text-gray-900">{form.medicationPrescribed || '_________________________'}</span></div>
        </div>
      </div>

      {/* Discharge Prescription */}
      {dischargeRecord?.dischargePrescription?.length > 0 && (
        <div className="border border-gray-800 rounded-lg mb-4">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
            <h3 className="font-bold text-sm uppercase">Discharge Prescription</h3>
          </div>
          <div className="p-4 text-xs font-semibold">
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300 text-[10px] uppercase font-bold text-gray-500">
                  <th className="p-2 border-r border-gray-300">Medicine Name</th>
                  <th className="p-2 border-r border-gray-300">Dosage</th>
                  <th className="p-2 border-r border-gray-300">Frequency</th>
                  <th className="p-2 border-r border-gray-300">Duration</th>
                  <th className="p-2">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {dischargeRecord.dischargePrescription.map((m, idx) => (
                  <tr key={idx} className="border-b border-gray-300 text-gray-700">
                    <td className="p-2 border-r border-gray-300 font-bold">{m.medicineName}</td>
                    <td className="p-2 border-r border-gray-300">{m.dosage || 'N/A'}</td>
                    <td className="p-2 border-r border-gray-300">{m.frequency || 'N/A'}</td>
                    <td className="p-2 border-r border-gray-300">{m.duration || 'N/A'}</td>
                    <td className="p-2 italic">{m.remarks || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Physician */}
      <div className="border border-gray-800 rounded-lg mb-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-800">
          <h3 className="font-bold text-sm uppercase">Discharging Physician</h3>
        </div>
        <div className="p-4 text-sm">
          <span className="font-bold text-gray-600">Physician:</span>
          <span className="ml-2 text-gray-900">{physicianDisplay || '_________________________'}</span>
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

export default IpdDischargeForm;