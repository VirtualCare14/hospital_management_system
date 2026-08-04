import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bed, RefreshCw, Eye, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { useHeader } from '../../context/HeaderContext';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';
import { formatUhid } from '../../utils/uhid';

const DoctorIpdPatients = () => {
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/ipd/patients?status=Admitted&search=${encodeURIComponent(search)}&page=${currentPage}&limit=${pageSize}`);
      if (Array.isArray(data)) {
        setAdmissions(data);
        setTotalRecords(data.length);
        setTotalPages(1);
      } else {
        setAdmissions(data.admissions || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load active IPD patients');
      setAdmissions([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  useHeader({ onRefresh: fetchAdmissions });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search by name, UHID, IPD, Bed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-orange-50 text-xs font-bold uppercase text-orange-950 border-b border-orange-100">
              <tr>
                <th className="p-3 pl-4">Patient Name</th>
                <th className="p-3">UHID</th>
                <th className="p-3">IPD Number</th>
                <th className="p-3">Ward / Room</th>
                <th className="p-3">Bed No</th>
                <th className="p-3">Gender / Age</th>
                <th className="p-3">Consultant</th>
                <th className="p-3 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <SkeletonTable rows={pageSize > 10 ? 10 : pageSize} columns={8} className="w-full" />
                  </td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    No active IPD patients found.
                  </td>
                </tr>
              ) : (
                admissions.map((adm, idx) => {
                  const patient = adm.patientId || {};
                  const age = patient.dob
                    ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                    : 'N/A';
                  return (
                    <tr key={adm._id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="p-3 pl-4 font-bold text-gray-800">{patient.patientName}</td>
                      <td className="p-3 font-mono text-xs font-bold text-orange-700">{formatUhid(patient.uhid)}</td>
                      <td className="p-3 font-mono text-xs font-semibold text-gray-600">{adm.ipdNumber}</td>
                      <td className="p-3 text-xs font-bold text-gray-700">{adm.roomId?.roomType || 'N/A'}</td>
                      <td className="p-3 text-xs font-mono font-semibold text-gray-600">
                        <Bed className="h-3.5 w-3.5 inline mr-1 text-orange-500" />
                        {adm.bedId?.bedNumber || 'N/A'}
                      </td>
                      <td className="p-3 text-xs">{patient.gender} / {age} yrs</td>
                      <td className="p-3 text-xs font-medium">
                        Dr. {adm.doctorInCharge?.doctorName || adm.doctorInCharge?.username || 'N/A'}
                      </td>
                      <td className="p-3 pr-4 text-center relative action-menu-container">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === adm._id ? null : adm._id);
                          }}
                          className="p-1.5 hover:bg-orange-100/70 text-gray-700 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-sm inline-flex items-center justify-center cursor-pointer"
                          title="Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === adm._id && (
                          <div className={`absolute right-3 ${idx >= admissions.length - 2 && admissions.length > 2 ? 'bottom-full mb-1' : 'top-10'} z-50 w-44 bg-white rounded-2xl shadow-xl border border-orange-100 py-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left`}>
                            <Link 
                              to={`/doctor/ipd-chart/${adm._id}`}
                              onClick={() => setActiveMenuId(null)}
                              className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-orange-500" /> Medication Chart
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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
          itemLabel="patients"
        />
      </div>
    </div>
  );
};

export default DoctorIpdPatients;
