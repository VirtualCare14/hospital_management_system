import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, Loader2, Calendar, Clock, User, Scissors,
  Building2, ArrowRight, RefreshCw, CheckCircle, Clock3
} from 'lucide-react';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const DoctorOtPatients = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Scheduled'); // 'All', 'Scheduled', 'In Progress', 'Completed'

  const loadOtBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'All' ? `?status=${statusFilter}` : '';
      const { data } = await client.get(`/ipd/ot-management/bookings${params}`);
      setBookings(data);
    } catch (err) {
      toast.error('Failed to load OT patients');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOtBookings();
  }, [loadOtBookings]);

  const filteredBookings = bookings.filter(b => {
    const term = search.toLowerCase();
    const patientName = b.patientId?.patientName?.toLowerCase() || '';
    const uhid = b.patientId?.uhid?.toLowerCase() || '';
    const ipd = b.admissionId?.ipdNumber?.toLowerCase() || '';
    return patientName.includes(term) || uhid.includes(term) || ipd.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Scissors className="h-6 w-6 text-orange-500" />
            OT Patients Tracking
          </h1>
          <p className="text-sm text-gray-500">Track scheduled surgeries, view consent forms, fill operative reports, and request medicines.</p>
        </div>
        <button onClick={loadOtBookings} className="btn-secondary text-sm py-2 px-3 flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50/50"
            placeholder="Search by Patient Name, UHID or IPD No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['Scheduled', 'In Progress', 'Completed', 'All'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List / Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
          <span className="font-bold text-gray-500">Loading OT patients...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-orange-100 shadow-sm max-w-md mx-auto space-y-4">
          <Scissors className="h-12 w-12 text-orange-200 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No OT Patients Found</h3>
          <p className="text-sm text-gray-500 px-6">There are no patients matching the selected filters or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const patient = b.patientId || {};
            const admission = b.admissionId || {};
            const record = b.otRecordId || {};
            const isCompleted = b.status === 'Completed';
            const isInProgress = b.status === 'In Progress';

            return (
              <div key={b._id} className="card p-5 hover:border-orange-300 transition-all flex flex-col justify-between h-full bg-white shadow-sm border border-orange-100">
                <div className="space-y-4">
                  {/* Top line: Patient Demographics */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <User className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 leading-snug">{patient.patientName}</h4>
                        <p className="text-[10px] font-bold text-orange-600">{formatUhid(patient.uhid)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      isCompleted ? 'bg-green-100 text-green-800' :
                      isInProgress ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                      {b.status}
                    </span>
                  </div>

                  {/* Scheduled Details */}
                  <div className="space-y-2 border-t border-b border-orange-50/50 py-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span><span className="font-bold text-gray-700">OT Room:</span> {b.otId?.otName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span><span className="font-bold text-gray-700">Date:</span> {new Date(b.surgeryDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span><span className="font-bold text-gray-700">Time:</span> {b.startTime} - {b.endTime}</span>
                    </div>
                    {record.proceduresPerformed && (
                      <div className="flex items-start gap-2 pt-1">
                        <Scissors className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                        <p className="line-clamp-2"><span className="font-bold text-gray-700">Procedure:</span> {record.proceduresPerformed}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Open Button */}
                <button
                  onClick={() => navigate(`/doctor/ot/${b.admissionId?._id || b.admissionId}?otId=${record._id || ''}`)}
                  className="btn w-full mt-4 py-2 text-xs flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  Open OT Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorOtPatients;
