import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, CheckCircle, FileText, Clock, User,
  CalendarDays, Stethoscope, Syringe, Pill, FlaskRound as Flask,
  FileSignature, ClipboardCheck, Scissors, IndianRupee,
  Printer, Upload, X, Save, Eye, Camera, AlertCircle,
  Building2, RefreshCw, Plus, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';
import { formatDate } from '../../utils/dateFormat';
import OtSchedulingModal from './OtSchedulingModal';
import OtConsentForm from './OtConsentForm';

const STEPS = {
  SCHEDULING: 1,
  CONSULTATION: 2,
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

  // Consultation form state
  const [consultationNotes, setConsultationNotes] = useState('');
  const [signedFile, setSignedFile] = useState(null);
  const [signedPreview, setSignedPreview] = useState(null);
  const [signedByName, setSignedByName] = useState('');
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const fileInputRef = useRef();

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
        setConsultationNotes(currentOtRecord.consultation.consultationNotes || '');
        setSignedByName(currentOtRecord.consultation.signatureSignedBy || '');
      }
    } catch (err) {
      toast.error('Failed to load patient data');
      navigate('/ipd/patients');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (patient?.patientName && !signedByName) {
      setSignedByName(patient.patientName);
    }
  }, [patient, signedByName]);

  // Determine current step
  const getCurrentStep = () => {
    if (!otRecord) return STEPS.SCHEDULING;
    if (otRecord.schedulingStatus !== 'Scheduled' && otRecord.schedulingStatus !== 'Completed') return STEPS.SCHEDULING;
    if (!otRecord.consultation?.isConsultationCompleted) return STEPS.CONSULTATION;
    if (!otRecord.otCharges || otRecord.otCharges.length === 0) return STEPS.CHARGES;
    if (!otRecord.pharmacyRequestSent) return STEPS.PHARMACY_REQUEST;
    if (otRecord.status === 'Completed' || otRecord.status === 'Completed Surgery' || otRecord.schedulingStatus === 'Completed') return STEPS.COMPLETED;
    return STEPS.ACTIVE;
  };

  const currentStep = getCurrentStep();

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

  // Handle signed consultation document upload
  const handleSignedFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }
    setSignedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setSignedPreview(event.target?.result);
    reader.readAsDataURL(file);
  };

  const handleSaveConsultation = async () => {
    if (!consultationNotes.trim()) { toast.error('Please enter consultation notes'); return; }
    if (!signedFile) { toast.error('Please upload the signed consultation form'); return; }
    if (!signedByName.trim()) { toast.error('Please enter the name of the person who signed'); return; }

    setSavingConsultation(true);
    try {
      const record = await ensureOtRecord();
      if (!record) return;

      // Upload signed document to Cloudinary
      setUploadingSigned(true);
      const reader = new FileReader();
      const fileData = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result);
        reader.readAsDataURL(signedFile);
      });

      const cloudRes = await client.post(`/ipd/ot/${record._id}/documents/upload`, {
        fileData,
        documentType: 'consultation_signature',
        fileName: `signed_consultation_${record._id}_${Date.now()}`
      });
      const uploadedDoc = cloudRes.data.document;

      // Save consultation form data
      const { data } = await client.put(`/ipd/ot/${record._id}/consultation`, {
        consultationNotes: consultationNotes.trim(),
        signatureFileUrl: uploadedDoc.fileUrl,
        signatureCloudinaryId: uploadedDoc.cloudinaryPublicId,
        signatureSignedBy: signedByName.trim()
      });

      setOtRecord(data.record);
      toast.success('Consultation form completed! You can now schedule OT.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save consultation');
    } finally {
      setUploadingSigned(false);
      setSavingConsultation(false);
    }
  };

  const handleScheduleSuccess = async (booking) => {
    if (otRecord?._id) {
      const { data: fullRecord } = await client.get(`/ipd/ot/${otRecord._id}/full`);
      setOtRecord(fullRecord);
    }
    toast.success('OT scheduled successfully! Charges can be configured by Admin.');
  };

  const handlePrintConsultation = () => {
    window.print();
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

  const patient = admission.patientId || {};
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
          { step: STEPS.SCHEDULING, label: 'Schedule OT', icon: CalendarDays },
          { step: STEPS.CONSULTATION, label: 'Consultation Form', icon: ClipboardCheck },
          { step: STEPS.CHARGES, label: 'OT Charges', icon: IndianRupee },
          { step: STEPS.PHARMACY_REQUEST, label: 'Pharmacy Request', icon: Pill },
          { step: STEPS.ACTIVE, label: 'OT Active', icon: Scissors },
          { step: STEPS.COMPLETED, label: 'Completed', icon: CheckCircle }
        ].map(({ step, label, icon: Icon }) => {
          const status = stepStatus(step);
          return (
            <div key={step} className={`p-3 rounded-xl border-2 flex items-center gap-2 ${
              status === 'completed' ? 'border-green-400 bg-green-50' :
              status === 'active' ? 'border-orange-400 bg-orange-50' :
              'border-gray-200 bg-white'
            }`}>
              <div className={`p-1.5 rounded-lg ${
                status === 'completed' ? 'bg-green-100' :
                status === 'active' ? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                <Icon className={`h-4 w-4 ${
                  status === 'completed' ? 'text-green-600' :
                  status === 'active' ? 'text-orange-600' : 'text-gray-400'
                }`} />
              </div>
              <span className={`text-xs font-bold truncate ${
                status === 'completed' ? 'text-green-700' :
                status === 'active' ? 'text-orange-700' : 'text-gray-500'
              }`}>{label}</span>
              {status === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-auto flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step Content: OT Scheduling */}
      {currentStep === STEPS.SCHEDULING && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <CalendarDays className="h-5 w-5 text-orange-600" />
            <h2 className="font-extrabold text-gray-900">Step 1: Schedule OT</h2>
          </div>
          <p className="text-sm text-gray-600">First, schedule the OT by selecting the room, date, and time slot.</p>

          {otRecord && (
            <OtSchedulingModal
              otRecord={otRecord}
              admissionId={id}
              onClose={() => {}}
              onScheduleSuccess={handleScheduleSuccess}
            />
          )}
        </div>
      )}

      {/* Step Content: Consultation Form */}
      {currentStep === STEPS.CONSULTATION && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            <h2 className="font-extrabold text-gray-900">Step 2: Consultation Form</h2>
          </div>

          {otRecord?.consultation?.isConsultationCompleted ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-700">Consultation Form Already Completed</h3>
              <p className="text-sm text-gray-600 mt-2">
                Signed by: {otRecord.consultation.signatureSignedBy} on {formatDate(otRecord.consultation.signatureSignedAt)}
              </p>
              {otRecord.consultation.signatureFileUrl && (
                <div className="mt-4">
                  <img src={otRecord.consultation.signatureFileUrl} alt="Signature" className="max-h-24 mx-auto border rounded" />
                </div>
              )}
              <div className="mt-6 flex gap-3 justify-center">
                <button onClick={handlePrintConsultation} className="btn-secondary"><Printer className="h-4 w-4" /> Print</button>
                <button onClick={loadData} className="btn"><RefreshCw className="h-4 w-4" /> Proceed to OT Charges</button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                Fill the consultation form, print it, get it signed by the patient/relative, and upload the signed copy.
              </div>

              {/* Consultation Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Consultation Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-y text-sm"
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Enter detailed pre-operative consultation notes, assessment, findings, and recommendations..."
                />
              </div>

              {/* Print Button */}
              <div>
                <button onClick={handlePrintConsultation} className="btn-secondary">
                  <Printer className="h-4 w-4" /> Print Consultation Form
                </button>
                <p className="text-xs text-gray-500 mt-1">Print the form, get it signed by patient/relative, then upload below.</p>
              </div>

              {/* Upload Signed Form */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Upload Signed Consultation Form <span className="text-red-500">*</span>
                </label>
                {signedPreview ? (
                  <div className="border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <img src={signedPreview} alt="Signed Form" className="max-h-40 object-contain border rounded bg-white" />
                        <p className="text-xs text-gray-500 mt-2">{signedFile?.name}</p>
                      </div>
                      <button onClick={() => { setSignedFile(null); setSignedPreview(null); }}
                        className="p-1 hover:bg-red-100 rounded text-red-600 ml-2"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50/30 hover:border-blue-500 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Click to upload signed form (PDF or image)</p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,image/*"
                      onChange={handleSignedFile} className="hidden" />
                  </div>
                )}
              </div>

              {/* Signed By */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Signed By (Patient/Relative Name) <span className="text-red-500">*</span>
                </label>
                <input type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  value={signedByName}
                  onChange={(e) => setSignedByName(e.target.value)}
                  placeholder="Enter the name of the person who signed the form"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleSaveConsultation} disabled={savingConsultation || uploadingSigned}
                  className="btn px-6 py-2.5 flex items-center gap-2">
                  {savingConsultation || uploadingSigned ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4" /> Save & Complete Consultation</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step Content: OT Charges (Pending Admin) */}
      {currentStep === STEPS.CHARGES && (
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
      {currentStep === STEPS.PHARMACY_REQUEST && (
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
      {currentStep === STEPS.ACTIVE && (
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
            <div><span className="font-bold text-gray-700">Scheduled Room:</span> {otRecord.otScheduling?.otId?.otName || 'N/A'}</div>
            <div><span className="font-bold text-gray-700">Surgery Date:</span> {otRecord.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleDateString('en-IN') : 'N/A'}</div>
            <div><span className="font-bold text-gray-700">Time Window:</span> {otRecord.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} - {otRecord.otScheduling?.scheduledEnd ? new Date(otRecord.otScheduling.scheduledEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
            <div><span className="font-bold text-gray-700">Surgeon:</span> Dr. {otRecord.surgeon || 'N/A'}</div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
            <button 
              onClick={handleMarkOtDone}
              className="btn bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-2.5 flex items-center gap-2 justify-center"
            >
              <CheckCircle className="h-5 w-5" /> Mark OT Done
            </button>
            <button 
              onClick={() => navigate(`/ipd/ot/${id}?otId=${otRecord._id}`)} 
              className="btn-secondary flex items-center gap-2 justify-center"
            >
              <FileText className="h-4 w-4" /> Open Operative Report / OT Form
            </button>
          </div>
        </div>
      )}

      {/* Step Content: Completed */}
      {currentStep === STEPS.COMPLETED && (
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
                      <div><span className="font-semibold">Status:</span> Completed</div>
                      <div><span className="font-semibold">Signed By:</span> {otRecord.consultation.signatureSignedBy || 'N/A'}</div>
                      <div><span className="font-semibold">Signed At:</span> {otRecord.consultation.signatureSignedAt ? formatDate(otRecord.consultation.signatureSignedAt) : 'N/A'}</div>
                      <div><span className="font-semibold">Notes:</span></div>
                      <div className="whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-800">{otRecord.consultation.consultationNotes || 'No notes available.'}</div>
                      {otRecord.consultation.signatureFileUrl && (
                        <div>
                          <span className="block text-sm font-semibold text-gray-900">Signed Document</span>
                          <img src={otRecord.consultation.signatureFileUrl} alt="Signed Consultation" className="max-h-40 w-full object-contain rounded-lg border mt-2" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      <div className="mb-2"><span className="font-semibold">Status:</span> Not completed</div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-gray-600">
                        Consultation notes, printed form, and signed document will appear here after completion.
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