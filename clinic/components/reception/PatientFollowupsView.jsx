'use client';

import { useEffect, useState } from 'react';
import {
  CalendarCheck, Calendar, Clock, Search, User, Phone, CheckCircle,
  Pencil, X, RefreshCw, ChevronLeft, ChevronRight, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';

export default function PatientFollowupsView() {
  const [followUpList, setFollowUpList] = useState([]);
  const [followUpStats, setFollowUpStats] = useState({ todayCount: 0, upcomingCount: 0, totalCount: 0 });
  const [filterTab, setFilterTab] = useState('today'); // today | upcoming | all
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Edit Follow-up Modal
  const [followUpModal, setFollowUpModal] = useState(null);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpRemarksInput, setFollowUpRemarksInput] = useState('');
  const [noFollowUpCheck, setNoFollowUpCheck] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const params = {
        filter: filterTab,
        page: currentPage,
        limit: pageSize
      };
      if (search) params.search = search;

      const res = await apiRequest('/patients/registrations/follow-ups', { params });
      setFollowUpList(res.followUps || []);
      setFollowUpStats(res.stats || { todayCount: 0, upcomingCount: 0, totalCount: 0 });
      setTotalRecords(res.totalRecords ?? res.totalCount ?? 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Fetch follow ups error:', err);
      setFollowUpList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, search]);

  useEffect(() => {
    const timer = setTimeout(fetchFollowUps, 300);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, filterTab, search]);

  const handleOpenFollowUpModal = (item) => {
    setFollowUpModal(item);
    setFollowUpDateInput(item.followUpDate ? new Date(item.followUpDate).toISOString().split('T')[0] : '');
    setFollowUpRemarksInput(item.followUpRemarks || '');
    setNoFollowUpCheck(!item.followUpDate);
  };

  const handleSaveFollowUpDate = async () => {
    if (!noFollowUpCheck && !followUpDateInput) {
      return toast.error('Please select a follow-up date or check "No Follow Up"');
    }
    setSavingFollowUp(true);
    try {
      await apiRequest(`/patients/registrations/${followUpModal._id}/follow-up`, {
        method: 'PUT',
        data: {
          followUpDate: noFollowUpCheck ? null : followUpDateInput,
          followUpRemarks: noFollowUpCheck ? '' : followUpRemarksInput,
          noFollowUp: noFollowUpCheck
        }
      });
      toast.success('Follow-up updated successfully');
      setFollowUpModal(null);
      fetchFollowUps();
    } catch (err) {
      toast.error(err.message || 'Failed to update follow-up date');
    } finally {
      setSavingFollowUp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Patient Follow-ups</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Monitor and schedule upcoming patient return visits and review instructions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-orange-50 border border-orange-200 rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-orange-600 font-bold block">Today</span>
            <span className="text-base font-black text-orange-700">{followUpStats.todayCount || 0}</span>
          </div>
          <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block">Upcoming</span>
            <span className="text-base font-black text-blue-700">{followUpStats.upcomingCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl">
          {[
            { id: 'today', label: `Today's Follow-ups (${followUpStats.todayCount || 0})` },
            { id: 'upcoming', label: `Upcoming (${followUpStats.upcomingCount || 0})` },
            { id: 'all', label: `All Follow-ups (${followUpStats.totalCount || 0})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, UHID, doctor..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Follow-up Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Patient / UHID</th>
                <th className="py-3.5 px-4">Doctor & Dept</th>
                <th className="py-3.5 px-4">Follow-up Date</th>
                <th className="py-3.5 px-4">Remarks / Advice</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading follow-ups...
                  </td>
                </tr>
              ) : followUpList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No follow-up records found.
                  </td>
                </tr>
              ) : (
                followUpList.map((item) => {
                  const docName = item.doctorId?.doctorName || item.doctorId?.username || 'Doctor';
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600 block">{formatUhid(item.uhid)}</span>
                        <span className="font-bold text-gray-900">{item.patientName}</span>
                        <span className="text-[11px] text-gray-500 block">{item.mobile || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">Dr. {docName}</span>
                        <span className="text-[11px] text-gray-500">{item.department || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.followUpDate ? (
                          <span className="font-bold text-orange-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(item.followUpDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No date set</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-700 line-clamp-2">{item.followUpRemarks || item.patientAdvice || 'Routine checkup'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenFollowUpModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Reschedule
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs font-bold text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-700 px-2">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Manage Follow-Up Date</h3>
              <button
                onClick={() => setFollowUpModal(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-800">
                  {followUpModal.patientName} <span className="text-orange-600 font-extrabold">({formatUhid(followUpModal.uhid)})</span>
                </p>
                <p className="text-[11px] text-gray-500">Dr. {followUpModal.doctorId?.doctorName || 'Doctor'}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">Follow-Up Date</label>
                <input
                  type="date"
                  disabled={noFollowUpCheck}
                  value={followUpDateInput}
                  onChange={(e) => setFollowUpDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">Remarks / Instructions</label>
                <textarea
                  rows={2}
                  disabled={noFollowUpCheck}
                  value={followUpRemarksInput}
                  onChange={(e) => setFollowUpRemarksInput(e.target.value)}
                  placeholder="e.g. Come back with blood test report..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="noFollowUp"
                  checked={noFollowUpCheck}
                  onChange={(e) => setNoFollowUpCheck(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="noFollowUp" className="text-xs font-bold text-gray-700 cursor-pointer">
                  No Follow-up required
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setFollowUpModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingFollowUp}
                onClick={handleSaveFollowUpDate}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              >
                {savingFollowUp ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
