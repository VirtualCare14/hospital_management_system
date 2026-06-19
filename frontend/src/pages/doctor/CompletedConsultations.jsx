import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, History } from 'lucide-react';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';

const CompletedConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCompletedConsultations = async () => {
      try {
        const { data } = await client.get('/consultation/completed');
        setConsultations(data);
      } catch (error) {
        console.error('Error fetching completed consultations:', error);
      }
    };

    fetchCompletedConsultations();
  }, []);

  const filteredConsultations = consultations.filter(consultation =>
    consultation.patientId?.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    consultation.patientId?.uhid?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Completed Consultations</h1>
          <p className="text-sm text-gray-500">View all completed consultations with prescriptions</p>
        </div>
        <div className="relative w-full md:w-96">
          <input
            className="input pl-10"
            placeholder="Search by patient name or UHID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
              <tr>
                <th className="p-3">UHID</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Symptoms</th>
                <th className="p-3">Diagnosis</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-sm text-gray-500 text-center">
                    No completed consultations found.
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consultation) => (
                  <tr key={consultation._id} className="border-t border-orange-50 hover:bg-orange-50/50">
                    <td className="p-3 font-bold text-orange-700">
                      {consultation.patientId?.uhid}
                    </td>
                    <td className="p-3 font-semibold">
                      {consultation.patientId?.patientName}
                    </td>
                    <td className="p-3 text-xs">
                      <div className="line-clamp-2">
                        {consultation.symptoms?.map((s) => 
                          `${s.symptom}${s.durationDays ? ` (${s.durationDays}${s.durationUnit?.[0]})` : ''}`
                        ).join(', ') || '-'}
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="line-clamp-2">
                        {consultation.diagnosisRemark || '-'}
                      </div>
                    </td>
                    <td className="p-3 text-xs font-semibold text-green-600">
                      {formatDate(consultation.consultationCompletedDate || consultation.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link 
                          to={`/doctor/completed/${consultation._id}`}
                          className="btn-secondary text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> View
                        </Link>
                        <Link 
                          to={`/doctor/consultation-track/${consultation.patientId?._id}`}
                          className="btn-secondary text-xs inline-flex items-center gap-1"
                        >
                          <History className="h-3 w-3" /> Track
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompletedConsultations;
