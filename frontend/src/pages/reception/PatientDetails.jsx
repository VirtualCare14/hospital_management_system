import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileText, Stethoscope, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    client.get(`/patients/${id}`).then(({ data }) => setPatient(data));
    client.get(`/consultation/${id}`).then(({ data }) => setConsultations(data));
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

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold text-orange-600">{patient.uhid}</p>
            <h1 className="text-2xl font-extrabold text-gray-900">{patient.patientName}</h1>
            <p className="text-sm text-gray-500">{patient.gender} • {patient.mobile} • {patient.department}</p>
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
          <div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-gray-500">Temperature</p><p className="font-bold">{patient.demographics?.temperature || '-'} °C</p></div>
        </div>
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
