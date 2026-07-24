import { useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { getAbhaCard } from '../../../api/abhaService';
import { useAbha } from '../../../context/AbhaContext';

const AbhaCard = () => {
  const { xtoken, isAuthenticated, logoutAbha } = useAbha();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [contentType, setContentType] = useState(null);

  const fetchCard = async () => {
    if (!xtoken) {
      setError('ABHA session expired. Please login again.');
      logoutAbha();
      return;
    }
    setLoading(true);
    setError(null);
    setCardData(null);
    try {
      const res = await getAbhaCard(xtoken);
      // The backend sends the raw binary with content-type header
      // Axios with responseType 'arraybuffer' gives us the data
      const ct = res.headers['content-type'] || 'image/png';
      setContentType(ct);
      
      // Convert arraybuffer to base64 for display
      const base64 = btoa(
        new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      setCardData(`data:${ct};base64,${base64}`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message ||
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  'Failed to load ABHA card';
      
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
    if (!cardData) return;
    const link = document.createElement('a');
    link.href = cardData;
    link.download = `abha-card.${contentType?.includes('pdf') ? 'pdf' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('ABHA card downloaded');
  };

  return (
    <div className="max-w-3xl w-full">
      <div className="bg-white border border-orange-100 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">ABHA Card</h2>
            <p className="text-sm text-gray-500">View or download your ABHA card</p>
          </div>
          <button
            type="button"
            onClick={fetchCard}
            disabled={loading}
            className="btn text-sm py-2 px-4"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {loading ? 'Loading...' : 'Load Card'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {cardData && (
          <div className="space-y-4">
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex justify-center">
              {contentType?.includes('pdf') ? (
                <iframe
                  src={cardData}
                  className="w-full h-96 rounded-lg"
                  title="ABHA Card PDF"
                />
              ) : (
                <img
                  src={cardData}
                  alt="ABHA Card"
                  className="max-w-full h-auto max-h-96 rounded-lg shadow-sm"
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="btn w-full justify-center"
            >
              <Download className="h-4 w-4" />
              Download ABHA Card
            </button>
          </div>
        )}

        {!loading && !cardData && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ImageIcon className="h-12 w-12 mb-3" />
            <p className="text-sm text-gray-500">Click "Load Card" to view your ABHA card</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbhaCard;