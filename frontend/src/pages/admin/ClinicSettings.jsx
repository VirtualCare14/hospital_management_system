import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Stethoscope,
  KeyRound,
  User,
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Loader2,
  Building2,
  IndianRupee,
  Phone,
  Award,
  UserCheck
} from 'lucide-react';
import client from '../../api/client';
import SkeletonCard from '../../components/Skeleton/SkeletonCard';

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const ClinicSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedSettings, setSavedSettings] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      department: 'Clinic',
      doctorName: '',
      opdFees: '',
      specialization: '',
      mobile: '',
      clinicLoginId: '',
      clinicPassword: '',
      isActive: true
    }
  });

  const clinicPasswordWatch = watch('clinicPassword');
  const watchedDoctorName = watch('doctorName');
  const watchedDepartment = watch('department');
  const watchedOpdFees = watch('opdFees');
  const watchedSpecialization = watch('specialization');
  const watchedMobile = watch('mobile');

  const loadDepartments = async () => {
    setLoadingDepts(true);
    try {
      const { data } = await client.get('/admin/departments');
      if (Array.isArray(data)) {
        setDepartments(data.filter((d) => d.isActive !== false));
      }
    } catch (err) {
      console.warn('Failed to load departments', err);
    } finally {
      setLoadingDepts(false);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/admin/clinic-settings');
      if (data.enabled) {
        setEnabled(true);
        if (data.data) {
          setSavedSettings(data.data);
          reset({
            department: data.data.department || 'Clinic',
            doctorName: data.data.doctorName || data.data.clinicName || '',
            opdFees: data.data.opdFees !== undefined && data.data.opdFees !== null ? data.data.opdFees : 0,
            specialization: data.data.specialization || '',
            mobile: data.data.mobile || '',
            clinicLoginId: data.data.clinicLoginId || '',
            clinicPassword: data.data.clinicPassword || '',
            isActive: data.data.isActive !== undefined ? data.data.isActive : true
          });
        }
      } else {
        setEnabled(false);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setEnabled(false);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load clinic settings');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadDepartments();
  }, []);

  const copyToClipboard = async (text, fieldName) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleGeneratePassword = () => {
    const newPass = generateRandomPassword();
    setValue('clinicPassword', newPass, { shouldDirty: true });
    setShowPassword(true);
    toast.success('Generated new secure password!');
  };

  const onSubmit = async (formData) => {
    const payload = {
      department: formData.department?.trim() || 'Clinic',
      doctorName: formData.doctorName?.trim() || '',
      opdFees: Number(formData.opdFees) || 0,
      specialization: formData.specialization?.trim() || '',
      mobile: formData.mobile?.trim() || '',
      clinicLoginId: formData.clinicLoginId?.trim().toLowerCase(),
      clinicPassword: formData.clinicPassword,
      isActive: Boolean(formData.isActive)
    };

    if (!payload.doctorName) {
      toast.error('Please enter the Doctor Name');
      return;
    }

    if (!payload.clinicLoginId) {
      toast.error('Please provide a Clinic Login ID');
      return;
    }

    if (!payload.clinicPassword) {
      toast.error('Please set a password for the Clinic Portal');
      return;
    }

    setSaving(true);
    try {
      const { data } = await client.post('/admin/clinic-settings', payload);
      toast.success(data.message || 'Clinic portal and doctor settings saved successfully');
      setSavedSettings(data.data);
      loadSettings();
      loadDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save clinic settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <SkeletonCard className="w-full h-32" />
        <SkeletonCard className="w-full h-80" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="card p-8 text-center border border-amber-200 bg-amber-50/50 rounded-3xl space-y-4 shadow-sm">
          <div className="h-16 w-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Clinic Settings Disabled</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Clinic Settings and Portal Login configuration are currently not enabled for this hospital.
            Please request your Super Administrator to check <strong>"Allow Clinic Setting"</strong> in the Super Admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Combine fetched departments with 'Clinic' ensuring uniqueness
  const deptList = Array.from(
    new Set(['Clinic', ...departments.map((d) => d.departmentName)])
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Stethoscope className="h-6 w-6 text-white" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">Clinic Portal & Doctor Settings</h1>
          </div>
          <p className="text-xs sm:text-sm text-orange-100 font-medium">
            Configure the department doctor, OPD consultation fees, and official credentials for Clinic Portal access.
          </p>
        </div>
        <div className="bg-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/20 backdrop-blur-xs shrink-0 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${savedSettings?.isActive !== false ? 'bg-emerald-300' : 'bg-rose-300'}`}></span>
          Status: {savedSettings?.isActive !== false ? 'Active' : 'Disabled'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Doctor & Department Configuration Card */}
            <div className="card p-6 border border-orange-100 shadow-sm rounded-3xl bg-white space-y-5">
              <div className="border-b border-orange-100 pb-3 flex items-center justify-between">
                <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-orange-500" /> Department Doctor & OPD Fees
                </h2>
                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                  Doctor Profile
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
                    <select
                      className="input pl-10 font-bold text-xs bg-white cursor-pointer"
                      {...register('department', { required: true })}
                    >
                      {deptList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept} {dept.toLowerCase() === 'clinic' ? '(Clinic Department)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Select <strong>Clinic</strong> department to assign this doctor and OPD fees to the clinic desk.
                  </p>
                </div>

                {/* Doctor Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Doctor / Consultant Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Sarah Jenkins, MBBS, MD"
                      className="input pl-10 font-bold text-xs"
                      {...register('doctorName', { required: true })}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Name displayed on patient registration, prescriptions, OPD receipts, and clinic consultation.
                  </p>
                </div>

                {/* OPD Fees */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    OPD Consultation Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      placeholder="e.g. 500"
                      className="input pl-10 font-bold text-xs"
                      {...register('opdFees', { required: true, min: 0 })}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Auto-populates when this doctor or Clinic department is selected during patient registration.
                  </p>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Specialization / Designation
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
                    <input
                      type="text"
                      placeholder="e.g. General Physician / Consultant"
                      className="input pl-10 font-medium text-xs"
                      {...register('specialization')}
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Contact Mobile Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      className="input pl-10 font-mono text-xs"
                      {...register('mobile')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Clinic Portal Credentials Card */}
            <div className="card p-6 border border-orange-100 shadow-sm rounded-3xl bg-white space-y-5">
              <div className="border-b border-orange-100 pb-3 flex items-center justify-between">
                <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-orange-500" /> Clinic Portal Credentials & Access
                </h2>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  Portal Login
                </span>
              </div>

              {/* Clinic Login ID */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Clinic Portal Login ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. clinic_doctor or dr_jenkins"
                    className="input pl-10 font-mono font-bold text-xs lowercase"
                    {...register('clinicLoginId', { required: true })}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">This ID will be used to authenticate on the Clinic Portal login page.</p>
              </div>

              {/* Clinic Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Clinic Portal Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Sparkles className="h-3 w-3" /> Generate Password
                  </button>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-orange-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter secure password"
                    className="input pl-10 pr-20 font-mono text-xs font-bold"
                    {...register('clinicPassword', { required: true })}
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {clinicPasswordWatch && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(clinicPasswordWatch, 'Password')}
                        className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg transition cursor-pointer"
                        title="Copy password"
                      >
                        {copiedField === 'Password' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Portal Access Toggle */}
              <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-gray-800">Clinic Portal Access Status</span>
                  <span className="text-[11px] text-gray-500">Enable or disable login access for clinic doctor and staff</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...register('isActive')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn text-xs py-2.5 px-6 flex items-center gap-2 cursor-pointer font-bold shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving Configuration...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Clinic Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Summary & Status Card */}
        <div className="space-y-5">
          {/* Active Doctor & Credentials Card */}
          <div className="card p-5 border border-orange-100 shadow-sm rounded-3xl bg-gradient-to-br from-white to-orange-50/30 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Active Clinic Overview
            </h3>

            {/* Doctor Profile Snapshot */}
            <div className="bg-white p-4 rounded-2xl border border-orange-100 space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Doctor / Consultant</span>
                  <p className="font-extrabold text-gray-900 text-sm">
                    {savedSettings?.doctorName || savedSettings?.clinicName || watchedDoctorName || 'Not Set'}
                  </p>
                  {(savedSettings?.specialization || watchedSpecialization) && (
                    <p className="text-[11px] text-gray-500 font-medium">
                      {savedSettings?.specialization || watchedSpecialization}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">OPD Fee</span>
                  <span className="inline-flex items-center text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    ₹{savedSettings?.opdFees !== undefined ? savedSettings.opdFees : (watchedOpdFees || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Department</span>
                  <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-orange-100">
                    {savedSettings?.department || watchedDepartment || 'Clinic'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Doctor Contact</span>
                  <span className="font-mono text-gray-700 font-semibold mt-0.5 inline-block">
                    {savedSettings?.mobile || watchedMobile || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Credentials Snapshot */}
            {savedSettings?.clinicLoginId ? (
              <div className="space-y-2.5">
                <div className="bg-white p-3 rounded-2xl border border-orange-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Portal Login ID</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900 text-xs">{savedSettings.clinicLoginId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(savedSettings.clinicLoginId, 'Login ID')}
                      className="p-1 text-gray-400 hover:text-orange-600 transition cursor-pointer"
                      title="Copy Login ID"
                    >
                      {copiedField === 'Login ID' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-orange-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Portal Password</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900 text-xs">
                      {showPassword ? savedSettings.clinicPassword : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(savedSettings.clinicPassword, 'Password')}
                      className="p-1 text-gray-400 hover:text-orange-600 transition cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedField === 'Password' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {savedSettings.updatedAt && (
                  <p className="text-[10px] text-gray-400 text-center font-medium pt-1">
                    Last synchronized: {new Date(savedSettings.updatedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-400 text-xs">
                <p>No credentials configured yet.</p>
              </div>
            )}
          </div>

          {/* Helper / Guidelines Card */}
          <div className="card p-5 border border-orange-100/60 rounded-3xl bg-orange-50/20 text-xs text-gray-600 space-y-2">
            <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-orange-500" /> How Clinic Doctor & Fees Work
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-gray-500">
              <li>When receptionist or staff selects department <strong>Clinic</strong>, this doctor appears with their configured OPD fees.</li>
              <li>OPD fee automatically calculates in Patient Registration and OPD billing desks.</li>
              <li>The Clinic Portal allows the assigned doctor or clinic staff to conduct consultations and generate digital Rx prescriptions.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicSettings;

