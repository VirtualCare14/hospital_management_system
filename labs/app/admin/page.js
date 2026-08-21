'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { 
  ShieldCheck, 
  User, 
  UserCheck,
  Lock, 
  ArrowRight, 
  AlertCircle, 
  LogOut, 
  Building2, 
  Loader2,
  Sliders,
  Sparkles,
  ArrowLeft,
  Grid,
  Layers,
  FilePlus2,
  FileText,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronRight,
  FlaskConical,
  Activity,
  Scan,
  HeartPulse,
  Brain,
  Stethoscope,
  Smile,
  Zap,
  Globe,
  Award,
  Filter,
  CheckCircle2,
  Eye,
  RefreshCw,
  FolderPlus
} from 'lucide-react';

// Preset standard diagnostic categories matching the reference screenshot
const DEFAULT_CATEGORIES = [
  { id: 'lab', code: 'LAB', name: 'LAB', fullName: 'Laboratory & Pathology', icon: 'FlaskConical', color: 'blue' },
  { id: 'usg', code: 'USG', name: 'USG', fullName: 'Ultrasonography', icon: 'Activity', color: 'blue' },
  { id: 'digital_xray', code: 'DIGITAL XRAY', name: 'DIGITAL XRAY', fullName: 'Digital X-Ray', icon: 'Scan', color: 'blue' },
  { id: 'xray', code: 'XRAY', name: 'XRAY', fullName: 'Conventional X-Ray', icon: 'Scan', color: 'blue' },
  { id: 'outsource_lab', code: 'OUTSOURCE LAB', name: 'OUTSOURCE LAB', fullName: 'Outsource Diagnostics', icon: 'Globe', color: 'blue' },
  { id: 'ecg', code: 'ECG', name: 'ECG', fullName: 'Electrocardiogram', icon: 'HeartPulse', color: 'blue' },
  { id: 'ct_scan', code: 'CT SCAN', name: 'CT SCAN', fullName: 'Computed Tomography', icon: 'Scan', color: 'blue' },
  { id: 'mri', code: 'MRI', name: 'MRI', fullName: 'Magnetic Resonance Imaging', icon: 'Scan', color: 'blue' },
  { id: 'eps', code: 'EPS', name: 'EPS', fullName: 'Electrophysiology Study', icon: 'Zap', color: 'blue' },
  { id: 'opg', code: 'OPG', name: 'OPG', fullName: 'Orthopantomogram (Dental)', icon: 'Smile', color: 'blue' },
  { id: 'cardiology', code: 'CARDIOLOGY', name: 'CARDIOLOGY', fullName: 'Cardiology Diagnostics', icon: 'Stethoscope', color: 'blue' },
  { id: 'eeg', code: 'EEG', name: 'EEG', fullName: 'Electroencephalogram', icon: 'Brain', color: 'blue' },
  { id: 'mammography', code: 'MAMMOGRAPHY', name: 'MAMMOGRAPHY', fullName: 'Mammography', icon: 'Activity', color: 'blue' }
];

// Helper to render category icon
function CategoryIcon({ name, className = "w-6 h-6 text-blue-600" }) {
  switch (name) {
    case 'FlaskConical': return <FlaskConical className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Scan': return <Scan className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Smile': return <Smile className={className} />;
    case 'Stethoscope': return <Stethoscope className={className} />;
    case 'Brain': return <Brain className={className} />;
    default: return <FlaskConical className={className} />;
  }
}

function AdminLoginForm() {
  const { login, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      // Error set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-orange-100 rounded-3xl p-8 shadow-xl shadow-orange-500/10 max-w-md w-full">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Error</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Lab Admin ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter Lab Admin ID"
              className="w-full pl-11 pr-4 py-3 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Admin Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-orange-50/20 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating Admin...</span>
            </>
          ) : (
            <>
              <span>Sign In as Lab Admin</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function LabAdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  // Active Sidebar Section: 'categories' | 'create-report' | 'view-reports'
  const [activeSection, setActiveSection] = useState('categories');

  // Data States
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [labTests, setLabTests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    fullName: '',
    icon: 'FlaskConical'
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Create / Edit Lab Report Template State
  const [editingTestId, setEditingTestId] = useState(null);
  const [previewTest, setPreviewTest] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    test: '',
    category: 'LAB',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood',
    turnaroundTime: 'Same Day',
    description: '',
    interpretation: '',
    parameters: [
      { name: 'Hemoglobin', referenceRange: '13.5 - 17.5', unit: 'g/dL', fieldType: 'Number' },
      { name: 'Total Leukocyte Count (TLC)', referenceRange: '4,000 - 11,000', unit: 'cells/cu.mm', fieldType: 'Number' }
    ]
  });
  const [savingReport, setSavingReport] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const interpretationTextareaRef = useRef(null);

  // Auto-adjust interpretation textarea height to fit content dynamically
  useEffect(() => {
    if (interpretationTextareaRef.current) {
      interpretationTextareaRef.current.style.height = 'auto';
      interpretationTextareaRef.current.style.height = `${Math.max(interpretationTextareaRef.current.scrollHeight, 90)}px`;
    }
  }, [reportForm.interpretation, activeSection]);

  // Load Admin Data from backend
  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [testsRes, catRes] = await Promise.all([
        api.get('/lab/tests').catch(() => []),
        api.get('/lab/test-categories').catch(() => [])
      ]);

      const fetchedTests = (Array.isArray(testsRes) ? testsRes : []).filter(t => (t.category || '').toUpperCase() !== 'DIAGNOSIS');
      setLabTests(fetchedTests);

      let fetchedCats = (Array.isArray(catRes) ? catRes : []).filter(c => (c.name || c.category || '').toUpperCase() !== 'DIAGNOSIS');

      // Check if any of the default categories are missing in the database list
      const missingDefaults = DEFAULT_CATEGORIES.filter(cat => 
        !fetchedCats.some(fc => (fc.name || fc.category || '').toUpperCase() === cat.name)
      );

      // If any default categories are missing, seed them to the backend database
      if (missingDefaults.length > 0) {
        try {
          await Promise.all(missingDefaults.map(cat => 
            api.post('/lab/test-categories', { name: cat.name })
          ));
          const freshCats = await api.get('/lab/test-categories').catch(() => []);
          fetchedCats = Array.isArray(freshCats) ? freshCats : [];
        } catch (e) {
          console.warn('Seeding missing default categories failed', e);
        }
      }

      const mergedMap = new Map();
      fetchedCats.forEach(cat => {
        const catName = (cat.name || cat.category || '').toUpperCase();
        if (catName) {
          const presetMatch = DEFAULT_CATEGORIES.find(c => c.name === catName);
          mergedMap.set(catName, {
            id: catName.toLowerCase().replace(/\s+/g, '_'),
            code: catName,
            name: catName,
            fullName: presetMatch ? presetMatch.fullName : (cat.fullName || catName),
            icon: presetMatch ? presetMatch.icon : (cat.icon || 'FlaskConical'),
            color: 'blue'
          });
        }
      });

      setCategoriesList(Array.from(mergedMap.values()));
    } catch (err) {
      console.error('Error loading lab admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdminData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Quick Preset Templates for Fast Creation
  const handleApplyPreset = (presetType) => {
    if (presetType === 'ADA') {
      setReportForm({
        title: 'Adenosine Deaminase (ADA)',
        test: 'Adenosine Deaminase (ADA)',
        category: 'LAB',
        basePrice: 550,
        taxPercentage: 0,
        sampleType: 'Fluid / Serum',
        turnaroundTime: '4 Hours',
        description: 'Adenosine Deaminase (ADA) activity estimation in Pleural fluid, Ascitic fluid, CSF or Blood Serum.',
        interpretation: 'ADA values interpreted in clinical context. Elevated in Tuberculosis.',
        parameters: [
          {
            name: 'Sample Type',
            referenceRange: '',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Pleural fluid', isAbnormal: false },
              { value: 'Ascitic fluid', isAbnormal: false },
              { value: 'CSF (cerebrospinal fluid)', isAbnormal: false },
              { value: 'Blood serum', isAbnormal: false }
            ]
          },
          {
            name: 'Result',
            referenceRange: '0 - 40',
            unit: 'U/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'AEC') {
      setReportForm({
        title: 'Absolute Eosinophil Count (AEC)',
        test: 'Absolute Eosinophil Count (AEC)',
        category: 'LAB',
        basePrice: 250,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '2 Hours',
        description: 'Measures the absolute number of eosinophils in a given volume of blood.',
        interpretation: 'Physiological basis\nThe Absolute Eosinophil Count (AEC) is a measure of the number of eosinophils, a type of white blood cell, in a given volume of blood. The Absolute Eosinophil Count (AEC) is calculated by multiplying the percentage of eosinophils in the total white blood cell count by the total white blood cell count.\n\nElevated AEC (Eosinophilia):\n- Allergic Reactions\n- Parasitic Infections\n- Autoimmune Diseases\n\nLow AEC:\n- Acute Infections\n- Adrenal Insufficiency\n\nComments:\nThe AEC is typically assessed as part of a complete blood count (CBC) with a differential. If your AEC is outside the normal range, it\'s important to consult with a healthcare provider to determine the underlying cause and appropriate treatment.',
        parameters: [
          {
            name: 'Absolute Eosinophil Count',
            referenceRange: '0 - 440',
            unit: 'cumm',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'AFB') {
      setReportForm({
        title: 'Acid - Fast Bacilli (AFB)',
        test: 'Acid - Fast Bacilli (AFB)',
        category: 'LAB',
        basePrice: 300,
        taxPercentage: 0,
        sampleType: 'Sputum / Body Fluid',
        turnaroundTime: '24 Hours',
        description: 'Microscopic examination for Acid-Fast Bacilli (AFB) to detect Mycobacterial infections.',
        interpretation: 'Note:\nA positive Acid-Fast Bacillus (AFB) smear result provides an initial indication of a Mycobacterial infection, the relative bacterial burden and correlate with the clinical presentation of the disease. Conversely, a negative AFB smear may indicate the absence of Mycobacterial infection or that the bacteria are not detected under the microscope. It does not, however, differentiate between viable and non-viable organisms, nor does it distinguish between different Mycobacterial species.\n\nUsage:\nThis test is employed to detect acid-fast bacteria, primarily Mycobacterium tuberculosis, for the purposes of diagnosing and monitoring tuberculosis.',
        parameters: [
          {
            name: 'Sample Type',
            referenceRange: '',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Sputum', isAbnormal: false },
              { value: 'CSF Fluid', isAbnormal: false },
              { value: 'Pleural Fluid', isAbnormal: false },
              { value: 'Ascitic Fluid', isAbnormal: false }
            ]
          },
          {
            name: 'Result',
            referenceRange: '',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Positive After 1st Day', isAbnormal: true },
              { value: 'Positive After 2nd Day', isAbnormal: true },
              { value: 'Positive After 3rd Day', isAbnormal: true },
              { value: 'Negative After 1st Day', isAbnormal: false },
              { value: 'Negative After 2nd Day', isAbnormal: false },
              { value: 'Negative After 3rd Day', isAbnormal: false },
              { value: 'No AFB Seen', isAbnormal: false }
            ]
          }
        ]
      });
    } else if (presetType === 'AFP') {
      setReportForm({
        title: 'AFP(Alfa Fetoprotein)',
        test: 'AFP(Alfa Fetoprotein)',
        category: 'LAB',
        basePrice: 850,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '24 Hours',
        description: 'Quantitative measurement of Alpha-fetoprotein (AFP) level in serum as a tumor and fetal biomarker.',
        interpretation: 'Alpha-fetoprotein (AFP) is a crucial protein found in fetal serum, serving a physiological role akin to that of albumin. It is primarily produced in the yolk sac, the fetal liver, and the fetal gastrointestinal tract. However, shortly after birth, AFP levels drop precipitously, becoming virtually undetectable. In healthy adults, AFP levels are typically below 5.4 ng/mL.\n\nWhile elevated AFP levels can occur in various benign conditions, a level exceeding 500 ng/mL is rarely associated with non-malignant issues. During a normal pregnancy, AFP levels may rise but generally do not exceed 100 ng/mL. Elevated AFP levels are also observed in chronic liver diseases such as cirrhosis and hepatitis.\n\nAFP plays a pivotal role in the detection of hepatocellular carcinoma and yolk sac tumors. Additionally, it may be sporadically elevated in other malignancies, including certain hepatoid variants of gastric carcinoma. In the case of yolk sac tumors, the AFP level is closely linked to prognosis, with levels surpassing 10,000 ng/mL indicating a poor outcome. For hepatocellular carcinoma, AFP elevation is reported in approximately 70% of patients, underscoring its significance as a biomarker in the diagnosis and management of liver cancer.',
        parameters: [
          {
            name: 'AFP(Alfa Fetoprotein)',
            referenceRange: '< 10',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'AG_RATIO') {
      setReportForm({
        title: 'A/G Ratio',
        test: 'A/G Ratio',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '4 Hours',
        description: 'Calculates the ratio of Albumin to Globulin in blood serum.',
        interpretation: 'The Albumin to Globulin (A/G) ratio is a calculated value obtained by dividing the albumin concentration by the globulin concentration (calculated as Total Protein minus Albumin). A normal ratio is between 1.1 and 2.1. A low A/G ratio may indicate overproduction of globulins (e.g., in multiple myeloma or autoimmune diseases) or underproduction of albumin (e.g., in cirrhosis or nephrotic syndrome).',
        parameters: [
          {
            name: 'A/G Ratio',
            referenceRange: '1.1 - 2.1',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'AMH') {
      setReportForm({
        title: 'AMH(Anti Mullerian Hormone)',
        test: 'AMH(Anti Mullerian Hormone)',
        category: 'LAB',
        basePrice: 1500,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '24 Hours',
        description: 'Quantitative measurement of Anti-Müllerian Hormone (AMH) to assess ovarian reserve and fertility.',
        interpretation: 'Notes\nAnti-Müllerian Hormone (AMH) starts to drop several years before Follicle-Stimulating Hormone (FSH) levels increase. Because of this, AMH is a more sensitive indicator of ovarian reserve. Sometimes, AMH levels and Antral Follicle Count (AFC) can give different results. AMH reflects the overall number of early-stage follicles that aren\'t visible yet, while AFC counts only the follicles that can be seen on an ultrasound.\n\nInterpretation:\nAMH LEVEL IN ng/mL | Remarks\n<0.50 | Predictive of poor response\n0.50 - <1.0 | Suggestive of limited ovarian reserve\n1.00 - 3.50 | Predictive of optimal response\n>3.50 | Predictive of Ovarian hyperstimulation syndrome / PCOS\n\nComment\nAntimüllerian Hormone (AMH) is produced by Sertoli cells in males and granulosa cells in females. In males, AMH levels are high in infancy, drop before puberty, and decrease sharply during puberty. In females, AMH is made by small follicles from around 36 weeks of pregnancy until menopause, when levels become very low. AMH is a valuable marker for assessing gender, fertility, and gonadal tumors. It provides a steady measure of ovarian reserve throughout the menstrual cycle. Women with higher AMH levels generally respond better to fertility treatments and produce more eggs. Elevated AMH can also indicate risks such as ovarian hyperstimulation syndrome or conditions like Polycystic Ovary Syndrome (PCOS). Additionally, high AMH levels can be seen in some ovarian tumors.\n\nClinical Applications of AMH:\n1. Assess Ovarian Health\n2. Check Menopausal Status\n3. Evaluate PCOS\n4. Examine Infants with Ambiguous Genitalia\n5. Testicular Function in Children\n6. Diagnose and Monitor Tumors',
        parameters: [
          {
            name: 'AMH(Anti Mullerian Hormone)',
            referenceRange: '',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'CCP') {
      setReportForm({
        title: 'CCP(Cyclic-citrullinated-peptide)',
        test: 'CCP(Cyclic-citrullinated-peptide)',
        category: 'LAB',
        basePrice: 1200,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '24 Hours',
        description: 'Quantitative determination of Anti-Cyclic Citrullinated Peptide (Anti-CCP) antibodies in human serum for rheumatoid arthritis diagnosis.',
        interpretation: 'Physiological Basis\nPost-translational deamination of arginine residues by peptidyl arginine deaminase (citrullination) during inflammation results in production of antigenic epitope. Antibodies to citrullinated proteins (particularly filaggrin) are frequently elevated in rheumatoid arthritis (RA).\n\nInterpretation: Increased in- RA (sensitivity 70–80%).\n\nComments: Specificity of anti-CCP (90–95%) for RA is higher than that of rheumatoid factor.',
        parameters: [
          {
            name: 'Anti cyclic-citrullinated-peptide',
            referenceRange: '< 5',
            unit: 'U/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    }
  };

  // Category Save Handler
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setSavingCategory(true);
    try {
      const codeUpper = categoryForm.name.trim().toUpperCase();
      await api.post('/lab/test-categories', { name: codeUpper });

      const newCatObj = {
        id: codeUpper.toLowerCase().replace(/\s+/g, '_'),
        code: codeUpper,
        name: codeUpper,
        fullName: categoryForm.fullName.trim() || codeUpper,
        icon: categoryForm.icon || 'FlaskConical',
        color: 'blue'
      };

      setCategoriesList(prev => {
        if (prev.some(c => c.name === codeUpper)) return prev;
        return [...prev, newCatObj];
      });

      setShowCategoryModal(false);
      setCategoryForm({ name: '', fullName: '', icon: 'FlaskConical' });
      loadAdminData();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!confirm(`Are you sure you want to delete the category "${catName}"? This will not delete the configured tests under this category.`)) {
      return;
    }

    try {
      await api.delete(`/lab/test-categories/${encodeURIComponent(catName)}`);
      setCategoriesList(prev => prev.filter(c => c.name !== catName));
      loadAdminData();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to delete category');
    }
  };

  // Parameter Handlers in Create Report
  const handleAddParameter = () => {
    setReportForm(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', referenceRange: '', unit: '', fieldType: 'Number', gender: 'Both' }]
    }));
  };

  const handleRemoveParameter = (index) => {
    setReportForm(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const handleParameterChange = (index, field, value) => {
    setReportForm(prev => {
      const updated = [...prev.parameters];
      updated[index][field] = value;
      return { ...prev, parameters: updated };
    });
  };

  // Save Lab Report Template Handler
  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!reportForm.title.trim()) {
      alert('Please provide a report title');
      return;
    }

    setSavingReport(true);
    setSaveSuccessMsg('');
    try {
      const payload = {
        title: reportForm.title.trim(),
        test: reportForm.title.trim(),
        category: reportForm.category,
        basePrice: Number(reportForm.basePrice) || 0,
        taxPercentage: Number(reportForm.taxPercentage) || 0,
        description: reportForm.description,
        notes: reportForm.interpretation,
        sampleType: reportForm.sampleType,
        parameters: reportForm.parameters.filter(p => p.name.trim() !== '')
      };

      if (editingTestId) {
        await api.put(`/lab/tests/${editingTestId}`, payload);
      } else {
        await api.post('/lab/tests', payload);
      }

      setSaveSuccessMsg('Lab report template saved successfully!');
      loadAdminData();
      
      // Auto reset or switch after brief timeout
      setTimeout(() => {
        setSaveSuccessMsg('');
        setEditingTestId(null);
        setActiveSection('view-reports');
      }, 1200);

    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to save lab report template');
    } finally {
      setSavingReport(false);
    }
  };

  // Open Edit Mode for a Test
  const handleOpenEditReport = (testItem) => {
    setEditingTestId(testItem._id);
    setReportForm({
      title: testItem.title || testItem.test || '',
      test: testItem.test || testItem.title || '',
      category: testItem.category || 'LAB',
      basePrice: testItem.basePrice || 0,
      taxPercentage: testItem.taxPercentage || 0,
      sampleType: testItem.sampleType || 'Blood',
      turnaroundTime: testItem.turnaroundTime || 'Same Day',
      description: testItem.description || '',
      interpretation: testItem.notes || '',
      parameters: Array.isArray(testItem.parameters) && testItem.parameters.length > 0
        ? testItem.parameters.map(p => ({
            name: p.name || '',
            referenceRange: p.referenceRange || '',
            unit: p.unit || '',
            fieldType: p.fieldType || 'Number',
            gender: p.gender || 'Both'
          }))
        : [{ name: '', referenceRange: '', unit: '', fieldType: 'Number', gender: 'Both' }]
    });
    setActiveSection('create-report');
  };

  // Delete Test Handler
  const handleDeleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this lab report template?')) return;
    try {
      await api.delete(`/lab/tests/${testId}`);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete report template');
    }
  };

  // Filtered Tests for View Reports Section
  const filteredTests = labTests.filter(test => {
    const matchesCat = selectedCategoryFilter === 'ALL' || test.category?.toUpperCase() === selectedCategoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      (test.title || test.test || '').toLowerCase().includes(q) ||
      (test.category || '').toLowerCase().includes(q)
    );
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row">
      
      {/* ========================================================================= */}
      {/* 1. ADMIN SIDEBAR                                                          */}
      {/* ========================================================================= */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Top Brand Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">Labs Admin</h1>
                <p className="text-[11px] text-slate-500 font-medium">Management Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 py-2 space-y-1 text-xs font-semibold">
            
            {/* 1. Categories Management */}
            <button
              type="button"
              onClick={() => setActiveSection('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'categories'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4" />
                <span>Categories</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeSection === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {categoriesList.length}
              </span>
            </button>

            {/* 2. Create Lab Reports */}
            <button
              type="button"
              onClick={() => {
                setEditingTestId(null);
                setActiveSection('create-report');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'create-report'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FilePlus2 className="w-4 h-4" />
                <span>Create Lab Reports</span>
              </div>
              {editingTestId && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-amber-950 font-bold">
                  Editing
                </span>
              )}
            </button>

            {/* 3. View Lab Reports */}
            <button
              type="button"
              onClick={() => setActiveSection('view-reports')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'view-reports'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>View Lab Reports</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeSection === 'view-reports' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {labTests.length}
              </span>
            </button>



          </nav>
        </div>

        {/* Sidebar Footer: Logged In Admin Profile */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-500 font-semibold block truncate leading-none">
                {user?.hospitalName || 'Orange Hospital'}
              </span>
              <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                {user?.name || user?.username || 'Lab Admin'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                      */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto max-h-screen">
        
        {/* ======================================================================= */}
        {/* SECTION 1: CREATE CATEGORY FOR LABS (MATCHING REFERENCE SCREENSHOT)     */}
        {/* ======================================================================= */}
        {activeSection === 'categories' && (
          <div className="space-y-6">
            
            {/* Header & Add Category Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Grid className="w-5 h-5 text-blue-600" /> Categories Management
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure diagnostic modalities & department categories for tests
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={loadAdminData}
                  className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              </div>
            </div>

            {/* DIAGNOSTIC CATEGORY TILES ROW MATCHING USER SCREENSHOT */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Diagnostic Department Categories ({categoriesList.length})
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Click tile to filter or create report</span>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex items-stretch gap-2.5 min-w-max">
                  {categoriesList.map((cat) => {
                    const testCount = labTests.filter(t => t.category?.toUpperCase() === cat.name).length;
                    const isSelected = selectedCategoryFilter === cat.name;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryFilter(isSelected ? 'ALL' : cat.name);
                        }}
                        className={`flex flex-col items-center justify-center p-3 w-28 rounded-lg border-2 transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                            : 'border-blue-400/80 bg-white hover:bg-blue-50/40 hover:border-blue-600'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center mb-1.5">
                          <CategoryIcon name={cat.icon} className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 tracking-tight leading-tight uppercase">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {testCount} tests
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CATEGORIES DIRECTORY TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">All Categories Directory</h3>
                <span className="text-xs text-slate-500 font-semibold">{categoriesList.length} Total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                      <th className="p-4">CATEGORY CODE</th>
                      <th className="p-4">DEPARTMENT / FULL NAME</th>
                      <th className="p-4">CONFIGURED TESTS</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {categoriesList.map((cat) => {
                      const count = labTests.filter(t => t.category?.toUpperCase() === cat.name).length;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-blue-700 flex items-center gap-2">
                            <CategoryIcon name={cat.icon} className="w-4 h-4 text-blue-600" />
                            <span>{cat.name}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">
                            {cat.fullName}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {count} Tests Configured
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategoryFilter(cat.name);
                                  setActiveSection('view-reports');
                                }}
                                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                              >
                                View Tests
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReportForm(prev => ({ ...prev, category: cat.name }));
                                  setActiveSection('create-report');
                                }}
                                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                              >
                                + Add Report
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.name)}
                                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION 2: CREATE LAB REPORTS (TEMPLATE & PARAMETERS BUILDER)           */}
        {/* ======================================================================= */}
        {activeSection === 'create-report' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FilePlus2 className="w-5 h-5 text-blue-600" />
                  {editingTestId ? 'Edit Lab Report Template' : 'Create New Lab Report Template'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Define diagnostic tests, parameter fields, normal ranges, and pricing
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold hidden lg:inline">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ADA')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  ADA
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('AEC')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  AEC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('AFB')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  AFB
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('AFP')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  AFP
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('AG_RATIO')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  A/G Ratio
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('AMH')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  AMH
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('CCP')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  CCP
                </button>
              </div>
            </div>

            {/* Notification alert on success */}
            {saveSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* MAIN REPORT BUILDER FORM */}
            <form onSubmit={handleSaveReport} className="space-y-6">
              
              {/* Card 1: Basic Information */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  1. Test & Category Specification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  {/* Category Selection */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Diagnostic Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reportForm.category}
                      onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} — {cat.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Report / Test Title */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Report / Test Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={reportForm.title}
                      onChange={(e) => setReportForm({ ...reportForm, title: e.target.value, test: e.target.value })}
                      placeholder="e.g. Complete Blood Count (CBC), USG Whole Abdomen, Chest X-Ray"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs font-semibold text-slate-700">
                  {/* Base Price */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Base Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={reportForm.basePrice}
                      onChange={(e) => setReportForm({ ...reportForm, basePrice: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Tax Percentage */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Tax (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reportForm.taxPercentage}
                      onChange={(e) => setReportForm({ ...reportForm, taxPercentage: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Sample Type */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Sample / Specimen</label>
                    <input
                      type="text"
                      value={reportForm.sampleType}
                      onChange={(e) => setReportForm({ ...reportForm, sampleType: e.target.value })}
                      placeholder="e.g. Blood, Urine, Imaging Scan"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Turnaround Time */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Turnaround Time</label>
                    <input
                      type="text"
                      value={reportForm.turnaroundTime}
                      onChange={(e) => setReportForm({ ...reportForm, turnaroundTime: e.target.value })}
                      placeholder="e.g. 2 Hours, Same Day"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Test Parameters & Result Fields */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      2. Test Parameters & Form Fields ({reportForm.parameters.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Configure parameters, measurement units, and normal reference ranges
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter Field</span>
                  </button>
                </div>

                {reportForm.parameters.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                    <p className="text-xs font-bold">No parameter fields defined yet</p>
                    <button
                      type="button"
                      onClick={handleAddParameter}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Click here to add your first parameter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reportForm.parameters.map((param, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 items-center">
                        {/* Parameter Name */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Parameter Name</label>
                          <input
                            type="text"
                            required
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                            placeholder="e.g. Hemoglobin"
                            className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Gender */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                          <select
                            value={param.gender || 'Both'}
                            onChange={(e) => handleParameterChange(index, 'gender', e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Both">Both</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        {/* Reference Range */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Normal / Reference Range</label>
                          <input
                            type="text"
                            value={param.referenceRange}
                            onChange={(e) => handleParameterChange(index, 'referenceRange', e.target.value)}
                            placeholder="e.g. 13.5 - 17.5"
                            className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Unit */}
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit</label>
                          <input
                            type="text"
                            value={param.unit}
                            onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                            placeholder="g/dL"
                            className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Field Type */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Field Type</label>
                          <select
                            value={param.fieldType || 'Number'}
                            onChange={(e) => handleParameterChange(index, 'fieldType', e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Number">Number</option>
                            <option value="Text">Text</option>
                            <option value="Multiline">Multiline</option>
                          </select>
                        </div>

                        {/* Remove Action */}
                        <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveParameter(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete parameter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Default Interpretation Template */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  3. Default Report Remarks & Interpretation Template
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Standard template text auto-filled when lab technician or doctor enters results
                </p>
                <textarea
                  ref={interpretationTextareaRef}
                  value={reportForm.interpretation}
                  onChange={(e) => {
                    setReportForm({ ...reportForm, interpretation: e.target.value });
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 90)}px`;
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(e.target.scrollHeight, 90)}px`;
                  }}
                  placeholder="Enter default interpretation or findings template..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 overflow-hidden transition-[height] duration-75 min-h-[90px]"
                />
              </div>

              {/* Submit / Action Controls */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('view-reports')}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReport}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Report Template...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingTestId ? 'Update Report Template' : 'Save & Publish Lab Report'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION 3: VIEW LAB REPORTS (CATALOG & DIRECTORY)                       */}
        {/* ======================================================================= */}
        {activeSection === 'view-reports' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> View Lab Reports Directory
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Browse, search, and manage all configured diagnostic test reports
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingTestId(null);
                  setActiveSection('create-report');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Lab Report</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 sm:max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search test name, category, or parameter..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <span className="text-xs text-slate-500 font-bold shrink-0">
                  Showing {filteredTests.length} of {labTests.length} Reports
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                    selectedCategoryFilter === 'ALL'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({labTests.length})
                </button>
                {categoriesList.map(cat => {
                  const count = labTests.filter(t => t.category?.toUpperCase() === cat.name).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.name)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                        selectedCategoryFilter === cat.name
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REPORTS GRID / TABLE */}
            {loadingData ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold mt-2">Loading lab reports...</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Lab Reports Found</p>
                <p className="text-xs text-slate-400 mt-1">Try selecting another category or create a new test report.</p>
                <button
                  type="button"
                  onClick={() => setActiveSection('create-report')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Lab Report Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((test) => (
                  <div
                    key={test._id}
                    className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {test.category || 'LAB'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewTest(test)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Lab Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditReport(test)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Report Template"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTest(test._id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Pricing */}
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {test.title || test.test}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Price: <span className="text-slate-900 font-black">₹{test.basePrice || 0}</span>
                      </p>

                      {/* Parameters Preview */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Parameters ({test.parameters?.length || 0})
                        </span>
                        {Array.isArray(test.parameters) && test.parameters.length > 0 ? (
                          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                            {test.parameters.slice(0, 4).map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-1">
                                  {p.referenceRange || p.unit || '-'}
                                </span>
                              </div>
                            ))}
                            {test.parameters.length > 4 && (
                              <p className="text-[10px] text-blue-600 font-bold text-center pt-0.5">
                                + {test.parameters.length - 4} more parameters
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No parameter fields defined</p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTest(test)}
                        className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Preview Report</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditReport(test)}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Manage Template</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}



      </main>

      {/* ========================================================================= */}
      {/* 3. MODAL: CREATE NEW CATEGORY                                             */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                Create Diagnostic Category
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Category Short Code / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. HISTOPATHOLOGY, NUCLEAR MED"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 uppercase outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Full Department Title
                </label>
                <input
                  type="text"
                  value={categoryForm.fullName}
                  onChange={(e) => setCategoryForm({ ...categoryForm, fullName: e.target.value })}
                  placeholder="e.g. Histopathology & Biopsy"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Category Icon
                </label>
                <select
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="FlaskConical">Flask / Lab</option>
                  <option value="Activity">Activity / Ultrasound</option>
                  <option value="Scan">Scan / X-Ray / CT / MRI</option>
                  <option value="HeartPulse">Heart Pulse / ECG</option>
                  <option value="Brain">Brain / EEG</option>
                  <option value="Stethoscope">Stethoscope / Cardiology</option>
                  <option value="Smile">Smile / Dental OPG</option>
                  <option value="Globe">Globe / Outsource</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingCategory ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: PREVIEW LAB REPORT TEMPLATE                                    */}
      {/* ========================================================================= */}
      {previewTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight flex items-center gap-2">
                    <span>{previewTest.title || previewTest.test}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      {previewTest.category || 'LAB'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official Diagnostic Report Template Preview
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const testToEdit = previewTest;
                    setPreviewTest(null);
                    handleOpenEditReport(testToEdit);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTest(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Report Sheet View */}
            <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
              
              {/* Report Header Simulation */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Department / Category</h4>
                    <p className="text-sm font-extrabold text-blue-600 uppercase mt-0.5">
                      {previewTest.category === 'LAB' ? 'BIOCHEMISTRY & PATHOLOGY' : previewTest.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Sample Type</span>
                      <span className="font-bold text-slate-800">{previewTest.sampleType || 'Blood Serum'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Turnaround Time</span>
                      <span className="font-bold text-slate-800">{previewTest.turnaroundTime || 'Same Day'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Base Price</span>
                      <span className="font-bold text-slate-900 font-mono">₹{previewTest.basePrice || 0}</span>
                    </div>
                  </div>
                </div>

                {previewTest.description && (
                  <p className="text-xs text-slate-600 italic">
                    {previewTest.description}
                  </p>
                )}
              </div>

              {/* Parameters Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Investigation Parameters ({previewTest.parameters?.length || 0})
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">
                    Template Format
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Investigation / Parameter</th>
                        <th className="py-2.5 px-4">Result / Option Choices</th>
                        <th className="py-2.5 px-4">Unit</th>
                        <th className="py-2.5 px-4">Reference Range</th>
                        <th className="py-2.5 px-4">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {Array.isArray(previewTest.parameters) && previewTest.parameters.length > 0 ? (
                        previewTest.parameters.map((param, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {param.name}
                            </td>
                            <td className="py-3 px-4">
                              {Array.isArray(param.valueOptions) && param.valueOptions.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {param.valueOptions.map((opt, oIdx) => (
                                    <span
                                      key={oIdx}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                        opt.isAbnormal
                                          ? 'bg-red-50 text-red-700 border-red-200'
                                          : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {opt.value}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  [Technician Entry]
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-600">
                              {param.unit || '-'}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                              {param.referenceRange || '-'}
                            </td>
                            <td className="py-3 px-4 text-[11px] font-medium text-slate-500">
                              {param.gender || 'Both'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-400 italic">
                            No parameter rows configured for this test.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interpretation & Remarks Section */}
              {previewTest.interpretation && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Clinical Interpretation & Reference Remarks</span>
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {previewTest.interpretation}
                  </div>
                </div>
              )}

              {/* Notes / Special Instructions if any */}
              {previewTest.notes && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Additional Notes
                  </h4>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">
                    {previewTest.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Report Template Key: <span className="font-mono text-slate-700">{previewTest.testKey || previewTest._id}</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewTest(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LabAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'admin' || user?.role === 'lab_admin' || user?.role === 'labadmin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-blue-50/20 to-orange-50/20 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lab Admin Portal</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Sign in with Lab Admin credentials to manage catalog & categories</p>
        </div>
        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-blue-600" />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-blue-600" />}>
      <LabAdminDashboard />
    </Suspense>
  );
}
