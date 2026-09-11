import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserCircle, Loader2, RefreshCw, Phone, Mail, IdCard, Hash, MapPin, Calendar } from 'lucide-react';
import { getAbhaProfile } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';

const AbhaProfile = () => {
  const { xtoken, isAuthenticated, logoutAbha, profile, updateProfile } = useAbha();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(profile);

  const fetchProfile = async () => {
    if (!xtoken) {
      setError('ABHA session expired. Please login again.');
      logoutAbha();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAbhaProfile(xtoken);
      const data = res.data?.data || res.data;
      setProfileData(data);
      updateProfile(data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message ||
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  'Failed to fetch profile';
      
      if (status === 401 || msg?.includes?.('token') || msg?.includes?.('X-token') || msg?.includes?.('expired')) {
        setError('ABHA session expired. Please login again.');
        logoutAbha();
      } else {
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && xtoken) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  // Format date of birth
  const formatDateOfBirth = (data) => {
    if (!data) return null;
    const dateValue = data.dateOfBirth || 
                      data.dob || 
                      (data.dayOfBirth && data.monthOfBirth && data.yearOfBirth ? `${data.yearOfBirth}-${data.monthOfBirth}-${data.dayOfBirth}` : null) ||
                      data.yearOfBirth;
    if (!dateValue) return null;
    
    // If it's just a year (4 digits)
    if (/^\d{4}$/.test(String(dateValue))) {
      return `Year: ${dateValue}`;
    }
    
    // If it's a full date, try to format it
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
      }
    } catch (e) {
      // If parsing fails, return as is
    }
    
    return String(dateValue);
  };

  const dobValue = formatDateOfBirth(profileData);

  // Build a clean key-value display
  const fullName = profileData?.name || 
                   profileData?.fullName || 
                   [profileData?.firstName, profileData?.middleName, profileData?.lastName].filter(Boolean).join(' ') || 
                   null;

  const fields = profileData ? [
    { label: 'ABHA Number', value: profileData.abhaNumber || profileData.healthIdNumber || profileData.abha || profileData.id, icon: IdCard },
    { label: 'ABHA Address', value: profileData.abhaAddress || profileData.healthId, icon: Hash },
    { label: 'Name', value: fullName, icon: UserCircle },
    { label: 'Mobile', value: profileData.mobile || profileData.phoneNumber, icon: Phone },
    { label: 'Email', value: profileData.email, icon: Mail },
    { label: 'Gender', value: profileData.gender, icon: Hash },
    { label: 'Date of Birth', value: dobValue, icon: Calendar },
    { label: 'Address', value: profileData.address, icon: MapPin },
    { label: 'District', value: profileData.district || profileData.districtName, icon: MapPin },
    { label: 'State', value: profileData.state || profileData.stateName, icon: MapPin },
    { label: 'Pincode', value: profileData.pincode || profileData.pinCode, icon: Hash },
  ].filter(f => f.value) : [];

  return (
    <div className="max-w-3xl w-full">
      <div className="bg-white border border-orange-100 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">ABHA Profile</h2>
            <p className="text-sm text-gray-500">Your Ayushman Bharat Health Account details</p>
          </div>
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="btn-secondary text-sm py-2 px-3"
            title="Refresh Profile"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {loading && !profileData && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-3 text-sm text-gray-500">Loading profile...</span>
          </div>
        )}

        {!loading && !profileData && !error && (
          <p className="text-sm text-gray-500 text-center py-8">
            Click "Refresh" to load your ABHA profile.
          </p>
        )}

        {profileData && fields.length > 0 && (
          <div className="divide-y divide-orange-50">
            {fields.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div key={idx} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</p>
                    <p className="text-sm font-semibold text-gray-800 break-words">{field.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {profileData && fields.length === 0 && (
          <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default AbhaProfile;