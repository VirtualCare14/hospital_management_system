'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, Search, Printer, Calendar, RefreshCw,
  ChevronLeft, ChevronRight, Eye, FileText, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import PrintRxModal from './PrintRxModal';

export default function CompletedConsultationsView() {
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [printRxPatient, setPrintRxPatient] = useState(null);
  const [printRxData, setPrintRxData] = useState(null);

  const fetchCompleted = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/consultation/completed?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${pageSize}`);
      setConsultations(res.consultations || res.data || []);
      setTotalRecords(res.totalRecords ?? res.total ?? 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Fetch completed consultations error:', err);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCompleted, 300);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, search]);

  const handleOpenPrint = async (item) => {
    const patientObj = item.patientId || item;
    try {
      const res = await apiRequest(`/consultation/${patientObj._id || item.patientId}`);
      setPrintRxPatient(patientObj);
      setPrintRxData({
        ...(res?.consultation || item),
        medicines: res?.prescription?.medicines || item.medicines || []
      });
    } catch (err) {
      setPrintRxPatient(patientObj);
      setPrintRxData(item);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Completed Consultations & Rx Archive</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Historical log of concluded consultations, prescription records & clinical reports</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, UHID..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Completed Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">UHID / Patient</th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Consultation Date</th>
                <th className="py-3.5 px-4">Diagnosis / Remarks</th>
                <th className="py-3.5 px-4">Follow-up Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading completed consultations...
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No completed consultation records found.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => {
                  const p = item.patientId || {};
                  const doc = item.doctorId || {};
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600 block">{formatUhid(p.uhid || item.uhid)}</span>
                        <span className="font-bold text-gray-900">{p.patientName || item.patientName}</span>
                        <span className="text-[11px] text-gray-500 block">{p.mobile || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900">Dr. {doc.doctorName || doc.username || 'Doctor'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">
                        {formatDate(item.createdAt || item.appointmentDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-700 line-clamp-2">{item.diagnosisRemark || 'Clinical assessment completed'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.followUpDate ? (
                          <span className="font-bold text-orange-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(item.followUpDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenPrint(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Rx
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
              Page {currentPage} of {totalPages} ({totalRecords} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
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
