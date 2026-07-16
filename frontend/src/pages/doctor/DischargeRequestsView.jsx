import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, CheckCircle, Clock, AlertCircle, X, Plus, Trash2, Pill, Printer, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';

const DischargeRequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Review Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Decision Form State
  const [decision, setDecision] = useState(''); // 'Approve' or 'Reject'
  const [remarks, setRemarks] = useState('');
  const [prescription, setPrescription] = useState([]);
  
  const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
  useEffect(() => {
    const fetchPharmacyMedicines = async () => {
      try {
        const { data } = await client.get('/pharmacy/inventory?limit=5000');
        const items = data.items || [];
        const uniqueNames = Array.from(new Set(items.map(item => item.itemName))).sort();
        setPharmacyMedicines(uniqueNames);
      } catch (err) {
        console.warn('Failed to fetch pharmacy inventory:', err);
      }
    };
    fetchPharmacyMedicines();
  }, []);

  // New drug input state
  const [newDrug, setNewDrug] = useState({
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    remarks: ''
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/ipd/discharge/pending-reviews');
      setRequests(data);
    } catch (err) {
      toast.error('Failed to load discharge requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenReview = (record) => {
    setSelectedRecord(record);
    setDecision('');
    setRemarks('');
    setPrescription([]);
    setNewDrug({ medicineName: '', dosage: '', frequency: '', duration: '', remarks: '' });
    setShowReviewModal(true);
  };

  const handleAddDrug = () => {
    if (!newDrug.medicineName.trim()) {
      toast.error('Medicine name is required');
      return;
    }
    setPrescription([...prescription, { ...newDrug }]);
    setNewDrug({ medicineName: '', dosage: '', frequency: '', duration: '', remarks: '' });
  };

  const handleRemoveDrug = (index) => {
    setPrescription(prescription.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!decision) {
      toast.error('Please choose to Approve or Send Back');
      return;
    }
    if (decision === 'Reject' && !remarks.trim()) {
      toast.error('Please write remarks explaining the rejection');
      return;
    }

    try {
      const payload = {
        dischargeId: selectedRecord._id,
        decision,
        remarks: decision === 'Reject' ? remarks : undefined,
        prescription: decision === 'Approve' ? prescription : undefined
      };

      await client.post('/ipd/discharge/review', payload);
      toast.success(decision === 'Approve' ? 'Discharge approved successfully' : 'Discharge summary sent back to IPD');
      setShowReviewModal(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const term = search.toLowerCase();
    const patientName = r.patientId?.patientName?.toLowerCase() || '';
    const uhid = r.patientId?.uhid?.toLowerCase() || '';
    const ipd = r.admissionId?.ipdNumber?.toLowerCase() || '';
    return patientName.includes(term) || uhid.includes(term) || ipd.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Clinical Discharge Review</h1>
          <p className="text-sm text-gray-500">Review discharge drafts, sign discharge prescriptions, and approve patient release.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search by patient name, UHID, IPD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-orange-50 text-xs font-bold uppercase text-orange-950 border-b border-orange-100">
              <tr>
                <th className="p-4 pl-6">Patient Name</th>
                <th className="p-4">UHID</th>
                <th className="p-4">IPD Number</th>
                <th className="p-4">Admission Date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                    <Clock className="h-5 w-5 animate-spin inline mr-2 text-orange-500" />
                    Loading pending discharge reviews...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-60" />
                    No pending discharge requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const patient = r.patientId || {};
                  return (
                    <tr key={r._id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="p-4 pl-6 font-bold text-gray-800">{patient.patientName}</td>
                      <td className="p-4 font-mono text-xs text-orange-700 font-bold">{formatUhid(patient.uhid)}</td>
                      <td className="p-4 font-mono text-xs font-semibold text-gray-600">{r.admissionId?.ipdNumber || r.ipdNumber}</td>
                      <td className="p-4 text-xs font-medium">
                        {r.admissionId?.admissionDate
                          ? new Date(r.admissionId.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Clock className="h-3 w-3 animate-pulse" /> Pending Review
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <button
                          onClick={() => handleOpenReview(r)}
                          className="btn py-1.5 px-4 text-xs inline-flex items-center gap-1.5 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <Eye className="h-3.5 w-3.5" /> Review Summary
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-orange-100 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-5 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black tracking-tight">Review Patient Discharge Summary</h2>
                <p className="text-xs text-orange-100 mt-0.5 font-medium">
                  Patient: {selectedRecord.patientId?.patientName} | UHID: {formatUhid(selectedRecord.patientId?.uhid)}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
              {/* Discharge Summary Form preview */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2 text-sm uppercase">
                  <FileText className="text-orange-500 h-4 w-4" /> Draft Summary Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Internment Diagnosis</span>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-gray-800 whitespace-pre-wrap">{selectedRecord.diagnosisAtInternment || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Reason for Admission</span>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-gray-800 whitespace-pre-wrap">{selectedRecord.reason || 'N/A'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-400 block mb-0.5">Treatment Summary</span>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-gray-800 whitespace-pre-wrap">{selectedRecord.treatmentSummary || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Proposed Discharge Reason</span>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-gray-800">{selectedRecord.dischargeReason === 'Other' ? selectedRecord.otherDischargeReason : selectedRecord.dischargeReason || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Proposed Discharge Date & Time</span>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-gray-800 font-mono">
                      {selectedRecord.dischargeDate ? new Date(selectedRecord.dischargeDate).toLocaleDateString() : 'N/A'} at {selectedRecord.dischargeTime || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Form */}
              <form onSubmit={handleSubmitReview} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
                <h3 className="font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2 text-sm uppercase">
                  <CheckCircle className="text-orange-500 h-4 w-4" /> Review Decision
                </h3>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-green-50/30 cursor-pointer flex-1 justify-center transition-colors">
                    <input
                      type="radio"
                      name="decision"
                      value="Approve"
                      checked={decision === 'Approve'}
                      onChange={() => setDecision('Approve')}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-extrabold text-green-700">Approve Discharge</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-red-50/30 cursor-pointer flex-1 justify-center transition-colors">
                    <input
                      type="radio"
                      name="decision"
                      value="Reject"
                      checked={decision === 'Reject'}
                      onChange={() => setDecision('Reject')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-extrabold text-red-700">Send Back (Reject)</span>
                  </label>
                </div>

                {decision === 'Reject' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-bold text-gray-500">Rejection Remarks / Correction Required</label>
                    <textarea
                      className="input w-full p-2.5 text-xs h-24"
                      placeholder="Explain what corrections are needed in the discharge summary..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      required
                    />
                  </div>
                )}

                {decision === 'Approve' && (
                  <div className="space-y-4 animate-fade-in border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-850 flex items-center gap-1.5">
                        <Pill className="h-4 w-4 text-indigo-500" />
                        Discharge Prescription (Optional)
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium">Add take-home medicines for the patient.</p>
                    </div>

                    {/* Prescription Item Input fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-150">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Medicine Name</label>
                        <input
                          type="text"
                          list="discharge-prescription-medicines"
                          className="input py-1.5 px-2 text-xs"
                          placeholder="Type to search/select..."
                          value={newDrug.medicineName}
                          onChange={(e) => setNewDrug({ ...newDrug, medicineName: e.target.value })}
                        />
                        <datalist id="discharge-prescription-medicines">
                          {pharmacyMedicines
                            .filter(med => {
                              const query = (newDrug.medicineName || '').trim().toLowerCase();
                              if (!query) return false;
                              return med.toLowerCase().includes(query);
                            })
                            .map((med, idx) => (
                              <option key={idx} value={med} />
                            ))}
                        </datalist>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Dosage</label>
                        <input
                          type="text"
                          className="input py-1.5 px-2 text-xs"
                          placeholder="e.g. 1 Tablet"
                          value={newDrug.dosage}
                          onChange={(e) => setNewDrug({ ...newDrug, dosage: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Frequency</label>
                        <input
                          type="text"
                          className="input py-1.5 px-2 text-xs"
                          placeholder="e.g. 1-0-1 (Twice a day)"
                          value={newDrug.frequency}
                          onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Duration</label>
                        <input
                          type="text"
                          className="input py-1.5 px-2 text-xs"
                          placeholder="e.g. 5 Days"
                          value={newDrug.duration}
                          onChange={(e) => setNewDrug({ ...newDrug, duration: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Instructions / Remarks</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input py-1.5 px-2 text-xs flex-1"
                            placeholder="e.g. Take after meals"
                            value={newDrug.remarks}
                            onChange={(e) => setNewDrug({ ...newDrug, remarks: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={handleAddDrug}
                            className="btn py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Prescription List Table */}
                    {prescription.length > 0 && (
                      <div className="border border-gray-150 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="font-bold text-gray-500">
                              <th className="p-2.5 pl-4">Medicine Name</th>
                              <th className="p-2.5">Dosage</th>
                              <th className="p-2.5">Frequency</th>
                              <th className="p-2.5">Duration</th>
                              <th className="p-2.5">Instructions</th>
                              <th className="p-2.5 pr-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {prescription.map((drug, index) => (
                              <tr key={index} className="text-gray-700">
                                <td className="p-2.5 pl-4 font-bold text-gray-800">{drug.medicineName}</td>
                                <td className="p-2.5">{drug.dosage || '-'}</td>
                                <td className="p-2.5">{drug.frequency || '-'}</td>
                                <td className="p-2.5">{drug.duration || '-'}</td>
                                <td className="p-2.5 italic text-gray-500">{drug.remarks || '-'}</td>
                                <td className="p-2.5 pr-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDrug(index)}
                                    className="p-1 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="btn-secondary text-xs py-2.5 px-4 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn text-xs py-2.5 px-5 flex items-center gap-1.5 cursor-pointer ${
                      decision === 'Reject'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {decision === 'Reject' ? (
                      <>
                        <X className="h-4 w-4" /> Send Back to IPD
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> Approve & Discharge
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DischargeRequestsView;
