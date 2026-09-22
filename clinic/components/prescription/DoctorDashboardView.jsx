'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope, Users, Search, RefreshCw, Printer,
  Eye, ChevronLeft, ChevronRight, ClipboardEdit, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import ConsultationModal from './ConsultationModal';
import PrintRxModal from './PrintRxModal';

// Helper to generate pagination page numbers with ellipsis
const getPaginationRange = (currentPage, totalPages) => {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  let l;
  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};

export default function DoctorDashboardView({ onNavigate, onStartConsultation }) {
  const [patients, setPatients] = useState([]);
  const [counts, setCounts] = useState(null);
  const [filter, setFilter] = useState('today'); // all | previous | today | upcoming | completed | pending
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredBox, setHoveredBox] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fallback modal state
  const [consultingPatient, setConsultingPatient] = useState(null);
  const [printRxPatient, setPrintRxPatient] = useState(null);
  const [printRxData, setPrintRxData] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/consultation/appointments?filter=${filter}`);
      setPatients(Array.isArray(res) ? res : res?.appointments || []);
      const statsRes = await apiRequest('/consultation/stats');
      if (statsRes) setCounts(statsRes);
    } catch (err) {
      console.error('Fetch doctor queue error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        (p.patientName && p.patientName.toLowerCase().includes(term)) ||
        (p.uhid && String(p.uhid).toLowerCase().includes(term)) ||
        (p.mobile && String(p.mobile).includes(term))
      );
    });
  }, [patients, search]);

  const totalRecords = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPatients.slice(startIndex, startIndex + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  const summaryCards = [
    {
      key: 'all',
      label: 'ALL PATIENTS',
      value: counts?.allCount ?? counts?.totalPatients ?? counts?.totalCount ?? 0,
      activeBg: '#4f46e5',
      textLight: '#c7d2fe',
      activeBorder: '#4338ca'
    },
    {
      key: 'previous',
      label: 'PREVIOUS PATIENTS',
      value: counts?.previousCount ?? counts?.previousPatientsCount ?? 0,
      activeBg: '#ea580c',
      textLight: '#fed7aa',
      activeBorder: '#c2410c'
    },
    {
      key: 'today',
      label: "TODAY'S PATIENTS",
      value: counts?.todayCount ?? counts?.todaysPatientsCount ?? 0,
      activeBg: '#059669',
      textLight: '#a7f3d0',
      activeBorder: '#047857'
    },
    {
      key: 'upcoming',
      label: 'UPCOMING PATIENTS',
      value: counts?.upcomingCount ?? counts?.upcomingPatientsCount ?? 0,
      activeBg: '#2563eb',
      textLight: '#bfdbfe',
      activeBorder: '#1d4ed8'
    }
  ];

  const handleConsultationSuccess = (patient, prescriptionData) => {
    fetchPatients();
    setPrintRxPatient(patient);
    setPrintRxData(prescriptionData);
  };

  const handleOpenPrintRx = async (patient) => {
    try {
      const res = await apiRequest(`/consultation/${patient._id}`);
      const cons = res?.consultation || (Array.isArray(res) ? res[0] : (Array.isArray(res?.consultations) ? res.consultations[0] : res));
      const rx = res?.prescription || {};

      const combinedData = {
        ...(cons || {}),
        diagnosisRemark: cons?.diagnosisRemark || rx?.diagnosisRemark || '',
        patientAdvice: cons?.patientAdvice || rx?.patientAdvice || '',
        tests: cons?.tests || rx?.tests || [],
        symptoms: cons?.symptoms || rx?.symptoms || [],
        followUpDate: cons?.followUpDate || rx?.followUpDate || '',
        followUpRemarks: cons?.followUpRemarks || rx?.followUpRemarks || '',
        medicines: rx?.medicines || cons?.medicines || [],
        language: rx?.language || cons?.language || 'English',
        doctorName: patient.doctorId?.doctorName || patient.doctorId?.username || cons?.doctorId?.doctorName || rx?.doctorId?.doctorName || 'Doctor'
      };

      setPrintRxPatient(patient);
      setPrintRxData(combinedData);
    } catch (err) {
      console.error('Failed to load prescription', err);
      toast.error('Failed to load prescription');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Eye-Catching Color & Size Animation CSS */}
      <style>{`
        @keyframes eyeCatchPulse {
          0% {
            transform: scale(1) rotate(0deg);
            color: #2563eb;
            filter: drop-shadow(0 0 3px rgba(37, 99, 235, 0.7));
          }
          20% {
            transform: scale(1.28) rotate(-6deg);
            color: #ea580c;
            filter: drop-shadow(0 0 10px rgba(234, 88, 12, 0.95));
          }
          40% {
            transform: scale(0.92) rotate(0deg);
            color: #dc2626;
            filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.85));
          }
          60% {
            transform: scale(1.24) rotate(6deg);
            color: #059669;
            filter: drop-shadow(0 0 10px rgba(5, 150, 105, 0.95));
          }
          80% {
            transform: scale(0.95) rotate(-3deg);
            color: #7c3aed;
            filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.85));
          }
          100% {
            transform: scale(1) rotate(0deg);
            color: #2563eb;
            filter: drop-shadow(0 0 3px rgba(37, 99, 235, 0.7));
          }
        }
        .eye-catcher-icon {
          animation: eyeCatchPulse 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500">All registered patients are available for consultation and prescription.</p>
        </div>
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition-all"
            placeholder="Search UHID, mobile, patient name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary KPI Cards - Click to Filter */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const isSelected = filter === card.key;
          const isHovered = hoveredBox === card.key;
          const isActive = isSelected || isHovered;

          return (
            <div
              key={card.key}
              onClick={() => setFilter(card.key)}
              onMouseEnter={() => setHoveredBox(card.key)}
              onMouseLeave={() => setHoveredBox(null)}
              style={{
                backgroundColor: isActive ? card.activeBg : '#ffffff',
                color: isActive ? '#ffffff' : '#111827',
                borderColor: isActive ? card.activeBorder : '#e5e7eb'
              }}
              className="rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-xs hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border"
            >
              <div>
                <div
                  style={{ color: isActive ? card.textLight : '#6b7280' }}
                  className="text-xs font-extrabold uppercase tracking-wider transition-colors"
                >
                  {card.label}
                </div>
                <div
                  style={{ color: isActive ? '#ffffff' : '#111827' }}
                  className="text-2xl font-black mt-1 transition-colors"
                >
                  {card.value ?? 0}
                </div>
              </div>
              {isSelected && (
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-white/25 text-white backdrop-blur-xs">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="text-orange-500 h-5 w-5" />
            <h2 className="font-bold text-gray-800 text-lg">
              Patient List {filter && (
                <span className="text-orange-600 font-extrabold capitalize text-base">
                  ({filter === 'all' ? 'All Patients' : filter === 'completed' ? 'Consultation Completed' : filter === 'pending' ? 'Pending OPD' : `${filter} Patients`})
                </span>
              )}
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            Total Shown: <strong className="text-gray-900">{filteredPatients.length}</strong>
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl shadow-xs border border-gray-200">
          <table className="w-full min-w-[800px] table-auto text-left text-sm bg-white">
            <thead className="sticky top-0 bg-orange-50 text-xs font-bold text-orange-950 uppercase tracking-wider shadow-xs">
              <tr className="border-b border-orange-100">
                <th className="p-3">Patient Name</th>
                <th className="p-3">UHID</th>
                <th className="p-3">Date / Slot</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading patient queue...
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-500 font-medium">
                    No patients found.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  const isCompleted = patient.consultationStatus === 'completed' || patient.status === 'Completed';

                  return (
                    <tr key={patient._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-gray-950 block text-xs">{patient.patientName}</span>
                        <span className="text-[11px] text-gray-500">{patient.mobile || '-'}</span>
                      </td>
                      <td className="p-3 font-bold text-orange-600">
                        {formatUhid(patient.uhid)}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-950">{formatDate(patient.appointmentDate)}</div>
                        <div className="text-[11px] text-gray-500">{patient.slot || 'Walk-in'}</div>
                      </td>
                      <td className="p-3 font-medium text-gray-700">
                        {patient.department || 'Clinic'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onStartConsultation) {
                                onStartConsultation(patient);
                              } else {
                                setConsultingPatient(patient);
                              }
                            }}
                            className="relative inline-flex items-center justify-center p-1 rounded-xl cursor-pointer bg-transparent hover:bg-orange-50 transition-colors"
                            title={isCompleted ? "Edit Doctor Consultation Form" : "Open Doctor Consultation Form"}
                          >
                            <ClipboardEdit className={`h-8 w-8 ${!isCompleted ? 'eye-catcher-icon' : 'text-emerald-600'}`} />
                          </button>

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleOpenPrintRx(patient)}
                              className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 cursor-pointer transition shadow-2xs"
                              title="Print Digital Rx"
                            >
                              <Printer className="h-3.5 w-3.5 text-green-600" /> View Rx
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        <div className="mt-4 px-4 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          {/* Left: Rows Per Page Selector */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 text-xs font-bold w-auto border border-orange-200 focus:ring-orange-500 bg-orange-50/30 rounded-lg cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Center: Showing X–Y of Z patients */}
          <div className="text-xs font-bold text-gray-700 text-center">
            {totalRecords === 0 ? (
              <span>Showing 0 of 0 patients</span>
            ) : (
              <span>
                Showing <span className="text-gray-900 font-extrabold">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span>–
                <span className="text-gray-900 font-extrabold">{Math.min(currentPage * pageSize, totalRecords).toLocaleString()}</span> of{' '}
                <span className="text-orange-600 font-extrabold">{totalRecords.toLocaleString()}</span> patients
              </span>
            )}
          </div>

          {/* Right: Modern Pagination Controls */}
          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPaginationRange(currentPage, totalPages).map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-xs font-bold text-gray-400 select-none">
                      ...
                    </span>
                  );
                }
                const isActive = p === currentPage;
                return (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 border border-orange-500'
                        : 'bg-white text-gray-700 border border-orange-200/60 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      {consultingPatient && (
        <ConsultationModal
          patient={consultingPatient}
          onClose={() => setConsultingPatient(null)}
          onSuccess={handleConsultationSuccess}
        />
      )}

      {/* Print Rx Modal */}
      {printRxPatient && (
        <PrintRxModal
          patient={printRxPatient}
          prescription={printRxData}
          onClose={() => {
            setPrintRxPatient(null);
            setPrintRxData(null);
          }}
        />
      )}
    </div>
  );
}
