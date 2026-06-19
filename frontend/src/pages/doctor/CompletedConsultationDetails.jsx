import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';

const ageFromDob = (dob) => {
  if (!dob) return '-';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const CompletedConsultationDetails = () => {
  const { consultationId } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(`/consultation/completed/${consultationId}`);
        setConsultation(data.consultation);
        setPatient(data.patient);
        setPrescription(data.prescription);
      } catch (error) {
        console.error('Error fetching consultation details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [consultationId]);

  if (loading) {
    return <div className="card p-5">Loading consultation details...</div>;
  }

  if (!consultation || !patient) {
    return (
      <div className="card p-5">
        <p className="text-gray-500">Consultation not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/doctor/completed" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Consultation Details</h1>
          <p className="text-sm text-gray-500">Completed on {formatDate(consultation.consultationCompletedDate || consultation.createdAt)}</p>
        </div>
      </div>

      {/* Patient Information Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="font-bold text-gray-800">Patient Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">UHID</p>
              <p className="text-sm font-bold text-orange-700">{patient.uhid}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Patient Name</p>
              <p className="text-sm font-semibold">{patient.patientName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Age</p>
                <p className="text-sm font-semibold">{ageFromDob(patient.dob)} years</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Gender</p>
                <p className="text-sm font-semibold">{patient.gender}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Mobile</p>
              <p className="text-sm font-semibold">{patient.mobile}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Department</p>
              <p className="text-sm font-semibold">{patient.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Appointment</p>
              <p className="text-sm font-semibold">{formatDate(patient.appointmentDate)} {patient.slot}</p>
            </div>
          </div>
        </div>

        {/* Consultation Details Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="font-bold text-gray-800">Consultation Details</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Consultation Date</p>
              <p className="text-sm font-semibold">{formatDate(consultation.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Completed Date</p>
              <p className="text-sm font-semibold text-green-600">
                {formatDate(consultation.consultationCompletedDate || consultation.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
              <p className="text-sm font-semibold">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                  ✓ Completed
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Follow-up Date</p>
              <p className="text-sm font-semibold">{consultation.followUpDate ? formatDate(consultation.followUpDate) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Symptoms Card */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">Symptoms</h2>
        <div className="space-y-3">
          {consultation.symptoms && consultation.symptoms.length > 0 ? (
            consultation.symptoms.map((symptom, index) => (
              <div key={index} className="border-l-4 border-orange-300 pl-4 py-2">
                <p className="font-semibold text-gray-800">{symptom.symptom}</p>
                <div className="grid grid-cols-2 gap-4 mt-1 text-sm text-gray-600">
                  {symptom.durationDays && (
                    <p><span className="font-semibold">Duration:</span> {symptom.durationDays} {symptom.durationUnit}</p>
                  )}
                </div>
                {symptom.pastHistory && (
                  <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Past History:</span> {symptom.pastHistory}</p>
                )}
                {symptom.remarks && (
                  <p className="text-sm text-gray-600"><span className="font-semibold">Remarks:</span> {symptom.remarks}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No symptoms recorded</p>
          )}
        </div>
      </div>

      {/* Diagnosis Card */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">Diagnosis & Remarks</h2>
        <p className="text-gray-700">{consultation.diagnosisRemark || '-'}</p>
      </div>

      {/* Vitals Card */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">Vitals</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Weight</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.weight || '-'} kg</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Height</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.height || '-'} cm</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Temperature</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.temperature || '-'} °C</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">BMI</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.bmi || '-'}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs text-gray-500 font-semibold uppercase">Drug Allergy</p>
            <p className="text-lg font-bold text-orange-700">{consultation.vitals?.drugAllergy || '-'}</p>
          </div>
        </div>
      </div>

      {/* Prescription Card */}
      {prescription && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Medicines Prescribed</h2>
          <div className="overflow-x-auto rounded-lg border border-orange-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-orange-100 text-orange-900">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Morning</th>
                  <th className="p-3">Afternoon</th>
                  <th className="p-3">Night</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {prescription.medicines && prescription.medicines.map((med, index) => (
                  <tr key={index} className="border-t border-orange-50">
                    <td className="p-3 font-semibold">{med.medicine}</td>
                    <td className="p-3">{med.duration}</td>
                    <td className="p-3">{med.morning ? '✓' : '-'}</td>
                    <td className="p-3">{med.afternoon ? '✓' : '-'}</td>
                    <td className="p-3">{med.night ? '✓' : '-'}</td>
                    <td className="p-3 text-xs">{med.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tests Card */}
      {consultation.tests && consultation.tests.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Recommended Tests</h2>
          <div className="flex flex-wrap gap-2">
            {consultation.tests.map((test, index) => (
              <span key={index} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {test}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedConsultationDetails;
