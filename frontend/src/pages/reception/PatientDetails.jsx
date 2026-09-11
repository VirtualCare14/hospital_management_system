import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileText, Stethoscope, Trash2, ShieldCheck, Link as LinkIcon, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [careContexts, setCareContexts] = useState([]);
  const [consents, setConsents] = useState([]);
  const [linkingRecordRef, setLinkingRecordRef] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const fetchAbdmData = () => {
    client.get(`/patients/${id}/abdm-care-contexts`)
      .then(({ data }) => {
        if (data?.success) {
          setCareContexts(data.careContexts || []);
          setConsents(data.consents || []);
        }
      })
      .catch((err) => console.warn('ABDM care contexts not available:', err.message));
  };

  useEffect(() => {
    client.get(`/patients/${id}`).then(({ data }) => setPatient(data));
    client.get(`/consultation/${id}`).then(({ data }) => setConsultations(data));
    fetchAbdmData();
  }, [id]);

  if (!patient) return <div className="card p-5">Loading patient...</div>;

  const handleDeletePatient = async () => {
    const ok = window.confirm('Delete patient and related records? This cannot be undone.');
    if (!ok) return;

    try {
      await client.delete(`/patients/${id}`);
      toast.success('Patient deleted successfully');
      navigate('/reception/patients');
    } catch (error) {
      console.error('Delete patient error:', error);
      toast.error('Error deleting patient');
    }
  };

  const handleHipLink = async (e) => {
    e.preventDefault();
    if (!linkingRecordRef.trim()) {
      toast.error('Please enter a Visit / Record Registration Number');
      return;
    }

    setIsLinking(true);
    try {
      const { data } = await client.post(`/patients/${id}/abdm-link`, {
        visitRegNumber: linkingRecordRef.trim()
      });
      if (data.success) {
        toast.success('ABDM Care Context linking initiated!');
        setLinkingRecordRef('');
        setTimeout(fetchAbdmData, 2000);
      }
    } catch (error) {
      console.error('HIP linking error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate care context linking');
    } finally {
      setIsLinking(false);
    }
  };

  const handleSendDeepLinkSms = async () => {
    setIsSendingSms(true);
    try {
      const { data } = await client.post('/abdm/m2/webhooks/hip/deep-link/sms', {
        phoneNo: patient.mobile,
        hipName: 'Medora360 Hospital'
      });
      if (data.success) {
        toast.success('Deep linking SMS sent to patient successfully!');
      }
    } catch (error) {
      console.error('SMS notification error:', error);
      toast.error(error.response?.data?.message || 'Failed to send SMS notification');
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-orange-600">{patient.uhid}</p>
              {patient.abhaAddress ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  ABHA: {patient.abhaAddress}
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  ABHA Not Linked
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">{patient.patientName}</h1>
            <p className="text-sm text-gray-500">{patient.gender} • {patient.mobile} • {patient.department}</p>
            {patient.abhaNumber && (
              <p className="mt-1 text-xs text-gray-500">
                ABHA Number: <span className="font-mono font-medium text-gray-800">{patient.abhaNumber}</span>
                {patient.abhaVerificationStatus && ` • Status: ${patient.abhaVerificationStatus}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" to={`/doctor/consultation/${patient._id}`}><Stethoscope className="h-4 w-4" /> Consultation</Link>
            <Link className="btn" to={`/doctor/prescription/${patient._id}`}><FileText className="h-4 w-4" /> Prescription</Link>
            <button className="btn btn-error" onClick={handleDeletePatient}><Trash2 className="h-4 w-4" /> Delete Patient</button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-gray-500">Weight</p><p className="font-bold">{patient.demographics?.weight || '-'} kg</p></div>
          <div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-gray-500">Height</p><p className="font-bold">{patient.demographics?.height || '-'} cm</p></div>
          <div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-gray-500">BP</p><p className="font-bold">{patient.demographics?.bloodPressure || '-'}</p></div>
          <div className="rounded-xl bg-orange-50 p-3">
            <p className="text-xs text-gray-500">Temperature</p>
            <p className="font-bold">
              {patient.demographics?.temperature 
                ? `${((parseFloat(patient.demographics.temperature) * 9/5) + 32).toFixed(1)} °F` 
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* ABDM M2 Milestone 2 Panel */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-orange-600" />
            <h2 className="font-bold text-gray-800">ABDM Milestone 2: Care Contexts & Consents</h2>
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={handleSendDeepLinkSms} 
              disabled={isSendingSms}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSendingSms ? 'Sending...' : 'Send Deep Link SMS'}
            </button>
            <button 
              type="button" 
              onClick={fetchAbdmData}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              title="Refresh ABDM Status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Link new care context form */}
        <form onSubmit={handleHipLink} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Enter Visit/Admission/Lab/Prescription ID to Link (e.g. REG-001)"
            value={linkingRecordRef}
            onChange={(e) => setLinkingRecordRef(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLinking || (!patient.abhaAddress && !patient.abhaNumber)}
            className="btn btn-primary whitespace-nowrap text-xs"
          >
            {isLinking ? 'Initiating Link...' : 'Link Care Context (HIP)'}
          </button>
        </form>
        {!patient.abhaAddress && !patient.abhaNumber && (
          <p className="mt-1 text-xs text-amber-600">Patient must have an ABHA Address or ABHA Number to initiate care context linking.</p>
        )}

        {/* Care Contexts List */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-600">Linked Care Contexts ({careContexts.length})</p>
          {careContexts.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {careContexts.map((cc) => (
                <div key={cc._id || cc.careContextReference} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{cc.careContextReference}</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">{cc.linkStatus || 'LINKED'}</span>
                  </div>
                  <p className="mt-1 text-gray-600">{cc.display || 'Care Context'}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Type: {cc.medoraRecordType || 'OPD'}</span>
                    <span>{cc.linkedAt ? new Date(cc.linkedAt).toLocaleDateString() : 'Active'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No care contexts linked yet. Care contexts are automatically discovered during ABDM patient discovery or when linked via HIP.</p>
          )}
        </div>

        {/* Consents List */}
        {consents.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-600">Active Consents ({consents.length})</p>
            <div className="mt-2 space-y-2">
              {consents.map((c) => (
                <div key={c._id || c.consentId} className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 text-xs">
                  <div>
                    <p className="font-semibold text-blue-950">Consent ID: {c.consentId}</p>
                    <p className="text-blue-800">Types: {c.hiTypes?.join(', ') || 'Prescription'}</p>
                  </div>
                  <span className="rounded bg-blue-200/60 px-2 py-0.5 text-blue-900 font-medium">{c.status || 'GRANTED'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-gray-800">Consultation History</h2>
        <div className="mt-3 space-y-3">
          {consultations.map((item) => (
            <div key={item._id} className="rounded-xl border border-orange-100 p-4">
              <p className="font-semibold">{item.diagnosisRemark || 'No diagnosis remark'}</p>
              <p className="text-sm text-gray-500">{item.symptoms?.map((s) => `${s.symptom}${s.durationDays ? ` - ${s.durationDays} ${s.durationUnit}` : ''}`).join(', ')}</p>
            </div>
          ))}
          {consultations.length === 0 && <p className="text-sm text-gray-500">No consultations yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;

