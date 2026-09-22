'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, Search, Eye, Printer, RefreshCw,
  ChevronLeft, ChevronRight, FileText, ClipboardEdit, CreditCard
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

export default function CompletedConsultationsView({ onNavigate, onStartConsultation }) {
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [printRxPatient, setPrintRxPatient] = useState(null);
  const [printRxData, setPrintRxData] = useState(null);

  const fetchCompleted = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/consultation/completed?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${pageSize}`);
      if (Array.isArray(res)) {
        setConsultations(res);
        setTotalRecords(res.length);
        setTotalPages(Math.max(1, Math.ceil(res.length / pageSize)));
      } else {
        setConsultations(res?.consultations || []);
        setTotalRecords(res?.totalRecords || 0);
        setTotalPages(res?.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch completed consultations error:', err);
      setConsultations([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCompleted, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, search]);

  const handleOpenPrintRx = async (consultation) => {
    const patientObj = consultation.patientId || {
      _id: consultation.patientId?._id || consultation.patientId,
      uhid: consultation.uhid,
      patientName: consultation.patientName,
      gender: consultation.gender,
      mobile: consultation.mobile
    };
    try {
      const res = await apiRequest(`/consultation/${patientObj._id || consultation._id}`);
      setPrintRxPatient(patientObj);
      setPrintRxData({
        ...(res?.consultation || consultation),
        medicines: res?.prescription?.medicines || []
      });
    } catch (err) {
      setPrintRxPatient(patientObj);
      setPrintRxData(consultation);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Completed Consultations</h1>
          <p className="text-sm text-gray-500">View all completed consultations with clinical notes and prescriptions</p>
        </div>
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition-all"
            placeholder="Search by patient name or UHID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 h-5 w-5" />
            <h2 className="font-bold text-gray-800 text-lg">Completed Clinical Cases</h2>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            Total Consultations: <strong className="text-gray-900">{totalRecords}</strong>
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl shadow-xs border border-gray-200">
          <table className="w-full min-w-[800px] table-auto text-left text-sm bg-white">
            <thead className="sticky top-0 bg-orange-100/70 text-xs font-bold text-orange-900 uppercase tracking-wider shadow-xs">
              <tr className="border-b border-orange-200">
                <th className="p-3">UHID</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Symptoms</th>
                <th className="p-3">Diagnosis</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading completed consultations...
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-500 font-medium">
                    No completed consultations found.
                  </td>
                </tr>
              ) : (
                consultations.map((consultation) => {
                  const patient = consultation.patientId || {};
                  const symptomsText = Array.isArray(consultation.symptoms)
                    ? consultation.symptoms.map(s => s.symptom || s).filter(Boolean).join(', ')
                    : '-';

                  return (
                    <tr key={consultation._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 font-bold text-orange-600">
                        {formatUhid(patient.uhid || consultation.uhid)}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-gray-950 block text-xs">
                          {patient.patientName || consultation.patientName || 'N/A'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {patient.mobile || consultation.mobile || '-'}
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px] truncate text-gray-700 font-medium">
                        {symptomsText || '-'}
                      </td>
                      <td className="p-3 max-w-[200px] truncate text-gray-700 font-medium">
                        {consultation.diagnosisRemark || consultation.diagnosis || '-'}
                      </td>
                      <td className="p-3 font-bold text-gray-900">
                        {formatDate(consultation.createdAt || consultation.consultationDate)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const pat = {
                                _id: patient._id || consultation.patientId?._id || consultation._id,
                                patientName: patient.patientName || consultation.patientName,
                                uhid: patient.uhid || consultation.uhid,
                                gender: patient.gender || consultation.gender,
                                mobile: patient.mobile || consultation.mobile,
                                demographics: consultation.vitals || patient.demographics
                              };
                              if (onStartConsultation) {
                                onStartConsultation(pat);
                              } else {
                                setSelectedConsultation(pat);
                              }
                            }}
                            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer transition shadow-2xs"
                            title="View / Edit Consultation"
                          >
                            <ClipboardEdit className="h-3.5 w-3.5 text-indigo-600" /> Edit / View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPrintRx(consultation)}
                            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 cursor-pointer transition shadow-2xs"
                            title="Print Digital Rx"
                          >
                            <Printer className="h-3.5 w-3.5 text-green-600" /> Print Rx
                          </button>

                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('billing-desk')}
                              className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 cursor-pointer transition shadow-2xs"
                              title="Create Bill / Invoice"
                            >
                              <CreditCard className="h-3.5 w-3.5 text-orange-600" /> Create Bill
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

          {/* Center: Showing X–Y of Z */}
          <div className="text-xs font-bold text-gray-700 text-center">
            {totalRecords === 0 ? (
              <span>Showing 0 of 0 consultations</span>
            ) : (
              <span>
                Showing <span className="text-gray-900 font-extrabold">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span>–
                <span className="text-gray-900 font-extrabold">{Math.min(currentPage * pageSize, totalRecords).toLocaleString()}</span> of{' '}
                <span className="text-orange-600 font-extrabold">{totalRecords.toLocaleString()}</span> consultations
              </span>
            )}
          </div>

          {/* Right: Modern Pagination Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200/80 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-orange-200/80 transition-all duration-200 shadow-xs cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

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
      {selectedConsultation && (
        <ConsultationModal
          patient={selectedConsultation}
          onClose={() => setSelectedConsultation(null)}
          onSuccess={() => {
            fetchCompleted();
          }}
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
