import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Clock, 
  User, 
  Stethoscope, 
  RefreshCw,
  ClipboardList,
  Printer,
  X,
  FileText,
  Loader2,
  Activity,
  Bed,
  Home,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const IpdAdmission = () => {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loadingAdmissions, setLoadingAdmissions] = useState(false);
  const [activeTab, setActiveTab] = useState('admit-existing'); // 'admit-existing' or 'admit-new'
  
  // Hospital Settings (for Branding & Printing)
  const [hospitalSettings, setHospitalSettings] = useState(null);

  // IPD Settings (Custom Statuses & Timeout)
  const [ipdSettings, setIpdSettings] = useState({
    admissionStatuses: ['Admitted', 'Under Observation', 'Shifted', 'Discharged'],
    reservationTimeout: 15
  });

  // Existing Patient Search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // New Patient Form States (OPD Registration criteria)
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientMobile, setNewPatientMobile] = useState('');
  const [newPatientAadhaar, setNewPatientAadhaar] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('');
  const [newPatientAddress, setNewPatientAddress] = useState('');
  const [newPatientDept, setNewPatientDept] = useState('');
  const [newPatientDoc, setNewPatientDoc] = useState('');
  const [newPatientSlot, setNewPatientSlot] = useState('');
  const [newPatientDate, setNewPatientDate] = useState('');
  
  // Available Slots (OPD Registration requirement)
  const allSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
  const [bookedSlots, setBookedSlots] = useState([]);
  const freeSlots = allSlots.filter(s => !bookedSlots.includes(s));

  // Bed allocation selectors
  const [roomsList, setRoomsList] = useState([]); // lists room configurations
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [bedsList, setBedsList] = useState([]); // beds of selected room type
  const [selectedBedId, setSelectedBedId] = useState('');
  
  // Clinical / Doctor list
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(''); // Consultant Doctor
  const [referredDoctorId, setReferredDoctorId] = useState(''); // Referred Doctor
  const [selectedStatus, setSelectedStatus] = useState('Admitted');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().substring(0, 16)); // format: YYYY-MM-DDTHH:MM
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');

  // Post-Admission Print modal states
  const [receiptModalAdmission, setReceiptModalAdmission] = useState(null);

  // OPD Referrals state
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [referralSearch, setReferralSearch] = useState('');

  // Load admissions list
  const loadAdmissions = async () => {
    setLoadingAdmissions(true);
    try {
      const { data } = await client.get('/ipd/admissions');
      setAdmissions(data);
    } catch (err) {
      toast.error('Failed to load active admissions.');
    } finally {
      setLoadingAdmissions(false);
    }
  };

  // Load OPD referrals
  const loadReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const { data } = await client.get('/ipd/referrals', { params: { status: 'Pending' } });
      setReferrals(data || []);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  // Load configuration details (rooms, departments, doctors)
  const loadConfigData = async () => {
    try {
      // 1. Load active rooms configs
      const { data: rooms } = await client.get('/rooms');
      setRoomsList(rooms);
      if (rooms.length > 0) {
        setSelectedRoomType(rooms[0].roomType);
      }

      // 2. Load departments (admin only - handle gracefully for non-admin users)
      try {
        const { data: depts } = await client.get('/admin/departments');
        setDepartments(depts.filter(d => d.isActive));
      } catch (err) {
        console.warn('Could not load departments (admin access required):', err.message);
        setDepartments([]);
      }

      // 3. Load active doctors (admin only - handle gracefully for non-admin users)
      try {
        const { data: docs } = await client.get('/admin/doctors');
        setDoctors(docs);
      } catch (err) {
        console.warn('Could not load doctors (admin access required):', err.message);
        setDoctors([]);
      }

      // 4. Load Hospital Details (Branding) - admin only
      if (user?.role === 'admin') {
        try {
          const { data: settingsRes } = await client.get('/admin/hospital-settings');
          if (settingsRes && settingsRes.exists) {
            setHospitalSettings(settingsRes.data);
          }
        } catch (err) {
          console.warn('Could not load hospital settings (admin access required):', err.message);
          setHospitalSettings(null);
        }
      }

      // 5. Load IPD Settings (Custom statuses and prefixes)
      try {
        const { data: ipdSettingsRes } = await client.get('/ipd/settings');
        if (ipdSettingsRes) {
          setIpdSettings(ipdSettingsRes);
          if (ipdSettingsRes.admissionStatuses?.length > 0) {
            setSelectedStatus(ipdSettingsRes.admissionStatuses[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load IPD settings:', err.message);
      }
    } catch (err) {
      console.error('Failed to load configuration details:', err);
    }
  };

  useEffect(() => {
    loadAdmissions();
    loadReferrals();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadConfigData();
  }, [user]);

  // Fetch patients when typing search query
  useEffect(() => {
    if (activeTab !== 'admit-existing') return;
    if (patientSearch.trim().length < 2) {
      setPatientsList([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await client.get(`/patients?search=${encodeURIComponent(patientSearch)}`);
        setPatientsList(data);
      } catch (err) {
        console.error('Error searching patients:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [patientSearch, activeTab]);

  // Fetch beds whenever room type changes
  useEffect(() => {
    if (!selectedRoomType) {
      setBedsList([]);
      setSelectedBedId('');
      return;
    }
    
    client.get(`/rooms/beds?roomType=${encodeURIComponent(selectedRoomType)}`)
      .then(({ data }) => {
        setBedsList(data);
        setSelectedBedId('');
      })
      .catch(() => {
        setBedsList([]);
        setSelectedBedId('');
      });
  }, [selectedRoomType, roomsList]);

  // Load booked slots for new patient registration
  useEffect(() => {
    if (newPatientDoc && newPatientDate) {
      client.get(`/patients/booked-slots?doctorId=${newPatientDoc}&date=${newPatientDate}`)
        .then(({ data }) => setBookedSlots(data))
        .catch(() => setBookedSlots([]));
    } else {
      setBookedSlots([]);
    }
  }, [newPatientDoc, newPatientDate]);

  // Load doctors for patient registration based on selected department
  const [regDoctorsList, setRegDoctorsList] = useState([]);
  useEffect(() => {
    setNewPatientDoc('');
    setNewPatientSlot('');
    setBookedSlots([]);

    if (!newPatientDept) {
      setRegDoctorsList([]);
      return;
    }

    client.get(`/admin/doctors?department=${encodeURIComponent(newPatientDept)}`)
      .then(({ data }) => setRegDoctorsList(data))
      .catch(() => setRegDoctorsList([]));
  }, [newPatientDept]);

  // Handle selecting a referral for admission
  const handleSelectReferral = (referral) => {
    setSelectedReferral(referral);
    // Pre-fill patient data from referral
    setSelectedPatient({
      _id: referral.patientId?._id || referral.patientId,
      patientName: referral.patientName,
      uhid: referral.uhid,
      mobile: referral.mobile,
      gender: referral.gender,
      dob: referral.patientId?.dob,
      address: referral.patientId?.address
    });
    // Set referred doctor
    if (referral.referredByDoctor?._id) {
      setReferredDoctorId(referral.referredByDoctor._id);
    }
    setProvisionalDiagnosis(referral.notes || referral.diagnosis || '');
    // Switch to admit-existing tab
    setActiveTab('admit-existing');
    toast.success(`Patient ${referral.patientName} loaded from OPD referral`);
  };

  // Handle Admission Submission
  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();

    let finalPatientId = null;

    if (activeTab === 'admit-existing') {
      if (!selectedPatient) {
        toast.error('Please select an existing patient first.');
        return;
      }
      finalPatientId = selectedPatient._id;
    } else {
      // Register new patient first
      if (!newPatientName || !newPatientMobile || !newPatientAadhaar || !newPatientDob || !newPatientGender || !newPatientAddress || !newPatientDept || !newPatientDoc || !newPatientDate || !newPatientSlot) {
        toast.error('All patient registration fields are required.');
        return;
      }

      try {
        const regPayload = {
          patientName: newPatientName,
          mobile: newPatientMobile,
          aadhaar: newPatientAadhaar,
          dob: newPatientDob,
          gender: newPatientGender,
          address: newPatientAddress,
          department: newPatientDept,
          doctorId: newPatientDoc,
          appointmentDate: newPatientDate,
          slot: newPatientSlot
        };

        const { data: regRes } = await client.post('/patients/create', regPayload);
        toast.success(`New patient registered with UHID: ${formatUhid(regRes.patient.uhid)}`);
        finalPatientId = regRes.patient.patientId || regRes.patient._id;
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to register new patient.');
        return;
      }
    }

    // Now proceed to Admit Patient
    if (!selectedRoomType || !selectedBedId || !selectedDoctorId) {
      toast.error('Please select room type, bed number, and consultant doctor.');
      return;
    }

    try {
      const admitPayload = {
        patientId: finalPatientId,
        roomId: roomsList.find(r => r.roomType === selectedRoomType)?._id,
        bedId: selectedBedId,
        doctorInCharge: selectedDoctorId,
        referredDoctor: referredDoctorId || undefined,
        status: selectedStatus,
        admissionDate: admissionDate,
        provisionalDiagnosis: provisionalDiagnosis
      };

      const { data } = await client.post('/ipd/admit', admitPayload);
      toast.success(data.message || 'Patient admitted successfully!');
      
      // Load full admissions list to find the newly created admission (for print modal)
      const { data: updatedAdmissions } = await client.get('/ipd/admissions');
      setAdmissions(updatedAdmissions);
      
      // Select the new admission record by checking patient ID
      const newRecord = updatedAdmissions.find(a => a.patientId?._id === finalPatientId && a.status !== 'Discharged');
      if (newRecord) {
        setReceiptModalAdmission(newRecord);
      }

      // Update referral status if this was from a referral
      if (selectedReferral) {
        try {
          await client.put(`/ipd/referrals/${selectedReferral._id}`, {
            status: 'Admitted',
            admissionId: newRecord?._id
          });
          loadReferrals();
        } catch (err) {
          console.error('Failed to update referral status:', err);
        }
      }

      // Reset forms
      setSelectedPatient(null);
      setPatientSearch('');
      setSelectedBedId('');
      setReferredDoctorId('');
      setSelectedReferral(null);
      setProvisionalDiagnosis('');
      
      // Clear new patient registration inputs
      setNewPatientName('');
      setNewPatientMobile('');
      setNewPatientAadhaar('');
      setNewPatientDob('');
      setNewPatientGender('');
      setNewPatientAddress('');
      setNewPatientDept('');
      setNewPatientDoc('');
      setNewPatientDate('');
      setNewPatientSlot('');

      // Refresh listings
      loadConfigData();
      
      // Trigger bed list reload
      const currentRoom = selectedRoomType;
      setSelectedRoomType('');
      setTimeout(() => setSelectedRoomType(currentRoom), 50);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to admit patient.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const filteredBeds = bedsList.filter(b => b.status === 'Available');
  const selectedBedDetails = bedsList.find(b => b._id === selectedBedId);

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 font-sans text-gray-800">
      <div className="space-y-6 no-print">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-orange-100/50 pb-4">
          <div>
            <h1 className="text-[36px] font-black text-gray-900 tracking-tight leading-tight">IPD Inpatient Admissions</h1>
            <p className="text-[14px] text-gray-500 mt-1">Admit patient cases to available beds, assign clinical consultants, and print admission summary cards.</p>
          </div>
          <button 
            type="button"
            onClick={loadAdmissions} 
            className="btn-secondary h-11 px-5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm border border-gray-250 cursor-pointer" 
            title="Reload list"
          >
            <RefreshCw className="h-4 w-4" /> Reload Admissions
          </button>
        </div>

        {/* Grid Layout: Form on Left, List on Right */}
        <div className="grid gap-6 lg:grid-cols-[550px_1fr] items-start">

          {/* LEFT PANEL: split cards form */}
          <form onSubmit={handleAdmissionSubmit} className="space-y-6">

            {/* CARD 1: Patient Information */}
            <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-100">
              <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                  <User className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900 leading-none">Patient Information</h2>
                  <p className="text-[11px] text-gray-400 mt-1">Identify or register the patient for ward admission</p>
                </div>
              </div>

              {/* Form Tabs inside Section 1 */}
              <div className="flex bg-gray-55 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => { setActiveTab('admit-existing'); setSelectedPatient(null); }}
                  className={`flex-1 py-2 font-bold text-center rounded-md transition-all cursor-pointer ${
                    activeTab === 'admit-existing' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Admit Registered Patient
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('admit-new'); setSelectedPatient(null); }}
                  className={`flex-1 py-2 font-bold text-center rounded-md transition-all cursor-pointer ${
                    activeTab === 'admit-new' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Register & Admit New
                </button>
              </div>

              {activeTab === 'admit-existing' && (
                <div className="space-y-3">
                  {!selectedPatient ? (
                    <div className="relative">
                      <label className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Search Patient</label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by UHID, Name, or Mobile..."
                          className="input pl-10 h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                        />
                      </div>

                      {/* Patient Results Autocomplete Box */}
                      {patientsList.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[220px] overflow-y-auto divide-y divide-gray-100">
                          {patientsList.map((pat) => (
                            <button
                              key={pat._id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(pat);
                                setPatientsList([]);
                                setPatientSearch('');
                              }}
                              className="w-full text-left p-3 hover:bg-orange-50/30 text-xs flex justify-between items-center transition cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-gray-800 text-sm">{pat.patientName}</p>
                                <p className="text-gray-500 mt-0.5">{pat.mobile} • {pat.gender}</p>
                              </div>
                              <span className="font-mono bg-orange-50 border border-orange-100 text-orange-850 px-2 py-0.5 rounded text-[10px] font-bold">
                                {formatUhid(pat.uhid)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {patientSearch.trim().length >= 2 && patientsList.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg p-4 text-center text-xs text-gray-500">
                          No registered patients found.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Patient Summary Card (Redesigned as per Apollo/Epic Spec) */
                    <div className="bg-orange-50/20 border border-orange-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-3.5 items-start">
                        <div className="bg-orange-500 text-white p-3 rounded-lg flex-shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-gray-900 text-base leading-none">{selectedPatient.patientName}</p>
                            <span className="font-mono bg-orange-100 text-orange-850 px-2 py-0.5 rounded text-[10px] font-bold">{formatUhid(selectedPatient.uhid)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600 mt-1">
                            <div><span className="font-bold text-gray-400 uppercase text-[9px] block">Age</span> {selectedPatient.dob ? Math.floor((new Date() - new Date(selectedPatient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} yrs</div>
                            <div><span className="font-bold text-gray-400 uppercase text-[9px] block">Gender</span> {selectedPatient.gender}</div>
                            <div><span className="font-bold text-gray-400 uppercase text-[9px] block">Mobile</span> {selectedPatient.mobile}</div>
                            <div><span className="font-bold text-gray-400 uppercase text-[9px] block">Blood Group</span> N/A</div>
                            <div className="col-span-2"><span className="font-bold text-gray-400 uppercase text-[9px] block">Address</span> {selectedPatient.address || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="text-xs font-bold text-red-650 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors h-9 flex items-center cursor-pointer flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'admit-new' && (
                /* TWO COLUMN DEMOGRAPHICS LAYOUT WITHOUT SCROLLBARS */
                <div className="space-y-4 pt-1">
                  <p className="text-[11px] font-extrabold uppercase text-orange-500 tracking-wider mb-2 border-b border-orange-50 pb-1">Patient Demographics</p>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Patient Name *</span>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Mobile Number *</span>
                      <input
                        type="text"
                        placeholder="Enter mobile"
                        className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        value={newPatientMobile}
                        onChange={(e) => setNewPatientMobile(e.target.value)}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Aadhaar Number *</span>
                      <input
                        type="text"
                        placeholder="Enter Aadhaar"
                        className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        value={newPatientAadhaar}
                        onChange={(e) => setNewPatientAadhaar(e.target.value)}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Gender *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700"
                        value={newPatientGender}
                        onChange={(e) => setNewPatientGender(e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Date of Birth *</span>
                      <input
                        type="date"
                        className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-750"
                        value={newPatientDob}
                        onChange={(e) => setNewPatientDob(e.target.value)}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Address *</span>
                    <textarea
                      placeholder="Full residential address"
                      className="input py-2.5 text-sm rounded-lg min-h-[60px] border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      value={newPatientAddress}
                      onChange={(e) => setNewPatientAddress(e.target.value)}
                    />
                  </label>

                  <p className="text-[11px] font-extrabold uppercase text-orange-500 tracking-wider my-3 border-t border-orange-50 pt-3">OPD Appointment Details *</p>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">OPD Department *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={newPatientDept}
                        onChange={(e) => setNewPatientDept(e.target.value)}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept.departmentName}>{dept.departmentName}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Doctor *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={newPatientDoc}
                        onChange={(e) => setNewPatientDoc(e.target.value)}
                        disabled={!newPatientDept}
                      >
                        <option value="">Select Doctor</option>
                        {regDoctorsList.map((doc) => (
                          <option key={doc._id} value={doc._id}>Dr. {doc.doctorName || doc.username}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Date *</span>
                      <input
                        type="date"
                        className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={newPatientDate}
                        onChange={(e) => setNewPatientDate(e.target.value)}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase text-gray-500">Slot *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={newPatientSlot}
                        onChange={(e) => setNewPatientSlot(e.target.value)}
                        disabled={!newPatientDoc || !newPatientDate}
                      >
                        <option value="">Select Slot</option>
                        {freeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* CONDITIONAL RENDER SECTIONS 2-5 */}
            {(selectedPatient || activeTab === 'admit-new') && (
              <div className="space-y-6">

                {/* CARD 2: Bed Allocation */}
                <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-100">
                  <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                    <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                      <Bed className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 leading-none">Bed Allocation</h2>
                      <p className="text-[11px] text-gray-400 mt-1">Assign ward category and bed slot</p>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Room Type *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={selectedRoomType}
                        onChange={(e) => setSelectedRoomType(e.target.value)}
                      >
                        <option value="">Select Room Type</option>
                        {[...new Set(roomsList.map(r => r.roomType))].map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Bed Number *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={selectedBedId}
                        onChange={(e) => setSelectedBedId(e.target.value)}
                        disabled={!selectedRoomType}
                      >
                        <option value="">Select Bed</option>
                        {filteredBeds.map((bed) => {
                          const displayLabel = `${bed.bedNumber} | ${bed.bedType} | ₹${bed.pricePerDay}/day`;
                          return (
                            <option 
                              key={bed._id} 
                              value={bed._id}
                              className="text-green-705 bg-green-50"
                            >
                              {displayLabel}
                            </option>
                          );
                        })}
                        {filteredBeds.length === 0 && selectedRoomType && (
                          <option value="" disabled>No available beds in this room type</option>
                        )}
                      </select>
                    </label>
                  </div>

                  {selectedBedDetails && (
                    <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3.5 flex justify-between items-center text-sm font-bold text-orange-900 shadow-inner">
                      <span className="text-xs uppercase tracking-wide text-orange-700">Allocated Bed Rate:</span>
                      <span className="text-base font-black text-orange-850">₹{selectedBedDetails.pricePerDay} / day</span>
                    </div>
                  )}
                </div>

                {/* CARD 3: Consultant Details */}
                <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-100">
                  <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                    <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                      <Stethoscope className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 leading-none">Consultant Details</h2>
                      <p className="text-[11px] text-gray-400 mt-1">Assign primary and referring physicians</p>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-1">
                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Consultant Doctor *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                      >
                        <option value="">Select Consultant</option>
                        {doctors.map((doc) => (
                          <option key={doc._id} value={doc._id}>Dr. {doc.doctorName || doc.username} ({doc.specialization || doc.department})</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Referred Doctor (Optional)</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-705"
                        value={referredDoctorId}
                        onChange={(e) => setReferredDoctorId(e.target.value)}
                      >
                        <option value="">Select Referred Doctor</option>
                        {doctors.map((doc) => (
                          <option key={doc._id} value={doc._id}>Dr. {doc.doctorName || doc.username}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* CARD 4: Clinical Information */}
                <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-100">
                  <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                    <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                      <ClipboardList className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 leading-none">Clinical Information</h2>
                      <p className="text-[11px] text-gray-400 mt-1">Diagnosis and patient admission comments</p>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Provisional Diagnosis / Remarks</span>
                    <textarea
                      className="input py-2.5 text-sm h-24 resize-none border border-gray-250 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700"
                      placeholder="Enter provisional diagnosis or clinical remarks..."
                      value={provisionalDiagnosis}
                      onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                    />
                  </label>
                </div>

                {/* CARD 5: Admission Details */}
                <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-100">
                  <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                    <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                      <Clock className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-[18px] font-bold text-gray-900 leading-none">Admission Details</h2>
                      <p className="text-[11px] text-gray-400 mt-1">Specify date and initial clinical status</p>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Initial Status *</span>
                      <select
                        className="input h-11 text-sm rounded-lg bg-white font-semibold border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        {ipdSettings.admissionStatuses?.map((stat) => (
                          <option key={stat} value={stat}>{stat}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold uppercase tracking-wide text-gray-500">Admitted Date *</span>
                      <input
                        type="datetime-local"
                        className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700"
                        value={admissionDate}
                        onChange={(e) => setAdmissionDate(e.target.value)}
                      />
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    className="btn h-11 rounded-lg text-sm font-bold w-full mt-2 shadow flex items-center justify-center gap-2 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Admit Patient Case
                  </button>
                </div>

              </div>
            )}

          </form>

          {/* RIGHT PANEL: listings and referrals */}
          <div className="space-y-6">

            {/* OPD Referrals Card */}
            <div className="card overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-indigo-50/15">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> OPD Referrals
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500">
                    {referrals.filter(r => r.status === 'Pending').length} Pending
                  </span>
                  <button 
                    onClick={loadReferrals} 
                    className="btn-secondary text-xs h-8 px-2.5 rounded-lg border border-gray-250 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingReferrals ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {loadingReferrals ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-xs text-gray-550 mt-2">Loading referrals...</p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-sm font-bold text-gray-500">No OPD referrals pending</p>
                  <p className="text-xs mt-1 text-gray-400">Patients referred from OPD clinics will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold uppercase text-gray-550 border-b border-gray-150">
                        <th className="p-3 pl-4">Patient / UHID</th>
                        <th className="p-3">Referred By</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {referrals.map((ref) => (
                        <tr key={ref._id} className={`hover:bg-indigo-50/5 transition-all text-xs font-medium text-gray-700 ${
                          selectedReferral?._id === ref._id ? 'bg-indigo-50/20' : ''
                        }`}>
                          <td className="p-3 pl-4">
                            <p className="font-bold text-gray-900">{ref.patientName}</p>
                            <span className="font-mono text-indigo-700 text-[10px] block font-bold mt-0.5">
                              {formatUhid(ref.uhid)}
                            </span>
                            {ref.notes && (
                              <p className="text-[10px] text-gray-550 italic mt-1 max-w-xs bg-indigo-50/20 p-1.5 rounded border border-indigo-50/50">
                                Remarks: {ref.notes}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-gray-650">
                            Dr. {ref.referredByDoctor?.doctorName || ref.referredByDoctor?.username || 'N/A'}
                          </td>
                          <td className="p-3 text-[11px] text-gray-500 font-semibold">
                            {new Date(ref.referredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-3 text-center">
                            {ref.status === 'Pending' && (
                              <button
                                onClick={() => handleSelectReferral(ref)}
                                className="btn text-[11px] h-8 px-3 rounded-lg flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              >
                                <Plus className="h-3 w-3" /> Admit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inpatient Wards Card */}
            <div className="card overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-orange-50/15">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-50 border border-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
                    <Bed className="h-3.5 w-3.5" /> Inpatient Wards
                  </span>
                </div>
                <span className="text-xs font-black text-gray-555">
                  {admissions.filter(a => a.status !== 'Discharged').length} Admitted Cases
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-55 text-[10px] font-bold uppercase text-gray-550 border-b border-gray-150">
                      <th className="p-3.5 pl-4">Patient Details</th>
                      <th className="p-3.5">IPD / PID Numbers</th>
                      <th className="p-3.5">Location Room</th>
                      <th className="p-3.5">Admitted Time</th>
                      <th className="p-3.5">Consultant</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 pr-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                    {admissions.filter(a => a.status !== 'Discharged').map((admission) => (
                      <tr 
                        key={admission._id} 
                        className="hover:bg-orange-50/5 transition-colors bg-white font-medium"
                      >
                        <td className="p-3.5 pl-4">
                          <p className="font-bold text-gray-900 text-sm">{admission.patientId?.patientName || 'N/A'}</p>
                          <span className="font-mono text-orange-700 text-[10px] block font-bold mt-0.5">
                            {formatUhid(admission.patientId?.uhid) || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-mono font-bold text-xs text-gray-800">IPD: {admission.ipdNumber || 'N/A'}</p>
                          <span className="font-mono text-[10px] text-gray-400 block font-semibold mt-0.5">PID: {admission.pidNumber || 'N/A'}</span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-gray-850">{admission.roomId?.roomType || 'N/A'}</p>
                          <span className="font-mono bg-orange-50 border border-orange-100 text-orange-850 text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5 inline-block">
                            {admission.bedId?.bedNumber || 'N/A'} (₹{admission.bedId?.pricePerDay || 0}/day)
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-500 font-semibold">
                          {new Date(admission.admissionDate).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                            <span>Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold bg-green-50 border border-green-200 text-green-700 leading-none">
                            <CheckCircle className="h-2.5 w-2.5 text-green-500" /> Admitted
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setReceiptModalAdmission(admission)}
                            className="p-2 text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg cursor-pointer transition-colors"
                            title="View/Print Admission Summary"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {admissions.filter(a => a.status !== 'Discharged').length === 0 && !loadingAdmissions && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-450 italic">
                          No active admissions found in the system.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* POST-ADMISSION PRINT CARD MODAL */}
      {receiptModalAdmission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white admission-print-overlay">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-6 print:border-0 print:shadow-none print:p-0 print:m-0 admission-print-card">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-orange-50 pb-3 print:hidden">
              <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <FileText className="text-orange-500 h-5 w-5" /> Admission Summary Receipt
              </h2>
              <button
                type="button"
                onClick={() => setReceiptModalAdmission(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-orange-50 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="space-y-6 print:block">
              {/* Hospital details banner */}
              <div className="text-center border-b border-orange-100 pb-4">
                {hospitalSettings?.logoUrl ? (
                  <img src={hospitalSettings.logoUrl} alt="logo" className="h-12 mx-auto mb-2 object-contain" />
                ) : (
                  <div className="bg-orange-500 text-white p-2 rounded-2xl w-10 h-10 mx-auto flex items-center justify-center font-bold text-lg mb-2">H</div>
                )}
                <h1 className="text-xl font-black text-gray-900">{hospitalSettings?.hospitalName || 'Hospital Care'}</h1>
                <p className="text-[10px] text-gray-400 font-semibold max-w-[250px] mx-auto mt-0.5">{hospitalSettings?.address}</p>
                <p className="text-[10px] text-orange-600 font-bold mt-0.5">Mobile: {hospitalSettings?.mobileNumbers?.join(', ')}</p>
              </div>

              {/* Admission numbers header */}
              <div className="flex justify-between text-xs border-b border-orange-50 pb-2">
                <div>
                  <span className="text-gray-400 block font-bold">IPD CASE ID</span>
                  <span className="font-mono font-black text-gray-900 text-sm">{receiptModalAdmission.ipdNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block font-bold">ADMISSION ID (PID)</span>
                  <span className="font-mono font-black text-gray-900 text-sm">{receiptModalAdmission.pidNumber}</span>
                </div>
              </div>

              {/* Patient Profile */}
              <div className="space-y-2 bg-orange-50/20 p-3 rounded-2xl border border-orange-50 text-xs">
                <span className="text-[10px] font-black uppercase text-orange-600 block border-b border-orange-50 pb-1">Patient Details</span>
                <div className="grid gap-2 grid-cols-2">
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">NAME</span>
                    <span className="font-bold text-gray-800">{receiptModalAdmission.patientId?.patientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">UHID</span>
                    <span className="font-mono font-bold text-gray-800">{formatUhid(receiptModalAdmission.patientId?.uhid)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">GENDER / DOB</span>
                    <span className="font-bold text-gray-800">{receiptModalAdmission.patientId?.gender} • {new Date(receiptModalAdmission.patientId?.dob).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">MOBILE</span>
                    <span className="font-bold text-gray-800">{receiptModalAdmission.patientId?.mobile}</span>
                  </div>
                </div>
              </div>

              {/* Bed allocation details */}
              <div className="space-y-2 bg-orange-50/20 p-3 rounded-2xl border border-orange-50 text-xs">
                <span className="text-[10px] font-black uppercase text-orange-600 block border-b border-orange-50 pb-1">Ward Assignment</span>
                <div className="grid gap-2 grid-cols-2">
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">ROOM CATEGORY</span>
                    <span className="font-bold text-gray-800">{receiptModalAdmission.roomId?.roomType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">BED NUMBER</span>
                    <span className="font-mono font-bold text-gray-800">{receiptModalAdmission.bedId?.bedNumber} ({receiptModalAdmission.bedId?.bedType})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">ADMITTED DATE</span>
                    <span className="font-bold text-gray-800">{new Date(receiptModalAdmission.admissionDate).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">DAILY RATE</span>
                    <span className="font-bold text-orange-600">₹{receiptModalAdmission.bedId?.pricePerDay} / day</span>
                  </div>
                </div>
              </div>

              {/* Doctors in charge */}
              <div className="space-y-2 bg-orange-50/20 p-3 rounded-2xl border border-orange-50 text-xs">
                <span className="text-[10px] font-black uppercase text-orange-600 block border-b border-orange-50 pb-1">Physician Consultant</span>
                <div className="grid gap-2 grid-cols-2">
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">CONSULTANT IN CHARGE</span>
                    <span className="font-bold text-gray-800">Dr. {receiptModalAdmission.doctorInCharge?.doctorName || receiptModalAdmission.doctorInCharge?.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] font-bold">ADMISSION STATUS</span>
                    <span className="font-bold text-gray-800">{receiptModalAdmission.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Buttons (Print/Close) */}
            <div className="flex gap-2 border-t border-orange-50 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setReceiptModalAdmission(null)}
                className="btn-secondary flex-1 text-xs py-2.5 rounded-lg border border-gray-250 cursor-pointer h-11 text-sm font-bold flex items-center justify-center transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="btn flex-1 text-xs py-2.5 rounded-lg bg-orange-650 hover:bg-orange-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer h-11 text-sm transition-colors shadow"
              >
                <Printer className="h-4 w-4" /> Print Admission Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printing Stylesheet */}
      <style>{`
        @media print {
          /* Hide non-print elements */
          aside, header, nav, .no-print {
            display: none !important;
          }
          
          /* Reset page margins */
          @page {
            size: auto;
            margin: 10mm !important;
          }

          body, html, #root, #root > div {
            background: white !important;
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Ensure the overlay wrapper doesn't block layout or position incorrectly */
          .admission-print-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            z-index: auto !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }

          .admission-print-card {
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 20px auto !important;
            width: 100% !important;
            max-width: 450px !important;
            background: white !important;
          }
          
          /* Reset background colors of details block for print visibility */
          .bg-orange-50\\/20 {
            background-color: #fffaf0 !important;
            border-color: #fed7aa !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IpdAdmission;
