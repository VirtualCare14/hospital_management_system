import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHeader } from '../../context/HeaderContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';
import { formatDateTimeIST, formatDateIST } from '../../utils/dateFormat';

const IpdAdmission = () => {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loadingAdmissions, setLoadingAdmissions] = useState(false);
  const [activeTab, setActiveTab] = useState('admit-existing'); // 'admit-existing' or 'admit-new'
  
  // Popup Admission Modal State
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);

  // Pagination & Filter States
  const [referralSearch, setReferralSearch] = useState('');
  const [referralPage, setReferralPage] = useState(1);
  const referralItemsPerPage = 5;

  const [inpatientSearch, setInpatientSearch] = useState('');
  const [inpatientPage, setInpatientPage] = useState(1);
  const inpatientItemsPerPage = 10;

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

  // New Patient Form States (Emergency Registration criteria)
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
  
  // Helper to format local system date and time for datetime-local input
  const getCurrentLocalDatetime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Clinical / Doctor list
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(''); // Consultant Doctor
  const [referredDoctorId, setReferredDoctorId] = useState(''); // Referred Doctor
  const [selectedStatus, setSelectedStatus] = useState('Admitted');
  const [admissionDate, setAdmissionDate] = useState(getCurrentLocalDatetime());
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');

  // Post-Admission Print modal states
  const [receiptModalAdmission, setReceiptModalAdmission] = useState(null);

  // Handle Keyboard 'ESC' key press to remove post-admission print card modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setReceiptModalAdmission(null);
      }
    };
    if (receiptModalAdmission) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [receiptModalAdmission]);

  // OPD Referrals state
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);

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
      if (rooms.length > 0 && !selectedRoomType) {
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

      // 4. Load Hospital Details (Branding) for Header Printing
      try {
        const { data: settingsRes } = await client.get('/admin/hospital-settings');
        if (settingsRes && settingsRes.exists) {
          setHospitalSettings(settingsRes.data);
        }
      } catch (err) {
        console.warn('Could not load hospital settings:', err.message);
        setHospitalSettings(null);
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

  // Load booked slots for emergency patient registration
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

  // Reset pagination on search change
  useEffect(() => {
    setReferralPage(1);
  }, [referralSearch]);

  useEffect(() => {
    setInpatientPage(1);
  }, [inpatientSearch]);

  // Handle selecting a referral for admission
  const handleSelectReferral = (referral) => {
    setSelectedReferral(referral);
    setSelectedPatient({
      _id: referral.patientId?._id || referral.patientId,
      patientName: referral.patientName,
      uhid: referral.uhid,
      mobile: referral.mobile,
      gender: referral.gender,
      dob: referral.patientId?.dob,
      address: referral.patientId?.address
    });
    if (referral.referredByDoctor?._id) {
      setReferredDoctorId(referral.referredByDoctor._id);
    }
    setProvisionalDiagnosis(referral.notes || referral.diagnosis || '');
    setAdmissionDate(getCurrentLocalDatetime());
    setActiveTab('admit-existing');
    setIsAdmissionModalOpen(true);
    toast.success(`Patient ${referral.patientName} loaded from OPD referral`);
  };

  // Handle printing of admission card using standalone print iframe document
  const triggerPrintAdmissionCard = () => {
    if (!receiptModalAdmission) return;

    let printIframe = document.getElementById('ipd-admission-print-iframe');
    if (printIframe) {
      printIframe.remove();
    }
    
    printIframe = document.createElement('iframe');
    printIframe.id = 'ipd-admission-print-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.left = '-9999px';
    printIframe.style.top = '-9999px';
    printIframe.style.width = '0px';
    printIframe.style.height = '0px';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);

    const formatUhidVal = (val) => {
      if (!val) return 'N/A';
      return String(val).startsWith('UHID') ? val : `UHID-${String(val).padStart(6, '0')}`;
    };

    const patientName = receiptModalAdmission.patientId?.patientName || 'N/A';
    const uhid = formatUhidVal(receiptModalAdmission.patientId?.uhid);
    const pid = receiptModalAdmission.pidNumber || 'N/A';
    const ipd = receiptModalAdmission.ipdNumber || 'N/A';
    const mobile = receiptModalAdmission.patientId?.mobile || 'N/A';
    const gender = receiptModalAdmission.patientId?.gender || 'N/A';
    const dob = receiptModalAdmission.patientId?.dob;
    const age = dob ? `${Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} Yrs` : 'N/A';
    const aadhaar = receiptModalAdmission.patientId?.aadhaar || 'N/A';
    const address = receiptModalAdmission.patientId?.address || 'N/A';

    const roomType = receiptModalAdmission.roomId?.roomType || 'Standard Ward';
    const bedNumber = receiptModalAdmission.bedId?.bedNumber || 'N/A';
    const bedType = receiptModalAdmission.bedId?.bedType ? ` (${receiptModalAdmission.bedId.bedType})` : '';
    const admissionDate = formatDateTimeIST(receiptModalAdmission.admissionDate);
    const bedPrice = receiptModalAdmission.bedId?.pricePerDay || 0;

    const doctorName = receiptModalAdmission.doctorInCharge?.doctorName || receiptModalAdmission.doctorInCharge?.username || 'Attending Physician';
    const referredDoctor = receiptModalAdmission.referredDoctor ? (receiptModalAdmission.referredDoctor.doctorName || receiptModalAdmission.referredDoctor.username) : 'Direct Admission';
    const diagnosis = receiptModalAdmission.provisionalDiagnosis || 'Under Observation';
    const status = receiptModalAdmission.status || 'Admitted';

    const hospitalName = hospitalSettings?.hospitalName || hospitalSettings?.name || '';
    const hospitalAddress = hospitalSettings?.address || hospitalSettings?.fullAddress || '';
    const hospitalMobile = (hospitalSettings?.mobileNumbers?.length > 0 ? hospitalSettings.mobileNumbers.join(', ') : (hospitalSettings?.contactNumber || hospitalSettings?.phone || '')) || '';
    const hospitalEmail = hospitalSettings?.email || hospitalSettings?.contactEmail || '';
    const hospitalLogo = hospitalSettings?.logoUrl || hospitalSettings?.logo || '';

    const printDocumentHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPD Admission Card - ${ipd}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0mm !important;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              color: #111827 !important;
              font-family: Arial, Helvetica, sans-serif;
              padding: 0;
              margin: 0;
              width: 100%;
              height: 100vh;
              font-size: 12px;
              line-height: 1.4;
            }
            .card-container {
              width: 100%;
              height: 100vh;
              margin: 0 auto;
              border: 2px solid #ea580c;
              padding: 8mm 10mm;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }
            .header-banner {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #ea580c;
              padding-bottom: 10px;
              margin-bottom: 12px;
              gap: 14px;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .logo-img {
              max-height: 60px;
              max-width: 130px;
              object-fit: contain;
              display: block;
            }
            .hospital-info {
              text-align: left;
            }
            .hospital-title {
              font-size: 20px;
              font-weight: 900;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1.2;
            }
            .hospital-sub {
              font-size: 11.5px;
              font-weight: 600;
              color: #4b5563;
              margin-top: 2px;
            }
            .card-badge {
              display: inline-block;
              background: #ea580c;
              color: #ffffff;
              font-weight: 900;
              font-size: 11px;
              padding: 6px 14px;
              border-radius: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              white-space: nowrap;
            }
            .id-bar {
              display: flex;
              justify-content: space-around;
              background: #fff7ed;
              border: 2px solid #ffedd5;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 12px;
              text-align: center;
            }
            .id-box {
              flex: 1;
            }
            .id-label {
              font-size: 10px;
              font-weight: 800;
              color: #6b7280;
              text-transform: uppercase;
              display: block;
              margin-bottom: 2px;
            }
            .id-val {
              font-family: monospace;
              font-size: 15px;
              font-weight: 900;
              color: #111827;
            }
            .id-val-blue { color: #1d4ed8; }
            .id-val-orange { color: #c2410c; }
            .section-box {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              margin-bottom: 12px;
              overflow: hidden;
            }
            .section-header {
              background: #f3f4f6;
              padding: 6px 12px;
              font-weight: 900;
              font-size: 12px;
              color: #1f2937;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #d1d5db;
            }
            .grid-2 {
              display: flex;
              flex-wrap: wrap;
              padding: 8px 10px;
            }
            .col-2 {
              width: 50%;
              padding: 4px 8px;
            }
            .col-12 {
              width: 100%;
              padding: 4px 8px;
              border-top: 1px solid #f3f4f6;
              margin-top: 4px;
              padding-top: 6px;
            }
            .label {
              font-size: 10px;
              font-weight: 800;
              color: #6b7280;
              text-transform: uppercase;
              display: block;
              margin-bottom: 1px;
            }
            .val {
              font-size: 13px;
              font-weight: 700;
              color: #111827;
            }
            .val-bold {
              font-size: 14px;
              font-weight: 900;
              color: #111827;
            }
            .val-orange { color: #c2410c; font-weight: 900; font-size: 14px; }
            .val-green { color: #047857; font-weight: 900; font-size: 14px; }
            .footer-sigs {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              padding-top: 8px;
              text-align: center;
            }
            .sig-box {
              width: 42%;
              border-top: 2px dashed #9ca3af;
              padding-top: 6px;
              font-size: 12px;
              font-weight: 800;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <div>
              <div class="header-banner">
                <div class="header-left">
                  ${hospitalLogo ? `<img src="${hospitalLogo}" class="logo-img" alt="Hospital Logo" />` : ''}
                  <div class="hospital-info">
                    ${hospitalName ? `<div class="hospital-title">${hospitalName}</div>` : ''}
                    ${hospitalAddress ? `<div class="hospital-sub">${hospitalAddress}</div>` : ''}
                    ${(hospitalMobile || hospitalEmail) ? `
                      <div class="hospital-sub">
                        ${hospitalMobile ? `Phone: ${hospitalMobile}` : ''} ${hospitalEmail ? ` | Email: ${hospitalEmail}` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>
                <div class="card-badge">IPD Patient Admission Card</div>
              </div>

              <div class="id-bar">
                <div class="id-box">
                  <span class="id-label">UHID Number</span>
                  <span class="id-val">${uhid}</span>
                </div>
              <div class="id-box">
                <span class="id-label">Admission ID (PID)</span>
                <span class="id-val id-val-blue">${pid}</span>
              </div>
              <div class="id-box">
                <span class="id-label">IPD Case ID</span>
                <span class="id-val id-val-orange">${ipd}</span>
              </div>
            </div>

            <div class="section-box">
              <div class="section-header">Patient Demographics</div>
              <div class="grid-2">
                <div class="col-2">
                  <span class="label">Patient Name</span>
                  <span class="val-bold">${patientName}</span>
                </div>
                <div class="col-2">
                  <span class="label">Mobile Number</span>
                  <span class="val">${mobile}</span>
                </div>
                <div class="col-2">
                  <span class="label">Gender / Age</span>
                  <span class="val">${gender} • ${age}</span>
                </div>
                <div class="col-2">
                  <span class="label">Aadhaar Number</span>
                  <span class="val" style="font-family: monospace;">${aadhaar}</span>
                </div>
                <div class="col-12">
                  <span class="label">Residential Address</span>
                  <span class="val">${address}</span>
                </div>
              </div>
            </div>

            <div class="section-box">
              <div class="section-header">Ward & Bed Allocation Details</div>
              <div class="grid-2">
                <div class="col-2">
                  <span class="label">Ward / Room Category</span>
                  <span class="val-bold">${roomType}</span>
                </div>
                <div class="col-2">
                  <span class="label">Allocated Bed Number</span>
                  <span class="val-orange">Bed ${bedNumber}${bedType}</span>
                </div>
                <div class="col-2">
                  <span class="label">Date & Time of Admission</span>
                  <span class="val">${admissionDate}</span>
                </div>
                <div class="col-2">
                  <span class="label">Daily Bed Charge</span>
                  <span class="val-green">₹${bedPrice} / day</span>
                </div>
              </div>
            </div>

            <div class="section-box">
              <div class="section-header">Medical & Consultant Details</div>
              <div class="grid-2">
                <div class="col-2">
                  <span class="label">Consultant In Charge</span>
                  <span class="val-bold">Dr. ${doctorName}</span>
                </div>
                <div class="col-2">
                  <span class="label">Referred By Doctor</span>
                  <span class="val">${referredDoctor}</span>
                </div>
                <div class="col-2">
                  <span class="label">Provisional Diagnosis</span>
                  <span class="val">${diagnosis}</span>
                </div>
                <div class="col-2">
                  <span class="label">Admission Status</span>
                  <span class="val-green">${status}</span>
                </div>
              </div>
            </div>
          </div>

            <div class="footer-sigs">
              <div class="sig-box">Patient / Relative Signature</div>
              <div class="sig-box">Admitting Desk Officer / Stamp</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write(printDocumentHtml);
    doc.close();

    setTimeout(() => {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
    }, 300);
  };

  // Handle Admission Submission
  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();

    // Validate bed allocation & consultant doctor selection upfront
    if (!selectedRoomType || !selectedBedId || !selectedDoctorId) {
      toast.error('Please select room type, bed number, and consultant doctor.');
      return;
    }

    let finalPatientId = null;

    if (activeTab === 'admit-existing') {
      if (!selectedPatient) {
        toast.error('Please select an existing patient first.');
        return;
      }
      finalPatientId = selectedPatient._id;
    } else {
      // Register new emergency patient first
      if (!newPatientName || !newPatientMobile || !newPatientDob || !newPatientGender) {
        toast.error('Patient Name, Mobile Number, Date of Birth, and Gender are required.');
        return;
      }

      try {
        const regPayload = {
          patientName: newPatientName,
          mobile: newPatientMobile,
          aadhaar: newPatientAadhaar,
          dob: newPatientDob,
          gender: newPatientGender,
          address: newPatientAddress || '',
          isEmergency: true,
          doctorId: selectedDoctorId,
          department: 'Emergency'
        };

        const { data: regRes } = await client.post('/patients/create', regPayload);
        finalPatientId = regRes.patient.patientId || regRes.patient._id;
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to register emergency patient.');
        return;
      }
    }

    // Convert local datetime input to proper ISO string with timezone preserved
    let finalAdmissionIsoDate = new Date().toISOString();
    if (admissionDate) {
      const parsed = new Date(admissionDate);
      if (!isNaN(parsed.getTime())) {
        finalAdmissionIsoDate = parsed.toISOString();
      }
    }

    // Now proceed to Admit Patient
    try {
      const admitPayload = {
        patientId: finalPatientId,
        roomId: roomsList.find(r => r.roomType === selectedRoomType)?._id,
        bedId: selectedBedId,
        doctorInCharge: selectedDoctorId,
        referredDoctor: referredDoctorId || undefined,
        status: selectedStatus,
        admissionDate: finalAdmissionIsoDate,
        provisionalDiagnosis: provisionalDiagnosis
      };

      const { data } = await client.post('/ipd/admit', admitPayload);
      
      // Close admission modal popup
      setIsAdmissionModalOpen(false);

      // Load full admissions list to find the newly created admission (for print modal)
      const { data: updatedAdmissions } = await client.get('/ipd/admissions');
      setAdmissions(updatedAdmissions);
      
      // Select the new admission record by ID or patient ID
      const newRecord = updatedAdmissions.find(a => a._id === data.admission?._id) ||
                        updatedAdmissions.find(a => a.patientId?._id === finalPatientId && a.status !== 'Discharged');

      if (newRecord) {
        setReceiptModalAdmission(newRecord);
        toast.success(`Patient Admitted! PID: ${newRecord.pidNumber} | IPD: ${newRecord.ipdNumber} | UHID: ${formatUhid(newRecord.patientId?.uhid)}`);
      } else {
        toast.success(data.message || 'Patient admitted successfully!');
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

  useHeader({ onRefresh: loadConfigData });

  const filteredBeds = bedsList.filter(b => b.status === 'Available');
  const selectedBedDetails = bedsList.find(b => b._id === selectedBedId);

  // OPD Referrals Filtering & Pagination Calculations
  const filteredReferrals = referrals.filter((ref) => {
    if (ref.status !== 'Pending') return false;
    if (!referralSearch.trim()) return true;
    const query = referralSearch.toLowerCase();
    const pName = (ref.patientName || '').toLowerCase();
    const uhidStr = (ref.uhid || '').toLowerCase();
    const docName = (ref.referredByDoctor?.doctorName || ref.referredByDoctor?.username || '').toLowerCase();
    return pName.includes(query) || uhidStr.includes(query) || docName.includes(query);
  });

  const totalReferralPages = Math.ceil(filteredReferrals.length / referralItemsPerPage) || 1;
  const paginatedReferrals = filteredReferrals.slice(
    (referralPage - 1) * referralItemsPerPage,
    referralPage * referralItemsPerPage
  );

  // Inpatient Wards Filtering & Pagination Calculations
  const activeAdmissions = admissions.filter((a) => a.status !== 'Discharged');
  const filteredAdmissions = activeAdmissions.filter((adm) => {
    if (!inpatientSearch.trim()) return true;
    const query = inpatientSearch.toLowerCase();
    const patName = (adm.patientId?.patientName || '').toLowerCase();
    const uhidStr = (adm.patientId?.uhid || '').toLowerCase();
    const ipdNum = (adm.ipdNumber || '').toLowerCase();
    const pidNum = (adm.pidNumber || '').toLowerCase();
    const room = (adm.roomId?.roomType || '').toLowerCase();
    const bed = (adm.bedId?.bedNumber || '').toLowerCase();
    const doc = (adm.doctorInCharge?.doctorName || adm.doctorInCharge?.username || '').toLowerCase();
    return (
      patName.includes(query) ||
      uhidStr.includes(query) ||
      ipdNum.includes(query) ||
      pidNum.includes(query) ||
      room.includes(query) ||
      bed.includes(query) ||
      doc.includes(query)
    );
  });

  const totalInpatientPages = Math.ceil(filteredAdmissions.length / inpatientItemsPerPage) || 1;
  const paginatedAdmissions = filteredAdmissions.slice(
    (inpatientPage - 1) * inpatientItemsPerPage,
    inpatientPage * inpatientItemsPerPage
  );

  // Validation helpers for Mobile (10 digits) and Aadhaar (12 digits)
  const isEmergencyMobileValid = newPatientMobile.replace(/\D/g, '').length === 10;
  const isEmergencyAadhaarValid = newPatientAadhaar.replace(/\D/g, '').length === 12;
  const searchDigitsLength = patientSearch.replace(/\D/g, '').length;
  const isSearchComplete = searchDigitsLength === 10 || searchDigitsLength === 12;

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 font-sans text-gray-800">
      <div className="space-y-6 no-print">

        {/* PAGE HEADER WITH TOP-RIGHT ACTION BUTTONS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-orange-50 text-orange-600 p-3 rounded-xl border border-orange-100">
              <Bed className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">IPD Admission & Ward Management</h1>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Manage patient admissions, OPD referrals, emergency registrations, and bed allocations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Admit Registered Patient Button (No solid background, Blue animated glowing border) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('admit-existing');
                setSelectedPatient(null);
                setAdmissionDate(getCurrentLocalDatetime());
                setIsAdmissionModalOpen(true);
              }}
              className="relative inline-flex items-center justify-center p-[2px] overflow-hidden rounded-xl font-extrabold text-xs text-blue-700 transition-all duration-300 group cursor-pointer border-glow-blue-animated shadow-md hover:shadow-blue-500/30"
            >
              <span className="relative px-4 py-2.5 transition-all ease-in duration-75 bg-white hover:bg-blue-50/50 rounded-[10px] flex items-center gap-2 font-bold text-blue-700">
                <UserCheck className="h-4 w-4 text-blue-600" />
                Admit Registered Patient
              </span>
            </button>

            {/* Emergency Register Button (No solid background, Red text, Red animated glowing border) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('admit-new');
                setSelectedPatient(null);
                setAdmissionDate(getCurrentLocalDatetime());
                setIsAdmissionModalOpen(true);
              }}
              className="relative inline-flex items-center justify-center p-[2px] overflow-hidden rounded-xl font-extrabold text-xs text-red-700 transition-all duration-300 group cursor-pointer border-glow-red-animated shadow-md hover:shadow-red-500/30"
            >
              <span className="relative px-4 py-2.5 transition-all ease-in duration-75 bg-white hover:bg-red-50/50 rounded-[10px] flex items-center gap-2 font-bold text-red-700">
                <UserPlus className="h-4 w-4 text-red-600" />
                Emergency Register
              </span>
            </button>
          </div>
        </div>

        {/* FULL SCREEN WIDTH CARDS: OPD REFERRALS & INPATIENT WARDS */}
        <div className="space-y-6">

          {/* CARD 1: OPD Referrals Card (Full Width) */}
          <div className="card overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/15">
              <div className="flex items-center gap-2.5">
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-2">
                  <Activity className="h-4 w-4" /> OPD Referrals
                </span>
                <span className="text-xs font-bold text-gray-500">
                  {filteredReferrals.length} Pending
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Referral Input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search referral..."
                    className="input pl-9 h-8 text-xs rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full"
                    value={referralSearch}
                    onChange={(e) => setReferralSearch(e.target.value)}
                  />
                </div>
                <button 
                  onClick={loadReferrals} 
                  className="btn-secondary text-xs h-8 px-2.5 rounded-lg border border-gray-250 cursor-pointer flex items-center gap-1.5"
                  title="Refresh Referrals"
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
            ) : filteredReferrals.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-sm font-bold text-gray-500">No pending OPD referrals found</p>
                <p className="text-xs mt-1 text-gray-400">
                  {referralSearch ? 'No referrals match your search query.' : 'Patients referred from OPD clinics will appear here.'}
                </p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold uppercase text-gray-550 border-b border-gray-150">
                        <th className="p-3.5 pl-5">Patient Details</th>
                        <th className="p-3.5">UHID</th>
                        <th className="p-3.5">Referred By Doctor</th>
                        <th className="p-3.5">Referred Date</th>
                        <th className="p-3.5">Clinical Remarks</th>
                        <th className="p-3.5 pr-5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedReferrals.map((ref) => (
                        <tr 
                          key={ref._id} 
                          className={`hover:bg-indigo-50/5 transition-all text-xs font-medium text-gray-700 ${
                            selectedReferral?._id === ref._id ? 'bg-indigo-50/20' : ''
                          }`}
                        >
                          <td className="p-3.5 pl-5">
                            <p className="font-bold text-gray-900 text-sm">{ref.patientName}</p>
                            <span className="text-[11px] text-gray-500 font-semibold">{ref.mobile} • {ref.gender}</span>
                          </td>
                          <td className="p-3.5 font-mono text-indigo-700 font-bold text-xs">
                            {formatUhid(ref.uhid)}
                          </td>
                          <td className="p-3.5 text-xs text-gray-700 font-semibold">
                            Dr. {ref.referredByDoctor?.doctorName || ref.referredByDoctor?.username || 'N/A'}
                          </td>
                          <td className="p-3.5 text-xs text-gray-500 font-semibold">
                            {new Date(ref.referredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-3.5 text-xs text-gray-600 max-w-xs">
                            {ref.notes || ref.diagnosis ? (
                              <p className="truncate italic bg-indigo-50/20 p-1.5 rounded border border-indigo-50/50 text-[11px]">
                                {ref.notes || ref.diagnosis}
                              </p>
                            ) : (
                              <span className="text-gray-400 italic">No notes</span>
                            )}
                          </td>
                          <td className="p-3.5 pr-5 text-center">
                            {ref.status === 'Pending' && (
                              <button
                                onClick={() => handleSelectReferral(ref)}
                                className="btn text-xs h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-sm transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" /> Admit Patient
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* OPD Referrals Pagination Controls */}
                {filteredReferrals.length > 0 && (
                  <div className="p-3.5 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-gray-50/50">
                    <span className="text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-800">{(referralPage - 1) * referralItemsPerPage + 1}</span> to{' '}
                      <span className="font-bold text-gray-800">
                        {Math.min(referralPage * referralItemsPerPage, filteredReferrals.length)}
                      </span>{' '}
                      of <span className="font-bold text-gray-800">{filteredReferrals.length}</span> OPD referrals
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                        disabled={referralPage === 1}
                        className="btn-secondary h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 border-gray-250 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>

                      <span className="px-2 font-bold text-gray-700">
                        Page {referralPage} of {totalReferralPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setReferralPage((p) => Math.min(totalReferralPages, p + 1))}
                        disabled={referralPage === totalReferralPages}
                        className="btn-secondary h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 border-gray-250 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 2: Inpatient Wards Card (Full Width) */}
          <div className="card overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-orange-50/15">
              <div className="flex items-center gap-2.5">
                <span className="bg-orange-50 border border-orange-100 text-orange-700 px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-2">
                  <Bed className="h-4 w-4" /> Inpatient Wards
                </span>
                <span className="text-xs font-black text-gray-600">
                  {filteredAdmissions.length} Active Admissions
                </span>
              </div>

              {/* Search Active Admissions Input */}
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Patient, UHID, IPD, Bed, Doctor..."
                  className="input pl-9 h-8 text-xs rounded-lg border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 w-full"
                  value={inpatientSearch}
                  onChange={(e) => setInpatientSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase text-gray-550 border-b border-gray-150">
                    <th className="p-3.5 pl-5">Patient Details</th>
                    <th className="p-3.5">IPD / PID Numbers</th>
                    <th className="p-3.5">Location / Room</th>
                    <th className="p-3.5">Admitted Time</th>
                    <th className="p-3.5">Consultant</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {paginatedAdmissions.map((admission) => (
                    <tr 
                      key={admission._id} 
                      className="hover:bg-orange-50/5 transition-colors bg-white font-medium"
                    >
                      <td className="p-3.5 pl-5">
                        <p className="font-bold text-gray-900 text-sm">{admission.patientId?.patientName || 'N/A'}</p>
                        <span className="font-mono text-orange-700 text-[11px] block font-bold mt-0.5">
                          {formatUhid(admission.patientId?.uhid) || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-xs text-gray-800">IPD: {admission.ipdNumber || 'N/A'}</p>
                        <span className="font-mono text-[10px] text-gray-400 block font-semibold mt-0.5">PID: {admission.pidNumber || 'N/A'}</span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-gray-850">{admission.roomId?.roomType || 'N/A'}</p>
                        <span className="font-mono bg-orange-50 border border-orange-100 text-orange-850 text-[10px] px-2 py-0.5 rounded font-bold mt-0.5 inline-block">
                          Bed {admission.bedId?.bedNumber || 'N/A'} (₹{admission.bedId?.pricePerDay || 0}/day)
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-semibold">
                        {formatDateTimeIST(admission.admissionDate)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-bold text-gray-800">Dr. {admission.doctorInCharge?.doctorName || admission.doctorInCharge?.username || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold bg-green-50 border border-green-200 text-green-700 leading-none">
                          <CheckCircle className="h-2.5 w-2.5 text-green-500" /> {admission.status || 'Admitted'}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-center">
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
                  {filteredAdmissions.length === 0 && !loadingAdmissions && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-450 italic">
                        {inpatientSearch ? 'No active admissions match your search query.' : 'No active admissions found in the system.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Inpatient Wards Pagination Controls */}
            {filteredAdmissions.length > 0 && (
              <div className="p-3.5 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-gray-50/50">
                <span className="text-gray-500 font-medium">
                  Showing <span className="font-bold text-gray-800">{(inpatientPage - 1) * inpatientItemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-gray-800">
                    {Math.min(inpatientPage * inpatientItemsPerPage, filteredAdmissions.length)}
                  </span>{' '}
                  of <span className="font-bold text-gray-800">{filteredAdmissions.length}</span> active cases
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInpatientPage((p) => Math.max(1, p - 1))}
                    disabled={inpatientPage === 1}
                    className="btn-secondary h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 border-gray-250 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  <span className="px-2 font-bold text-gray-700">
                    Page {inpatientPage} of {totalInpatientPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setInpatientPage((p) => Math.min(totalInpatientPages, p + 1))}
                    disabled={inpatientPage === totalInpatientPages}
                    className="btn-secondary h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 border-gray-250 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* POPUP ADMISSION FORM MODAL */}
      {isAdmissionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-orange-50/20">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 text-white p-2.5 rounded-xl">
                  <Bed className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">Patient Ward Admission</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Complete registration and bed allocation details</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Form Tabs Switcher */}
                <div className="flex bg-gray-150 p-1 rounded-xl text-xs gap-1">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('admit-existing'); setSelectedPatient(null); setAdmissionDate(getCurrentLocalDatetime()); }}
                    className={`px-3.5 py-1.5 font-black rounded-lg transition-all cursor-pointer ${
                      activeTab === 'admit-existing' 
                        ? 'bg-white text-blue-700 shadow border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Admit Registered Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('admit-new'); setSelectedPatient(null); setAdmissionDate(getCurrentLocalDatetime()); }}
                    className={`px-3.5 py-1.5 font-black rounded-lg transition-all cursor-pointer ${
                      activeTab === 'admit-new' 
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Emergency Register
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Form Scrollable Content */}
            <form onSubmit={handleAdmissionSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* CARD 1: Patient Information */}
              <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-150">
                <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                  <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-bold text-gray-900 leading-none">
                      {activeTab === 'admit-existing' ? 'Select Registered Patient' : 'Emergency Patient Demographics'}
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {activeTab === 'admit-existing' ? 'Search patient by UHID, name, or phone number' : 'Enter new emergency patient information'}
                    </p>
                  </div>
                </div>

                {activeTab === 'admit-existing' && (
                  <div className="space-y-3">
                    {!selectedPatient ? (
                      <div className="relative">
                        <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">
                          Search Patient <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Search className={`absolute left-3.5 top-3.5 h-4 w-4 transition-colors ${isSearchComplete ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <input
                            type="text"
                            placeholder="Search by UHID, Name, or Mobile..."
                            className={`input pl-10 pr-10 h-11 text-sm rounded-lg transition-all ${
                              isSearchComplete
                                ? 'border-2 border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold focus:border-emerald-500 focus:ring-emerald-500'
                                : 'border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                            }`}
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                          />
                          {isSearchComplete && (
                            <CheckCircle className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-600 pointer-events-none" />
                          )}
                        </div>

                        {/* Patient Results Autocomplete Box */}
                        {patientsList.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[220px] overflow-y-auto divide-y divide-gray-100">
                            {patientsList.map((pat) => (
                              <button
                                key={pat._id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatient(pat);
                                  setPatientsList([]);
                                  setPatientSearch('');
                                }}
                                className="w-full text-left p-3 hover:bg-orange-50/40 text-xs flex justify-between items-center transition cursor-pointer"
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
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg p-4 text-center text-xs text-gray-500 shadow-md">
                            No registered patients found.
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Selected Patient Summary Card */
                      <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  <div className="space-y-4 pt-1">
                    <p className="text-[11px] font-extrabold uppercase text-orange-500 tracking-wider mb-2 border-b border-orange-50 pb-1">Emergency Patient Details</p>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[12px] font-bold uppercase text-gray-500">
                          Patient Name <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="text"
                          placeholder="Enter full name"
                          className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          value={newPatientName}
                          onChange={(e) => setNewPatientName(e.target.value)}
                        />
                      </label>

                      <label className="block">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-bold uppercase text-gray-500">
                            Mobile Number <span className="text-red-500">*</span>
                          </span>
                          {newPatientMobile.length > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isEmergencyMobileValid 
                                ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' 
                                : 'text-gray-600 bg-gray-100'
                            }`}>
                              {isEmergencyMobileValid ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-emerald-600" /> 10/10 Digits
                                </>
                              ) : (
                                `${newPatientMobile.length}/10 Digits`
                              )}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter 10-digit mobile"
                            maxLength={10}
                            className={`input h-11 pr-10 text-sm rounded-lg transition-all ${
                              isEmergencyMobileValid
                                ? 'border-2 border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold focus:border-emerald-500 focus:ring-emerald-500'
                                : 'border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                            }`}
                            value={newPatientMobile}
                            onChange={(e) => setNewPatientMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          />
                          {isEmergencyMobileValid && (
                            <CheckCircle className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-600 pointer-events-none" />
                          )}
                        </div>
                      </label>

                      <label className="block">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-bold uppercase text-gray-500">Aadhaar Number</span>
                          {newPatientAadhaar.length > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isEmergencyAadhaarValid 
                                ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' 
                                : 'text-gray-600 bg-gray-100'
                            }`}>
                              {isEmergencyAadhaarValid ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-emerald-600" /> 12/12 Digits
                                </>
                              ) : (
                                `${newPatientAadhaar.length}/12 Digits`
                              )}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter 12-digit Aadhaar"
                            maxLength={12}
                            className={`input h-11 pr-10 text-sm rounded-lg transition-all ${
                              isEmergencyAadhaarValid
                                ? 'border-2 border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold focus:border-emerald-500 focus:ring-emerald-500'
                                : 'border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                            }`}
                            value={newPatientAadhaar}
                            onChange={(e) => setNewPatientAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                          />
                          {isEmergencyAadhaarValid && (
                            <CheckCircle className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-600 pointer-events-none" />
                          )}
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-[12px] font-bold uppercase text-gray-500">
                          Gender <span className="text-red-500">*</span>
                        </span>
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
                        <span className="mb-1 block text-[12px] font-bold uppercase text-gray-500">
                          Date of Birth <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="date"
                          className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-750"
                          value={newPatientDob}
                          onChange={(e) => setNewPatientDob(e.target.value)}
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-[12px] font-bold uppercase text-gray-500">Address (Optional)</span>
                      <textarea
                        placeholder="Full residential address (optional)"
                        className="input py-2 text-sm rounded-lg min-h-[55px] border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        value={newPatientAddress}
                        onChange={(e) => setNewPatientAddress(e.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* CARD 2: Bed Allocation */}
              <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-150">
                <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                  <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                    <Bed className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-bold text-gray-900 leading-none">Bed Allocation</h2>
                    <p className="text-[11px] text-gray-400 mt-1">Assign room category and available bed</p>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">
                      Room Type <span className="text-red-500">*</span>
                    </span>
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
                    <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">
                      Bed Number <span className="text-red-500">*</span>
                    </span>
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
                  <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3 flex justify-between items-center text-xs font-bold text-orange-900">
                    <span className="uppercase tracking-wide text-orange-700">Allocated Bed Rate:</span>
                    <span className="text-sm font-black text-orange-850">₹{selectedBedDetails.pricePerDay} / day</span>
                  </div>
                )}
              </div>

              {/* CARD 3: Consultant Details */}
              <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-150">
                <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                  <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-bold text-gray-900 leading-none">Consultant Details</h2>
                    <p className="text-[11px] text-gray-400 mt-1">Assign primary consultant and referring doctor</p>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">
                      Consultant Doctor <span className="text-red-500">*</span>
                    </span>
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
                    <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">Referred Doctor (Optional)</span>
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

              {/* CARD 4: Clinical Information & Admission Details */}
              <div className="card p-5 bg-white rounded-xl shadow-sm space-y-4 border border-gray-150">
                <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
                  <span className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-bold text-gray-900 leading-none">Clinical & Admission Details</h2>
                    <p className="text-[11px] text-gray-400 mt-1">Diagnosis and initial admission status</p>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">Provisional Diagnosis / Remarks</span>
                  <textarea
                    className="input py-2 text-sm h-20 resize-none border border-gray-250 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700"
                    placeholder="Enter provisional diagnosis or clinical remarks..."
                    value={provisionalDiagnosis}
                    onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                  />
                </label>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">
                      Initial Status <span className="text-red-500">*</span>
                    </span>
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
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-bold uppercase tracking-wide text-gray-500">
                        Admitted Date & Time <span className="text-red-500">*</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdmissionDate(getCurrentLocalDatetime())}
                        className="text-[10px] text-orange-600 hover:text-orange-700 font-bold bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 transition-colors cursor-pointer"
                        title="Set to current system date and time"
                      >
                        Set Now
                      </button>
                    </div>
                    <input
                      type="datetime-local"
                      className="input h-11 text-sm rounded-lg border-gray-250 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-700"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="btn h-12 rounded-xl text-sm font-bold w-full shadow-md flex items-center justify-center gap-2 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  <Plus className="h-5 w-5" /> Admit Patient Case
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* POST-ADMISSION PRINT CARD MODAL VIA PORTAL */}
      {receiptModalAdmission && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 admission-portal-container cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReceiptModalAdmission(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl p-4 max-w-lg w-full max-h-[88vh] overflow-y-auto border border-gray-200 shadow-2xl space-y-3.5 admission-print-card cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Screen Only) */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5 no-print">
              <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <FileText className="text-orange-600 h-4.5 w-4.5" /> IPD Patient Admission Card
              </h2>
              <button
                type="button"
                onClick={() => setReceiptModalAdmission(null)}
                className="p-1 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Printable Content Container */}
            <div id="ipd-admission-card-content" className="space-y-2.5 text-gray-900">
              
              {/* CARD TITLE BADGE */}
              <div className="text-center pb-0.5">
                <div className="inline-block bg-orange-600 text-white font-black text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  IPD Patient Admission Card
                </div>
              </div>

              {/* IDENTIFIERS BADGE ROW */}
              <div className="grid grid-cols-3 gap-2 bg-orange-50 p-2 rounded-xl border border-orange-200 text-center font-mono">
                <div>
                  <span className="text-[9px] font-bold text-gray-500 block uppercase">UHID Number</span>
                  <span className="font-extrabold text-xs text-gray-900">{formatUhid(receiptModalAdmission.patientId?.uhid)}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-500 block uppercase">Admission ID (PID)</span>
                  <span className="font-extrabold text-xs text-blue-700">{receiptModalAdmission.pidNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-500 block uppercase">IPD Case ID</span>
                  <span className="font-extrabold text-xs text-orange-700">{receiptModalAdmission.ipdNumber || 'N/A'}</span>
                </div>
              </div>

              {/* SECTION 1: PATIENT BASIC INFORMATION */}
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-gray-100 px-3 py-1 font-extrabold text-gray-800 text-[11px] uppercase tracking-wide border-b border-gray-200 flex justify-between items-center">
                  <span>Patient Demographics</span>
                  <span className="text-[9px] text-gray-500 font-bold">Reg Date: {formatDateIST(receiptModalAdmission.patientId?.createdAt || Date.now())}</span>
                </div>
                <div className="p-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Patient Name</span>
                    <span className="font-black text-gray-900 text-xs">{receiptModalAdmission.patientId?.patientName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Mobile Number</span>
                    <span className="font-bold text-gray-900">{receiptModalAdmission.patientId?.mobile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Gender / Age</span>
                    <span className="font-bold text-gray-900">
                      {receiptModalAdmission.patientId?.gender || 'N/A'} • {receiptModalAdmission.patientId?.dob ? `${Math.floor((new Date() - new Date(receiptModalAdmission.patientId.dob)) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Aadhaar Number</span>
                    <span className="font-mono font-bold text-gray-900">{receiptModalAdmission.patientId?.aadhaar || 'N/A'}</span>
                  </div>
                  <div className="col-span-2 border-t border-gray-100 pt-1 mt-0.5">
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Residential Address</span>
                    <span className="font-semibold text-gray-800">{receiptModalAdmission.patientId?.address || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: WARD & BED ALLOCATION */}
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-gray-100 px-3 py-1 font-extrabold text-gray-800 text-[11px] uppercase tracking-wide border-b border-gray-200">
                  Ward & Bed Allocation Details
                </div>
                <div className="p-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Ward / Room Category</span>
                    <span className="font-extrabold text-gray-900">{receiptModalAdmission.roomId?.roomType || 'Standard Ward'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Allocated Bed Number</span>
                    <span className="font-mono font-extrabold text-orange-700 text-xs">
                      Bed {receiptModalAdmission.bedId?.bedNumber || 'N/A'} {receiptModalAdmission.bedId?.bedType ? `(${receiptModalAdmission.bedId.bedType})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Date & Time of Admission</span>
                    <span className="font-extrabold text-gray-900">
                      {formatDateTimeIST(receiptModalAdmission.admissionDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Daily Bed Charge</span>
                    <span className="font-extrabold text-emerald-700">₹{receiptModalAdmission.bedId?.pricePerDay || 0} / day</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: CONSULTANT & ADMISSION DETAILS */}
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-gray-100 px-3 py-1 font-extrabold text-gray-800 text-[11px] uppercase tracking-wide border-b border-gray-200">
                  Medical & Consultant Details
                </div>
                <div className="p-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Consultant In Charge</span>
                    <span className="font-extrabold text-gray-900">Dr. {receiptModalAdmission.doctorInCharge?.doctorName || receiptModalAdmission.doctorInCharge?.username || 'Attending Physician'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Referred By Doctor</span>
                    <span className="font-bold text-gray-800">
                      {receiptModalAdmission.referredDoctor ? `Dr. ${receiptModalAdmission.referredDoctor.doctorName || receiptModalAdmission.referredDoctor.username}` : 'Direct Admission'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Provisional Diagnosis</span>
                    <span className="font-bold text-gray-800">{receiptModalAdmission.provisionalDiagnosis || 'Under Observation'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[9px] font-bold uppercase block">Admission Status</span>
                    <span className="font-bold text-emerald-700">{receiptModalAdmission.status || 'Admitted'}</span>
                  </div>
                </div>
              </div>

              {/* SIGNATURE & STAMP FOOTER */}
              <div className="pt-2 grid grid-cols-2 gap-6 text-center text-[11px]">
                <div>
                  <div className="border-t border-dashed border-gray-400 pt-0.5 font-bold text-gray-600">
                    Patient / Relative Signature
                  </div>
                </div>
                <div>
                  <div className="border-t border-dashed border-gray-400 pt-0.5 font-bold text-gray-600">
                    Admitting Desk Officer / Stamp
                  </div>
                </div>
              </div>

            </div>

            {/* Print Button & Keyboard Hint (Screen Only) */}
            <div className="space-y-1.5 border-t border-gray-100 pt-2.5 no-print">
              <button
                type="button"
                onClick={triggerPrintAdmissionCard}
                className="btn w-full py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Printer className="h-4 w-4" /> Print Admission Card
              </button>
              <p className="text-[10px] text-gray-400 font-extrabold text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">ESC</kbd> key or click outside to close
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Printing & Glowing Animated Border Stylesheet */}
      <style>{`
        @keyframes border-glow-blue-shift {
          0% {
            background-position: 0% 50%;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.45), 0 0 18px rgba(59, 130, 246, 0.25);
          }
          50% {
            background-position: 100% 50%;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 32px rgba(59, 130, 246, 0.5);
          }
          100% {
            background-position: 0% 50%;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.45), 0 0 18px rgba(59, 130, 246, 0.25);
          }
        }

        @keyframes border-glow-red-shift {
          0% {
            background-position: 0% 50%;
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.5), 0 0 22px rgba(239, 68, 68, 0.3);
          }
          50% {
            background-position: 100% 50%;
            box-shadow: 0 0 24px rgba(239, 68, 68, 0.9), 0 0 38px rgba(239, 68, 68, 0.6);
          }
          100% {
            background-position: 0% 50%;
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.5), 0 0 22px rgba(239, 68, 68, 0.3);
          }
        }

        .border-glow-blue-animated {
          background: linear-gradient(90deg, #2563eb, #60a5fa, #3b82f6, #93c5fd, #2563eb);
          background-size: 300% 300%;
          animation: border-glow-blue-shift 3s ease infinite;
        }

        .border-glow-red-animated {
          background: linear-gradient(90deg, #dc2626, #f87171, #ef4444, #fca5a5, #dc2626);
          background-size: 300% 300%;
          animation: border-glow-red-shift 3s ease infinite;
        }

        @media print {
          /* Hide main application root completely when printing admission card */
          body.printing-admission-card #root,
          body.printing-admission-card nav,
          body.printing-admission-card aside,
          body.printing-admission-card header {
            display: none !important;
          }
          
          /* Show admission portal container cleanly */
          body.printing-admission-card .admission-portal-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 999999 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }

          body.printing-admission-card .admission-print-card {
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
          }

          body.printing-admission-card .no-print {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm !important;
          }

          body, html {
            background: white !important;
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IpdAdmission;
