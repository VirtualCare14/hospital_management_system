'use client';

import { useState, useEffect } from 'react';
import {
  Users, Search, Stethoscope, Eye, Printer, RefreshCw,
  ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { formatDate } from '@/lib/utils/dateFormat';
import ConsultationModal from './ConsultationModal';
import PrintRxModal from './PrintRxModal';

export default function DoctorPatientsView() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [consultingPatient, setConsultingPatient] = useState(null);
  const [printRxPatient, setPrintRxPatient] = useState(null);
  const [printRxData, setPrintRxData] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/patients/registrations/list', {
        params: {
          page: currentPage,
          limit: pageSize,
          patientName: search || undefined
        }
      });
      setPatients(res.registrations || []);
      setTotalRecords(res.totalRecords ?? res.total ?? 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Fetch patients error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">All Outpatients (Clinic Queue)</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Directory of all clinical cases, quick prescription creation & review</p>
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

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">UHID / Patient</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Assigned Doctor</th>
                <th className="py-3.5 px-4">Last Visit / Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const docName = patient.doctorId?.doctorName || patient.doctorId?.username || 'Doctor';
                  return (
                    <tr key={patient._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600 block">{formatUhid(patient.uhid)}</span>
                        <span className="font-bold text-gray-900">{patient.patientName}</span>
                        <span className="text-[11px] text-gray-500 block">{patient.gender}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">
                        {patient.mobile || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">Dr. {docName}</span>
                        <span className="text-[11px] text-gray-500">{patient.department || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">
                        {formatDate(patient.appointmentDate || patient.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          patient.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {patient.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setConsultingPatient(patient)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5" /> Consult / Rx
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

      {consultingPatient && (
        <ConsultationModal
          patient={consultingPatient}
          onClose={() => setConsultingPatient(null)}
          onSuccess={(p, data) => {
            fetchPatients();
            setPrintRxPatient(p);
            setPrintRxData(data);
          }}
        />
      )}

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
