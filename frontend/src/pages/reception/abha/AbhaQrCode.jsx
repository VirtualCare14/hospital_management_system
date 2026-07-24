import { useState } from 'react';
import toast from 'react-hot-toast';
import { QrCode, Loader2, Download } from 'lucide-react';
import { getAbhaQrCode } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';

const AbhaQrCode = () => {
  const { xtoken, isAuthenticated, logoutAbha } = useAbha();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);

  const fetchQr = async () => {
    if (!xtoken) {
      setError('ABHA session expired. Please login again.');
      logoutAbha();
      return;
    }
    setLoading(true);
    setError(null);
    setQrData(null);
    try {
      const res = await getAbhaQrCode(xtoken);
      const ct = res.headers['content-type'] || 'image/png';
      
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(res.data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      setQrData(`data:${ct};base64,${base64}`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message ||
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  'Failed to load QR code';
      
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

  const handleDownload = () => {
    if (!qrData) return;
    const link = document.createElement('a');
    link.href = qrData;
    link.download = 'abha-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded');
  };

  return (
    <div className="max-w-3xl w-full">
      <div className="bg-white border border-orange-100 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">ABHA QR Code</h2>
            <p className="text-sm text-gray-500">View or download your ABHA QR code</p>
          </div>
          <button
            type="button"
            onClick={fetchQr}
            disabled={loading}
            className="btn text-sm py-2 px-4"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            {loading ? 'Loading...' : 'Load QR Code'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {qrData && (
          <div className="space-y-4">
            <div className="bg-white border border-orange-100 rounded-xl p-8 flex justify-center">
              <img
                src={qrData}
                alt="ABHA QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="btn w-full justify-center"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </button>
          </div>
        )}

        {!loading && !qrData && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <QrCode className="h-12 w-12 mb-3" />
            <p className="text-sm text-gray-500">Click "Load QR Code" to view your ABHA QR code</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbhaQrCode;