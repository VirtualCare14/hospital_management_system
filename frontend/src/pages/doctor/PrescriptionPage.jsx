import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { sanitizePatientName, formatUhid } from '../../utils/uhid';
import { sanitizeClonedDocumentForPdf } from '../../utils/pdfUtils';
import { Download, MessageCircle, Plus, Printer, Save, Send } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { languages } from '../../utils/options';
import { t, translateClinicalText } from '../../utils/prescriptionI18n';
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
  const [medicines, setMedicines] = useState([{ medicine: '', duration: '', morning: true, afternoon: false, night: true, remarks: '' }]);
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
    setTranslatedDiagnosisRemark(translateClinicalText(consultation?.diagnosisRemark, language));
  }, [consultation, language]);

  useEffect(() => {
    if (!prescription) return;
    if (prescription.language) setLanguage(prescription.language);
    if (!isAddMore && prescription.medicines && prescription.medicines.length > 0) {
      setMedicines(prescription.medicines);
    }
  }, [prescription]);

  const updateMedicine = (index, field, value) => {
    setMedicines((current) => current.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
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
          setMedicines([{ medicine: '', duration: '', morning: true, afternoon: false, night: true, remarks: '' }]);
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
        <select className="input max-w-xs" value={language} onChange={(e) => setLanguage(e.target.value)}>
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
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Morning</th>
                  <th className="p-3">Afternoon</th>
                  <th className="p-3">Night</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {previousPrescription.medicines.map((med, idx) => (
                  <tr key={idx} className="border-t border-orange-50/50 text-gray-600">
                    <td className="p-3 font-semibold">{med.medicine}</td>
                    <td className="p-3">{med.duration}</td>
                    <td className="p-3">{med.morning ? '✓' : '-'}</td>
                    <td className="p-3">{med.afternoon ? '✓' : '-'}</td>
                    <td className="p-3">{med.night ? '✓' : '-'}</td>
                    <td className="p-3 text-xs">{med.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {isAddMore && <h3 className="text-sm font-bold text-gray-700 uppercase">Add New Medicines</h3>}
        {medicines.map((item, index) => (
          <div key={index} className="grid gap-3 xl:grid-cols-[1fr_180px_repeat(3,130px)_1fr]">
            <input className="input" placeholder="Medicine" list="pharmacy-medicines" value={item.medicine} onChange={(e) => updateMedicine(index, 'medicine', e.target.value)} />
            <input className="input" placeholder="Duration" value={item.duration} onChange={(e) => updateMedicine(index, 'duration', e.target.value)} />
            {['morning', 'afternoon', 'night'].map((time) => (
              <label key={time} className="flex items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white p-3 text-sm font-semibold capitalize">
                <input type="checkbox" checked={item[time]} onChange={(e) => updateMedicine(index, time, e.target.checked)} /> {t(language, time)}
              </label>
            ))}
            <input className="input" placeholder="Remarks" value={item.remarks} onChange={(e) => updateMedicine(index, 'remarks', e.target.value)} />
          </div>
        ))}
        <button className="btn-secondary" type="button" onClick={() => setMedicines([...medicines, { medicine: '', duration: '', morning: false, afternoon: false, night: false, remarks: '' }])}><Plus className="h-4 w-4" /> Add Medicine</button>
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