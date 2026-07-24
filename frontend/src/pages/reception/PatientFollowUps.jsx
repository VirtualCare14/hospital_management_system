import { useEffect, useState } from 'react';
import { Calendar, CalendarCheck, Clock, Copy, Filter, MoreVertical, Printer, Save, Search, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';
import { formatUhid } from '../../utils/uhid';

const PatientFollowUps = () => {
  const [followUpList, setFollowUpList] = useState([]);
  const [followUpStats, setFollowUpStats] = useState({ todayCount: 0, upcomingCount: 0, totalCount: 0 });
  const [filterTab, setFilterTab] = useState('today'); // 'today' | 'upcoming' | 'range' | 'all'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Active Action Menu
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals
  const [followUpModal, setFollowUpModal] = useState(null);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpRemarksInput, setFollowUpRemarksInput] = useState('');
  const [noFollowUpCheck, setNoFollowUpCheck] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const [historyModal, setHistoryModal] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchFollowUpPatients = async () => {
    setLoading(true);
    try {
      const params = {
        filter: filterTab,
        page: currentPage,
        limit: pageSize
      };
      if (filterTab === 'range') {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      }
      if (search) params.search = search;

      const { data } = await client.get('/patients/registrations/follow-ups', { params });
      setFollowUpList(data.followUps || []);
      setFollowUpStats(data.stats || { todayCount: 0, upcomingCount: 0, totalCount: 0 });
      setTotalRecords(data.totalRecords ?? data.totalCount ?? 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Fetch follow ups error:', err);
      toast.error('Failed to load follow-up records');
      setFollowUpList([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, fromDate, toDate, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchFollowUpPatients();
    }, 300);
    return () => clearTimeout(timeout);
  }, [currentPage, pageSize, filterTab, fromDate, toDate, search]);

  const handleOpenFollowUpModal = (item) => {
    setFollowUpModal(item);
    setFollowUpDateInput(item.followUpDate ? new Date(item.followUpDate).toISOString().split('T')[0] : '');
    setFollowUpRemarksInput(item.followUpRemarks || '');
    setNoFollowUpCheck(!item.followUpDate);
  };

  const handleSaveFollowUpDate = async () => {
    if (!noFollowUpCheck && !followUpDateInput) {
      toast.error('Please select a follow-up date or check "No Follow Up"');
      return;
    }
    setSavingFollowUp(true);
    try {
      await client.put(`/patients/registrations/${followUpModal._id}/follow-up`, {
        followUpDate: noFollowUpCheck ? null : followUpDateInput,
        followUpRemarks: noFollowUpCheck ? '' : followUpRemarksInput,
        noFollowUp: noFollowUpCheck
      });
      toast.success('Follow-up date updated successfully');
      setFollowUpModal(null);
      fetchFollowUpPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update follow-up date');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const openVisitHistory = async (uhid, patientName) => {
    setHistoryModal({ uhid, patientName });
    setLoadingHistory(true);
    try {
      const { data } = await client.get(`/patients/registrations/history/${encodeURIComponent(uhid)}`);
      setVisitHistory(data.visits || data || []);
    } catch (err) {
      toast.error('Failed to load visit history');
      setVisitHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-600 to-amber-600 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
            <CalendarCheck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Patient Follow-Ups Tracking</h1>
            <p className="text-orange-100 text-xs mt-0.5">
              Monitor, schedule, and track all upcoming patient follow-ups assigned by doctors or reception.
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <div className="text-xs text-orange-100 font-semibold">Today</div>
            <div className="text-xl font-extrabold">{followUpStats.todayCount}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <div className="text-xs text-orange-100 font-semibold">Upcoming</div>
            <div className="text-xl font-extrabold">{followUpStats.upcomingCount}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <div className="text-xs text-orange-100 font-semibold">Total</div>
            <div className="text-xl font-extrabold">{followUpStats.totalCount}</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="card overflow-hidden border border-orange-100 shadow-xl rounded-3xl bg-white">
        {/* Top Control Bar */}
        <div className="p-4 bg-orange-50/50 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterTab('today')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                filterTab === 'today'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              📌 Today's Follow-Ups
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                filterTab === 'today' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
              }`}>
                {followUpStats.todayCount}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('upcoming')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                filterTab === 'upcoming'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              🚀 Upcoming Follow-Ups
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                filterTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
              }`}>
                {followUpStats.upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('range')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                filterTab === 'range'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              📅 Date Range
            </button>

            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                filterTab === 'all'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              📋 All ({followUpStats.totalCount})
            </button>
          </div>

          {/* Live Search */}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search follow-ups (Name, UHID, Doctor)..."
              className="input py-2 pl-9 pr-3 text-xs w-full rounded-2xl border-orange-200 focus:border-orange-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Date Range Picker Bar (if Range tab selected) */}
        {filterTab === 'range' && (
          <div className="p-3.5 bg-orange-50/30 border-b border-orange-100 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-150">
            <span className="font-bold text-orange-950 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-orange-600" /> Filter Date Range:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-semibold">From:</label>
              <input
                type="date"
                className="input py-1 px-2.5 text-xs rounded-xl border-orange-200"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-semibold">To:</label>
              <input
                type="date"
                className="input py-1 px-2.5 text-xs rounded-xl border-orange-200"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="text-xs font-bold text-red-600 hover:text-red-800 ml-auto"
              >
                Clear Range
              </button>
            )}
          </div>
        )}

        {/* Patients Follow-Up Table */}
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50/80 text-xs uppercase text-orange-950 font-bold border-b border-orange-100">
              <tr>
                <th className="p-3.5">Patient Details</th>
                <th className="p-3.5">UHID / Reg #</th>
                <th className="p-3.5">Follow-Up Date & Remarks</th>
                <th className="p-3.5">Follow Up Set By</th>
                <th className="p-3.5">Assigned Doctor & Dept</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8">
                    <SkeletonTable rows={4} columns={6} className="w-full" />
                  </td>
                </tr>
              ) : followUpList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
                    <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No follow-up records found for the selected filter.</p>
                    <p className="text-xs text-gray-400 mt-1">Try switching tabs or adjusting search criteria.</p>
                  </td>
                </tr>
              ) : (
                followUpList.map((item) => {
                  const itemDateStr = item.followUpDate.split('T')[0];
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = itemDateStr === todayStr;
                  const isPast = itemDateStr < todayStr;

                  return (
                    <tr key={item._id} className="border-t border-orange-50 hover:bg-orange-50/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900 text-sm">{item.patientName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span>Mob: <strong className="font-mono text-gray-700">{item.mobile || 'N/A'}</strong></span>
                          {item.gender && <span className="text-gray-400">• {item.gender}</span>}
                        </div>
                      </td>
                      <td className="p-3.5 text-xs">
                        <div className="font-bold text-orange-700 font-mono text-xs">{formatUhid(item.uhid)}</div>
                        <div className="text-gray-400 text-[11px] font-mono mt-0.5">{item.registrationNumber}</div>
                      </td>
                      <td className="p-3.5 text-xs">
                        <div className="font-extrabold text-gray-900 text-sm">
                          {new Date(item.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        {isToday ? (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-extrabold bg-green-100 text-green-800">
                            Today's Follow-Up
                          </span>
                        ) : isPast ? (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                            Upcoming
                          </span>
                        )}
                        {item.followUpRemarks && (
                          <div className="text-[11px] text-gray-600 italic mt-1 max-w-[220px] truncate" title={item.followUpRemarks}>
                            💬 {item.followUpRemarks}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            item.followUpSource === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.followUpSource === 'doctor' ? 'Doctor' : 'Reception'}
                          </span>
                          <span className="font-bold text-gray-800">{item.setterName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-xs">
                        <div className="font-semibold text-gray-800">Dr. {item.doctorName}</div>
                        <div className="text-gray-500 text-[11px] mt-0.5">{item.department}</div>
                      </td>
                      <td className="p-3.5 text-right relative action-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item._id ? null : item._id);
                          }}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-transparent hover:border-orange-200"
                          title="Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === item._id && (
                          <div className="absolute right-3 top-12 z-40 bg-white rounded-2xl shadow-xl border border-orange-100 py-1.5 w-44 text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenFollowUpModal(item);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition-colors"
                            >
                              <CalendarCheck className="h-4 w-4 text-orange-500" /> Edit Date & Remarks
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                openVisitHistory(item.uhid, item.patientName);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors border-t border-gray-100"
                            >
                              <Clock className="h-4 w-4 text-gray-500" /> Visit History
                            </button>
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
          itemLabel="follow-ups"
        />
      </div>

      {/* Follow Up Date & Remarks Modal */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-orange-100 pb-3">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">Set / Update Follow Up</h2>
                <p className="text-xs text-gray-500">
                  {followUpModal.patientName} — Reg#: {followUpModal.registrationNumber}
                </p>
              </div>
              <button
                onClick={() => setFollowUpModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs">
                <span className="font-bold text-gray-500 uppercase text-[10px]">Current Status:</span>{' '}
                {followUpModal.followUpDate ? (
                  <span className="font-bold text-gray-800">
                    {new Date(followUpModal.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                    ({followUpModal.followUpSource === 'doctor' ? 'Doc-Date' : 'Recp-Date'})
                  </span>
                ) : (
                  <span className="font-bold text-gray-500 italic">No Follow Up Set</span>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer border p-3 rounded-xl hover:bg-orange-50/40 border-gray-200">
                  <input
                    type="radio"
                    name="followUpMode"
                    checked={!noFollowUpCheck}
                    onChange={() => setNoFollowUpCheck(false)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-xs font-bold text-gray-800">Set Follow Up Date</span>
                </label>

                {!noFollowUpCheck && (
                  <div className="pl-6 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Follow Up Date *</label>
                      <input
                        type="date"
                        className="input text-xs py-2 w-full"
                        value={followUpDateInput}
                        onChange={(e) => setFollowUpDateInput(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Remarks / Instructions</label>
                      <input
                        type="text"
                        placeholder="Enter follow-up remarks..."
                        className="input text-xs py-2 w-full"
                        value={followUpRemarksInput}
                        onChange={(e) => setFollowUpRemarksInput(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: '+3 Days', days: 3 },
                        { label: '+7 Days', days: 7 },
                        { label: '+14 Days', days: 14 },
                        { label: '+1 Month', days: 30 }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className="px-2 py-1 bg-orange-100/80 hover:bg-orange-200 text-orange-900 rounded-lg text-[10px] font-bold transition-colors"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + item.days);
                            setFollowUpDateInput(d.toISOString().split('T')[0]);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2.5 cursor-pointer border p-3 rounded-xl hover:bg-red-50/40 border-gray-200">
                  <input
                    type="radio"
                    name="followUpMode"
                    checked={noFollowUpCheck}
                    onChange={() => {
                      setNoFollowUpCheck(true);
                      setFollowUpDateInput('');
                      setFollowUpRemarksInput('');
                    }}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs font-bold text-red-600">No Follow Up</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-orange-100">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setFollowUpModal(null)}
                  disabled={savingFollowUp}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn text-xs flex items-center gap-1"
                  onClick={handleSaveFollowUpDate}
                  disabled={savingFollowUp}
                >
                  <Save className="h-3.5 w-3.5" /> {savingFollowUp ? 'Saving...' : 'Save Follow Up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visit History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden border border-orange-100 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center border-b border-orange-100 pb-3 mb-4">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">Visit History</h2>
                <p className="text-sm text-gray-500">
                  {historyModal.patientName} — UHID: {formatUhid(historyModal.uhid)}
                </p>
              </div>
              <button
                onClick={() => { setHistoryModal(null); setVisitHistory([]); }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              {loadingHistory ? (
                <SkeletonTable rows={3} columns={5} className="w-full" />
              ) : visitHistory.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No visit history found.</p>
              ) : (
                visitHistory.map((v, idx) => (
                  <div key={v._id || idx} className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-100 text-xs flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-gray-800 font-mono">Reg#: {v.registrationNumber}</div>
                        <div className="text-gray-600 mt-0.5">
                          Dept: <strong>{v.department}</strong> | Dr. {v.doctorId?.doctorName || v.doctorId?.username || v.doctorName || 'N/A'}
                        </div>
                        <div className="text-gray-400 text-[10px] mt-0.5">
                          {v.registrationDate ? new Date(v.registrationDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.consultationStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {v.consultationStatus === 'completed' ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {v.followUpDate && (
                      <div className="p-2 bg-white rounded-lg border border-orange-100 text-xs flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-700">Follow-Up Date:</span>
                          <span className="font-extrabold text-orange-700">
                            {new Date(v.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                            v.followUpSource === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {v.followUpSource === 'doctor' ? 'Doctor' : 'Reception'}
                          </span>
                        </div>
                        {v.followUpRemarks && (
                          <div className="text-gray-600 text-[11px] mt-0.5">
                            <strong className="text-gray-500">Remarks:</strong> {v.followUpRemarks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientFollowUps;
