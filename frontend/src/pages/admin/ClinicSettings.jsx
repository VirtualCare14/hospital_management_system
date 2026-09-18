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
  Loader2
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

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      clinicLoginId: '',
      clinicPassword: '',
      isActive: true
    }
  });

  const clinicPasswordWatch = watch('clinicPassword');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/admin/clinic-settings');
      if (data.enabled) {
        setEnabled(true);
        if (data.data) {
          setSavedSettings(data.data);
          reset({
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
      clinicLoginId: formData.clinicLoginId?.trim().toLowerCase(),
      clinicPassword: formData.clinicPassword,
      isActive: Boolean(formData.isActive)
    };

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
      toast.success(data.message || 'Clinic portal settings saved successfully');
      setSavedSettings(data.data);
      loadSettings();
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Stethoscope className="h-6 w-6 text-white" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">Clinic Portal Settings</h1>
          </div>
          <p className="text-xs sm:text-sm text-orange-100 font-medium">
            Set the official Login ID and Password for Clinic Portal login.
          </p>
        </div>
        <div className="bg-white/15 px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 backdrop-blur-xs shrink-0">
          Status: {savedSettings?.isActive ? 'Active' : 'Disabled'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 card p-6 border border-orange-100 shadow-sm rounded-3xl bg-white space-y-5">
          <div className="border-b border-orange-100 pb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-orange-500" /> Clinic Credentials Configuration
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  placeholder="e.g. clinic_doctor or dr_smith"
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
                <span className="text-[11px] text-gray-500">Enable or disable login access for clinic staff</span>
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Clinic Credentials
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Credentials Summary Card */}
        <div className="space-y-4">
          <div className="card p-5 border border-orange-100 shadow-sm rounded-3xl bg-gradient-to-br from-white to-orange-50/30 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Active Clinic Credentials
            </h3>
            
            {savedSettings?.clinicLoginId ? (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-2xl border border-orange-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Login ID</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900 text-sm">{savedSettings.clinicLoginId}</span>
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
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Password</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900 text-sm">
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
                    Last updated: {new Date(savedSettings.updatedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                <p>No credentials configured yet.</p>
                <p className="text-[11px] text-gray-400 mt-1">Fill out the form on the left to set ID and password.</p>
              </div>
            )}
          </div>

          {/* Helper / Guidelines Card */}
          <div className="card p-5 border border-orange-100/60 rounded-3xl bg-orange-50/20 text-xs text-gray-600 space-y-2">
            <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-orange-500" /> About Clinic Portal Login
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500">
              <li>The Clinic Portal allows authorized clinic doctors and staff to log in and manage patient workflows.</li>
              <li>Share the configured Login ID and Password with clinic users.</li>
              <li>You can update credentials or toggle access anytime from this settings panel.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicSettings;
