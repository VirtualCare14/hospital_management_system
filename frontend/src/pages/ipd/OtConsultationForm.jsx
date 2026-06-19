import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, X, Loader2, CheckCircle, FileText, Camera } from 'lucide-react';
import client from '../../api/client';
import { formatDate } from '../../utils/dateFormat';

const OtConsultationForm = ({ otRecord, onClose, onConsultationCompleted }) => {
  const [consultationNotes, setConsultationNotes] = useState(
    otRecord?.consultation?.consultationNotes || ''
  );
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [signatureSignedBy, setSignatureSignedBy] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  const handleSignatureFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Signature image must be less than 10MB');
      return;
    }
    setSignatureFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSignaturePreview(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const removeSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    if (!consultationNotes.trim()) {
      toast.error('Please enter consultation notes');
      return false;
    }
    if (!signatureFile) {
      toast.error('Please upload the patient relative/attendant signature');
      return false;
    }
    if (!signatureSignedBy.trim()) {
      toast.error('Please enter the name of the person who signed');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      // Upload signature to Cloudinary first
      setUploading(true);
      const reader = new FileReader();
      const fileData = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result);
        reader.readAsDataURL(signatureFile);
      });

      const cloudRes = await client.post(`/ipd/ot/${otRecord._id}/documents/upload`, {
        fileData,
        documentType: 'consultation_signature',
        fileName: `signature_${otRecord._id}_${Date.now()}`
      });

      const uploadedDoc = cloudRes.data.document;

      // Now save consultation form data to the OT record
      const { data } = await client.put(`/ipd/ot/${otRecord._id}/consultation`, {
        consultationNotes: consultationNotes.trim(),
        signatureFileUrl: uploadedDoc.fileUrl,
        signatureCloudinaryId: uploadedDoc.cloudinaryPublicId,
        signatureSignedBy: signatureSignedBy.trim()
      });

      toast.success('Consultation form completed successfully');
      
      if (typeof onConsultationCompleted === 'function') {
        onConsultationCompleted(data.record);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save consultation form');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const alreadyCompleted = otRecord?.consultation?.isConsultationCompleted;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Consultation Form
            </h2>
            <p className="text-sm text-gray-600">
              Patient: {otRecord?.patientName} | {otRecord?.uhid}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-200 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {alreadyCompleted ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">Consultation Form Already Completed</h3>
            <p className="text-sm text-gray-600 mt-2">
              Completed on {otRecord?.consultation?.signatureSignedAt 
                ? formatDate(otRecord.consultation.signatureSignedAt) : 'N/A'}
            </p>
            {otRecord?.consultation?.signatureFileUrl && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Uploaded Signature:</p>
                <img src={otRecord.consultation.signatureFileUrl} alt="Signature"
                  className="max-h-32 mx-auto border rounded-lg" />
              </div>
            )}
            <div className="mt-6">
              <button onClick={onClose} className="btn-secondary px-6 py-2">
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Consultation Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Consultation Notes <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Enter detailed consultation notes, pre-operative assessment, and medical recommendations.
              </p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-y text-sm"
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Enter consultation notes, diagnosis, pre-operative assessment..."
              />
            </div>

            {/* Signature Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Patient Relative/Attendant Signature <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload a clear image of the signed consent/acknowledgement from the patient's relative or attendant.
              </p>

              {signaturePreview ? (
                <div className="border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <img src={signaturePreview} alt="Signature Preview"
                        className="max-h-40 object-contain border rounded bg-white" />
                      <p className="text-xs text-gray-500 mt-2">{signatureFile?.name}</p>
                    </div>
                    <button onClick={removeSignature}
                      className="p-1 hover:bg-red-100 rounded text-red-600 ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50/30 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Click to upload signature image</p>
                  <p className="text-xs text-gray-500">JPG, PNG up to 10MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*"
                    onChange={handleSignatureFile} className="hidden" />
                </div>
              )}
            </div>

            {/* Signed By */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Signed By (Patient Relative/Attendant Name) <span className="text-red-500">*</span>
              </label>
              <input type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                value={signatureSignedBy}
                onChange={(e) => setSignatureSignedBy(e.target.value)}
                placeholder="Enter the name of the person who signed"
              />
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-semibold">Important</p>
              <p className="text-xs text-amber-700 mt-1">
                The consultation form must be completed and the signature uploaded before OT scheduling can proceed.
                This form is a mandatory prerequisite for scheduling the OT.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {!alreadyCompleted && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-6 py-2.5 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving || uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Complete Consultation Form</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtConsultationForm;