import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, CheckCircle, Eye, Printer, Download,
  Plus, Trash2, Edit3, HeartPulse, User, Phone, MapPin, CalendarDays, Droplets, ShieldAlert
} from 'lucide-react';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { formatUhid } from '../../utils/uhid';
import { sanitizeClonedDocumentForPdf } from '../../utils/pdfUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const DialysisRecordForm = () => {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const recordId = searchParams.get('recordId');
  const viewMode = searchParams.get('view') === 'true';
  const printAreaRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [record, setRecord] = useState(null);
  
  // Header form state
  const [headerForm, setHeaderForm] = useState({
    physicianName: '',
    physicianContact: '',
    emergencyContact: '',
    ipNumber: '',
    dayCareVisitNumber: ''
  });

  // Table sessions state
  const [sessions, setSessions] = useState([]);
  // Currently editing row index. null if none.
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  // Temp form state for the row currently being added or edited
  const [rowForm, setRowForm] = useState({
    date: '',
    time: '',
    startingWeight: '',
    startingBP: '',
    endingWeight: '',
    endingBP: '',
    fluidRemoved: '',
    comments: ''
  });

  const [rowErrors, setRowErrors] = useState({});

  // Permissions checks
  const canEdit = ['admin', 'doctor', 'nursing'].includes(user?.role);
  const isViewOnly = viewMode || !canEdit || record?.status === 'Completed';

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Patient detailed info
        const { data: patientData } = await client.get(`/same-day-care/dialysis/patient/${patientId}`);
        setPatient(patientData);
        
        setHeaderForm(prev => ({
          ...prev,
          ipNumber: patientData.ipdNumber || '',
          dayCareVisitNumber: patientData.registrationNumber || ''
        }));

        // 2. Fetch doctors list for auto-fill and selection
        const { data: doctors } = await client.get('/admin/doctors');
        setDoctorsList(doctors || []);

        // 3. Fetch Hospital settings for printing logo & name
        try {
          const { data: settings } = await client.get('/admin/hospital-settings');
          setHospitalSettings(settings?.data || settings);
        } catch (settingsErr) {
          console.warn('Failed to load hospital settings', settingsErr);
        }

        // 4. Fetch Dialysis record if recordId is provided
        if (recordId) {
          const { data: recData } = await client.get(`/same-day-care/dialysis/record/${recordId}`);
          setRecord(recData);
          setHeaderForm({
            physicianName: recData.physicianName || '',
            physicianContact: recData.physicianContact || '',
            emergencyContact: recData.emergencyContact || '',
            ipNumber: recData.ipNumber || '',
            dayCareVisitNumber: recData.dayCareVisitNumber || ''
          });
          setSessions(recData.dialysisSessions || []);
        } else {
          // Pre-select physician if current user is doctor
          if (user?.role === 'doctor') {
            const currentDoc = doctors?.find(d => d.username === user.username);
            if (currentDoc) {
              setHeaderForm(prev => ({
                ...prev,
                physicianName: currentDoc.doctorName || user.doctorName || '',
                physicianContact: currentDoc.mobile || user.mobile || ''
              }));
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load required record data');
        navigate('/same-day-care/dialysis');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [patientId, recordId, navigate, user]);

  // Handle doctor selection change
  const handleDoctorChange = (e) => {
    const selectedDocName = e.target.value;
    const docObj = doctorsList.find(d => d.doctorName.toLowerCase() === selectedDocName.trim().toLowerCase());
    setHeaderForm(prev => ({
      ...prev,
      physicianName: selectedDocName,
      physicianContact: docObj ? docObj.mobile || '' : prev.physicianContact
    }));
  };

  const handleHeaderChange = (field, val) => {
    setHeaderForm(prev => ({ ...prev, [field]: val }));
  };

  // Row operations
  const startAddSession = () => {
    if (editingRowIndex !== null) {
      toast.error('Please save or cancel the active row first.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    setRowForm({
      date: todayStr,
      time: timeStr,
      startingWeight: '',
      startingBP: '',
      endingWeight: '',
      endingBP: '',
      fluidRemoved: '',
      comments: ''
    });
    setRowErrors({});
    // Push a temporary row to the sessions list
    setSessions(prev => [...prev, { isTemp: true }]);
    setEditingRowIndex(sessions.length); // The index will be the previous length
  };

  const startEditSession = (index) => {
    if (editingRowIndex !== null) {
      toast.error('Please save or cancel the active row first.');
      return;
    }
    const target = sessions[index];
    setRowForm({
      date: target.date ? new Date(target.date).toISOString().split('T')[0] : '',
      time: target.time || '',
      startingWeight: target.startingWeight || '',
      startingBP: target.startingBP || '',
      endingWeight: target.endingWeight || '',
      endingBP: target.endingBP || '',
      fluidRemoved: target.fluidRemoved || '',
      comments: target.comments || ''
    });
    setRowErrors({});
    setEditingRowIndex(index);
  };

  const cancelRowEdit = (index) => {
    if (sessions[index].isTemp) {
      // Remove the temporary added row
      setSessions(prev => prev.filter((_, i) => i !== index));
    }
    setEditingRowIndex(null);
    setRowErrors({});
  };

  const validateRow = () => {
    setRowErrors({});
    return true;
  };

  const saveRowLocal = (index) => {
    const updatedSession = {
      ...rowForm,
      startingWeight: rowForm.startingWeight !== '' && rowForm.startingWeight !== undefined && rowForm.startingWeight !== null && !isNaN(rowForm.startingWeight) ? parseFloat(rowForm.startingWeight) : null,
      endingWeight: rowForm.endingWeight !== '' && rowForm.endingWeight !== undefined && rowForm.endingWeight !== null && !isNaN(rowForm.endingWeight) ? parseFloat(rowForm.endingWeight) : null,
      fluidRemoved: rowForm.fluidRemoved !== '' && rowForm.fluidRemoved !== undefined && rowForm.fluidRemoved !== null && !isNaN(rowForm.fluidRemoved) ? parseFloat(rowForm.fluidRemoved) : null,
      isTemp: false
    };

    setSessions(prev => {
      const copy = [...prev];
      copy[index] = updatedSession;
      return copy;
    });

    setEditingRowIndex(null);
    toast.success('Session details updated in list');
  };

  const deleteSessionRow = (index) => {
    if (!window.confirm('Are you sure you want to delete this dialysis session?')) {
      return;
    }
    setSessions(prev => prev.filter((_, i) => i !== index));
    if (editingRowIndex === index) {
      setEditingRowIndex(null);
    } else if (editingRowIndex > index) {
      setEditingRowIndex(prev => prev - 1);
    }
    toast.success('Session removed from list');
  };

  // Calculations for average row
  const calc = () => {
    const validSessions = sessions.filter(s => !s.isTemp);
    if (validSessions.length === 0) {
      return { startingWeight: '0.00', endingWeight: '0.00', fluidRemoved: '0.00' };
    }
    let startW = 0, startWCount = 0;
    let endW = 0, endWCount = 0;
    let fluid = 0, fluidCount = 0;

    validSessions.forEach(s => {
      if (s.startingWeight !== undefined && s.startingWeight !== '') {
        startW += parseFloat(s.startingWeight);
        startWCount++;
      }
      if (s.endingWeight !== undefined && s.endingWeight !== '') {
        endW += parseFloat(s.endingWeight);
        endWCount++;
      }
      if (s.fluidRemoved !== undefined && s.fluidRemoved !== '') {
        fluid += parseFloat(s.fluidRemoved);
        fluidCount++;
      }
    });

    return {
      startingWeight: startWCount > 0 ? (startW / startWCount).toFixed(2) : '0.00',
      endingWeight: endWCount > 0 ? (endW / endWCount).toFixed(2) : '0.00',
      fluidRemoved: fluidCount > 0 ? (fluid / fluidCount).toFixed(2) : '0.00'
    };
  };

  const averages = calc();

  // Save the entire Dialysis Record (header details + sessions) to Mongoose
  const handleSaveAll = async (customStatus = null) => {
    if (editingRowIndex !== null) {
      toast.error('Please save or cancel the session row currently being edited.');
      return;
    }

    if (!headerForm.physicianName) {
      toast.error('Physician Name is required');
      return;
    }

    setSaving(true);
    try {
      const finalStatus = customStatus || (record?.status || 'Draft');
      const payload = {
        patientId,
        patientName: patient?.patientName || '',
        uhid: patient?.uhid || '',
        mobile: patient?.mobile || '',
        gender: patient?.gender || '',
        age: patient?.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
        physicianName: headerForm.physicianName,
        physicianContact: headerForm.physicianContact,
        emergencyContact: headerForm.emergencyContact,
        ipNumber: headerForm.ipNumber,
        dayCareVisitNumber: headerForm.dayCareVisitNumber,
        dialysisSessions: sessions,
        status: finalStatus
      };

      if (record?._id) {
        // Update existing record
        payload.auditTrailRemark = `Dialysis Record saved as ${finalStatus}. Sessions: ${sessions.length}`;
        const { data } = await client.put(`/same-day-care/dialysis/record/${record._id}`, payload);
        setRecord(data.record);
        toast.success(finalStatus === 'Completed' ? 'Record locked & completed' : 'Dialysis record saved');
      } else {
        // Create new record
        const { data } = await client.post('/same-day-care/dialysis/record', payload);
        setRecord(data.record);
        toast.success('Dialysis record created successfully');
        navigate(`/same-day-care/dialysis/treatment/${patientId}?recordId=${data.record._id}`, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save dialysis record');
    } finally {
      setSaving(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download PDF function
  const handleDownloadPDF = async () => {
    try {
      const element = printAreaRef.current;
      if (!element) {
        toast.error('Print container content not found');
        return;
      }

      toast.loading('Generating PDF...');
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => sanitizeClonedDocumentForPdf(clonedDoc)
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 Width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Dialysis_Record_${patient?.patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-orange-50/10 p-4">
        <div className="w-full max-w-5xl">
          <SkeletonTable rows={5} columns={5} className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls (Hidden during print) */}
      <div className="flex items-center justify-between no-print border-b border-orange-100 pb-4">
        <button
          onClick={() => navigate('/same-day-care/dialysis')}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1 font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="flex gap-2">
          {record?._id && (
            <>
              <button
                onClick={handlePrint}
                className="btn-secondary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4 text-orange-500" /> Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn-secondary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
              >
                <Download className="h-4 w-4 text-sky-500" /> Export PDF
              </button>
            </>
          )}

          {!isViewOnly && (
            <>
              <button
                onClick={() => handleSaveAll('Draft')}
                disabled={saving}
                className="btn-secondary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Draft
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Lock and complete this Dialysis Record? You will not be able to edit it anymore.')) {
                    handleSaveAll('Completed');
                  }
                }}
                disabled={saving}
                className="btn text-xs py-2 px-4 font-bold flex items-center gap-1.5 bg-green-600 hover:bg-green-700 shadow-sm"
              >
                <CheckCircle className="h-4 w-4" /> Lock & Complete
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Only Warning Alert */}
      {isViewOnly && (
        <div className="no-print flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold">View Only Mode:</span> This Dialysis Record is in read-only mode because it has been completed/locked, or you have view-only permissions.
          </div>
        </div>
      )}

      {/* Main Workspace Grid (Form and list) */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Patient Details & Physicians Form Card */}
        <div className="card p-6 border border-orange-100 bg-white no-print">
          <div className="border-b border-orange-100 pb-3 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            <h2 className="font-extrabold text-gray-800 text-sm uppercase tracking-wide">Patient & Clinical Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Patient Vitals Readonly */}
            <div className="space-y-1 bg-orange-50/20 p-3 rounded-xl border border-orange-100/50">
              <span className="block text-[10px] uppercase font-bold text-orange-600">Patient Details</span>
              <div className="font-bold text-gray-800 text-sm mt-0.5">{patient?.patientName}</div>
              <div className="text-gray-500">UHID: {formatUhid(patient?.uhid)}</div>
              <div className="text-gray-500">{patient?.gender} • {patient?.dob ? `${Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : '-'}</div>
              <div className="text-gray-500">Address: {patient?.address}</div>
            </div>

            {/* Visit Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">IP Number</label>
                <input
                  type="text"
                  className="input py-2 bg-gray-50 font-semibold"
                  placeholder="Not Admitted"
                  disabled
                  value={headerForm.ipNumber}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Day Care Visit Number</label>
                <input
                  type="text"
                  className="input py-2 bg-gray-50 font-semibold"
                  placeholder="No daycare visit active"
                  disabled
                  value={headerForm.dayCareVisitNumber}
                />
              </div>
            </div>

            {/* Doctor/Physician selection */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Physician Name *</label>
                {isViewOnly ? (
                  <input
                    type="text"
                    className="input py-2 bg-gray-50"
                    disabled
                    value={headerForm.physicianName}
                  />
                ) : (
                  <div>
                    <input
                      type="text"
                      list="doctors-datalist"
                      className="input py-2"
                      placeholder="Type or select physician..."
                      value={headerForm.physicianName}
                      onChange={handleDoctorChange}
                    />
                    <datalist id="doctors-datalist">
                      {doctorsList.map(d => (
                        <option key={d._id} value={d.doctorName}>
                          {d.doctorName} ({d.username})
                        </option>
                      ))}
                    </datalist>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Physician Contact Info</label>
                <input
                  type="text"
                  className={`input py-2 ${isViewOnly ? 'bg-gray-50' : ''}`}
                  disabled={isViewOnly}
                  placeholder="Enter contact info..."
                  value={headerForm.physicianContact}
                  onChange={(e) => handleHeaderChange('physicianContact', e.target.value)}
                />
              </div>
            </div>

            {/* Emergency Contact manually typed */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Emergency Contact Info *</label>
              <textarea
                rows={4}
                className="input py-2 h-[104px] resize-none"
                placeholder="Enter emergency contact person's name and contact number..."
                disabled={isViewOnly}
                value={headerForm.emergencyContact}
                onChange={(e) => handleHeaderChange('emergencyContact', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sessions Table Card */}
        <div className="card overflow-hidden border border-orange-100 bg-white no-print">
          <div className="p-4 border-b border-orange-100 bg-orange-50/20 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-sky-500" /> Dialysis Sessions List
            </h3>
            {!isViewOnly && (
              <button
                type="button"
                onClick={startAddSession}
                className="btn text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Session
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold uppercase text-gray-500 border-b border-orange-100">
                  <th className="p-3 pl-4">Date & Time</th>
                  <th className="p-3">Starting Weight (kg)</th>
                  <th className="p-3">Starting BP</th>
                  <th className="p-3">Ending Weight (kg)</th>
                  <th className="p-3">Ending BP</th>
                  <th className="p-3">Fluid Removed (ml/L)</th>
                  <th className="p-3">Comments</th>
                  {!isViewOnly && <th className="p-3 pr-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={isViewOnly ? 7 : 8} className="p-8 text-center text-gray-400">
                      <Droplets className="h-8 w-8 mx-auto mb-2 opacity-30 text-sky-500" />
                      <p className="font-bold text-xs">No dialysis sessions recorded yet</p>
                      <p className="text-[10px]">Click "Add Session" to add a new treatment row.</p>
                    </td>
                  </tr>
                ) : (
                  sessions.map((session, idx) => {
                    const isEditing = editingRowIndex === idx;

                    if (isEditing) {
                      return (
                        <tr key={idx} className="bg-orange-50/30">
                          {/* Date and Time inputs */}
                          <td className="p-2 pl-4 space-y-1">
                            <input
                              type="date"
                              className={`input py-1 text-xs px-2 ${rowErrors.date ? 'border-red-500' : ''}`}
                              value={rowForm.date}
                              onChange={(e) => setRowForm(prev => ({ ...prev, date: e.target.value }))}
                            />
                            <input
                              type="time"
                              className="input py-1 text-xs px-2"
                              value={rowForm.time}
                              onChange={(e) => setRowForm(prev => ({ ...prev, time: e.target.value }))}
                            />
                          </td>

                          {/* Starting Weight input */}
                          <td className="p-2">
                            <input
                              type="text"
                              className={`input py-1 text-xs px-2 ${rowErrors.startingWeight ? 'border-red-500' : ''}`}
                              placeholder="e.g. 72.4"
                              value={rowForm.startingWeight}
                              onChange={(e) => setRowForm(prev => ({ ...prev, startingWeight: e.target.value }))}
                            />
                          </td>

                          {/* Starting BP input */}
                          <td className="p-2">
                            <input
                              type="text"
                              className={`input py-1 text-xs px-2 ${rowErrors.startingBP ? 'border-red-500' : ''}`}
                              placeholder="e.g. 120/80"
                              value={rowForm.startingBP}
                              onChange={(e) => setRowForm(prev => ({ ...prev, startingBP: e.target.value }))}
                            />
                          </td>

                          {/* Ending Weight input */}
                          <td className="p-2">
                            <input
                              type="text"
                              className={`input py-1 text-xs px-2 ${rowErrors.endingWeight ? 'border-red-500' : ''}`}
                              placeholder="e.g. 70.1"
                              value={rowForm.endingWeight}
                              onChange={(e) => setRowForm(prev => ({ ...prev, endingWeight: e.target.value }))}
                            />
                          </td>

                          {/* Ending BP input */}
                          <td className="p-2">
                            <input
                              type="text"
                              className={`input py-1 text-xs px-2 ${rowErrors.endingBP ? 'border-red-500' : ''}`}
                              placeholder="e.g. 118/78"
                              value={rowForm.endingBP}
                              onChange={(e) => setRowForm(prev => ({ ...prev, endingBP: e.target.value }))}
                            />
                          </td>

                          {/* Fluid Removed input */}
                          <td className="p-2">
                            <input
                              type="text"
                              className={`input py-1 text-xs px-2 ${rowErrors.fluidRemoved ? 'border-red-500' : ''}`}
                              placeholder="e.g. 2300"
                              value={rowForm.fluidRemoved}
                              onChange={(e) => setRowForm(prev => ({ ...prev, fluidRemoved: e.target.value }))}
                            />
                          </td>

                          {/* Comments input */}
                          <td className="p-2">
                            <textarea
                              rows={2}
                              className="input py-1 text-xs px-2 resize-none"
                              placeholder="Session details..."
                              value={rowForm.comments}
                              onChange={(e) => setRowForm(prev => ({ ...prev, comments: e.target.value }))}
                            />
                          </td>

                          {/* Edit Actions */}
                          <td className="p-2 pr-4 text-center space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => saveRowLocal(idx)}
                              className="btn py-1 px-2.5 text-[10px] font-bold bg-green-600 hover:bg-green-700 shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelRowEdit(idx)}
                              className="btn-secondary py-1 px-2 text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={idx} className="hover:bg-orange-50/10">
                        <td className="p-3 pl-4 text-xs font-semibold">
                          <div>
                            {session.date ? new Date(session.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </div>
                          <div className="text-[10px] text-gray-400">{session.time || '-'}</div>
                        </td>
                        <td className="p-3 text-xs font-bold text-gray-700">{session.startingWeight} kg</td>
                        <td className="p-3 text-xs font-mono text-gray-600">{session.startingBP}</td>
                        <td className="p-3 text-xs font-bold text-gray-700">{session.endingWeight} kg</td>
                        <td className="p-3 text-xs font-mono text-gray-600">{session.endingBP}</td>
                        <td className="p-3 text-xs font-bold text-sky-600">{session.fluidRemoved} ml/L</td>
                        <td className="p-3 text-xs text-gray-600 max-w-[200px] truncate" title={session.comments}>
                          {session.comments || '-'}
                        </td>
                        {!isViewOnly && (
                          <td className="p-3 pr-4 text-center whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={() => startEditSession(idx)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-block"
                              title="Edit Session"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSessionRow(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg inline-block"
                              title="Delete Session"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}

                {/* Averages Row */}
                {sessions.filter(s => !s.isTemp).length > 0 && (
                  <tr className="bg-orange-50/20 font-bold border-t border-orange-200">
                    <td className="p-3 pl-4 text-xs text-gray-800 uppercase tracking-wide">Averages</td>
                    <td className="p-3 text-xs text-orange-700">{averages.startingWeight} kg</td>
                    <td className="p-3 text-xs text-gray-400 font-normal">-</td>
                    <td className="p-3 text-xs text-orange-700">{averages.endingWeight} kg</td>
                    <td className="p-3 text-xs text-gray-400 font-normal">-</td>
                    <td className="p-3 text-xs text-sky-700">{averages.fluidRemoved} ml/L</td>
                    <td className="p-3 text-xs text-gray-400 font-normal" colSpan={isViewOnly ? 1 : 2}>-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collapsible Audit Logs Card */}
        {record?.auditTrail && record.auditTrail.length > 0 && (
          <div className="card p-5 border border-orange-100 bg-white no-print">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-orange-500" /> Audit Log Trail
            </h3>
            <div className="max-h-[150px] overflow-y-auto divide-y divide-gray-150 text-[11px] text-gray-500">
              {record.auditTrail.map((log, index) => (
                <div key={index} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-700 mr-2">[{log.action}]</span>
                    <span>{log.remarks}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 text-right whitespace-nowrap pl-4">
                    <div>{log.performedByName}</div>
                    <div>{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* A4 PORTRAIT PRINT LAYOUT PREVIEW (Visible only in print) */}
      {/* ---------------------------------------------------- */}
      <div className="print-preview-container print:block hidden" style={{ display: 'none' }}>
        <div ref={printAreaRef} id="print-area" className="bg-white text-black p-8 font-sans w-[210mm] min-h-[297mm] mx-auto text-sm">
          {/* Header Details */}
          <div className="border-b border-gray-800 pb-4 mb-6 flex justify-between items-start">
            <div className="flex items-center gap-3">
              {hospitalSettings?.logoUrl ? (
                <img src={hospitalSettings.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
              ) : (
                <div className="h-14 w-14 bg-gray-200 border border-gray-400 rounded-xl flex items-center justify-center font-bold text-lg">H</div>
              )}
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{hospitalSettings?.hospitalName || user?.hospitalName || 'HOSPITAL'}</h1>
                <p className="text-[10px] text-gray-500 leading-tight max-w-sm mt-0.5">{hospitalSettings?.address}</p>
                <p className="text-[10px] text-gray-500 leading-tight">Ph: {hospitalSettings?.mobileNumbers?.join(', ')}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-base font-extrabold uppercase tracking-wider text-orange-700">Individual Dialysis Record</h2>
              <div className="text-[10px] text-gray-400 mt-1">Print Date: {new Date().toLocaleString()}</div>
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-2 gap-4 mb-6 border border-gray-800 rounded-xl p-4 text-[11px] leading-relaxed">
            {/* Patient Info */}
            <div>
              <h3 className="font-extrabold text-[12px] border-b border-gray-800 pb-1 mb-2 uppercase text-gray-700">Patient Details</h3>
              <div><span className="font-bold">Name:</span> {patient?.patientName}</div>
              <div><span className="font-bold">UHID / IP Number:</span> {formatUhid(patient?.uhid)} {headerForm.ipNumber ? ` / ${headerForm.ipNumber}` : ''}</div>
              <div><span className="font-bold">Age / Gender:</span> {patient?.dob ? `${Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))} Years` : '-'} / {patient?.gender}</div>
              <div><span className="font-bold">Mobile Number:</span> {patient?.mobile}</div>
              <div><span className="font-bold">Address:</span> {patient?.address}</div>
            </div>

            {/* Clinical & Doctor Info */}
            <div>
              <h3 className="font-extrabold text-[12px] border-b border-gray-800 pb-1 mb-2 uppercase text-gray-700">Clinical Details</h3>
              <div><span className="font-bold">Physician Name:</span> {headerForm.physicianName || 'N/A'}</div>
              <div><span className="font-bold">Physician Contact:</span> {headerForm.physicianContact || 'N/A'}</div>
              <div><span className="font-bold">Day Care Visit No:</span> {headerForm.dayCareVisitNumber || 'N/A'}</div>
              <div><span className="font-bold">Emergency Contact:</span> {headerForm.emergencyContact || 'N/A'}</div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="mb-6">
            <h3 className="font-extrabold text-[12px] uppercase text-gray-700 mb-2">Recorded Dialysis Sessions</h3>
            <table className="w-full text-left text-[11px] border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-800 text-[10px] font-bold uppercase">
                  <th className="p-2 border border-gray-800">Date & Time</th>
                  <th className="p-2 border border-gray-800 text-center">Starting Weight</th>
                  <th className="p-2 border border-gray-800 text-center">Starting BP</th>
                  <th className="p-2 border border-gray-800 text-center">Ending Weight</th>
                  <th className="p-2 border border-gray-800 text-center">Ending BP</th>
                  <th className="p-2 border border-gray-800 text-center">Fluid Removed</th>
                  <th className="p-2 border border-gray-800">Comments</th>
                </tr>
              </thead>
              <tbody>
                {sessions.filter(s => !s.isTemp).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400">No session records found.</td>
                  </tr>
                ) : (
                  sessions.filter(s => !s.isTemp).map((session, idx) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="p-2 border border-gray-800">
                        <div>{session.date ? new Date(session.date).toLocaleDateString() : '-'}</div>
                        <div className="text-[9px] text-gray-500">{session.time}</div>
                      </td>
                      <td className="p-2 border border-gray-800 text-center">{session.startingWeight} kg</td>
                      <td className="p-2 border border-gray-800 text-center">{session.startingBP}</td>
                      <td className="p-2 border border-gray-800 text-center">{session.endingWeight} kg</td>
                      <td className="p-2 border border-gray-800 text-center">{session.endingBP}</td>
                      <td className="p-2 border border-gray-800 text-center">{session.fluidRemoved} ml/L</td>
                      <td className="p-2 border border-gray-800 whitespace-pre-wrap max-w-[150px]">{session.comments || '-'}</td>
                    </tr>
                  ))
                )}
                
                {/* Averages Row */}
                {sessions.filter(s => !s.isTemp).length > 0 && (
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-800">
                    <td className="p-2 border border-gray-800 uppercase text-gray-700">Averages</td>
                    <td className="p-2 border border-gray-800 text-center">{averages.startingWeight} kg</td>
                    <td className="p-2 border border-gray-800 text-center text-gray-400 font-normal">-</td>
                    <td className="p-2 border border-gray-800 text-center">{averages.endingWeight} kg</td>
                    <td className="p-2 border border-gray-800 text-center text-gray-400 font-normal">-</td>
                    <td className="p-2 border border-gray-800 text-center text-sky-800">{averages.fluidRemoved} ml/L</td>
                    <td className="p-2 border border-gray-800 text-gray-400 font-normal">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Signature Sections */}
          <div className="border-t-2 border-gray-800 pt-8 mt-12">
            <div className="grid grid-cols-2 gap-8 text-[11px]">
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">
                  <p className="font-bold uppercase text-gray-700">Doctor Signature</p>
                  <p className="text-[10px] text-gray-400">Date & Time: __________________</p>
                </div>
              </div>
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">
                  <p className="font-bold uppercase text-gray-700">Nurse / Technician Signature</p>
                  <p className="text-[10px] text-gray-400">Date & Time: __________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printing Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body, #root, #root > div {
            background: white !important;
            background-color: white !important;
            margin: 0 !important;
            padding: 1cm !important;
          }
          aside, header, nav, .no-print {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          #print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DialysisRecordForm;
