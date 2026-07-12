import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Stethoscope, FileText, Send, History, X } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';
import { useAuth } from '../../context/AuthContext';

const DoctorPatientList = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [subServices, setSubServices] = useState([]);
  const [sameDayModalPatient, setSameDayModalPatient] = useState(null);
  const [sdCareType, setSdCareType] = useState('Minor Injury');
  const [sdSelectedDocId, setSdSelectedDocId] = useState('');
  const [sdRemarks, setSdRemarks] = useState('');
  const [sdDoctors, setSdDoctors] = useState([]);
  const [loadingSdDoctors, setLoadingSdDoctors] = useState(false);

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
    setSdCareType(subServices.includes('Minor Injury') ? 'Minor Injury' : subServices[0] || 'Dialysis');
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
      await client.post('/same-day-care/treatment', {
        patientId: sameDayModalPatient._id,
        patientName: sameDayModalPatient.patientName,
        uhid: sameDayModalPatient.uhid,
        mobile: sameDayModalPatient.mobile,
        gender: sameDayModalPatient.gender,
        age,
        treatmentType: sdCareType,
        referredByDoctorRemarks: sdRemarks,
        assignedStaffId: sdSelectedDocId || null,
        assignedStaffName: chosenDoc ? (chosenDoc.doctorName || chosenDoc.username) : '',
        status: 'Draft'
      });
      toast.success(`${sameDayModalPatient.patientName} referred to Same Day Care (${sdCareType})!`);
      setSameDayModalPatient(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refer patient');
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      client
        .get(`/patients?excludeCompleted=true&search=${encodeURIComponent(search)}`)
        .then(({ data }) => setPatients(data))
        .catch(() => setPatients([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-5">
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

      <div className="card overflow-hidden">
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
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-sm text-gray-500">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
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
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link 
                          className={`text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition duration-150 cursor-pointer text-white ${
                            patient.consultationStatus === 'completed' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`} 
                          to={`/doctor/consultation/${patient._id}`}
                        >
                          <Stethoscope className="h-3 w-3" /> Consult
                        </Link>
                        <Link 
                          className={`text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition duration-150 cursor-pointer ${
                            patient.consultationStatus === 'completed' 
                              ? (patient.hasPrescription 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-orange-500 text-white hover:bg-orange-600') 
                              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`} 
                          to={`/doctor/prescription/${patient._id}`}
                        >
                          <FileText className="h-3 w-3" /> Rx
                        </Link>
                         <button className="btn-secondary text-xs inline-flex items-center gap-1 text-indigo-600"
                          onClick={async () => {
                            const defaultNotes = `Referred to OT from Doctor Patient List by Dr. ${user?.doctorName || user?.username || 'Doctor'}`;
                            const customRemarks = window.prompt("Enter remarks for OT Referral:", defaultNotes);
                            if (customRemarks === null) return;
                            try {
                              await client.post('/ipd/referrals', { patientId: patient._id, notes: customRemarks });
                              toast.success(`${patient.patientName} sent to OT!`);
                            } catch (err) { toast.error(err.response?.data?.message || 'Failed to send to OT'); }
                          }}>
                          <Send className="h-3 w-3" /> OT
                        </button>
                        <Link className="btn-secondary text-xs inline-flex items-center gap-1 text-green-600" to={`/doctor/consultation-track/${patient._id}`}>
                          <History className="h-3 w-3" /> Track
                        </Link>
                        <button className="btn-secondary text-xs inline-flex items-center gap-1 text-orange-600 font-bold"
                          onClick={() => handleSendToSameDayOpen(patient)}>
                          <Send className="h-3 w-3" /> Same Day Care
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
