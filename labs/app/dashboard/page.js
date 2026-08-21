'use client';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardLayout from '../../components/DashboardLayout';
import LabBillReceipt from '../../components/LabBillReceipt';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Loader2, 
  X, 
  Edit3, 
  Check, 
  Info, 
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  Eye,
  ArrowLeft,
  FileText,
  Sparkles,
  ExternalLink,
  MoreHorizontal,
  User,
  UserCheck,
  Trash2,
  Receipt,
  Wallet
} from 'lucide-react';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const isDueReportsView = searchParams.get('view') === 'due-reports';
  const isTodaysReportsView = searchParams.get('view') === 'todays-reports';
  const isSearchReportsView = searchParams.get('view') === 'search-reports';
  const isSignatoriesView = searchParams.get('view') === 'signatories';

  // Data States
  const [labRequests, setLabRequests] = useState([]);
  const [availableLabTests, setAvailableLabTests] = useState([]);
  const [labBills, setLabBills] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Controls & Filters (Today's Reports)
  const [searchInPage, setSearchInPage] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('new'); // 'all' | 'new' | 'create_bill' | 'in_progress' | 'final' | 'signed_off'
  const [sortOrder, setSortOrder] = useState('oldest');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [dueSearchQuery, setDueSearchQuery] = useState('');

  // Signatories State
  const [signatories, setSignatories] = useState([]);
  const [loadingSignatories, setLoadingSignatories] = useState(false);
  const [signatoryForm, setSignatoryForm] = useState({
    name: '',
    designation: '',
    qualification: '',
    signatureImageUrl: ''
  });
  const [editingSignatoryId, setEditingSignatoryId] = useState(null);
  const [savingSignatory, setSavingSignatory] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);

  // Search Lab Reports View Filter States
  const [searchDuration, setSearchDuration] = useState('past_7_days');
  const [searchPatientName, setSearchPatientName] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');
  const [searchReferredBy, setSearchReferredBy] = useState('all');
  const [searchRegNo, setSearchRegNo] = useState('');
  const [searchDailyCaseNo, setSearchDailyCaseNo] = useState('');
  const [searchUhid, setSearchUhid] = useState('');
  const [searchSelectedTest, setSearchSelectedTest] = useState('all');
  const [showAllFilters, setShowAllFilters] = useState(true);

  // Result Processing Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [parameterValues, setParameterValues] = useState({});
  const [reportRemarks, setReportRemarks] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // New Full Page Report Entry View States
  const [showReportEntryView, setShowReportEntryView] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [reportAdvice, setReportAdvice] = useState('');
  const [reportInterpretation, setReportInterpretation] = useState('');
  const [parameterRemarks, setParameterRemarks] = useState({});
  const [expandedRemarks, setExpandedRemarks] = useState({});
  const [showRuleModalParam, setShowRuleModalParam] = useState('');
  const [ruleModalRules, setRuleModalRules] = useState([]);
  const [showReportEntryTab, setShowReportEntryTab] = useState(''); // 'notes' | 'remarks' | 'advice' | 'interpretation'
  const [datesInfo, setDatesInfo] = useState({
    collectedDate: '',
    collectedTime: '',
    receivedDate: '',
    receivedTime: '',
    reportedDate: '',
    reportedTime: ''
  });

  // Value Predefined Choices States
  const [activeValueOptionsDropdown, setActiveValueOptionsDropdown] = useState(''); // parameter name
  const [activePlusMenu, setActivePlusMenu] = useState(''); // parameter name for add options/remark menu
  const [newValueOptionText, setNewValueOptionText] = useState('');
  const [newValueOptionAbnormal, setNewValueOptionAbnormal] = useState(false);
  const [editingValueOptionIdx, setEditingValueOptionIdx] = useState(null);

  // Bill Receipt View Modal
  const [viewingReceiptData, setViewingReceiptData] = useState(null);

  // Lab Report Printing States
  const [showReportPrintModal, setShowReportPrintModal] = useState(false);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);
  const [showReportSavedModal, setShowReportSavedModal] = useState(false);
  const [savedReportRequest, setSavedReportRequest] = useState(null);

  // Payment Collection Modal State
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [hospitalSettings, setHospitalSettings] = useState(null);

  const isAdminUser = user?.role === 'admin' || user?.role === 'lab_admin' || user?.role === 'labadmin' || user?.role === 'superadmin';

  const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePreviousDay = () => {
    const current = parseDateStr(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatDate(current));
  };

  const handleNextDay = () => {
    const current = parseDateStr(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(formatDate(current));
  };

  const loadSignatories = async () => {
    setLoadingSignatories(true);
    try {
      const res = await api.get('/lab/signatories');
      setSignatories(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSignatories(false);
    }
  };

  const handleSaveSignatory = async (e) => {
    e.preventDefault();
    if (!signatoryForm.name.trim() || !signatoryForm.designation.trim() || !signatoryForm.qualification.trim()) {
      alert('Name, designation, and qualification are required');
      return;
    }

    setSavingSignatory(true);
    try {
      if (editingSignatoryId) {
        await api.put(`/lab/signatories/${editingSignatoryId}`, signatoryForm);
      } else {
        await api.post('/lab/signatories', signatoryForm);
      }
      setSignatoryForm({ name: '', designation: '', qualification: '', signatureImageUrl: '' });
      setEditingSignatoryId(null);
      loadSignatories();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save signatory');
    } finally {
      setSavingSignatory(false);
    }
  };

  const handleEditSignatory = (sig) => {
    setEditingSignatoryId(sig._id);
    setSignatoryForm({
      name: sig.name || '',
      designation: sig.designation || '',
      qualification: sig.qualification || '',
      signatureImageUrl: sig.signatureImageUrl || ''
    });
  };

  const handleDeleteSignatory = async (sigId) => {
    if (!confirm('Are you sure you want to remove this signatory?')) return;
    try {
      await api.delete(`/lab/signatories/${sigId}`);
      loadSignatories();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to delete signatory');
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert('Signature image size should not exceed 200kb');
      return;
    }

    setUploadingSign(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await api.post('/lab/upload-image', {
          image: reader.result,
          folder: 'hms/lab-signatures'
        });
        setSignatoryForm(prev => ({ ...prev, signatureImageUrl: res.url }));
      } catch (err) {
        alert('Image upload failed');
      } finally {
        setUploadingSign(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const findMatchedTest = (testName) => {
    if (!testName) return null;
    const query = String(testName).toLowerCase();
    const queryNorm = query.replace(/[^a-z0-9]/g, '');

    return availableLabTests.find(t => {
      const tTitle = String(t.title || '').toLowerCase();
      const tTest = String(t.test || '').toLowerCase();
      const titleNorm = tTitle.replace(/[^a-z0-9]/g, '');
      const testNorm = tTest.replace(/[^a-z0-9]/g, '');

      // Direct normalized matches
      if (titleNorm === queryNorm || testNorm === queryNorm) return true;
      if (titleNorm && queryNorm && (titleNorm.includes(queryNorm) || queryNorm.includes(titleNorm))) return true;
      if (testNorm && queryNorm && (testNorm.includes(queryNorm) || queryNorm.includes(testNorm))) return true;

      // Word-based subset match
      const getWords = (str) => str.split(/[^a-z0-9]+/g).filter(w => w.length > 1);
      const qWords = getWords(query);
      const tWords = getWords(tTitle);
      const testWords = getWords(tTest);
      
      if (qWords.length > 0) {
        if (tWords.length > 0) {
          const allQInT = qWords.every(w => tWords.includes(w));
          const allTInQ = tWords.every(w => qWords.includes(w));
          if (allQInT || allTInQ) return true;
        }
        if (testWords.length > 0) {
          const allQInTest = qWords.every(w => testWords.includes(w));
          const allTestInQ = testWords.every(w => qWords.includes(w));
          if (allQInTest || allTestInQ) return true;
        }
      }

      return false;
    });
  };

  const handlePrintReport = (reportData) => {
    if (!reportData) return;
    const patient = reportData.patientId || {};
    let ageStr = '—';
    if (patient.age) {
      ageStr = `${patient.age} YRS`;
    } else if (patient.dob) {
      const birthDate = new Date(patient.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      ageStr = `${calculatedAge} YRS`;
    }

    let genderStr = '—';
    if (patient.gender) {
      genderStr = String(patient.gender).toLowerCase().startsWith('f') ? 'F' : 'M';
    }

    const testList = Array.isArray(reportData.tests) 
      ? reportData.tests 
      : (typeof reportData.tests === 'string' 
          ? reportData.tests.split(',').map(t => t.trim()) 
          : []);
    
    const regDateStr = reportData.createdAt 
      ? new Date(reportData.createdAt).toLocaleDateString('en-GB') + ' ' + new Date(reportData.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '';
    const reportDateStr = reportData.updatedAt
      ? new Date(reportData.updatedAt).toLocaleDateString('en-GB') + ' ' + new Date(reportData.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '';

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      showToast('Popup blocker prevented opening the print window. Please allow popups for this site.', 'error');
      return;
    }
    
    let letterheadHtml = '';
    if (hospitalSettings?.letterheadImageUrl) {
      letterheadHtml = `
        <div style="height: ${hospitalSettings.letterheadHeaderHeight || 4.6}cm; width: 100%; overflow: hidden; margin-bottom: 16px;">
          <img src="${hospitalSettings.letterheadImageUrl}" style="width: 100%; height: 100%; object-fit: fill;" />
        </div>
      `;
    } else {
      letterheadHtml = `
        <div style="width: 100%; border-bottom: 2px solid #000000; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; font-family: sans-serif;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${hospitalSettings?.logoUrl ? `<img src="${hospitalSettings.logoUrl}" style="width: 64px; height: 64px; object-fit: contain;" />` : `<div style="width: 64px; height: 64px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #94a3b8; font-size: 12px;">LOGO</div>`}
            <div style="text-align: left;">
              <h1 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2;">${hospitalSettings?.hospitalName || user?.hospitalName || 'Virtual Care Hospital'}</h1>
              ${hospitalSettings?.hospitalHeading ? `<p style="font-size: 10px; font-weight: bold; color: #64748b; margin: 2px 0 0 0;">${hospitalSettings.hospitalHeading}</p>` : ''}
              <p style="font-size: 9px; color: #64748b; margin: 4px 0 0 0; max-width: 400px; font-weight: 500;">${hospitalSettings?.address || '123 Care Street, Medical Zone'}</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 9px; color: #64748b; line-height: 1.4;">
            ${hospitalSettings?.mobileNumbers && hospitalSettings.mobileNumbers.length > 0 ? `<p style="font-weight: bold; margin: 0;">📞 ${hospitalSettings.mobileNumbers.join(', ')}</p>` : ''}
            ${hospitalSettings?.emailAddress ? `<p style="margin: 2px 0 0 0;">✉ ${hospitalSettings.emailAddress}</p>` : ''}
            ${hospitalSettings?.website ? `<p style="margin: 2px 0 0 0;">🌐 ${hospitalSettings.website}</p>` : ''}
          </div>
        </div>
      `;
    }

    let rowsHtml = '';
    testList.forEach(tName => {
      const matchedTest = findMatchedTest(tName);
      const testParams = matchedTest && Array.isArray(matchedTest.parameters) ? matchedTest.parameters : [];
      
      rowsHtml += `
        <tr style="background: #f8fafc;">
          <td colspan="4" style="padding: 8px 16px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
            ${tName}
          </td>
        </tr>
      `;

      testParams.filter((p) => {
        const patientGender = patient?.gender?.toLowerCase() || '';
        const pGender = (p.gender || 'both').toLowerCase();
        if (pGender === 'male' && patientGender !== 'male') return false;
        if (pGender === 'female' && patientGender !== 'female') return false;
        return true;
      }).forEach(p => {
        const rVal = reportData.report?.parameters?.find(rp => rp.name === p.name);
        const valText = rVal ? rVal.value : '';
        const isBad = isOutOfRange(p.name, valText) || (rVal && rVal.isAbnormal);
        
        let statusSuffix = '';
        if (p.referenceRange && p.referenceRange.trim() !== '' && p.referenceRange !== 'As per standards') {
          const status = getValueRangeStatus(p.name, valText);
          if (status === 'H') statusSuffix = ' (H)';
          if (status === 'L') statusSuffix = ' (L)';
        }

        rowsHtml += `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 16px; font-weight: bold; color: #334155; text-transform: uppercase; width: 40%;">${p.name}</td>
            <td style="padding: 8px 16px; font-weight: ${isBad ? '900' : 'bold'}; color: ${isBad ? '#ef4444' : '#0f172a'}; width: 20%;">${valText}${statusSuffix}</td>
            <td style="padding: 8px 16px; font-weight: 600; color: #64748b; width: 20%;">${p.unit || '—'}</td>
            <td style="padding: 8px 16px; font-weight: bold; color: #334155; width: 20%;">${p.referenceRange || 'As per standards'}</td>
          </tr>
        `;
      });
    });

    const isInterpretationEmpty = !reportData.report?.interpretation || reportData.report.interpretation.trim() === '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Lab Report - ${patient.patientName || 'Patient'}</title>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #1e293b;
            }
            .container {
              padding: 24px;
              padding-top: ${hospitalSettings?.letterheadHeaderHeight || 0}cm;
              padding-bottom: ${hospitalSettings?.letterheadFooterHeight || 0}cm;
              max-width: 800px;
              margin: 0 auto;
              box-sizing: border-box;
            }
            .table-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              overflow: hidden;
              margin-top: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th {
              background: #f1f5f9;
              padding: 10px 16px;
              font-weight: 800;
              text-align: left;
              color: #1e293b;
              border-bottom: 2px solid #cbd5e1;
            }
            td {
              text-align: left;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(12, 1fr);
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-top: 16px;
              gap: 16px;
              font-size: 11px;
            }
            .col-6 {
              grid-column: span 6;
            }
            .row-flex {
              display: flex;
              line-height: 1.6;
            }
            .label {
              width: 33%;
              color: #64748b;
              font-weight: bold;
            }
            .value {
              width: 67%;
              color: #0f172a;
              font-weight: 900;
            }
            .text-right {
              text-align: right;
            }
            .pr-2 {
              padding-right: 8px;
            }
            .italic-box {
              font-style: italic;
              font-size: 11px;
              color: #475569;
              margin-top: 12px;
            }
            .signatory-box {
              display: flex;
              justify-content: flex-end;
              margin-top: 48px;
              text-align: right;
              font-size: 11px;
            }
            .signature-img {
              max-height: 48px;
              object-fit: contain;
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${letterheadHtml}
            
            <div class="grid-container">
              <div class="col-6">
                <h2 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${patient.patientName || 'Patient Name'}</h2>
                <div class="row-flex"><span class="label">Age / Sex</span><span class="value">: ${ageStr} / ${genderStr}</span></div>
                <div class="row-flex"><span class="label">Referred by</span><span class="value">: ${reportData.remarks || 'Self'}</span></div>
                <div class="row-flex"><span class="label">Reg. no.</span><span class="value">: ${reportData.labId || '—'}</span></div>
              </div>
              <div class="col-6" style="display: flex; flex-direction: column; align-items: flex-end;">
                <div style="width: 100%; max-width: 280px;">
                  <div class="row-flex"><span class="label" style="width: 40%; text-align: right; padding-right: 8px;">Registered</span><span class="value" style="width: 60%;">: ${regDateStr || '—'}</span></div>
                  <div class="row-flex"><span class="label" style="width: 40%; text-align: right; padding-right: 8px;">Collected</span><span class="value" style="width: 60%;">: ${datesInfo.collectedDate || '—'}</span></div>
                  <div class="row-flex"><span class="label" style="width: 40%; text-align: right; padding-right: 8px;">Received</span><span class="value" style="width: 60%;">: ${datesInfo.receivedDate || '—'}</span></div>
                  <div class="row-flex"><span class="label" style="width: 40%; text-align: right; padding-right: 8px;">Reported</span><span class="value" style="width: 60%;">: ${reportDateStr || '—'}</span></div>
                </div>
              </div>
            </div>

            <div style="padding: 8px 0; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <h3 style="font-size: 12px; font-weight: 900; letter-spacing: 2px; color: #0f172a; margin: 0; text-transform: uppercase;">
                ${reportData.category || 'BIOCHEMISTRY'}
              </h3>
            </div>

            <div class="table-box">
              <table>
                <thead>
                  <tr>
                    <th style="width: 40%;">TEST</th>
                    <th style="width: 20%;">VALUE</th>
                    <th style="width: 20%;">UNIT</th>
                    <th style="width: 20%;">REFERENCE</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>

            ${reportData.report?.notes ? `<div class="italic-box"><b>Notes:</b> ${reportData.report.notes}</div>` : ''}
            ${reportData.report?.remarks ? `<div class="italic-box"><b>Remarks:</b> ${reportData.report.remarks}</div>` : ''}
            ${reportData.report?.advice ? `<div class="italic-box"><b>Advice:</b> ${reportData.report.advice}</div>` : ''}
            
            ${!isInterpretationEmpty ? `
              <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <h4 style="font-size: 11px; font-weight: 900; margin: 0 0 6px 0; text-transform: uppercase;">Interpretation</h4>
                <div style="font-size: 10px; line-height: 1.5; color: #334155; white-space: pre-line;">${reportData.report.interpretation}</div>
              </div>
            ` : ''}

            ${reportData.report?.signatoryId ? `
              <div class="signatory-box">
                <div>
                  ${reportData.report.signatoryId.signatureImageUrl ? `<img src="${reportData.report.signatoryId.signatureImageUrl}" style="max-height: 48px; object-fit: contain; margin-bottom: 4px;" /><br/>` : ''}
                  <b>${reportData.report.signatoryId.name}</b><br/>
                  <span>${reportData.report.signatoryId.qualification}</span><br/>
                  <span>${reportData.report.signatoryId.designation}</span>
                </div>
              </div>
            ` : ''}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [reqs, tests, bills, settingsRes] = await Promise.all([
        api.get('/lab/requests').catch(() => []),
        api.get('/lab/tests').catch(() => []),
        api.get('/lab/bills').catch(() => []),
        api.get('/admin/hospital-settings').catch(() => null)
      ]);
      setLabRequests(Array.isArray(reqs) ? reqs : []);
      setAvailableLabTests(Array.isArray(tests) ? tests : []);
      setLabBills(Array.isArray(bills) ? bills : []);
      if (settingsRes && settingsRes.exists && settingsRes.data) {
        setHospitalSettings(settingsRes.data);
      }
      loadSignatories();
    } catch (err) {
      console.error('Failed to load lab dashboard data', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Formats lab request data into Today's Reports row objects
  const rawReportsList = (labRequests.length > 0 ? labRequests : [
    {
      _id: 'req_demo_1072',
      labId: '1072',
      category: 'L1',
      createdAt: new Date().toISOString(),
      patientId: { patientName: 'Mr. Ravi Shukla', age: 25, gender: 'Male', uhid: 'UH1072', mobile: '8949895216' },
      remarks: 'Referred by: Self',
      tests: ['Dengue IgG'],
      collectionType: 'Main',
      reportStatus: 'New',
      status: 'pending'
    }
  ]).map((req, idx) => {
    const matchedBill = labBills.find(b => b.labRequestId === req._id || b.labId === req.labId);
    const dateObj = req.createdAt ? new Date(req.createdAt) : new Date();
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const hasValidBill = Boolean(
      (matchedBill && (matchedBill.paidAmount > 0 || matchedBill.paymentStatus === 'Paid' || matchedBill.paymentStatus === 'Partial' || (Array.isArray(matchedBill.payments) && matchedBill.payments.length > 0))) ||
      (req.billingRecord && (req.billingRecord.paidAmount > 0 || req.billingRecord.paymentStatus === 'Paid' || req.billingRecord.paymentStatus === 'Partial' || (Array.isArray(req.billingRecord.payments) && req.billingRecord.payments.length > 0)))
    );

    const needsBill = !hasValidBill && req.reportStatus !== 'Completed' && req.reportStatus !== 'Signed off' && req.reportStatus !== 'Draft' && req.reportStatus !== 'In progress';

    let statusTag = 'New';
    let statusCategory = 'new';

    if (req.reportStatus === 'Completed' || req.status === 'completed') {
      statusTag = 'Final';
      statusCategory = 'final';
    } else if (req.reportStatus === 'Signed off') {
      statusTag = 'Signed off';
      statusCategory = 'signed_off';
    } else if (req.reportStatus === 'Draft' || req.reportStatus === 'In progress') {
      statusTag = 'In progress';
      statusCategory = 'in_progress';
    } else if (needsBill) {
      statusTag = 'Create bill';
      statusCategory = 'create_bill';
    } else {
      statusTag = 'New';
      statusCategory = 'new';
    }

    const regNo = req.labId ? (req.labId.startsWith('#') ? req.labId : `#${req.labId}`) : `#1072`;
    const modBadge = req.category || 'L1';
    const pName = req.patientId?.patientName || 'Mr. Ravi Shukla';
    const ageVal = req.patientId?.age || 25;
    const genderVal = req.patientId?.gender?.[0]?.toUpperCase() || 'M';
    const ageSexStr = `${ageVal} YRS/${genderVal}`;

    let refBy = 'Self';
    if (req.remarks && req.remarks.includes('Referred by:')) {
      refBy = req.remarks.split('Referred by:')[1].trim();
    }

    const testsStr = Array.isArray(req.tests) ? req.tests.join(', ') : (req.tests || 'Dengue IgG');
    const ccVal = req.collectionType || 'Main';
    const dateStr = dateObj.toLocaleDateString('en-GB'); // "19/08/2026"

    // Determine request origin (OPD / IPD / Direct Walk-in)
    let source = 'OPD';
    if (req.remarks && req.remarks.toLowerCase().includes('ipd')) {
      source = 'IPD';
    } else if (Array.isArray(req.statusHistory) && req.statusHistory.some(sh => sh.notes && sh.notes.toLowerCase().includes('ipd'))) {
      source = 'IPD';
    } else if (req.doctorId?.department || (req.patientId && req.patientId.department) || (Array.isArray(req.statusHistory) && req.statusHistory.some(sh => sh.notes && sh.notes.toLowerCase().includes('lab request created')))) {
      source = 'OPD';
    } else if (matchedBill && matchedBill.paidAmount > 0 && !req.isOpd) {
      source = 'Direct';
    } else {
      source = 'OPD';
    }

    const isOpdOrIpd = source === 'OPD' || source === 'IPD' || needsBill;

    return {
      id: req._id,
      regNo,
      modBadge,
      time: timeStr,
      dateStr,
      createdAtDate: dateObj,
      patientName: pName,
      ageSex: ageSexStr,
      mobile: req.patientId?.mobile || '8949895216',
      referredBy: refBy,
      tests: testsStr,
      cc: ccVal,
      status: statusTag,
      statusCategory,
      needsBill,
      source,
      isOpdOrIpd,
      rawRequest: req,
      rawBill: matchedBill
    };
  });

  const reportsForSelectedDate = rawReportsList.filter(item => item.dateStr === selectedDate);

  // Filter list based on search and active tab filter (Today's Reports)
  const filteredReports = reportsForSelectedDate.filter(item => {
    const q = searchInPage.toLowerCase();
    const matchesSearch = !q || (
      item.regNo.toLowerCase().includes(q) ||
      item.patientName.toLowerCase().includes(q) ||
      item.tests.toLowerCase().includes(q) ||
      item.referredBy.toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (activeTabFilter === 'all') return true;
    if (activeTabFilter === 'new') return item.statusCategory === 'new';
    if (activeTabFilter === 'create_bill') return item.statusCategory === 'create_bill';
    if (activeTabFilter === 'in_progress') return item.statusCategory === 'in_progress';
    if (activeTabFilter === 'final') return item.statusCategory === 'final';
    if (activeTabFilter === 'signed_off') return item.statusCategory === 'signed_off';
    return true;
  });

  const countAll = reportsForSelectedDate.length;
  const countNew = reportsForSelectedDate.filter(r => r.statusCategory === 'new').length;
  const countCreateBill = reportsForSelectedDate.filter(r => r.statusCategory === 'create_bill').length;
  const countInProgress = reportsForSelectedDate.filter(r => r.statusCategory === 'in_progress').length;
  const countFinal = reportsForSelectedDate.filter(r => r.statusCategory === 'final').length;
  const countSignedOff = reportsForSelectedDate.filter(r => r.statusCategory === 'signed_off').length;

  // Search Lab Reports filtered list
  const searchFilteredReports = rawReportsList.filter(item => {
    // 1. Patient Name filter
    if (searchPatientName && !item.patientName.toLowerCase().includes(searchPatientName.toLowerCase())) {
      return false;
    }
    // 2. Status filter
    if (searchStatus && searchStatus !== 'all') {
      if (searchStatus === 'new' && item.statusCategory !== 'new') return false;
      if (searchStatus === 'create_bill' && item.statusCategory !== 'create_bill') return false;
      if (searchStatus === 'in_progress' && item.statusCategory !== 'in_progress') return false;
      if (searchStatus === 'final' && item.statusCategory !== 'final') return false;
      if (searchStatus === 'signed_off' && item.statusCategory !== 'signed_off') return false;
    }
    // 3. Referred by filter
    if (searchReferredBy && searchReferredBy !== 'all' && !item.referredBy.toLowerCase().includes(searchReferredBy.toLowerCase())) {
      return false;
    }
    // 4. Reg No filter
    if (searchRegNo && !item.regNo.toLowerCase().includes(searchRegNo.toLowerCase())) {
      return false;
    }
    // 5. Daily case no filter
    if (searchDailyCaseNo && !item.regNo.toLowerCase().includes(searchDailyCaseNo.toLowerCase())) {
      return false;
    }
    // 6. UHID filter
    if (searchUhid) {
      const u = item.rawRequest?.patientId?.uhid || item.rawBill?.patientId?.uhid || '';
      if (!u.toLowerCase().includes(searchUhid.toLowerCase())) return false;
    }
    // 7. Test filter
    if (searchSelectedTest && searchSelectedTest !== 'all') {
      if (!item.tests.toLowerCase().includes(searchSelectedTest.toLowerCase())) return false;
    }
    // 8. Duration filter
    if (searchDuration && searchDuration !== 'all') {
      const now = new Date();
      const itemDate = item.createdAtDate || new Date();
      
      if (searchDuration === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (itemDate < startOfToday) return false;
      } else if (searchDuration === 'yesterday') {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (itemDate < startOfYesterday || itemDate >= endOfYesterday) return false;
      } else if (searchDuration === 'past_7_days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < sevenDaysAgo) return false;
      } else if (searchDuration === 'past_30_days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < thirtyDaysAgo) return false;
      } else if (searchDuration === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (itemDate < startOfMonth) return false;
      } else if (searchDuration === 'last_month') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        if (itemDate < startOfLastMonth || itemDate > endOfLastMonth) return false;
      }
    }
    return true;
  });

  const getDurationDateRangeStr = (dur) => {
    const now = new Date();
    const formatDate = (d) => {
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    if (dur === 'today') {
      return `${formatDate(now)} to ${formatDate(now)}`;
    } else if (dur === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return `${formatDate(yesterday)} to ${formatDate(yesterday)}`;
    } else if (dur === 'past_7_days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${formatDate(sevenDaysAgo)} to ${formatDate(now)}`;
    } else if (dur === 'past_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `${formatDate(thirtyDaysAgo)} to ${formatDate(now)}`;
    } else if (dur === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${formatDate(startOfMonth)} to ${formatDate(now)}`;
    } else if (dur === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return `${formatDate(startOfLastMonth)} to ${formatDate(endOfLastMonth)}`;
    }
    return 'All time';
  };

  const handleClearSearchFilters = () => {
    setSearchDuration('past_7_days');
    setSearchPatientName('');
    setSearchStatus('all');
    setSearchReferredBy('all');
    setSearchRegNo('');
    setSearchDailyCaseNo('');
    setSearchUhid('');
    setSearchSelectedTest('all');
  };

  const availableReferrers = Array.from(new Set(rawReportsList.map(r => r.referredBy).filter(Boolean)));

  const handleOpenProcessRequest = (reqItem) => {
    setSelectedRequest(reqItem);
    setReportRemarks(reqItem.report?.remarks || '');
    setReportNotes(reqItem.report?.notes || '');
    setReportAdvice(reqItem.report?.advice || '');
    setReportInterpretation(reqItem.report?.interpretation || '');
    setShowReportEntryTab('');

    const initialParams = {};
    const initialRemarks = {};
    const testNames = Array.isArray(reqItem.tests) 
      ? reqItem.tests 
      : (typeof reqItem.tests === 'string' 
          ? reqItem.tests.split(',').map(t => t.trim()) 
          : []);
    
    const normalizeString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    let defaultInterpretation = '';

    testNames.forEach(tName => {
      const tNameNorm = normalizeString(tName);
      const matchedTest = findMatchedTest(tName);

      if (matchedTest) {
        if (matchedTest.interpretation) {
          defaultInterpretation = matchedTest.interpretation;
        }

        if (matchedTest && Array.isArray(matchedTest.parameters)) {
          matchedTest.parameters.forEach(p => {
            const existingParam = reqItem.report?.parameters?.find(ep => ep.name === p.name);
            initialParams[p.name] = existingParam ? existingParam.value : '';
            initialRemarks[p.name] = existingParam ? (existingParam.remarks || '') : '';
          });
        }
      }
    });

    setReportInterpretation(reqItem.report?.interpretation || defaultInterpretation || '');

    if (Array.isArray(reqItem.report?.parameters)) {
      reqItem.report.parameters.forEach(p => {
        if (!initialParams[p.name]) {
          initialParams[p.name] = p.value || '';
        }
        if (!initialRemarks[p.name]) {
          initialRemarks[p.name] = p.remarks || '';
        }
      });
    }

    const reqDate = reqItem.createdAt ? new Date(reqItem.createdAt) : new Date();
    const formatD = (d) => d.toISOString().split('T')[0];
    const formatT = (d) => d.toTimeString().slice(0, 5);

    setDatesInfo({
      collectedDate: reqItem.report?.collectedDate ? formatD(new Date(reqItem.report.collectedDate)) : formatD(reqDate),
      collectedTime: reqItem.report?.collectedTime || formatT(reqDate),
      receivedDate: reqItem.report?.receivedDate ? formatD(new Date(reqItem.report.receivedDate)) : formatD(reqDate),
      receivedTime: reqItem.report?.receivedTime || formatT(reqDate),
      reportedDate: reqItem.report?.reportedDate ? formatD(new Date(reqItem.report.reportedDate)) : formatD(reqDate),
      reportedTime: reqItem.report?.reportedTime || formatT(reqDate)
    });

    setParameterValues(initialParams);
    setParameterRemarks(initialRemarks);
    
    const initialExpanded = {};
    Object.entries(initialRemarks).forEach(([pName, pRem]) => {
      if (pRem) initialExpanded[pName] = true;
    });
    setExpandedRemarks(initialExpanded);

    setShowReportEntryView(true);
    setShowProcessModal(false);
  };

  const handleParamValueChange = (paramName, val) => {
    setParameterValues({
      ...parameterValues,
      [paramName]: val
    });
  };

  const handleSaveReport = async (statusToSet = 'completed') => {
    if (!selectedRequest) return;
    setSavingReport(true);
    try {
      const formattedParameters = Object.entries(parameterValues).map(([pName, pVal]) => {
        let refRange = '';
        let unit = '';
        let refRules = [];
        let valOptions = [];
        availableLabTests.forEach(t => {
          if (Array.isArray(t.parameters)) {
            const found = t.parameters.find(p => p.name === pName);
            if (found) {
              refRange = found.referenceRange || '';
              unit = found.unit || '';
              refRules = found.referenceRules || [];
              valOptions = found.valueOptions || [];
            }
          }
        });
        return {
          name: pName,
          value: pVal,
          referenceRange: refRange,
          unit: unit,
          remarks: parameterRemarks[pName] || '',
          referenceRules: refRules,
          valueOptions: valOptions
        };
      });

      if (statusToSet === 'completed' || statusToSet === 'signed_off') {
        for (const param of formattedParameters) {
          if (param.value === undefined || param.value === null || param.value.toString().trim() === '') {
            showToast(`Please enter result value for parameter: ${param.name}`, 'error');
            setSavingReport(false);
            return;
          }
        }
      }

      const endpoint = (statusToSet === 'completed' || statusToSet === 'signed_off')
        ? `/lab/requests/${selectedRequest._id}/report-generate`
        : `/lab/requests/${selectedRequest._id}/report-draft`;

      const payload = {
        parameters: formattedParameters,
        remarks: reportRemarks,
        notes: reportNotes,
        advice: reportAdvice,
        interpretation: reportInterpretation,
        collectedDate: datesInfo.collectedDate,
        collectedTime: datesInfo.collectedTime,
        receivedDate: datesInfo.receivedDate,
        receivedTime: datesInfo.receivedTime,
        reportedDate: datesInfo.reportedDate,
        reportedTime: datesInfo.reportedTime
      };

      if (statusToSet === 'signed_off' || statusToSet === 'completed') {
        payload.reportStatus = 'Signed off';
      }

      const response = await api.post(endpoint, payload);

      setShowReportEntryView(false);
      setSelectedRequest(null);
      loadDashboardData();

      if (statusToSet === 'signed_off' || statusToSet === 'completed') {
        const fullRequest = response.data || response;
        setSavedReportRequest(fullRequest);
        setShowReportSavedModal(true);
      } else {
        showToast('Report draft saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.data?.message || err.message || 'Failed to save test report', 'error');
    } finally {
      setSavingReport(false);
    }
  };

  // Opens Bill Receipt preview modal matching Screenshot 1
  const handleOpenReceiptView = (report) => {
    const rawBill = report.rawBill;
    const testList = report.tests ? report.tests.split(',').map((t, idx) => ({ sno: idx + 1, name: t.trim(), amount: 100 })) : [{ sno: 1, name: 'Dengue IgG', amount: 100 }];
    const totalAmt = rawBill?.totalAmount || 100;
    const paidAmt = rawBill?.paidAmount || totalAmt;

    setViewingReceiptData({
      billNo: report.regNo.replace('#', ''),
      categoryBadge: report.modBadge || 'L1',
      patientName: report.patientName,
      ageSex: report.ageSex,
      mobileNumber: report.mobile || '8949895216',
      referredBy: report.referredBy,
      date: report.date || new Date().toLocaleDateString('en-GB'),
      receivedBy: report.patientName,
      investigations: testList,
      totalAmount: totalAmt,
      amountPaid: paidAmt
    });
  };

  // Payment Handling
  const handleOpenPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setPaymentAmount(bill.dueAmount || bill.totalAmount || 0);
    setPaymentMode('Cash');
    setPaymentRef('');
    setShowPaymentModal(true);
  };

  const handleReceivePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBillForPayment) return;
    setSubmittingPayment(true);
    try {
      await api.post(`/lab/bills/${selectedBillForPayment._id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod: paymentMode,
        transactionRef: paymentRef,
        remarks: 'Payment received from lab dashboard'
      });
      setShowPaymentModal(false);
      loadDashboardData();
      showToast('Payment recorded successfully!', 'success');
    } catch (err) {
      showToast(err.data?.message || err.message || 'Failed to record payment', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreateBillFromOpd = (report) => {
    const req = report.rawRequest || {};
    const p = req.patientId || {};
    const fullPName = p.patientName || report.patientName || '';
    const nameParts = fullPName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const testsStr = Array.isArray(req.tests) ? req.tests.join(',') : (report.tests || '');
    
    const query = new URLSearchParams({
      patientId: p._id || '',
      requestId: req._id || report.id || '',
      labId: req.labId || report.regNo.replace('#', '') || '',
      uhid: p.uhid || '',
      firstName: firstName,
      lastName: lastName,
      mobile: p.mobile || report.mobile || '',
      gender: p.gender || 'Male',
      age: String(p.age || 25),
      tests: testsStr,
      ref: report.referredBy || 'OPD Doctor'
    }).toString();

    router.push(`/new-bill?${query}`);
  };

  // Unpaid due bills for Business view
  const dueBills = labBills.filter(b => (b.dueAmount > 0 || b.paymentStatus === 'Unpaid' || b.paymentStatus === 'Partial'));
  const filteredDueBills = dueBills.filter(b => {
    const search = dueSearchQuery.toLowerCase();
    const nameMatch = b.patientId?.patientName?.toLowerCase().includes(search);
    const uhidMatch = b.patientId?.uhid?.toLowerCase().includes(search);
    const billNoMatch = (b.billNo || b.labId)?.toLowerCase().includes(search);
    return !dueSearchQuery || nameMatch || uhidMatch || billNoMatch;
  });
  const totalDueAmount = dueBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0);

  const renderSharedModals = () => {
    return (
      <>
        {/* Report Saved Options Modal (Print/Preview/Download) */}
        {showReportSavedModal && savedReportRequest && (
          <div className="fixed inset-0 z-55 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Report Saved Successfully</h3>
                <p className="text-[11px] text-slate-500 font-medium">The test report has been signed off and locked. What would you like to do next?</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportSavedModal(false);
                    handlePrintReport(savedReportRequest);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  🖨 Print / Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportSavedModal(false);
                    // Preview report modal (which is showReportPrintModal)
                    handleOpenReportPrint(savedReportRequest);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  👁 Preview Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportSavedModal(false);
                    setSavedReportRequest(null);
                  }}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close & Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lab Report Print View Modal matching user screenshot */}
        {showReportPrintModal && selectedReportForPrint && (() => {
          const matchedBill = labBills.find(b => b.labRequestId === selectedReportForPrint._id || b.labId === selectedReportForPrint.labId);
          const patient = selectedReportForPrint.patientId || {};
          let ageStr = '—';
          if (patient.age) {
            ageStr = `${patient.age} YRS`;
          } else if (patient.dob) {
            const birthDate = new Date(patient.dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              calculatedAge--;
            }
            ageStr = `${calculatedAge} YRS`;
          }

          let genderStr = '—';
          if (patient.gender) {
            genderStr = String(patient.gender).toLowerCase().startsWith('f') ? 'F' : 'M';
          }

          const testList = Array.isArray(selectedReportForPrint.tests) 
            ? selectedReportForPrint.tests 
            : (typeof selectedReportForPrint.tests === 'string' 
                ? selectedReportForPrint.tests.split(',').map(t => t.trim()) 
                : []);
          
          const regDateStr = selectedReportForPrint.createdAt 
            ? new Date(selectedReportForPrint.createdAt).toLocaleDateString('en-GB') + ' ' + new Date(selectedReportForPrint.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '';
          const reportDateStr = selectedReportForPrint.updatedAt
            ? new Date(selectedReportForPrint.updatedAt).toLocaleDateString('en-GB') + ' ' + new Date(selectedReportForPrint.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white print:static print:block animate-in fade-in duration-200">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  .no-print {
                    display: none !important;
                  }
                  body {
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  .print-area,
                  .print-area * {
                    visibility: visible !important;
                  }
                  .print-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    display: block !important;
                    border: none !important;
                    box-shadow: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    padding-top: ${hospitalSettings?.letterheadHeaderHeight || 0}cm !important;
                    padding-bottom: ${hospitalSettings?.letterheadFooterHeight || 0}cm !important;
                  }
                }
              `}} />

              {/* Header Action bar - Hidden on print */}
              <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-md mb-4 no-print">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800">Lab Report Print Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintReport(selectedReportForPrint)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>🖨</span>
                    <span>Print Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportPrintModal(false);
                      setSelectedReportForPrint(null);
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Area - styled exactly like the screenshot */}
              <div className="print-area w-full max-w-4xl bg-white border border-slate-300 rounded-lg p-8 shadow-2xl space-y-6 text-xs text-slate-800 font-sans print:shadow-none print:border-0 print:p-0">
                
                {/* Simulated/Real Letterhead Header Image */}
                {hospitalSettings?.letterheadImageUrl ? (
                  <div 
                    style={{ height: `${hospitalSettings.letterheadHeaderHeight || 4.6}cm` }} 
                    className="w-full overflow-hidden mb-4"
                  >
                    <img 
                      src={hospitalSettings.letterheadImageUrl} 
                      alt="Letterhead Header" 
                      className="w-full h-full object-fill"
                    />
                  </div>
                ) : (
                  /* Default Letterhead from Consultation / Hospital Details */
                  <div className="w-full border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {hospitalSettings?.logoUrl ? (
                        <img 
                          src={hospitalSettings.logoUrl} 
                          alt="Logo" 
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400">LOGO</div>
                      )}
                      <div className="text-left">
                        <h1 className="text-lg font-black text-slate-900 leading-tight">{hospitalSettings?.hospitalName || user?.hospitalName || 'Virtual Care Hospital'}</h1>
                        {hospitalSettings?.hospitalHeading && (
                          <p className="text-[10px] font-bold text-slate-500">{hospitalSettings.hospitalHeading}</p>
                        )}
                        <p className="text-[9px] text-slate-500 font-medium max-w-md">{hospitalSettings?.address || '123 Care Street, Medical Zone'}</p>
                      </div>
                    </div>
                    <div className="text-right text-[9px] text-slate-500 space-y-0.5">
                      {hospitalSettings?.mobileNumbers && hospitalSettings.mobileNumbers.length > 0 && (
                        <p className="font-bold">📞 {hospitalSettings.mobileNumbers.join(', ')}</p>
                      )}
                      {hospitalSettings?.emailAddress && (
                        <p>✉ {hospitalSettings.emailAddress}</p>
                      )}
                      {hospitalSettings?.website && (
                        <p>🌐 {hospitalSettings.website}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Header Table / Demographics Box */}
                <div className="grid grid-cols-12 border-b-2 border-slate-800 pb-4 items-start gap-4">
                  {/* Left 6 Cols: Patient details */}
                  <div className="col-span-6 space-y-1 text-slate-800 text-[11px]">
                    <h2 className="text-sm font-extrabold text-slate-900 leading-tight">{patient.patientName || 'Mr. Ravi 2'}</h2>
                    <div className="grid grid-cols-12 leading-relaxed">
                      <span className="col-span-4 font-bold text-slate-500">Age / Sex</span>
                      <span className="col-span-8 font-black text-slate-900">: {ageStr} / {genderStr}</span>
                      <span className="col-span-4 font-bold text-slate-500">Referred by</span>
                      <span className="col-span-8 font-black text-slate-900">: {selectedReportForPrint.remarks || 'Self'}</span>
                      <span className="col-span-4 font-bold text-slate-500">Reg. no.</span>
                      <span className="col-span-8 font-black text-slate-900">: {selectedReportForPrint.labId || '1074'}</span>
                    </div>
                  </div>

                  {/* Right 6 Cols: Dates info */}
                  <div className="col-span-6 flex flex-col items-end justify-start text-[11px]">
                    <div className="w-full max-w-xs grid grid-cols-12 leading-relaxed text-slate-700 font-bold">
                      <span className="col-span-5 text-right pr-2">Registered</span>
                      <span className="col-span-7 text-slate-900 font-extrabold">: {regDateStr || '19/08/2026 04:56 PM'}</span>
                      <span className="col-span-5 text-right pr-2">Collected</span>
                      <span className="col-span-7 text-slate-900 font-extrabold">: {datesInfo.collectedDate || '19/08/2026'}</span>
                      <span className="col-span-5 text-right pr-2">Received</span>
                      <span className="col-span-7 text-slate-900 font-extrabold">: {datesInfo.receivedDate || '19/08/2026'}</span>
                      <span className="col-span-5 text-right pr-2">Reported</span>
                      <span className="col-span-7 text-slate-900 font-extrabold">: {reportDateStr || '19/08/2026 05:04 PM'}</span>
                    </div>
                  </div>
                </div>

                {/* Modality Title Header */}
                <div className="py-2 flex items-center justify-center border-b border-slate-200">
                  <h3 className="text-xs font-black tracking-widest text-slate-900 border-b-2 border-slate-900 pb-0.5 uppercase">
                    {selectedReportForPrint.category || 'BIOCHEMISTRY'}
                  </h3>
                </div>

                {/* Parameter Values Table Box */}
                <div className="border border-slate-400 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px] leading-relaxed">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-400 text-slate-800 font-extrabold uppercase text-[10px]">
                        <th className="py-2.5 px-4 w-2/5">TEST</th>
                        <th className="py-2.5 px-4 w-1/5">VALUE</th>
                        <th className="py-2.5 px-4 w-1/5">UNIT</th>
                        <th className="py-2.5 px-4 w-1/5">REFERENCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {testList.map((tName, tIdx) => {
                        const tNameNorm = String(tName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const matchedTest = findMatchedTest(tName);

                        const testParams = matchedTest && Array.isArray(matchedTest.parameters) ? matchedTest.parameters : [];

                        return (
                          <React.Fragment key={tIdx}>
                            {/* Modality Investigation Header Row */}
                            <tr className="bg-slate-50/50">
                              <td colSpan="4" className="py-2 px-4 font-black text-slate-900 uppercase tracking-wide">
                                {tName}
                              </td>
                            </tr>

                            {/* Parameter Values Rows */}
                            {testParams.filter((p) => {
                              const patientGender = selectedReportForPrint.patientId?.gender?.toLowerCase() || '';
                              const pGender = (p.gender || 'both').toLowerCase();
                              if (pGender === 'male' && patientGender !== 'male') return false;
                              if (pGender === 'female' && patientGender !== 'female') return false;
                              return true;
                            }).map((p, pIdx) => {
                              const rVal = selectedReportForPrint.report?.parameters?.find(rp => rp.name === p.name);
                              const valText = rVal ? rVal.value : '';
                              const isBad = isOutOfRange(p.name, valText) || (rVal && rVal.isAbnormal);

                              return (
                                <tr key={pIdx} className="hover:bg-slate-50/30 transition-colors">
                                  {/* Param Name */}
                                  <td className="py-2 px-4 pl-8 font-bold text-slate-700 uppercase">
                                    {p.name}
                                  </td>
                                  
                                  {/* Value - Bold text if abnormal or out of range */}
                                  <td className={`py-2 px-4 text-slate-800 text-[12px] ${isBad ? 'font-black text-slate-900 text-sm' : 'font-bold'}`}>
                                    {valText || '—'}
                                    {(() => {
                                      const status = getValueRangeStatus(p.name, valText);
                                      if (!status) return null;
                                      return (
                                        <span className="ml-1 text-slate-500 font-extrabold text-[10px]">
                                          ({status})
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  
                                  {/* Unit */}
                                  <td className="py-2 px-4 text-slate-500 font-semibold">
                                    {p.unit || '—'}
                                  </td>

                                  {/* Reference Range */}
                                  <td className="py-2 px-4 text-slate-600 font-medium whitespace-pre-wrap">
                                    {p.referenceRange || 'As per lab standards'}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Notes, Remarks & Advice Section */}
                <div className="grid grid-cols-12 gap-y-2.5 pt-4 text-[11px] leading-relaxed border-t border-slate-200">
                  <span className="col-span-2 font-black text-slate-900 italic">Notes</span>
                  <span className="col-span-10 font-bold text-slate-800 italic">: {selectedReportForPrint.report?.notes || '—'}</span>
                  
                  <span className="col-span-2 font-black text-slate-900 italic">Remarks</span>
                  <span className="col-span-10 font-bold text-slate-800 italic">: {selectedReportForPrint.report?.remarks || '—'}</span>
                  
                  <span className="col-span-2 font-black text-slate-900 italic">Advice</span>
                  <span className="col-span-10 font-bold text-slate-800 italic">: {selectedReportForPrint.report?.advice || '—'}</span>
                </div>

                {/* End of Report text */}
                <div className="flex items-center justify-center pt-8">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">~~~ End of report ~~~</span>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Modal for filling test parameters & generating report */}
        {showProcessModal && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Process Lab Request
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter test values for parameter fields defined by Lab Admin
                  </p>
                </div>
                <button onClick={() => setShowProcessModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Test Fields Form */}
              <div className="space-y-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Ordered Tests: </span>
                    <span className="font-bold text-slate-800">{selectedRequest.tests?.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">UHID: </span>
                    <span className="font-bold text-orange-600">{selectedRequest.patientId?.uhid}</span>
                  </div>
                </div>

                {/* Dynamic Parameter Input Fields */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Diagnostic Parameter Results
                  </h4>

                  {Object.keys(parameterValues).length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>No pre-configured parameters found for these tests. You can enter remarks below{isAdminUser ? <span className="cursor-pointer underline font-bold ml-1" onClick={() => router.push('/admin')}>or add parameters in Lab Admin Portal</span> : '.'}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {Object.keys(parameterValues).map((pName) => {
                        let refRange = '';
                        let unit = '';
                        availableLabTests.forEach(t => {
                          if (Array.isArray(t.parameters)) {
                            const found = t.parameters.find(p => p.name === pName);
                            if (found) {
                              refRange = found.referenceRange || '';
                              unit = found.unit || '';
                            }
                          }
                        });

                        return (
                          <div key={pName} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="sm:w-1/2">
                              <label className="block text-xs font-bold text-slate-800">{pName}</label>
                              {(refRange || unit) && (
                                <span className="text-[11px] text-slate-500">
                                  {refRange ? `Ref: ${refRange}` : ''} {unit ? `(${unit})` : ''}
                                </span>
                              )}
                            </div>
                            <div className="sm:w-1/2">
                              <input
                                type="text"
                                placeholder={`Enter ${pName} result...`}
                                value={parameterValues[pName] || ''}
                                onChange={(e) => handleParamValueChange(pName, e.target.value)}
                                className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Technician Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Report Remarks & Notes</label>
                  <textarea
                    rows="3"
                    value={reportRemarks}
                    onChange={(e) => setReportRemarks(e.target.value)}
                    placeholder="Enter technician remarks, clinical notes, or observations..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => handleSaveReport('draft')}
                    disabled={savingReport}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveReport('completed')}
                    disabled={savingReport}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {savingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Complete & Generate Report</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal for Viewing & Printing Bill Receipt matching Screenshot 1 */}
        {viewingReceiptData && (
          <LabBillReceipt
            billData={viewingReceiptData}
            onClose={() => setViewingReceiptData(null)}
          />
        )}

        {/* Modal for Payment Collection */}
        {showPaymentModal && selectedBillForPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-500">Patient Name</label>
                  <span className="block text-sm font-bold text-slate-800">{selectedBillForPayment.patientId?.patientName || 'Patient'}</span>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Due Amount (₹)</label>
                  <span className="block text-base font-black text-red-600">₹{(selectedBillForPayment.dueAmount || selectedBillForPayment.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Amount Received (₹)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Transaction Reference No (Optional)</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="UPI Transaction ID / Card Ref ID..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-900 focus:bg-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Record Payment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  };

  const [showSignOffDropdown, setShowSignOffDropdown] = useState(false);

  const handleDateChange = (field, val) => {
    setDatesInfo(prev => ({ ...prev, [field]: val }));
  };

  const getValueRangeStatus = (paramName, valueStr) => {
    if (!valueStr) return null;

    // A. Check if the value matches any predefined option marked as Abnormal
    let foundAbnormalMatch = false;
    availableLabTests.forEach(t => {
      if (Array.isArray(t.parameters)) {
        const found = t.parameters.find(p => p.name === paramName);
        if (found && Array.isArray(found.valueOptions)) {
          const matchOpt = found.valueOptions.find(o => String(o.value).trim() === String(valueStr).trim());
          if (matchOpt && matchOpt.isAbnormal) {
            foundAbnormalMatch = true;
          }
        }
      }
    });
    if (foundAbnormalMatch) return 'H';

    if (isNaN(valueStr)) return null;
    const value = parseFloat(valueStr);
    
    let rules = [];
    let defaultRange = '';
    availableLabTests.forEach(t => {
      if (Array.isArray(t.parameters)) {
        const found = t.parameters.find(p => p.name === paramName);
        if (found) {
          rules = found.referenceRules || [];
          defaultRange = found.referenceRange || '';
        }
      }
    });

    const rawGender = selectedRequest?.patientId?.gender || 'Male';
    const pGender = (rawGender.toLowerCase().startsWith('f') || rawGender.toLowerCase().startsWith('w')) ? 'Female' : 'Male';
    const pAge = Number(selectedRequest?.patientId?.age) || 30;

    const matchRule = rules.find(r => {
      const sexMatch = !r.sex || r.sex === 'Any' || r.sex.toLowerCase() === pGender.toLowerCase();
      if (!sexMatch) return false;

      let minYears = Number(r.minAge) || 0;
      if (r.minAgeUnit === 'Months') minYears = minYears / 12;
      if (r.minAgeUnit === 'Days') minYears = minYears / 365;

      let maxYears = Number(r.maxAge) || 100;
      if (r.maxAgeUnit === 'Months') maxYears = maxYears / 12;
      if (r.maxAgeUnit === 'Days') maxYears = maxYears / 365;

      return pAge >= minYears && pAge <= maxYears;
    });

    if (matchRule) {
      const lower = parseFloat(matchRule.lowerValue);
      const upper = parseFloat(matchRule.upperValue);
      if (!isNaN(lower) && value < lower) return 'L';
      if (!isNaN(upper) && value > upper) return 'H';
      return null;
    }

    if (defaultRange) {
      const cleanRange = defaultRange.replace(/[–—−]/g, '-').replace(/\s+/g, ' ');
      
      // Parse gender-specific string ranges like "Male: ~13.8–17.2; Female: ~12.1–15.1"
      if (defaultRange.toLowerCase().includes('male') || defaultRange.toLowerCase().includes('female')) {
        const isMale = pGender.toLowerCase() === 'male';
        const maleMatch = defaultRange.match(/male:\s*~?([-+]?[0-9]*\.?[0-9]+)\s*[-–—−]\s*([-+]?[0-9]*\.?[0-9]+)/i);
        const femaleMatch = defaultRange.match(/female:\s*~?([-+]?[0-9]*\.?[0-9]+)\s*[-–—−]\s*([-+]?[0-9]*\.?[0-9]+)/i);
        
        if (isMale && maleMatch) {
          const ml = parseFloat(maleMatch[1]);
          const mu = parseFloat(maleMatch[2]);
          if (value < ml) return 'L';
          if (value > mu) return 'H';
          return null;
        } else if (!isMale && femaleMatch) {
          const fl = parseFloat(femaleMatch[1]);
          const fu = parseFloat(femaleMatch[2]);
          if (value < fl) return 'L';
          if (value > fu) return 'H';
          return null;
        }
      }

      // Fallback: standard numeric range parser
      const numbers = cleanRange.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (numbers && numbers.length >= 2) {
        const lower = parseFloat(numbers[0]);
        const upper = parseFloat(numbers[1]);
        if (!isNaN(lower) && !isNaN(upper)) {
          if (value < lower) return 'L';
          if (value > upper) return 'H';
          return null;
        }
      }
    }

    return null;
  };

  const isOutOfRange = (paramName, valueStr) => {
    return getValueRangeStatus(paramName, valueStr) !== null;
  };

  const handleUpdateParameterRules = async (paramName, updatedRules) => {
    const matchedTest = availableLabTests.find(t => 
      Array.isArray(t.parameters) && t.parameters.some(p => p.name === paramName)
    );
    if (!matchedTest) return;

    const updatedParameters = matchedTest.parameters.map(p => {
      if (p.name === paramName) {
        const defaultDisplay = updatedRules.map(r => {
          let str = '';
          if (r.sex && r.sex !== 'Any') str += `${r.sex}: `;
          if (r.lowerValue || r.upperValue) {
            str += `${r.lowerValue || '0'} – ${r.upperValue || 'N/A'}`;
          }
          return str;
        }).filter(Boolean).join('; ') || 'As per lab standards';

        return {
          ...p,
          referenceRules: updatedRules,
          referenceRange: updatedRules[0]?.displayedValue || defaultDisplay
        };
      }
      return p;
    });

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        parameters: updatedParameters
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
      setShowRuleModalParam('');
      alert('Reference range rules updated successfully!');
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to update reference rules');
    }
  };

  const handleSaveValueOption = async (paramName) => {
    if (!newValueOptionText.trim()) return;

    const matchedTest = availableLabTests.find(t => 
      Array.isArray(t.parameters) && t.parameters.some(p => p.name === paramName)
    );
    if (!matchedTest) return;

    const updatedParameters = matchedTest.parameters.map(p => {
      if (p.name === paramName) {
        const options = Array.isArray(p.valueOptions) ? [...p.valueOptions] : [];
        if (editingValueOptionIdx !== null) {
          options[editingValueOptionIdx] = {
            value: newValueOptionText.trim(),
            isAbnormal: newValueOptionAbnormal
          };
        } else {
          options.push({
            value: newValueOptionText.trim(),
            isAbnormal: newValueOptionAbnormal
          });
        }
        return {
          ...p,
          valueOptions: options
        };
      }
      return p;
    });

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        parameters: updatedParameters
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
      setNewValueOptionText('');
      setNewValueOptionAbnormal(false);
      setEditingValueOptionIdx(null);
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save value choice');
    }
  };

  const handleDeleteValueOption = async (paramName, idxToDelete) => {
    const matchedTest = availableLabTests.find(t => 
      Array.isArray(t.parameters) && t.parameters.some(p => p.name === paramName)
    );
    if (!matchedTest) return;

    const updatedParameters = matchedTest.parameters.map(p => {
      if (p.name === paramName) {
        const options = Array.isArray(p.valueOptions) ? p.valueOptions.filter((_, idx) => idx !== idxToDelete) : [];
        return {
          ...p,
          valueOptions: options
        };
      }
      return p;
    });

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        parameters: updatedParameters
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to delete value choice');
    }
  };

  const handleSaveInterpretationToTemplate = async () => {
    const testNames = Array.isArray(selectedRequest?.tests) 
      ? selectedRequest.tests 
      : (typeof selectedRequest?.tests === 'string' 
          ? selectedRequest.tests.split(',').map(t => t.trim()) 
          : []);
          
    const normalizeString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let matchedTest = null;
    testNames.forEach(tName => {
      const tNameNorm = normalizeString(tName);
      const found = availableLabTests.find(t => {
        const titleNorm = normalizeString(t.title);
        const testNorm = normalizeString(t.test);
        return titleNorm === tNameNorm || testNorm === tNameNorm || (titleNorm && titleNorm.includes(tNameNorm)) || (tNameNorm && tNameNorm.includes(titleNorm));
      });
      if (found) matchedTest = found;
    });

    if (!matchedTest) {
      alert('Could not resolve current investigation test template to save interpretation.');
      return;
    }

    try {
      const res = await api.put(`/lab/tests/${matchedTest._id}`, {
        category: matchedTest.category || 'LAB',
        title: matchedTest.title,
        interpretation: reportInterpretation
      });
      setAvailableLabTests(prev => prev.map(t => t._id === matchedTest._id || t.title === matchedTest.title ? res : t));
      alert('Interpretation saved as default for future reports!');
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save default interpretation');
    }
  };

  const handleOpenReportPrint = (reqItem) => {
    setSelectedReportForPrint(reqItem);
    setShowReportPrintModal(true);
  };

  const renderReportEntryView = () => {
    const matchedBill = labBills.find(b => b.labRequestId === selectedRequest._id || b.labId === selectedRequest.labId);
    const regDateStr = selectedRequest.createdAt 
      ? new Date(selectedRequest.createdAt).toLocaleDateString('en-GB') + ' ' + new Date(selectedRequest.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '';

    const testNames = Array.isArray(selectedRequest.tests) 
      ? selectedRequest.tests 
      : (typeof selectedRequest.tests === 'string' 
          ? selectedRequest.tests.split(',').map(t => t.trim()) 
          : []);

    const badgeCategory = selectedRequest.category || 'LAB';
    const patientGender = selectedRequest.patientId?.gender || 'Male';

    return (
      <DashboardLayout>
        <div className="space-y-6 pb-16 bg-white min-h-screen">
          {/* HEADER ROUTING / BREADCRUMB */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReportEntryView(false);
                  setSelectedRequest(null);
                }}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Lab report
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500">
                    Reg no. {selectedRequest.labId} | {badgeCategory}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    patientGender.toLowerCase() === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {patientGender} 👤
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-600 text-white shadow-2xs">
                    Status: {selectedRequest.reportStatus || 'New'}
                  </span>
                </div>
              </div>
            </div>
            {/* Top Right Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSignOffDropdown(!showSignOffDropdown)}
                  className="h-8 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
                {showSignOffDropdown && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignOffDropdown(false);
                        if (matchedBill) handleOpenReceiptView({ rawBill: matchedBill, regNo: selectedRequest.labId, patientName: selectedRequest.patientId?.patientName, ageSex: `${selectedRequest.patientId?.age} YRS/${selectedRequest.patientId?.gender?.[0]}`, referredBy: selectedRequest.remarks || 'Self', tests: testNames.join(', ') });
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      View bill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignOffDropdown(false);
                        router.push(`/new-bill?patientId=${selectedRequest.patientId?._id || ''}&labId=${selectedRequest.labId || ''}`);
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Modify case
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignOffDropdown(false);
                        handleOpenReportPrint(selectedRequest);
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 cursor-pointer border-t border-slate-100"
                    >
                      Browse print
                    </button>
                  </div>
                )}
              </div>
              <button type="button" className="h-8 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer">
                &lt; Edit &gt;
              </button>
              <button
                type="button"
                onClick={() => handleOpenReportPrint(selectedRequest)}
                className="h-8 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
              >
                &lt; View &gt;
              </button>
            </div>
          </div>

          {/* PATIENT INFO CARD PANEL */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left 5 Cols: Details */}
            <div className="md:col-span-5 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
              <span className="text-slate-500 font-semibold">Patient Name:</span>
              <span className="font-bold text-slate-800">{selectedRequest.patientId?.patientName || 'Mr. Ravi 2'}</span>
              <span className="text-slate-500 font-semibold">Age / Sex:</span>
              <span className="font-bold text-slate-800">{selectedRequest.patientId?.age || 28} YRS / {selectedRequest.patientId?.gender?.[0] || 'M'}</span>
              <span className="text-slate-500 font-semibold">Referred By:</span>
              <span className="font-bold text-slate-800">{selectedRequest.remarks?.replace('Referred by:', '') || 'Self'}</span>
              <span className="text-slate-500 font-semibold">Reg. no.</span>
              <span className="font-bold text-slate-800">{selectedRequest.labId}</span>
            </div>

            {/* Middle 5 Cols: Registration & Collection Timings */}
            <div className="md:col-span-5 grid grid-cols-1 gap-y-2.5 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Registered on:</span>
                <span className="text-slate-800 flex items-center gap-1 font-bold">
                  <span>✏️</span>
                  <span>{regDateStr}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Collected on:</span>
                <input
                  type="date"
                  value={datesInfo.collectedDate}
                  onChange={(e) => handleDateChange('collectedDate', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
                <input
                  type="time"
                  value={datesInfo.collectedTime}
                  onChange={(e) => handleDateChange('collectedTime', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Received on:</span>
                <input
                  type="date"
                  value={datesInfo.receivedDate}
                  onChange={(e) => handleDateChange('receivedDate', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
                <input
                  type="time"
                  value={datesInfo.receivedTime}
                  onChange={(e) => handleDateChange('receivedTime', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-slate-500">Reported on:</span>
                <input
                  type="date"
                  value={datesInfo.reportedDate}
                  onChange={(e) => handleDateChange('reportedDate', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
                <input
                  type="time"
                  value={datesInfo.reportedTime}
                  onChange={(e) => handleDateChange('reportedTime', e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded text-xs outline-none"
                />
              </div>
            </div>

            {/* Right 2 Cols: Barcode representation */}
            <div className="md:col-span-2 flex flex-col items-center justify-center border-l border-slate-100 pl-4 py-2">
              <div className="flex items-center gap-[2px] h-9">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className={`w-[2px] h-full bg-slate-900 ${i % 3 === 0 ? 'w-[4px]' : (i % 5 === 0 ? 'w-[1px]' : '')}`} />
                ))}
              </div>
              <span className="text-[10px] font-mono tracking-wider text-slate-500 mt-1">{selectedRequest.labId}</span>
            </div>
          </div>

          {/* LARGE MODALITY TITLE */}
          <div className="text-center py-2.5 border-b border-slate-200 relative">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">
              {badgeCategory === 'LAB' ? 'BIOCHEMISTRY' : badgeCategory}
            </h2>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <select className="h-8 px-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 cursor-pointer">
                <option>Reorder</option>
              </select>
              <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TABLE OF PARAMETERS RESULTS ENTRY */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5 w-2/5">TEST</th>
                    <th className="py-3 px-5 w-1/4">VALUE</th>
                    <th className="py-3 px-5 w-1/8">UNIT</th>
                    <th className="py-3 px-5 w-1/4">
                      <div className="flex items-center justify-between">
                        <span>REFERENCE</span>
                        <div className="flex items-center gap-3 font-semibold normal-case text-slate-500 text-[10px]">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded text-orange-500 cursor-pointer" />
                            <span>Print ready</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" className="rounded text-orange-500 cursor-pointer" />
                            <span>Page break after (PDF only)</span>
                          </label>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testNames.map((tName) => {
                    const matchedTest = findMatchedTest(tName);

                    const params = matchedTest?.parameters || [];

                    return (
                      <Suspense key={tName} fallback={<tr><td colSpan="4">Loading params...</td></tr>}>
                        {/* Test Group Header Checked Row */}
                        <tr className="bg-slate-50/50">
                          <td colSpan="4" className="py-2.5 px-5 font-bold text-slate-800 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="rounded text-orange-500 cursor-pointer" />
                              <span>{tName}</span>
                            </label>
                          </td>
                        </tr>

                        {/* Indented Parameters Rows */}
                        {params.filter((p) => {
                          const patientGender = activeRequest?.patientId?.gender?.toLowerCase() || '';
                          const pGender = (p.gender || 'both').toLowerCase();
                          if (pGender === 'male' && patientGender !== 'male') return false;
                          if (pGender === 'female' && patientGender !== 'female') return false;
                          return true;
                        }).map((p) => {
                          const isBad = isOutOfRange(p.name, parameterValues[p.name]);
                          const isRemarksExpanded = expandedRemarks[p.name];
                          const hasRefRangeOrRules = (p.referenceRange && p.referenceRange.trim().length > 0 && !p.referenceRange.toLowerCase().includes('standards') && !p.referenceRange.toLowerCase().includes('as per')) || (Array.isArray(p.referenceRules) && p.referenceRules.length > 0);

                          return (
                            <React.Fragment key={p.name}>
                              <tr className="hover:bg-slate-50/30 transition-colors">
                                {/* TEST NAME */}
                                <td className="py-3 px-5 pl-10 font-bold text-slate-700">
                                  <span>{p.name}</span>
                                </td>

                                {/* VALUE INPUT */}
                                <td className="py-3 px-5">
                                  <div className="flex items-center gap-1.5 w-full">
                                    {(() => {
                                      const status = getValueRangeStatus(p.name, parameterValues[p.name]);
                                      if (!status) return null;
                                      return (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider animate-in zoom-in-50 duration-150 shrink-0 ${
                                          status === 'H' 
                                            ? 'bg-red-100 text-red-700 border border-red-200' 
                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                        }`}>
                                          {status}
                                        </span>
                                      );
                                    })()}
                                    <div className="relative flex-1">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={parameterValues[p.name] || ''}
                                          onChange={(e) => handleParamValueChange(p.name, e.target.value)}
                                          onClick={() => {
                                            if (hasRefRangeOrRules) return;
                                            if (activeValueOptionsDropdown === p.name) {
                                              setActiveValueOptionsDropdown('');
                                            } else {
                                              setActiveValueOptionsDropdown(p.name);
                                              setNewValueOptionText('');
                                              setNewValueOptionAbnormal(false);
                                              setEditingValueOptionIdx(null);
                                            }
                                          }}
                                          placeholder="Value..."
                                          className={`w-full px-3.5 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white border cursor-pointer ${
                                            isBad 
                                              ? 'border-red-500 bg-red-50 text-red-600 font-black focus:ring-red-500' 
                                              : 'border-slate-200 bg-slate-50 text-slate-800'
                                          }`}
                                        />
                                        {!hasRefRangeOrRules && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (activeValueOptionsDropdown === p.name) {
                                                setActiveValueOptionsDropdown('');
                                              } else {
                                                setActiveValueOptionsDropdown(p.name);
                                                setNewValueOptionText('');
                                                setNewValueOptionAbnormal(false);
                                                setEditingValueOptionIdx(null);
                                              }
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                                          >
                                            ▼
                                          </button>
                                        )}
                                      </div>

                                      {/* VALUE CHOICE CONFIG DROPDOWN CARD OVERLAY */}
                                      {!hasRefRangeOrRules && activeValueOptionsDropdown === p.name && (
                                        <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-40 text-xs font-semibold text-slate-700 space-y-3">
                                          
                                          {/* Predefined Choices List */}
                                          <div className="max-h-32 overflow-y-auto divide-y divide-slate-100">
                                            {(p.valueOptions || []).length === 0 ? (
                                              <div className="text-[10px] text-slate-400 py-1 font-medium">No options configured. Add one below.</div>
                                            ) : (
                                              (p.valueOptions || []).map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center justify-between py-1.5 hover:bg-slate-50 rounded px-1 transition-colors">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      handleParamValueChange(p.name, opt.value);
                                                      setActiveValueOptionsDropdown('');
                                                    }}
                                                    className="flex-1 text-left font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                                                  >
                                                    <span>{opt.value}</span>
                                                    {opt.isAbnormal && (
                                                      <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-600 font-extrabold text-[8px] tracking-wide uppercase">
                                                        Abnormal
                                                      </span>
                                                    )}
                                                  </button>
                                                  <div className="flex items-center gap-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setNewValueOptionText(opt.value);
                                                        setNewValueOptionAbnormal(opt.isAbnormal);
                                                        setEditingValueOptionIdx(oIdx);
                                                      }}
                                                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                                                      title="Edit Option"
                                                    >
                                                      📝
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeleteValueOption(p.name, oIdx)}
                                                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                                                      title="Delete Option"
                                                    >
                                                      🗑
                                                    </button>
                                                  </div>
                                                </div>
                                              ))
                                            )}
                                          </div>

                                          {/* Add Option Input Row */}
                                          <div className="border-t border-slate-100 pt-2 space-y-2">
                                            <input
                                              type="text"
                                              value={newValueOptionText}
                                              onChange={(e) => setNewValueOptionText(e.target.value)}
                                              placeholder="Enter choice value..."
                                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
                                            />
                                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-600">
                                              <input
                                                type="checkbox"
                                                checked={newValueOptionAbnormal}
                                                onChange={(e) => setNewValueOptionAbnormal(e.target.checked)}
                                                className="rounded text-red-500 cursor-pointer focus:ring-red-500"
                                              />
                                              <span>Abnormal</span>
                                            </label>
                                          </div>

                                          {/* Card Footer Actions */}
                                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveValueOptionsDropdown('');
                                                setNewValueOptionText('');
                                                setNewValueOptionAbnormal(false);
                                                setEditingValueOptionIdx(null);
                                              }}
                                              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSaveValueOption(p.name)}
                                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                            >
                                              Save
                                            </button>
                                          </div>

                                        </div>
                                      )}
                                    </div>

                                    {/* Unified Plus Action Menu Card */}
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (activePlusMenu === p.name) {
                                            setActivePlusMenu('');
                                          } else {
                                            setActivePlusMenu(p.name);
                                            setActiveValueOptionsDropdown('');
                                          }
                                        }}
                                        className="w-6 h-6 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 font-extrabold cursor-pointer shrink-0"
                                        title="Add remarks / choices menu"
                                      >
                                        +
                                      </button>

                                      {activePlusMenu === p.name && (
                                        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 text-xs font-semibold text-slate-700 space-y-0.5 animate-in fade-in slide-in-from-top-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setExpandedRemarks({ ...expandedRemarks, [p.name]: true });
                                              setActivePlusMenu('');
                                            }}
                                            className="w-full px-2.5 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer text-slate-800"
                                          >
                                            <span>💬</span>
                                            <span>Add remark</span>
                                          </button>
                                          {!hasRefRangeOrRules && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveValueOptionsDropdown(p.name);
                                                setActivePlusMenu('');
                                                setNewValueOptionText('');
                                                setNewValueOptionAbnormal(false);
                                                setEditingValueOptionIdx(null);
                                              }}
                                              className="w-full px-2.5 py-2 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer text-slate-800 border-t border-slate-100/80"
                                            >
                                              <span>⚙️</span>
                                              <span>Add abnormal choice</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                              {/* UNIT */}
                              <td className="py-3 px-5 font-semibold text-slate-500">
                                {p.unit || '—'}
                              </td>

                              {/* REFERENCE RANGE CONFIG */}
                              <td className="py-3 px-5 font-bold text-slate-700">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{p.referenceRange || 'As per standards'}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowRuleModalParam(p.name);
                                      setRuleModalRules(p.referenceRules || []);
                                    }}
                                    className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white font-extrabold hover:bg-slate-800 cursor-pointer shrink-0"
                                    title="Configure reference rules"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isRemarksExpanded && (
                              <tr className="bg-slate-50/20 border-b border-slate-100">
                                <td colSpan="4" className="py-2 px-10">
                                  <div className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-lg border border-slate-200 animate-in slide-in-from-top-1 duration-150">
                                    <span className="text-[10px] text-slate-500 font-bold italic whitespace-nowrap">Remarks (optional):</span>
                                    <input
                                      type="text"
                                      value={parameterRemarks[p.name] || ''}
                                      onChange={(e) => setParameterRemarks({ ...parameterRemarks, [p.name]: e.target.value })}
                                      placeholder="Enter optional remarks for this parameter..."
                                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 shadow-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setParameterRemarks({ ...parameterRemarks, [p.name]: '' });
                                        setExpandedRemarks({ ...expandedRemarks, [p.name]: false });
                                      }}
                                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 border border-transparent hover:border-red-200 cursor-pointer transition-colors"
                                      title="Clear remarks"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      </Suspense>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOWER SECTION: TECHNICIAN INPUTS / EXPANSIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'notes' ? '' : 'notes')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'notes' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'remarks' ? '' : 'remarks')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'remarks' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Remarks</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'advice' ? '' : 'advice')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'advice' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Advice</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportEntryTab(showReportEntryTab === 'interpretation' ? '' : 'interpretation')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  showReportEntryTab === 'interpretation' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>+ Add Interpretation</span>
              </button>
            </div>

            {/* Expansion Textareas */}
            {showReportEntryTab === 'notes' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-slate-700">Technician Notes</label>
                <textarea
                  rows="2"
                  value={reportNotes}
                  onChange={(e) => {
                    setReportNotes(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 overflow-hidden min-h-[60px]"
                />
              </div>
            )}
            {showReportEntryTab === 'remarks' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-slate-700">Remarks</label>
                <textarea
                  rows="2"
                  value={reportRemarks}
                  onChange={(e) => {
                    setReportRemarks(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 overflow-hidden min-h-[60px]"
                />
              </div>
            )}
            {showReportEntryTab === 'advice' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-slate-700">Advice</label>
                <textarea
                  rows="2"
                  value={reportAdvice}
                  onChange={(e) => {
                    setReportAdvice(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 60)}px`;
                  }}
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 overflow-hidden min-h-[60px]"
                />
              </div>
            )}
            {showReportEntryTab === 'interpretation' && (
              <div className="space-y-3 animate-in fade-in duration-100 border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">Interpretation</label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Use <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Shift</kbd> + <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter</kbd> key to go to new line.
                  </span>
                </div>

                {/* Purple library tip banner */}
                <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 border border-pink-100 rounded-lg text-pink-700 text-[10px] font-bold">
                  <span>📖</span>
                  <span>You can now copy interpretations from Library to update.</span>
                  <span className="bg-pink-200 text-pink-800 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
                </div>

                {/* Editor Toolbar Simulator */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  <div className="flex flex-wrap items-center gap-2.5 p-2 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded cursor-pointer text-[10px]">Paragraph ▾</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded cursor-pointer text-[10px]">12pt ▾</span>
                    <span className="w-px h-4 bg-slate-200"></span>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Undo">↩</button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Redo">↪</button>
                    <span className="w-px h-4 bg-slate-200"></span>
                    <button type="button" className="px-1.5 py-0.5 hover:bg-slate-200 rounded font-black cursor-pointer" title="Bold">B</button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Insert Table">田 ▾</button>
                    <span className="w-px h-4 bg-slate-200"></span>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Align Left">≡</button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Align Center">≡</button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Align Right">≡</button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Justify">≡</button>
                    <span className="w-px h-4 bg-slate-200"></span>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Bullet List">•≡</button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded cursor-pointer" title="Numbered List">1≡</button>
                  </div>
                  <textarea
                    rows="6"
                    value={reportInterpretation}
                    onChange={(e) => setReportInterpretation(e.target.value)}
                    placeholder="Enter default clinical interpretation findings here..."
                    className="w-full p-4.5 bg-white text-xs font-bold text-slate-800 outline-none resize-y min-h-[140px] focus:bg-white"
                  />
                  <div className="bg-slate-50 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[8px] text-slate-400 uppercase tracking-widest font-black">
                    <span>p</span>
                    <span>Powered by Tiny</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold">
                  For best results use formatting options available in the editor. Use clear formatting when you copy paste text.
                </p>

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveInterpretationToTemplate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportInterpretation('');
                      setShowReportEntryTab('');
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* More Details Remarks field (always visible at bottom) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">More details</label>
              <textarea
                rows="3"
                value={reportRemarks}
                onChange={(e) => {
                  setReportRemarks(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.max(e.target.scrollHeight, 70)}px`;
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.max(e.target.scrollHeight, 70)}px`;
                }}
                placeholder="Remarks details..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 overflow-hidden min-h-[70px]"
              />
            </div>
          </div>

          {/* ACTION BUTTONS FOOTER BAR */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6">
            {/* Left Back Button */}
            <button
              type="button"
              onClick={() => {
                setShowReportEntryView(false);
                setSelectedRequest(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
            >
              Back
            </button>
            {/* Right Buttons */}
            <div className="flex items-center gap-3">
              {/* Sign off Dropdown Group */}
              <div className="flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveReport('signed_off')}
                  disabled={savingReport}
                  className="px-4 py-2 text-xs font-bold border-r border-blue-500 cursor-pointer flex items-center gap-1.5"
                >
                  {savingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>✒️</span>}
                  <span>Sign off</span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSignOffDropdown(!showSignOffDropdown)}
                    className="p-2 hover:bg-blue-800 text-white cursor-pointer h-full"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showSignOffDropdown && (
                    <div className="absolute right-0 bottom-full mb-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignOffDropdown(false);
                          if (matchedBill) {
                            handleOpenReceiptView({
                              rawBill: matchedBill,
                              regNo: selectedRequest.labId,
                              patientName: selectedRequest.patientId?.patientName,
                              ageSex: `${selectedRequest.patientId?.age} YRS/${selectedRequest.patientId?.gender?.[0]}`,
                              referredBy: selectedRequest.remarks || 'Self',
                              tests: testNames.join(', ')
                            });
                          } else {
                            alert('No billing record associated with this request.');
                          }
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View bill</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignOffDropdown(false);
                          router.push(`/new-bill?patientId=${selectedRequest.patientId?._id || ''}&labId=${selectedRequest.labId || ''}`);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Modify case</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignOffDropdown(false);
                          handleOpenReportPrint(selectedRequest);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Browse print</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Button */}
              <button
                type="button"
                onClick={() => handleSaveReport('completed')}
                disabled={savingReport}
                className="px-5 py-2 bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                {savingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>✓</span>}
                <span>Final</span>
              </button>

              {/* Save Only (Draft) */}
              <button
                type="button"
                onClick={() => handleSaveReport('draft')}
                disabled={savingReport}
                className="px-5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Save only
              </button>
            </div>
          </div>

          {/* NORMAL VALUE REFERENCE RULES CONFIGURATION MODAL */}
          {showRuleModalParam && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Normal value - {showRuleModalParam}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRuleModalParam('')}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4 text-xs">
                  {/* Select Type and Help Actions Row */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Select type</label>
                      <select className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg font-bold text-slate-800 outline-none cursor-pointer text-xs h-[30px]">
                        <option>Numeric range</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-blue-100"
                      >
                        <span>🎧</span>
                        <span>Ask help</span>
                        <span>▼</span>
                      </button>
                    </div>
                  </div>

                  {/* Yellow Alert Box */}
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-lg text-amber-800 flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-amber-800">Missing normal values:</span>
                    <span className="text-[10px] text-amber-700 font-semibold pl-2">• Male: 0 days - 100 yrs</span>
                    <span className="text-[10px] text-amber-700 font-semibold pl-2">• Female: 0 days - 100 yrs</span>
                  </div>

                  {/* Rules list */}
                  <div className="space-y-1.5">
                    {ruleModalRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-3 w-full py-2 border-b border-slate-100 last:border-0">
                        {/* Remove Rule Row Button (trash bin icon) */}
                        <button
                          type="button"
                          onClick={() => {
                            setRuleModalRules(ruleModalRules.filter((_, rIdx) => rIdx !== idx));
                          }}
                          className="text-slate-400 hover:text-red-500 cursor-pointer pt-4"
                          title="Remove rule row"
                        >
                          🗑
                        </button>

                        {/* Sex */}
                        <div className="w-24">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Sex</label>
                          <select
                            value={rule.sex || 'Any'}
                            onChange={(e) => {
                              const list = [...ruleModalRules];
                              list[idx].sex = e.target.value;
                              setRuleModalRules(list);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded outline-none font-bold text-slate-800 cursor-pointer"
                          >
                            <option value="Any">Any</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        {/* Min Age */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Min. age</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={rule.minAge ?? 0}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].minAge = parseInt(e.target.value) || 0;
                                setRuleModalRules(list);
                              }}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-l-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                            />
                            <select
                              value={rule.minAgeUnit || 'Years'}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].minAgeUnit = e.target.value;
                                setRuleModalRules(list);
                              }}
                              className="px-2 py-1 border-y border-r border-slate-300 bg-slate-50 rounded-r-lg text-[11px] font-bold text-slate-600 outline-none cursor-pointer h-[30px]"
                            >
                              <option value="Days">Days</option>
                              <option value="Months">Months</option>
                              <option value="Years">Years</option>
                            </select>
                          </div>
                        </div>

                        {/* Max Age */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Max. age</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={rule.maxAge ?? 100}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].maxAge = parseInt(e.target.value) || 100;
                                setRuleModalRules(list);
                              }}
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-l-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                            />
                            <select
                              value={rule.maxAgeUnit || 'Years'}
                              onChange={(e) => {
                                const list = [...ruleModalRules];
                                list[idx].maxAgeUnit = e.target.value;
                                setRuleModalRules(list);
                              }}
                              className="px-2 py-1 border-y border-r border-slate-300 bg-slate-50 rounded-r-lg text-[11px] font-bold text-slate-600 outline-none cursor-pointer h-[30px]"
                            >
                              <option value="Days">Days</option>
                              <option value="Months">Months</option>
                              <option value="Years">Years</option>
                            </select>
                          </div>
                        </div>

                        {/* Lower value */}
                        <div className="w-24">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Lower value</label>
                          <input
                            type="text"
                            value={rule.lowerValue || ''}
                            onChange={(e) => {
                              const list = [...ruleModalRules];
                              list[idx].lowerValue = e.target.value;
                              setRuleModalRules(list);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                          />
                        </div>

                        {/* Upper value */}
                        <div className="w-24">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">* Upper value</label>
                          <input
                            type="text"
                            value={rule.upperValue || ''}
                            onChange={(e) => {
                              const list = [...ruleModalRules];
                              list[idx].upperValue = e.target.value;
                              setRuleModalRules(list);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg outline-none font-bold text-slate-800 text-xs h-[30px]"
                          />
                        </div>

                        {/* Displayed value */}
                        <div className="w-32">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Displayed in report as</label>
                          <div className="flex items-center gap-1.5 pt-1.5 text-xs text-slate-800">
                            <span className="font-extrabold">{rule.displayedValue || '-'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const val = prompt("Enter custom display range text:", rule.displayedValue || `${rule.lowerValue || '0'} – ${rule.upperValue || 'N/A'}`);
                                if (val !== null) {
                                  const list = [...ruleModalRules];
                                  list[idx].displayedValue = val;
                                  setRuleModalRules(list);
                                }
                              }}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
                              title="Edit display string"
                            >
                              📝
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => {
                      setRuleModalRules([...ruleModalRules, {
                        sex: 'Any',
                        minAge: 0,
                        minAgeUnit: 'Years',
                        maxAge: 100,
                        maxAgeUnit: 'Years',
                        lowerValue: '',
                        upperValue: '',
                        displayedValue: ''
                      }]);
                    }}
                    className="px-3.5 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add more</span>
                  </button>

                  {/* Modal Footer buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowRuleModalParam('')}
                      className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateParameterRules(showRuleModalParam, ruleModalRules)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer shadow-xs"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    );
  };

  if (showReportEntryView && selectedRequest) {
    return renderReportEntryView();
  }

  if (isSearchReportsView) {
    return (
      <DashboardLayout>
        <div className="space-y-4 pb-12 bg-white min-h-screen">
          
          {/* TITLE */}
          <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">
              Search lab reports
            </h1>
          </div>

          {/* FILTERS FORM MATCHING IMAGE 2 */}
          <div className="space-y-3 pt-1">
            {/* ROW 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
              
              {/* Duration (?) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <span>Duration</span>
                  <span className="text-slate-400 cursor-help" title="Select filter duration">ⓘ</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={searchDuration}
                    onChange={(e) => setSearchDuration(e.target.value)}
                    className="w-32 h-8 px-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="past_7_days">Past 7 days</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="past_30_days">Past 30 days</option>
                    <option value="this_month">This month</option>
                    <option value="last_month">Last month</option>
                    <option value="all">All time</option>
                  </select>
                  <div className="flex-1 h-8 px-2 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-1 text-[11px] text-slate-600 font-medium whitespace-nowrap overflow-hidden">
                    <span className="text-slate-400">📅</span>
                    <span className="truncate">{getDurationDateRangeStr(searchDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Patient first name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Patient first name</label>
                <input
                  type="text"
                  value={searchPatientName}
                  onChange={(e) => setSearchPatientName(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Status</label>
                <select
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Select status</option>
                  <option value="new">New</option>
                  <option value="create_bill">Create bill</option>
                  <option value="in_progress">In progress</option>
                  <option value="final">Final</option>
                  <option value="signed_off">Signed off</option>
                </select>
              </div>

              {/* Referred by */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Referred by</label>
                <select
                  value={searchReferredBy}
                  onChange={(e) => setSearchReferredBy(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Select referrer</option>
                  <option value="Self">Self</option>
                  {availableReferrers.filter(r => r !== 'Self').map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end text-xs font-semibold text-slate-700">
              
              {/* Reg. no. */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Reg. no.</label>
                <input
                  type="text"
                  value={searchRegNo}
                  onChange={(e) => setSearchRegNo(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Daily case no. */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Daily case no.</label>
                <input
                  type="text"
                  value={searchDailyCaseNo}
                  onChange={(e) => setSearchDailyCaseNo(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* UHID */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">UHID</label>
                <input
                  type="text"
                  value={searchUhid}
                  onChange={(e) => setSearchUhid(e.target.value)}
                  placeholder=""
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons: Show all filters / Search / Clear */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setShowAllFilters(!showAllFilters)}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer whitespace-nowrap"
                >
                  {showAllFilters ? 'Hide filters ^' : 'Show all filters v'}
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSearchFilters}
                  className="h-8 px-3 text-slate-600 hover:text-slate-900 rounded-md text-xs font-semibold cursor-pointer hover:bg-slate-100"
                >
                  Clear
                </button>
              </div>

            </div>

            {/* ROW 3 (Expanded / Additional filters) */}
            {showAllFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs font-semibold text-slate-700">
                {/* Select test */}
                <div className="space-y-1">
                  <select
                    value={searchSelectedTest}
                    onChange={(e) => setSearchSelectedTest(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">Select test</option>
                    {availableLabTests.map((t, idx) => (
                      <option key={t._id || idx} value={t.title || t.test}>
                        {t.title || t.test}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* TABLE OF SEARCH RESULTS MATCHING IMAGE 2 */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">REG. NO.</th>
                    <th className="py-3 px-4">DATE/TIME</th>
                    <th className="py-3 px-4">PATIENT</th>
                    <th className="py-3 px-4">REFERRED BY</th>
                    <th className="py-3 px-4">TESTS</th>
                    <th className="py-3 px-4">CC</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500 mb-1" />
                        <span>Loading search reports...</span>
                      </td>
                    </tr>
                  ) : searchFilteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                        No lab reports match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    searchFilteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* REG. NO. */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.regNo}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">{report.modBadge}</div>
                        </td>

                        {/* DATE/TIME */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{report.dateStr}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{report.time}</div>
                        </td>

                        {/* PATIENT */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <span>{report.ageSex}</span>
                            <span className="text-slate-400 text-[10px]">A ▾</span>
                          </div>
                        </td>

                        {/* REFERRED BY */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.referredBy}
                        </td>

                        {/* TESTS */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {report.tests}
                        </td>

                        {/* CC */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.cc}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4">
                          {report.statusCategory === 'final' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                              Final
                            </span>
                          ) : report.statusCategory === 'in_progress' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white shadow-2xs">
                              In progress
                            </span>
                          ) : report.statusCategory === 'create_bill' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-orange-500 text-white shadow-2xs">
                              Create bill
                            </span>
                          ) : report.statusCategory === 'signed_off' ? (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-600 text-white shadow-2xs">
                              Signed off
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                              New
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 font-semibold text-xs text-blue-600">
                            {report.statusCategory === 'create_bill' ? (
                              <button
                                type="button"
                                onClick={() => handleCreateBillFromOpd(report)}
                                className="hover:underline flex items-center gap-1 cursor-pointer text-orange-600 font-bold"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Create bill</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenProcessRequest(report.rawRequest)}
                                className="hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Enter results</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptView(report)}
                              className="hover:underline flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptView(report)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF AUTHORIZED SIGNATURES VIEW IS SELECTED
  if (isSignatoriesView) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" /> Authorized Signatories
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure doctors, pathologists, and specialists authorized to review and sign lab reports
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSignatoryId(null);
                setSignatoryForm({ name: '', designation: '', qualification: '', signatureImageUrl: '' });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Signatory</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side: Signatory Form Card */}
            <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSignatoryId ? 'Edit Signatory Profile' : 'Create Signatory Profile'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Specify credentials and upload signature stamp</p>
              </div>

              <form onSubmit={handleSaveSignatory} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Doctor / Pathologist Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.name}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, name: e.target.value })}
                    placeholder="e.g. Dr. Satish Kumar"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Designation / Role <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.designation}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, designation: e.target.value })}
                    placeholder="e.g. Consultant Pathologist"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Qualification <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={signatoryForm.qualification}
                    onChange={(e) => setSignatoryForm({ ...signatoryForm, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD (Pathology)"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">Signature Stamp Image</label>
                  <div className="relative w-44 h-24 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl flex flex-col items-center justify-center overflow-hidden">
                    {uploadingSign ? (
                      <div className="flex flex-col items-center gap-1">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-[10px] text-slate-400 font-bold">Uploading...</span>
                      </div>
                    ) : signatoryForm.signatureImageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={signatoryForm.signatureImageUrl}
                          alt="Signature Preview"
                          className="w-full h-full object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => setSignatoryForm({ ...signatoryForm, signatureImageUrl: '' })}
                          className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg border border-red-200 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 text-center p-2 gap-1">
                        <UserCheck className="w-6 h-6 text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400">No Image Uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSignatureUpload}
                      className="hidden" 
                      id="signatory-file-picker" 
                    />
                    <label 
                      htmlFor="signatory-file-picker"
                      className="inline-block px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-blue-200/50"
                    >
                      Choose Signature File
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">Supported file formats: jpeg, jpg, png (Max 200kb)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  {editingSignatoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSignatoryId(null);
                        setSignatoryForm({ name: '', designation: '', qualification: '', signatureImageUrl: '' });
                      }}
                      className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingSignatory}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    {savingSignatory ? 'Saving...' : editingSignatoryId ? 'Update Profile' : 'Save Signatory'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side: Active Signatories Directory Grid */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Signatories Directory</h3>
                <span className="text-xs text-slate-500 font-semibold">{signatories.length} Active Profiles</span>
              </div>

              {loadingSignatories ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold mt-2">Loading signatory list...</p>
                </div>
              ) : signatories.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-xs">No Authorized Signatories Found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Please add a signatory profile using the left config card.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {signatories.map((sig) => (
                    <div
                      key={sig._id}
                      className="border border-slate-200 hover:border-blue-400 rounded-2xl p-4 shadow-2xs transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0 border border-blue-100">
                          {sig.name?.[0] || 'D'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">{sig.name}</h4>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">{sig.designation}</p>
                          <p className="text-[11px] text-slate-400 font-medium truncate">{sig.qualification}</p>
                        </div>
                      </div>

                      {sig.signatureImageUrl && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center bg-slate-50/50 rounded-xl p-2 h-14">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sig.signatureImageUrl}
                            alt="Signature image"
                            className="max-h-full object-contain"
                          />
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-150 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEditSignatory(sig)}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSignatory(sig._id)}
                          className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF DUE REPORTS VIEW IS SELECTED FROM SIDEBAR
  if (isDueReportsView) {
    return (
      <DashboardLayout>
        <div className="space-y-6 pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" /> Business — Due Reports
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  View and manage all outstanding patient due amounts across lab billing records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-right">
                <span className="text-[11px] text-red-600 font-semibold block uppercase">Total Pending Dues</span>
                <span className="text-lg font-black text-red-700">₹{totalDueAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={dueSearchQuery}
                onChange={(e) => setDueSearchQuery(e.target.value)}
                placeholder="Search due report by patient name, UHID, Bill/Lab ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold shrink-0">
              Showing {filteredDueBills.length} of {dueBills.length} Due Records
            </span>
          </div>

          {/* Due Reports Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                    <th className="p-4">Bill / Lab ID</th>
                    <th className="p-4">Patient Details</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-right">Paid Amount</th>
                    <th className="p-4 text-right">Due Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="8" className="p-10 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                        <p className="text-xs text-slate-500 font-semibold mt-2">Loading due reports...</p>
                      </td>
                    </tr>
                  ) : filteredDueBills.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-400">
                        <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                        <p className="font-bold text-slate-700">No Outstanding Dues Found</p>
                        <p className="text-xs text-slate-400 mt-1">All patient dues have been fully settled.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDueBills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-orange-600">
                          {bill.billNo || bill.labId || 'BILL-REQ'}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{bill.patientId?.patientName || 'Patient'}</span>
                          <span className="text-[11px] text-slate-500 font-medium">UHID: {bill.patientId?.uhid || 'N/A'} • {bill.patientId?.mobile || ''}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-600">
                          {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800">
                          ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-semibold text-emerald-600">
                          ₹{(bill.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-black text-red-600 text-base">
                          ₹{(bill.dueAmount || bill.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-800">
                            {bill.paymentStatus || 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenPaymentModal(bill)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            Receive Payment
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // IF TODAY'S REPORTS VIEW IS SELECTED
  if (isTodaysReportsView) {
    return (
      <DashboardLayout>
        <div className="space-y-4 pb-12 bg-slate-50/50 min-h-screen">
          
          {/* TITLE ROW */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {selectedDate === new Date().toLocaleDateString('en-GB') ? 'Reports for today' : `Reports for ${selectedDate}`}
            </h1>
            <a
              href="#recent-changes"
              onClick={(e) => { e.preventDefault(); }}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>✨ Recent changes</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* CONTROLS & FILTERS ROW */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            {/* Left Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search in page */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInPage}
                  onChange={(e) => setSearchInPage(e.target.value)}
                  placeholder="Search in page"
                  className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg h-8 px-1">
                <button 
                  type="button"
                  onClick={handlePreviousDay}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                  title="Previous day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-700">
                  <span className="text-slate-400">📅</span>
                  <span>{selectedDate}</span>
                </div>
                <button 
                  type="button"
                  onClick={handleNextDay}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                  title="Next day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Go to Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="h-8 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              {/* Stats Button */}
              <button
                type="button"
                className="h-8 px-3 border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Stats</span>
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span>Sort by:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-8 px-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-800 outline-none cursor-pointer"
                >
                  <option value="oldest">Oldest first</option>
                  <option value="newest">Newest first</option>
                </select>
              </div>
            </div>
          </div>

          {/* STATUS TABS & PRINTED COUNTER ROW */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTabFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'all'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All</span>
                <span className="px-1.5 py-0.2 bg-slate-200/80 rounded-full text-[10px] font-bold">{countAll}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('new')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'new'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>New</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'new' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countNew}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('create_bill')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'create_bill'
                    ? 'bg-orange-100 text-orange-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Create bill</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'create_bill' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
                }`}>{countCreateBill}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'in_progress'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>In progress</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countInProgress}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('final')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'final'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Final</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'final' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countFinal}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabFilter('signed_off')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTabFilter === 'signed_off'
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Signed off</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTabFilter === 'signed_off' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>{countSignedOff}</span>
              </button>
            </div>

            {/* Printed Counter on Right */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>0/{filteredReports.length} Printed</span>
            </div>
          </div>

          {/* REPORTS TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">REG. NO.</th>
                    <th className="py-3 px-4">DATE/TIME</th>
                    <th className="py-3 px-4">PATIENT</th>
                    <th className="py-3 px-4">REFERRED BY</th>
                    <th className="py-3 px-4">TESTS</th>
                    <th className="py-3 px-4">CC</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {loadingDashboard ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500 mb-1" />
                        <span>Loading reports...</span>
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                        No reports match the current filter or date.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* REG. NO. */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.regNo}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">{report.modBadge}</div>
                        </td>

                        {/* DATE/TIME */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{report.dateStr}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{report.time}</div>
                        </td>

                        {/* PATIENT */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <span>{report.ageSex}</span>
                            <User className="w-3 h-3 text-slate-400" />
                            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                        </td>

                        {/* REFERRED BY */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.referredBy}
                        </td>

                        {/* TESTS */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {report.tests}
                        </td>

                        {/* CC */}
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {report.cc}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4">
                          {report.statusCategory === 'create_bill' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                              Create bill
                            </span>
                          ) : report.statusCategory === 'in_progress' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              In progress
                            </span>
                          ) : report.statusCategory === 'final' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Final
                            </span>
                          ) : report.statusCategory === 'signed_off' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Signed off
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                              New
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 font-semibold text-xs text-blue-600">
                            {report.statusCategory === 'create_bill' ? (
                              <button
                                type="button"
                                onClick={() => handleCreateBillFromOpd(report)}
                                className="hover:underline flex items-center gap-1 cursor-pointer text-orange-600 font-bold"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Create bill</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenProcessRequest(report.rawRequest)}
                                className="hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Enter results</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptView(report)}
                              className="hover:underline flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View bill</span>
                            </button>
                            {(report.statusCategory === 'final' || report.statusCategory === 'signed_off') && (
                              <button
                                type="button"
                                onClick={() => handleOpenReportPrint(report.rawRequest)}
                                className="hover:underline flex items-center gap-1 cursor-pointer text-blue-600 font-bold"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Browse print</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptView(report)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {renderSharedModals()}
      </DashboardLayout>
    );
  }

  // MAIN DASHBOARD VIEW
  return (
    <DashboardLayout>
      <div className="space-y-5 pb-12 bg-slate-50/50 min-h-screen">
        
        {/* HEADER TITLE */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Welcome back. Here is your daily lab performance and request summary.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/new-bill')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Bill</span>
          </button>
        </div>

        {/* TOP DASHBOARD CARDS - MATCHING REFERENCE DESIGN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 items-stretch">
          
          {/* CARD 1: Payments due */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Payments due</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">For all time</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=due-reports')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Content / Empty State */}
            <div className="my-auto py-3">
              {filteredDueBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-md bg-slate-100/90 flex items-center justify-center text-slate-500 mb-2">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">All dues are cleared.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 pb-1.5">
                    <span>Pending: {filteredDueBills.length} Patient(s)</span>
                    <span className="font-extrabold text-red-600">Total ₹{totalDueAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {filteredDueBills.slice(0, 2).map((bill) => (
                    <div key={bill._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{bill.patientId?.patientName || 'Patient'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Bill #{bill.billNo || bill.labId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-red-600">₹{(bill.dueAmount || bill.totalAmount || 0).toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(bill)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: Recent transactions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent transactions</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">For today</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=todays-reports')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Top center View all link matching screenshot */}
            <div className="text-center -mt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=todays-reports')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                <span>View all</span>
                <span>»</span>
              </button>
            </div>

            {/* Content / Empty State */}
            <div className="my-auto py-2">
              {labBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-md bg-slate-100/90 flex items-center justify-center text-slate-400 mb-2">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No transactions found for today.</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 mb-2.5">Get started by adding a new case.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/new-bill')}
                    className="px-3 py-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add new case</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {labBills.slice(0, 2).map((bill) => (
                    <div key={bill._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{bill.patientId?.patientName || 'Patient'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">#{bill.billNo || bill.labId} • {bill.paymentMethod || 'Cash'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 block">₹{(bill.paidAmount || bill.totalAmount || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{bill.paymentStatus || 'Paid'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: Recent activities (Tracking of lab module) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent activities</h2>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100/80 text-amber-800 inline-flex items-center gap-1">
                    <span>★</span>
                    <span>Tracking of lab module</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard?view=todays-reports')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Lab Module Activity Feed */}
            <div className="my-auto py-2">
              <div className="space-y-2">
                {rawReportsList.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      item.status === 'Final' ? 'bg-emerald-500' :
                      item.status === 'In progress' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {item.patientName} <span className="font-normal text-slate-500">({item.tests})</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Reg {item.regNo} • Status: <span className="font-semibold text-slate-700">{item.status}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 4: Lab request (Orders from OPD & IPD modules) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px] min-h-[230px]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Lab request</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Orders from OPD & IPD modules</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/new-bill')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                + New request
              </button>
            </div>

            {/* Recent OPD / IPD Requests Overview */}
            <div className="my-auto py-2">
              {rawReportsList.filter(item => item.isOpdOrIpd).length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-2">
                  <div className="w-8 h-8 rounded-md bg-slate-100/90 flex items-center justify-center text-slate-400 mb-1.5">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No OPD / IPD lab orders</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Orders placed from OPD or IPD will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rawReportsList
                    .filter(item => item.isOpdOrIpd)
                    .slice(0, 2)
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.patientName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              item.source === 'IPD' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>{item.source || 'OPD'} • {item.regNo}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{item.tests}</span>
                        </div>
                        {item.statusCategory === 'create_bill' ? (
                          <button
                            type="button"
                            onClick={() => handleCreateBillFromOpd(item)}
                            className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-md cursor-pointer shrink-0 shadow-2xs"
                          >
                            Create bill
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenProcessRequest(item.rawRequest)}
                            className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md cursor-pointer shrink-0"
                          >
                            Enter results
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {renderSharedModals()}

    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
