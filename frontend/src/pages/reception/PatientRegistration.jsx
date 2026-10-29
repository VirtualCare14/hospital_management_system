import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Printer, Save, Search, UserCheck, Clock, User, Phone, CreditCard,
  Calendar, MapPin, Building2, Stethoscope, IndianRupee, Tag, Wallet,
  CheckCircle2, Activity, ChevronDown, ChevronUp, Check, Users, Coins, Eye, History, X, FlaskConical, Heart, Plus
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import client from '../../api/client';
import PatientReceipt from '../../components/PatientReceipt';
import SkeletonInput from '../../components/Skeleton/SkeletonInput';
import { formatUhid } from '../../utils/uhid';
import { openPdfPrintWindow } from '../../utils/pdfUtils';
import { generateTimeSlots, filterSlotsForDate } from '../../utils/timeSlots';

const Field = ({ label, required = false, icon: Icon, children, className = '', error, hint }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="flex items-center justify-between">
      <label className="block text-xs sm:text-sm font-extrabold text-gray-900 tracking-wide">
        {label}
        {required && <span className="text-red-600 font-black ml-1 text-sm">*</span>}
      </label>
      {hint && <div>{hint}</div>}
    </div>
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-500 stroke-[2]" />
        </div>
      )}
      {children}
    </div>
    {error && <p className="text-xs font-bold text-red-600 mt-1">{error}</p>}
  </div>
);

// Vitals configuration and helper functions
export const VITALS_CONFIG = {
  bloodPressure: {
    systolic: { min: 50, max: 250 },
    diastolic: { min: 30, max: 150 }
  },
  pulseRate: { min: 30, max: 250 }, // beats/min
  respiratoryRate: { min: 5, max: 60 }, // breaths/min
  spo2: { min: 0, max: 100 } // %
};

export const BP_CONFIG = VITALS_CONFIG.bloodPressure;

export const validatePulseRate = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return true;
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) {
    return 'Pulse Rate must contain numeric digits only';
  }
  const num = parseInt(str, 10);
  if (num < 0) {
    return 'Pulse Rate cannot be negative';
  }
  if (num < VITALS_CONFIG.pulseRate.min || num > VITALS_CONFIG.pulseRate.max) {
    return `Pulse Rate must be between ${VITALS_CONFIG.pulseRate.min} and ${VITALS_CONFIG.pulseRate.max} beats/min`;
  }
  return true;
};

export const validateRespiratoryRate = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return true;
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) {
    return 'Respiratory Rate must contain numeric digits only';
  }
  const num = parseInt(str, 10);
  if (num < 0) {
    return 'Respiratory Rate cannot be negative';
  }
  if (num < VITALS_CONFIG.respiratoryRate.min || num > VITALS_CONFIG.respiratoryRate.max) {
    return `Respiratory Rate must be between ${VITALS_CONFIG.respiratoryRate.min} and ${VITALS_CONFIG.respiratoryRate.max} breaths/min`;
  }
  return true;
};

export const validateSpO2 = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return true;
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) {
    return 'SpO2 must contain numeric digits only';
  }
  const num = parseInt(str, 10);
  if (num < 0 || num > 100) {
    return 'SpO2 must be between 0% and 100%';
  }
  return true;
};

export const handleNumericIntegerKeyDown = (e) => {
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    e.key === 'Tab' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.key === 'Enter' ||
    e.key === 'Escape'
  ) {
    return;
  }
  if (e.ctrlKey || e.metaKey) {
    return;
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

export const formatBp = (rawValue, prevValue = '') => {
  if (!rawValue) return '';

  const cleaned = rawValue.replace(/[^\d/]/g, '');
  if (!cleaned) return '';

  const isDeleting = cleaned.length < prevValue.length;

  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    const sys = parts[0].slice(0, 3);
    const dia = parts.slice(1).join('').slice(0, 3);
    return `${sys}/${dia}`;
  }

  if (cleaned.length <= 2) {
    return cleaned;
  }

  if (cleaned.length === 3) {
    if (!isDeleting) {
      return `${cleaned}/`;
    }
    return cleaned;
  }

  const sys = cleaned.slice(0, 3);
  const dia = cleaned.slice(3, 6);
  return `${sys}/${dia}`;
};

export const validateBloodPressure = (value) => {
  if (!value || !value.trim()) {
    return true; // Optional vitals field
  }

  const trimmed = value.trim();

  if (!trimmed.includes('/')) {
    return 'Blood pressure must be in Systolic/Diastolic format (e.g. 120/80)';
  }

  const parts = trimmed.split('/');
  if (parts.length !== 2) {
    return 'Blood pressure must be in Systolic/Diastolic format (e.g. 120/80)';
  }

  const [sysStr, diaStr] = parts;

  if (!sysStr) {
    return 'Please enter systolic blood pressure (e.g. 120/80)';
  }

  if (!diaStr) {
    return 'Please enter diastolic blood pressure (e.g. 120/80)';
  }

  if (!/^\d+$/.test(sysStr) || !/^\d+$/.test(diaStr)) {
    return 'Blood pressure must contain only numeric digits (e.g. 120/80)';
  }

  const systolic = parseInt(sysStr, 10);
  const diastolic = parseInt(diaStr, 10);

  if (isNaN(systolic) || isNaN(diastolic)) {
    return 'Invalid blood pressure values';
  }

  if (systolic < BP_CONFIG.systolic.min || systolic > BP_CONFIG.systolic.max) {
    return `Systolic BP must be between ${BP_CONFIG.systolic.min} and ${BP_CONFIG.systolic.max} mmHg`;
  }

  if (diastolic < BP_CONFIG.diastolic.min || diastolic > BP_CONFIG.diastolic.max) {
    return `Diastolic BP must be between ${BP_CONFIG.diastolic.min} and ${BP_CONFIG.diastolic.max} mmHg`;
  }

  if (systolic <= diastolic) {
    return 'Systolic BP must be greater than diastolic BP';
  }

  return true;
};

const PatientRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const paramSpecialistId = searchParams.get('specialistId');
  const paramDept = searchParams.get('dept');

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // Super Speciality / Doctor States
  const [doctorType, setDoctorType] = useState(paramSpecialistId ? 'visiting' : 'regular');
  const [visitingSchedules, setVisitingSchedules] = useState([]);
  const [visitingLoading, setVisitingLoading] = useState(false);
  const [selectedVisitingId, setSelectedVisitingId] = useState(paramSpecialistId || '');
  const [specialityText, setSpecialityText] = useState('');

  // Department creation states
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  // Authoritative slot states
  const [visitingAvailableSlots, setVisitingAvailableSlots] = useState([]);
  const [visitingSlotMessage, setVisitingSlotMessage] = useState('');
  const [visitingSlotError, setVisitingSlotError] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isPastDateSelected, setIsPastDateSelected] = useState(false);

  const [bookedSlots, setBookedSlots] = useState([]);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const receiptRef = useRef(null);
  const bpInputRef = useRef(null);
  const lastBpValueRef = useRef('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const department = watch('department');
  const doctorId = watch('doctorId');
  const appointmentDate = watch('appointmentDate');
  const patientNameValue = watch('patientName') || '';
  const mobileValue = watch('mobile') || '';
  const aadhaarValue = watch('aadhaar') || '';
  const bloodPressureValue = watch('bloodPressure') || '';

  useEffect(() => {
    lastBpValueRef.current = bloodPressureValue;
  }, [bloodPressureValue]);

  const { onChange: bpRegisterOnChange, ref: bpRegisterRef, ...bpRegisterRest } = register('bloodPressure', {
    validate: validateBloodPressure
  });

  const handleBpKeyDown = (e) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Tab' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'Enter' ||
      e.key === 'Escape'
    ) {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      return;
    }

    if (e.key === '/') {
      const val = e.target.value;
      const { selectionStart, selectionEnd } = e.target;
      const selectedText = val.slice(selectionStart, selectionEnd);
      const hasSlashElsewhere = val.includes('/') && !selectedText.includes('/');
      if (selectionStart === 0 || hasSlashElsewhere) {
        e.preventDefault();
        return;
      }
      return;
    }

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    const val = e.target.value;
    const { selectionStart, selectionEnd } = e.target;
    if (selectionStart !== selectionEnd) {
      return;
    }

    const slashIndex = val.indexOf('/');
    if (slashIndex === -1) {
      if (val.length >= 3 && selectionStart < 3) {
        e.preventDefault();
      }
    } else {
      if (selectionStart <= slashIndex) {
        const sys = val.slice(0, slashIndex);
        if (sys.length >= 3) {
          e.preventDefault();
        }
      } else {
        const dia = val.slice(slashIndex + 1);
        if (dia.length >= 3) {
          e.preventDefault();
        }
      }
    }
  };

  const handleBpChange = (e) => {
    const input = e.target;
    const rawValue = input.value;
    const prevValue = lastBpValueRef.current || '';
    const cursorBefore = input.selectionStart;

    const formatted = formatBp(rawValue, prevValue);
    lastBpValueRef.current = formatted;

    input.value = formatted;
    bpRegisterOnChange(e);

    let targetCursor = cursorBefore;
    if (formatted.length === 4 && formatted.endsWith('/') && prevValue.length === 2 && cursorBefore === 3) {
      targetCursor = 4;
    } else if (formatted.length > rawValue.length && cursorBefore >= 3) {
      targetCursor = cursorBefore + (formatted.length - rawValue.length);
    }

    requestAnimationFrame(() => {
      if (input && input.setSelectionRange) {
        input.setSelectionRange(targetCursor, targetCursor);
      }
    });
  };

  const handleBpPaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    if (!pasteText) return;

    const cleaned = pasteText.replace(/[^\d/]/g, '').trim();
    if (!cleaned) {
      toast.error('Invalid blood pressure characters rejected');
      return;
    }

    let formatted = '';
    if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      const sys = parts[0].slice(0, 3);
      const dia = parts.slice(1).join('').slice(0, 3);
      formatted = `${sys}/${dia}`;
    } else if (cleaned.length >= 4) {
      formatted = `${cleaned.slice(0, 3)}/${cleaned.slice(3, 6)}`;
    } else {
      formatted = cleaned.slice(0, 3);
    }

    lastBpValueRef.current = formatted;
    setValue('bloodPressure', formatted, { shouldValidate: true, shouldDirty: true });
    if (bpInputRef.current) {
      bpInputRef.current.value = formatted;
    }
  };

  const onFormError = (formErrors) => {
    const vitalFields = ['bloodPressure', 'pulseRate', 'respiratoryRate', 'spo2'];
    const vitalErrField = vitalFields.find(f => formErrors[f]);
    if (vitalErrField) {
      setShowVitals(true);
      toast.error(formErrors[vitalErrField].message);
    }
  };

  const isMobileValid = /^\d{10}$/.test(mobileValue.trim());
  const isAadhaarValid = /^\d{12}$/.test(aadhaarValue.trim());

  // Auto-pick today's date on component mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!watch('appointmentDate')) {
      setValue('appointmentDate', today);
    }
  }, [setValue, watch]);

  const fetchDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    try {
      const { data } = await client.get('/admin/departments');
      const activeDepts = (data || []).filter((dept) => dept.isActive);
      setDepartments(activeDepts);
      return activeDepts;
    } catch (err) {
      console.warn('Failed to load departments:', err.message);
      return [];
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreateDepartment = async () => {
    const trimmed = newDeptName.trim();
    if (!trimmed) {
      toast.error('Please enter a department name');
      return;
    }

    const exists = departments.find(d => d.departmentName.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error(`Department "${exists.departmentName}" already exists`);
      setValue('department', exists.departmentName, { shouldValidate: true });
      setIsAddingDept(false);
      setNewDeptName('');
      return;
    }

    setCreatingDept(true);
    try {
      const { data: newDept } = await client.post('/admin/departments', { departmentName: trimmed });
      toast.success(`Department "${newDept.departmentName}" created successfully`);
      await fetchDepartments();
      setValue('department', newDept.departmentName, { shouldValidate: true });
      setIsAddingDept(false);
      setNewDeptName('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setCreatingDept(false);
    }
  };

  useEffect(() => {
    if (paramDept) {
      setValue('department', paramDept);
    }
  }, [paramDept, setValue]);

  useEffect(() => {
    setValue('doctorId', '');
    setValue('slot', '');
    setBookedSlots([]);

    if (!department || doctorType === 'visiting') {
      setDoctors([]);
      return;
    }

    setDoctorsLoading(true);
    client
      .get(`/admin/doctors?department=${encodeURIComponent(department)}`)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDoctors(data);
        } else {
          client.get('/admin/doctors')
            .then((allRes) => setDoctors(allRes.data))
            .catch(() => setDoctors([]));
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, [department, doctorType, setValue]);

  // Fetch active visiting specialist schedules
  useEffect(() => {
    if (doctorType !== 'visiting') return;

    setVisitingLoading(true);
    const url = department
      ? `/reception/visiting-schedules/active?department=${encodeURIComponent(department)}`
      : '/reception/visiting-schedules/active';

    client
      .get(url)
      .then(({ data }) => {
        setVisitingSchedules(data || []);
        if (paramSpecialistId && data.some((s) => s._id === paramSpecialistId)) {
          setSelectedVisitingId(paramSpecialistId);
        }
      })
      .catch(() => setVisitingSchedules([]))
      .finally(() => setVisitingLoading(false));
  }, [doctorType, department, paramSpecialistId]);

  const selectedVisitingSchedule = useMemo(() => {
    return visitingSchedules.find((s) => s._id === selectedVisitingId) || null;
  }, [visitingSchedules, selectedVisitingId]);

  // When visiting specialist is chosen, auto-fill fee, speciality, and date
  useEffect(() => {
    if (doctorType === 'visiting' && selectedVisitingSchedule) {
      if (selectedVisitingSchedule.consultationFee !== undefined) {
        setValue('opdFee', selectedVisitingSchedule.consultationFee);
      }
      if (selectedVisitingSchedule.speciality) {
        setSpecialityText(selectedVisitingSchedule.speciality);
      }
      if (selectedVisitingSchedule.department && (!department || department !== selectedVisitingSchedule.department)) {
        setValue('department', selectedVisitingSchedule.department);
      }
      if (Array.isArray(selectedVisitingSchedule.visitDates) && selectedVisitingSchedule.visitDates.length > 0) {
        if (!selectedVisitingSchedule.visitDates.includes(appointmentDate)) {
          setValue('appointmentDate', selectedVisitingSchedule.visitDates[0]);
        }
      }
      setValue('slot', '');
    }
  }, [doctorType, selectedVisitingSchedule, department, appointmentDate, setValue]);

  // Fetch available slots from backend (server authoritative date and time)
  useEffect(() => {
    const now = new Date();
    const today = now.toLocaleDateString('en-CA');

    if (appointmentDate && appointmentDate < today) {
      setIsPastDateSelected(true);
      setVisitingAvailableSlots([]);
      setBookedSlots([]);
      setVisitingSlotMessage('Cannot book appointments for past dates.');
      setVisitingSlotError('');
      setSlotsLoading(false);
      return;
    }
    setIsPastDateSelected(false);

    if (doctorType === 'visiting') {
      if (selectedVisitingId && appointmentDate) {
        setSlotsLoading(true);
        setVisitingSlotError('');
        client
          .get(`/reception/visiting-schedules/${selectedVisitingId}/available-slots?date=${appointmentDate}`)
          .then(({ data }) => {
            setVisitingAvailableSlots(data.availableSlots || []);
            setBookedSlots(data.bookedSlots || []);
            setVisitingSlotMessage(data.message || '');
            setVisitingSlotError('');
          })
          .catch((err) => {
            setVisitingAvailableSlots([]);
            setBookedSlots([]);
            const errMsg = err.response?.data?.message || 'Failed to load available time slots.';
            setVisitingSlotMessage(errMsg);
            setVisitingSlotError(errMsg);
          })
          .finally(() => {
            setSlotsLoading(false);
          });
      } else {
        setVisitingAvailableSlots([]);
        setBookedSlots([]);
        setVisitingSlotMessage('');
        setVisitingSlotError('');
        setSlotsLoading(false);
      }
    } else {
      if (doctorId && appointmentDate) {
        setSlotsLoading(true);
        client
          .get(`/patients/booked-slots?doctorId=${doctorId}&date=${appointmentDate}`)
          .then(({ data }) => {
            setBookedSlots(data || []);
            setVisitingSlotMessage('');
            setVisitingSlotError('');
          })
          .catch(() => {
            setBookedSlots([]);
          })
          .finally(() => {
            setSlotsLoading(false);
          });
      } else {
        setBookedSlots([]);
        setVisitingSlotMessage('');
        setVisitingSlotError('');
        setSlotsLoading(false);
      }
    }
  }, [doctorType, doctorId, selectedVisitingId, appointmentDate]);

  const selectedDoctorObj = doctors.find((d) => d._id === doctorId);

  let freeSlots = [];
  let doctorAvailabilityStatus = '';

  if (doctorType === 'visiting') {
    if (isPastDateSelected) {
      doctorAvailabilityStatus = 'Cannot book appointments for past dates.';
      freeSlots = [];
    } else if (selectedVisitingSchedule && appointmentDate) {
      const dates = selectedVisitingSchedule.visitDates || [];
      if (dates.length > 0 && !dates.includes(appointmentDate)) {
        doctorAvailabilityStatus = `Dr. ${selectedVisitingSchedule.doctorName} is only scheduled on: ${dates.join(', ')}`;
        freeSlots = [];
      } else {
        freeSlots = visitingAvailableSlots;
        if (visitingSlotMessage && freeSlots.length === 0) {
          doctorAvailabilityStatus = visitingSlotMessage;
        }
      }
    }
  } else if (selectedDoctorObj && appointmentDate) {
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysList[dateObj.getDay()];

    const userSlots = selectedDoctorObj.availableSlots || [];
    const gap = selectedDoctorObj.slotGap || 10;

    let dayConfig = userSlots.find((s) => s.day?.toLowerCase() === dayName.toLowerCase());

    if (dayConfig) {
      if (!dayConfig.isAvailable) {
        doctorAvailabilityStatus = `${selectedDoctorObj.doctorName || selectedDoctorObj.username} is unavailable on ${dayName}s`;
      } else {
        const generated = generateTimeSlots(dayConfig.startTime || '09:00', dayConfig.endTime || '18:00', gap);
        const filteredForDate = filterSlotsForDate(generated, appointmentDate);
        freeSlots = filteredForDate.filter((slot) => !bookedSlots.includes(slot));
      }
    } else {
      const generated = generateTimeSlots('09:00', '18:00', gap);
      const filteredForDate = filterSlotsForDate(generated, appointmentDate);
      freeSlots = filteredForDate.filter((slot) => !bookedSlots.includes(slot));
    }
  }

  const [existingPatientData, setExistingPatientData] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const [patientDuesData, setPatientDuesData] = useState(null);
  const [showDuesModal, setShowDuesModal] = useState(false);

  const fetchPatientDues = async (uhid) => {
    try {
      const { data } = await client.get(`/billing/patient-dues/${uhid}`);
      setPatientDuesData(data);
    } catch (err) {
      setPatientDuesData(null);
    }
  };

  const performLookup = async (params) => {
    setLookingUp(true);
    setPatientDuesData(null);
    try {
      const { data } = await client.get('/patients/lookup', { params });
      if (data.found && data.patient) {
        setExistingPatientData(data.patient);
        setIsExistingPatient(true);

        if (data.patient.patientName) setValue('patientName', data.patient.patientName);
        if (data.patient.mobile) setValue('mobile', data.patient.mobile);
        if (data.patient.aadhaar) setValue('aadhaar', data.patient.aadhaar);
        if (data.patient.age !== undefined && data.patient.age !== null && data.patient.age !== '') {
          setValue('age', data.patient.age);
        } else if (data.patient.dob) {
          const birthYear = new Date(data.patient.dob).getFullYear();
          const calcAge = new Date().getFullYear() - birthYear;
          setValue('age', (calcAge >= 0 && calcAge <= 150) ? calcAge : '');
        }
        if (data.patient.gender) setValue('gender', data.patient.gender);
        if (data.patient.address) setValue('address', data.patient.address);

        if (data.patient.uhid) {
          fetchPatientDues(data.patient.uhid);
        }

        const visitCount = data.latestVisit ? `Visit #${(data.latestVisit.visitNumber || 0) + 1} next` : 'First visit';
        toast.success(`Existing patient found! UHID: ${formatUhid(data.patient.uhid)} — ${visitCount}. Details auto-filled.`);
      } else {
        setExistingPatientData(false);
        setIsExistingPatient(false);
        setPatientDuesData(null);
      }
    } catch (err) {
      setExistingPatientData(false);
      setIsExistingPatient(false);
      setPatientDuesData(null);
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    const cleanMobile = (mobileValue || '').replace(/\D/g, '');
    if (cleanMobile.length === 10 && !isExistingPatient) {
      performLookup({ mobile: cleanMobile });
    }
  }, [mobileValue, isExistingPatient]);

  // If receptionist changes the name to a different patient/family member, reset existing patient link
  useEffect(() => {
    if (isExistingPatient && existingPatientData?.patientName && patientNameValue) {
      const normalize = (s) => (s || '').toLowerCase().replace(/^(mr|mrs|ms|dr|master|miss)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
      const curNorm = normalize(patientNameValue);
      const exNorm = normalize(existingPatientData.patientName);
      if (curNorm && exNorm && curNorm !== exNorm) {
        setIsExistingPatient(false);
        setExistingPatientData(null);
        setPatientDuesData(null);
      }
    }
  }, [patientNameValue, isExistingPatient, existingPatientData]);

  const handleMobileBlur = (e) => {
    const mobile = e.target.value?.trim();
    if (mobile && mobile.length === 10 && !isExistingPatient) {
      performLookup({ mobile });
    }
  };

  const handleAadhaarBlur = (e) => {
    const aadhaar = e.target.value?.trim();
    if (aadhaar && aadhaar.length >= 4 && !isExistingPatient) {
      performLookup({ aadhaar });
    }
  };

  useEffect(() => {
    if (selectedDoctorObj) {
      const fee = selectedDoctorObj.opdFees !== undefined && selectedDoctorObj.opdFees !== null ? selectedDoctorObj.opdFees : 0;
      setValue('opdFee', fee);
      setValue('discountType', 'none');
      setValue('discountValue', 0);
      setValue('paymentStatus', 'Paid');
      setValue('paymentMode', 'Cash');
    }
  }, [doctorId, selectedDoctorObj, setValue]);

  const opdFeeVal = parseFloat(watch('opdFee')) || 0;
  const discountTypeVal = watch('discountType') || 'none';
  const discountValueVal = parseFloat(watch('discountValue')) || 0;
  const paymentStatusVal = watch('paymentStatus') || 'Paid';

  let calculatedDiscountAmt = 0;
  if (discountTypeVal === 'percent') {
    calculatedDiscountAmt = (opdFeeVal * Math.min(100, discountValueVal)) / 100;
  } else if (discountTypeVal === 'amount') {
    calculatedDiscountAmt = Math.min(opdFeeVal, discountValueVal);
  }
  const netPayableFee = Math.max(0, opdFeeVal - calculatedDiscountAmt);

  const onSubmit = async (data) => {
    try {
      if (data.bloodPressure) {
        const bpErr = validateBloodPressure(data.bloodPressure);
        if (bpErr !== true) {
          setShowVitals(true);
          toast.error(bpErr);
          return;
        }
      }
      if (data.pulseRate) {
        const prErr = validatePulseRate(data.pulseRate);
        if (prErr !== true) {
          setShowVitals(true);
          toast.error(prErr);
          return;
        }
      }
      if (data.respiratoryRate) {
        const rrErr = validateRespiratoryRate(data.respiratoryRate);
        if (rrErr !== true) {
          setShowVitals(true);
          toast.error(rrErr);
          return;
        }
      }
      if (data.spo2) {
        const spo2Err = validateSpO2(data.spo2);
        if (spo2Err !== true) {
          setShowVitals(true);
          toast.error(spo2Err);
          return;
        }
      }
      if (doctorType === 'visiting') {
        if (!selectedVisitingId) {
          toast.error('Please select a doctor');
          return;
        }
        if (!data.appointmentDate) {
          toast.error('Please select an appointment date');
          return;
        }
        if (selectedVisitingSchedule?.visitDates?.length > 0 && !selectedVisitingSchedule.visitDates.includes(data.appointmentDate)) {
          toast.error(`Doctor is only scheduled on: ${selectedVisitingSchedule.visitDates.join(', ')}`);
          return;
        }
        if (!data.slot) {
          toast.error('Please select an available slot');
          return;
        }
      }

      const tempVal = parseFloat(data.temperature);
      const grossFee = parseFloat(data.opdFee) || 0;
      const discType = data.discountType || 'none';
      const discVal = parseFloat(data.discountValue) || 0;
      const parsedAge = parseInt(data.age, 10) || 0;
      const birthYear = new Date().getFullYear() - parsedAge;
      const calculatedDob = `${birthYear}-01-01`;

      const isVisiting = doctorType === 'visiting';
      const visitingSched = isVisiting ? selectedVisitingSchedule : null;

      const payload = {
        ...data,
        bloodPressure: data.bloodPressure ? String(data.bloodPressure).replace(/[^0-9/]/g, '').trim() : undefined,
        isVisitingDoctor: isVisiting,
        visitingScheduleId: isVisiting ? visitingSched?._id : null,
        visitingDoctorName: isVisiting ? visitingSched?.doctorName : undefined,
        doctorName: isVisiting ? visitingSched?.doctorName : undefined,
        speciality: isVisiting ? (specialityText.trim() || visitingSched?.speciality || '') : undefined,
        doctorId: isVisiting ? null : data.doctorId,
        age: parsedAge,
        dob: calculatedDob,
        opdFee: grossFee,
        discountType: discType,
        discountValue: discVal,
        paymentStatus: data.paymentStatus || 'Paid',
        paymentMode: data.paymentStatus === 'Not Paid' ? 'Pending' : (data.paymentMode || 'Cash'),
        visitType: (data.department && data.department.toLowerCase().trim() === 'same day care')
          ? 'Same Day Treatment'
          : 'OPD',
        temperature: !isNaN(tempVal) ? ((tempVal - 32) * 5 / 9).toFixed(1) : undefined
      };
      const { data: res } = await client.post('/patients/create', payload);
      toast.success(res.message);
      setRegisteredPatient(res.patient);
      setShowReceipt(true);
      reset();
      lastBpValueRef.current = '';
      const today = new Date().toISOString().split('T')[0];
      setValue('appointmentDate', today);
      setBookedSlots([]);
      setSelectedVisitingId('');
      setSpecialityText('');
      setVisitingAvailableSlots([]);
      setVisitingSlotMessage('');
      setVisitingSlotError('');
      setSlotsLoading(false);
      setExistingPatientData(null);
      setIsExistingPatient(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const [currentDateTimeStr, setCurrentDateTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentDateTimeStr(now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const [printMode, setPrintMode] = useState('patient_slip');
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [letterheadOption, setLetterheadOption] = useState('system'); // 'system' | 'image'

  useEffect(() => {
    client.get('/admin/hospital-settings')
      .then(({ data }) => {
        if (data?.exists && data?.data) {
          setHospitalSettings(data.data);
          if (data.data.useSystemLetterhead === false && data.data.letterheadImageUrl) {
            setLetterheadOption('image');
          } else {
            setLetterheadOption('system');
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching hospital settings in PatientRegistration:', err);
      });
  }, []);

  const handlePrint = async (targetMode) => {
    setPrintMode(targetMode);
    setTimeout(async () => {
      if (!receiptRef.current) return;
      try {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          imageTimeout: 20000
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.autoPrint();
        openPdfPrintWindow(pdf, 'Patient Registration Slip');
      } catch (error) {
        console.error('Print receipt error:', error);
        toast.error('Error generating receipt. Please try again.');
      }
    }, 150);
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setRegisteredPatient(null);
    setPrintMode('patient_slip');
  };

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleSubmit(onSubmit, onFormError)} className={`card p-6 space-y-6 bg-white shadow-md rounded-2xl border border-gray-200 w-full ${showReceipt ? 'no-print print:hidden' : ''}`}>
        {isExistingPatient && (
          <div className="flex justify-end border-b border-gray-200 pb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-green-700 bg-green-50 border border-green-300 px-3.5 py-1.5 rounded-full">
              <UserCheck className="h-4 w-4 text-green-700 stroke-[2]" /> Existing Patient Mode
            </span>
          </div>
        )}

        {/* Existing Patient Banner */}
        {isExistingPatient && existingPatientData && (
          <div className="flex items-center gap-3 p-4 bg-green-50/90 border border-green-300 rounded-xl shadow-2xs">
            <UserCheck className="h-6 w-6 text-green-700 stroke-[2] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-extrabold text-green-900">
                Existing Patient Found — UHID: {formatUhid(existingPatientData.uhid)}
              </p>
              <p className="text-xs font-bold text-green-700 mt-0.5">
                {existingPatientData.patientName} • {existingPatientData.gender} • {existingPatientData.mobile}
                {existingPatientData.doctorId?.doctorName && ` • Last Doctor: Dr. ${existingPatientData.doctorId.doctorName}`}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-extrabold text-green-800 hover:bg-green-100 px-3.5 py-2 rounded-lg transition-colors cursor-pointer border border-green-400 bg-white"
              onClick={() => {
                setExistingPatientData(null);
                setIsExistingPatient(false);
                setPatientDuesData(null);
                reset();
                const today = new Date().toISOString().split('T')[0];
                setValue('appointmentDate', today);
                setBookedSlots([]);
              }}
            >
              Register New Patient
            </button>
          </div>
        )}

        {/* Outstanding Due Amount Alert Banner for Existing Patient */}
        {isExistingPatient && patientDuesData && patientDuesData.totalDueAmount > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border-2 border-red-300 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
                <Coins className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-red-700 tracking-wider">Outstanding Bill Due Alert</span>
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px]">
                    {patientDuesData.dueBillCount} Pending Bill{patientDuesData.dueBillCount > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm font-black text-gray-900 mt-0.5">
                  Total Outstanding Balance: <span className="text-red-700 text-base font-extrabold">₹{patientDuesData.totalDueAmount.toFixed(2)}</span>
                </p>
                <p className="text-xs text-gray-600">
                  Patient has unpaid/partially paid bill dues from previous visits.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDuesModal(true)}
              className="btn py-2 px-4 text-xs bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="h-4 w-4" /> View Due Details & History
            </button>
          </div>
        )}

        {/* RECEPTION DUE DETAILS & PAYMENT HISTORY MODAL */}
        {showDuesModal && patientDuesData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-2xl p-6 space-y-5 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-red-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">Patient Due Breakdown & History</h3>
                    <p className="text-xs text-gray-500">
                      UHID: {formatUhid(patientDuesData.patient.uhid)} • {patientDuesData.patient.patientName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDuesModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Total Due Banner */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">Total Due Amount Left</span>
                  <h4 className="text-2xl font-black text-red-700">₹{patientDuesData.totalDueAmount.toFixed(2)}</h4>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 font-extrabold text-xs rounded-lg border border-red-300">
                  {patientDuesData.bills.length} Pending Invoice{patientDuesData.bills.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Bills List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">Invoice Dues & Installment History</h4>
                {patientDuesData.bills.map((b) => (
                  <div key={b._id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                      <div>
                        <span className="font-mono font-black text-gray-900 text-sm">{b.invoiceNo || b.billNo}</span>
                        <span className="text-xs text-gray-500 block">
                          Generated on: {b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-500 block">Bill Type: {b.billType}</span>
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          b.paymentStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">Grand Total</span>
                        <span className="font-bold text-gray-900">₹{b.grandTotal?.toFixed(2)}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">Amount Paid</span>
                        <span className="font-bold text-emerald-600">₹{b.amountPaid?.toFixed(2)}</span>
                      </div>
                      <div className="bg-red-100/60 p-2 rounded-lg border border-red-200">
                        <span className="text-[10px] text-red-600 font-black block uppercase">Due Left</span>
                        <span className="font-black text-red-700">₹{b.dueAmount?.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Installments timeline log */}
                    {b.payments && b.payments.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-extrabold text-gray-500 flex items-center gap-1">
                          <History className="h-3.5 w-3.5 text-orange-500" /> Installment Payment Log:
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {b.payments.map((p, idx) => (
                            <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200 text-[11px] flex justify-between items-center">
                              <div>
                                <span className="font-bold text-emerald-700">Paid ₹{p.amount.toFixed(2)}</span>
                                <span className="text-gray-500 block text-[10px]">
                                  Via {p.paymentMode} • {p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-500 block text-[10px]">Remaining Due: ₹{(p.dueAfterPayment || 0).toFixed(2)}</span>
                                {p.receivedByName && <span className="text-gray-400 text-[9px] block">By {p.receivedByName}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic pt-1">No installment payments recorded yet for this bill.</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDuesModal(false)}
                  className="btn-secondary py-2 px-5 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {existingPatientData === false && (
          <div className="flex items-center gap-3 p-3.5 bg-blue-50/90 border border-blue-300 rounded-xl">
            <Search className="h-5 w-5 text-blue-600 stroke-[2] flex-shrink-0" />
            <p className="text-xs font-extrabold text-blue-800">
              No existing patient record found. A new UHID will be created upon registration.
            </p>
          </div>
        )}

        {/* Full Width 3-Column Layout for Sections 1, 2, and 3 in Same Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
          {/* Column 1: Patient Personal Details */}
          <div className="space-y-5 p-4 sm:p-5 bg-gray-50/70 rounded-2xl border border-gray-300 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-300 pb-2.5 mb-2">
                <User className="h-5 w-5 text-indigo-700 stroke-[2]" />
                <h2 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Patient Personal Details
                </h2>
              </div>

              {/* Patient Name */}
              <Field label="Patient Name" required icon={User} error={errors.patientName?.message}>
                <input
                  className={`input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.patientName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter patient full name"
                  {...register('patientName', { required: 'Patient name is required' })}
                />
              </Field>

              {/* Phone Number with 10-digit counter badge */}
              <Field
                label="Phone Number"
                required
                icon={Phone}
                error={errors.mobile?.message}
                hint={
                  mobileValue.length > 0 && (
                    <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full border ${isMobileValid ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-gray-600 bg-gray-200 border-gray-300'}`}>
                      {isMobileValid ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" /> 10/10 Digits
                        </>
                      ) : (
                        `${mobileValue.trim().length}/10 Digits`
                      )}
                    </span>
                  )
                }
              >
                <input
                  className={`input h-11 pl-9 pr-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.mobile ? 'border-red-500 focus:ring-red-500' : isMobileValid ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30' : ''}`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  {...register('mobile', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'Mobile number must be exactly 10 digits'
                    }
                  })}
                  onBlur={handleMobileBlur}
                />
                {isMobileValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 stroke-[2] h-5 w-5 pointer-events-none" />
                )}
                {lookingUp && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-700 font-black">Checking...</span>
                )}
              </Field>

              {/* Aadhaar Card Number with 12-digit counter badge */}
              <Field
                label="Aadhaar Card Number"
                icon={CreditCard}
                error={errors.aadhaar?.message}
                hint={
                  aadhaarValue.length > 0 && (
                    <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full border ${isAadhaarValid ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-gray-600 bg-gray-200 border-gray-300'}`}>
                      {isAadhaarValid ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" /> 12/12 Digits
                        </>
                      ) : (
                        `${aadhaarValue.trim().length}/12 Digits`
                      )}
                    </span>
                  )
                }
              >
                <input
                  className={`input h-11 pl-9 pr-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.aadhaar ? 'border-red-500 focus:ring-red-500' : isAadhaarValid ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30' : ''}`}
                  placeholder="Enter 12-digit Aadhaar number"
                  maxLength={12}
                  {...register('aadhaar', {
                    pattern: {
                      value: /^\d{12}$/,
                      message: 'Aadhaar number must be exactly 12 digits'
                    }
                  })}
                  onBlur={handleAadhaarBlur}
                  disabled={lookingUp}
                />
                {isAadhaarValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 stroke-[2] h-5 w-5 pointer-events-none" />
                )}
              </Field>

              {/* Gender & Age Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Gender" required icon={Users} error={errors.gender?.message}>
                  <select className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('gender', { required: 'Gender is required' })}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field label="Age (Years)" required icon={Calendar} error={errors.age?.message}>
                  <input
                    className="input h-11 pl-9 pr-1 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    type="number"
                    placeholder="Enter age (e.g. 25)"
                    min="0"
                    max="150"
                    {...register('age', {
                      required: 'Age is required',
                      min: { value: 0, message: 'Age cannot be negative' },
                      max: { value: 150, message: 'Please enter a valid age' }
                    })}
                  />
                </Field>
              </div>

              {/* Address */}
              <Field label="Address" icon={MapPin} error={errors.address?.message}>
                <textarea
                  className="input pl-9 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 min-h-20 shadow-2xs"
                  placeholder="Enter full address"
                  rows={2}
                  {...register('address')}
                />
              </Field>
            </div>
          </div>

          {/* Column 2: Appointment & Department Info */}
          <div className="space-y-5 p-4 sm:p-5 bg-gray-50/70 rounded-2xl border border-gray-300 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-300 pb-2.5 mb-2">
                <Stethoscope className="h-5 w-5 text-indigo-700 stroke-[2]" />
                <h2 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Appointment & Department Info
                </h2>
              </div>

              {/* Doctor Type Selector */}
              <div className="flex rounded-xl bg-gray-200/90 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setDoctorType('regular');
                    setSelectedVisitingId('');
                    setValue('slot', '');
                    setBookedSlots([]);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${
                    doctorType === 'regular'
                      ? 'bg-white text-indigo-950 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Standard OPD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDoctorType('visiting');
                    setValue('doctorId', '');
                    setValue('slot', '');
                    setBookedSlots([]);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                    doctorType === 'visiting'
                      ? 'bg-orange-600 text-white shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Super Speciality OPD</span>
                </button>
              </div>

              {/* Department (Reusing existing Department Master with inline creation) */}
              <Field
                label="Department"
                required
                icon={Building2}
                error={errors.department?.message}
                hint={
                  !isAddingDept && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingDept(true);
                        setNewDeptName('');
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Department</span>
                    </button>
                  )
                }
              >
                {isAddingDept ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs flex-1"
                      placeholder="Enter new department name"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateDepartment();
                        } else if (e.key === 'Escape') {
                          setIsAddingDept(false);
                          setNewDeptName('');
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={creatingDept}
                      onClick={handleCreateDepartment}
                      className="h-11 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
                    >
                      {creatingDept ? 'Adding...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={creatingDept}
                      onClick={() => {
                        setIsAddingDept(false);
                        setNewDeptName('');
                      }}
                      className="h-11 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : departmentsLoading ? (
                  <SkeletonInput />
                ) : (
                  <select
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                    {...register('department', {
                      required: 'Department is required',
                      onChange: (e) => {
                        const val = e.target.value;
                        if (val === '__ADD_NEW__') {
                          setIsAddingDept(true);
                          setNewDeptName('');
                          setValue('department', '');
                          return;
                        }
                        if (doctorType === 'visiting' && selectedVisitingSchedule && selectedVisitingSchedule.department !== val) {
                          setSelectedVisitingId('');
                          setValue('slot', '');
                          setBookedSlots([]);
                        }
                      }
                    })}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept.departmentName}>{dept.departmentName}</option>
                    ))}
                    <option value="__ADD_NEW__" className="text-indigo-600 font-bold">+ Add New Department...</option>
                  </select>
                )}
              </Field>

              {/* Doctor / Specialist Dropdown */}
              {doctorType === 'visiting' ? (
                <Field
                  label="Doctor Name"
                  required
                  icon={Stethoscope}
                  hint={
                    <button
                      type="button"
                      onClick={() => navigate('/reception/visiting-specialists')}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold underline"
                    >
                      Manage Schedules
                    </button>
                  }
                >
                  {visitingLoading ? (
                    <SkeletonInput />
                  ) : (
                    <select
                      className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-2xs"
                      value={selectedVisitingId}
                      onChange={(e) => {
                        const newDocId = e.target.value;
                        setSelectedVisitingId(newDocId);
                        setValue('slot', '');
                        setVisitingAvailableSlots([]);
                        setVisitingSlotError('');
                      }}
                    >
                      <option value="">Select doctor</option>
                      {visitingSchedules.length === 0 && (
                        <option value="" disabled>
                          {department ? `No active doctors scheduled for ${department}` : 'No active doctors found'}
                        </option>
                      )}
                      {visitingSchedules.map((sched) => (
                        <option key={sched._id} value={sched._id}>
                          Dr. {sched.doctorName} — {sched.speciality ? `${sched.speciality} (${sched.department})` : sched.department} • {sched.startTime}-{sched.endTime} ({sched.slotDuration || 15}m) • ₹{sched.consultationFee}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : (
                <Field label="Doctor / Same Day Care" required icon={Stethoscope} error={errors.doctorId?.message}>
                  {doctorsLoading ? (
                    <SkeletonInput />
                  ) : (
                    <select
                      className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      {...register('doctorId', { required: doctorType === 'regular' ? 'Doctor / Provider selection is required' : false })}
                    >
                      <option value="">Select doctor / care provider</option>
                      {doctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.role === 'nursing' ? '' : 'Dr. '}{doc.doctorName || doc.username} {doc.role === 'nursing' ? '(Same Day Care)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              )}

              {/* Specialist Info Card */}
              {doctorType === 'visiting' && selectedVisitingSchedule && (
                <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl space-y-1.5 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">
                      Dr. {selectedVisitingSchedule.doctorName}
                    </span>
                    <span className="font-bold text-orange-800 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-md">
                      Doctor Fee: ₹{selectedVisitingSchedule.consultationFee}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-600 text-[11px]">
                    <span><strong>Dept:</strong> {selectedVisitingSchedule.department}</span>
                    {selectedVisitingSchedule.speciality && (
                      <span><strong>Speciality:</strong> {selectedVisitingSchedule.speciality}</span>
                    )}
                    <span><strong>Visiting Hours:</strong> {selectedVisitingSchedule.startTime} - {selectedVisitingSchedule.endTime}</span>
                    <span><strong>Slot:</strong> {selectedVisitingSchedule.slotDuration || 15} mins</span>
                  </div>
                  <div className="text-[11px] text-gray-600 pt-1 border-t border-orange-200/60">
                    <strong>Configured Schedule Dates:</strong> {selectedVisitingSchedule.visitDates?.join(', ')}
                  </div>
                </div>
              )}

              {/* Appointment Date */}
              <Field label="Appointment Date" required icon={Calendar} error={errors.appointmentDate?.message}>
                <div className="w-full space-y-1.5">
                  <input
                    className="input h-11 pl-9 pr-1 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs w-full"
                    type="date"
                    {...register('appointmentDate', {
                      required: 'Appointment date is required',
                      onChange: () => {
                        setValue('slot', '');
                        setVisitingAvailableSlots([]);
                        setVisitingSlotError('');
                      }
                    })}
                  />
                  {doctorType === 'visiting' && selectedVisitingSchedule?.visitDates?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] font-semibold text-gray-500">Scheduled:</span>
                      {selectedVisitingSchedule.visitDates.map((dateStr) => (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            setValue('appointmentDate', dateStr);
                            setValue('slot', '');
                            setVisitingAvailableSlots([]);
                            setVisitingSlotError('');
                          }}
                          className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium border transition-colors ${
                            appointmentDate === dateStr
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                              : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-50'
                          }`}
                        >
                          {dateStr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* Free Available Slots */}
              <Field
                label="Free Available Slots"
                required
                icon={Clock}
                error={errors.slot?.message || visitingSlotError}
                hint={
                  slotsLoading && (
                    <span className="text-[11px] text-indigo-600 font-semibold animate-pulse flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      Loading slots...
                    </span>
                  )
                }
              >
                <select 
                  className={`input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${(errors.slot || visitingSlotError || doctorAvailabilityStatus) ? 'border-red-500 text-red-600' : 'text-gray-900'}`} 
                  {...register('slot', { required: 'Slot selection is required' })}
                >
                  <option value="">
                    {slotsLoading
                      ? 'Loading available time slots...'
                      : visitingSlotError
                        ? visitingSlotError
                        : doctorType === 'visiting'
                          ? !selectedVisitingId || !appointmentDate
                            ? (!department ? 'Select department, doctor & date first' : 'Select doctor & date first')
                            : isPastDateSelected
                              ? 'Cannot book appointments for past dates'
                              : doctorAvailabilityStatus
                                ? doctorAvailabilityStatus
                                : freeSlots.length === 0
                                  ? 'No available time slots for this date.'
                                  : `Select free slot (${freeSlots.length} available)`
                          : !doctorId || !appointmentDate
                            ? (!department ? 'Select department, doctor & date first' : 'Select doctor & date first')
                            : isPastDateSelected
                              ? 'Cannot book appointments for past dates'
                              : doctorAvailabilityStatus
                                ? doctorAvailabilityStatus
                                : freeSlots.length === 0
                                  ? 'No available time slots for this date.'
                                  : `Select free slot (${freeSlots.length} available)`}
                  </option>
                  {freeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </Field>
              {(visitingSlotError || doctorAvailabilityStatus) && (
                <p className="text-xs font-black text-red-600 mt-1">{visitingSlotError || doctorAvailabilityStatus}</p>
              )}
            </div>
          </div>

          {/* Column 3: OPD Consultation Fee & Discount Billing */}
          <div className="space-y-5 p-4 sm:p-5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2.5 mb-2">
                <div className="flex items-center gap-2.5">
                  <IndianRupee className="h-5 w-5 text-indigo-700 stroke-[2]" />
                  <h2 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                    OPD Fee & Discount Billing
                  </h2>
                </div>
                {doctorType === 'regular' && selectedDoctorObj && selectedDoctorObj.opdFees > 0 && (
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md">
                    Admin Fee: ₹{selectedDoctorObj.opdFees}
                  </span>
                )}
                {doctorType === 'visiting' && selectedVisitingSchedule && (
                  <span className="text-xs font-black text-orange-800 bg-orange-100 border border-orange-300 px-2.5 py-1 rounded-md">
                    Doctor Fee: ₹{selectedVisitingSchedule.consultationFee}
                  </span>
                )}
              </div>

              {/* OPD Fee */}
              <Field label="OPD Fee (₹)" icon={IndianRupee}>
                <input
                  className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  placeholder="0"
                  type="number"
                  min="0"
                  step="1"
                  {...register('opdFee', { min: 0 })}
                />
              </Field>

              {/* Discount Mode & Value Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Discount Mode" icon={Tag}>
                  <select className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('discountType')}>
                    <option value="none">No Discount</option>
                    <option value="amount">Rupees (₹)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </Field>

                {discountTypeVal !== 'none' ? (
                  <Field label={discountTypeVal === 'percent' ? "Value (%)" : "Value (₹)"} icon={Tag}>
                    <input
                      className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold border-amber-400 focus:ring-amber-500 text-amber-950 bg-white shadow-2xs"
                      placeholder={discountTypeVal === 'percent' ? "%" : "₹"}
                      type="number"
                      min="0"
                      max={discountTypeVal === 'percent' ? 100 : opdFeeVal}
                      step="0.01"
                      {...register('discountValue')}
                    />
                  </Field>
                ) : (
                  <div className="opacity-40 pointer-events-none">
                    <Field label="Value" icon={Tag}>
                      <input className="input h-11 pl-9 pr-2 text-xs sm:text-sm bg-gray-100" placeholder="Disabled" disabled />
                    </Field>
                  </div>
                )}
              </div>

              {/* Payment Status & Payment Mode Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Payment Status" icon={Wallet}>
                  <select className={`input h-11 pl-9 pr-2 text-xs sm:text-sm font-extrabold bg-white cursor-pointer border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${paymentStatusVal === 'Not Paid' ? 'text-red-600 border-red-400' : 'text-emerald-700 border-emerald-400'}`} {...register('paymentStatus')}>
                    <option value="Paid">Paid</option>
                    <option value="Not Paid">Not Paid</option>
                  </select>
                </Field>

                {paymentStatusVal === 'Paid' ? (
                  <Field label="Payment Mode" icon={Wallet}>
                    <select className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('paymentMode')}>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                ) : (
                  <div className="opacity-40 pointer-events-none">
                    <Field label="Payment Mode" icon={Wallet}>
                      <input className="input h-11 pl-9 pr-2 text-xs sm:text-sm bg-gray-100" placeholder="Pending" disabled />
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* Live Fee Summary Card */}
            <div className="p-4 bg-white border border-indigo-200 rounded-xl shadow-2xs space-y-2 mt-3">
              <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                <span>Gross Fee:</span>
                <span className="text-gray-900 font-extrabold text-base">₹{opdFeeVal.toFixed(2)}</span>
              </div>
              {discountTypeVal !== 'none' && (
                <div className="flex justify-between items-center text-sm font-bold text-amber-800">
                  <span>Discount:</span>
                  <span className="font-extrabold text-base">-₹{calculatedDiscountAmt.toFixed(2)} ({discountTypeVal === 'percent' ? `${discountValueVal}%` : '₹ Amount'})</span>
                </div>
              )}
              <div className="border-t border-indigo-100 pt-2 flex justify-between items-center">
                <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">Net OPD Fee:</span>
                <span className="text-2xl font-black text-indigo-700">₹{netPayableFee.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Optional Vitals Accordion */}
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setShowVitals(!showVitals)}
            className="flex items-center gap-2 text-xs font-black text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-2xs"
          >
            <Activity className="h-4.5 w-4.5 text-indigo-700 stroke-[2]" />
            {showVitals ? 'Hide Patient Vitals' : '+ Add Patient Vitals (Optional)'}
            {showVitals ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </button>

          {showVitals && (
            <div className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-300 rounded-xl">
              {/* Row 1: Existing 4 vitals fields preserved in exact position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                <Field label="Weight (kg)" icon={Activity}>
                  <input className="input h-11 pl-11 text-base font-bold text-gray-900" placeholder="kg" type="number" step="0.1" {...register('weight')} />
                </Field>
                <Field label="Height (cm)" icon={Activity}>
                  <input className="input h-11 pl-11 text-base font-bold text-gray-900" placeholder="cm" type="number" step="0.1" {...register('height')} />
                </Field>
                <Field label="Blood Pressure (mmHg)" icon={Activity} error={errors.bloodPressure?.message}>
                  <input
                    type="text"
                    className={`input h-11 pl-11 pr-14 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.bloodPressure ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="120/80"
                    maxLength={7}
                    autoComplete="off"
                    {...bpRegisterRest}
                    ref={(e) => {
                      bpRegisterRef(e);
                      bpInputRef.current = e;
                    }}
                    onKeyDown={handleBpKeyDown}
                    onChange={handleBpChange}
                    onPaste={handleBpPaste}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none">
                    mmHg
                  </span>
                </Field>
                <Field label="Temperature (°F)" icon={Activity}>
                  <input className="input h-11 pl-11 text-base font-bold text-gray-900" placeholder="98.6" type="number" step="0.1" {...register('temperature')} />
                </Field>
              </div>

              {/* Row 2: Pulse Rate, Respiratory Rate, SpO2, CVS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
                <Field label="Pulse Rate (PR)" icon={Heart} error={errors.pulseRate?.message}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`input h-11 pl-11 pr-20 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.pulseRate ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="80"
                    maxLength={3}
                    autoComplete="off"
                    {...register('pulseRate', { validate: validatePulseRate })}
                    onKeyDown={handleNumericIntegerKeyDown}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none">
                    beats/min
                  </span>
                </Field>

                <Field label="Respiratory Rate (RR)" icon={Activity} error={errors.respiratoryRate?.message}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`input h-11 pl-11 pr-24 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.respiratoryRate ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="18"
                    maxLength={3}
                    autoComplete="off"
                    {...register('respiratoryRate', { validate: validateRespiratoryRate })}
                    onKeyDown={handleNumericIntegerKeyDown}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none">
                    breaths/min
                  </span>
                </Field>

                <Field label="SpO2 (%)" icon={Activity} error={errors.spo2?.message}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`input h-11 pl-11 pr-10 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.spo2 ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="98"
                    maxLength={3}
                    autoComplete="off"
                    {...register('spo2', { validate: validateSpO2 })}
                    onKeyDown={handleNumericIntegerKeyDown}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none">
                    %
                  </span>
                </Field>

                <Field label="CVS" icon={Stethoscope}>
                  <input
                    type="text"
                    className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    placeholder="Enter CVS findings"
                    autoComplete="off"
                    {...register('cvs')}
                  />
                </Field>
              </div>

              {/* Row 3: Bilateral Chest & Per Abdomen (PA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                <Field label="Bilateral Chest" icon={Stethoscope}>
                  <input
                    type="text"
                    className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    placeholder="Enter bilateral chest findings"
                    autoComplete="off"
                    {...register('bilateralChest')}
                  />
                </Field>

                <Field label="Per Abdomen (PA)" icon={Stethoscope}>
                  <input
                    type="text"
                    className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    placeholder="Enter abdominal examination findings"
                    autoComplete="off"
                    {...register('perAbdomen')}
                  />
                </Field>
              </div>
)
            </div>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="text-xs font-black text-red-600">
            {Object.keys(errors).length === 1 && (errors.bloodPressure || errors.pulseRate || errors.respiratoryRate || errors.spo2)
              ? `Please correct invalid vitals: ${errors.bloodPressure?.message || errors.pulseRate?.message || errors.respiratoryRate?.message || errors.spo2?.message}`
              : 'Please fill out all mandatory fields marked with red asterisks (*).'}
          </p>
        )}

        {/* Submit Action & Registration Date Time Display */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 mt-2">
          <button className="btn cursor-pointer w-full sm:w-auto px-10 py-3.5 text-base font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2" type="submit">
            <Save className="h-5 w-5 stroke-[2]" /> {isExistingPatient ? 'Register New Visit' : 'Register Patient'}
          </button>

          <div className="flex items-center gap-2 text-right self-end sm:self-auto bg-gray-50 border border-gray-300 px-3.5 py-2 rounded-xl shadow-2xs">
            <Clock className="h-4.5 w-4.5 text-indigo-700 stroke-[2]" />
            <span className="text-sm font-black text-gray-900 leading-tight">{currentDateTimeStr}</span>
          </div>
        </div>
      </form>

      {/* Receipt & Patient Slip Preview and Print Options Modal */}
      {showReceipt && registeredPatient && (
        <div className="card p-5 space-y-4 border-2 border-indigo-100 bg-white rounded-2xl shadow-xl print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none print:bg-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg">Patient Registered Successfully</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                UHID: <strong className="text-indigo-600">{formatUhid(registeredPatient.uhid)}</strong> | Reg#: {registeredPatient.registrationNumber || 'N/A'} {registeredPatient.billNumber ? `| Bill #: ${registeredPatient.billNumber}` : ''}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-secondary cursor-pointer flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 px-3.5 py-2 rounded-lg"
                onClick={() => handlePrint('patient_slip')}
              >
                <Printer className="h-4 w-4 text-indigo-600" /> Print Patient Slip
              </button>
              <button
                type="button"
                className="btn cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg"
                onClick={() => handlePrint('bill_receipt')}
              >
                <Printer className="h-4 w-4" /> Print Bill Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  closeReceipt();
                  const fName = registeredPatient.firstName || registeredPatient.patientName?.split(' ')[0] || '';
                  const lName = registeredPatient.lastName || registeredPatient.patientName?.split(' ').slice(1).join(' ') || '';
                  const params = new URLSearchParams({
                    patientId: registeredPatient._id || registeredPatient.patientId || '',
                    uhid: registeredPatient.uhid || '',
                    firstName: fName,
                    lastName: lName,
                    mobile: registeredPatient.mobile || registeredPatient.phone || '',
                    gender: registeredPatient.gender || '',
                    age: registeredPatient.age ? String(registeredPatient.age) : '',
                    ref: registeredPatient.doctorName ? `Dr. ${registeredPatient.doctorName}` : ''
                  });
                  navigate(`/reception/lab-billing?${params.toString()}`);
                }}
                className="btn cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-lg shadow-xs"
              >
                <FlaskConical className="h-4 w-4" /> Create Lab Bill
              </button>
              <button
                type="button"
                className="btn-secondary cursor-pointer text-xs px-3 py-2 text-gray-500 hover:text-gray-700 rounded-lg"
                onClick={closeReceipt}
              >
                Done
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 px-4 py-2.5 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Document Mode:</span>
              <div className="flex gap-1.5 bg-gray-200/80 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setPrintMode('patient_slip')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-all cursor-pointer ${
                    printMode === 'patient_slip' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Patient Slip Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('bill_receipt')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-all cursor-pointer ${
                    printMode === 'bill_receipt' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bill Receipt Preview
                </button>
              </div>
            </div>

            {printMode === 'patient_slip' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Letterhead:</span>
                <div className="flex gap-1.5 bg-gray-200/80 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setLetterheadOption('system')}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                      letterheadOption === 'system' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Clean system-generated header with hospital name, logo, and contact info"
                  >
                    ⚙️ System Generated
                  </button>
                  <button
                    type="button"
                    onClick={() => setLetterheadOption('image')}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                      letterheadOption === 'image' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Custom uploaded rectangular letterhead photo"
                  >
                    🖼️ Photo Letterhead
                  </button>
                </div>
              </div>
            )}
          </div>

          {printMode === 'patient_slip' && letterheadOption === 'image' && !hospitalSettings?.letterheadImageUrl && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
              <span>⚠️ No letterhead photo uploaded in Hospital Settings. Showing system-generated header as fallback. You can upload one in Admin &gt; Hospital Settings.</span>
            </div>
          )}

          <div className="overflow-auto border border-gray-200 rounded-xl bg-gray-100 p-3 flex justify-center print:p-0 print:m-0 print:border-none print:bg-transparent" style={{ maxHeight: '650px' }}>
            <div className="bg-white shadow-xl rounded-none border-none overflow-hidden w-full max-w-[210mm] print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-[210mm]">
              <PatientReceipt 
                ref={receiptRef} 
                patient={registeredPatient} 
                mode={printMode} 
                letterheadMode={letterheadOption} 
                hospitalSettings={hospitalSettings} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRegistration;