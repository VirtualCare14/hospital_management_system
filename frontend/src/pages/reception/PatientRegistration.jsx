import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Printer, Save, Search, UserCheck, Clock, User, Phone, CreditCard,
  Calendar, MapPin, Building2, Stethoscope, IndianRupee, Tag, Wallet,
  CheckCircle2, Activity, ChevronDown, ChevronUp, Check, Users, Coins, Eye, History, X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import client from '../../api/client';
import PatientReceipt from '../../components/PatientReceipt';
import SkeletonInput from '../../components/Skeleton/SkeletonInput';
import { formatUhid } from '../../utils/uhid';
import { generateTimeSlots, filterSlotsForDate } from '../../utils/timeSlots';

const Field = ({ label, required = false, icon: Icon, children, className = '', error, hint }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="flex items-center justify-between">
      <label className="block text-[15px] font-extrabold text-gray-900 tracking-wide">
        {label}
        {required && <span className="text-red-600 font-black ml-1 text-base">*</span>}
      </label>
      {hint && <div>{hint}</div>}
    </div>
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-gray-500 stroke-[2]" />
        </div>
      )}
      {children}
    </div>
    {error && <p className="text-xs font-bold text-red-600 mt-1">{error}</p>}
  </div>
);

const PatientRegistration = () => {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const receiptRef = useRef(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const department = watch('department');
  const doctorId = watch('doctorId');
  const appointmentDate = watch('appointmentDate');
  const mobileValue = watch('mobile') || '';
  const aadhaarValue = watch('aadhaar') || '';

  const isMobileValid = /^\d{10}$/.test(mobileValue.trim());
  const isAadhaarValid = /^\d{12}$/.test(aadhaarValue.trim());

  // Auto-pick today's date on component mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!watch('appointmentDate')) {
      setValue('appointmentDate', today);
    }
  }, [setValue, watch]);

  useEffect(() => {
    setDepartmentsLoading(true);
    client.get('/admin/departments')
      .then(({ data }) => {
        const activeDepts = data.filter((dept) => dept.isActive);
        setDepartments(activeDepts);
      })
      .catch(() => {})
      .finally(() => setDepartmentsLoading(false));
  }, []);

  useEffect(() => {
    setValue('doctorId', '');
    setValue('slot', '');
    setBookedSlots([]);

    if (!department) {
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
  }, [department, setValue]);

  useEffect(() => {
    if (doctorId && appointmentDate) {
      client.get(`/patients/booked-slots?doctorId=${doctorId}&date=${appointmentDate}`)
        .then(({ data }) => setBookedSlots(data))
        .catch(() => setBookedSlots([]));
    } else {
      setBookedSlots([]);
    }
  }, [doctorId, appointmentDate]);

  const selectedDoctorObj = doctors.find((d) => d._id === doctorId);

  let freeSlots = [];
  let doctorAvailabilityStatus = '';

  if (selectedDoctorObj && appointmentDate) {
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
        if (data.patient.dob) setValue('dob', new Date(data.patient.dob).toISOString().split('T')[0]);
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
      const tempVal = parseFloat(data.temperature);
      const grossFee = parseFloat(data.opdFee) || 0;
      const discType = data.discountType || 'none';
      const discVal = parseFloat(data.discountValue) || 0;

      const payload = {
        ...data,
        opdFee: grossFee,
        discountType: discType,
        discountValue: discVal,
        paymentStatus: data.paymentStatus || 'Paid',
        paymentMode: data.paymentStatus === 'Not Paid' ? 'Pending' : (data.paymentMode || 'Cash'),
        visitType: (data.department && data.department.toLowerCase().trim() === 'same day care') ? 'Same Day Treatment' : 'OPD',
        temperature: !isNaN(tempVal) ? ((tempVal - 32) * 5 / 9).toFixed(1) : undefined
      };
      const { data: res } = await client.post('/patients/create', payload);
      toast.success(res.message);
      setRegisteredPatient(res.patient);
      setShowReceipt(true);
      reset();
      const today = new Date().toISOString().split('T')[0];
      setValue('appointmentDate', today);
      setBookedSlots([]);
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
        window.open(pdf.output('bloburl'), '_blank');
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
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6 bg-white shadow-md rounded-2xl border border-gray-200 w-full">
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
                  className={`input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.patientName ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                  className={`input h-11 pl-11 pr-10 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.mobile ? 'border-red-500 focus:ring-red-500' : isMobileValid ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30' : ''}`}
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
                  className={`input h-11 pl-11 pr-10 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${errors.aadhaar ? 'border-red-500 focus:ring-red-500' : isAadhaarValid ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30' : ''}`}
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

              {/* Gender & DOB Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Gender" required icon={Users} error={errors.gender?.message}>
                  <select className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('gender', { required: 'Gender is required' })}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field label="Date of Birth" required icon={Calendar} error={errors.dob?.message}>
                  <input
                    className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                    type="date"
                    {...register('dob', { required: 'Date of birth is required' })}
                  />
                </Field>
              </div>

              {/* Address */}
              <Field label="Address" icon={MapPin} error={errors.address?.message}>
                <textarea
                  className="input pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 min-h-20 shadow-2xs"
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

              {/* Department */}
              <Field label="Department" required icon={Building2} error={errors.department?.message}>
                {departmentsLoading ? (
                  <SkeletonInput />
                ) : (
                  <select className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('department', { required: 'Department is required' })}>
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept.departmentName}>{dept.departmentName}</option>
                    ))}
                  </select>
                )}
              </Field>

              {/* Doctor / Same Day Care (word staff removed) */}
              <Field label="Doctor / Same Day Care" required icon={Stethoscope} error={errors.doctorId?.message}>
                {doctorsLoading ? (
                  <SkeletonInput />
                ) : (
                  <select className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('doctorId', { required: 'Doctor / Provider selection is required' })}>
                    <option value="">Select doctor / care provider</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.role === 'nursing' ? '' : 'Dr. '}{doc.doctorName || doc.username} {doc.role === 'nursing' ? '(Same Day Care)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {/* Appointment Date (Auto-picked today's date) */}
              <Field label="Appointment Date" required icon={Calendar} error={errors.appointmentDate?.message}>
                <input
                  className="input h-11 pl-11 text-base font-bold text-gray-900 border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  type="date"
                  {...register('appointmentDate', { required: 'Appointment date is required' })}
                />
              </Field>

              {/* Free Available Slots */}
              <Field label="Free Available Slots" required icon={Clock} error={errors.slot?.message}>
                <select 
                  className={`input h-11 pl-11 text-base font-bold border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${doctorAvailabilityStatus ? 'border-red-500 text-red-600' : 'text-gray-900'}`} 
                  {...register('slot', { required: 'Slot selection is required' })}
                >
                  <option value="">
                    {!doctorId || !appointmentDate
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
                  className="input h-11 pl-11 text-base font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
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
                  <select className="input h-11 pl-11 text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('discountType')}>
                    <option value="none">No Discount</option>
                    <option value="amount">Rupees (₹)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </Field>

                {discountTypeVal !== 'none' ? (
                  <Field label={discountTypeVal === 'percent' ? "Value (%)" : "Value (₹)"} icon={Tag}>
                    <input
                      className="input h-11 pl-11 text-base font-bold border-amber-400 focus:ring-amber-500 text-amber-950 bg-white shadow-2xs"
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
                      <input className="input h-11 pl-11 text-sm bg-gray-100" placeholder="Disabled" disabled />
                    </Field>
                  </div>
                )}
              </div>

              {/* Payment Status & Payment Mode Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Payment Status" icon={Wallet}>
                  <select className={`input h-11 pl-11 text-sm font-extrabold bg-white cursor-pointer border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 shadow-2xs ${paymentStatusVal === 'Not Paid' ? 'text-red-600 border-red-400' : 'text-emerald-700 border-emerald-400'}`} {...register('paymentStatus')}>
                    <option value="Paid">Paid</option>
                    <option value="Not Paid">Not Paid</option>
                  </select>
                </Field>

                {paymentStatusVal === 'Paid' ? (
                  <Field label="Payment Mode" icon={Wallet}>
                    <select className="input h-11 pl-11 text-sm font-bold text-gray-900 bg-white border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs" {...register('paymentMode')}>
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
                      <input className="input h-11 pl-11 text-sm bg-gray-100" placeholder="Pending" disabled />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-4 p-4 bg-gray-50 border border-gray-300 rounded-xl">
              <Field label="Weight (kg)" icon={Activity}>
                <input className="input h-11 pl-11 text-base font-bold text-gray-900" placeholder="kg" type="number" step="0.1" {...register('weight')} />
              </Field>
              <Field label="Height (cm)" icon={Activity}>
                <input className="input h-11 pl-11 text-base font-bold text-gray-900" placeholder="cm" type="number" step="0.1" {...register('height')} />
              </Field>
              <Field label="Blood Pressure" icon={Activity}>
                <input className="input h-11 pl-11 text-base font-bold text-gray-900" placeholder="120/80" {...register('bloodPressure')} />
              </Field>
              <Field label="Temperature (°F)" icon={Activity}>
                <input className="input h-11 pl-11 text-base font-bold text-gray-900" placeholder="98.6" type="number" step="0.1" {...register('temperature')} />
              </Field>
            </div>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="text-xs font-black text-red-600">Please fill out all mandatory fields marked with red asterisks (*).</p>
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
        <div className="card p-5 space-y-4 border-2 border-indigo-100 bg-white rounded-2xl shadow-xl">
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
                className="btn-secondary cursor-pointer text-xs px-3 py-2 text-gray-500 hover:text-gray-700 rounded-lg"
                onClick={closeReceipt}
              >
                Done
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Document Preview Mode</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPrintMode('patient_slip')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printMode === 'patient_slip' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Patient Slip Preview
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('bill_receipt')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printMode === 'bill_receipt' ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bill Receipt Preview
              </button>
            </div>
          </div>

          <div className="overflow-auto border border-gray-200 rounded-xl bg-gray-100 p-3" style={{ maxHeight: '650px' }}>
            <PatientReceipt ref={receiptRef} patient={registeredPatient} mode={printMode} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRegistration;