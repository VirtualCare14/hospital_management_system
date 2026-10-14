import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, Save, Upload, X, Loader2, Info, Percent, Settings, ShieldAlert, FileText, Globe, Mail, PhoneCall, Plus, Trash2, Eye, Printer } from 'lucide-react';
import client from '../../api/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { openPdfPrintWindow, sanitizeClonedDocumentForPdf } from '../../utils/pdfUtils';
import PatientReceipt from '../../components/PatientReceipt';
import SkeletonCard from '../../components/Skeleton/SkeletonCard';
import SkeletonInput from '../../components/Skeleton/SkeletonInput';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';

const HospitalSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);
  const [previewLetterhead, setPreviewLetterhead] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'invoice', 'gst-discount'
  const [phoneNumbersList, setPhoneNumbersList] = useState([{ name: '', number: '' }]);

  // Patient Slip Preview Modal State
  const [showSlipPreviewModal, setShowSlipPreviewModal] = useState(false);
  const [previewSlipMode, setPreviewSlipMode] = useState('patient_slip'); // 'patient_slip', 'prescription', 'bill_receipt'
  const [previewLetterheadMode, setPreviewLetterheadMode] = useState('auto'); // 'auto', 'image', 'system'
  const slipPreviewRef = useRef(null);

  // Discount requests state
  const [discountRequests, setDiscountRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [adminDiscounts, setAdminDiscounts] = useState({});

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm({
    defaultValues: {
      hospitalName: '',
      mobileNumbers: '',
      address: '',
      hospitalHeading: '',
      alternateMobileNumber: '',
      emailAddress: '',
      website: '',
      gstNumber: '',
      panNumber: '',
      registrationNumber: '',
      dlNumber: '',
      invoiceFooterMessage: '',
      invoicePrefix: 'HOSP-INV-2026-',
      invoiceCounter: 1,
      invoiceFormat: '{PREFIX}{COUNTER}',
      discountEnabled: true,
      sdtPricingInBilling: true,
      accessDiscount: false,
      receptionSeePatientDue: false,
      dueModificationEnabled: false,
      medicationGracePeriod: 30,
      medicationMissedThreshold: 60,
      letterheadImageUrl: '',
      letterheadImagePublicId: '',
      letterheadHeaderHeight: 4.6,
      useSystemLetterhead: true
    }
  });

  const discountEnabledWatch = watch('discountEnabled');
  const useSystemLetterheadWatch = watch('useSystemLetterhead');

  const loadDiscountRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data } = await client.get('/billing/discount-requests');
      setDiscountRequests(data || []);
    } catch (error) {
      console.error('Error loading discount requests:', error);
      toast.error('Failed to load pending discount requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gst-discount') {
      loadDiscountRequests();
    }
  }, [activeTab]);

  const handleAdminDiscountPercentChange = (id, value) => {
    setAdminDiscounts(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleApproveRequest = async (id) => {
    const pct = parseFloat(adminDiscounts[id]);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Please enter a valid discount percentage between 0 and 100');
      return;
    }
    try {
      await client.put(`/billing/discount-requests/${id}/approve`, { discountPercentage: pct });
      toast.success('Discount approved and invoice finalized successfully');
      loadDiscountRequests();
    } catch (error) {
      console.error('Approve discount request error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve discount request');
    }
  };

  const handleRejectRequest = async (id) => {
    if (!window.confirm('Are you sure you want to reject this discount request?')) return;
    try {
      await client.put(`/billing/discount-requests/${id}/reject`);
      toast.success('Discount request rejected successfully');
      loadDiscountRequests();
    } catch (error) {
      console.error('Reject discount request error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject discount request');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleAddPhoneNumber = () => {
    setPhoneNumbersList(prev => [...prev, { name: '', number: '' }]);
  };

  const handleRemovePhoneNumber = (index) => {
    if (phoneNumbersList.length <= 1) {
      toast.error('At least one phone number entry is required');
      return;
    }
    setPhoneNumbersList(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index, field, value) => {
    setPhoneNumbersList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const loadSettings = async () => {
    try {
      const { data } = await client.get('/admin/hospital-settings');
      if (data.exists && data.data) {
        setSettings(data.data);

        if (data.data.phoneNumbers && Array.isArray(data.data.phoneNumbers) && data.data.phoneNumbers.length > 0) {
          setPhoneNumbersList(data.data.phoneNumbers);
        } else if (data.data.mobileNumbers && Array.isArray(data.data.mobileNumbers) && data.data.mobileNumbers.length > 0) {
          const parsed = data.data.mobileNumbers.map(item => {
            const str = String(item).trim();
            if (str.includes(':')) {
              const parts = str.split(':');
              return { name: parts[0].trim(), number: parts.slice(1).join(':').trim() };
            }
            return { name: '', number: str };
          });
          setPhoneNumbersList(parsed);
        } else {
          setPhoneNumbersList([{ name: '', number: '' }]);
        }

        reset({
          hospitalName: data.data.hospitalName,
          mobileNumbers: data.data.mobileNumbers.join(', '),
          address: data.data.address,
          hospitalHeading: data.data.hospitalHeading || '',
          logoUrl: data.data.logoUrl || '',
          logoPublicId: data.data.logoPublicId || '',
          alternateMobileNumber: data.data.alternateMobileNumber || '',
          emailAddress: data.data.emailAddress || '',
          website: data.data.website || '',
          gstNumber: data.data.gstNumber || '',
          panNumber: data.data.panNumber || '',
          registrationNumber: data.data.registrationNumber || '',
          dlNumber: data.data.dlNumber || '',
          invoiceFooterMessage: data.data.invoiceFooterMessage || '',
          invoicePrefix: data.data.invoicePrefix || 'HOSP-INV-2026-',
          invoiceCounter: data.data.invoiceCounter || 1,
          invoiceFormat: data.data.invoiceFormat || '{PREFIX}{COUNTER}',
          gstEnabled: data.data.gstEnabled !== undefined ? data.data.gstEnabled : true,
          gstPercentage: data.data.gstPercentage !== undefined ? data.data.gstPercentage : 18,
          gstRules: data.data.gstRules || '',
          discountEnabled: data.data.discountEnabled !== undefined ? data.data.discountEnabled : true,
          discountReasons: data.data.discountReasons ? data.data.discountReasons.join(', ') : 'General Discount, Staff Discount, EWS Discount, Emergency Discount',
          discountPercentage: data.data.discountPercentage !== undefined ? data.data.discountPercentage : 0,
          discountFixedAmount: data.data.discountFixedAmount !== undefined ? data.data.discountFixedAmount : 0,
          patientSpecificDiscounts: data.data.patientSpecificDiscounts !== undefined ? data.data.patientSpecificDiscounts : 'Staff:10,EWS:100',
          sdtPricingInBilling: data.data.sdtPricingInBilling !== undefined ? data.data.sdtPricingInBilling : true,
          accessDiscount: data.data.accessDiscount !== undefined ? data.data.accessDiscount : false,
          receptionSeePatientDue: data.data.receptionSeePatientDue !== undefined ? data.data.receptionSeePatientDue : false,
          dueModificationEnabled: data.data.dueModificationEnabled !== undefined ? data.data.dueModificationEnabled : false,
          medicationGracePeriod: data.data.medicationGracePeriod !== undefined ? data.data.medicationGracePeriod : 30,
          medicationMissedThreshold: data.data.medicationMissedThreshold !== undefined ? data.data.medicationMissedThreshold : 60,
          letterheadImageUrl: data.data.letterheadImageUrl || '',
          letterheadImagePublicId: data.data.letterheadImagePublicId || '',
          letterheadHeaderHeight: data.data.letterheadHeaderHeight !== undefined ? data.data.letterheadHeaderHeight : 4.6,
          useSystemLetterhead: data.data.useSystemLetterhead !== undefined ? data.data.useSystemLetterhead : true
        });
        setPreviewLogo(data.data.logoUrl);
        setPreviewLetterhead(data.data.letterheadImageUrl || null);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load hospital settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imageData = event.target.result;
          const response = await client.post('/admin/hospital-settings/upload-logo', {
            imageData,
            folder: 'hms/hospital-settings'
          });
          
          const { url, publicId } = response.data;
          setValue('logoUrl', url);
          setValue('logoPublicId', publicId);
          setPreviewLogo(url);
          toast.success('Logo uploaded successfully');
        } catch (error) {
          toast.error('Failed to upload logo');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      toast.error('Failed to process logo');
    }
  };

  const handleDeleteLogo = async () => {
    const publicId = getValues('logoPublicId') || settings?.logoPublicId;
    if (!publicId) {
      toast.error('No logo to delete');
      return;
    }

    try {
      await client.delete('/admin/hospital-settings/delete-logo', {
        data: { publicId }
      });
      setValue('logoUrl', '');
      setValue('logoPublicId', '');
      setPreviewLogo(null);
      toast.success('Logo deleted successfully');
    } catch (error) {
      toast.error('Failed to delete logo');
    }
  };

  const handleLetterheadUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLetterhead(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imageData = event.target.result;
          const response = await client.post('/admin/hospital-settings/upload-letterhead', {
            imageData,
            folder: 'hms/hospital-letterheads'
          });
          
          const { url, publicId } = response.data;
          setValue('letterheadImageUrl', url);
          setValue('letterheadImagePublicId', publicId);
          setPreviewLetterhead(url);
          toast.success('Letterhead uploaded successfully');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to upload letterhead');
        } finally {
          setUploadingLetterhead(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingLetterhead(false);
      toast.error('Failed to process letterhead file');
    }
  };

  const handleDeleteLetterhead = async () => {
    const publicId = getValues('letterheadImagePublicId') || settings?.letterheadImagePublicId;
    if (!publicId) {
      setValue('letterheadImageUrl', '');
      setValue('letterheadImagePublicId', '');
      setPreviewLetterhead(null);
      toast.success('Letterhead removed');
      return;
    }

    try {
      await client.delete('/admin/hospital-settings/delete-letterhead', {
        data: { publicId }
      });
      setValue('letterheadImageUrl', '');
      setValue('letterheadImagePublicId', '');
      setPreviewLetterhead(null);
      toast.success('Letterhead deleted successfully');
    } catch (error) {
      toast.error('Failed to delete letterhead');
    }
  };

  const onSubmit = async (data) => {
    try {
      const validPhoneNumbers = phoneNumbersList
        .map(p => ({ name: (p.name || '').trim(), number: (p.number || '').trim() }))
        .filter(p => p.number.length > 0);

      if (validPhoneNumbers.length === 0) {
        toast.error('At least one valid mobile number is required');
        return;
      }

      const mobileNumbers = validPhoneNumbers.map(p => p.name ? `${p.name}: ${p.number}` : p.number);

      const discountReasons = (data.discountReasons || 'Patient-Specific Discount')
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      const payload = {
        hospitalName: data.hospitalName,
        phoneNumbers: validPhoneNumbers,
        mobileNumbers,
        address: data.address,
        hospitalHeading: data.hospitalHeading || '',
        logoUrl: data.logoUrl || settings?.logoUrl || '',
        logoPublicId: data.logoPublicId || settings?.logoPublicId || '',
        letterheadImageUrl: data.letterheadImageUrl !== undefined ? data.letterheadImageUrl : (settings?.letterheadImageUrl || ''),
        letterheadImagePublicId: data.letterheadImagePublicId !== undefined ? data.letterheadImagePublicId : (settings?.letterheadImagePublicId || ''),
        letterheadHeaderHeight: Number(data.letterheadHeaderHeight || 4.6),
        useSystemLetterhead: Boolean(data.useSystemLetterhead),
        alternateMobileNumber: data.alternateMobileNumber || '',
        emailAddress: data.emailAddress || '',
        website: data.website || '',
        gstNumber: data.gstNumber || '',
        panNumber: data.panNumber || '',
        registrationNumber: data.registrationNumber || '',
        dlNumber: data.dlNumber || '',
        invoiceFooterMessage: data.invoiceFooterMessage || '',
        invoicePrefix: data.invoicePrefix || 'HOSP-INV-2026-',
        invoiceCounter: Number(data.invoiceCounter || 1),
        invoiceFormat: data.invoiceFormat || '{PREFIX}{COUNTER}',
        gstEnabled: false,
        gstPercentage: 0,
        gstRules: '',
        discountEnabled: Boolean(data.discountEnabled),
        discountReasons,
        discountPercentage: 0,
        discountFixedAmount: 0,
        patientSpecificDiscounts: '',
        sdtPricingInBilling: Boolean(data.sdtPricingInBilling),
        accessDiscount: Boolean(data.accessDiscount),
        receptionSeePatientDue: Boolean(data.receptionSeePatientDue),
        dueModificationEnabled: Boolean(data.dueModificationEnabled),
        medicationGracePeriod: Number(data.medicationGracePeriod || 30),
        medicationMissedThreshold: Number(data.medicationMissedThreshold || 60)
      };

      await client.post('/admin/hospital-settings', payload);
      toast.success(settings ? 'Hospital settings updated successfully' : 'Hospital settings created successfully');
      loadSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save hospital settings');
    }
  };

  const samplePatient = {
    patientName: 'Ravi Kumar',
    uhid: 'UHID454554',
    gender: 'Male',
    dob: '1981-05-10',
    mobile: '9876543210',
    department: 'OPD - General Medicine',
    doctorId: { doctorName: 'Amit Beniwal', opdFees: 500 },
    appointmentDate: new Date().toISOString(),
    slot: '10:30 AM',
    registrationNumber: 'REG-20261013-0001',
    address: 'Sector 30, Gurugram, Haryana',
    opdFee: 500,
    netOpdFee: 500,
    paymentMode: 'Cash',
    registeredBy: 'Receptionist',
    demographics: {
      bloodPressure: '120/80',
      pulse: '72',
      temperature: '98.4',
      weight: '68',
      height: '172',
      spo2: '99'
    }
  };

  const samplePrescription = {
    diagnosisRemark: 'Acute upper respiratory tract infection with mild fever.\nPatient advised rest and adequate hydration.',
    patientAdvice: 'Take medicines after meals as prescribed.\nDrink plenty of warm water.\nReview in OPD if fever persists after 3 days.',
    tests: ['Complete Blood Count (CBC)', 'Chest X-Ray (PA View)'],
    medicines: [
      { medicineName: 'Paracetamol 650mg', dosage: '1 Tab', frequency: 'TDS (Three times a day)', duration: '3 Days', instruction: 'After food' },
      { medicineName: 'Amoxicillin 500mg', dosage: '1 Cap', frequency: 'BD (Twice a day)', duration: '5 Days', instruction: 'After food' },
      { medicineName: 'Cetirizine 10mg', dosage: '1 Tab', frequency: 'HS (At bedtime)', duration: '5 Days', instruction: 'At bedtime' }
    ]
  };

  const getLiveHospitalSettingsForPreview = () => {
    const validPhoneNumbers = phoneNumbersList
      .map(p => ({ name: (p.name || '').trim(), number: (p.number || '').trim() }))
      .filter(p => p.number.length > 0);

    const mobileNumbers = validPhoneNumbers.length > 0 
      ? validPhoneNumbers.map(p => p.name ? `${p.name}: ${p.number}` : p.number)
      : (settings?.mobileNumbers || []);

    return {
      ...(settings || {}),
      hospitalName: watch('hospitalName') || settings?.hospitalName || 'Shivam Hospital',
      hospitalHeading: watch('hospitalHeading') !== undefined ? watch('hospitalHeading') : (settings?.hospitalHeading || ''),
      address: watch('address') !== undefined ? watch('address') : (settings?.address || ''),
      phoneNumbers: validPhoneNumbers.length > 0 ? validPhoneNumbers : (settings?.phoneNumbers || []),
      mobileNumbers,
      alternateMobileNumber: watch('alternateMobileNumber') || settings?.alternateMobileNumber || '',
      emailAddress: watch('emailAddress') || settings?.emailAddress || '',
      website: watch('website') || settings?.website || '',
      logoUrl: previewLogo || settings?.logoUrl || '',
      letterheadImageUrl: previewLetterhead || settings?.letterheadImageUrl || '',
      letterheadHeaderHeight: Number(watch('letterheadHeaderHeight') || settings?.letterheadHeaderHeight || 4.6),
      useSystemLetterhead: Boolean(watch('useSystemLetterhead'))
    };
  };

  const [printingPdf, setPrintingPdf] = useState(false);

  const handlePrintTestCopy = async () => {
    if (!slipPreviewRef.current) {
      window.print();
      return;
    }
    setPrintingPdf(true);
    const toastId = toast.loading('Preparing print preview...');
    try {
      const element = slipPreviewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        imageTimeout: 20000,
        onclone: (clonedDoc) => sanitizeClonedDocumentForPdf ? sanitizeClonedDocumentForPdf(clonedDoc) : undefined
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.autoPrint();
      const docTitle = previewSlipMode === 'prescription' 
        ? 'Rx Prescription' 
        : previewSlipMode === 'bill_receipt' 
          ? 'Payment Receipt' 
          : 'Patient OPD Slip';
      openPdfPrintWindow(pdf, docTitle);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Print preview error:', err);
      toast.dismiss(toastId);
      window.print();
    } finally {
      setPrintingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <SkeletonCard className="w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonInput />
          <SkeletonInput />
          <SkeletonInput />
          <SkeletonInput />
        </div>
        <SkeletonCard className="w-full" />
      </div>
    );
  }

  return (
    <>
      <div className={`max-w-4xl mx-auto ${showSlipPreviewModal ? 'no-print print:hidden' : ''}`}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hospital Configuration</h1>
          <p className="text-sm text-gray-500">Manage organization information, invoice formatting, and tax settings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSlipPreviewModal(true)}
            className="btn-secondary flex items-center gap-2 text-xs font-bold bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 shadow-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all"
            title="Preview Patient Slip and Prescription with current hospital settings"
          >
            <Eye className="h-4 w-4 text-orange-500" /> Preview Patient Slip
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto border-b border-orange-100 mb-6 bg-white p-1 rounded-xl shadow-sm space-x-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'profile'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'
          }`}
        >
          <Building2 className="h-4 w-4" /> Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoice')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'invoice'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'
          }`}
        >
          <Settings className="h-4 w-4" /> Invoice Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gst-discount')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'gst-discount'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'
          }`}
        >
          <Percent className="h-4 w-4" /> Apply discounts %
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('medication')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'medication'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'
          }`}
        >
          <Settings className="h-4 w-4" /> Medication Administration
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6 p-6">
        <input type="hidden" {...register('logoUrl')} />
        <input type="hidden" {...register('logoPublicId')} />
        <input type="hidden" {...register('letterheadImageUrl')} />
        <input type="hidden" {...register('letterheadImagePublicId')} />

        {/* ===================== TAB 1: PROFILE DETAILS ===================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-orange-100 pb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" /> Organization Profile Information
            </h3>

            {/* Logo Upload */}
            <div className="bg-orange-50/20 p-4 rounded-xl border border-orange-100 flex items-start gap-4">
              {previewLogo ? (
                <div className="relative">
                  <img
                    src={previewLogo}
                    alt="Hospital Logo"
                    className="h-24 w-24 object-contain rounded-lg border border-gray-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    title="Remove logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <label className="btn-secondary flex items-center gap-2 cursor-pointer w-fit py-2 px-3 text-xs">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="text-[10px] text-gray-500 mt-2">
                  Logo will print on standard Tax Invoices and Bill Summaries (grayscaled automatically for thermal/B&W prints). JPG, PNG up to 2MB.
                </p>
              </div>
            </div>

            {/* Top Letterhead Configuration (Prescription / OPD Slip Header) */}
            <div className="bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 p-5 rounded-2xl border border-orange-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" /> Prescription Top Letterhead Design
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose between a system-generated header or uploading your custom rectangular letterhead graphic for prescriptions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSlipPreviewModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    title="Preview patient slip layout with current letterhead settings"
                  >
                    <Eye className="h-3.5 w-3.5 text-orange-600" /> Preview Patient Slip
                  </button>
                  {/* Checkbox for System Generated Letterhead */}
                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-orange-200 shadow-2xs cursor-pointer hover:bg-orange-50/50 transition-colors">
                    <input
                      type="checkbox"
                      className="checkbox h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      {...register('useSystemLetterhead')}
                    />
                    <span className="text-xs font-bold text-gray-800 select-none">
                      Use System Generated Letterhead
                    </span>
                  </label>
                </div>
              </div>

              {/* Status Explanation Banner */}
              {useSystemLetterheadWatch ? (
                <div className="flex items-start gap-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-xs">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">System Generated Mode Active:</span> Prescriptions and slips will display the software's structured header (Hospital Name, Logo, Address, and Contact Numbers). When this box is checked, any uploaded letterhead image is hidden by default.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Photo Upload Letterhead Mode Active:</span> The uploaded rectangular letterhead image below will appear at the top across the full width of printed prescriptions.
                  </div>
                </div>
              )}

              {/* Rectangle Letterhead Upload and Preview Container */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Letterhead Photo (Rectangle Format Banner)
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Recommended: Wide rectangle banner (~2100 × 450 px or ~4.5:1 ratio)
                  </span>
                </div>

                {/* Rectangular Banner Frame */}
                <div className="relative w-full rounded-xl border-2 border-dashed border-orange-200 bg-white p-3 flex flex-col items-center justify-center min-h-[140px] overflow-hidden">
                  {previewLetterhead ? (
                    <div className="w-full space-y-2">
                      <div className="w-full h-32 sm:h-36 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shadow-inner">
                        <img
                          src={previewLetterhead}
                          alt="Letterhead Preview"
                          className="w-full h-full object-fill"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          ✓ Photo letterhead image ready
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5" />
                            {uploadingLetterhead ? 'Uploading...' : 'Change Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLetterheadUpload}
                              disabled={uploadingLetterhead}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleDeleteLetterhead}
                            className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center space-y-2.5">
                      <div className="mx-auto h-12 w-28 rounded-md border-2 border-dashed border-orange-300 flex items-center justify-center bg-orange-50/50">
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Rectangle</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">Upload Photo of Letterhead in Rectangle Format</p>
                        <p className="text-[11px] text-gray-500">Upload your hospital's printed header graphic (PNG or JPG)</p>
                      </div>
                      <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer py-2 px-4 text-xs font-bold">
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingLetterhead ? 'Uploading...' : 'Upload Letterhead Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLetterheadUpload}
                          disabled={uploadingLetterhead}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Height Fine-tuning */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-orange-100">
                <div>
                  <span className="text-xs font-bold text-gray-700 block">Top Header Height (in cm):</span>
                  <span className="text-[11px] text-gray-500 block">Default 4.60 cm for standard prescription letterheads.</span>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    className="input text-xs"
                    placeholder="4.60"
                    {...register('letterheadHeaderHeight')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hospital Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Hospital Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Enter official hospital name"
                  {...register('hospitalName', { required: true })}
                />
              </div>

              {/* Dynamic Contact Phone Numbers */}
              <div className="md:col-span-2 bg-orange-50/30 p-4 rounded-xl border border-orange-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall className="h-4 w-4 text-orange-500" /> Hospital Contact Numbers (Single / Multiple with Specific Name) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPhoneNumber}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-white hover:bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg shadow-2xs transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Phone Number
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Optionally give each number a specific name (e.g. "Emergency", "Reception", "Billing", "Pharmacy", "Helpdesk") or leave name empty for plain numbers. All entered numbers will print on OPD Slips and Prescriptions.
                </p>

                <div className="space-y-2 pt-1">
                  {phoneNumbersList.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-2xs">
                      <div className="w-full sm:w-2/5">
                        <input
                          type="text"
                          className="input text-xs"
                          placeholder="Name / Dept (e.g. Emergency, Reception)"
                          value={item.name}
                          onChange={(e) => handlePhoneChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          className="input text-xs flex-1"
                          placeholder="Phone Number (e.g. 9876543210) *"
                          value={item.number}
                          onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                        />
                        {phoneNumbersList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoneNumber(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Remove number"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternate Mobile (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-gray-400" /> Additional Mobile (Optional)
                </label>
                <input
                  className="input"
                  placeholder="e.g. 9876543211"
                  {...register('alternateMobileNumber')}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="contact@hospital.com"
                  {...register('emailAddress')}
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-gray-400" /> Website URL
                </label>
                <input
                  className="input"
                  placeholder="www.hospital.com"
                  {...register('website')}
                />
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  GST Registration Number
                </label>
                <input
                  className="input font-mono"
                  placeholder="29AAAAA1111A1Z1"
                  {...register('gstNumber')}
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  PAN Number (Optional)
                </label>
                <input
                  className="input font-mono"
                  placeholder="ABCDE1234F"
                  {...register('panNumber')}
                />
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Clinical Establishment Reg No.
                </label>
                <input
                  className="input"
                  placeholder="Reg No / License Code"
                  {...register('registrationNumber')}
                />
              </div>

              {/* DL Number (Drug License) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  DL Number (Drug License) (Optional)
                </label>
                <input
                  className="input"
                  placeholder="e.g. DL-123456"
                  {...register('dlNumber')}
                />
              </div>

              {/* Hospital Custom Heading */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Hospital Letterhead Heading (Optional)
                </label>
                <input
                  className="input"
                  placeholder="e.g. Multispeciality & Research Centre"
                  {...register('hospitalHeading')}
                />
              </div>

              {/* Full Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input"
                  placeholder="Enter full postal address"
                  rows={2}
                  {...register('address', { required: true })}
                />
              </div>

              {/* Invoice Footer Message */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Invoice Footer Declaration / Message
                </label>
                <textarea
                  className="input"
                  placeholder="e.g. Thank you for choosing us. Wishing you a speedy recovery."
                  rows={2}
                  {...register('invoiceFooterMessage')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: INVOICE CONFIG ===================== */}
        {activeTab === 'invoice' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-orange-100 pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" /> Invoice Number Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Invoice Prefix */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Invoice Prefix
                </label>
                <input
                  className="input font-mono font-bold"
                  placeholder="HOSP-INV-2026-"
                  {...register('invoicePrefix', { required: true })}
                />
                <p className="text-[10px] text-gray-500 mt-1">Leading text prefix before numbers</p>
              </div>

              {/* Current Counter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Next Counter Number
                </label>
                <input
                  type="number"
                  min="1"
                  className="input font-mono font-bold"
                  placeholder="1"
                  {...register('invoiceCounter', { required: true, min: 1 })}
                />
                <p className="text-[10px] text-gray-500 mt-1">Incremental sequential invoice ID</p>
              </div>

              {/* Format String */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Number Format Structure
                </label>
                <input
                  className="input"
                  placeholder="{PREFIX}{COUNTER}"
                  readOnly
                  {...register('invoiceFormat')}
                />
                <p className="text-[10px] text-gray-500 mt-1">Example output: HOSP-INV-2026-0001</p>
              </div>
            </div>

            <h3 className="text-base font-extrabold text-gray-900 border-b border-orange-100 pb-2 flex items-center gap-2 mt-6">
              <Settings className="h-4 w-4 text-orange-500" /> Treatment Pricing Configuration
            </h3>

            <div className="flex items-center gap-3 bg-orange-50/20 p-4 rounded-xl border border-orange-100/50 mb-6">
              <input
                type="checkbox"
                id="sdtPricingInBilling"
                className="rounded border-orange-200 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                {...register('sdtPricingInBilling')}
              />
              <div>
                <label htmlFor="sdtPricingInBilling" className="text-sm font-bold text-gray-900 cursor-pointer">
                  Decide Same Day Care Pricing at Billing Module
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  If enabled, billing officers can edit the base price of same day care treatments directly on the invoice builder before finalization.
                </p>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-start gap-3">
              <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <span className="font-extrabold">Invoice Number Rules:</span>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Invoice numbers are generated <span className="font-bold">automatically</span> upon finalization.</li>
                  <li>Draft bills do not increment the sequence, preventing breaks in tax sequences.</li>
                  <li>The next counter increments atomically in the database to prevent duplicate numbers.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: APPLY DISCOUNTS % ===================== */}
        {activeTab === 'gst-discount' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Access Discount & Reception Patient Due Switches */}
            <div className="bg-orange-50/20 p-5 rounded-2xl border border-orange-100/60 shadow-sm space-y-4 text-left">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="accessDiscount" className="cursor-pointer select-none">
                  <h4 className="text-sm font-extrabold text-gray-900">Access Discount Permission</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow direct item-wise or percentage discount entry in the billing module without requiring admin approval.
                  </p>
                </label>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    id="accessDiscount"
                    className="sr-only peer"
                    {...register('accessDiscount')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-orange-100/60 flex items-center justify-between gap-4">
                <label htmlFor="receptionSeePatientDue" className="cursor-pointer select-none">
                  <h4 className="text-sm font-extrabold text-gray-900">Reception Module Patient Due Display</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Show "Payment Due" column in Reception module patient list so receptionists can see pending patient due amounts.
                  </p>
                </label>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    id="receptionSeePatientDue"
                    className="sr-only peer"
                    {...register('receptionSeePatientDue')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-orange-100/60 flex items-center justify-between gap-4">
                <label htmlFor="dueModificationEnabled" className="cursor-pointer select-none">
                  <h4 className="text-sm font-extrabold text-gray-900">Due Amount & Line Item Modification Permission</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow editing line items (Description, Price, Discount, GST %, Qty), adding custom category items in Invoice Builder, and modifying due amounts.
                  </p>
                </label>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    id="dueModificationEnabled"
                    className="sr-only peer"
                    {...register('dueModificationEnabled')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="pt-2 border-t border-orange-100/50 flex justify-end">
                <button type="submit" className="btn text-xs py-2 px-4 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600">
                  <Save className="h-3.5 w-3.5" /> Save Settings
                </button>
              </div>
            </div>

            <h3 className="text-base font-extrabold text-gray-900 border-b border-orange-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Percent className="h-4.5 w-4.5 text-orange-500" /> Pending Discount Requests ({discountRequests.length})
              </span>
              <button
                type="button"
                onClick={loadDiscountRequests}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg"
              >
                Refresh
              </button>
            </h3>

            {loadingRequests ? (
              <div className="p-4">
                <SkeletonTable rows={4} columns={3} className="w-full" />
              </div>
            ) : discountRequests.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <p className="text-sm text-gray-400 font-bold">No pending discount requests found.</p>
                <p className="text-xs text-gray-400 mt-1">Requests appear here when billing staff checks "Request Admin Discount" in invoice builder.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {discountRequests.map(req => {
                  const subtotal = req.subtotal || 0;
                  const gstAmount = req.gstAmount || 0;
                  const totalBeforeDiscount = subtotal + gstAmount;
                  const adminPct = parseFloat(adminDiscounts[req._id]) || 0;
                  const discountAmount = subtotal * (adminPct / 100);
                  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
                  const gstAfterDiscount = req.gstPercentage ? discountedSubtotal * (req.gstPercentage / 100) : 0;
                  const netAfterDiscount = discountedSubtotal + gstAfterDiscount;

                  return (
                    <div key={req._id} className="bg-white rounded-xl border border-orange-100 p-5 shadow-xs space-y-4 text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-orange-50 pb-3">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Patient Details</span>
                          <h4 className="font-extrabold text-gray-900 text-sm mt-0.5">{req.patientName}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mt-0.5">
                            <span className="font-mono text-orange-700">{req.uhid}</span>
                            <span>•</span>
                            <span>{req.patientGender}</span>
                            <span>•</span>
                            <span>{req.patientMobile}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Draft Invoice Info</span>
                          <span className="text-xs text-gray-500 font-semibold mt-0.5 block">Type: <span className="font-bold text-gray-800">{req.billType} Only</span></span>
                          <span className="text-xs text-gray-500 font-semibold block">Requested: <span className="font-bold text-gray-800">{new Date(req.createdAt).toLocaleString('en-IN')}</span></span>
                        </div>
                      </div>

                      {/* Billed Items */}
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Billed Items</span>
                        <div className="flex flex-wrap gap-1.5">
                          {req.items?.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-150 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                              {item.description} (x{item.quantity}) - ₹{item.total.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Totals & Approve Form */}
                      <div className="bg-orange-50/20 rounded-xl border border-orange-100/50 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500"><span>Subtotal:</span><span className="font-bold text-gray-800">₹{subtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between text-xs text-gray-500"><span>GST ({req.gstPercentage}%):</span><span className="font-bold text-blue-700">+ ₹{gstAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between text-xs text-gray-500"><span>Discount ({adminPct.toFixed(2)}% of subtotal):</span><span className="font-bold text-green-700">- ₹{discountAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between text-xs text-gray-500"><span>{req.gstPercentage ? 'GST on discounted subtotal:' : 'GST not applied:'}</span><span className="font-bold text-blue-700">{req.gstPercentage ? `+ ₹${gstAfterDiscount.toFixed(2)}` : '₹0.00'}</span></div>
                          <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-orange-100/50 pt-1 mt-1"><span>Net after discount:</span><span>₹{netAfterDiscount.toFixed(2)}</span></div>
                          <div className="w-full sm:w-36">
                            <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Discount Percentage (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              className="input text-xs py-2 px-2.5 font-mono font-bold"
                              placeholder="e.g. 10"
                              value={adminDiscounts[req._id] ?? ''}
                              onChange={(e) => handleAdminDiscountPercentChange(req._id, e.target.value)}
                            />
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <button
                              type="button"
                              onClick={() => handleRejectRequest(req._id)}
                              className="btn-secondary py-2 px-4 text-xs font-bold text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 flex-1 sm:flex-initial"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req._id)}
                              className="btn py-2 px-4 text-xs font-bold flex-1 sm:flex-initial bg-green-600 hover:bg-green-700"
                            >
                              Approve & Finalize
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: MEDICATION ADMINISTRATION ===================== */}
        {activeTab === 'medication' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-orange-100 pb-2 flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-500" /> Medication Administration Configuration
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-600">Medication Grace Period (Minutes) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="input py-2.5 text-sm"
                  placeholder="e.g. 30"
                  {...register('medicationGracePeriod', { valueAsNumber: true })}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Configures the grace window within which administered medications are considered "On Time".
                </span>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-600">Missed Dose Threshold (Minutes) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="input py-2.5 text-sm"
                  placeholder="e.g. 60"
                  {...register('medicationMissedThreshold', { valueAsNumber: true })}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Configures the limit after which an unadministered medication is automatically marked as "Missed Dose".
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {activeTab !== 'gst-discount' && (
          <div className="pt-4 border-t border-orange-100 flex gap-2">
            <button type="submit" className="btn flex-1 py-3 flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {settings ? 'Save System Configuration' : 'Create System Configuration'}
            </button>
          </div>
        )}
      </form>
    </div>

    {/* Patient Slip & Prescription Preview Modal - Root level sibling to prevent DOM bleed */}
    {showSlipPreviewModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:m-0 print:static print:bg-transparent print:backdrop-blur-none animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:bg-transparent print:p-0 print:m-0">
          {/* Modal Header */}
          <div className="p-4 sm:px-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex items-center justify-between no-print print:hidden">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <Eye className="h-5 w-5" /> Patient Slip & Prescription Preview
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                Live preview showing how your hospital header, logo, contact numbers, and patient details will print.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintTestCopy}
                disabled={printingPdf}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Generate high resolution A4 PDF print"
              >
                <Printer className="h-4 w-4" /> {printingPdf ? 'Opening Print...' : 'Print Test Copy'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Direct browser print"
              >
                Direct Print
              </button>
              <button
                type="button"
                onClick={() => setShowSlipPreviewModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Subheader / Controls */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 no-print print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Format:</span>
              <div className="flex gap-1 bg-gray-200/80 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewSlipMode('patient_slip')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-all cursor-pointer ${
                    previewSlipMode === 'patient_slip' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  OPD Patient Slip
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSlipMode('prescription')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-all cursor-pointer ${
                    previewSlipMode === 'prescription' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Rx Prescription
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSlipMode('bill_receipt')}
                  className={`text-xs font-bold px-3 py-1 rounded transition-all cursor-pointer ${
                    previewSlipMode === 'bill_receipt' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Payment Receipt
                </button>
              </div>
            </div>

            {previewSlipMode !== 'bill_receipt' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Letterhead:</span>
                <div className="flex gap-1 bg-gray-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewLetterheadMode('auto')}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                      previewLetterheadMode === 'auto' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Follow current setting in form"
                  >
                    Active Setting ({watch('useSystemLetterhead') ? 'System' : 'Photo'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLetterheadMode('image')}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                      previewLetterheadMode === 'image' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🖼️ Photo Letterhead
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLetterheadMode('system')}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                      previewLetterheadMode === 'system' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⚙️ System Generated
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Body: A4 Paper Preview */}
          <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/80 flex-1 flex justify-center items-start print:p-0 print:m-0 print:bg-transparent print:overflow-visible print:block">
            <div className="bg-white shadow-2xl rounded-none w-full max-w-[210mm] border-none overflow-hidden print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-[210mm] print:m-0 print:p-0">
              <PatientReceipt
                ref={slipPreviewRef}
                patient={samplePatient}
                prescription={previewSlipMode === 'prescription' ? samplePrescription : null}
                hospitalSettings={getLiveHospitalSettingsForPreview()}
                mode={previewSlipMode === 'prescription' ? 'all' : previewSlipMode}
                letterheadMode={previewLetterheadMode}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between no-print print:hidden">
            <span className="text-[11px] text-gray-500 font-medium">
              Changes made to hospital name, phone numbers, or letterhead banner in this page update this preview immediately.
            </span>
            <button
              type="button"
              onClick={() => setShowSlipPreviewModal(false)}
              className="btn-secondary text-xs px-4 py-1.5 font-bold cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default HospitalSettings;

