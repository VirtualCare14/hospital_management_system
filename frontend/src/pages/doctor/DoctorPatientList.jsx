import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Stethoscope, FileText, Send, History } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';

const DoctorPatientList = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [subServices, setSubServices] = useState([]);

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

  const handleSendToSameDay = async (patient) => {
    const chosenType = window.prompt(
      `Send ${patient.patientName} to Same Day Care?\nEnter one of:\n${subServices.join(', ')}`,
      subServices.includes('Minor Injury') ? 'Minor Injury' : subServices[0] || 'Dialysis'
    );
    if (chosenType === null) return;
    const cleanType = chosenType.trim();
    if (!subServices.some(s => s.toLowerCase() === cleanType.toLowerCase())) {
      toast.error(`Invalid care type! Must be one of: ${subServices.join(', ')}`);
      return;
    }
    
    // Find exact cased name from subServices list
    const matchedType = subServices.find(s => s.toLowerCase() === cleanType.toLowerCase());

    try {
      const dob = patient.dob;
      const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      await client.post('/same-day-care/treatment', {
        patientId: patient._id,
        patientName: patient.patientName,
        uhid: patient.uhid,
        mobile: patient.mobile,
        gender: patient.gender,
        age,
        treatmentType: matchedType,
        status: 'Draft'
      });
      toast.success(`${patient.patientName} referred to Same Day Care (${matchedType})!`);
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
                    <td className="p-3">{patient.patientName}</td>
                    <td className="p-3">{patient.mobile}</td>
                    <td className="p-3">
                      Dr. {patient.doctorId?.doctorName || patient.doctorId?.username || 'N/A'}
                    </td>
                    <td className="p-3">{formatDate(patient.appointmentDate)} {patient.slot}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary text-xs inline-flex items-center gap-1" to={`/doctor/consultation/${patient._id}`}>
                          <Stethoscope className="h-3 w-3" /> Consult
                        </Link>
                        <Link className="btn text-xs inline-flex items-center gap-1" to={`/doctor/prescription/${patient._id}`}>
                          <FileText className="h-3 w-3" /> Rx
                        </Link>
                        <button className="btn-secondary text-xs inline-flex items-center gap-1 text-indigo-600"
                          onClick={async () => {
                            if (!window.confirm(`Send ${patient.patientName} to OT (Operation Theatre)?`)) return;
                            try {
                              await client.post('/ipd/referrals', { patientId: patient._id, notes: 'Referred to OT from Doctor Patient List' });
                              toast.success(`${patient.patientName} sent to OT!`);
                            } catch (err) { toast.error(err.response?.data?.message || 'Failed to send to OT'); }
                          }}>
                          <Send className="h-3 w-3" /> OT
                        </button>
                        <Link className="btn-secondary text-xs inline-flex items-center gap-1 text-green-600" to={`/doctor/consultation-track/${patient._id}`}>
                          <History className="h-3 w-3" /> Track
                        </Link>
                        <button className="btn-secondary text-xs inline-flex items-center gap-1 text-orange-600 font-bold"
                          onClick={() => handleSendToSameDay(patient)}>
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
    </div>
  );
};

export default DoctorPatientList;
