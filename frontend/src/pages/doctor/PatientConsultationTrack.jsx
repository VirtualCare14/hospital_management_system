import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';

const ageFromDob = (dob) => {
  if (!dob) return '-';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const PatientConsultationTrack = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedConsultation, setExpandedConsultation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(`/consultation/patient/${patientId}/all`);
        setPatient(data.patient);
        setConsultations(data.consultations || []);
        setPrescriptions(data.prescriptions || []);
        // Expand the latest consultation by default
        if (data.consultations && data.consultations.length > 0) {
          setExpandedConsultation(data.consultations[data.consultations.length - 1]._id);
        }
      } catch (error) {
        console.error('Error fetching patient consultation track:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  // Build a map of prescription by consultation date range
  const getPrescriptionForConsultation = (consultation) => {
    // Find prescription that was created closest to the consultation completion date
    const consultationDate = new Date(consultation.consultationCompletedDate || consultation.createdAt).getTime();
    let closestPrescription = null;
    let minDiff = Infinity;
    
    prescriptions.forEach((prescription) => {
      const presDate = new Date(prescription.createdAt).getTime();
      const diff = Math.abs(presDate - consultationDate);
      if (diff < minDiff) {
        minDiff = diff;
        closestPrescription = prescription;
      }
    });
    
    return closestPrescription;
  };

  if (loading) {
    return <div className="card p-5">Loading patient consultation history...</div>;
  }

  if (!patient) {
    return (
      <div className="card p-5">
        <p className="text-gray-500">Patient not found</p>
        <Link to="/doctor/completed" className="btn-secondary mt-3 inline-flex">
          <ArrowLeft className="h-4 w-4" /> Back to Completed Consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/doctor/completed" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900">Patient Consultation Track</h1>
          <p className="text-sm text-gray-500">Complete consultation history for this patient</p>
        </div>
        <Link to={`/doctor/consultation/${patientId}`} className="btn-secondary text-xs">
          New Consultation
        </Link>
      </div>

      {/* Patient Summary Card */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-orange-600">{patient.uhid}</p>
            <h2 className="text-xl font-extrabold text-gray-900">{patient.patientName}</h2>
            <p className="text-sm text-gray-500">
              {patient.gender} • {patient.mobile} • {ageFromDob(patient.dob)} years
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/doctor/prescription/${patientId}`} className="btn-secondary text-xs">
              <FileText className="h-3 w-3" /> Prescription
            </Link>
          </div>
        </div>
      </div>

      {/* No consultations yet */}
      {consultations.length === 0 && (
        <div className="card p-5 text-center">
          <p className="text-gray-500">No consultations found for this patient.</p>
        </div>
      )}

      {/* Consultation Timeline */}
      {consultations.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 text-lg">Consultation History</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-orange-200" />
            
            {consultations.map((consultation, index) => {
              const isExpanded = expandedConsultation === consultation._id;
              const prescription = getPrescriptionForConsultation(consultation);
              const consultationDate = new Date(consultation.consultationCompletedDate || consultation.createdAt);
              const isLatest = index === consultations.length - 1;
              const isCompleted = consultation.consultationStatus === 'completed';

              return (
                <div key={consultation._id} className="relative pl-12 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className={`absolute left-3 top-1 w-4 h-4 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-orange-500 border-orange-500'
                  } ${isLatest ? 'ring-2 ring-orange-300' : ''}`} />

                  {/* Consultation card */}
                  <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setExpandedConsultation(isExpanded ? null : consultation._id)}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-sm">
                          {formatDate(consultationDate)}
                        </span>
                        <span className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {consultationDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            Pending
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Doctor info */}
                    <p className="text-xs text-gray-500 mt-1">
                      Dr. {consultation.doctorId?.doctorName || consultation.doctorId?.username || 'Unknown'} • {consultation.doctorId?.department || ''}
                    </p>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-orange-100 pt-4">
                        {/* Symptoms */}
                        {consultation.symptoms && consultation.symptoms.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Symptoms</h4>
                            <div className="flex flex-wrap gap-2">
                              {consultation.symptoms.map((s, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50 text-xs font-medium text-orange-700 border border-orange-100">
                                  {s.symptom}
                                  {s.durationDays ? ` (${s.durationDays} ${s.durationUnit})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Diagnosis */}
                        {consultation.diagnosisRemark && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Diagnosis</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{consultation.diagnosisRemark}</p>
                          </div>
                        )}

                        {/* Vitals */}
                        {consultation.vitals && (consultation.vitals.weight || consultation.vitals.height || consultation.vitals.temperature) && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Vitals</h4>
                            <div className="flex flex-wrap gap-3">
                              {consultation.vitals.weight && (
                                <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
                                  Weight: {consultation.vitals.weight} kg
                                </span>
                              )}
                              {consultation.vitals.height && (
                                <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
                                  Height: {consultation.vitals.height} cm
                                </span>
                              )}
                              {consultation.vitals.temperature && (
                                <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
                                  Temp: {consultation.vitals.temperature}°C
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tests */}
                        {consultation.tests && consultation.tests.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tests Recommended</h4>
                            <div className="flex flex-wrap gap-2">
                              {consultation.tests.map((test, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-xs font-medium text-purple-700 border border-purple-100">
                                  {test}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Prescription */}
                        {prescription && prescription.medicines && prescription.medicines.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Medicines Prescribed</h4>
                            <div className="overflow-x-auto rounded-lg border border-green-100">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-green-50 text-green-800">
                                  <tr>
                                    <th className="p-2">Medicine</th>
                                    <th className="p-2">Duration</th>
                                    <th className="p-2">M</th>
                                    <th className="p-2">A</th>
                                    <th className="p-2">N</th>
                                    <th className="p-2">Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prescription.medicines.map((med, i) => (
                                    <tr key={i} className="border-t border-green-50">
                                      <td className="p-2 font-semibold">{med.medicine}</td>
                                      <td className="p-2">{med.duration}</td>
                                      <td className="p-2">{med.morning ? '✓' : '-'}</td>
                                      <td className="p-2">{med.afternoon ? '✓' : '-'}</td>
                                      <td className="p-2">{med.night ? '✓' : '-'}</td>
                                      <td className="p-2">{med.remarks || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Follow-up */}
                        {consultation.followUpDate && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Follow-up Date</h4>
                            <p className="text-sm font-semibold text-orange-600">
                              {formatDate(consultation.followUpDate)}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Link 
                            to={`/doctor/completed/${consultation._id}`}
                            className="btn-secondary text-xs"
                          >
                            <FileText className="h-3 w-3" /> View Details
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientConsultationTrack;