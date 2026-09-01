import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLabsPortalUrl } from '../../utils/moduleRoutes';
import { FlaskConical, Loader2 } from 'lucide-react';

const LabRedirect = () => {
  const { user } = useAuth();

  useEffect(() => {
    const targetUrl = getLabsPortalUrl();
    window.location.href = targetUrl;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-orange-100 shadow-sm max-w-lg mx-auto my-12">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 mb-4 animate-pulse">
        <FlaskConical className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Connecting to Laboratory Portal</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">
        Redirecting you to the dedicated Medora 360 Laboratory Information System...
      </p>
      <div className="flex items-center gap-2 text-orange-600 font-semibold text-xs bg-orange-50 px-4 py-2 rounded-full border border-orange-200">
        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        <span>labs.medora360.com</span>
      </div>
    </div>
  );
};

export default LabRedirect;
