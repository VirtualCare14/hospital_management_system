import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FlaskConical, Plus, Save, Send, Scissors, X } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { durationUnits } from '../../utils/options';
import { formatDate } from '../../utils/dateFormat';

const ConsultationPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState([{ symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }]);
  const [isVitalsEditable, setIsVitalsEditable] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSymptomIndex, setActiveSymptomIndex] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [newTest, setNewTest] = useState('');
  const [testQuery, setTestQuery] = useState('');
  const [availableTests, setAvailableTests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [sendingToIpd, setSendingToIpd] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [generalPastHistory, setGeneralPastHistory] = useState('');
  const [diagnosisRemark, setDiagnosisRemark] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemarks, setFollowUpRemarks] = useState('');
  const [visitId, setVisitId] = useState(null);
  const [previousConsultation, setPreviousConsultation] = useState(null);
  const [subServices, setSubServices] = useState([]);
  const [showSameDayModal, setShowSameDayModal] = useState(false);
  const [sdCareType, setSdCareType] = useState('');
  const [sdSelectedDocId, setSdSelectedDocId] = useState('');
  const [sdRemarks, setSdRemarks] = useState('');
  const [sdDoctors, setSdDoctors] = useState([]);
  const [loadingSdDoctors, setLoadingSdDoctors] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (showSameDayModal) {
      setLoadingSdDoctors(true);
      client.get('/admin/doctors')
        .then(({ data }) => {
          setSdDoctors(data || []);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load Same Day Care providers list");
        })
        .finally(() => setLoadingSdDoctors(false));
    }
  }, [showSameDayModal]);

  // Load patient AND visit information
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load patient info
        const patientRes = await client.get(`/patients/${patientId}`);
        setPatient(patientRes.data);
        reset({
          weight: patientRes.data.demographics?.weight || '',
          height: patientRes.data.demographics?.height || '',
          temperature: patientRes.data.demographics?.temperature || '',
          bloodPressure: patientRes.data.demographics?.bloodPressure || ''
        });

        // Load previous consultations to find latest completed one
        try {
          const consultationsRes = await client.get(`/consultation/${patientId}`);
          const completedConsultation = consultationsRes.data.find(c => c.consultationStatus === 'completed');
          if (completedConsultation) {
            setPreviousConsultation(completedConsultation);
          }
        } catch (err) {
          console.log('Error loading previous consultations:', err);
        }

        // Get the latest visit for this patient
        try {
          const visitsRes = await client.get(`/patients/${patientId}/visits`);
          const visits = visitsRes.data;
          if (visits && visits.length > 0) {
            const latestVisit = visits[0]; // Most recent first
            setVisitId(latestVisit._id);
          }
        } catch (err) {
          console.log('No visits found for patient');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientId, reset]);

  useEffect(() => {
    client.get('/lab/tests').then(({ data }) => {
      const testNames = data.map((test) => test.test || test.title).filter(Boolean);
      setAvailableTests([...new Set(testNames)]);
    }).catch(() => setAvailableTests([]));

    client.get('/ipd/settings').then(({ data }) => {
      const list = [];
      if (data?.sameDayCareCategories) {
        data.sameDayCareCategories.forEach(cat => {
          if (cat.isActive !== false) {
            cat.subServices.forEach(sub => {
              if (sub.isActive !== false) list.push(sub.name);
            });
          }
        });
      }
      setSubServices(list.length > 0 ? list : ['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis']);
    }).catch(() => {
      setSubServices(['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis']);
    });
  }, []);

  const updateSymptom = async (index, field, value) => {
    const next = symptoms.map((item, idx) => idx === index ? { ...item, [field]: value } : item);
    setSymptoms(next);
    
    // Trigger autocomplete for symptom field when user types 1 or more characters
    if (field === 'symptom') {
      setActiveSymptomIndex(index);
      if (value && value.length >= 1) {
        try {
          const { data } = await client.get(`/consultation/symptoms/autocomplete?q=${encodeURIComponent(value)}`);
          setSuggestions(data || []);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }
  };

  const selectSuggestion = (suggestion, index) => {
    const next = symptoms.map((item, idx) => idx === index ? { ...item, symptom: suggestion } : item);
    setSymptoms(next);
    setSuggestions([]);
    setActiveSymptomIndex(null);
  };

  const toggleTest = (test) => {
    setSelectedTests((current) => current.includes(test) ? current.filter((item) => item !== test) : [...current, test]);
  };

  const selectTest = (test) => {
    if (!test) return;
    setSelectedTests((current) => current.includes(test) ? current : [...current, test]);
    setTestQuery('');
  };

  const removeSelectedTest = (test) => {
    setSelectedTests((current) => current.filter((item) => item !== test));
  };

  const addTest = () => {
    if (newTest.trim()) {
      setSelectedTests((current) => [...new Set([...current, newTest.trim()])]);
      setNewTest('');
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    
    // Merge symptoms
    const mergedSymptoms = [
      ...(previousConsultation?.symptoms || []),
      ...symptoms.filter((item) => item.symptom).map((item) => ({ 
        symptom: item.symptom, 
        durationDays: item.durationDays || 0,
        durationUnit: item.durationUnit,
        pastHistory: item.pastHistory,
        remarks: item.remarks
      }))
    ];

    // Merge general history
    const mergedPastHistory = [
      previousConsultation?.generalPastHistory,
      generalPastHistory
    ].filter(Boolean).join('\n');

    // Merge diagnosis remark
    const mergedDiagnosisRemark = [
      previousConsultation?.diagnosisRemark,
      diagnosisRemark
    ].filter(Boolean).join('\n');

    // Merge vitals
    const mergedVitals = {
      weight: data.weight || previousConsultation?.vitals?.weight,
      height: data.height || previousConsultation?.vitals?.height,
      temperature: data.temperature || previousConsultation?.vitals?.temperature,
      bmi: data.bmi || previousConsultation?.vitals?.bmi,
      drugAllergy: data.drugAllergy || previousConsultation?.vitals?.drugAllergy,
      bloodPressure: data.bloodPressure || previousConsultation?.vitals?.bloodPressure
    };

    // Merge tests
    const mergedTests = [
      ...(previousConsultation?.tests || []),
      ...selectedTests
    ];

    const payload = {
      patientId,
      visitId, // Pass visitId to link consultation to visit
      symptoms: mergedSymptoms,
      pastHistory: mergedPastHistory,
      diagnosisRemark: mergedDiagnosisRemark,
      vitals: mergedVitals,
      tests: mergedTests,
      sendToLab: data.sendToLab,
      followUpDate: followUpDate || previousConsultation?.followUpDate,
      followUpRemarks: followUpRemarks || previousConsultation?.followUpRemarks
    };

    try {
      // ALWAYS create a new consultation record
      await client.post('/consultation/create', payload);
      toast.success(data.sendToLab ? 'Consultation saved and sent to lab' : 'Consultation saved');
      navigate(`/doctor/prescription/${patientId}${previousConsultation ? '?addMore=true' : ''}`);
    } catch (error) {
      console.error('Saving consultation failed:', error);
      toast.error('Unable to save consultation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToIpd = async () => {
    if (!patient) return;
    const defaultNotes = `Referred from OPD by Dr. ${user?.doctorName || user?.username || 'Doctor'}. Diagnosis: ${diagnosisRemark || 'N/A'}`;
    const customRemarks = window.prompt("Enter remarks for IPD Referral:", defaultNotes);
    if (customRemarks === null) return;

    setSendingToIpd(true);
    try {
      await client.post('/ipd/referrals', {
        patientId: patient._id,
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

  const handleSendToSameDayOpen = () => {
    if (!patient) return;
    setSdCareType('');
    setSdSelectedDocId('');
    setSdRemarks(`Referred to Same Day Care by Dr. ${user?.doctorName || user?.username || 'Doctor'}.`);
    setShowSameDayModal(true);
  };

  const handleSendToSameDaySubmit = async (e) => {
    e.preventDefault();
    if (!sdCareType) {
      toast.error('Please select care type');
      return;
    }
    const chosenDoc = sdDoctors.find(d => d._id === sdSelectedDocId);
    try {
      const dob = patient.dob;
      const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      await client.post('/same-day-care/treatment', {
        patientId: patient._id,
        patientName: patient.patientName,
        uhid: patient.uhid,
        mobile: patient.mobile,
        gender: patient.gender,
        age,
        treatmentType: sdCareType,
        referredByDoctorRemarks: sdRemarks,
        assignedStaffId: sdSelectedDocId || null,
        assignedStaffName: chosenDoc ? (chosenDoc.doctorName || chosenDoc.username) : '',
        status: 'Draft'
      });
      toast.success(`${patient.patientName} referred to Same Day Care (${sdCareType})!`);
      setShowSameDayModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refer patient');
    }
  };

  if (loading) return <div className="card p-5">Loading patient & consultation data...</div>;
  if (!patient) return <div className="card p-5">Patient not found.</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
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

      <div className="card p-5">
        <p className="text-sm font-bold text-orange-600">
          <span>{patient.uhid}</span>
          {patient.registeredBy && patient.registeredBy !== 'N/A' && (
            <span className="text-gray-500 font-bold"> • Registered by: <span className="capitalize text-orange-650">{patient.registeredBy}</span></span>
          )}
        </p>
        <h1 className="text-2xl font-extrabold text-gray-900">{patient.patientName}</h1>
        <p className="text-sm text-gray-500">{patient.gender} • {patient.mobile} • {formatDate(patient.appointmentDate)} {patient.slot}</p>
      </div>

      <section className="card space-y-4 p-5">
        {previousConsultation?.symptoms?.length > 0 && (
          <div className="space-y-2 mb-6 border-b border-orange-100 pb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase">Previous Symptoms (Read-Only)</h3>
            <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_2fr_2fr] items-center text-xs font-semibold text-gray-500 px-2">
              <div>Symptom</div>
              <div>Duration</div>
              <div>Unit</div>
              <div>Past History</div>
              <div>Remarks</div>
            </div>
            {previousConsultation.symptoms.map((item, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_2fr_2fr] items-start md:items-center p-3 bg-gray-100 rounded-lg border border-gray-200 text-gray-600 text-sm">
                <div className="font-semibold">{item.symptom}</div>
                <div>{item.durationDays || '-'}</div>
                <div>{item.durationUnit}</div>
                <div className="italic">{item.pastHistory || 'N/A'}</div>
                <div>{item.remarks || 'N/A'}</div>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-bold text-gray-800">Current Symptoms</h2>
        
        {/* Symptoms Header - Column Labels */}
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_2fr_2fr_auto] items-center text-xs font-semibold text-gray-600 mb-2 px-2">
          <div>Symptom</div>
          <div>Duration</div>
          <div>Unit</div>
          <div>Past History</div>
          <div>Remarks</div>
          <div>Action</div>
        </div>
        
        {/* Symptoms Rows */}
        {symptoms.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_2fr_2fr_auto] items-start md:items-center p-3 bg-gray-50 rounded-lg border border-orange-100">
            {/* Symptom Input with Autocomplete Dropdown */}
            <div className="relative">
              <input 
                aria-label="symptom" 
                className="input w-full" 
                placeholder="Type symptom name" 
                value={item.symptom} 
                onChange={(e) => updateSymptom(index, 'symptom', e.target.value)}
                onFocus={() => setActiveSymptomIndex(index)}
              />
              {/* Autocomplete Dropdown */}
              {activeSymptomIndex === index && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-orange-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, suggestionIndex) => (
                    <button
                      key={suggestionIndex}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-orange-100 text-sm border-b border-orange-50 last:border-b-0"
                      onClick={() => selectSuggestion(suggestion, index)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input 
              aria-label="duration" 
              className="input" 
              placeholder="Days" 
              type="number" 
              value={item.durationDays} 
              onChange={(e) => updateSymptom(index, 'durationDays', e.target.value)} 
            />
            <select 
              aria-label="duration-unit" 
              className="input" 
              value={item.durationUnit} 
              onChange={(e) => updateSymptom(index, 'durationUnit', e.target.value)}
            >
              {durationUnits.map((unit) => <option key={unit}>{unit}</option>)}
            </select>
            <textarea 
              className="input text-sm" 
              placeholder="Any past issues with this symptom?" 
              value={item.pastHistory} 
              onChange={(e) => updateSymptom(index, 'pastHistory', e.target.value)}
              rows="2"
            />
            <textarea 
              className="input text-sm" 
              placeholder="Additional remarks" 
              value={item.remarks} 
              onChange={(e) => updateSymptom(index, 'remarks', e.target.value)}
              rows="2"
            />
            <div className="flex gap-1 flex-col">
              <button 
                type="button" 
                className="btn-secondary text-xs py-1" 
                onClick={() => {
                  if (!item.symptom || !item.symptom.trim()) {
                    toast.error('Please enter the symptom name before adding another row.');
                    return;
                  }
                  setSymptoms([...symptoms, { symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }]);
                }}
              >
                <Plus className="h-3 w-3" />
              </button>
              <button 
                type="button" 
                className="btn-ghost text-red-600 text-xs py-1" 
                onClick={() => {
                  const isBlank = !item.symptom || !item.symptom.trim();
                  if (isBlank && symptoms.length > 1) {
                    setSymptoms(symptoms.filter((_, idx) => idx !== index));
                  } else {
                    const next = symptoms.map((s, idx) => 
                      idx === index 
                        ? { symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' } 
                        : s
                    );
                    setSymptoms(next);
                  }
                }}
              >
                Clear
              </button>
            </div>
          </div>
        ))}
        
        <div className="border-t border-orange-100 pt-4 mt-4">
          {previousConsultation?.generalPastHistory && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200 text-gray-600 text-sm">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Previous General Past History (Read-Only)</p>
              <p className="whitespace-pre-line">{previousConsultation.generalPastHistory}</p>
            </div>
          )}
          <label className="text-sm font-semibold text-gray-700 mb-2 block">General Past History</label>
          <textarea 
            className="input" 
            placeholder="Overall medical history, allergies, previous illnesses" 
            value={generalPastHistory}
            onChange={(e) => setGeneralPastHistory(e.target.value)}
            rows="3"
          />
        </div>
        
        <div>
          {previousConsultation?.diagnosisRemark && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200 text-gray-600 text-sm">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Previous Diagnosis / Remarks (Read-Only)</p>
              <p className="whitespace-pre-line">{previousConsultation.diagnosisRemark}</p>
            </div>
          )}
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Diagnosis / Remarks</label>
          <textarea 
            className="input" 
            placeholder="Doctor's diagnosis and additional remarks" 
            value={diagnosisRemark}
            onChange={(e) => setDiagnosisRemark(e.target.value)}
            rows="3"
          />
        </div>
      </section>

      <section className="card space-y-4 p-5 rounded-2xl shadow-sm bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Vitals</h2>
          <button
            type="button"
            className={`btn-secondary text-xs px-3 py-1.5 rounded-lg border transition-all ${
              isVitalsEditable 
                ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => setIsVitalsEditable(!isVitalsEditable)}
          >
            {isVitalsEditable ? 'Lock Vitals (Read-Only)' : 'Edit Vitals'}
          </button>
        </div>
        {previousConsultation?.vitals && (
          <div className="grid gap-4 md:grid-cols-6 p-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-600 text-sm mb-4">
            <div className="col-span-6"><p className="text-xs font-bold text-gray-500 uppercase">Previous Vitals (Read-Only)</p></div>
            <div><strong>Weight:</strong> {previousConsultation.vitals.weight ? `${previousConsultation.vitals.weight} kg` : '-'}</div>
            <div><strong>Height:</strong> {previousConsultation.vitals.height ? `${previousConsultation.vitals.height} cm` : '-'}</div>
            <div><strong>Temp:</strong> {previousConsultation.vitals.temperature ? `${previousConsultation.vitals.temperature} °C` : '-'}</div>
            <div><strong>BP:</strong> {previousConsultation.vitals.bloodPressure || '-'}</div>
            <div><strong>BMI:</strong> {previousConsultation.vitals.bmi || '-'}</div>
            <div><strong>Drug Allergy:</strong> {previousConsultation.vitals.drugAllergy || '-'}</div>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-6">
          <div>
            <label className="text-sm text-gray-600">Weight (kg)</label>
            <input className="input" placeholder="Weight" disabled={!isVitalsEditable} {...register('weight')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Height (cm)</label>
            <input className="input" placeholder="Height" disabled={!isVitalsEditable} {...register('height')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Temperature (°C)</label>
            <input className="input" placeholder="Temperature °C" disabled={!isVitalsEditable} {...register('temperature')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Blood Pressure</label>
            <input className="input" placeholder="e.g. 120/80" disabled={!isVitalsEditable} {...register('bloodPressure')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">BMI</label>
            <input className="input" placeholder="BMI optional" disabled={!isVitalsEditable} {...register('bmi')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Drug Allergy</label>
            <input className="input" placeholder="Drug Allergy" disabled={!isVitalsEditable} {...register('drugAllergy')} />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-gray-800">Tests & Reports</h2>
        {previousConsultation?.tests?.length > 0 && (
          <div className="p-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-600 text-sm mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Previous Recommended Tests (Read-Only)</p>
            <div className="flex flex-wrap gap-2">
              {previousConsultation.tests.map((test, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                  {test}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Search and select tests</label>
          <input
            className="input w-full"
            placeholder="Search tests..."
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
          />
          {testQuery && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-orange-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
              {availableTests.filter((test) => test.toLowerCase().includes(testQuery.toLowerCase()) && !selectedTests.includes(test)).slice(0, 10).map((test) => (
                <button
                  key={test}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                  onClick={() => selectTest(test)}
                >
                  {test}
                </button>
              ))}
              {!availableTests.some((test) => test.toLowerCase().includes(testQuery.toLowerCase()) && !selectedTests.includes(test)) && (
                <div className="px-3 py-2 text-sm text-gray-500">No matching tests found.</div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedTests.length === 0 ? (
              <p className="text-xs text-gray-500">No tests selected yet. Use the search box above to add tests.</p>
            ) : (
              selectedTests.map((test) => (
                <span key={test} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  {test}
                  <button type="button" onClick={() => removeSelectedTest(test)} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200">
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Add custom test</label>
              <input className="input w-full" placeholder="Add test name" value={newTest} onChange={(e) => setNewTest(e.target.value)} />
            </div>
            <button type="button" className="btn-secondary h-10 px-4" onClick={addTest}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" {...register('sendToLab')} />
          <FlaskConical className="h-4 w-4 text-orange-500" /> Send To Lab
        </label>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-gray-800">Follow-up Scheduling</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Follow-up Date</label>
            <input 
              className="input py-2 text-xs" 
              type="date" 
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Follow-up Remarks / Instructions</label>
            <input 
              className="input py-2 text-xs" 
              type="text" 
              placeholder="e.g. Check BP, review lab reports, etc."
              value={followUpRemarks}
              onChange={(e) => setFollowUpRemarks(e.target.value)}
            />
          </div>
        </div>
        {patient.isDischarged && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 font-medium">
            This patient has been discharged and the consultation cannot be updated.
          </div>
        )}
        {!patient.isDischarged && (
          <div className="flex gap-2 flex-wrap">
            <button className="btn" type="submit" disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Consultation'}
            </button>
            <Link className="btn-secondary" to={`/doctor/prescription/${patientId}`}>Create Prescription</Link>
            {referralSent ? (
              <span className="btn-secondary bg-green-50 text-green-700 border-green-200 cursor-default">
                ✓ Referred to IPD
              </span>
            ) : (
              <button
                type="button"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSendToIpd}
                disabled={sendingToIpd}
              >
                <Send className="h-4 w-4" /> {sendingToIpd ? 'Sending...' : 'Send to IPD'}
              </button>
            )}
            <button
              type="button"
              className="btn bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSendToSameDayOpen}
            >
              <Send className="h-4 w-4" /> Send to Same Day Care
            </button>
            <button
              type="button"
              className="btn bg-rose-600 hover:bg-rose-700 text-white"
              onClick={async () => {
                const defaultNotes = `Referred to OT by Dr. ${user?.doctorName || user?.username || 'Doctor'}. Diagnosis: ${diagnosisRemark || 'N/A'}`;
                const customRemarks = window.prompt("Enter remarks for OT Referral:", defaultNotes);
                if (customRemarks === null) return;
                try {
                  await client.post('/ipd/referrals', {
                    patientId: patient._id,
                    notes: customRemarks
                  });
                  toast.success(`${patient.patientName} referred to OT successfully!`);
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to send to OT');
                }
              }}
            >
              <Scissors className="h-4 w-4" /> Send to OT
            </button>
          </div>
        )}
      </section>

      {showSameDayModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 relative bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowSameDayModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-orange-500" />
              Refer to Same Day Care
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Select Care Type</label>
                <select
                  className="input w-full text-sm"
                  value={sdCareType}
                  onChange={(e) => setSdCareType(e.target.value)}
                  required
                >
                  <option value="">-- Select Care Type --</option>
                  {subServices.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Assign to Provider / Doctor (Optional)</label>
                {loadingSdDoctors ? (
                  <p className="text-xs text-gray-400">Loading providers...</p>
                ) : (
                  <select
                    className="input w-full text-sm"
                    value={sdSelectedDocId}
                    onChange={(e) => setSdSelectedDocId(e.target.value)}
                  >
                    <option value="">-- Select Provider --</option>
                    {sdDoctors.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        {doc.doctorName || doc.username} ({doc.role === 'nursing' ? 'same day care' : doc.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Referral Remarks</label>
                <textarea
                  className="input w-full text-sm h-24 p-2.5 resize-none border border-gray-200 rounded-xl"
                  placeholder="Enter custom remarks for the patient..."
                  value={sdRemarks}
                  onChange={(e) => setSdRemarks(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSameDayModal(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendToSameDaySubmit}
                  className="btn text-xs px-4 py-2"
                >
                  Send Referral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ConsultationPage;