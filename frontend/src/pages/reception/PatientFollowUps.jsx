import { useEffect, useState } from 'react';
import { Calendar, CalendarCheck, Clock, Copy, Filter, Printer, Save, Search, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import { formatUhid } from '../../utils/uhid';

const PatientFollowUps = () => {
  const [followUpList, setFollowUpList] = useState([]);
  const [followUpStats, setFollowUpStats] = useState({ todayCount: 0, upcomingCount: 0, totalCount: 0 });
  const [filterTab, setFilterTab] = useState('today'); // 'today' | 'upcoming' | 'range' | 'all'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [followUpModal, setFollowUpModal] = useState(null);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [noFollowUpCheck, setNoFollowUpCheck] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const [historyModal, setHistoryModal] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchFollowUpPatients = async () => {
    setLoading(true);
    try {
      const params = { filter: filterTab };
      if (filterTab === 'range') {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      }
      if (search) params.search = search;

      const { data } = await client.get('/patients/registrations/follow-ups', { params });
      setFollowUpList(data.followUps || []);
      setFollowUpStats(data.stats || { todayCount: 0, upcomingCount: 0, totalCount: 0 });
    } catch (err) {
      console.error('Fetch follow ups error:', err);
      toast.error('Failed to load follow-up records');
      setFollowUpList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchFollowUpPatients();
    }, 300);
    return () => clearTimeout(timeout);
  }, [filterTab, fromDate, toDate, search]);

  const handleOpenFollowUpModal = (item) => {
    setFollowUpModal(item);
    setFollowUpDateInput(item.followUpDate ? new Date(item.followUpDate).toISOString().split('T')[0] : '');
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
      const { data } = await client.get(`/patients/registrations/history/${uhid}`);
      setVisitHistory(data.visits || []);
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
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <CalendarCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Patient Follow-Ups Tracking</h1>
              <p className="text-orange-100 text-xs md:text-sm mt-0.5">
                Track, filter, and manage all patient follow-up dates assigned by Doctors and Receptionists.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div
          onClick={() => setFilterTab('today')}
          className={`card p-4 flex items-center gap-3 cursor-pointer transition-all border-2 ${
            filterTab === 'today' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-transparent hover:border-orange-200'
          }`}
        >
          <div className="bg-orange-100 text-orange-600 p-3 rounded-2xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Follow-Ups</p>
            <p className="text-3xl font-black text-gray-900">{followUpStats.todayCount}</p>
          </div>
        </div>

        <div
          onClick={() => setFilterTab('upcoming')}
          className={`card p-4 flex items-center gap-3 cursor-pointer transition-all border-2 ${
            filterTab === 'upcoming' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-transparent hover:border-orange-200'
          }`}
        >
          <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Follow-Ups</p>
            <p className="text-3xl font-black text-gray-900">{followUpStats.upcomingCount}</p>
          </div>
        </div>

        <div
          onClick={() => setFilterTab('all')}
          className={`card p-4 flex items-center gap-3 cursor-pointer transition-all border-2 ${
            filterTab === 'all' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-transparent hover:border-orange-200'
          }`}
        >
          <div className="bg-green-100 text-green-600 p-3 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Follow-Ups</p>
            <p className="text-3xl font-black text-gray-900">{followUpStats.totalCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card overflow-hidden border border-orange-100 shadow-md">
        {/* Controls Bar */}
        <div className="p-4 bg-orange-50/70 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterTab('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                filterTab === 'today'
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              📌 Today's Follow-Ups
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterTab === 'today' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
              }`}>
                {followUpStats.todayCount}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                filterTab === 'upcoming'
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              🚀 Upcoming Follow-Ups
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
              }`}>
                {followUpStats.upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('range')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                filterTab === 'range'
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              📅 Date Range
            </button>

            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                filterTab === 'all'
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              📋 All ({followUpStats.totalCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search follow-ups (Name, UHID, Doctor)..."
              className="input py-1.5 pl-9 text-xs w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Date Range Sub-Bar */}
        {filterTab === 'range' && (
          <div className="p-3 bg-orange-100/40 border-b border-orange-100 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-600 uppercase">From Date:</label>
              <input
                type="date"
                className="input py-1 text-xs"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-600 uppercase">To Date:</label>
              <input
                type="date"
                className="input py-1 text-xs"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="text-xs font-bold text-red-600 hover:text-red-800"
              >
                Clear Date Filter
              </button>
            )}
          </div>
        )}

        {/* Follow Ups Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-950 font-bold border-b border-orange-100">
              <tr>
                <th className="p-3.5">Patient Details</th>
                <th className="p-3.5">UHID / Reg #</th>
                <th className="p-3.5">Follow-Up Date</th>
                <th className="p-3.5">Follow-Up Set By</th>
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
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenFollowUpModal(item)}
                            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-orange-700 border-orange-200 hover:bg-orange-100"
                            title="Edit Follow-Up Date"
                          >
                            <CalendarCheck className="h-4 w-4" /> Edit Date
                          </button>
                          <button
                            onClick={() => openVisitHistory(item.uhid, item.patientName)}
                            className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1.5 text-gray-600 hover:bg-gray-100"
                            title="Visit History"
                          >
                            <Clock className="h-4 w-4" /> History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow Up Date Modal */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-orange-100 pb-3">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">Set / Update Follow Up Date</h2>
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
                  <div className="pl-6 space-y-2">
                    <input
                      type="date"
                      className="input text-xs py-2 w-full"
                      value={followUpDateInput}
                      onChange={(e) => setFollowUpDateInput(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
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
                visitHistory.map((v) => (
                  <div key={v._id} className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-100 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-800 font-mono">Reg#: {v.registrationNumber}</div>
                      <div className="text-gray-500 mt-0.5">
                        Dept: <strong>{v.department}</strong> | Dr. {v.doctorName}
                      </div>
                      <div className="text-gray-400 text-[10px] mt-0.5">
                        {v.registrationDate ? new Date(v.registrationDate).toLocaleString('en-IN') : ''}
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
