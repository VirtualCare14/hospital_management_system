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
  Bed
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

        if (dischargeId) {
          const { data: disData } = await client.get(`/ipd/discharge/${dischargeId}`);
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

  const inputClass = (field) =>
    `input py-2.5 text-sm ${validationErrors[field] ? 'border-red-400 ring-1 ring-red-200' : ''} ${viewMode ? 'bg-gray-50' : ''}`;

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
      <div className="no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/ipd/patients')} className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {viewMode ? 'Discharge Summary (Read Only)' : 'Discharge Summary Form'}
            </h1>
            <p className="text-sm text-gray-500">
              IPD: {form.ipdNumber} | PID: {form.pidNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDischarged ? (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3" /> Discharged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3" /> {form.status === 'Completed' ? 'Completed' : 'Draft'}
              </span>
            )}
          </div>
        </div>

        {!viewMode && !isDischarged && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button onClick={handleCompleteDischarge} disabled={saving} className="btn text-sm py-2.5 px-4 flex items-center gap-2 bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Complete Discharge
            </button>
            <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
              <Eye className="h-4 w-4" /> {showPreview ? 'Hide Preview' : 'View Report'}
            </button>
          </div>
        )}

        {viewMode && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={handlePrint} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={handleDownloadPdf} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2">
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
              {renderDischargeReport(form, hospitalInfo, user)}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="grid gap-6 lg:grid-cols-2">
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
        {renderDischargeReport(form, hospitalInfo, user)}
      </div>

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
  );
};

const renderDischargeReport = (form, hospitalInfo, user) => {
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