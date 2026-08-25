'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';
import PatientDetails from '../../components/PatientDetails';
import CaseDetails from '../../components/CaseDetails';
import ServiceSelector from '../../components/ServiceSelector';
import PaymentDetails from '../../components/PaymentDetails';
import LabBillReceipt from '../../components/LabBillReceipt';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { CheckCircle, AlertCircle, ArrowLeft, Printer } from 'lucide-react';

function NewBillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Receipt Modal State
  const [createdBillReceiptData, setCreatedBillReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Patient state
  const [patientData, setPatientData] = useState({
    patientId: null,
    uhid: '',
    mobileNumber: '',
    title: 'Mr.',
    firstName: '',
    lastName: '',
    gender: 'Male',
    ageYears: '',
    ageMonths: '',
    ageDays: '',
    onlineReport: false,
    email: '',
    address: '',
    aadhaar: '',
    history: ''
  });

  // Case details state
  const [caseData, setCaseData] = useState({
    referredBy: 'Self / Direct Walk-in',
    collectionCentre: 'Main Hospital Lab',
    sampleAgent: 'Self (Patient Walk-in)'
  });

  // Selected Category (default LAB)
  const [selectedCategory, setSelectedCategory] = useState('LAB');

  // Selected Services/Tests array
  const [selectedServices, setSelectedServices] = useState([]);

  // Payment State
  const [paymentData, setPaymentData] = useState({
    discountPercent: 0,
    amountReceived: 0,
    paymentMode: 'Cash',
    remarks: ''
  });

  // Auto-fill from query params (e.g. when redirected from OPD Lab Request)
  useEffect(() => {
    if (!searchParams) return;
    const pid = searchParams.get('patientId');
    const uhid = searchParams.get('uhid');
    const fn = searchParams.get('firstName');
    const ln = searchParams.get('lastName');
    const mobile = searchParams.get('mobile');
    const gender = searchParams.get('gender');
    const age = searchParams.get('age');
    const tests = searchParams.get('tests');
    const ref = searchParams.get('ref');

    if (fn || uhid || tests) {
      const timer = setTimeout(() => {
        setPatientData(prev => ({
          ...prev,
          patientId: pid || prev.patientId,
          uhid: uhid || prev.uhid,
          firstName: fn || prev.firstName,
          lastName: ln || prev.lastName,
          mobileNumber: mobile || prev.mobileNumber,
          gender: gender || prev.gender,
          ageYears: age || prev.ageYears
        }));

        if (ref) {
          setCaseData(prev => ({
            ...prev,
            referredBy: ref
          }));
        }

        if (tests) {
          const testArray = tests.split(',').filter(Boolean).map((t, idx) => ({
            id: `opd_test_${idx}`,
            title: t.trim(),
            category: 'LAB',
            price: 100
          }));
          setSelectedServices(testArray);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Add / remove test toggle
  const handleToggleService = (test) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === test.id || s.title === test.title);
      if (exists) {
        return prev.filter(s => !(s.id === test.id || s.title === test.title));
      } else {
        return [...prev, test];
      }
    });
  };

  const handleRemoveService = (service) => {
    setSelectedServices(prev => prev.filter(s => !(s.id === service.id || s.title === service.title)));
  };

  const handleUpdateServicePrice = (test, newPrice) => {
    setSelectedServices(prev =>
      prev.map(s =>
        (s.id && s.id === test.id) || (s.title && s.title === test.title)
          ? { ...s, price: Number(newPrice) }
          : s
      )
    );
  };

  // Submit Handler: Create Bill / Direct Request
  const handleCreateBill = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!patientData.firstName.trim()) {
      setErrorMessage('Please enter Patient First Name.');
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMessage('Please select at least one test / service for the bill.');
      return;
    }

    setSubmitting(true);

    try {
      let resolvedPatientId = patientData.patientId;

      // 1. Create or ensure patient exists if no patientId is linked yet
      if (!resolvedPatientId) {
        try {
          const birthYear = new Date().getFullYear() - (Number(patientData.ageYears) || 30);
          const calculatedDob = `${birthYear}-01-01`;

          const patientPayload = {
            patientName: `${patientData.firstName.trim()} ${patientData.lastName.trim()}`.trim(),
            gender: patientData.gender || 'Male',
            dob: calculatedDob,
            mobile: patientData.mobileNumber?.trim() || '9999999999',
            email: patientData.email || '',
            address: patientData.address?.trim() || 'Not specified',
            aadhaar: patientData.aadhaar || '',
            isEmergency: true
          };

          const newPatientRes = await api.post('/patients/create', patientPayload);
          if (newPatientRes && (newPatientRes._id || newPatientRes.patient?._id || newPatientRes.data?._id || newPatientRes.data?.patient?._id)) {
            resolvedPatientId = newPatientRes._id || newPatientRes.patient?._id || newPatientRes.data?._id || newPatientRes.data?.patient?._id;
          }
        } catch (patientErr) {
          console.warn('Patient creation response:', patientErr);
        }
      }

      if (!resolvedPatientId) {
        const lookup = await api.get('/patients/registrations/list').catch(() => []);
        if (Array.isArray(lookup) && lookup.length > 0) {
          resolvedPatientId = lookup[0]._id;
        }
      }

      if (!resolvedPatientId) {
        throw new Error('Unable to resolve patient record. Please check patient details.');
      }

      // 2. Submit Direct Lab Request / Bill
      const testNames = selectedServices.map(s => s.title);
      const billPayload = {
        patientId: resolvedPatientId,
        labRequestId: searchParams.get('requestId') || undefined,
        tests: testNames,
        collectionType: caseData.collectionCentre,
        bookingDate: new Date(),
        remarks: `${paymentData.remarks ? paymentData.remarks + ' | ' : ''}Referred by: ${caseData.referredBy}`,
        paymentMode: paymentData.paymentMode,
        discountPercent: Number(paymentData.discountPercent) || 0,
        amountReceived: Number(paymentData.amountReceived) || 0
      };

      const response = await api.post('/lab/requests/direct', billPayload);

      // Build receipt payload
      const totalAmt = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const discAmt = (totalAmt * (Number(paymentData.discountPercent) || 0)) / 100;
      const netAmt = Math.max(0, totalAmt - discAmt);
      const paidAmt = Number(paymentData.amountReceived) || netAmt;

      const staffName = user?.doctorName || user?.name || user?.username || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('hms_lab_user') || '{}')?.doctorName) || 'Staff';

      const receiptPayload = {
        billNo: response.labId || response.billNo || String(Math.floor(1000 + Math.random() * 9000)),
        categoryBadge: selectedCategory === 'LAB' ? 'L1' : selectedCategory,
        patientName: `${patientData.title} ${patientData.firstName} ${patientData.lastName}`.trim(),
        ageSex: `${patientData.ageYears || '25'} YRS / ${patientData.gender === 'Female' ? 'F' : 'M'}`,
        mobileNumber: patientData.mobileNumber || 'N/A',
        referredBy: caseData.referredBy || 'Self',
        date: new Date().toLocaleDateString('en-GB'),
        receivedBy: staffName,
        investigations: selectedServices.map((s, idx) => ({
          sno: idx + 1,
          name: s.title,
          amount: Number(s.price) || 0
        })),
        totalAmount: netAmt,
        amountPaid: paidAmt
      };

      setCreatedBillReceiptData(receiptPayload);
      setShowReceiptModal(true);

      setSuccessMessage(
        `Bill created successfully! ${response.message || 'Lab request generated.'}`
      );
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Create bill error:', err);
      setErrorMessage(
        err.data?.message || err.message || 'Failed to create bill. Please check required fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPatientData({
      patientId: null,
      uhid: '',
      mobileNumber: '',
      title: 'Mr.',
      firstName: '',
      lastName: '',
      gender: 'Male',
      ageYears: '',
      ageMonths: '',
      ageDays: '',
      onlineReport: false,
      email: '',
      address: '',
      aadhaar: '',
      history: ''
    });
    setSelectedServices([]);
    setSuccessMessage(null);
    setErrorMessage(null);
    setCreatedBillReceiptData(null);
    setShowReceiptModal(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Bill</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-6">
              Create patient registration and generate diagnostic lab billing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-3.5 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors"
            >
              View Dashboard
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="px-3 py-1 bg-orange-500 text-white rounded-md text-xs font-bold shadow-xs hover:bg-orange-600 flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill Receipt</span>
              </button>
              <button
                onClick={resetForm}
                className="px-3 py-1 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-xs hover:bg-emerald-700 cursor-pointer"
              >
                Create Another Bill
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1 border border-emerald-300 text-emerald-800 rounded-md text-xs font-bold hover:bg-emerald-100 cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION 1 — PATIENT DETAILS */}
        <PatientDetails
          patientData={patientData}
          setPatientData={setPatientData}
        />

        {/* SECTION 2 — CASE DETAILS & SERVICE CATEGORIES */}
        <CaseDetails
          caseData={caseData}
          setCaseData={setCaseData}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* TEST SELECTOR */}
        <ServiceSelector
          selectedCategory={selectedCategory}
          selectedServices={selectedServices}
          onToggleService={handleToggleService}
          onRemoveService={handleRemoveService}
          onUpdateServicePrice={handleUpdateServicePrice}
        />

        {/* SECTION 3 — PAYMENT DETAILS */}
        <PaymentDetails
          selectedServices={selectedServices}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          onRemoveService={handleRemoveService}
          onCreateBill={handleCreateBill}
          submitting={submitting}
        />

        {/* Bill Receipt Modal */}
        {showReceiptModal && createdBillReceiptData && (
          <LabBillReceipt
            billData={createdBillReceiptData}
            onClose={() => {
              setShowReceiptModal(false);
              router.push('/dashboard?view=todays-reports');
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function NewBillPage() {
  return (
    <ProtectedRoute>
      <NewBillContent />
    </ProtectedRoute>
  );
}
