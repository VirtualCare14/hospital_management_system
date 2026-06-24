import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, FileText, Calendar, Clock,
  User, Building2, Stethoscope, Syringe, Pill, FlaskRound as Flask,
  CheckCircle, Plus, Send, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const DoctorOtForm = () => {
  const { id } = useParams(); // admissionId
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const otRecordId = searchParams.get('otId');

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingReport, setSavingReport] = useState(false);
  const [sendingPharmacy, setSendingPharmacy] = useState(false);
  const [otRecord, setOtRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('report'); // 'consult', 'schedule', 'report', 'pharmacy'

  // Operative Report Form State
  const [reportForm, setReportForm] = useState({
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
    status: 'Draft'
  });

  // Pharmacy Request State
  const [reqMedicines, setReqMedicines] = useState([{ medicineName: '', dosage: '', quantity: 1, unit: 'nos' }]);
  const [reqConsumables, setReqConsumables] = useState([{ consumableName: '', quantity: 1, unit: 'nos' }]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: admissionData } = await client.get(`/ipd/patients/${id}`);
      setAdmission(admissionData);

      // Check for existing OT records
      const { data: otRecords } = await client.get(`/ipd/ot/admission/${id}`);
      let currentRecord = null;
      
      if (otRecordId) {
        const { data } = await client.get(`/ipd/ot/${otRecordId}/full`);
        currentRecord = data;
      } else if (otRecords && otRecords.length > 0) {
        const { data } = await client.get(`/ipd/ot/${otRecords[0]._id}/full`);
        currentRecord = data;
      }

      if (currentRecord) {
        setOtRecord(currentRecord);
        setReportForm({
          dateOfSurgery: currentRecord.dateOfSurgery ? new Date(currentRecord.dateOfSurgery).toISOString().split('T')[0] : '',
          surgeon: currentRecord.surgeon || '',
          assistantSurgeon: currentRecord.assistantSurgeon || '',
          anesthesia: currentRecord.anesthesia || '',
          preOperativeDiagnosis: currentRecord.preOperativeDiagnosis || '',
          postOperativeDiagnosis: currentRecord.postOperativeDiagnosis || '',
          proceduresPerformed: currentRecord.proceduresPerformed || '',
          indicationsForSurgery: currentRecord.indicationsForSurgery || '',
          findings: currentRecord.findings || '',
          descriptionOfProcedure: currentRecord.descriptionOfProcedure || '',
          status: currentRecord.status || 'Draft'
        });

        if (currentRecord.otMedicines && currentRecord.otMedicines.length > 0) {
          setReqMedicines(currentRecord.otMedicines);
        }
        if (currentRecord.otConsumables && currentRecord.otConsumables.length > 0) {
          setReqConsumables(currentRecord.otConsumables);
        }
      } else {
        toast.error('No scheduled OT record found for this patient.');
        navigate('/doctor/ot-patients');
      }
    } catch (err) {
      toast.error('Failed to load patient OT data');
      navigate('/doctor/ot-patients');
    } finally {
      setLoading(false);
    }
  }, [id, otRecordId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set doctor's name as default surgeon if empty
  useEffect(() => {
    if (user && !reportForm.surgeon) {
      setReportForm(prev => ({ ...prev, surgeon: user.doctorName || user.username || '' }));
    }
  }, [user, reportForm.surgeon]);

  const handleFieldChange = (field, val) => {
    setReportForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveReport = async (finalize = false) => {
    if (!otRecord) return;
    
    setSavingReport(true);
    try {
      const payload = {
        ...reportForm,
        status: finalize ? 'Completed' : 'Draft',
        dateOfSurgery: reportForm.dateOfSurgery ? new Date(reportForm.dateOfSurgery) : null
      };

      const { data } = await client.put(`/ipd/ot/${otRecord._id}`, payload);
      setOtRecord(data.record);
      setReportForm(prev => ({ ...prev, status: data.record.status }));
      toast.success(finalize ? 'Operative report completed successfully!' : 'Operative report draft saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save operative report');
    } finally {
      setSavingReport(false);
    }
  };

  // Pharmacy list row addition/modification
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
    if (!otRecord) return;

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

    if (filteredMeds.length === 0 && filteredCons.length === 0) {
      toast.error('Please request at least one medicine or consumable');
      return;
    }

    setSendingPharmacy(true);
    try {
      const { data } = await client.put(`/ipd/ot/${otRecord._id}`, {
        pharmacyRequestSent: true,
        otMedicines: filteredMeds,
        otConsumables: filteredCons,
        status: otRecord.status === 'Draft' || otRecord.status === 'Scheduled' ? 'In Progress' : otRecord.status
      });

      setOtRecord(data.record);
      setReqMedicines(data.record.otMedicines || []);
      setReqConsumables(data.record.otConsumables || []);
      toast.success('Pharmacy request sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send pharmacy request');
    } finally {
      setSendingPharmacy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-bold">Loading patient OT details...</span>
        </div>
      </div>
    );
  }

  if (!admission || !otRecord) return null;
  const patient = admission.patientId || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/doctor/ot-patients')} className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">OT Doctor Workspace</h1>
          <p className="text-sm text-gray-500">
            {patient.patientName} | UHID: {formatUhid(patient.uhid)} | IPD: {admission.ipdNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
            otRecord.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            Status: {otRecord.status}
          </span>
          {otRecord.pharmacyRequestSent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold">
              Pharmacy Req Sent
            </span>
          )}
        </div>
      </div>

      {/* Patient demographics summary */}
      <div className="bg-orange-50/30 border border-orange-100 rounded-2xl p-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700">
        <div><span className="font-semibold text-gray-500">Age/Sex:</span> {patient.age || otRecord.age || 'N/A'} Yrs / {patient.gender || 'N/A'}</div>
        <div><span className="font-semibold text-gray-500">Referred By:</span> {admission.referredDoctor?.doctorName || admission.referredDoctor?.username || 'Self'}</div>
        <div><span className="font-semibold text-gray-500">Consultant:</span> Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}</div>
        <div><span className="font-semibold text-gray-500">Bed:</span> {admission.bedId?.bedNumber || 'N/A'} ({admission.roomId?.roomType || 'N/A'})</div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-orange-100 select-none overflow-x-auto pb-px">
        {[
          { id: 'report', label: 'Operative Report', icon: FileText },
          { id: 'pharmacy', label: 'Pharmacy Request', icon: Pill },
          { id: 'consult', label: 'Informed Consent Form', icon: ClipboardCheck },
          { id: 'schedule', label: 'Scheduling Details', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-orange-500'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Consultation Consent View (Read-Only) */}
      {activeTab === 'consult' && (
        <div className="card p-6 bg-white shadow-sm border border-orange-100 space-y-4">
          <div className="flex items-center justify-between border-b border-orange-50 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{otRecord.consultation?.templateHeading || 'OT Consultation consent'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Template Name: {otRecord.consultation?.templateName || 'Manual'}</p>
            </div>
            {otRecord.consultation?.isConsultationCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">
                <CheckCircle className="h-3.5 w-3.5" /> Consent Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-bold">
                Pending Consent Form
              </span>
            )}
          </div>
          
          {otRecord.consultation?.isConsultationCompleted ? (
            <div
              className="prose prose-sm max-w-none text-gray-800 min-h-[150px] bg-gray-50/50 p-5 rounded-xl border border-gray-100"
              dangerouslySetInnerHTML={{ __html: otRecord.consultation?.consultationNotes }}
            />
          ) : (
            <p className="text-sm text-gray-500 py-6 text-center">No completed informed consent form exists on file for this patient.</p>
          )}

          {/* Uploaded Documents / Scheduling Images */}
          {otRecord.otDocuments && otRecord.otDocuments.length > 0 && (
            <div className="mt-6 border-t border-orange-100 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" />
                Uploaded Documents & Scheduling Images ({otRecord.otDocuments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {otRecord.otDocuments.map((doc, idx) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUrl || doc.fileName || '');
                  return (
                    <div key={idx} className="border border-orange-100 rounded-xl p-3 bg-gray-50/50 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        {isImage ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                            <img
                              src={doc.fileUrl}
                              alt={doc.fileName || 'OT Document'}
                              className="object-contain max-h-full max-w-full hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center text-gray-450 p-4 text-center">
                            <FileText className="h-8 w-8 text-orange-400 mb-1" />
                            <span className="text-xs font-semibold truncate w-full">{doc.fileName || 'Document File'}</span>
                          </div>
                        )}
                        <p className="text-xs font-medium text-gray-700 truncate">{doc.fileName}</p>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-center text-xs py-1.5 px-3 block font-bold cursor-pointer"
                      >
                        Open / Download
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Scheduling Details (Read-Only) */}
      {activeTab === 'schedule' && (
        <div className="card p-6 bg-white shadow-sm border border-orange-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-orange-50 pb-3">OT Scheduling Details</h2>
          {otRecord.otScheduling?.scheduledRoom ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <div className="flex items-start gap-3 p-4 bg-orange-50/20 border border-orange-100/50 rounded-xl">
                <Building2 className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Scheduled Room</h4>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {otRecord.otScheduling?.scheduledRoom?.otName || otRecord.otScheduling?.otId?.otName || (otRecord.otScheduling?.scheduledRoom ? 'Room Code: ' + (otRecord.otScheduling.scheduledRoom._id || otRecord.otScheduling.scheduledRoom) : 'N/A')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-50/20 border border-orange-100/50 rounded-xl">
                <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Date & Time</h4>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {otRecord.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" />
                    {otRecord.otScheduling?.scheduledStart ? new Date(otRecord.otScheduling.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} - {otRecord.otScheduling?.scheduledEnd ? new Date(otRecord.otScheduling.scheduledEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-6 text-center">No scheduling configuration is set against this record.</p>
          )}
        </div>
      )}

      {/* Tab Content: Operative Report (Editable) */}
      {activeTab === 'report' && (
        <div className="card p-6 bg-white shadow-sm border border-orange-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-orange-50 pb-3">
            <Stethoscope className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Operative Report Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Date of Surgery</label>
              <input
                type="date"
                className="input py-2.5 text-sm"
                value={reportForm.dateOfSurgery}
                onChange={(e) => handleFieldChange('dateOfSurgery', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Surgeon(s) <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input py-2.5 text-sm"
                value={reportForm.surgeon}
                onChange={(e) => handleFieldChange('surgeon', e.target.value)}
                placeholder="Lead Surgeon name(s)"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Assistant Surgeon(s)</label>
              <input
                type="text"
                className="input py-2.5 text-sm"
                value={reportForm.assistantSurgeon}
                onChange={(e) => handleFieldChange('assistantSurgeon', e.target.value)}
                placeholder="Assistant Surgeon name(s)"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Anesthesia</label>
              <input
                type="text"
                className="input py-2.5 text-sm"
                value={reportForm.anesthesia}
                onChange={(e) => handleFieldChange('anesthesia', e.target.value)}
                placeholder="Type of anesthesia (e.g. General, Local)"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Pre-operative Diagnosis</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.preOperativeDiagnosis}
                onChange={(e) => handleFieldChange('preOperativeDiagnosis', e.target.value)}
                placeholder="Pre-operative notes..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Post-operative Diagnosis</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.postOperativeDiagnosis}
                onChange={(e) => handleFieldChange('postOperativeDiagnosis', e.target.value)}
                placeholder="Post-operative notes..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Procedures Performed <span className="text-red-500">*</span></label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.proceduresPerformed}
                onChange={(e) => handleFieldChange('proceduresPerformed', e.target.value)}
                placeholder="Describe procedures performed..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Indications for Surgery</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.indicationsForSurgery}
                onChange={(e) => handleFieldChange('indicationsForSurgery', e.target.value)}
                placeholder="Indications..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Findings</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.findings}
                onChange={(e) => handleFieldChange('findings', e.target.value)}
                placeholder="Surgical findings..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Description of Procedure</label>
              <textarea
                className="input py-2 text-sm min-h-[140px]"
                value={reportForm.descriptionOfProcedure}
                onChange={(e) => handleFieldChange('descriptionOfProcedure', e.target.value)}
                placeholder="Provide detailed description of the surgery steps..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-orange-50 pt-4">
            <button
              onClick={() => handleSaveReport(false)}
              disabled={savingReport}
              className="btn-secondary text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer"
            >
              {savingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={() => handleSaveReport(true)}
              disabled={savingReport || otRecord.status === 'Completed'}
              className="btn text-sm py-2.5 px-6 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              Finalize & Complete Report
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Pharmacy Request (Editable) */}
      {activeTab === 'pharmacy' && (
        <div className="card p-6 bg-white shadow-sm border border-orange-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-orange-50 pb-3">
            <Pill className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Request Pharmacy Materials</h2>
          </div>
          <p className="text-xs text-gray-500">Request surgical medicines and clinical consumables for the procedure directly from the pharmacy.</p>

          <div className="space-y-4">
            {/* Medicines List */}
            <div className="border border-orange-100/50 rounded-2xl p-4 bg-orange-50/10 space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-orange-500" />
                Medicines Requested
              </h3>
              <div className="space-y-2">
                {reqMedicines.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      disabled={otRecord.pharmacyRequestSent}
                      className="input text-xs py-2 bg-white"
                      value={item.medicineName}
                      onChange={(e) => updateReqMed(index, 'medicineName', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      disabled={otRecord.pharmacyRequestSent}
                      className="input text-xs py-2 bg-white"
                      value={item.dosage}
                      onChange={(e) => updateReqMed(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      disabled={otRecord.pharmacyRequestSent}
                      className="input text-xs py-2 bg-white"
                      value={item.quantity}
                      onChange={(e) => updateReqMed(index, 'quantity', e.target.value)}
                    />
                    {!otRecord.pharmacyRequestSent && (
                      <button
                        type="button"
                        onClick={() => removeReqMed(index)}
                        className="text-xs text-red-600 hover:text-red-800 text-left font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {!otRecord.pharmacyRequestSent && (
                  <button
                    type="button"
                    onClick={addReqMedRow}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add Medicine Row
                  </button>
                )}
              </div>
            </div>

            {/* Consumables List */}
            <div className="border border-orange-100/50 rounded-2xl p-4 bg-orange-50/10 space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Flask className="h-4 w-4 text-orange-500" />
                Consumables Requested
              </h3>
              <div className="space-y-2">
                {reqConsumables.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Consumable Name"
                      disabled={otRecord.pharmacyRequestSent}
                      className="input text-xs py-2 bg-white"
                      value={item.consumableName}
                      onChange={(e) => updateReqCon(index, 'consumableName', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      disabled={otRecord.pharmacyRequestSent}
                      className="input text-xs py-2 bg-white"
                      value={item.quantity}
                      onChange={(e) => updateReqCon(index, 'quantity', e.target.value)}
                    />
                    {!otRecord.pharmacyRequestSent && (
                      <button
                        type="button"
                        onClick={() => removeReqCon(index)}
                        className="text-xs text-red-600 hover:text-red-800 text-left font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {!otRecord.pharmacyRequestSent && (
                  <button
                    type="button"
                    onClick={addReqConRow}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add Consumable Row
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-orange-50 pt-4">
            {otRecord.pharmacyRequestSent ? (
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                <CheckCircle className="h-4 w-4" />
                Pharmacy Request Sent & Confirmed
              </div>
            ) : (
              <button
                onClick={handleSendPharmacyRequest}
                disabled={sendingPharmacy}
                className="btn px-6 py-2.5 flex items-center gap-2 cursor-pointer font-bold"
              >
                {sendingPharmacy ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Request to Pharmacy</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorOtForm;
