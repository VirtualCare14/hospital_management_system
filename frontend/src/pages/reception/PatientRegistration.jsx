import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Printer, Save, Search, UserCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import client from '../../api/client';
import PatientReceipt from '../../components/PatientReceipt';
import { formatUhid } from '../../utils/uhid';

const PatientRegistration = () => {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const department = watch('department');
  const doctorId = watch('doctorId');
  const appointmentDate = watch('appointmentDate');
  const allSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
  const freeSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

  // Aadhaar lookup state
  const [aadhaarLookup, setAadhaarLookup] = useState(null);
  const [lookingUpAadhaar, setLookingUpAadhaar] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(false);

  const Field = ({ label, children, className = '' }) => (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  );

  useEffect(() => {
    client.get('/admin/departments').then(({ data }) => {
      const activeDepts = data.filter((dept) => dept.isActive);
      // Add "Same Day Treatment" as a virtual department option
      setDepartments([...activeDepts, { _id: 'sdt', departmentName: 'Same Day Treatment' }]);
    });
  }, []);

  useEffect(() => {
    setValue('doctorId', '');
    setValue('slot', '');
    setBookedSlots([]);

    if (!department) {
      setDoctors([]);
      return;
    }

    // If "Same Day Treatment" department is selected, load all doctors (not filtered by dept)
    if (department === 'Same Day Treatment') {
      client
        .get('/admin/doctors')
        .then(({ data }) => setDoctors(data))
        .catch(() => setDoctors([]));
      return;
    }

    client
      .get(`/admin/doctors?department=${encodeURIComponent(department)}`)
      .then(({ data }) => setDoctors(data))
      .catch(() => setDoctors([]));
  }, [department, setValue]);

  useEffect(() => {
    if (doctorId && appointmentDate) {
      client.get(`/patients/booked-slots?doctorId=${doctorId}&date=${appointmentDate}`).then(({ data }) => setBookedSlots(data));
    } else {
      setBookedSlots([]);
    }
  }, [doctorId, appointmentDate]);

  // Aadhaar lookup handler
  const handleAadhaarBlur = async (e) => {
    const aadhaar = e.target.value?.trim();
    if (!aadhaar || aadhaar.length < 4) {
      setAadhaarLookup(null);
      setIsExistingPatient(false);
      return;
    }

    setLookingUpAadhaar(true);
    try {
      const { data } = await client.get(`/patients/aadhaar/${encodeURIComponent(aadhaar)}`);
      if (data.found && data.patient) {
        setAadhaarLookup(data.patient);
        setIsExistingPatient(true);

        // Auto-fill existing patient details
        setValue('patientName', data.patient.patientName || '');
        setValue('mobile', data.patient.mobile || '');
        setValue('dob', data.patient.dob ? new Date(data.patient.dob).toISOString().split('T')[0] : '');
        setValue('gender', data.patient.gender || '');
        setValue('address', data.patient.address || '');

        const visitCount = data.latestVisit ? `Visit #${(data.latestVisit.visitNumber || 0) + 1} next` : 'First visit';
        toast.success(`Existing patient found! UHID: ${formatUhid(data.patient.uhid)} — ${visitCount}. Details auto-filled.`);
      } else {
        setAadhaarLookup(false);
        setIsExistingPatient(false);
      }
    } catch (err) {
      setAadhaarLookup(false);
      setIsExistingPatient(false);
    } finally {
      setLookingUpAadhaar(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        visitType: data.department === 'Same Day Treatment' ? 'Same Day Treatment' : 'OPD'
      };
      const { data: res } = await client.post('/patients/create', payload);
      toast.success(res.message);
      setRegisteredPatient(res.patient);
      setShowReceipt(true);
      reset();
      setBookedSlots([]);
      setAadhaarLookup(null);
      setIsExistingPatient(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const printReceipt = async () => {
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
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setRegisteredPatient(null);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Patient Registration / EMR</h1>
          <p className="text-sm text-gray-500">Register patients for OPD, IPD, or Same Day Treatment. Aadhaar-based patient lookup with auto UHID generation.</p>
        </div>

        {/* Existing Patient Banner */}
        {isExistingPatient && aadhaarLookup && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <UserCheck className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">
                Existing Patient Found — UHID: {formatUhid(aadhaarLookup.uhid)}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {aadhaarLookup.patientName} • {aadhaarLookup.gender} • {aadhaarLookup.mobile}
                {aadhaarLookup.doctorId?.doctorName && ` • Last Doctor: Dr. ${aadhaarLookup.doctorId.doctorName}`}
              </p>
              <p className="text-xs text-green-700 mt-1 font-semibold">
                Patient details auto-filled. Select visit type, department, doctor, date, and slot.
                {aadhaarLookup.visitNumber > 0 && ` (This will be Visit #${aadhaarLookup.visitNumber + 1})`}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-green-700 hover:bg-green-100 px-2 py-1 rounded"
              onClick={() => {
                setAadhaarLookup(null);
                setIsExistingPatient(false);
                reset();
                setBookedSlots([]);
              }}
            >
              New Patient
            </button>
          </div>
        )}

        {aadhaarLookup === false && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <Search className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              No existing patient found with this Aadhaar. A new UHID will be created.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Patient Name">
            <input className="input" placeholder="Enter patient name" {...register('patientName', { required: true })} />
          </Field>
          <Field label="Mobile Number / WhatsApp">
            <input
              className={`input ${errors.mobile ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter mobile number"
              {...register('mobile', {
                required: 'Mobile number is required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Mobile number must be exactly 10 digits'
                }
              })}
            />
            {errors.mobile && (
              <p className="mt-1 text-xs font-semibold text-red-500">{errors.mobile.message}</p>
            )}
          </Field>
          <Field label="Aadhaar Card Number">
            <div className="relative">
              <input
                className={`input pr-8 ${errors.aadhaar ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter Aadhaar number"
                {...register('aadhaar', {
                  required: 'Aadhaar number is required',
                  pattern: {
                    value: /^\d{12}$/,
                    message: 'Aadhaar number must be exactly 12 digits'
                  }
                })}
                onBlur={handleAadhaarBlur}
                disabled={lookingUpAadhaar}
              />
              {lookingUpAadhaar && (
                <span className="absolute right-3 top-2.5 text-xs text-blue-500 font-bold">Checking...</span>
              )}
            </div>
            {errors.aadhaar && (
              <p className="mt-1 text-xs font-semibold text-red-500">{errors.aadhaar.message}</p>
            )}
          </Field>
          <Field label="Date of Birth">
            <input className="input" type="date" {...register('dob', { required: true })} />
          </Field>
          <Field label="Gender">
            <select className="input" {...register('gender', { required: true })}>
              <option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>

          <Field label="Department">
            <select className="input" {...register('department', { required: true })}>
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.departmentName}>{dept.departmentName}</option>
              ))}
            </select>
          </Field>

          <Field label="Doctor">
            <select className="input" {...register('doctorId', { required: true })}>
              <option value="">Select doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>Dr. {doctor.doctorName || doctor.username}</option>
              ))}
            </select>
          </Field>

          <Field label="Appointment Date">
            <input className="input" type="date" {...register('appointmentDate', { required: true })} />
          </Field>
          <Field label="Free Slots">
            <select className="input" {...register('slot', { required: true })}>
              <option value="">Select free slot</option>
              {freeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </Field>
          <Field label="Weight">
            <input className="input" placeholder="kg" type="number" step="0.1" {...register('weight')} />
          </Field>
          <Field label="Height">
            <input className="input" placeholder="cm" type="number" step="0.1" {...register('height')} />
          </Field>
          <Field label="Blood Pressure">
            <input className="input" placeholder="Example: 120/80" {...register('bloodPressure')} />
          </Field>
          <Field label="Body Temperature (°C)">
            <input className="input" placeholder="°C" type="number" step="0.1" {...register('temperature')} />
          </Field>
          <Field label="Address" className="md:col-span-2 xl:col-span-3">
            <textarea className="input min-h-24" placeholder="Enter full address" {...register('address', { required: true })} />
          </Field>
        </div>

        {Object.keys(errors).length > 0 && <p className="text-sm font-semibold text-red-500">Please complete all required fields.</p>}
        <button className="btn" type="submit">
          <Save className="h-4 w-4" /> {isExistingPatient ? 'Register New Visit' : 'Register Patient'}
        </button>
      </form>

      {/* Receipt Preview and Print */}
      {showReceipt && registeredPatient && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800">Patient Registered Successfully</h2>
              <p className="text-sm text-gray-500">
                UHID: {formatUhid(registeredPatient.uhid)} | Reg#: {registeredPatient.registrationNumber || 'N/A'}
              </p>
              {registeredPatient.appointmentNumber && (
                <p className="text-xs text-gray-400">
                  Appointment #: {registeredPatient.appointmentNumber}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={printReceipt}><Printer className="h-4 w-4" /> Print Receipt</button>
              <button className="btn-secondary" onClick={closeReceipt}>Close</button>
            </div>
          </div>

          {/* Hidden receipt for printing */}
          <div className="overflow-auto border border-gray-200 rounded-xl" style={{ maxHeight: '600px' }}>
            <PatientReceipt ref={receiptRef} patient={registeredPatient} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRegistration;