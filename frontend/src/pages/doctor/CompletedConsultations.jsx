import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, History, Search } from 'lucide-react';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';

const CompletedConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCompletedConsultations = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/consultation/completed?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${pageSize}`);
      if (Array.isArray(data)) {
        setConsultations(data);
        setTotalRecords(data.length);
        setTotalPages(1);
      } else {
        setConsultations(data.consultations || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching completed consultations:', error);
      setConsultations([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCompletedConsultations();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, currentPage, pageSize]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Completed Consultations</h1>
          <p className="text-sm text-gray-500">View all completed consultations with prescriptions</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <SkeletonTable rows={pageSize > 10 ? 10 : pageSize} columns={6} className="w-full" />
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-sm text-gray-500 text-center">
                    No completed consultations found.
                  </td>
                </tr>
              ) : (
                consultations.map((consultation) => (
                  <tr key={consultation._id} className="border-t border-orange-50 hover:bg-orange-50/50">
                    <td className="p-3 font-bold text-orange-700">
                      {consultation.patientId?.uhid}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-gray-950 block">{consultation.patientId?.patientName}</span>
                      {consultation.visitId?.createdBy && (
                        <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                          Registered by: <span className="capitalize text-orange-600">
                            {consultation.visitId.createdBy.doctorName || consultation.visitId.createdBy.username}
                          </span>
                        </span>
                      )}
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

        <PaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setCurrentPage(1);
          }}
          loading={loading}
          itemLabel="consultations"
        />
      </div>
    </div>
  );
};

export default CompletedConsultations;
