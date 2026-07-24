import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { sanitizePatientName, formatUhid } from '../../utils/uhid';
import { sanitizeClonedDocumentForPdf } from '../../utils/pdfUtils';
import { Download, MessageCircle, Plus, Printer, Save, Send, ShieldAlert, Trash2 } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { languages } from '../../utils/options';
import { t, translateClinicalText, translateTextBidirectional } from '../../utils/prescriptionI18n';
import PatientReceipt from '../../components/PatientReceipt';

const ageFromDob = (dob) => {
  if (!dob) return '-';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const PrescriptionPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const receiptRef = useRef(null);
  const [patient, setPatient] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [language, setLanguage] = useState('English');
  const [translatedDiagnosisRemark, setTranslatedDiagnosisRemark] = useState('');
  const [medicines, setMedicines] = useState([{ medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '', remarks: '', qty: 0 }]);
  const [showPreview, setShowPreview] = useState(false);
  const [sendingToIpd, setSendingToIpd] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previousPrescription, setPreviousPrescription] = useState(null);
  const [newDiagnosisRemark, setNewDiagnosisRemark] = useState('');
  const isAddMore = window.location.search.includes('addMore=true');
  useEffect(() => {
    const fetchPharmacyMedicines = async () => {
      try {
        const { data } = await client.get('/pharmacy/inventory?limit=5000');
        const items = data.items || [];
        
        const medicineStockMap = {};
        items.forEach(item => {
          const name = String(item.itemName || '').trim();
          const qty = parseInt(item.quantity) || 0;
          if (name) {
            medicineStockMap[name] = (medicineStockMap[name] || 0) + qty;
          }
        });
        
        const sortedMedicines = Object.keys(medicineStockMap).map(name => ({
          name,
          stock: medicineStockMap[name]
        })).sort((a, b) => a.name.localeCompare(b.name));
        
        setPharmacyMedicines(sortedMedicines);
      } catch (error) {
        console.error('Error fetching pharmacy inventory:', error);
      }
    };
    fetchPharmacyMedicines();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientRes, consultationRes, prescriptionRes] = await Promise.all([
          client.get(`/patients/${patientId}`),
          client.get(`/consultation/${patientId}`),
          client.get(`/prescription/${patientId}`).catch(() => ({ data: [] }))
        ]);
        setPatient(patientRes.data);
        const consultations = consultationRes.data;
        setConsultation(consultations && consultations.length > 0 ? consultations[0] : null);
        const latestPres = prescriptionRes.data && prescriptionRes.data.length > 0 ? prescriptionRes.data[0] : null;
        setPrescription(latestPres);
        if (latestPres) {
          setPreviousPrescription(latestPres);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [patientId]);

  useEffect(() => {
    if (consultation?.diagnosisRemark) {
      setTranslatedDiagnosisRemark(translateClinicalText(consultation.diagnosisRemark, language));
    } else {
      setTranslatedDiagnosisRemark('');
    }
  }, [consultation]);

  useEffect(() => {
    if (!prescription) return;
    if (prescription.language) setLanguage(prescription.language);
    if (!isAddMore && prescription.medicines && prescription.medicines.length > 0) {
      setMedicines(prescription.medicines);
    }
  }, [prescription]);

  const updateMedicine = (index, field, value) => {
    setMedicines((current) => current.map((item, idx) => {
      if (idx === index) {
        const newItem = { ...item, [field]: value };
        // Recalculate quantity only if dosageForm is 'Tablet'
        if (newItem.dosageForm === 'Tablet') {
          const doseNum = parseFloat(newItem.dose) || 0;
          const freqCount = (newItem.morning ? 1 : 0) + (newItem.afternoon ? 1 : 0) + (newItem.night ? 1 : 0);
          const durDays = parseFloat(newItem.duration) || 0;
          newItem.qty = parseFloat((doseNum * freqCount * durDays).toFixed(2));
        }
        return newItem;
      }
      return item;
    }));
  };

  const handleLanguageChange = (newLang) => {
    const oldLang = language;
    setLanguage(newLang);

    // 1. Translate Diagnosis / Remarks in the textarea
    if (isAddMore) {
      setNewDiagnosisRemark(prev => translateTextBidirectional(prev, oldLang, newLang));
    } else {
      setTranslatedDiagnosisRemark(prev => translateTextBidirectional(prev, oldLang, newLang));
    }

    // 2. Translate medicine remarks and durations in state
    setMedicines(prevMeds => prevMeds.map(med => ({
      ...med,
      remarks: translateTextBidirectional(med.remarks, oldLang, newLang),
      duration: translateTextBidirectional(med.duration, oldLang, newLang)
    })));
  };

  const savePrescription = async (redirectAfterSave = true) => {
    setIsSaving(true);

    const mergedMedicines = isAddMore && previousPrescription
      ? [...(previousPrescription.medicines || []), ...medicines.filter((m) => m.medicine)]
      : medicines.filter((m) => m.medicine);

    const mergedDiagnosisRemark = isAddMore
      ? [previousPrescription?.diagnosisRemark || consultation?.diagnosisRemark, newDiagnosisRemark].filter(Boolean).join('\n')
      : translatedDiagnosisRemark;

    const consultationData = consultation ? {
      symptoms: consultation.symptoms,
      generalPastHistory: consultation.generalPastHistory,
      diagnosisRemark: mergedDiagnosisRemark || consultation.diagnosisRemark,
      vitals: consultation.vitals,
      tests: consultation.tests || [],
      followUpDate: consultation.followUpDate
    } : { diagnosisRemark: mergedDiagnosisRemark };

    try {
      const res = await client.post('/prescription/create', { 
        patientId, 
        medicines: mergedMedicines, 
        language, 
        pdfUrl: '', 
        consultationData 
      });
      toast.success('✓ Prescription saved & Consultation marked as completed');
      
      // Reload prescription data after save to get latest
      const { data: prescriptionData } = await client.get(`/prescription/${patientId}`).catch(() => ({ data: [] }));
      if (prescriptionData.length > 0) {
        setPrescription(prescriptionData[0]);
        setPreviousPrescription(prescriptionData[0]);
        if (isAddMore) {
          setMedicines([{ medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '', remarks: '', qty: 0 }]);
          setNewDiagnosisRemark('');
        }
      }
      
      if (redirectAfterSave) navigate('/doctor/completed');
      return true;
    } catch (error) {
      toast.error('Error saving prescription');
      console.error(error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    setIsSaving(true);
    try {
      const success = await savePrescription(false);
      if (!success) {
        return;
      }
      
      // Wait a moment for state and DOM to synchronize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pdf = await generateA4Print();
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
      
      navigate('/doctor/completed');
    } catch (error) {
      console.error('Save & Print error:', error);
      toast.error('Error auto-printing prescription. Please check popup blocker.');
    } finally {
      setIsSaving(false);
    }
  };

  const buildPrescriptionData = () => {
    const mergedMedicines = isAddMore && previousPrescription
      ? [...(previousPrescription.medicines || []), ...medicines.filter((m) => m.medicine)]
      : medicines.filter((m) => m.medicine);

    const mergedDiagnosisRemark = isAddMore
      ? [previousPrescription?.diagnosisRemark || consultation?.diagnosisRemark, newDiagnosisRemark].filter(Boolean).join('\n')
      : translatedDiagnosisRemark || consultation?.diagnosisRemark || '';

    return {
      diagnosisRemark: mergedDiagnosisRemark,
      medicines: mergedMedicines,
      symptoms: consultation?.symptoms || [],
      followUpDate: consultation?.followUpDate || null,
      language: language // Pass language for rendering
    };
  };

  const generateA4Print = async () => {
    if (!receiptRef.current) {
      throw new Error('Printable content is not available');
    }
    
    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      imageTimeout: 20000,
      onclone: (clonedDoc) => sanitizeClonedDocumentForPdf(clonedDoc)
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    
    // Add padding to prevent content from touching edges
    const padding = 5;
    pdf.addImage(imgData, 'PNG', padding, padding, width - (padding * 2), height);
    
    return pdf;
  };

  const makePdf = async (action = 'download') => {
    try {
      // Save prescription first to ensure latest data is persisted
      await savePrescription(false);
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pdf = await generateA4Print();
      const filename = `${sanitizePatientName(patient?.patientName) || 'patient'}_${formatUhid(patient?.uhid) || 'UHIDunknown'}.pdf`;
      if (action === 'print') {
        pdf.autoPrint();
        window.open(pdf.output('bloburl'), '_blank');
      } else {
        pdf.save(filename);
      }
    } catch (error) {
      console.error('Prescription PDF error:', error);
      toast.error('Error generating PDF. Please try again.');
    }
  };

  const shareWhatsApp = async () => {
    try {
      if (!patient) {
        throw new Error('No patient information available');
      }
      let phone = patient.mobile?.replace(/\D/g, '');
      if (phone && phone.length === 10) {
        phone = '91' + phone;
      }
      
      // Save first
      await savePrescription(false);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pdf = await generateA4Print();
      const pdfBlob = pdf.output('blob');
      const filename = `${sanitizePatientName(patient.patientName)}_${formatUhid(patient.uhid)}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: `${patient.patientName} Prescription`,
          text: `${patient.patientName} (${patient.uhid})`,
          files: [pdfFile]
        });
        return;
      }

      pdf.save(filename);
      const symptoms = consultation?.symptoms?.map((item) => translateClinicalText(`${item.symptom} (${item.duration})`, language)).join(', ') || '-';
      const meds = medicines.filter((m) => m.medicine).map((m) => `${m.medicine} - ${translateClinicalText(m.duration, language)}`).join(', ');
      
      const rawText = `${t(language, 'prescription')}\nPatient: ${patient.patientName} (${patient.uhid})\nSymptoms: ${symptoms}\nDiagnosis: ${translatedDiagnosisRemark || '-'}\nMedicines: ${meds}\nFollow Up: ${consultation?.followUpDate ? new Date(consultation.followUpDate).toLocaleDateString() : '-'}\nInstructions: Please find the attached prescription PDF.`;
      const message = encodeURIComponent(rawText);
      
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      toast('PDF downloaded. Attach it in WhatsApp if the browser did not open the native share sheet.');
    } catch (error) {
      console.error('WhatsApp PDF error:', error);
      toast.error('Unable to prepare prescription PDF. Please try again.');
    }
  };

  const handleSendToIpd = async () => {
    if (!patient) return;
    const defaultNotes = `Referred from OPD by Dr. ${user?.doctorName || user?.username || 'Doctor'}. Diagnosis: ${translatedDiagnosisRemark || consultation?.diagnosisRemark || 'N/A'}`;
    const customRemarks = window.prompt("Enter remarks for IPD Referral:", defaultNotes);
    if (customRemarks === null) return;

    setSendingToIpd(true);
    try {
      const consultationId = consultation?._id || null;
      await client.post('/ipd/referrals', {
        patientId: patient._id,
        consultationId,
        notes: customRemarks
      });
      toast.success(`${patient.patientName} has been referred to IPD successfully!`);
      setReferralSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send to IPD');
    } finally {
      setSendingToIpd(false);
    }
  };

  if (!patient) return <div className="card p-5">Loading prescription...</div>;

  // Build prescription data for the receipt
  const receiptPrescription = buildPrescriptionData();

  return (
    <div className="space-y-5">
      {patient.isDischarged && (
        <div className="card p-4 border border-gray-255 bg-gray-50 flex items-center gap-3">
          <ShieldAlert className="text-gray-500 h-6 w-6 shrink-0" />
          <div>
            <h4 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">Patient is Discharged</h4>
            <p className="text-xs text-gray-650 mt-0.5 font-semibold">
              This patient has been discharged from the hospital. The OPD case record is read-only. No new consultations, referrals, or prescriptions can be saved.
            </p>
          </div>
        </div>
      )}

      <div className="card flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Digital Prescription</h1>
          <p className="text-sm text-gray-500">Save, download PDF, print, or share on WhatsApp.</p>
        </div>
        <select className="input max-w-xs" value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
          {languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      <div className="card space-y-4 p-5">
        <h2 className="font-bold text-gray-800">{t(language, 'diagnosis')}</h2>
        {isAddMore && (previousPrescription?.diagnosisRemark || consultation?.diagnosisRemark) && (
          <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 text-gray-600 text-sm mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Previous Diagnosis / Remarks (Read-Only)</p>
            <p className="whitespace-pre-line">{previousPrescription?.diagnosisRemark || consultation?.diagnosisRemark}</p>
          </div>
        )}
        <p className="text-sm text-gray-500">
          {isAddMore 
            ? "Add new remarks or updates here. They will be appended to the diagnosis history."
            : "Doctor remarks are prepared in the selected language. Edit here before PDF, print, or WhatsApp sharing."}
        </p>
        <textarea
          className="input min-h-24"
          value={isAddMore ? newDiagnosisRemark : translatedDiagnosisRemark}
          onChange={(event) => isAddMore ? setNewDiagnosisRemark(event.target.value) : setTranslatedDiagnosisRemark(event.target.value)}
          placeholder={isAddMore ? "Add new diagnosis details..." : t(language, 'diagnosis')}
        />
      </div>

      <div className="card space-y-4 p-5 rounded-2xl shadow-sm bg-white">
        <h2 className="font-bold text-gray-800">Medicines</h2>
        {isAddMore && previousPrescription?.medicines?.length > 0 && (
          <div className="mb-4 border border-orange-100 rounded-xl overflow-hidden bg-gray-50">
            <div className="p-3 bg-orange-50 border-b border-orange-100 text-xs font-bold text-orange-900 uppercase">
              Previous Medicines (Read-Only)
            </div>
            <table className="w-full text-left text-sm bg-white">
              <thead className="bg-orange-100/40 text-xs text-orange-900">
                <tr>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Dosage Form</th>
                  <th className="p-3">Strength</th>
                  <th className="p-3">Dose</th>
                  <th className="p-3 text-center">Frequency (M-A-N)</th>
                  <th className="p-3">Duration (Days)</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3 text-center">Qty</th>
                </tr>
              </thead>
              <tbody>
                {previousPrescription.medicines.map((med, idx) => {
                  const doseNum = parseFloat(med.dose) || 0;
                  const freqCount = (med.morning ? 1 : 0) + (med.afternoon ? 1 : 0) + (med.night ? 1 : 0);
                  const durDays = parseFloat(med.duration) || 0;
                  const calculatedQty = parseFloat((doseNum * freqCount * durDays).toFixed(2));
                  const displayQty = med.qty !== undefined ? med.qty : calculatedQty;

                  return (
                    <tr key={idx} className="border-t border-orange-50/50 text-gray-600">
                      <td className="p-3 font-semibold">{med.medicine}</td>
                      <td className="p-3 font-medium text-slate-500">{med.dosageForm || 'Tablet'}</td>
                      <td className="p-3">{med.strength || '-'}</td>
                      <td className="p-3">{med.dose !== undefined ? med.dose : '1'}</td>
                      <td className="p-3 text-center font-mono">
                        {[med.morning ? '1' : '0', med.afternoon ? '1' : '0', med.night ? '1' : '0'].join(' - ')}
                      </td>
                      <td className="p-3">{med.duration ? `${med.duration} days` : '-'}</td>
                      <td className="p-3 text-xs">{med.remarks || '-'}</td>
                      <td className="p-3 text-center font-bold text-[#FF6A00]">{displayQty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {isAddMore && <h3 className="text-sm font-bold text-gray-700 uppercase">Add New Medicines</h3>}
        <div className="hidden xl:grid xl:grid-cols-[1.8fr_1.2fr_1.1fr_0.9fr_2.2fr_1.1fr_1.8fr_0.9fr_40px] gap-3 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <div>Medicine Name</div>
          <div>Dosage Form</div>
          <div>Strength <span className="text-gray-400 font-normal">(opt)</span></div>
          <div>Dose <span className="text-gray-400 font-normal">(e.g. 1)</span></div>
          <div className="text-center">Frequency</div>
          <div>Duration <span className="text-gray-400 font-normal">(days)</span></div>
          <div>Remarks</div>
          <div className="text-center">Qty</div>
          <div></div>
        </div>

        {medicines.map((item, index) => (
          <div key={index} className="grid gap-3 grid-cols-1 xl:grid-cols-[1.8fr_1.2fr_1.1fr_0.9fr_2.2fr_1.1fr_1.8fr_0.9fr_40px] items-center bg-gray-50/30 xl:bg-transparent p-4 xl:p-0 rounded-xl border border-gray-150 xl:border-none">
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1">Medicine Name</span>
              <input className="input w-full" placeholder="Medicine" list="pharmacy-medicines" value={item.medicine} onChange={(e) => updateMedicine(index, 'medicine', e.target.value)} />
            </div>
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1">Dosage Form</span>
              <select className="input w-full" value={item.dosageForm || 'Tablet'} onChange={(e) => updateMedicine(index, 'dosageForm', e.target.value)}>
                <option value="Tablet">Tablet</option>
                <option value="Liquid">Liquid</option>
                <option value="Tube">Tube</option>
              </select>
            </div>
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1">Strength (optional)</span>
              <input className="input w-full" placeholder="e.g. 500mg" value={item.strength || ''} onChange={(e) => updateMedicine(index, 'strength', e.target.value)} />
            </div>
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1">Dose</span>
              <input className="input w-full text-center" placeholder="e.g. 1" value={item.dose !== undefined ? item.dose : '1'} onChange={(e) => updateMedicine(index, 'dose', e.target.value)} />
            </div>
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1 text-center">Frequency</span>
              <div className="grid grid-cols-3 gap-1 bg-white xl:bg-gray-50 p-1.5 rounded-xl border border-orange-100/50 xl:border-gray-100">
                {['morning', 'afternoon', 'night'].map((time) => (
                  <label key={time} className="flex flex-col xl:flex-row items-center justify-center gap-1 cursor-pointer select-none py-1.5 px-1 rounded-lg hover:bg-orange-50/50 transition-colors">
                    <input type="checkbox" checked={item[time]} onChange={(e) => updateMedicine(index, time, e.target.checked)} className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]" /> 
                    <span className="text-[10px] xl:text-xs font-bold text-gray-750 capitalize">{t(language, time)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1">Duration (days)</span>
              <input className="input w-full text-center" type="number" min="0" placeholder="Days" value={item.duration} onChange={(e) => updateMedicine(index, 'duration', e.target.value)} />
            </div>
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1">Remarks</span>
              <input className="input w-full" placeholder="Remarks" value={item.remarks} onChange={(e) => updateMedicine(index, 'remarks', e.target.value)} />
            </div>
            <div>
              <span className="block xl:hidden text-xs font-bold text-gray-500 uppercase mb-1 text-center">Qty</span>
              <input 
                className={`input w-full text-center font-bold ${
                  item.dosageForm === 'Tablet' 
                    ? 'text-[#FF6A00] bg-orange-50/40 border-orange-200/50 cursor-not-allowed' 
                    : 'text-gray-800 bg-white border-slate-200'
                }`}
                type="number"
                min="0"
                value={item.qty || 0} 
                onChange={(e) => {
                  if (item.dosageForm !== 'Tablet') {
                    updateMedicine(index, 'qty', parseFloat(e.target.value) || 0);
                  }
                }}
                readOnly={item.dosageForm === 'Tablet'} 
                disabled={item.dosageForm === 'Tablet'}
              />
            </div>
            <div className="flex justify-end xl:justify-center">
              <button 
                type="button" 
                onClick={() => {
                  if (medicines.length > 1) {
                    setMedicines(medicines.filter((_, idx) => idx !== index));
                  } else {
                    setMedicines([{ medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: true, afternoon: false, night: true, duration: '', remarks: '', qty: 0 }]);
                  }
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors mt-2 xl:mt-0"
                title="Remove"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        <button className="btn-secondary" type="button" onClick={() => setMedicines([...medicines, { medicine: '', dosageForm: 'Tablet', strength: '', dose: '1', morning: false, afternoon: false, night: false, duration: '', remarks: '', qty: 0 }])}><Plus className="h-4 w-4" /> Add Medicine</button>
        <datalist id="pharmacy-medicines">
          {pharmacyMedicines
            .filter(med => {
              const matches = medicines.some(m => {
                const q = (m.medicine || '').trim().toLowerCase();
                return q && med.name.toLowerCase().includes(q);
              });
              return matches;
            })
            .map((med) => (
              <option key={med.name} value={med.name}>
                {med.stock <= 0 ? 'Out of Stock' : `Stock: ${med.stock} available`}
              </option>
            ))}
        </datalist>
      </div>

      {/* Unified A4 Preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">A4 Print Preview - Patient Receipt with Prescription</h2>
          <button 
            className="btn-secondary text-xs" 
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        
        <div 
          className="overflow-auto border border-gray-200 rounded-xl" 
          style={showPreview ? { maxHeight: '600px' } : { position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}
        >
          <PatientReceipt 
            ref={receiptRef} 
            patient={patient} 
            prescription={receiptPrescription}
            language={language}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {patient.isDischarged ? (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 font-medium">
            This patient has been discharged and the prescription cannot be updated.
          </div>
        ) : (
          <>
            <button className="btn-secondary" disabled={isSaving} onClick={handleSaveAndPrint}><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save'}</button>
            <button className="btn-secondary" disabled={isSaving} onClick={shareWhatsApp}><MessageCircle className="h-4 w-4" /> WhatsApp</button>
            {referralSent ? (
              <span className="btn-secondary bg-green-50 text-green-700 border-green-200 cursor-default">
                ✓ Referred to IPD
              </span>
            ) : (
              <button
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSendToIpd}
                disabled={sendingToIpd}
              >
                <Send className="h-4 w-4" /> {sendingToIpd ? 'Sending...' : 'Send to IPD'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PrescriptionPage;