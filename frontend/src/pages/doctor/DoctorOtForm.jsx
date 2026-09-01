import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, FileText, Calendar, Clock,
  User, Building2, Stethoscope, Syringe, Pill, FlaskRound as Flask,
  CheckCircle, Plus, Send, ClipboardCheck, Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const getStatusBadgeText = (status) => {
  switch (status) {
    case 'Issued':
      return 'Pharmacy Sent Medicine';
    case 'Remaining Items Issued':
      return 'Pharmacy Sent Medicine (Remaining)';
    case 'Return Requested':
      return 'Return Requested (Pending Acceptance)';
    case 'Return Accepted':
      return 'Return Accepted (Added to Stock)';
    case 'Return Rejected':
      return 'Return Rejected';
    case 'Pending':
      return 'Pending Review';
    default:
      return status;
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-250';
    case 'Approved':
    case 'Partially Approved':
      return 'bg-orange-100 text-orange-850 border border-orange-200';
    case 'Issued':
    case 'Remaining Items Issued':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'Return Requested':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'Return Accepted':
    case 'Completed':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'Return Rejected':
    case 'Rejected':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

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
    anesthesiaName: '',
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
  const [pharmacyMedsList, setPharmacyMedsList] = useState([]);
  const [consumablesList, setConsumablesList] = useState([]);
  const [pharmacyRequests, setPharmacyRequests] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const isReportCompleted = otRecord?.status === 'Completed';

  const loadHospitalInfo = useCallback(async () => {
    try {
      const { data } = await client.get('/ipd/ot/hospital-info');
      setHospitalInfo(data);
    } catch (err) {
      console.warn('Could not load hospital info for printing:', err.message);
    }
  }, []);

  const loadPharmacyMeds = useCallback(async () => {
    try {
      const { data } = await client.get('/pharmacy/inventory?limit=1000');
      const uniqueNames = [...new Set(data.items.map(item => item.itemName))];
      setPharmacyMedsList(uniqueNames);
    } catch (err) {
      console.warn('Could not load pharmacy inventory for searching:', err.message);
    }
  }, []);

  const loadConsumables = useCallback(async () => {
    try {
      const { data } = await client.get('/ipd/settings');
      if (data?.consumableServices) {
        setConsumablesList(data.consumableServices.filter(s => s.isActive).map(s => s.name));
      }
    } catch (err) {
      console.warn('Could not load consumable settings for searching:', err.message);
    }
  }, []);

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
          anesthesiaName: currentRecord.anesthesiaName || '',
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

        // Fetch pharmacy requests for this admission
        try {
          const { data: reqs } = await client.get(`/pharmacy/requests?admissionId=${id}`);
          setPharmacyRequests(reqs || []);
        } catch (err) {
          console.warn('Could not load pharmacy requests:', err.message);
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

  const refreshPharmacyRequests = useCallback(async () => {
    try {
      const { data: reqs } = await client.get(`/pharmacy/requests?admissionId=${id}`);
      setPharmacyRequests(reqs || []);
    } catch (err) {
      console.warn('Could not load pharmacy requests:', err.message);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    loadPharmacyMeds();
    loadConsumables();
    loadHospitalInfo();
  }, [loadData, loadPharmacyMeds, loadConsumables, loadHospitalInfo]);

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

  const handleOpenReturnForm = (req) => {
    setShowReturnModal(req);
    // Initialize return quantities
    const items = req.items.map(item => ({
      itemName: item.itemName,
      issuedQty: item.issuedQty,
      usedQty: item.issuedQty, // default all used
      unusedQty: 0,
      damagedQty: 0
    }));
    setReturnFormItems(items);
  };

  const handleUpdateReturnItem = (idx, field, val) => {
    const next = returnFormItems.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: Number(val) || 0 };
      }
      return item;
    });
    setReturnFormItems(next);
  };

  const handleSubmitReturn = async () => {
    if (!showReturnModal) return;
    
    // Validation
    for (const item of returnFormItems) {
      if (item.usedQty + item.unusedQty + item.damagedQty !== item.issuedQty) {
        toast.error(`For ${item.itemName}, Used + Unused + Damaged must equal Issued (${item.issuedQty})`);
        return;
      }
    }

    setSubmittingReturn(true);
    try {
      await client.post(`/pharmacy/requests/${showReturnModal._id}/consume`, {
        items: returnFormItems
      });
      toast.success('Consumption & Return request recorded successfully!');
      setShowReturnModal(null);
      refreshPharmacyRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit returns');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleDismissNotification = async (reqId) => {
    try {
      await client.post(`/pharmacy/requests/${reqId}/dismiss-notification`);
      refreshPharmacyRequests();
      toast.success('Notification dismissed');
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
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
      {/* Return Notifications */}
      {pharmacyRequests
        .filter((r) => r.status === 'Return Accepted' && !r.doctorNotifiedOfReturn)
        .map((noti) => (
          <div key={noti._id} className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-green-500 text-white font-extrabold text-sm">🔔</span>
              <div>
                <p className="text-sm font-bold text-green-800">Medicines Added Back to Stock</p>
                <p className="text-xs text-green-600 font-medium">
                  Unused medicines from Pharmacy Request <strong>#{noti.requestNumber}</strong> have been accepted by the pharmacy and added back to inventory stock!
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleDismissNotification(noti._id)} 
              className="text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 py-1.5 px-3 rounded-lg border border-green-300 cursor-pointer"
            >
              Acknowledge & Dismiss
            </button>
          </div>
        ))}
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
                disabled={isReportCompleted}
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
                disabled={isReportCompleted}
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
                disabled={isReportCompleted}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Anesthesia Name</label>
              <input
                type="text"
                className="input py-2.5 text-sm"
                value={reportForm.anesthesiaName}
                onChange={(e) => handleFieldChange('anesthesiaName', e.target.value)}
                placeholder="Name of Anesthesiologist"
                disabled={isReportCompleted}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Anesthesia Type</label>
              <input
                type="text"
                className="input py-2.5 text-sm"
                value={reportForm.anesthesia}
                onChange={(e) => handleFieldChange('anesthesia', e.target.value)}
                placeholder="Type of anesthesia (e.g. General, Local)"
                disabled={isReportCompleted}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Pre-operative Diagnosis</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.preOperativeDiagnosis}
                onChange={(e) => handleFieldChange('preOperativeDiagnosis', e.target.value)}
                placeholder="Pre-operative notes..."
                disabled={isReportCompleted}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Post-operative Diagnosis</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.postOperativeDiagnosis}
                onChange={(e) => handleFieldChange('postOperativeDiagnosis', e.target.value)}
                placeholder="Post-operative notes..."
                disabled={isReportCompleted}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Procedures Performed <span className="text-red-500">*</span></label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.proceduresPerformed}
                onChange={(e) => handleFieldChange('proceduresPerformed', e.target.value)}
                placeholder="Describe procedures performed..."
                disabled={isReportCompleted}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Indications for Surgery</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.indicationsForSurgery}
                onChange={(e) => handleFieldChange('indicationsForSurgery', e.target.value)}
                placeholder="Indications..."
                disabled={isReportCompleted}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Findings</label>
              <textarea
                className="input py-2 text-sm min-h-[80px]"
                value={reportForm.findings}
                onChange={(e) => handleFieldChange('findings', e.target.value)}
                placeholder="Surgical findings..."
                disabled={isReportCompleted}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Description of Procedure</label>
              <textarea
                className="input py-2 text-sm min-h-[140px]"
                value={reportForm.descriptionOfProcedure}
                onChange={(e) => handleFieldChange('descriptionOfProcedure', e.target.value)}
                placeholder="Provide detailed description of the surgery steps..."
                disabled={isReportCompleted}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-orange-50 pt-4">
            {isReportCompleted && (
              <button
                onClick={() => window.print()}
                className="btn bg-orange-600 hover:bg-orange-700 text-sm py-2.5 px-6 flex items-center gap-2 cursor-pointer print:hidden"
              >
                <Printer className="h-4 w-4" />
                Print Operative Report
              </button>
            )}
            <button
              onClick={() => handleSaveReport(false)}
              disabled={savingReport || isReportCompleted}
              className="btn-secondary text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={() => handleSaveReport(true)}
              disabled={savingReport || isReportCompleted}
              className="btn text-sm py-2.5 px-6 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                      list="ot-medicines-datalist"
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
                <datalist id="ot-medicines-datalist">
                  {pharmacyMedsList
                    .filter(m => {
                      const matches = reqMedicines.some(rm => {
                        const q = (rm.medicineName || '').trim().toLowerCase();
                        return q && m.toLowerCase().includes(q);
                      });
                      return matches;
                    })
                    .map((m, i) => (
                      <option key={i} value={m} />
                    ))}
                </datalist>
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
                      list="ot-consumables-datalist"
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
                <datalist id="ot-consumables-datalist">
                  {consumablesList
                    .filter(c => {
                      const matches = reqConsumables.some(rc => {
                        const q = (rc.consumableName || '').trim().toLowerCase();
                        return q && c.toLowerCase().includes(q);
                      });
                      return matches;
                    })
                    .map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                </datalist>
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

          {/* List of Sent Pharmacy Requests */}
          {pharmacyRequests.length > 0 && (
            <div className="space-y-4 border-t border-orange-100 pt-6 mt-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Pharmacy Request History</h3>
              {pharmacyRequests.map((req) => (
                <div key={req._id} className="border border-orange-100 rounded-2xl p-4 bg-orange-50/5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-orange-700">Request #{req.requestNumber}</span>
                      <span className="text-xs text-gray-500 ml-2">({new Date(req.createdAt).toLocaleString('en-IN')})</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(req.status)}`}>
                        {getStatusBadgeText(req.status)}
                      </span>
                    </div>
                  </div>

                  {/* Request Items Table */}
                  <div className="overflow-x-auto rounded-xl border border-orange-100/50">
                    <table className="w-full text-left text-xs text-gray-700 table-auto bg-white">
                      <thead className="bg-orange-50/70 text-orange-950 font-bold">
                        <tr className="border-b border-orange-100">
                          <th className="p-3">Item Name</th>
                          <th className="p-3 text-center">Requested Qty</th>
                          <th className="p-3 text-center">Issued/Sent Qty</th>
                          <th className="p-3 text-center">Used Qty</th>
                          <th className="p-3 text-center">Returned Qty</th>
                          <th className="p-3 text-center">Damaged Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-orange-50/50 hover:bg-orange-50/20">
                            <td className="p-3 font-semibold text-gray-900">{item.itemName}</td>
                            <td className="p-3 text-center">{item.requestedQty}</td>
                            <td className="p-3 text-center font-bold">{item.issuedQty}</td>
                            <td className="p-3 text-center">{item.usedQty}</td>
                            <td className="p-3 text-center text-green-600 font-semibold">{item.returnedQty}</td>
                            <td className="p-3 text-center text-red-600">{item.damagedQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions for return */}
                  {(req.status === 'Issued' || req.status === 'Remaining Items Issued') && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleOpenReturnForm(req)}
                        className="btn bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Return Unused Medicines to Pharmacy
                      </button>
                    </div>
                  )}

                  {req.status === 'Return Requested' && (
                    <div className="text-xs text-orange-600 font-bold bg-orange-50 p-3 rounded-xl border border-orange-100">
                      Unused items return request has been submitted. Waiting for Pharmacy confirmation.
                    </div>
                  )}

                  {req.status === 'Return Accepted' && (
                    <div className="text-xs text-green-700 font-bold bg-green-50 p-3 rounded-xl border border-green-150">
                      ✓ Return Accepted: Pharmacy has received the unused items and added them back to the stock.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return/Consumption Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-orange-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-orange-50 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Record Consumption & Return Unused</h3>
                <p className="text-xs text-gray-500">Request #{showReturnModal.requestNumber} | Request Purpose: {showReturnModal.procedureName}</p>
              </div>
              <button 
                onClick={() => setShowReturnModal(null)} 
                className="text-gray-450 hover:text-gray-600 font-bold text-2xl cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-orange-600 font-semibold bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
              Note: For each issued medicine/consumable, specify how many were used, how many are unused (being returned to pharmacy), and how many were damaged/wasted. The sum (Used + Unused + Damaged) MUST equal the total Issued Qty.
            </p>

            <div className="space-y-3 pt-2">
              {returnFormItems.map((item, idx) => (
                <div key={idx} className="border border-orange-50 rounded-xl p-3 bg-gray-50/50 space-y-2">
                  <p className="text-sm font-bold text-gray-800">{item.itemName}</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-orange-50/50 p-2 rounded-lg border border-orange-100/50">
                      <p className="text-gray-500 font-semibold">Issued Qty</p>
                      <p className="text-sm font-bold text-orange-700 mt-0.5">{item.issuedQty}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Used Qty</p>
                      <input
                        type="number"
                        min="0"
                        max={item.issuedQty}
                        className="input text-center py-1 bg-white font-bold"
                        value={item.usedQty}
                        onChange={(e) => handleUpdateReturnItem(idx, 'usedQty', e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Unused (Return)</p>
                      <input
                        type="number"
                        min="0"
                        max={item.issuedQty}
                        className="input text-center py-1 bg-white font-bold text-green-700 border-green-200"
                        value={item.unusedQty}
                        onChange={(e) => handleUpdateReturnItem(idx, 'unusedQty', e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Damaged</p>
                      <input
                        type="number"
                        min="0"
                        max={item.issuedQty}
                        className="input text-center py-1 bg-white font-bold text-red-700 border-red-200"
                        value={item.damagedQty}
                        onChange={(e) => handleUpdateReturnItem(idx, 'damagedQty', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-orange-50 pt-4">
              <button
                onClick={() => setShowReturnModal(null)}
                className="btn-secondary py-2 px-5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={submittingReturn}
                className="btn py-2 px-6 text-xs font-bold cursor-pointer"
              >
                {submittingReturn ? 'Submitting...' : 'Submit Returns to Pharmacy'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Print-only Operative Report */}
      <div id="print-section" className="hidden print:block">
        {renderOperativeReport(reportForm, hospitalInfo, user, admission)}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 1.5cm !important;
          }
          aside, header, nav, button, .print\\:hidden, .no-print {
            display: none !important;
          }
          .space-y-6 > *:not(#print-section) {
            display: none !important;
          }
          #print-section {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

const renderOperativeReport = (form, hospitalInfo, user, admission) => {
  const patient = admission?.patientId || {};
  const formattedDob = patient.dob ? new Date(patient.dob).toLocaleDateString('en-IN') : 'N/A';
  const formattedAdmissionDate = admission?.admissionDate ? new Date(admission.admissionDate).toLocaleDateString('en-IN') : 'N/A';
  
  return (
    <div className="p-8 text-gray-900 bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
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
            <span className="text-gray-900">{patient.patientName || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">UHID / MRN:</span>
            <span className="text-gray-900 font-mono">{formatUhid(patient.uhid) || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Date of Birth:</span>
            <span className="text-gray-900">{formattedDob}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Age / Gender:</span>
            <span className="text-gray-900">{patient.age || 'N/A'} years / {patient.gender || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Admission Date:</span>
            <span className="text-gray-900">{formattedAdmissionDate}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Consultant:</span>
            <span className="text-gray-900">Dr. {admission?.doctorInCharge?.doctorName || admission?.doctorInCharge?.username || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">IPD Number:</span>
            <span className="text-gray-900 font-mono">{admission?.ipdNumber || 'N/A'}</span>
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
            <span className="font-bold text-gray-600 w-36">Date of Surgery:</span>
            <span className="text-gray-900">
              {form.dateOfSurgery ? new Date(form.dateOfSurgery).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Surgeon(s):</span>
            <span className="text-gray-900">{form.surgeon || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Assistant Surgeon(s):</span>
            <span className="text-gray-900">{form.assistantSurgeon || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-32">Anesthesia Name:</span>
            <span className="text-gray-900">{form.anesthesiaName || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-36">Anesthesia Type:</span>
            <span className="text-gray-900">{form.anesthesia || 'N/A'}</span>
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
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.preOperativeDiagnosis || 'N/A'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Post-operative Diagnosis:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.postOperativeDiagnosis || 'N/A'}</p>
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
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.proceduresPerformed || 'N/A'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Indications for Surgery:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.indicationsForSurgery || 'N/A'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Findings:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.findings || 'N/A'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Description of Procedure:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{form.descriptionOfProcedure || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 flex justify-between border-t border-gray-300 pt-6 text-xs text-gray-500">
        <div>Report Generated By: {user?.doctorName || user?.username || 'N/A'}</div>
        <div>Date/Time: {new Date().toLocaleString('en-IN')}</div>
      </div>
    </div>
  );
};

export default DoctorOtForm;
