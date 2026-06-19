import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, Save, Upload, X, Loader2, Info, Percent, Settings, ShieldAlert, FileText, Globe, Mail, PhoneCall } from 'lucide-react';
import client from '../../api/client';

const HospitalSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'invoice', 'gst-discount'

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
      invoiceFooterMessage: '',
      invoicePrefix: 'HOSP-INV-2026-',
      invoiceCounter: 1,
      invoiceFormat: '{PREFIX}{COUNTER}',
      discountEnabled: true,
      sdtPricingInBilling: true
    }
  });

  const discountEnabledWatch = watch('discountEnabled');

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

  const loadSettings = async () => {
    try {
      const { data } = await client.get('/admin/hospital-settings');
      if (data.exists && data.data) {
        setSettings(data.data);
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
          sdtPricingInBilling: data.data.sdtPricingInBilling !== undefined ? data.data.sdtPricingInBilling : true
        });
        setPreviewLogo(data.data.logoUrl);
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

   const onSubmit = async (data) => {
    try {
      const mobileNumbers = data.mobileNumbers
        .split(',')
        .map(num => num.trim())
        .filter(num => num.length > 0);

      if (mobileNumbers.length === 0) {
        toast.error('At least one mobile number is required');
        return;
      }

      const discountReasons = (data.discountReasons || 'Patient-Specific Discount')
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      const payload = {
        hospitalName: data.hospitalName,
        mobileNumbers,
        address: data.address,
        hospitalHeading: data.hospitalHeading || '',
        logoUrl: data.logoUrl || settings?.logoUrl || '',
        logoPublicId: data.logoPublicId || settings?.logoPublicId || '',
        alternateMobileNumber: data.alternateMobileNumber || '',
        emailAddress: data.emailAddress || '',
        website: data.website || '',
        gstNumber: data.gstNumber || '',
        panNumber: data.panNumber || '',
        registrationNumber: data.registrationNumber || '',
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
        sdtPricingInBilling: Boolean(data.sdtPricingInBilling)
      };

      await client.post('/admin/hospital-settings', payload);
      toast.success(settings ? 'Hospital settings updated successfully' : 'Hospital settings created successfully');
      loadSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save hospital settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hospital Configuration</h1>
          <p className="text-sm text-gray-500">Manage organization information, invoice formatting, and tax settings</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-orange-100 mb-6 bg-white p-1 rounded-xl shadow-sm">
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
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6 p-6">
        <input type="hidden" {...register('logoUrl')} />
        <input type="hidden" {...register('logoPublicId')} />

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

              {/* Mobile Numbers */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-gray-400" /> Mobile Numbers (Primary) <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. 9876543210"
                  {...register('mobileNumbers', { required: true })}
                />
              </div>

              {/* Alternate Mobile */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-gray-400" /> Alternate Mobile (Optional)
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
                  Decide Same Day Treatment Pricing at Billing Module
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  If enabled, billing officers can edit the base price of same day treatments directly on the invoice builder before finalization.
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
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="text-xs font-bold">Loading pending discount requests...</span>
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
  );
};

export default HospitalSettings;

