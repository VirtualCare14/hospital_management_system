import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Stethoscope, FileText, Send, History, X, Scissors, MoreVertical, ClipboardEdit } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';
import { useAuth } from '../../context/AuthContext';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import PaginationFooter from '../../components/PaginationFooter';

const DoctorPatientList = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [subServices, setSubServices] = useState([]);
  const [sameDayModalPatient, setSameDayModalPatient] = useState(null);
  const [sdCareType, setSdCareType] = useState('');
  const [sdSelectedDocId, setSdSelectedDocId] = useState('');
  const [sdRemarks, setSdRemarks] = useState('');
  const [sdDoctors, setSdDoctors] = useState([]);
  const [loadingSdDoctors, setLoadingSdDoctors] = useState(false);
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

  useEffect(() => {
    if (sameDayModalPatient) {
      setLoadingSdDoctors(true);
      client.get('/admin/doctors')
        .then(({ data }) => {
          setSdDoctors(data || []);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load Same Day Care providers list");
        })
        .finally(() => setLoadingSdDoctors(false));
    }
  }, [sameDayModalPatient]);

  useEffect(() => {
    client.get('/ipd/settings').then(({ data }) => {
      const list = [];
      if (data?.sameDayCareCategories) {
        data.sameDayCareCategories.forEach(cat => {
          if (cat.isActive !== false) {
            cat.subServices.forEach(sub => {
              if (sub.isActive !== false) list.push(sub.name);
            });
          }
        });
      }
      setSubServices(list.length > 0 ? list : ['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis']);
    }).catch(() => {
      setSubServices(['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis']);
    });
  }, []);

  const handleSendToSameDayOpen = (patient) => {
    setSameDayModalPatient(patient);
    setSdCareType('');
    setSdSelectedDocId('');
    setSdRemarks(`Referred to Same Day Care by Dr. ${user?.doctorName || user?.username || 'Doctor'}.`);
  };

  const handleSendToSameDaySubmit = async (e) => {
    e.preventDefault();
    if (!sdCareType) {
      toast.error('Please select care type');
      return;
    }
    const chosenDoc = sdDoctors.find(d => d._id === sdSelectedDocId);
    try {
      const dob = sameDayModalPatient.dob;
      const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

      const payload = {
        patientId: sameDayModalPatient.patientId || sameDayModalPatient._id,
        patientName: sameDayModalPatient.patientName,
        uhid: sameDayModalPatient.uhid,
        mobile: sameDayModalPatient.mobile,
        gender: sameDayModalPatient.gender,
        age,
        treatmentType: sdCareType,
        remarks: sdRemarks,
        treatmentDate: new Date(),
        assignedStaffId: sdSelectedDocId || undefined,
        assignedStaffName: chosenDoc ? (chosenDoc.doctorName || chosenDoc.username) : undefined
      };

      await client.post('/ipd/same-day-care', payload);
      toast.success(`${sameDayModalPatient.patientName} referred to Same Day Care (${sdCareType})!`);
      setSameDayModalPatient(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refer patient');
    }
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      client
        .get(`/patients?excludeCompleted=true&search=${encodeURIComponent(search)}&page=${currentPage}&limit=${pageSize}`)
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setPatients(data);
            setTotalRecords(data.length);
            setTotalPages(1);
          } else {
            setPatients(data.patients || []);
            setTotalRecords(data.totalRecords || 0);
            setTotalPages(data.totalPages || 1);
          }
        })
        .catch(() => {
          setPatients([]);
          setTotalRecords(0);
          setTotalPages(1);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, currentPage, pageSize]);

  return (
    <div className="space-y-5">
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

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">All Patients</h1>
          <p className="text-sm text-gray-500">Search by UHID, mobile number, or patient name.</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input"
            style={{paddingLeft: '52px'}}
            placeholder="Search patients"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/70 text-xs uppercase text-orange-900">
              <tr>
                <th className="p-3">UHID</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Appointment</th>
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
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-500">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient, idx) => (
                  <tr key={patient._id} className="border-t border-orange-50">
                    <td className="p-3 font-bold text-orange-700">{patient.uhid}</td>
                    <td className="p-3">
                      <span className="font-bold text-gray-950 block">{patient.patientName}</span>
                      {patient.registeredBy && patient.registeredBy !== 'N/A' && (
                        <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                          Registered by: <span className="capitalize text-orange-600">{patient.registeredBy}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3">{patient.mobile}</td>
                    <td className="p-3">
                      Dr. {patient.doctorId?.doctorName || patient.doctorId?.username || 'N/A'}
                    </td>
                    <td className="p-3">{formatDate(patient.appointmentDate)} {patient.slot}</td>
                    <td className="p-3 pr-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          to={`/doctor/consultation/${patient._id}`}
                          className="relative inline-flex items-center justify-center p-1 rounded-xl cursor-pointer bg-transparent"
                          title="Open Doctor Consultation Form"
                        >
                          <ClipboardEdit className={`h-10 w-10 ${patient.consultationStatus !== 'completed' ? 'eye-catcher-icon' : 'text-emerald-600'}`} />
                        </Link>

                        <div className="relative action-menu-container">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === patient._id ? null : patient._id);
                            }}
                            className="p-1.5 hover:bg-orange-100/70 text-gray-700 hover:text-orange-700 rounded-lg transition-colors border border-orange-200/80 bg-white shadow-sm inline-flex items-center justify-center cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {activeMenuId === patient._id && (
                            <div className={`absolute right-0 ${idx >= patients.length - 2 && patients.length > 2 ? 'bottom-full mb-1' : 'top-10'} z-50 w-48 bg-white rounded-2xl shadow-xl border border-orange-100 py-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left`}>
                              <button
                                type="button"
                                onClick={async () => {
                                  setActiveMenuId(null);
                                  const defaultNotes = `Referred to OT from Doctor Patient List by Dr. ${user?.doctorName || user?.username || 'Doctor'}`;
                                  const customRemarks = window.prompt("Enter remarks for OT Referral:", defaultNotes);
                                  if (customRemarks === null) return;
                                  try {
                                    await client.post('/ipd/referrals', { patientId: patient._id, notes: customRemarks });
                                    toast.success(`${patient.patientName} sent to OT!`);
                                  } catch (err) { toast.error(err.response?.data?.message || 'Failed to send to OT'); }
                                }}
                                className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                              >
                                <Scissors className="h-3.5 w-3.5 text-indigo-600" /> Refer to OT
                              </button>

                              <Link 
                                to={`/doctor/consultation-track/${patient._id}`}
                                onClick={() => setActiveMenuId(null)}
                                className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                              >
                                <History className="h-3.5 w-3.5 text-green-600" /> Clinical Track
                              </Link>

                              <div className="border-t border-orange-50 my-1"></div>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleSendToSameDayOpen(patient);
                                }}
                                className="w-full px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left transition-colors cursor-pointer"
                              >
                                <Send className="h-3.5 w-3.5 text-orange-600" /> Refer Same Day Care
                              </button>
                            </div>
                          )}
                        </div>
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
          itemLabel="patients"
        />
      </div>

      {sameDayModalPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setSameDayModalPatient(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-orange-500" />
              Refer to Same Day Care
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Select Care Type</label>
                <select
                  className="input w-full text-sm"
                  value={sdCareType}
                  onChange={(e) => setSdCareType(e.target.value)}
                  required
                >
                  <option value="">-- Select Care Type --</option>
                  {subServices.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Assign to Provider / Doctor (Optional)</label>
                {loadingSdDoctors ? (
                  <p className="text-xs text-gray-400">Loading providers...</p>
                ) : (
                  <select
                    className="input w-full text-sm"
                    value={sdSelectedDocId}
                    onChange={(e) => setSdSelectedDocId(e.target.value)}
                  >
                    <option value="">-- Select Provider --</option>
                    {sdDoctors.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        {doc.doctorName || doc.username} ({doc.role === 'nursing' ? 'same day care' : doc.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Referral Remarks</label>
                <textarea
                  className="input w-full text-sm h-24 p-2.5 resize-none border border-gray-200 rounded-xl"
                  placeholder="Enter custom remarks for the patient..."
                  value={sdRemarks}
                  onChange={(e) => setSdRemarks(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSameDayModalPatient(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendToSameDaySubmit}
                  className="btn text-xs px-4 py-2"
                >
                  Send Referral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientList;
