import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Bed, 
  CheckCircle, 
  Clock, 
  LogOut, 
  User, 
  Stethoscope, 
  RefreshCw,
  ClipboardList,
  Printer,
  X,
  FileText,
  Loader2
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
    // Switch to admit-existing tab
    setActiveTab('admit-existing');
    toast.success(`Patient ${referral.patientName} loaded from OPD referral`);
  };

  // Handle discharging a patient
  const handleDischarge = async (admissionId) => {
    if (!window.confirm('Are you sure you want to discharge this patient? This releases the bed.')) {
      return;
    }

    try {
      const { data } = await client.post(`/ipd/admissions/${admissionId}/discharge`);
      toast.success(data.message || 'Patient discharged successfully!');
      loadAdmissions();
      loadConfigData();
      if (selectedRoomType) {
        const currentRoom = selectedRoomType;
        setSelectedRoomType('');
        setTimeout(() => setSelectedRoomType(currentRoom), 50);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to discharge patient.');
    }
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
        finalPatientId = regRes.patient._id;
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
        admissionDate: admissionDate
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">IPD Inpatient Admissions</h1>
          <p className="text-sm text-gray-500">Admit patient cases to available beds, assign clinical consultants, and print admission summary cards.</p>
        </div>
        <button onClick={loadAdmissions} className="btn-secondary" title="Reload list">
          <RefreshCw className="h-4 w-4" /> Reload Admissions
        </button>
      </div>

      {/* Grid Layout: Form on Left, List on Right */}
      <div className="grid gap-6 lg:grid-cols-[550px_1fr]">

        {/* LEFT COLUMN: ADMIT PATIENT FORM */}
        <div className="card p-6 h-fit space-y-5">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <span className="bg-orange-500 text-white p-2 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Patient Admission</h2>
              <p className="text-xs text-gray-500">Register or select a patient and allocate a bed</p>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-orange-100 text-sm">
            <button
              onClick={() => { setActiveTab('admit-existing'); setSelectedPatient(null); }}
              className={`flex-1 pb-2 font-bold text-center border-b-2 transition-all ${
                activeTab === 'admit-existing' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Admit Registered Patient
            </button>
            <button
              onClick={() => { setActiveTab('admit-new'); setSelectedPatient(null); }}
              className={`flex-1 pb-2 font-bold text-center border-b-2 transition-all ${
                activeTab === 'admit-new' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Register & Admit New
            </button>
          </div>

          <form onSubmit={handleAdmissionSubmit} className="space-y-4">
            
            {/* TAB 1: EXISTING PATIENT AUTOCOMPLETE */}
            {activeTab === 'admit-existing' && (
              <div className="space-y-3">
                {!selectedPatient ? (
                  <div className="relative">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Search Patient</span>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by UHID, Name, or Mobile..."
                        className="input pl-9"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>

                    {/* Patient Results Autocomplete Box */}
                    {patientsList.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-orange-100 rounded-xl shadow-lg max-h-[180px] overflow-y-auto divide-y divide-orange-50">
                        {patientsList.map((pat) => (
                          <button
                            key={pat._id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(pat);
                              setPatientsList([]);
                              setPatientSearch('');
                            }}
                            className="w-full text-left p-3 hover:bg-orange-50/40 text-xs flex justify-between items-center transition"
                          >
                            <div>
                              <p className="font-bold text-gray-800">{pat.patientName}</p>
                              <p className="text-gray-500">{pat.mobile} • {pat.gender}</p>
                            </div>
                            <span className="font-mono bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                      {formatUhid(pat.uhid)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {patientSearch.trim().length >= 2 && patientsList.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-orange-100 rounded-xl p-3 text-center text-xs text-gray-500">
                        No registered patients found.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-orange-50/40 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="bg-orange-500 text-white p-2.5 rounded-xl">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-sm">{selectedPatient.patientName}</p>
                        <p className="text-xs text-gray-500">{selectedPatient.gender} • DOB: {new Date(selectedPatient.dob).toLocaleDateString()}</p>
                        <span className="font-mono text-orange-700 text-[10px] font-bold">{formatUhid(selectedPatient.uhid)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REGISTER NEW PATIENT FORM FIELDS */}
            {activeTab === 'admit-new' && (
              <div className="space-y-3 p-3 bg-orange-50/10 border border-orange-100 rounded-2xl max-h-[250px] overflow-y-auto pr-1">
                <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider mb-1">Patient Demographics</p>
                
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Patient Name</span>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    className="input py-2 text-xs"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                  />
                </label>

                <div className="grid gap-2 grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Mobile Number</span>
                    <input
                      type="text"
                      placeholder="Enter mobile"
                      className="input py-2 text-xs"
                      value={newPatientMobile}
                      onChange={(e) => setNewPatientMobile(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Aadhaar Number</span>
                    <input
                      type="text"
                      placeholder="Enter Aadhaar"
                      className="input py-2 text-xs"
                      value={newPatientAadhaar}
                      onChange={(e) => setNewPatientAadhaar(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Date of Birth</span>
                    <input
                      type="date"
                      className="input py-2 text-xs"
                      value={newPatientDob}
                      onChange={(e) => setNewPatientDob(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Gender</span>
                    <select
                      className="input py-2 text-xs text-gray-600"
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Address</span>
                  <textarea
                    placeholder="Full residential address"
                    className="input py-2 text-xs min-h-[60px]"
                    value={newPatientAddress}
                    onChange={(e) => setNewPatientAddress(e.target.value)}
                  />
                </label>

                <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider my-2 border-t border-orange-100 pt-2">OPD Appointment Details (Required)</p>

                <div className="grid gap-2 grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">OPD Department</span>
                    <select
                      className="input py-2 text-xs text-gray-600"
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
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Doctor</span>
                    <select
                      className="input py-2 text-xs text-gray-600"
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
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Date</span>
                    <input
                      type="date"
                      className="input py-2 text-xs"
                      value={newPatientDate}
                      onChange={(e) => setNewPatientDate(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Slot</span>
                    <select
                      className="input py-2 text-xs text-gray-600"
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

            {/* BED SELECTION */}
            <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider border-t border-orange-100 pt-3">Bed Allocation</p>

            <div className="grid gap-2 grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Room Type</span>
                <select
                  className="input py-2.5 text-xs text-gray-600"
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
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Bed Number</span>
                <select
                  className="input py-2.5 text-xs text-gray-600"
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
                        className="text-green-700 bg-green-50"
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

            {/* ADMISSION SPECIFICS */}
            <div className="grid gap-2 grid-cols-2 border-t border-orange-100 pt-3">
              <label className="block col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Consultant Doctor</span>
                <select
                  className="input py-2.5 text-xs text-gray-600"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">Select Consultant</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>Dr. {doc.doctorName || doc.username} ({doc.specialization || doc.department})</option>
                  ))}
                </select>
              </label>

              <label className="block col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Referred Doctor (Optional)</span>
                <select
                  className="input py-2.5 text-xs text-gray-600"
                  value={referredDoctorId}
                  onChange={(e) => setReferredDoctorId(e.target.value)}
                >
                  <option value="">Select Referred Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>Dr. {doc.doctorName || doc.username}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Initial Status</span>
                <select
                  className="input py-2.5 text-xs text-gray-600 font-semibold"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {ipdSettings.admissionStatuses?.map((stat) => (
                    <option key={stat} value={stat}>{stat}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Admitted Date</span>
                <input
                  type="datetime-local"
                  className="input py-2 text-xs text-gray-600"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                />
              </label>
            </div>

            {/* Dynamic Price Display */}
            {selectedBedDetails && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex justify-between items-center text-xs font-bold text-orange-800">
                <span>Allocated Bed Price:</span>
                <span className="text-sm font-black">₹{selectedBedDetails.pricePerDay} / day</span>
              </div>
            )}

            {/* Admit Button */}
            <button type="submit" className="btn w-full mt-2">
              <Plus className="h-4 w-4" /> Admit Patient Case
            </button>

          </form>
        </div>

        {/* RIGHT COLUMN: ACTIVE ADMISSIONS LIST + OPD Referrals */}
        <div className="space-y-4">
          
          {/* OPD Referrals Section - MOVED TO RIGHT COLUMN for visibility */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-indigo-50/25">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> OPD Referrals
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">
                  {referrals.filter(r => r.status === 'Pending').length} Pending
                </span>
                <button onClick={loadReferrals} className="btn-secondary text-xs py-1 px-2">
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            </div>

            {loadingReferrals ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500 mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Loading referrals...</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p className="text-sm font-bold">No OPD referrals pending</p>
                <p className="text-xs mt-1">Patients referred from OPD will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto text-xs max-h-[200px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-indigo-50/50 text-[10px] font-bold uppercase text-indigo-800 border-b border-indigo-100">
                      <th className="p-2">Patient / UHID</th>
                      <th className="p-2">Referred By</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                    {referrals.map((ref) => (
                      <tr key={ref._id} className={`hover:bg-indigo-50/10 transition-all ${
                        selectedReferral?._id === ref._id ? 'bg-indigo-50/30' : ''
                      }`}>
                        <td className="p-2">
                          <p className="font-bold text-gray-900">{ref.patientName}</p>
                          <span className="font-mono text-indigo-700 text-[9px] block font-bold">
                            {formatUhid(ref.uhid)}
                          </span>
                        </td>
                        <td className="p-2 text-[10px]">
                          Dr. {ref.referredByDoctor?.doctorName || ref.referredByDoctor?.username || 'N/A'}
                        </td>
                        <td className="p-2 text-[10px]">
                          {new Date(ref.referredAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          {ref.status === 'Pending' && (
                            <button
                              onClick={() => handleSelectReferral(ref)}
                              className="btn text-[10px] py-1 px-2 flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Admit
                            </button>
                          )}
                          {ref.status === 'Admitted' && (
                            <span className="text-[10px] text-green-600 font-bold">
                              Admitted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/25">
              <div className="flex items-center gap-2">
                <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Inpatient Wards
                </span>
              </div>
              <span className="text-xs font-bold text-gray-500">
                {admissions.filter(a => a.status !== 'Discharged').length} Admitted
              </span>
            </div>

            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/50 text-xs font-bold uppercase text-orange-800 border-b border-orange-100">
                    <th className="p-4">Patient / UHID</th>
                    <th className="p-4">IPD / PID Numbers</th>
                    <th className="p-4">Room / Bed</th>
                    <th className="p-4">Admitted On</th>
                    <th className="p-4">Consultant</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {admissions.map((admission) => (
                    <tr 
                      key={admission._id} 
                      className={`hover:bg-orange-50/10 transition-all ${
                        admission.status !== 'Discharged' ? 'bg-white font-medium' : 'bg-gray-50/55 text-gray-500'
                      }`}
                    >
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{admission.patientId?.patientName || 'N/A'}</p>
                        <span className="font-mono text-orange-700 text-[10px] block font-bold">
                          {formatUhid(admission.patientId?.uhid) || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-mono font-bold text-xs text-gray-800">IPD: {admission.ipdNumber || 'N/A'}</p>
                        <span className="font-mono text-[10px] text-gray-400 block font-semibold">PID: {admission.pidNumber || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{admission.roomId?.roomType || 'N/A'}</p>
                        <span className="font-mono bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {admission.bedId?.bedNumber || 'N/A'} (₹{admission.bedId?.pricePerDay || 0}/day)
                        </span>
                      </td>
                      <td className="p-4 text-xs">
                        {new Date(admission.admissionDate).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                          <span>Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold leading-tight ${
                          admission.status !== 'Discharged' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {admission.status !== 'Discharged' ? (
                            <>
                              <Clock className="h-3 w-3 animate-spin text-red-500" /> {admission.status}
                            </>
                          ) : (
                            'Discharged'
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setReceiptModalAdmission(admission)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="View/Print Admission Card"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          {admission.status !== 'Discharged' && (
                            <button
                              onClick={() => handleDischarge(admission._id)}
                              className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-xs px-2.5 py-1"
                              title="Discharge patient"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {admissions.length === 0 && !loadingAdmissions && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">
                        No admissions found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>


      {/* POST-ADMISSION PRINT CARD MODAL */}
      {receiptModalAdmission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-2xl space-y-6 print:border-0 print:shadow-none print:p-0 print:m-0">
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
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="btn flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print Admission Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpdAdmission;
