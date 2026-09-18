'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Printer, Save, Search, UserCheck, Clock, User, Phone, CreditCard,
  Calendar, MapPin, Building2, Stethoscope, IndianRupee, Tag, Wallet,
  CheckCircle2, Activity, ChevronDown, ChevronUp, Check, Users, Coins, Eye, History, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { formatUhid } from '@/lib/utils/uhid';
import { generateTimeSlots, filterSlotsForDate } from '@/lib/utils/timeSlots';
import PrintOpdSlipModal from '../common/PrintOpdSlipModal';

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

export default function RegisterPatientView({ onNavigate }) {
  const [formData, setFormData] = useState({
    patientName: '',
    mobile: '',
    aadhaar: '',
    dob: '',
    gender: 'Male',
    address: '',
    category: 'General',
    department: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    slot: '',
    opdFee: 0,
    discountType: 'none',
    discountValue: 0,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    // Vitals
    height: '',
    weight: '',
    bloodPressure: '',
    temperature: ''
  });

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showVitals, setShowVitals] = useState(false);

  // Existing Patient Lookup state
  const [existingPatientData, setExistingPatientData] = useState(null);
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [patientDuesData, setPatientDuesData] = useState(null);
  const [showDuesModal, setShowDuesModal] = useState(false);

  // Registration Result / Slip
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const mobileValue = formData.mobile || '';
  const aadhaarValue = formData.aadhaar || '';
  const isMobileValid = /^\d{10}$/.test(mobileValue.trim());
  const isAadhaarValid = /^\d{12}$/.test(aadhaarValue.trim());

  // Load Departments
  useEffect(() => {
    setDepartmentsLoading(true);
    apiRequest('/admin/departments')
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data.filter((dept) => dept.isActive !== false));
        }
      })
      .catch(() => {})
      .finally(() => setDepartmentsLoading(false));
  }, []);

  // Load Doctors when Department changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, doctorId: '', slot: '' }));
    setBookedSlots([]);

    if (!formData.department) {
      setDoctors([]);
      return;
    }

    setDoctorsLoading(true);
    apiRequest(`/admin/doctors?department=${encodeURIComponent(formData.department)}`)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDoctors(data);
        } else {
          apiRequest('/admin/doctors')
            .then((all) => setDoctors(Array.isArray(all) ? all : []))
            .catch(() => setDoctors([]));
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, [formData.department]);

  // Load Booked Slots
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      apiRequest(`/patients/booked-slots?doctorId=${formData.doctorId}&date=${formData.appointmentDate}`)
        .then((data) => setBookedSlots(Array.isArray(data) ? data : []))
        .catch(() => setBookedSlots([]));
    } else {
      setBookedSlots([]);
    }
  }, [formData.doctorId, formData.appointmentDate]);

  const selectedDoctorObj = doctors.find((d) => d._id === formData.doctorId);

  // Calculate free slots
  let freeSlots = [];
  let doctorAvailabilityStatus = '';

  if (selectedDoctorObj && formData.appointmentDate) {
    const [year, month, day] = formData.appointmentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysList[dateObj.getDay()];

    const userSlots = selectedDoctorObj.availableSlots || [];
    const gap = selectedDoctorObj.slotGap || 10;

    const dayConfig = userSlots.find((s) => s.day?.toLowerCase() === dayName.toLowerCase());

    if (dayConfig) {
      if (!dayConfig.isAvailable) {
        doctorAvailabilityStatus = `${selectedDoctorObj.doctorName || selectedDoctorObj.username} is unavailable on ${dayName}s`;
      } else {
        const generated = generateTimeSlots(dayConfig.startTime || '09:00', dayConfig.endTime || '18:00', gap);
        const filteredForDate = filterSlotsForDate(generated, formData.appointmentDate);
        freeSlots = filteredForDate.filter((slot) => !bookedSlots.includes(slot));
      }
    } else {
      const generated = generateTimeSlots('09:00', '18:00', gap);
      const filteredForDate = filterSlotsForDate(generated, formData.appointmentDate);
      freeSlots = filteredForDate.filter((slot) => !bookedSlots.includes(slot));
    }
  }

  // Set default fee when doctor selected
  useEffect(() => {
    if (selectedDoctorObj && selectedDoctorObj.opdFees !== undefined) {
      setFormData((prev) => ({ ...prev, opdFee: selectedDoctorObj.opdFees || 0 }));
    }
  }, [selectedDoctorObj]);

  const fetchPatientDues = async (uhid) => {
    try {
      const data = await apiRequest(`/billing/patient-dues/${uhid}`);
      setPatientDuesData(data);
    } catch {
      setPatientDuesData(null);
    }
  };

  const performLookup = async (params) => {
    setLookingUp(true);
    setPatientDuesData(null);
    try {
      const queryStr = new URLSearchParams(params).toString();
      const data = await apiRequest(`/patients/lookup?${queryStr}`);
      if (data?.found && data?.patient) {
        setExistingPatientData(data.patient);
        setIsExistingPatient(true);
        setFormData((prev) => ({
          ...prev,
          patientName: data.patient.patientName || prev.patientName,
          mobile: data.patient.mobile || prev.mobile,
          aadhaar: data.patient.aadhaar || prev.aadhaar,
          dob: data.patient.dob ? new Date(data.patient.dob).toISOString().split('T')[0] : prev.dob,
          gender: data.patient.gender || prev.gender,
          address: data.patient.address || prev.address,
          category: data.patient.category || prev.category
        }));

        if (data.patient.uhid) {
          fetchPatientDues(data.patient.uhid);
        }
        toast.success(`Found existing patient record (${data.patient.patientName})`);
      } else {
        setExistingPatientData(false);
        setIsExistingPatient(false);
      }
    } catch (err) {
      console.error('Patient lookup error:', err);
    } finally {
      setLookingUp(false);
    }
  };

  const handleMobileBlur = () => {
    if (isMobileValid && !isExistingPatient) {
      performLookup({ mobile: mobileValue.trim() });
    }
  };

  const handleAadhaarBlur = () => {
    if (isAadhaarValid && !isExistingPatient) {
      performLookup({ aadhaar: aadhaarValue.trim() });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fee Calculations
  const grossFee = Math.max(0, Number(formData.opdFee) || 0);
  const discountVal = Math.max(0, Number(formData.discountValue) || 0);
  let discountAmount = 0;
  if (formData.discountType === 'percent') {
    discountAmount = Number(((grossFee * Math.min(100, discountVal)) / 100).toFixed(2));
  } else if (formData.discountType === 'amount') {
    discountAmount = Math.min(grossFee, discountVal);
  }
  const netPayable = Math.max(0, Number((grossFee - discountAmount).toFixed(2)));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientName?.trim()) {
      toast.error('Patient Name is required');
      return;
    }
    if (!isMobileValid) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (formData.aadhaar && !isAadhaarValid) {
      toast.error('Aadhaar number must be exactly 12 digits');
      return;
    }
    if (!formData.gender) {
      toast.error('Gender is required');
      return;
    }
    if (!formData.dob) {
      toast.error('Date of Birth is required');
      return;
    }
    if (!formData.department) {
      toast.error('Department is required');
      return;
    }
    if (!formData.doctorId) {
      toast.error('Doctor selection is required');
      return;
    }
    if (!formData.appointmentDate) {
      toast.error('Appointment Date is required');
      return;
    }
    if (!formData.slot) {
      toast.error('Slot selection is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientName: formData.patientName.trim(),
        mobile: formData.mobile.trim(),
        aadhaar: formData.aadhaar?.trim() || undefined,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address?.trim() || 'Not specified',
        category: formData.category || 'General',
        department: formData.department,
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        slot: formData.slot,
        opdFee: grossFee,
        discountType: formData.discountType,
        discountValue: discountVal,
        paymentStatus: formData.paymentStatus,
        paymentMode: formData.paymentStatus === 'Not Paid' ? 'Pending' : formData.paymentMode,
        // Vitals
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        bloodPressure: formData.bloodPressure?.trim() || undefined,
        temperature: formData.temperature ? Number(formData.temperature) : undefined
      };

      const res = await apiRequest('/patients/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast.success(isExistingPatient ? 'Visit registered successfully!' : 'New patient registered successfully!');

      setRegisteredPatient(res);
      setShowReceipt(true);
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setExistingPatientData(null);
    setIsExistingPatient(false);
    setPatientDuesData(null);
    setRegisteredPatient(null);
    setShowReceipt(false);
    setFormData({
      patientName: '',
      mobile: '',
      aadhaar: '',
      dob: '',
      gender: 'Male',
      address: '',
      category: 'General',
      department: '',
      doctorId: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      slot: '',
      opdFee: 0,
      discountType: 'none',
      discountValue: 0,
      paymentStatus: 'Paid',
      paymentMode: 'Cash',
      height: '',
      weight: '',
      bloodPressure: '',
      temperature: ''
    });
    setBookedSlots([]);
  };

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleSubmit} className="card p-6 space-y-6 bg-white shadow-md rounded-2xl border border-gray-200 w-full">
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
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-extrabold text-green-800 hover:bg-green-100 px-3.5 py-2 rounded-lg transition-colors cursor-pointer border border-green-400 bg-white"
              onClick={handleResetForm}
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
            <div className="card w-full max-w-2xl p-6 space-y-5 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-red-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">Patient Due Breakdown & History</h3>
                    <p className="text-xs text-gray-500">
                      UHID: {formatUhid(patientDuesData.patient?.uhid)} • {patientDuesData.patient?.patientName}
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

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">Total Due Amount Left</span>
                  <h4 className="text-2xl font-black text-red-700">₹{patientDuesData.totalDueAmount.toFixed(2)}</h4>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 font-extrabold text-xs rounded-lg border border-red-300">
                  {patientDuesData.bills?.length || 0} Pending Invoice{patientDuesData.bills?.length > 1 ? 's' : ''}
                </span>
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

        {/* Full Width 3-Column Layout matching Medora 1:1 */}
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
              <Field label="Patient Name" required icon={User}>
                <input
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  placeholder="Enter patient full name"
                  required
                />
              </Field>

              {/* Phone Number with 10-digit counter badge */}
              <Field
                label="Phone Number"
                required
                icon={Phone}
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
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className={`input h-11 pl-9 pr-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${isMobileValid ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30' : ''}`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  onBlur={handleMobileBlur}
                  required
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
                  name="aadhaar"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  className={`input h-11 pl-9 pr-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${isAadhaarValid ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30' : ''}`}
                  placeholder="Enter 12-digit Aadhaar number"
                  maxLength={12}
                  onBlur={handleAadhaarBlur}
                  disabled={lookingUp}
                />
                {isAadhaarValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 stroke-[2] h-5 w-5 pointer-events-none" />
                )}
              </Field>

              {/* Gender & DOB Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Gender" required icon={Users}>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Date of Birth" required icon={Calendar}>
                  <input
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="input h-11 pl-9 pr-1 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                    type="date"
                    required
                  />
                </Field>
              </div>

              {/* Address */}
              <Field label="Address" icon={MapPin}>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input pl-9 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 min-h-20 shadow-2xs"
                  placeholder="Enter full address"
                  rows={2}
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

              {/* Department */}
              <Field label="Department" required icon={Building2}>
                {departmentsLoading ? (
                  <div className="h-11 bg-gray-200 animate-pulse rounded-xl" />
                ) : (
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept.departmentName}>{dept.departmentName}</option>
                    ))}
                  </select>
                )}
              </Field>

              {/* Doctor */}
              <Field label="Doctor" required icon={Stethoscope}>
                {doctorsLoading ? (
                  <div className="h-11 bg-gray-200 animate-pulse rounded-xl" />
                ) : (
                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                    required
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.role === 'nursing' ? '' : 'Dr. '}{doc.doctorName || doc.username}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {/* Appointment Date */}
              <Field label="Appointment Date" required icon={Calendar}>
                <input
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className="input h-11 pl-9 pr-1 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  type="date"
                  required
                />
              </Field>

              {/* Free Available Slots */}
              <Field label="Free Available Slots" required icon={Clock}>
                <select
                  name="slot"
                  value={formData.slot}
                  onChange={handleChange}
                  className={`input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${doctorAvailabilityStatus ? 'border-red-500 text-red-600' : 'text-gray-900'}`}
                  required
                >
                  <option value="">
                    {!formData.doctorId || !formData.appointmentDate
                      ? 'Select doctor & date first'
                      : doctorAvailabilityStatus
                        ? doctorAvailabilityStatus
                        : freeSlots.length === 0
                          ? 'No free slots available for this date/time'
                          : `Select free slot (${freeSlots.length} available)`}
                  </option>
                  {freeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </Field>
              {doctorAvailabilityStatus && (
                <p className="text-xs font-black text-red-600 mt-1">{doctorAvailabilityStatus}</p>
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
                {selectedDoctorObj && selectedDoctorObj.opdFees > 0 && (
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md">
                    Admin Fee: ₹{selectedDoctorObj.opdFees}
                  </span>
                )}
              </div>

              {/* OPD Fee */}
              <Field label="OPD Fee (₹)" icon={IndianRupee}>
                <input
                  name="opdFee"
                  value={formData.opdFee}
                  onChange={handleChange}
                  className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  placeholder="0"
                  type="number"
                  min="0"
                  step="1"
                />
              </Field>

              {/* Discount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Discount Type" icon={Tag}>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="none">No Discount</option>
                    <option value="percent">Percentage (%)</option>
                    <option value="amount">Fixed Amount (₹)</option>
                  </select>
                </Field>

                <Field label="Discount Value" icon={Tag}>
                  <input
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    disabled={formData.discountType === 'none'}
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 shadow-2xs"
                    type="number"
                    min="0"
                    placeholder="0"
                  />
                </Field>
              </div>

              {/* Net Payable Badge */}
              <div className="p-3.5 bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-xl shadow-inner border border-indigo-950 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 block">
                    Net OPD Amount Payable:
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-2xl font-black text-amber-400">₹{netPayable.toFixed(2)}</span>
                  </div>
                </div>
                {discountAmount > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-300 block">Saved Discount</span>
                    <span className="text-xs font-black text-emerald-400">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Payment Status & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Payment Status" required icon={Wallet}>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Not Paid">Not Paid</option>
                  </select>
                </Field>

                <Field label="Payment Mode" required icon={Wallet}>
                  <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleChange}
                    disabled={formData.paymentStatus === 'Not Paid'}
                    className="input h-11 pl-9 pr-2 text-xs sm:text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer shadow-2xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </div>

        {/* Vitals Accordion Section */}
        <div className="border border-gray-300 rounded-2xl overflow-hidden bg-gray-50/50 shadow-2xs">
          <button
            type="button"
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-100/80 transition-colors cursor-pointer"
            onClick={() => setShowVitals(!showVitals)}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-indigo-700 stroke-[2]" />
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                Patient Vitals & Measurements (Optional)
              </span>
            </div>
            {showVitals ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
          </button>

          {showVitals && (
            <div className="p-5 border-t border-gray-300 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white">
              <Field label="Height (cm)">
                <input
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="input h-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  placeholder="e.g. 170"
                  type="number"
                  min="0"
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input h-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  placeholder="e.g. 65"
                  type="number"
                  min="0"
                />
              </Field>
              <Field label="Blood Pressure">
                <input
                  name="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={handleChange}
                  className="input h-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  placeholder="120/80"
                />
              </Field>
              <Field label="Temperature (°F)">
                <input
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="input h-10 text-xs sm:text-sm font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  placeholder="98.6"
                  type="number"
                  step="0.1"
                />
              </Field>
            </div>
          )}
        </div>

        {/* Submit & Reset Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleResetForm}
            className="btn-secondary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Reset Form
          </button>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('reception/patient-list')}
                className="btn-secondary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="h-4 w-4" /> View Patient List
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn w-full sm:w-auto px-8 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <Save className="h-4 w-4" />
              {submitting ? 'Registering...' : 'Register Patient & Generate Slip'}
            </button>
          </div>
        </div>
      </form>

      {/* Slip Modal */}
      {showReceipt && registeredPatient && (
        <PrintOpdSlipModal
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            handleResetForm();
          }}
          data={registeredPatient}
        />
      )}
    </div>
  );
}
