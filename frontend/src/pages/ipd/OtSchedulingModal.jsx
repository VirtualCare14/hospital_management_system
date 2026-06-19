import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  X, Loader2, Save, Upload, Trash2, Calendar, Clock,
  Building2, FileText, CheckCircle
} from 'lucide-react';
import client from '../../api/client';

const OtSchedulingModal = ({ otRecord, admissionId, onClose, onScheduleSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ots, setOts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [formData, setFormData] = useState({
    otId: '',
    surgeryDate: '',
    startTime: '',
    endTime: ''
  });

  // Load available OTs
  useEffect(() => {
    const loadAvailableOts = async () => {
      setLoading(true);
      try {
        const { data } = await client.get('/ipd/ot-management');
        setOts(data);
      } catch (err) {
        toast.error('Failed to load OTs');
      } finally {
        setLoading(false);
      }
    };
    loadAvailableOts();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploadingDoc(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result;
        if (fileData) {
          const newDoc = {
            fileName: file.name,
            fileData,
            documentType: 'ot_paper',
            uploadedAt: new Date().toLocaleString()
          };
          setDocuments(prev => [...prev, newDoc]);
          toast.success('Document added to upload queue');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to read file');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed');
  };

  const validateForm = () => {
    if (!formData.otId) {
      toast.error('Please select an OT');
      return false;
    }
    if (!formData.surgeryDate) {
      toast.error('Please select surgery date');
      return false;
    }
    if (!formData.startTime) {
      toast.error('Please select start time');
      return false;
    }
    if (!formData.endTime) {
      toast.error('Please select end time');
      return false;
    }
    if (formData.endTime <= formData.startTime) {
      toast.error('End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const scheduleData = {
        otId: formData.otId,
        surgeryDate: formData.surgeryDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        documentFiles: documents.map(doc => ({
          fileName: doc.fileName,
          fileData: doc.fileData,
          documentType: 'ot_paper'
        }))
      };

      const response = await client.post(
        `/ipd/ot/${otRecord._id}/schedule`,
        scheduleData
      );

      toast.success('OT scheduled successfully with documents');
      
      if (onScheduleSuccess) {
        onScheduleSuccess(response.data.booking);
      }
      
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule OT');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Schedule OT Procedure
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Patient: {otRecord?.patientName} | IPD: {otRecord?.ipdNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              {/* OT Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-500" />
                  Select Operation Theatre <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.otId}
                  onChange={(e) => setFormData(prev => ({ ...prev, otId: e.target.value }))}
                >
                  <option value="">Choose an OT...</option>
                  {ots.map(ot => (
                    <option key={ot._id} value={ot._id}>
                      {ot.otCode} - {ot.otName} ({ot.availabilityStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Surgery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    value={formData.surgeryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, surgeryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Document Upload Section */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-orange-500" />
                  OT Papers & Documents
                </label>

                {/* Upload Input */}
                <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center bg-orange-50/30 mb-4 hover:border-orange-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    disabled={uploadingDoc}
                    onChange={(e) => {
                      Array.from(e.target.files || []).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const fileData = event.target?.result;
                          if (fileData) {
                            setDocuments(prev => [...prev, {
                              fileName: file.name,
                              fileData,
                              documentType: 'ot_paper',
                              uploadedAt: new Date().toLocaleString()
                            }]);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    className="hidden"
                    id="docUpload"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label htmlFor="docUpload" className="cursor-pointer">
                    {uploadingDoc ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500 mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 50MB</p>
                      </>
                    )}
                  </label>
                </div>

                {/* Documents List */}
                {documents.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      {documents.length} document{documents.length !== 1 ? 's' : ''} ready to upload
                    </h4>
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">{doc.uploadedAt}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDocument(idx)}
                          className="ml-2 p-1.5 hover:bg-red-100 rounded transition-colors text-red-600 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold">Timeline:</p>
                  <p className="text-xs mt-1">When the scheduled end time passes, the OT room will automatically become available for the next procedure.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Schedule OT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtSchedulingModal;
