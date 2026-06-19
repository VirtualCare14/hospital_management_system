import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FlaskConical, Plus, Save, Send, Scissors } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { durationUnits } from '../../utils/options';
import { formatDate } from '../../utils/dateFormat';

const ConsultationPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [consultation, setConsultation] = useState(null); // existing pending consultation
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState([{ symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }]);
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
  const { register, handleSubmit, reset } = useForm();

  // Load patient AND any existing pending consultation
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load patient info
        const patientRes = await client.get(`/patients/${patientId}`);
        setPatient(patientRes.data);
        reset({
          weight: patientRes.data.demographics?.weight,
          height: patientRes.data.demographics?.height,
          temperature: patientRes.data.demographics?.temperature
        });

        // Try to load existing pending consultation
        try {
          const consultationsRes = await client.get(`/consultation/${patientId}`);
          const consultations = consultationsRes.data;
          if (consultations && consultations.length > 0) {
            // Find the first pending consultation
            const pending = consultations.find(c => c.consultationStatus === 'pending');
            if (pending) {
              setConsultation(pending);
              // Pre-fill all form fields from existing consultation data
              if (pending.symptoms && pending.symptoms.length > 0) {
                setSymptoms(pending.symptoms);
              }
              if (pending.generalPastHistory) {
                setGeneralPastHistory(pending.generalPastHistory);
              }
              if (pending.diagnosisRemark) {
                setDiagnosisRemark(pending.diagnosisRemark);
              }
              if (pending.tests && pending.tests.length > 0) {
                setSelectedTests(pending.tests);
              }
              if (pending.followUpDate) {
                setFollowUpDate(pending.followUpDate);
              }
              if (pending.vitals) {
                reset({
                  weight: pending.vitals.weight || patientRes.data.demographics?.weight || '',
                  height: pending.vitals.height || patientRes.data.demographics?.height || '',
                  temperature: pending.vitals.temperature || patientRes.data.demographics?.temperature || '',
                  bmi: pending.vitals.bmi || '',
                  drugAllergy: pending.vitals.drugAllergy || ''
                });
              }
            }
          }
        } catch (err) {
          // No existing consultation - that's fine, start fresh
          console.log('No existing consultation found, starting fresh');
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
    const payload = {
      patientId,
      symptoms: symptoms.filter((item) => item.symptom).map((item) => ({ 
        symptom: item.symptom, 
        durationDays: item.durationDays || 0,
        durationUnit: item.durationUnit,
        pastHistory: item.pastHistory,
        remarks: item.remarks
      })),
      pastHistory: generalPastHistory,
      diagnosisRemark: diagnosisRemark,
      vitals: {
        weight: data.weight,
        height: data.height,
        temperature: data.temperature,
        bmi: data.bmi,
        drugAllergy: data.drugAllergy
      },
      tests: selectedTests,
      sendToLab: data.sendToLab,
      followUpDate: followUpDate
    };

    try {
      if (consultation && consultation._id) {
        // Update existing consultation if we loaded one
        await client.put(`/consultation/${consultation._id}`, payload);
        toast.success('Consultation updated successfully');
      } else {
        // Create new consultation
        await client.post('/consultation/create', payload);
        toast.success(data.sendToLab ? 'Consultation saved and sent to lab' : 'Consultation saved');
      }
      navigate(`/doctor/prescription/${patientId}`);
    } catch (error) {
      console.error('Saving consultation failed:', error);
      toast.error('Unable to save consultation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToIpd = async () => {
    if (!patient) return;
    setSendingToIpd(true);
    try {
      const consultationId = consultation?._id || null;
      await client.post('/ipd/referrals', {
        patientId: patient._id,
        consultationId,
        notes: `Referred from OPD by Dr. ${user?.doctorName || user?.username || 'Doctor'}. Diagnosis: ${diagnosisRemark || 'N/A'}`
      });
      toast.success(`${patient.patientName} has been referred to IPD successfully!`);
      setReferralSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send to IPD');
    } finally {
      setSendingToIpd(false);
    }
  };

  const handleSendToSameDay = async () => {
    if (!patient) return;
    const types = ['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis'];
    const chosenType = window.prompt(
      `Send ${patient.patientName} to Same Day Treatment?\nEnter one of: ${types.join(', ')}`,
      'Minor Injury'
    );
    if (chosenType === null) return;
    if (!types.includes(chosenType)) {
      toast.error(`Invalid treatment type! Must be one of: ${types.join(', ')}`);
      return;
    }
    try {
      const dob = patient.dob;
      const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      await client.post('/nursing/treatment', {
        patientId: patient._id,
        patientName: patient.patientName,
        uhid: patient.uhid,
        mobile: patient.mobile,
        gender: patient.gender,
        age,
        treatmentType: chosenType,
        status: 'Draft'
      });
      toast.success(`${patient.patientName} referred to Same Day Treatment (${chosenType})!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refer patient');
    }
  };

  if (loading) return <div className="card p-5">Loading patient & consultation data...</div>;
  if (!patient) return <div className="card p-5">Patient not found.</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
      <div className="card p-5">
        <p className="text-sm font-bold text-orange-600">{patient.uhid}</p>
        <h1 className="text-2xl font-extrabold text-gray-900">{patient.patientName}</h1>
        <p className="text-sm text-gray-500">{patient.gender} • {patient.mobile} • {formatDate(patient.appointmentDate)} {patient.slot}</p>
        {consultation && (
          <p className="text-xs text-green-600 mt-1">✓ Existing consultation data loaded — edits will update the saved record.</p>
        )}
      </div>

      <section className="card space-y-4 p-5">
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
                onClick={() => setSymptoms([...symptoms, { symptom: '', durationDays: '', durationUnit: 'Days', pastHistory: '', remarks: '' }])}
              >
                <Plus className="h-3 w-3" />
              </button>
              <button 
                type="button" 
                className="btn-ghost text-red-600 text-xs py-1" 
                onClick={() => setSymptoms(symptoms.filter((_, i) => i !== index))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        <div className="border-t border-orange-100 pt-4 mt-4">
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
        <h2 className="font-bold text-gray-800">Vitals</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="text-sm text-gray-600">Weight (kg)</label>
            <input className="input" placeholder="Weight" {...register('weight')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Height (cm)</label>
            <input className="input" placeholder="Height" {...register('height')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Temperature (°C)</label>
            <input className="input" placeholder="Temperature °C" {...register('temperature')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">BMI</label>
            <input className="input" placeholder="BMI optional" {...register('bmi')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Drug Allergy</label>
            <input className="input" placeholder="Drug Allergy" {...register('drugAllergy')} />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-gray-800">Tests & Reports</h2>

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
          <input 
            className="input" 
            type="date" 
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" type="submit" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : (consultation ? 'Update Consultation' : 'Save Consultation')}
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
            onClick={handleSendToSameDay}
          >
            <Send className="h-4 w-4" /> Send to Same Day
          </button>
          <button
            type="button"
            className="btn bg-rose-600 hover:bg-rose-700 text-white"
            onClick={async () => {
              if (!window.confirm(`Send ${patient?.patientName} to OT (Operation Theatre)?`)) return;
              try {
                await client.post('/ipd/referrals', {
                  patientId: patient._id,
                  consultationId: consultation?._id || null,
                  notes: `Referred to OT. Diagnosis: ${diagnosisRemark || 'N/A'}`
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
      </section>
    </form>
  );
};

export default ConsultationPage;