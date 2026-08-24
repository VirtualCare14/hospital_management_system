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
    } else if (presetType === 'KALA_AZAR') {
      setReportForm({
        title: 'KALA AZAR',
        test: 'KALA AZAR',
        category: 'LAB',
        basePrice: 500,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Qualitative detection of antibodies to Leishmania donovani (rK-39 antigen) in human serum for diagnosis of Visceral Leishmaniasis (Kala-azar).',
        interpretation: 'Interpretation\n\n• Positive → Suggestive of Visceral Leishmaniasis (Kala-azar)\n• Negative → No serological evidence of Kala-azar\n• Clinical correlation required',
        parameters: [
          {
            name: 'LEISHMANIA rK-39 ANTIBODY, SERUM',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'INSULIN_RANDOM') {
      setReportForm({
        title: 'Insulin Random',
        test: 'Insulin Random',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of random insulin levels in serum to evaluate glucose metabolism, beta-cell function, and insulin resistance.',
        interpretation: `Note\n1. A single random blood sample for insulin may not be sufficient because insulin levels and blood glucose can vary widely over time.\n2. Insulin secretion can be stimulated by various factors, including high blood glucose, glucagon, amino acids, growth hormone, and catecholamines.\n3. Insulin assay results can be affected by insulin antibodies that develop in patients receiving bovine or porcine insulin treatments.\n\nClinical Utility\n• Evaluation of fasting hypoglycemia\n• Evaluation of Polycystic Ovary syndrome\n• Classification of Diabetes mellitus\n• Predict Diabetes mellitus\n• Assessment of Beta cell activity\n• Select optimal therapy for Diabetes\n• Investigation of insulin resistance\n• Predict the development of Coronary Artery Disease\n\nInterpretation\nIncreased levels - Insulinoma, Some Type II diabetic patients, Infantile hypoglycemia, Hyperinsulinism, Obesity, Cushing's syndrome, Oral contraceptives, Acromegaly, Hyperthyroidism\nDecreased levels - Untreated Type I Diabetes mellitus`,
        parameters: [
          {
            name: 'Insulin Random',
            referenceRange: '2.6 - 24.9',
            unit: 'µU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'IRON') {
      setReportForm({
        title: 'Iron',
        test: 'Iron',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of serum Iron level to evaluate iron metabolism, iron deficiency anemia, and hemochromatosis.',
        interpretation: `Physiological basis
Plasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow; rate of breakdown or loss of hemoglobin; and rate of synthesis of new hemoglobin. The key regulator of iron homeostasis is hepcidin. Hepcidin excess or deficiency contributes to the dysregulation of iron homeostasis in hereditary and acquired iron disorders.

Interpretation
Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.
Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.

Comments
Absence of stainable iron on bone marrow aspirate differentiates iron deficiency from other causes of microcytic anemia (eg, thalassemia, sideroblastic anemia, some chronic disease anemias), but the procedure is invasive and expensive. Serum iron, iron-binding capacity, transferrin saturation, serum ferritin or soluble transferrin receptor may obviate the need for bone marrow examination. Serum iron, transferrin saturation and ferritin are useful in screening family members for hereditary hemochromatosis.`,
        parameters: [
          {
            name: 'Iron',
            referenceRange: '65 - 175',
            unit: 'µg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HPLC') {
      setReportForm({
        title: 'HPLC',
        test: 'HPLC',
        category: 'LAB',
        basePrice: 1200,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '24 Hours',
        description: 'Hemoglobin HPLC (High-Performance Liquid Chromatography) / Electrophoresis for screening and diagnosis of thalassemia syndromes and hemoglobinopathies.',
        interpretation: `Methodology: High Performance Liquid Chromatography (CE-HPLC) / Hemoglobin Electrophoresis

Physiological Basis:
High Performance Liquid Chromatography (HPLC) is used for the qualitative and quantitative determination of normal and abnormal hemoglobin variants (hemoglobinopathies) and thalassemia syndromes (especially Beta Thalassemia). Normal adult hemoglobin is predominantly Hb A (Hb Adult, >95%), with small amounts of Hb A2 (2.0 - 3.5%) and Hb F (<1.0%).

Interpretation:
1. Normal Adult Pattern:
   • Hb Adult (Hb A0): 95.0 – 98.0 %
   • Hb A2: 2.0 – 3.5 %
   • Hb F: < 1.0 %

2. Beta Thalassemia Trait (Minor):
   • Hb A2: Elevated between 3.6% and 9.0% (Diagnostic cutoff: >3.5%)
   • Hb F: Normal or slightly elevated (1.0 - 5.0%)
   • Red Cell Indices: Microcytic hypochromic picture (Low MCV < 80 fL, Low MCH < 27 pg)

3. Beta Thalassemia Major / Intermedia:
   • Hb F: Markedly elevated (10% to >90%)
   • Hb A0: Significantly reduced or absent
   • Hb A2: Variable

4. Other Hemoglobin Variants:
   • Hb S: Sickle cell trait (Hb A + Hb S) or Sickle cell anemia (Hb S + Hb F, no Hb A)
   • Hb E / Hb D-Punjab / Hb C: Identified in specific chromatographic retention windows

Comments & Clinical Guidance:
• Severe iron deficiency anemia can artificially lower Hb A2 levels and may mask a concurrent Beta Thalassemia Trait. Evaluation and correction of iron status (Serum Ferritin/Iron) is recommended prior to re-testing if clinically indicated.
• Partner screening (antenatal / premarital counseling) and molecular genetic (DNA) analysis are recommended for definitive genetic risk assessment.`,
        parameters: [
          { name: 'Hb F', referenceRange: '< 1.0', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Peak 2', referenceRange: '0 - 2.5', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Hb Adult', referenceRange: '95.0 - 98.0', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Hb A2', referenceRange: '2.0 - 3.5', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Hemoglobin', referenceRange: '12.0 - 16.0', unit: 'g/dl', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'RBC Count', referenceRange: '4.0 - 5.5', unit: 'Mill/cml.', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Packed Cell Volume (PCV)', referenceRange: '36.0 - 48.0', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'MCV', referenceRange: '80 - 100', unit: 'fL', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'MCH', referenceRange: '27 - 32', unit: 'Pg', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'RDW', referenceRange: '11.5 - 14.5', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] }
        ]
      });
    } else if (presetType === 'HSCRP') {
      setReportForm({
        title: 'Hscrp (High-Sensitivity C-Reactive Protein)',
        test: 'Hscrp',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'High-Sensitivity C-Reactive Protein (hs-CRP) quantitative estimation in serum for assessing systemic inflammation and cardiovascular risk stratification.',
        interpretation: `Physiologic Basis
CRP is an acute-phase reactant protein. Hepatic secretion is stimulated in response to inflammatory cytokines. Unlike other acute-phase proteins, CRP is not affected by hormones. CRP activates the complement system, binds to Fc receptors, and serves as an opsonin for some microorganisms. Rapid, marked increases in CRP occur with inflammation, infection, trauma and tissue necrosis, malignancies, and autoimmune disorders. CRP levels are also valuable in assessing vascular inflammation and cardiovascular risk stratification. CRP level has been shown to be an independent risk factor for atherosclerotic disease. Elevated CRP levels are associated with increased cardiovascular morbidity and mortality in patients with coronary artery disease.

Interpretation
Increased in: Inflammatory states, including arteriosclerotic disorders.

Comments
CRP is a very sensitive but nonspecific marker of inflammation. A variety of conditions other than arteriosclerosis may cause dramatic increases in CRP levels. CRP levels increase within 2 hours of acute insult (eg, surgery, infection) and should peak and begin decreasing within 48 hours if no other inflammatory event occurs. In patients with rheumatoid arthritis, persistently elevated CRP concentrations are present when the disease is active and usually fall to normal during periods of complete remission. Patients with high hs-CRP concentrations are more likely to develop stroke, myocardial infarction, and severe peripheral vascular disease.`,
        parameters: [
          {
            name: 'High-Sensitivity C-Reactive Protein',
            referenceRange: '< 1.0',
            unit: 'mg/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HSV2_IGG') {
      setReportForm({
        title: 'HSV-2 IgG',
        test: 'HSV-2 IgG',
        category: 'LAB',
        basePrice: 750,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative/Qualitative determination of Herpes Simplex Virus Type 2 (HSV-2) IgG antibodies in human serum.',
        interpretation: `Methodology: Chemiluminescence Immunoassay (CLIA) / ELISA

Clinical Utility:
Herpes Simplex Virus Type 2 (HSV-2) is the primary causative agent of genital ulcer disease and neonatal herpes infections. Detection of specific IgG antibodies is used for assessing exposure history, diagnosis of past/chronic infection, and identification of asymptomatic HSV-2 carriers.

Interpretation:
• < 2.0 AU/mL : Negative (No detectable HSV-2 IgG antibodies)
• ≥ 2.0 AU/mL : Positive (Detectable HSV-2 IgG antibodies present)

Comments & Clinical Guidance:
1. A Negative (< 2.0 AU/mL) result indicates no detectable HSV-2 IgG antibodies. If primary infection is clinically suspected, retesting in 2-4 weeks is advised to allow for seroconversion.
2. A Positive (≥ 2.0 AU/mL) result indicates prior exposure and antibody production. Because HSV remains latent after initial infection, the presence of IgG antibodies indicates latent carriage and does not distinguish between acute, recurrent, or remote asymptomatic infection.
3. Clinical correlation and direct diagnostic methods (e.g. HSV PCR / viral swab from active lesions) should be used during acute clinical presentations.`,
        parameters: [
          {
            name: 'HSV-2 IgG',
            referenceRange: '< 2.0',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'ICALCIUM') {
      setReportForm({
        title: 'iCalcium',
        test: 'iCalcium',
        category: 'LAB',
        basePrice: 400,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of Ionized Calcium (iCalcium) in blood to evaluate physiologically active calcium and calcium homeostasis.',
        interpretation: `Physiological Basis
Calcium circulates in three forms: as free Ca2+ (50–55%), protein bound to albumin and globulins (40–45%), and as calcium-ligand complexes (5–10%) (with citrate, bicarbonate, lactate, phosphate, and sulfate). Protein binding is highly pH-dependent, and acidosis results in an increased free calcium fraction. Ionized Ca2+ is the form that is physiologically active. Ionized calcium is a more accurate reflection of physiologic status than total calcium in patients with altered serum proteins (renal failure, nephrotic syndrome, multiple myeloma, etc), altered concentrations of calcium-binding ligands, and acid-base disturbances. Measurement of ionized calcium is by ion-selective electrodes. Ionized calcium levels vary inversely with pH, about 0.2 mg/dL per 0.1 pH unit change.

Interpretation
Increased in: ↓ Blood pH.
Decreased in: ↑ Blood pH, citrate, EDTA.

Comments
Ionized calcium measurements may be needed in special circumstances, eg, massive blood transfusion, transfusion of whole blood in neonates, liver transplantation, neonatal hypocalcemia, cardiac bypass surgery, and possibly monitoring of patients with secondary hyperparathyroidism from renal failure.`,
        parameters: [
          {
            name: 'iCalcium',
            referenceRange: '1.13 - 1.33',
            unit: 'mmol/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'IGA_URINE') {
      setReportForm({
        title: 'IgA (Urine)',
        test: 'IgA (Urine)',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Urine',
        turnaroundTime: '24 Hours',
        description: 'Quantitative measurement of Immunoglobulin A (IgA) in urine for evaluating renal glomerular damage and IgA nephropathy.',
        interpretation: `Methodology: Nephelometry / Turbidimetry / ELISA

Clinical Utility:
Immunoglobulin A (IgA) is the principal immunoglobulin of mucosal immunity. In normal kidneys, intact immunoglobulins like IgA are minimally filtered across the glomerular filtration barrier. Increased urinary excretion of IgA is observed in diseases involving glomerular injury, particularly IgA Nephropathy (Berger's Disease), Henoch-Schönlein purpura (HSP) nephritis, and active urinary tract immune responses.

Interpretation:
• < 6.0 µg/mL : Normal urinary IgA excretion.
• ≥ 6.0 µg/mL : Elevated urinary IgA excretion.

Clinical Significance of Elevated Urinary IgA:
1. IgA Nephropathy (Berger's Disease): Associated with mesangial IgA deposition and increased urinary loss during active episodes.
2. Glomerulonephritis / Nephrotic Syndrome: Increased glomerular permeability leading to proteinuria.
3. Systemic Vasculitis / Autoimmune Disorders: Henoch-Schönlein Purpura (IgA vasculitis), SLE nephritis.
4. Severe Urinary Tract Infection (UTI): Local mucosal antibody response to urothelial infection.

Comments & Guidance:
• Urinary IgA should be interpreted in conjunction with total urinary protein, urine microalbumin, serum IgA, renal function tests (serum creatinine, BUN), and renal biopsy when clinically indicated.`,
        parameters: [
          {
            name: 'IgA (Urine)',
            referenceRange: '< 6.0',
            unit: 'µg/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'INDIRECT_COOMBS') {
      setReportForm({
        title: "Indirect Coomb's Test",
        test: "Indirect Coomb's Test",
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: "Indirect Antiglobulin Test (IAT / Indirect Coombs Test) for detecting circulating red blood cell alloantibodies and autoantibodies.",
        interpretation: `Physiologic Basis
Indirect antiglobulin test is used to demonstrate the presence in the patient’s serum/plasma of unexpected antibody to ABO and Rh-compatible reagent red blood cells. Patient serum or plasma is incubated in vitro with reagent red cells, which are then washed to remove unbound globulins. Agglutination that occurs when antihuman globulin (AHG, Coombs) reagent is added indicates that antibody has bound to a specific antigen present on the red cells.

Interpretation
Positive in: Presence of alloantibody or autoantibody. Drugs: methyldopa.

Comments
The technique is used in antibody detection and identification, and in the AHG crossmatch prior to transfusion.`,
        parameters: [
          {
            name: "Indirect Coomb's Test",
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true },
              { value: 'Positive (1+)', isAbnormal: true },
              { value: 'Positive (2+)', isAbnormal: true },
              { value: 'Positive (3+)', isAbnormal: true },
              { value: 'Positive (4+)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'IRON_STUDIES') {
      setReportForm({
        title: 'Iron Studies',
        test: 'Iron Studies',
        category: 'LAB',
        basePrice: 850,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Comprehensive iron profile including Serum Iron, UIBC, Total Iron Binding Capacity (TIBC), and Transferrin Saturation for diagnosing iron deficiency and iron overload disorders.',
        interpretation: `Physiological basis
Plasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow, rate of breakdown or loss of hemoglobin, and rate of synthesis of new hemoglobin.

Interpretation for Iron (Fe), serum or plasma:
• Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.
• Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.

Total Iron Binding Capacity (TIBC):
TIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins.
• Increased in: Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives.
• Decreased in: Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, and other chronic diseases.

Transferrin Saturation (%):
• Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions).
• Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation < 16%). It can also be used to assess nutritional status.`,
        parameters: [
          { name: 'Iron', referenceRange: '65 - 175', unit: 'µg/dl', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'UIBC', referenceRange: '155 - 355', unit: 'µg/dl', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Total Iron Binding Capacity (TIBC)', referenceRange: '240 - 450', unit: 'µg/dl', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Transferrin Saturation', referenceRange: '20 - 55', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] }
        ]
      });
    } else if (presetType === 'LH') {
      setReportForm({
        title: 'LH (Luteinising Hormone)',
        test: 'LH',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of Luteinising Hormone (LH) in serum to evaluate gonadal function, fertility, pituitary disorders, and PCOS.',
        interpretation: `Physiological basis :
LH is stimulated by the hypothalamic hormone gonadotropin- releasing hormone (GnRH). It is secreted from the anterior pituitary and acts on the gonads. LH is the principal regulator of steroid biosynthesis in the ovary and testis.

Interpretation :
Increased in: Primary hypogonadism, polycystic ovary syndrome, postmenopause, endometriosis, after depot leuprolide injection; immunoassay result may be falsely elevated in pregnancy.
Decreased in: Pituitary or hypothalamic failure, anorexia nervosa, bulimia, advanced prostate cancer, severe stress, malnutrition, Kallman syndrome (gonadotropin deficiency associated with anosmia). Drugs: digoxin, oral contraceptives, phenothiazines.

Comments
In male hypogonadism, serum LH and FSH levels can distinguish between primary (hypergonadotropic) and secondary (hypogonadotropic) hypogonadism. Hypogonadism associated with aging (andropause) may present a mixed picture, with low testosterone levels and low to low-normal gonadotropin levels. Repeated measurement may be required to diagnose gonadotropin deficiencies.
Elevated serum LH levels are a common feature in polycystic ovary syndrome, but measurement of total testosterone is the test of choice to diagnose polycystic ovary syndrome.`,
        parameters: [
          {
            name: 'Luteinising Hormone, LH',
            referenceRange: '1.7 - 8.6',
            unit: 'mIU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'LIPASE') {
      setReportForm({
        title: 'Lipase',
        test: 'Lipase',
        category: 'LAB',
        basePrice: 500,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of serum Lipase activity for the diagnosis and monitoring of acute pancreatitis and pancreatic disorders.',
        interpretation: `Physiologic Basis
Lipases are responsible for hydrolysis of glycerol esters of long-chain fatty acids to produce fatty acids and glycerol.

Interpretation
Increased in: Acute, recurrent, or chronic pancreatitis, pancreatic pseudocyst, pancreatic malignancy, peritonitis, biliary disease, hepatic disease, diabetes mellitus (especially diabetic ketoacidosis), intestinal disease, gastric malignancy or perforation, cystic fibrosis, inflammatory bowel disease (Crohn disease and ulcerative colitis).

Comments
Serum lipase may be a more reliable test than serum amylase for the initial diagnosis of acute pancreatitis, because of its increased sensitivity in acute alcoholic pancreatitis and because lipase remains elevated longer than amylase.`,
        parameters: [
          {
            name: 'Lipase',
            referenceRange: '0 - 67',
            unit: 'U/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'LDL_CHOLESTEROL') {
      setReportForm({
        title: 'LDL Cholesterol',
        test: 'LDL Cholesterol',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Direct measurement of Low-Density Lipoprotein (LDL) Cholesterol in serum for cardiovascular risk assessment and lipid disorder management.',
        interpretation: `Clinical Significance:
Low-Density Lipoprotein (LDL) cholesterol is the primary atherogenic lipoprotein. Elevated levels of circulating LDL cholesterol lead to plaque deposition in arterial walls (atherosclerosis), increasing the risk of coronary artery disease (CAD), myocardial infarction, and stroke.

National Cholesterol Education Program (NCEP ATP III) Risk Categories:
• < 100 mg/dL : Optimal
• 100 – 129 mg/dL : Near optimal / Above optimal
• 130 – 159 mg/dL : Borderline high
• 160 – 189 mg/dL : High
• ≥ 190 mg/dL : Very high

Causes of Elevated LDL:
• Familial hypercholesterolemia, familial combined hyperlipidemia
• High saturated fat and trans-fat diets, obesity, sedentary lifestyle
• Secondary causes: Hypothyroidism, nephrotic syndrome, chronic kidney disease, diabetes mellitus, cholestasis
• Drugs: Progestins, anabolic steroids, corticosteroids

Comments & Clinical Management:
Target LDL goals depend on individual cardiovascular risk profile (history of CAD, diabetes, smoking, hypertension). Lifestyle modifications and statin therapy are primary interventions.`,
        parameters: [
          {
            name: 'LDL Cholesterol',
            referenceRange: '85 - 130',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'LDL_HDL') {
      setReportForm({
        title: 'LDL / HDL Ratio',
        test: 'LDL / HDL',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Calculated ratio of Low-Density Lipoprotein (LDL) to High-Density Lipoprotein (HDL) for atherogenic risk assessment and cardiovascular disease evaluation.',
        interpretation: `Clinical Significance:
The LDL/HDL Ratio is an important atherogenic index used to evaluate the balance between pro-atherogenic (LDL) and anti-atherogenic (HDL) lipoprotein fractions. It provides superior risk stratification for coronary artery disease (CAD) and cardiovascular events compared to LDL cholesterol alone.

Interpretation & Risk Stratification:
• < 1.5 : Low cardiovascular risk / Desirable
• 1.5 – 3.5 : Average / Moderate cardiovascular risk
• 3.5 – 5.0 : High cardiovascular risk
• > 5.0 : Very high risk of coronary heart disease

Clinical Indications:
• Comprehensive coronary heart disease risk profiling
• Monitoring the efficacy of lipid-lowering therapies (e.g., statins, fibrates)
• Evaluating metabolic syndrome, diabetes mellitus, and atherogenic dyslipidemia

Recommendations:
An optimal cardiovascular risk profile is supported by maintaining an LDL/HDL ratio < 3.0 (ideally < 2.5 in patients with established coronary disease or diabetes) alongside lifestyle changes including regular aerobic exercise, smoking cessation, and a diet rich in unsaturated fats.`,
        parameters: [
          {
            name: 'LDL / HDL',
            referenceRange: '1.5 - 3.5',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'LEUKEMIA_DLC') {
      setReportForm({
        title: 'Leukemia DLC',
        test: 'Leukemia DLC',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Specialized Differential Leukocyte Count (DLC) for detecting and quantifying immature precursor cells including Blast Cells, Promyelocytes, Myelocytes, Metamyelocytes, and Band Forms.',
        interpretation: `Clinical Significance:
Leukemia DLC (Differential Leukocyte Count) evaluates the presence and percentages of immature myeloid and lymphoid precursors in peripheral blood. The appearance of immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes, band forms) and blast cells indicates left shift, leukemoid reactions, myeloproliferative neoplasms (e.g., Chronic Myeloid Leukemia - CML), or acute leukemias (AML/ALL).

Reference Ranges:
• Blast Cells: 0% (Nil in normal peripheral blood)
• Promyelocytes: 0% (Nil)
• Myelocytes: 0% (Nil)
• Metamyelocytes: 0% (Nil)
• BAND Cells: 0 – 5%

Clinical Associations:
1. Acute Leukemias (AML, ALL): Marked proliferation of blast cells (typically ≥ 20% in bone marrow / prominent in peripheral blood) with hiatus leukaemicus.
2. Chronic Myeloid Leukemia (CML): Spectrum of all stages of myeloid maturation (blasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with prominent basophilia and eosinophilia.
3. Leukemoid Reaction: Severe infections, burns, or tissue necrosis causing significant left shift with toxic granulation and Dohle bodies, but usually low blasts (< 5%).
4. Myelodysplastic Syndromes (MDS): Dysplastic maturation, cytopenias, and variable blast percentages.

Comments & Guidance:
Correlation with complete blood counts (CBC), peripheral blood smear morphology, bone marrow aspirate/biopsy, cytochemistry, flow cytometry (immunophenotyping), and cytogenetics/molecular testing (e.g., BCR-ABL1) is recommended.`,
        parameters: [
          { name: 'Metamyelocytes', referenceRange: '0 - 0', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Myelocytes', referenceRange: '0 - 0', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Promyelocytes', referenceRange: '0 - 0', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'Blast Cells', referenceRange: '0 - 0', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] },
          { name: 'BAND Cells', referenceRange: '0 - 5', unit: '%', fieldType: 'Number', gender: 'Both', valueOptions: [] }
        ]
      });
    } else if (presetType === 'HOMOCYSTEINE') {
      setReportForm({
        title: 'Homocysteine',
        test: 'Homocysteine',
        category: 'LAB',
        basePrice: 850,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of total Homocysteine in serum/plasma for cardiovascular risk evaluation, thrombosis screening, and assessing Vitamin B12/Folate status.',
        interpretation: `Interpretation:
• 5 – 15 µmol/L → Normal
• 15 – 30 µmol/L → Mild elevation
• 30 – 100 µmol/L → Moderate elevation
• > 100 µmol/L → Severe elevation

Clinical Significance:
Homocysteine is a sulfur-containing amino acid derived from methionine metabolism. Elevated plasma homocysteine (hyperhomocysteinemia) is an independent risk factor for atherosclerotic vascular disease (coronary artery disease, cerebrovascular disease, peripheral artery disease) and deep vein thrombosis / thromboembolism.

Causes of Hyperhomocysteinemia:
1. Nutritional Deficiencies: Vitamin B12, Vitamin B6 (pyridoxine), and Folate (folic acid) deficiencies.
2. Genetic Defects: Cystathionine β-synthase (CBS) deficiency (homocystinuria), MTHFR gene mutations (C677T / A1298C variants).
3. Chronic Renal Disease: Decreased renal clearance and altered metabolism.
4. Lifestyle & Medications: Smoking, advancing age, high coffee consumption, methotrexate, phenytoin, metformin.

Comments:
Therapeutic response to supplementation with Folic Acid, Vitamin B6, and Vitamin B12 often normalizes elevated plasma homocysteine levels.`,
        parameters: [
          {
            name: 'Homocysteine',
            referenceRange: '5 - 15',
            unit: 'µmol/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HIV_CARD') {
      setReportForm({
        title: 'HIV (Card Test)',
        test: 'HIV (Card Test)',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Rapid immunochromatographic card test for the differential detection of Antibodies to Human Immunodeficiency Virus Type 1 and Type 2 (HIV-1 & HIV-2) in serum/plasma.',
        interpretation: `Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.
Advise: Kindly confirm by ELISA or Western blot method.

1. A negative result implies that no Anti HIV – 1 & HIV - 2 antibodies have been detected in the sample by this method. This means that either the patient has not been exposed to HIV-1 or HIV-2 infection or the sample has been tested during the “WINDOW PHASE” (before the development of detectable levels of antibodies).
2. A positive result suggests the possibilities of HIV-I and/or HIV-II infection. However, these results must be verified by a confirmatory test (IFA / WESTERN BLOT I-II) before pronouncing the patient positive for HIV-1 and/or HIV-2 infection.

ALL reactive samples should be confirmed by using HIV Western Blot/PCR.`,
        parameters: [
          {
            name: 'HIV - 1',
            referenceRange: 'Non-Reactive',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive', isAbnormal: false },
              { value: 'Reactive', isAbnormal: true },
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true }
            ]
          },
          {
            name: 'HIV - 2',
            referenceRange: 'Non-Reactive',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive', isAbnormal: false },
              { value: 'Reactive', isAbnormal: true },
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'HIV_ELISA') {
      setReportForm({
        title: 'HIV ELISA I/II',
        test: 'HIV ELISA I/II',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: '24 Hours',
        description: 'Quantitative/Qualitative Enzyme-Linked Immunosorbent Assay (ELISA) for the simultaneous detection of Antibodies to HIV-1 and HIV-2 (including p24 antigen).',
        interpretation: `Methodology: Enzyme-Linked Immunosorbent Assay (ELISA) / 4th Generation Ag-Ab Assay

Result Interpretation Guidelines:
• Non-Reactive (< 0.90 S/CO Index) : No detectable HIV-1/2 antibodies or p24 antigen.
• Equivocal / Borderline (0.90 – 1.10 S/CO Index) : Retest recommended with a fresh sample after 2 to 4 weeks.
• Reactive (≥ 1.10 S/CO Index) : Presumptive presence of HIV-1/2 antibodies and/or p24 antigen.

Clinical Significance & Advisory:
1. Non-Reactive Result: Indicates that HIV-1/2 antibodies (and p24 antigen in 4th Gen assays) were not detected. It does not exclude acute early infection during the initial "Window Period" (typically 2–4 weeks post-exposure). In cases of recent suspected exposure, repeat testing after 4–6 weeks is strongly recommended.
2. Reactive Result: A reactive screening ELISA test must not be considered a definitive diagnosis of HIV infection. According to national (NACO / CDC / WHO) guidelines, ALL initially reactive specimens MUST be subjected to supplementary confirmatory testing (HIV Western Blot / Line Immunoassay / HIV-1 RNA Qualitative PCR) before establishing a final positive diagnosis.
3. False Positives: May occasionally occur due to autoimmune conditions (SLE, rheumatoid factor), pregnancy, prior vaccinations, or severe hypergammaglobulinemia.

Guidance:
Confirmatory testing and pre/post-test counseling are strongly recommended for all reactive outcomes.`,
        parameters: [
          {
            name: 'HIV ELISA I/II',
            referenceRange: 'Non-Reactive (< 0.90)',
            unit: 'Units',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive', isAbnormal: false },
              { value: 'Borderline / Equivocal', isAbnormal: true },
              { value: 'Reactive', isAbnormal: true },
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'HCV') {
      setReportForm({
        title: 'Hepatitis C Virus (HCV)',
        test: 'HCV',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Serological test for the detection of antibodies to Hepatitis C Virus (Anti-HCV) in human serum or plasma.',
        interpretation: `Interpretation:
• Non-Reactive : Absence of antibodies to the Hepatitis C virus.
• Reactive : Presence of antibodies to Hepatitis C virus.

Clinical Significance & Advisory:
1. Reactive test result indicates the presence of Hepatitis C virus infection. Active infection to be confirmed by HCV RNA PCR test. It cannot differentiate between the stages of Hepatitis C viral infection nor used to monitor the efficacy of treatment.
2. Non-Reactive test result indicates Hepatitis C virus infection is unlikely.
3. False positive results may be observed in patients receiving mouse monoclonal antibodies, on heparin therapy, on biotin supplements for diagnosis or therapy or presence of heterophilic antibodies in serum.
4. False negative reaction may be due to processing of sample collected early in the course of disease, Prozone phenomenon, Immunosuppression & Immuno-incompetence.

Uses:
I. To diagnose suspected HCV infection in the risk group.
II. Prenatal Screening of pregnant women and pre-surgical/interventional procedures work up.`,
        parameters: [
          {
            name: 'Hepatitis C Virus, HCV',
            referenceRange: 'Non-Reactive',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive', isAbnormal: false },
              { value: 'Reactive', isAbnormal: true },
              { value: 'Borderline / Equivocal', isAbnormal: true },
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'HCT') {
      setReportForm({
        title: 'Hematocrit Value, Hct',
        test: 'HCT',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative determination of Hematocrit (Packed Cell Volume - PCV) in whole blood for assessing anemia, polycythemia, and hydration status.',
        interpretation: `Clinical Significance:
Hematocrit (Hct), also known as Packed Cell Volume (PCV), is the proportion of whole blood volume that is occupied by red blood cells (erythrocytes). It is a vital hematological parameter used in the evaluation of anemias, polycythemia, hemoconcentration, and fluid status.

Reference Ranges:
• Adult Males: 40 – 50 %
• Adult Females: 36 – 46 %
• Children (varies by age): 31 – 43 %
• Newborns: 44 – 64 %

Clinical Associations:
1. Increased Hematocrit (Polycythemia / Hemoconcentration):
   - Primary: Polycythemia vera.
   - Secondary: Chronic hypoxia (COPD, cyanotic congenital heart disease, high altitude residence, heavy smoking).
   - Relative (Hemoconcentration): Dehydration, severe burns, dengue hemorrhagic fever, shock, diabetic ketoacidosis.
2. Decreased Hematocrit (Anemia / Hemodilution):
   - Blood loss: Acute hemorrhage, chronic occult GI bleeding.
   - Decreased erythropoiesis: Iron deficiency anemia, megaloblastic anemia (B12/folate deficiency), aplastic anemia, bone marrow infiltration, chronic kidney disease (erythropoietin deficiency).
   - Increased destruction (Hemolysis): Autoimmune hemolytic anemia, sickle cell disease, thalassemia, microangiopathic hemolytic anemias.
   - Fluid overload / Hemodilution: Congestive heart failure, excess IV fluid administration, pregnancy.

Comments:
Hematocrit should always be interpreted alongside Hemoglobin (Hb), Total RBC Count, Red Cell Indices (MCV, MCH, MCHC, RDW), and the patient's hydration status.`,
        parameters: [
          {
            name: 'Hematocrit Value, Hct',
            referenceRange: '40 - 50',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HB') {
      setReportForm({
        title: 'Hemoglobin (Hb)',
        test: 'HB',
        category: 'LAB',
        basePrice: 120,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of Hemoglobin concentration in whole blood for diagnosing and managing anemias, polycythemia, and oxygen transport capacity.',
        interpretation: `Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.

Increased in:
1. Hemoconcentration (as in dehydration, Burns, vomiting)
2. Polycythemia (erythrocytosis)
3. Extreme physical exercise.

Decreased in:
1. Macrocytic anemia (liver disease, hypothyroidism, vitamin B 12 deficiency, folate deficiency, myelodysplasia)
2. Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration)
3. Microcytic anemia (iron deficiency, thalassemia)
4. Hemodilution (fluid overload, pregnancy)

Comments:
The cyanmethemoglobin technique is the method of choice selected by the International Committee for Standardization in Hematology. The method measures all hemoglobin derivatives except sulfhemoglobin by hemolyzing the specimen and adding a reducing agent. As such, this method does not distinguish between intracellular versus extracellular hemoglobin (hemolysis). Hypertriglyceridemia and very high white blood cell counts can cause false elevations of Hb.`,
        parameters: [
          {
            name: 'Hemoglobin',
            referenceRange: '13 - 17',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HAV_IGM') {
      setReportForm({
        title: 'HAV IgM',
        test: 'HAV IgM',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Immunoassay for the qualitative and semi-quantitative detection of IgM antibodies to Hepatitis A Virus in human serum or plasma for diagnosing acute hepatitis A infection.',
        interpretation: `Interpretation:
• < 2.0 AU/mL : Non-Reactive / Negative (No detectable IgM antibodies to Hepatitis A Virus)
• 2.0 – 2.5 AU/mL : Borderline / Equivocal (Retest recommended with a fresh sample in 1–2 weeks if clinically indicated)
• > 2.5 AU/mL : Reactive / Positive (Presence of IgM antibodies to Hepatitis A Virus)

Clinical Significance:
1. Anti-HAV IgM antibodies develop rapidly during the acute phase of Hepatitis A virus infection, usually detectable at or before the onset of clinical symptoms and peak within the first few weeks of illness.
2. A Positive / Reactive result indicates acute or recent Hepatitis A infection. Anti-HAV IgM levels typically remain detectable for 3 to 6 months following infection.
3. A Negative / Non-Reactive result indicates absence of acute Hepatitis A infection. It does not exclude previous exposure or immunity, which is determined by Anti-HAV IgG testing.
4. Transient false-positive results may rarely occur due to cross-reactivity with other viral infections, autoimmune disorders, or recent administration of immunoglobulin / Hepatitis A vaccine.

Clinical Correlation:
Results should always be interpreted in conjunction with clinical symptoms (jaundice, nausea, abdominal discomfort, dark urine) and other liver function tests (Total Bilirubin, SGPT/ALT, SGOT/AST).`,
        parameters: [
          {
            name: 'HAV IgM',
            referenceRange: '< 2 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'H_ALB') {
      setReportForm({
        title: 'H-ALB',
        test: 'H-ALB',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Urine (Spot / Random Urine)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative determination of Microalbumin (Human Albumin / H-ALB) in urine for early detection of diabetic nephropathy, hypertensive kidney damage, and vascular injury.',
        interpretation: `Clinical Significance:
H-ALB (Human Albumin / High-Sensitivity Urine Albumin / Microalbumin) is an early and sensitive biomarker for the detection of glomerular injury and endothelial dysfunction, particularly in patients with diabetes mellitus and systemic arterial hypertension.

Reference Ranges (Spot / Random Urine):
• Normal (Normoalbuminuria) : < 10 µg/mL (or < 20 mg/L)
• Microalbuminuria (Early Nephropathy) : 10 – 200 µg/mL (20 – 200 mg/L)
• Macroalbuminuria (Overt Clinical Nephropathy) : > 200 µg/mL (> 200 mg/L)

Clinical Associations:
1. Diabetic Nephropathy: Persistent microalbuminuria is the earliest clinical herald of diabetic nephropathy in both Type 1 and Type 2 diabetes. Early detection and aggressive glycemic/BP control (with ACEi / ARBs) can retard or reverse progressive renal decline.
2. Hypertensive Renal Damage: Marker of target organ damage and increased cardiovascular morbidity/mortality risk.
3. Glomerular & Endothelial Dysfunction: Preeclampsia, systemic lupus erythematosus (SLE) nephritis, glomerulonephritis, and generalized vascular inflammation.

Transient Non-Specific Elevations (False Positives):
Transient increases in urinary albumin excretion may occur due to vigorous physical exercise, urinary tract infection (UTI), acute febrile illness, hematuria, congestive heart failure, upright posture (orthostatic proteinuria), or severe hyperglycemia.

Recommendation:
Confirmation of persistent microalbuminuria requires at least 2 of 3 positive specimens collected over a 3 to 6-month period, ideally alongside an Albumin-to-Creatinine Ratio (ACR).`,
        parameters: [
          {
            name: 'H-ALB',
            referenceRange: '< 10 µg/mL',
            unit: 'µg/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'GTT') {
      setReportForm({
        title: 'Glucose Tolerance Test (GTT)',
        test: 'GTT',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Blood Fluoride Plasma',
        turnaroundTime: 'Same Day',
        description: 'Serial plasma glucose measurements following oral glucose load for the diagnosis of impaired fasting glucose, impaired glucose tolerance, diabetes mellitus, and gestational diabetes.',
        interpretation: `Interpretation (ADA / WHO Diagnostic Thresholds):

Status | Fasting Plasma Glucose | Post 75g Glucose Load (2 hr)
• Normal : 70 - 100 mg/dL | 70 - 140 mg/dL
• Impaired Fasting Glucose (IFG) : 101 - 125 mg/dL | 70 - 140 mg/dL
• Impaired Glucose Tolerance (IGT) : 70 - 100 mg/dL | 141 - 199 mg/dL
• Pre-Diabetes (IFG / IGT) : 101 - 125 mg/dL | 141 - 199 mg/dL
• Diabetes Mellitus : ≥ 126 mg/dL | ≥ 200 mg/dL

Diagnostic Criteria:
The diagnosis of Diabetes requires a fasting plasma glucose of ≥ 126 mg/dL or a random / 2 hr post glucose value of ≥ 200 mg/dL on at least 2 separate occasions.

Gestational Diabetes (GDM) 3-Hour Reference Cutoffs:
• Fasting: < 100 mg/dL
• 1 Hour: < 190 mg/dL
• 2 Hour: < 165 mg/dL
• 3 Hour: < 145 mg/dL`,
        parameters: [
          {
            name: 'Fasting',
            referenceRange: '< 100',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: '1 Hour',
            referenceRange: '< 190',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: '2 Hour',
            referenceRange: '< 165',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: '3 Hour',
            referenceRange: '< 145',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'GRAMS_STAIN') {
      setReportForm({
        title: "Gram's Stain",
        test: "Gram's Stain",
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Pus / Swab / Sputum / Body Fluid / Urine',
        turnaroundTime: 'Same Day',
        description: 'Direct microscopic examination following Gram staining for preliminary identification of bacterial and fungal pathogens and cellular response.',
        interpretation: `Clinical Significance:
Gram stain is a rapid differential staining technique that categorizes bacteria into Gram-positive (violet/purple) and Gram-negative (pink/red) based on the structural and biochemical properties of their cell walls. It provides critical preliminary diagnostic information to guide immediate empirical antimicrobial therapy before definitive culture and antibiotic sensitivity test (AST) results are available.

Microscopic Findings & Interpretation:
1. Gram-Positive Cocci:
   - In clusters: Suggestive of Staphylococcus spp. (e.g., S. aureus, CoNS).
   - In chains / pairs: Suggestive of Streptococcus spp. (e.g., S. pyogenes, S. pneumoniae, Enterococcus spp.).
2. Gram-Negative Bacilli (Rods):
   - Suggestive of Enterobacteriaceae (E. coli, Klebsiella, Proteus) or non-fermenting bacilli (Pseudomonas aeruginosa, Acinetobacter).
3. Gram-Negative Diplococci:
   - Intracellular / extracellular: Suggestive of Neisseria meningitidis, Neisseria gonorrhoeae, or Moraxella catarrhalis.
4. Gram-Positive Bacilli:
   - Suggestive of Corynebacterium spp., Listeria, Bacillus spp., Clostridium spp., or Lactobacillus.
5. Fungal Elements:
   - Budding yeast-like cells with or without pseudohyphae: Suggestive of Candida species.

Advisory:
Gram stain is a presumptive rapid screening test. Definitive identification and antimicrobial susceptibility require aerobic/anaerobic bacterial culture and AST.`,
        parameters: [
          {
            name: 'Sample Type',
            referenceRange: 'Pus / Swab / Sputum / Fluid',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Pus / Exudate', isAbnormal: false },
              { value: 'Sputum', isAbnormal: false },
              { value: 'Throat / Nasal Swab', isAbnormal: false },
              { value: 'Wound Swab', isAbnormal: false },
              { value: 'Urine', isAbnormal: false },
              { value: 'Body Fluid (Pleural / Ascitic / Synovial / CSF)', isAbnormal: false },
              { value: 'High Vaginal Swab (HVS)', isAbnormal: false },
              { value: 'Blood Culture Broth', isAbnormal: false }
            ]
          },
          {
            name: 'Result',
            referenceRange: 'No organisms or pus cells seen',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'No bacteria or pus cells seen on direct microscopic examination.', isAbnormal: false },
              { value: 'Few Pus cells (1-3/hpf) seen. No microorganisms detected.', isAbnormal: false },
              { value: 'Gram-positive cocci seen in clusters (suggestive of Staphylococci species). Pus cells: Moderate (5-10/hpf).', isAbnormal: true },
              { value: 'Gram-positive cocci seen in pairs/chains (suggestive of Streptococci species). Pus cells: Present.', isAbnormal: true },
              { value: 'Gram-negative bacilli seen. Pus cells: Moderate to plenty (15-20/hpf).', isAbnormal: true },
              { value: 'Gram-negative intracellular diplococci seen (suggestive of Neisseria species). Plenty of pus cells.', isAbnormal: true },
              { value: 'Gram-positive bacilli seen.', isAbnormal: true },
              { value: 'Budding yeast cells with pseudohyphae seen (suggestive of Candida species).', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'GTT_PREGNANCY') {
      setReportForm({
        title: 'Glucose Tolerance Test, GTT (Pregnancy)',
        test: 'GTT (Pregnancy)',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Blood Fluoride Plasma',
        turnaroundTime: 'Same Day',
        description: 'Oral Glucose Tolerance Test during pregnancy (24-28 weeks) for screening and diagnosis of Gestational Diabetes Mellitus (GDM) using ADA One-Step Strategy.',
        interpretation: `According to American Diabetes Association (ADA) Guidelines 2024 for Screening and Diagnosis of Gestational Diabetes Mellitus (GDM), the One-Step Strategy is followed.

Method - One-step strategy:
Perform a 75-g OGTT, with plasma glucose measurement when an individual is fasting and at 1 and 2 h, at 24-28 weeks of gestation in individuals not previously diagnosed with diabetes. The OGTT should be performed in the morning after an overnight fast of at least 8 hours.

Normal Values / Reference Cutoffs:
• Fasting : < 92 mg/dL (5.1 mmol/L) [Reference: 65 - 92 mg/dL]
• At 1 hour : < 180 mg/dL (10.0 mmol/L) [Reference: 100 - 180 mg/dL]
• At 2 hour : < 153 mg/dL (8.5 mmol/L) [Reference: 65 - 153 mg/dL]
• At 3 hour : < 125 mg/dL [Reference: 70 - 125 mg/dL]

The diagnosis of GDM is made when ANY ONE of the plasma glucose values is met or exceeded.`,
        parameters: [
          {
            name: 'Fasting',
            referenceRange: '65 - 92',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Female',
            valueOptions: []
          },
          {
            name: '1 hour',
            referenceRange: '100 - 180',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Female',
            valueOptions: []
          },
          {
            name: '2 hour',
            referenceRange: '65 - 153',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Female',
            valueOptions: []
          },
          {
            name: '3 hour',
            referenceRange: '70 - 125',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Female',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'GLOBULIN') {
      setReportForm({
        title: 'Globulin',
        test: 'Globulin',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative determination of Serum Globulin fraction for evaluating liver disease, chronic infections, autoimmune disorders, and plasma cell dyscrasias.',
        interpretation: `Clinical Significance:
Globulins are a diverse group of proteins in blood serum comprising alpha-1, alpha-2, beta, and gamma globulins. They play critical roles in immune defense (immunoglobulins/antibodies), blood clotting, enzymatic actions, and the transport of hormones, lipids, and minerals (e.g., transferrin, haptoglobin, ceruloplasmin). Calculated as: Globulin = Total Protein – Albumin.

Reference Range:
• Normal Serum Globulin : 1.8 – 3.6 g/dL

Clinical Associations:
1. Hyperglobulinemia (Elevated Globulin Levels):
   - Chronic Infections: Tuberculosis, subacute bacterial endocarditis, chronic hepatitis (HBV/HCV), HIV, parasitic infections (leishmaniasis/Kala-Azar, malaria).
   - Autoimmune & Inflammatory Diseases: Systemic lupus erythematosus (SLE), rheumatoid arthritis, sarcoidosis, autoimmune hepatitis.
   - Hematological Malignancies / Monoclonal Gammopathies: Multiple myeloma, Waldenström's macroglobulinemia, monoclonal gammopathy of undetermined significance (MGUS), lymphomas.
   - Chronic Liver Disease: Cirrhosis (elevated polyclonal gamma-globulin fraction with A/G ratio reversal).
2. Hypoglobulinemia (Decreased Globulin Levels):
   - Immunodeficiency states: Congenital or acquired agammaglobulinemia/hypogammaglobulinemia.
   - Severe protein loss: Protein-losing enteropathies, extensive burns.
   - Malnutrition and malabsorption disorders.

Recommendation:
Abnormal globulin levels, especially when associated with an inverted A/G ratio (< 1.0) or unexplained elevated total protein, warrant Serum Protein Electrophoresis (SPEP) and immunofixation electrophoresis (IFE) for definitive characterization.`,
        parameters: [
          {
            name: 'Globulin',
            referenceRange: '1.8 - 3.6',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'GGT') {
      setReportForm({
        title: 'Gamma Glutamyl Transferase, GGT',
        test: 'GGT',
        category: 'LAB',
        basePrice: 300,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Enzymatic measurement of Gamma-Glutamyl Transferase (GGT) in serum for assessing hepatobiliary disorders, biliary obstruction, and alcohol-induced liver injury.',
        interpretation: `Interpretation:
Synthesis of GGT is stimulated by many drugs e.g., phenytoin, phenobarbitone, primidone, alcohol and possibly some antidepressants. GGT is a sensitive test for excess alcohol intake but is not specific.

Abnormal test results:
1. Raised GGT and raised mean corpuscular volume (MCV) suggest alcohol abuse.
2. Raised GGT, history of excessive alcohol intake, raised ALT and raised MCV suggest liver cell damage.
3. Very high GGT (10 times normal upper limit) occurs in biliary obstruction and hepatic malignancies.
4. Raised GGT and raised ALP (more than three times upper limit of normal) suggest cholestasis.
5. Raised GGT may be due to non-specific causes e.g., MI, cerebrovascular accident, diabetes mellitus, pancreatic disease, renal failure and chronic lung disease.
6. LFTs (transaminase and GGT) are also affected by lack of exercise, obesity and smoking, as well as excess alcohol intake. Elevated results may, therefore, occur if several of these factors coexist, even if alcohol intake is not excessive.
7. The effect of alcohol on GGT is complex. About 50% of people who drink alcohol to excess on a regular basis will have biochemical abnormalities, while the other 50% will not.`,
        parameters: [
          {
            name: 'Gamma Glutamyl Transferase, GGT',
            referenceRange: '9 - 52',
            unit: 'IU/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'GCT') {
      setReportForm({
        title: 'Glucose Challenge Test (GCT); Pregnancy , 75g Glucose',
        test: 'GCT',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Blood Fluoride Plasma',
        turnaroundTime: 'Same Day',
        description: 'Gestational Diabetes Mellitus (GDM) screening test measuring plasma glucose after a 75g oral glucose challenge during pregnancy (24-28 weeks).',
        interpretation: `Clinical Significance:
The Glucose Challenge Test (GCT) is a standard screening test for Gestational Diabetes Mellitus (GDM), typically performed between 24 and 28 weeks of gestation in pregnant women. Plasma glucose is measured after oral administration of a 75g glucose load.

Reference Range:
• Normal Screening Value : 70 – 140 mg/dL (< 140 mg/dL)

Clinical Interpretation:
• Plasma Glucose < 140 mg/dL : Negative screen (GDM unlikely).
• Plasma Glucose 140 – 199 mg/dL : Positive screen (Impaired gestational glucose tolerance; warrants follow-up diagnostic oral glucose tolerance testing - OGTT / DIPSI criteria).
• Plasma Glucose ≥ 200 mg/dL : Highly suggestive of Gestational Diabetes Mellitus.

Comments:
According to DIPSI (Diabetes in Pregnancy Study Group India) guidelines, a 2-hour plasma glucose ≥ 140 mg/dL after a 75g oral glucose load in the non-fasting state is diagnostic of GDM.`,
        parameters: [
          {
            name: 'Glucose Challenge Test (GCT); Pregnancy , 75g Glucose',
            referenceRange: '70 - 140',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Female',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'G6PD') {
      setReportForm({
        title: 'Glucose-6-Phosphate Dehydrogenase (G6PD)',
        test: 'G6PD',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'EDTA Whole Blood',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of Glucose-6-Phosphate Dehydrogenase enzyme activity in erythrocytes for diagnosing G6PD deficiency, hemolytic anemia, and pre-medication risk assessment.',
        interpretation: `Clinical Significance:
Glucose-6-Phosphate Dehydrogenase (G6PD) is a critical housekeeping enzyme in the hexose monophosphate (HMP) shunt pathway. In erythrocytes (RBCs), G6PD is the sole source of NADPH, which maintains reduced glutathione (GSH) to protect red blood cells and hemoglobin against oxidative stressors and free radicals.

Reference Ranges (Quantitative Spectrophotometry at 37°C):
• Normal / Adequate Activity : 6.4 – 12.9 U/g Hb
• Intermediate Deficiency : 2.1 – 6.3 U/g Hb (30% – 70% of normal mean)
• Severe / Deficient Activity : < 2.1 U/g Hb (< 30% of normal mean)

Clinical Interpretation & WHO Classification:
1. G6PD Deficiency is an X-linked recessive enzymopathy primarily affecting males (hemizygotes) and homozygous females; heterozygous females exhibit variable mosaic expression due to lyonization (X-inactivation).
2. Acute Hemolytic Anemia (AHA) Triggers:
   - Oxidant Drugs: Antimalarials (primaquine, tafenoquine), sulfonamides/cotrimoxazole, nitrofurantoin, dapsone, rasburicase, methylene blue.
   - Dietary: Ingestion of fava beans (Vicia faba) causing Favism.
   - Acute Infections: Viral hepatitis, pneumonia, typhoid, severe sepsis, or diabetic ketoacidosis.
   - Neonatal Jaundice: Severe unconjugated hyperbilirubinemia with risk of acute kernicterus.

Diagnostic Cautions:
• Testing during or immediately following an acute hemolytic episode or blood transfusion may yield falsely normal/elevated enzyme levels because older G6PD-deficient erythrocytes have lysed, leaving younger reticulocytes and transfused donor RBCs with high enzyme levels.
• Re-testing 2–3 months after resolution of hemolysis is strongly recommended to establish true baseline enzymatic activity.`,
        parameters: [
          {
            name: 'Glucose-6-Phosphate Dehydrogenase (G6PD)',
            referenceRange: '6.4 - 12.9',
            unit: 'U/g Hb',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FUNGAL_SCRAPING_SMEAR') {
      setReportForm({
        title: 'Fungal Scraping Smear (KOH Mount)',
        test: 'Fungal Scraping Smear',
        category: 'LAB',
        basePrice: 250,
        taxPercentage: 0,
        sampleType: 'Skin Scrapings / Nail Clippings / Hair / Corneal Scrapings',
        turnaroundTime: 'Same Day',
        description: 'Direct microscopic examination following 10%-20% KOH mount preparation for detecting dermatophytes, Candida, Malassezia, and opportunistic fungal elements.',
        interpretation: `Clinical Significance:
Direct microscopic examination of clinical specimens treated with 10%–20% Potassium Hydroxide (KOH) is a rapid and highly effective primary screening method for superficial, cutaneous, and subcutaneous fungal infections (mycoses). KOH dissolves keratin and cellular debris, making fungal cell walls (hyphae, pseudohyphae, spores) clearly visible.

Microscopic Morphological Interpretation:
1. Dermatophytosis (Tinea / Ringworm):
   - Refractile, branching, uniform septate hyphae with arthroconidia (spores).
2. Candidiasis:
   - Budding yeast-like blastoconidia with elongated pseudohyphae and true hyphae.
3. Pityriasis / Tinea Versicolor (Malassezia furfur):
   - "Spaghetti and meatballs" appearance consisting of short, curved hyphae mixed with round, thick-walled yeast clusters.
4. Onychomycosis:
   - Subungual hyperkeratotic nail debris showing fungal hyphal elements.
5. Deep / Invasive Molds (e.g., Aspergillus / Mucorales):
   - Acute-angle branching septate hyphae (Aspergillus) or broad, non-septate ribbon-like hyphae with wide branching angles (Mucorales).

Advisory:
KOH mount provides rapid presumptive screening. Sabouraud Dextrose Agar (SDA) fungal culture is recommended for definitive species identification and antifungal sensitivity.`,
        parameters: [
          {
            name: 'Sample Site / Specimen',
            referenceRange: 'Skin / Nail / Hair / Corneal',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Skin Scrapings', isAbnormal: false },
              { value: 'Nail Clippings / Subungual Scrapings', isAbnormal: false },
              { value: 'Hair Plucks / Scalp Scrapings', isAbnormal: false },
              { value: 'Corneal Scrapings', isAbnormal: false },
              { value: 'Mucosal Swab / Scraping', isAbnormal: false }
            ]
          },
          {
            name: 'Microscopic Examination (KOH Mount 10-20%)',
            referenceRange: 'No fungal elements seen',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'No fungal elements (hyphae, pseudohyphae, or spores) detected on direct 10% - 20% KOH mount examination.', isAbnormal: false },
              { value: 'Branching, septate fungal hyphae and arthrospores seen (suggestive of Dermatophyte infection / Tinea / Ringworm).', isAbnormal: true },
              { value: 'Budding yeast cells with pseudohyphae seen (suggestive of Candida species / Candidiasis).', isAbnormal: true },
              { value: 'Clusters of spherical yeast cells with short, curved hyphae ("spaghetti and meatballs" appearance - suggestive of Malassezia furfur / Tinea Versicolor / Pityriasis Versicolor).', isAbnormal: true },
              { value: 'Broad, aseptate/pauci-septate ribbon-like right-angle branching fungal hyphae seen (suggestive of Zygomycetes / Mucorales).', isAbnormal: true },
              { value: 'Septate, acute-angle (40-45°) branching, uniform fungal hyphae seen (suggestive of Aspergillus species).', isAbnormal: true },
              { value: 'Brown-pigmented (dematiaceous) fungal elements seen.', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'FSH') {
      setReportForm({
        title: 'Follicle Stimulating Hormone, FSH',
        test: 'FSH',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of Follicle Stimulating Hormone (FSH) in serum to assess fertility, hypogonadism, and pituitary-gonadal axis.',
        interpretation: `Biological Reference Intervals:
• Males (Adult): 1.5 - 12.4 mIU/mL

• Females:
  - Follicular Phase: 3.5 - 12.5 mIU/mL
  - Mid-Cycle Peak (Ovulatory): 4.7 - 21.5 mIU/mL
  - Luteal Phase: 1.7 - 7.7 mIU/mL
  - Postmenopausal: 25.8 - 134.8 mIU/mL
  - Oral Contraceptives: < 4.9 mIU/mL

• Pre-pubertal Children:
  - Males: 0.3 - 3.2 mIU/mL
  - Females: 0.3 - 6.7 mIU/mL

Clinical Significance:
FSH is secreted by the anterior pituitary gland. In females, it stimulates ovarian follicular growth and estrogen secretion. In males, it stimulates Sertoli cells to support spermatogenesis.

Elevated Levels:
• Primary gonadal failure, menopause, premature ovarian failure (POF), Turner syndrome, Klinefelter syndrome, testicular failure.

Decreased Levels:
• Pituitary or hypothalamic dysfunction, hypogonadotropic hypogonadism, Kallmann syndrome, severe stress/anorexia, hyperprolactinemia.`,
        parameters: [
          {
            name: 'Follicle Stimulating Hormone, FSH',
            referenceRange: 'Males: 1.5 - 12.4 | Females: Follicular 3.5 - 12.5, Ovulatory 4.7 - 21.5, Luteal 1.7 - 7.7, Postmenopausal 25.8 - 134.8',
            unit: 'mIU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FT3') {
      setReportForm({
        title: 'Free Triiodothyronine I, FT3',
        test: 'FT3',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of unbound, biologically active Free Triiodothyronine (FT3) in serum to diagnose hyperthyroidism, T3-thyrotoxicosis, and thyroid dysfunction.',
        interpretation: `Clinical Significance:
Triiodothyronine (T3) is the metabolically active thyroid hormone. While over 99.7% of circulating T3 is bound to serum carrier proteins (primarily TBG and albumin), only the unbound Free T3 (FT3) is biologically active.

Reference Range:
• Normal Serum Free T3 (FT3) : 2 - 4.2 pg/mL

Clinical Associations:
1. Elevated FT3:
   - Graves' disease, toxic multinodular goiter, toxic adenoma.
   - T3-Thyrotoxicosis (isolated elevated FT3 with suppressed TSH).
   - Early phase of subacute / postpartum thyroiditis.
2. Decreased FT3:
   - Primary / secondary hypothyroidism.
   - Euthyroid Sick Syndrome (Low T3 syndrome) seen in severe non-thyroidal systemic illness, sepsis, starvation, and ICU patients.`,
        parameters: [
          {
            name: 'Free Triiodothyronine I, FT3',
            referenceRange: '2 - 4.2',
            unit: 'pg/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FT4') {
      setReportForm({
        title: 'Free Thyroxine, FT4',
        test: 'FT4',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of unbound, biologically active Free Thyroxine (FT4) in serum for assessing thyroid function, hypothyroidism, and hyperthyroidism.',
        interpretation: `Clinical Significance:
Thyroxine (T4) is the principal hormone secreted by the thyroid follicular cells. Over 99.9% of circulating T4 is bound to carrier proteins (primarily TBG, transthyretin, and albumin). Free T4 (FT4) represents the unbound, biologically active fraction that diffuses into target cells and exerts metabolic effects, independent of alterations in binding protein concentrations.

Reference Range:
• Normal Serum Free T4 (FT4) : 8.9 - 17.2 pg/mL

Clinical Associations:
1. Elevated FT4:
   - Graves' disease, toxic multinodular goiter, toxic solitary adenoma.
   - Subacute / postpartum thyroiditis (early thyrotoxic phase).
   - Exogenous levothyroxine over-replacement.
2. Decreased FT4:
   - Primary Hypothyroidism: Hashimoto's thyroiditis, post-surgical/radioiodine ablation.
   - Central (Secondary / Tertiary) Hypothyroidism: Pituitary or hypothalamic insufficiency.`,
        parameters: [
          {
            name: 'Free Thyroxine, FT4',
            referenceRange: '8.9 - 17.2',
            unit: 'pg/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FOLIC_ACID') {
      setReportForm({
        title: 'Folic Acid',
        test: 'Folic Acid',
        category: 'LAB',
        basePrice: 800,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative determination of Serum Folate / Folic Acid level by Chemiluminescence Immunoassay (CLIA) to diagnose megaloblastic anemia, malnutrition, and malabsorption.',
        interpretation: `Note:
1. Drugs like Methotrexate and Leucovorin can affect folate test results.
2. To tell apart vitamin B12 deficiency from folate deficiency, check levels of Methylmalonic acid (MMA) in urine and Homocysteine in blood.
3. Folic acid has a low risk of toxicity because it's a water-soluble vitamin that's usually excreted in urine.

Comments:
Folate is crucial for making DNA components and for red blood cell maturation. It comes mainly from plants and some organ meats, but cooking can destroy over half of it. Folate deficiency is common in people with alcoholic liver disease, pregnant women, and the elderly. It can result from poor absorption, inadequate diet, high demand (like in pregnancy or cancer), or certain drugs such as Methotrexate and anticonvulsants.

Interpretation:
Reference Range: 3.1 - 17.5 ng/mL (Normal: > 5.38 ng/mL)
Decreased Levels: Megaloblastic anemia, Infantile hyperthyroidism, Alcoholism, Malnutrition, Scurvy, Liver disease, B12 deficiency, dietary amino acid excess, adult Celiac disease, Tropical Sprue, Crohn's disease, Hemolytic anemias, Carcinomas, Myelofibrosis, vitamin B6 deficiency, pregnancy, Whipple's disease, extensive intestinal resection and severe exfoliative dermatitis.`,
        parameters: [
          {
            name: 'Folic Acid',
            referenceRange: '3.1 - 17.5',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FREE_PSA') {
      setReportForm({
        title: 'Free Prostate Specific Antigen (Free PSA)',
        test: 'Free PSA',
        category: 'LAB',
        basePrice: 850,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescence Immunoassay (CLIA) for measurement of Free PSA and % Free/Total PSA ratio to differentiate Benign Prostatic Hyperplasia (BPH) from Prostate Cancer in men with total PSA 4-10 ng/mL.',
        interpretation: `Clinical Significance:
Prostate-Specific Antigen (PSA) is produced by the secretory epithelium of the prostate. In men with Total PSA levels in the diagnostic "gray zone" of 4.0 to 10.0 ng/mL, the percentage of Free PSA (% fPSA = [Free PSA / Total PSA] × 100) enhances diagnostic specificity to distinguish Benign Prostatic Hyperplasia (BPH) from Prostate Cancer (PCa).

Probability of Prostate Cancer Based on % Free PSA (Total PSA 4.0 - 10.0 ng/mL):
• % Free PSA > 25% : Low Risk (~8% - 10% probability of cancer) -> BPH likely
• % Free PSA 19% - 25% : Intermediate-Low Risk (~18% probability of cancer)
• % Free PSA 15% - 18% : Moderate Risk (~24% probability of cancer)
• % Free PSA 10% - 14% : Intermediate-High Risk (~33% - 40% probability of cancer)
• % Free PSA < 10% : High Risk (~56% probability of cancer) -> Prostate Biopsy Recommended

Clinical Guidance & Pre-test Precautions:
1. Men with % Free PSA < 10% have significantly higher risk of aggressive prostate adenocarcinoma.
2. Blood collection should occur before digital rectal exam (DRE), prostate massage, cystoscopy, or 48 hours afterward.
3. 5-alpha reductase inhibitors (Finasteride, Dutasteride) reduce serum PSA by ~50% within 6 months.`,
        parameters: [
          {
            name: 'Free Prostate Specific Antigen (Free PSA)',
            referenceRange: '0.05 - 0.50',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Male',
            valueOptions: []
          },
          {
            name: 'Total PSA',
            referenceRange: '0.0 - 4.0',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Male',
            valueOptions: []
          },
          {
            name: '% Free PSA Ratio (% fPSA / tPSA)',
            referenceRange: '> 25 % (Low Risk)',
            unit: '%',
            fieldType: 'Number',
            gender: 'Male',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'DHEA') {
      setReportForm({
        title: 'Dehydroepiandrosterone, DHEA',
        test: 'DHEA',
        category: 'LAB',
        basePrice: 800,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of Dehydroepiandrosterone (DHEA) in serum to evaluate adrenal cortex function, androgen excess, and PCOS.',
        interpretation: `Physiologic Basis:
DHEA is a 19-carbon endogenous steroid hormone secreted by the adrenal glands. It is converted to DHEA-S in the adrenals, liver, and small intestine. DHEA-S is albumin-bound in the circulation, and there is no diurnal variation in DHEA-S levels. Levels of DHEA-S are about 300 × higher than DHEA and more stable. It serves as the precursor of androgens and estrogens.

Interpretation:
Reference Range (µg/dl):
• Males: 1.8 - 12.5 µg/dl
• Females: 1.3 - 9.8 µg/dl

Increased in:
• Adrenal hyperplasia, adrenal cancer, congenital adrenal hyperplasia (CAH), polycystic ovarian syndrome (PCOS).

Decreased in:
• Adrenal insufficiency (Addison's disease), hypopituitarism, rheumatoid arthritis (females), insulin, and corticosteroids.

Comments:
DHEA measurement is typically used along with other steroid and peptide hormones to evaluate adrenal function, to help diagnose adrenal cortex tumors, and polycystic ovarian syndrome (in females). Orally ingested DHEA is converted to DHEA-S when passing through intestines and liver. People taking DHEA supplements have elevated blood levels of DHEA-S. Use by athletes is prohibited by the World Anti-doping Agency.`,
        parameters: [
          {
            name: 'DHEA',
            referenceRange: 'Males: 1.8 - 12.5 | Females: 1.3 - 9.8',
            unit: 'µg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'DIABETIC_PACKAGE') {
      setReportForm({
        title: 'Diabetic Package / Comprehensive Diabetic Profile',
        test: 'Diabetic Package',
        category: 'LAB',
        basePrice: 1200,
        taxPercentage: 0,
        sampleType: 'Blood (Fluoride, EDTA, Serum)',
        turnaroundTime: 'Same Day',
        description: 'Comprehensive diabetes screening and metabolic monitoring panel including Fasting & Postprandial Glucose, HbA1c, Complete Lipid Profile, and Renal Function Tests (Urea & Creatinine).',
        interpretation: `I. GLUCOSE METABOLISM & DIABETES DIAGNOSTIC CRITERIA (ADA Guidelines):
Elevated glucose levels (hyperglycemia) are most often encountered clinically in diabetes mellitus, but may also occur with pancreatic disorders, hyperthyroidism, and adrenocortical dysfunction. Decreased levels (hypoglycemia) result from insulin excess, prolonged starvation, or liver disease.

Diagnostic Criteria:
• Fasting Blood Sugar: < 100 mg/dL (Normal) | 100 - 125 mg/dL (Pre-Diabetes / IFG) | ≥ 126 mg/dL (Diabetes)
• Postprandial Blood Sugar: < 140 mg/dL (Normal) | 140 - 199 mg/dL (Pre-Diabetes / IGT) | ≥ 200 mg/dL (Diabetes)
• HbA1c: < 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | ≥ 6.5 % (Diabetes)

II. LIPID PROFILE IN DIABETES:
Abnormalities of lipids increase coronary artery disease (CAD) risk in diabetes. Typical diabetic dyslipidemia features high Triglycerides, low HDL-C, and elevated small dense LDL particles.
LAI Statin Initiation Guidelines (2020):
• Extreme / Very High Risk: LDL Goal < 50 mg/dL, Non-HDL Goal < 80 mg/dL
• High Risk: LDL Goal < 70 mg/dL, Non-HDL Goal < 100 mg/dL
• Moderate Risk: LDL Goal < 100 mg/dL, Non-HDL Goal < 130 mg/dL

III. RENAL FUNCTION (DIABETIC NEPHROPATHY SCREENING):
Serum Creatinine and Blood Urea assess glomerular filtration and renal clearance to detect early diabetic nephropathy.`,
        parameters: [
          {
            name: 'Fasting Blood Sugar',
            referenceRange: '70 - 100',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Blood Sugar PP',
            referenceRange: '< 180 mg/dl',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'HbA1c (Glycated Hemoglobin)',
            referenceRange: '< 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | >= 6.5 % (Diabetes)',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Estimated Average Glucose (eAG)',
            referenceRange: '70 - 126',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Total Cholesterol',
            referenceRange: '125 - 200',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Triglycerides',
            referenceRange: '25 - 200',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'HDL Cholesterol',
            referenceRange: '35 - 80',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'LDL Cholesterol',
            referenceRange: '85 - 130',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'VLDL Cholesterol',
            referenceRange: '5 - 40',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'LDL / HDL',
            referenceRange: '1.5 - 3.5',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Total Cholesterol / HDL',
            referenceRange: '3.5 - 5.0',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'TG / HDL',
            referenceRange: '< 3.0',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Non-HDL cholesterol',
            referenceRange: '< 130',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Urea',
            referenceRange: '19 - 45',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Creatinine',
            referenceRange: '0.72 - 1.18',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'DLC') {
      setReportForm({
        title: 'Differential Leucocyte Count (DLC)',
        test: 'DLC',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Microscopic and automated differential leukocyte count (DLC) evaluating proportions of neutrophils, lymphocytes, eosinophils, monocytes, and basophils.',
        interpretation: `Differential Leucocyte Count (DLC) Reference Ranges & Clinical Interpretation:

1. Neutrophils (40 - 80 %):
• Increased in: Infection (bacterial or early viral), acute stress, acute and chronic inflammation, tumors, drugs (eg, G-CSF), diabetic ketoacidosis, leukemia (rare).
• Decreased in: Aplastic anemia, drug-induced neutropenia, chemotherapy, folate or B12 deficiency, myelodysplasia, marrow infiltration, cyclic neutropenia, autoimmune/isoimmune neutropenia, Felty syndrome, hypersplenism, sepsis, viral marrow suppression, bone marrow failure syndromes.

2. Lymphocytes (20 - 40 %):
• Increased in: Viral infection (especially infectious mononucleosis, pertussis), thyrotoxicosis, adrenal insufficiency, lymphoid leukemia/lymphoma, chronic infection, drug and allergic reactions, autoimmune diseases.
• Decreased in: Immune deficiency syndromes (eg, HIV), idiopathic drugs.

3. Monocytes (2 - 10 %):
• Increased in: Inflammation, infection, malignancy, tuberculosis, myeloproliferative disorders (eg, CMML).
• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.

4. Eosinophils (1 - 6 %):
• Increased in: Allergic states, asthma, drug sensitivity reactions, skin disorders, parasitic and certain fungal infections, Churg-Strauss syndrome, polyarteritis nodosa, response to malignancy (eg, Hodgkin disease, T-cell lymphoma, adenocarcinoma), eosinophilic pneumonia, hypereosinophilic syndrome, leukemia (eg, chronic eosinophilic leukemia), myeloid/lymphoid neoplasms with PDGF/FGF receptor abnormalities, mastocytosis.
• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.

5. Basophils (< 2 %):
• Increased in: Hypersensitivity reactions, drugs, myeloproliferative disorders (eg, CML), basophilic or mast cell variant of acute/chronic leukemia, inflammatory reaction, certain infections, hypothyroidism.
• Decreased in: Not applicable.`,
        parameters: [
          {
            name: 'Neutrophils',
            referenceRange: '40 - 80',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Lymphocytes',
            referenceRange: '20 - 40',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Eosinophils',
            referenceRange: '1 - 6',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Monocytes',
            referenceRange: '2 - 10',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Basophils',
            referenceRange: '< 2',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'ESTRADIOL') {
      setReportForm({
        title: 'Estradiol (E2)',
        test: 'Estradiol',
        category: 'LAB',
        basePrice: 550,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of 17-beta Estradiol (E2) in serum to assess ovarian function, menstrual disorders, fertility, and menopausal status.',
        interpretation: `Biological Reference Intervals (pg/mL):
• Males (Adult): 11.3 - 43.2 pg/mL

• Females:
  - Follicular Phase: 12.5 - 166.0 pg/mL
  - Mid-Cycle Peak (Ovulatory): 85.8 - 498.0 pg/mL
  - Luteal Phase: 43.8 - 211.0 pg/mL
  - Postmenopausal: < 5.0 - 54.7 pg/mL
  - Oral Contraceptives: < 50 pg/mL

• Pre-pubertal Children:
  - Males: < 15 pg/mL
  - Females: < 20 pg/mL

Clinical Significance:
Estradiol (E2) is the most potent circulating natural estrogen. In females, it is primarily synthesized by maturing ovarian follicles and the corpus luteum under the stimulation of FSH and LH. In males, small amounts are produced by testes and peripheral aromatization in adipose tissue.

Elevated Levels:
• Estrogen-producing ovarian granulosa cell tumors, thecomas, testicular Leydig cell tumors, liver cirrhosis, precocious puberty, exogenous estrogen intake.

Decreased Levels:
• Premature ovarian failure (POF), menopause, Turner syndrome, hypopituitarism, hypothalamic dysfunction (Kallmann syndrome, severe anorexia nervosa, strenuous exercise).`,
        parameters: [
          {
            name: 'Estradiol',
            referenceRange: 'Males: 11.3 - 43.2 | Females: Follicular 12.5 - 166.0, Ovulatory 85.8 - 498.0, Luteal 43.8 - 211.0, Postmenopausal < 5.0 - 54.7',
            unit: 'pg/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FERRITIN') {
      setReportForm({
        title: 'Ferritin',
        test: 'Ferritin',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of Serum Ferritin to assess body iron stores, iron deficiency anemia, and iron overload conditions.',
        interpretation: `Interpretation:
Ferritin is iron storage protein. Determination of ferritin is necessary in Iron deficiency anemia, monitoring iron therapy, and in differential diagnosis of Anaemia.

Elevation levels-
Hemochromatosis, Porphyria, Rheumatoid arthritis, Leukaemia, Hodgkin's lymphoma, Liver disease, Multiple blood transfusion, Acute phase reactant, Increased in all inflammatory condition.

Decreased level-
Iron deficiency anemia.`,
        parameters: [
          {
            name: 'Ferritin',
            referenceRange: '22 - 332',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'EGFR') {
      setReportForm({
        title: 'Estimated Glomerular Filtration Rate (eGFR)',
        test: 'eGFR',
        category: 'LAB',
        basePrice: 250,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: 'Same Day',
        description: 'Quantitative calculation of Estimated Glomerular Filtration Rate (eGFR) using standardized equations based on serum creatinine, age, and sex for kidney function and CKD staging.',
        interpretation: `Clinical Significance:
Estimated Glomerular Filtration Rate (eGFR) is the premier metric used to evaluate renal function, detect acute kidney injury (AKI), diagnose Chronic Kidney Disease (CKD), and guide drug dosing. eGFR is calculated based on serum creatinine, age, and sex normalized to a standard body surface area (1.73 m²).

KDIGO CKD Staging Classification:
• Stage G1 (Normal / High): eGFR ≥ 90 mL/min/1.73m² (Normal if no kidney damage/albuminuria)
• Stage G2 (Mildly Decreased): eGFR 60 - 89 mL/min/1.73m²
• Stage G3a (Mild-to-Moderately Decreased): eGFR 45 - 59 mL/min/1.73m² (Diagnostic of CKD if sustained > 3 months)
• Stage G3b (Moderately-to-Severely Decreased): eGFR 30 - 44 mL/min/1.73m²
• Stage G4 (Severely Decreased): eGFR 15 - 29 mL/min/1.73m²
• Stage G5 (Kidney Failure / ESRD): eGFR < 15 mL/min/1.73m² (Dialysis/transplant needed)

Clinical Guidance:
1. Persistent eGFR < 60 mL/min/1.73m² for ≥ 3 months confirms Chronic Kidney Disease (CKD).
2. eGFR ≥ 60 mL/min/1.73m² without urine albuminuria does not constitute CKD.`,
        parameters: [
          {
            name: 'Creatinine',
            referenceRange: '0.72 - 1.18',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'eGFR',
            referenceRange: '> 90',
            unit: 'ml/min/1.73m^2',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'eGFR Category',
            referenceRange: 'Stage G1: Normal (>=90)',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Stage G1: Normal or high kidney function (≥ 90 mL/min/1.73m²)', isAbnormal: false },
              { value: 'Stage G2: Mildly decreased kidney function (60 - 89 mL/min/1.73m²)', isAbnormal: false },
              { value: 'Stage G3a: Mild-to-moderately decreased (45 - 59 mL/min/1.73m²)', isAbnormal: true },
              { value: 'Stage G3b: Moderately-to-severely decreased (30 - 44 mL/min/1.73m²)', isAbnormal: true },
              { value: 'Stage G4: Severely decreased kidney function (15 - 29 mL/min/1.73m²)', isAbnormal: true },
              { value: 'Stage G5: Kidney failure / End-stage renal disease (< 15 mL/min/1.73m²)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'DENGUE_NS1') {
      setReportForm({
        title: 'Dengue NS1 Antigen',
        test: 'Dengue NS1 Antigen',
        category: 'LAB',
        basePrice: 600,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Rapid immunochromatographic / ELISA test for early detection of Dengue Virus Non-Structural Protein 1 (NS1) antigen in serum during the acute febrile phase (Day 1 - 9).',
        interpretation: `Dengue virus, transmitted by Aedes mosquitoes, belongs to the Flavivirus genus and has four serotypes: DEN-1, DEN-2, DEN-3, and DEN-4. Immunity from one serotype is lifelong but does not protect against the others.

Dengue infection ranges from mild fever to severe, potentially fatal hemorrhagic disease. The WHO classifies dengue infections as primary or secondary. Secondary infections with different serotypes carry a higher risk of complications such as Dengue Hemorrhagic Fever (DHF) and Dengue Shock Syndrome (DSS).

Test Utility:
• Dengue NS1 antigen can be detected in serum from day 1 to day 9 after symptoms begin. Dengue-specific IgM antibodies appear as early as 5 days after fever starts and usually last 30-90 days, though they can occasionally be detectable for up to 8 months.
• IgM is also present in secondary and tertiary dengue infections, but often at lower and more transient levels. Dengue IgG levels typically rise by the end of the first week of a primary infection and can persist for months or even a lifetime.
• In primary dengue, patients are usually IgM positive and IgG negative with high IgM levels. In secondary infections, patients are often positive for both IgG and IgM, with higher IgG concentrations.

Confirmed diagnosis of Dengue fever can be established in a suspected case with at least one of the following tests:
1) Demonstration of NS1 antigen by ELISA / Rapid Card
2) Demonstration of IgM antibody titre by ELISA in single serum sample
3) IgG seroconversion in paired sera after 2 weeks with 4 fold rise in titre
4) Demonstration of viral nucleic acid by PCR

Limitations:
• Cross-reactivity due to other flavivirus infections (Tick-borne encephalitis, Japanese encephalitis etc) can give false positive dengue test.
• Differential diagnoses during the acute phase of illness should include measles, rubella, influenza, typhoid, leptospirosis, malaria, other viral hemorrhagic fevers, and any other disease that may present as a nonspecific viral syndrome.`,
        parameters: [
          {
            name: 'Dengue NS1 Antigen',
            referenceRange: 'Non-Reactive (Negative)',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive (Negative)', isAbnormal: false },
              { value: 'Reactive (Positive)', isAbnormal: true },
              { value: 'Equivocal / Borderline', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'DLC_LEUKEMIA') {
      setReportForm({
        title: 'DLC Leukemia',
        test: 'DLC Leukemia',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Specialized differential leukocyte count examining peripheral blood smear for abnormal immature myeloid/lymphoid precursors and blast cells.',
        interpretation: `Clinical Significance:
In healthy adult peripheral blood, immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes) and blast cells (myeloblasts, lymphoblasts) are normally absent (0%). Their presence in the peripheral circulation indicates severe left-shift, leukemoid reaction, or hematological malignancies such as acute/chronic leukemia or myeloproliferative neoplasms.

Reference Intervals:
• Immature / Band Forms: 0 % (Absent)
• Promyelocytes: 0 % (Absent)
• Myelocytes: 0 % (Absent)
• Blast Cells: 0 % (Absent)
• Meta Myelocytes: 0 % (Absent)

Diagnostic Indications:
1. Chronic Myeloid Leukemia (CML): Marked leukocytosis with complete granulocytic spectrum (myeloblasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with basophilia.
2. Acute Leukemias (AML / ALL): Presence of circulating blast cells (≥ 20% diagnostic of acute leukemia), cytopenias, and leukemic hiatus.
3. Leukemoid Reaction: Reactive left-shift up to myelocytes/metamyelocytes secondary to severe bacterial infection, tissue necrosis, or malignancy.
4. Myelodysplastic Syndromes (MDS): Dysplastic precursors or circulating blasts.`,
        parameters: [
          {
            name: 'Immature',
            referenceRange: '0',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Promyelocytes',
            referenceRange: '0',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Myelocytes',
            referenceRange: '0',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Blast Cells',
            referenceRange: '0',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Meta Myelocytes',
            referenceRange: '0',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'LIPID_PROFILE') {
      setReportForm({
        title: 'Lipid Profile',
        test: 'Lipid Profile',
        category: 'LAB',
        basePrice: 550,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Fasting 10-12 hrs)',
        turnaroundTime: 'Same Day',
        description: 'Comprehensive lipid panel evaluating Total Cholesterol, Triglycerides, HDL, LDL, VLDL, and cardiovascular atherogenic ratios.',
        interpretation: `Abnormalities of lipids are associated with increased risk of coronary artery disease (CAD) in patients with DM. This risk can be reduced by intensive treatment of lipid abnormalities. The usual pattern of lipid abnormalities in type 2 DM is elevated triglycerides, decreased HDL cholesterol and higher proportion of small, dense LDL particles. Cholesterol is a lipid found in all cell membranes and in blood plasma. It is an essential component of the cell membranes, and is necessary for synthesis of steroid hormones, and for the formation of bile acids. Cholesterol is synthesized by the liver and many other organs, and is also ingested in the diet. Triglycerides are lipids in which three long-chain fatty acids are attached to glycerol. They are present in dietary fat and also synthesized by liver and adipose tissue.

Newer treatment goals and statin initiation thresholds based on the risk categories proposed by Lipid Association of India in 2020:
• Extreme Risk Group Category A:
  - Treatment Goal: LDL-C < 50 mg/dl (Optional Goal <= 30), Non-HDL-C < 80 mg/dl (Optional Goal <= 60)
  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl
• Extreme Risk Group Category B:
  - Treatment Goal: LDL-C <= 30 mg/dl, Non-HDL-C <= 60 mg/dl
  - Consider Therapy: LDL-C > 30 mg/dl, Non-HDL-C > 60 mg/dl
• Very High Risk:
  - Treatment Goal: LDL-C < 50 mg/dl, Non-HDL-C < 80 mg/dl
  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl
• High Risk:
  - Treatment Goal: LDL-C < 70 mg/dl, Non-HDL-C < 100 mg/dl
  - Consider Therapy: LDL-C >= 70 mg/dl, Non-HDL-C >= 100 mg/dl
• Moderate Risk:
  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl
  - Consider Therapy: LDL-C >= 100 mg/dl, Non-HDL-C >= 130 mg/dl
• Low Risk:
  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl
  - Consider Therapy: LDL-C >= 130* mg/dl, Non-HDL-C >= 160* mg/dl
*In low risk patient, consider therapy after an initial non-pharmacological intervention for at least 3 months.`,
        parameters: [
          {
            name: 'Total Cholesterol',
            referenceRange: '125 - 200',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Triglycerides',
            referenceRange: '25 - 200',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'HDL Cholesterol',
            referenceRange: '35 - 80',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'LDL Cholesterol',
            referenceRange: '85 - 130',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'VLDL Cholesterol',
            referenceRange: '5 - 40',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'LDL / HDL',
            referenceRange: '1.5 - 3.5',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Total Cholesterol / HDL',
            referenceRange: '3.5 - 5.0',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'TG / HDL',
            referenceRange: '< 3.0',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Non-HDL cholesterol',
            referenceRange: '< 130',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HBEAG') {
      setReportForm({
        title: 'Hepatitis B Envelope Antigen (HBeAg)',
        test: 'HBeAg',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescent Microparticle Immunoassay (CMIA) / ELISA for qualitative and semi-quantitative detection of Hepatitis B "e" Antigen (HBeAg) in human serum to assess HBV replication and infectivity.',
        interpretation: `Physiological Basis:
HBeAg is a soluble protein secreted by HBV, related to HBcAg, indicating viral replication and infectivity. Two distinct serologic types of hepatitis B have been described, one with a positive HBeAg, and the other with a negative HBeAg and a positive anti-HBe antibody.

Interpretation:
Increased (positive) in: HBV (acute, chronic) hepatitis.

Comments:
The assumption has been that loss of HBeAg and accumulation of HBeAb are associated with decreased infectivity. Testing has proved unreliable, and tests are not routinely needed as indicators of infectivity. All patients positive for HBeAg must be considered infectious.`,
        parameters: [
          {
            name: 'HBeAg',
            referenceRange: '< 15 index/mL',
            unit: 'index/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HBSAG') {
      setReportForm({
        title: 'Hepatitis B Surface Antigen (HBsAg)',
        test: 'HBsAg',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Qualitative immunochromatographic rapid card / Chemiluminescence immunoassay (CLIA) for the detection of Hepatitis B Surface Antigen (HBsAg) in human serum/plasma.',
        interpretation: `Interpretation:
• Non-Reactive: Hepatitis B surface antigen absent.
• Reactive: Hepatitis B surface antigen present.

Presence of Hepatitis B antigen indicates reactive result which monitors HBsAg levels during the disease but cannot predict the stages of disease. Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.

Test Utility:
HBsAg is the first serologic marker appearing in the serum 6-16 weeks following hepatitis B viral infection. In a typical HBV infection, HBsAg will be detected 2-4 weeks before the liver enzyme levels (ALT) become abnormal and 3-5 weeks before the patient develops jaundice. In acute cases, HBsAg usually disappears 1-2 months after the onset of symptoms. Persistence of HBsAg for more than 6 months indicates the development of either a chronic carrier state or chronic liver disease. The presence of HBsAg is frequently associated with infectivity. HBsAg when accompanied by Hepatitis B e-antigen (HBeAg) and/or hepatitis B viral DNA almost always indicates high infectivity.`,
        parameters: [
          {
            name: 'HBsAg',
            referenceRange: 'Non-Reactive (Negative)',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive (Negative)', isAbnormal: false },
              { value: 'Reactive (Positive)', isAbnormal: true },
              { value: 'Equivocal / Borderline', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'HBSAG_ELISA') {
      setReportForm({
        title: 'HBsAg ELISA',
        test: 'HBsAg ELISA',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Enzyme-Linked Immunosorbent Assay (ELISA) for highly sensitive and specific detection of Hepatitis B Surface Antigen (HBsAg) in human serum/plasma.',
        interpretation: `Interpretation & Cut-off Criteria (ELISA):
• Non-Reactive (Negative): Signal-to-Cutoff Ratio (S/CO) < 0.90 Units. Hepatitis B surface antigen absent.
• Equivocal / Borderline: S/CO 0.90 - 1.10 Units. Retesting in duplicate or sample collected after 1-2 weeks recommended.
• Reactive (Positive): S/CO > 1.10 Units. Hepatitis B surface antigen detected, indicating active (acute or chronic) HBV infection.

Method: Enzyme-Linked Immunosorbent Assay (ELISA).

Clinical Significance:
HBsAg is the primary serological marker for diagnosing Hepatitis B Virus (HBV) infection. ELISA methodology provides high analytical sensitivity and specificity for qualitative/semi-quantitative detection.

Diagnostic Utility:
1. Acute Infection: HBsAg appears 2 to 8 weeks before clinical symptoms or liver enzyme elevation and persists throughout acute phase.
2. Chronic Infection: Persistence for > 6 months confirms chronic HBV infection / carrier state.
3. Infectivity Assessment: High correlation with viral replication. Follow-up testing with HBeAg, Anti-HBe, and HBV DNA PCR is recommended.`,
        parameters: [
          {
            name: 'HBsAg ELISA',
            referenceRange: 'Non-Reactive (< 0.90)',
            unit: 'Units',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive (Negative)', isAbnormal: false },
              { value: 'Reactive (Positive)', isAbnormal: true },
              { value: 'Borderline / Equivocal', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'HB_TLC_DLC') {
      setReportForm({
        title: 'Hemoglobin, TLC & DLC (HB, TLC, DLC)',
        test: 'HB,TLC,DLC',
        category: 'LAB',
        basePrice: 250,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Basic hematology profile evaluating Hemoglobin (Hb), Total Leukocyte Count (TLC), and 5-part Differential Leukocyte Count (DLC).',
        interpretation: `1. HEMOGLOBIN (Hb):
Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.
• Increased in: Hemoconcentration (dehydration, burns, vomiting), Polycythemia (erythrocytosis), Extreme physical exercise.
• Decreased in: Macrocytic anemia (liver disease, hypothyroidism, vitamin B12/folate deficiency, myelodysplasia), Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration), Microcytic anemia (iron deficiency, thalassemia), Hemodilution.
• Comments: Hypertriglyceridemia and marked leukocytosis can cause false elevations of Hb.

2. TOTAL LEUKOCYTE COUNT (TLC / WBC):
The WBC count determines the total number of circulating white blood cells.
• Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumors (paraneoplastic), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, corticosteroids, allergies, stress, smoking.
• Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (chemotherapy, radiation), myelodysplasia, collagen vascular diseases, hypersplenism, autoimmune neutropenia.

3. DIFFERENTIAL LEUCOCYTE COUNT (DLC):
• Neutrophils (40 - 80%): Increased in bacterial/viral infections, acute stress, inflammation, tissue necrosis, G-CSF, DKA, leukemia. Decreased in aplastic anemia, drug-induced neutropenia, chemotherapy, B12/folate deficiency, sepsis.
• Lymphocytes (20 - 40%): Increased in viral infections (infectious mononucleosis, pertussis), thyrotoxicosis, lymphoid leukemia/lymphoma. Decreased in immunodeficiency syndromes (HIV), immunosuppressive drugs.
• Monocytes (2 - 10%): Increased in inflammation, tuberculosis, malignancy, CMML. Decreased in overwhelming bacterial infection, hairy cell leukemia.
• Eosinophils (1 - 6%): Increased in allergic states, asthma, parasitic/fungal infections, Churg-Strauss, hypereosinophilic syndrome. Decreased in acute stress, overwhelming infection.
• Basophils (< 2%): Increased in hypersensitivity reactions, CML, myeloproliferative disorders, hypothyroidism.`,
        parameters: [
          {
            name: 'Hemoglobin',
            referenceRange: '13 - 17',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Total Leukocyte Count',
            referenceRange: '4,800 - 10,800',
            unit: 'cumm',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Neutrophils',
            referenceRange: '40 - 80',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Lymphocytes',
            referenceRange: '20 - 40',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Eosinophils',
            referenceRange: '1 - 6',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Monocytes',
            referenceRange: '2 - 10',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Basophils',
            referenceRange: '< 2',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'ESR') {
      setReportForm({
        title: 'Erythrocyte Sedimentation Rate (Wintrobe)',
        test: 'ESR',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA / Citrate)',
        turnaroundTime: 'Same Day',
        description: 'Measurement of the rate at which red blood cells sediment in a period of 1 hour by Wintrobe method to evaluate systemic inflammation.',
        interpretation: `Interpretation:

Raised ESR can be found in:
1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)
2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)
3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)
4. Malignancy (e.g., lymphoma, breast or colon cancer)
5. Pregnancy
6. Oral contraceptive pill users
7. Obesity can cause a moderately raised ESR

Low ESR is found in:
1. Heart failure
2. Cachexia
3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)
4. Microcytosis
5. Hypofibrinogenemia (e.g., DIC)
6. Massive hepatic necrosis
7. High white cell count (extreme leukocytosis)
8. Treatment with steroids

NB: Very high (> 100 mm/hr) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis). A false high ESR can occur if the ambient temperature is unusually high or if the tube is tilted.`,
        parameters: [
          {
            name: 'Erythrocyte Sedimentation Rate (Wintrobe)',
            referenceRange: '0 - 9',
            unit: 'mm for 1st hour',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HCV_RNA_QUANT') {
      setReportForm({
        title: 'HCV RNA Quantitative (Real-Time PCR)',
        test: 'HCV RNA Quantitative',
        category: 'LAB',
        basePrice: 2800,
        taxPercentage: 0,
        sampleType: 'EDTA Plasma / Serum',
        turnaroundTime: '24 - 48 Hours',
        description: 'Quantitative measurement of Hepatitis C Viral RNA (viral load) using Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).',
        interpretation: `Methodology: Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).

Analytical Parameters:
• Limit of Detection (LOD): 15 IU/mL
• Linear Dynamic Range: 15 to 100,000,000 IU/mL (1.18 to 8.00 log10 IU/mL)

Clinical Interpretation:
1. Target Not Detected (< 15 IU/mL): HCV RNA is not detected in the specimen. Does not exclude infection below the detection limit.
2. Target Detected (< 15 IU/mL): HCV RNA is detected below the lower limit of quantification (LLoQ).
3. Target Detected (> 15 IU/mL): Active HCV viral replication confirmed with quantitative viral load in IU/mL.

Clinical Applications:
• Diagnosis of active Hepatitis C Virus (HCV) infection.
• Baseline viral load quantification prior to Direct-Acting Antiviral (DAA) therapy.
• Assessment of Sustained Virological Response (SVR12 / SVR24) post-treatment completion.`,
        parameters: [
          {
            name: 'Sample Type',
            referenceRange: 'EDTA Plasma / Serum',
            unit: 'Units',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'EDTA Plasma', isAbnormal: false },
              { value: 'Serum', isAbnormal: false }
            ]
          },
          {
            name: 'HCV RNA',
            referenceRange: 'Target Not Detected (< 15 IU/mL)',
            unit: 'IU/mL',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Target Not Detected (< 15 IU/mL)', isAbnormal: false },
              { value: 'Target Detected (< 15 IU/mL)', isAbnormal: true },
              { value: 'Detected (See Viral Load Value)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'HDL_CHOLESTEROL') {
      setReportForm({
        title: 'HDL Cholesterol',
        test: 'HDL Cholesterol',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Fasting 10-12 hrs)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative determination of High-Density Lipoprotein Cholesterol (HDL-C) in human serum to assess anti-atherogenic capacity and coronary heart disease risk.',
        interpretation: `Clinical Significance & Interpretation:
High-Density Lipoprotein (HDL) cholesterol, often referred to as "good cholesterol", plays a key role in reverse cholesterol transport by transporting excess cholesterol from peripheral tissues and vascular endothelium back to the liver for excretion in bile.

Reference Risk Stratification (NCEP ATP III / LAI Guidelines):
• < 40 mg/dl (Males) / < 50 mg/dl (Females): Low HDL-C (Major risk factor for Coronary Artery Disease / Atherosclerosis).
• 40 - 59 mg/dl: Moderate / Borderline level.
• ≥ 60 mg/dl: High HDL-C (Cardioprotective / Negative risk factor for heart disease).

Causes of Decreased HDL Cholesterol (< 40 mg/dl):
• Metabolic syndrome, Type 2 Diabetes Mellitus, insulin resistance.
• Sedentary lifestyle, obesity, cigarette smoking.
• High triglyceride levels (Hypertriglyceridemia).
• Drugs: Beta-blockers, anabolic steroids, progestins.
• Genetic dyslipidemias (Tangier disease, familial hypoalphalipoproteinemia).

Causes of Elevated HDL Cholesterol (> 80 mg/dl):
• Regular aerobic exercise, moderate alcohol intake, estrogen replacement therapy.
• Familial hyperalphalipoproteinemia, CETP gene mutations.`,
        parameters: [
          {
            name: 'HDL Cholesterol',
            referenceRange: '35 - 80',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HSV_1_2_IGM') {
      setReportForm({
        title: 'Herpes Simplex Virus 1/2 IgM (HSV-1/2 IgM)',
        test: 'HSV-1/2 IgM',
        category: 'LAB',
        basePrice: 750,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescence Immunoassay (CLIA) / ELISA for the qualitative and semi-quantitative detection of IgM antibodies to Herpes Simplex Virus Types 1 and 2.',
        interpretation: `Interpretation Criteria (CLIA / ELISA):
• Negative (< 2.0 AU/mL): No detectable HSV-1/2 IgM antibodies. Indicates no evidence of recent primary HSV-1 or HSV-2 infection.
• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.
• Positive (≥ 4.0 AU/mL): Detectable HSV-1/2 IgM antibodies. Suggests acute, recent primary infection or reactivation of Herpes Simplex Virus.

Clinical Utility:
Herpes Simplex Virus Type 1 (HSV-1) primarily causes orofacial herpes (cold sores) and gingivostomatitis, while HSV-2 primarily causes genital herpes. However, both strains can infect either site.

Diagnostic Considerations:
1. IgM antibodies appear within the first 1 to 2 weeks post-infection and may persist for several months.
2. Cross-reactivity between HSV-1 and HSV-2 IgM antibodies is common; type-specific IgG testing (Glycoprotein G-based HSV-1 IgG / HSV-2 IgG) or Real-Time PCR on vesicular lesions is recommended for definitive typing.`,
        parameters: [
          {
            name: 'HSV-1/2 IgM',
            referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2 - 4 AU/mL\nPos. >= 4 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'HSV_2_IGG') {
      setReportForm({
        title: 'Herpes Simplex Virus 2 IgG (HSV-2 IgG)',
        test: 'HSV-2 IgG',
        category: 'LAB',
        basePrice: 750,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: 'Same Day',
        description: 'Type-specific Chemiluminescence Immunoassay (CLIA) / ELISA for the qualitative and semi-quantitative detection of IgG antibodies to Herpes Simplex Virus Type 2 (gG-2).',
        interpretation: `Interpretation Criteria (CLIA / ELISA):
• Negative (< 2.0 AU/mL): No detectable HSV-2 specific IgG antibodies. Indicates lack of prior exposure or infection with Herpes Simplex Virus Type 2.
• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.
• Positive (≥ 4.0 AU/mL): Detectable HSV-2 IgG antibodies. Indicates prior exposure, past infection, or latent infection with Herpes Simplex Virus Type 2.

Clinical Significance:
HSV-2 is the primary cause of genital herpes infections and neonatal herpes (via perinatal transmission). Type-specific serologic assays utilize recombinant Glycoprotein G-2 (gG-2) to distinguish HSV-2 antibodies specifically from HSV-1 antibodies without antigenic cross-reactivity.

Diagnostic Notes:
1. Seroconversion: Specific IgG antibodies generally develop 2 to 12 weeks after primary infection and persist indefinitely.
2. Positive IgG confirms past or chronic/latent infection but does not determine the exact timing of acquisition or active shedding.`,
        parameters: [
          {
            name: 'HSV-2 IgG',
            referenceRange: '< 2.0 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'DIALYSIS_PACKAGE') {
      setReportForm({
        title: 'Dialysis Package / Profile',
        test: 'Dialysis Package',
        category: 'LAB',
        basePrice: 1200,
        taxPercentage: 0,
        sampleType: 'Blood Serum & Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Comprehensive multi-parameter dialysis monitoring panel assessing renal function, small solute clearance, fluid-electrolyte balance, acid-base status, mineral metabolism (CKD-MBD), nutritional protein markers, and hematocrit.',
        interpretation: `Clinical Significance & Dialysis Adequacy Guidelines (KDOQI / KDIGO):

1. Dialysis Adequacy & Clearance:
• Urea Reduction Ratio (URR): Target ≥ 65% per hemodialysis session (equivalent to single-pool Kt/V ≥ 1.2 for thrice-weekly HD). Inadequate clearance is associated with increased uremic toxicity, morbidity, and hospitalizations.
• Serum Creatinine: Reflects residual kidney function, lean muscle mass, and dietary protein intake in ESRD patients.

2. Fluid & Electrolyte Homeostasis:
• Potassium (K+): Predialysis target 4.0 – 5.5 mEq/L. Hyperkalemia (> 6.0 mEq/L) carries high risk for life-threatening cardiac arrhythmias; postdialysis hypokalemia (< 3.5 mEq/L) must also be avoided.
• Sodium (Na+) & Chloride: Interdialytic sodium and fluid overload contribute to hypertension and intradialytic hypotension/pulmonary congestion.
• Bicarbonate (HCO3-): Predialysis target ≥ 22 mEq/L. Chronic metabolic acidosis exacerbates muscle wasting, protein catabolism, and bone resorption.

3. Chronic Kidney Disease - Mineral and Bone Disorder (CKD-MBD):
• Phosphorus: Target 3.5 – 5.5 mg/dl in ESRD. Hyperphosphatemia drives vascular calcification, secondary hyperparathyroidism, and cardiovascular mortality.
• Calcium: Corrected calcium target 8.4 – 9.5 mg/dl to prevent calcium-phosphorus precipitation (Ca x P < 55 mg²/dl²).

4. Nutritional Status & Anemia Management:
• Serum Albumin: Target ≥ 4.0 g/dl. Serum albumin is a powerful prognostic marker of protein-energy wasting (PEW) and systemic inflammation in dialysis cohorts.
• Hemoglobin (Hb): Target 10.0 – 11.5 g/dl for patients receiving Erythropoiesis-Stimulating Agents (ESAs) and iron supplementation. Avoid Hb > 13.0 g/dl due to increased thrombotic/stroke risks.`,
        parameters: [
          {
            name: 'Urea (Pre-Dialysis)',
            referenceRange: '15 - 40',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Creatinine (Pre-Dialysis)',
            referenceRange: '0.6 - 1.2',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Sodium (Na+)',
            referenceRange: '135 - 145',
            unit: 'mEq/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Potassium (K+)',
            referenceRange: '3.5 - 5.1',
            unit: 'mEq/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Chloride (Cl-)',
            referenceRange: '96 - 106',
            unit: 'mEq/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Bicarbonate (HCO3-)',
            referenceRange: '22 - 29',
            unit: 'mEq/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Calcium',
            referenceRange: '8.8 - 10.2',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Phosphorus',
            referenceRange: '2.5 - 4.5',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Total Protein',
            referenceRange: '6.4 - 8.3',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Albumin',
            referenceRange: '3.5 - 5.0',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Globulin',
            referenceRange: '2.0 - 3.5',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'A / G Ratio',
            referenceRange: '1.2 - 2.0',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Hemoglobin (Hb)',
            referenceRange: '11.0 - 16.0',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Urea Reduction Ratio (URR)',
            referenceRange: '> 65',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'ELECTROLYTES_PANEL') {
      setReportForm({
        title: 'Electrolytes Panel (Serum Na, K, Cl, Ca, iCa)',
        test: 'Electrolytes Panel',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Heparinized Plasma',
        turnaroundTime: 'Same Day',
        description: 'Comprehensive electrolyte profile determining Serum Sodium, Potassium, Chloride, Total Calcium, and Ionized Calcium (iCalcium) for fluid, electrolyte, and acid-base assessment.',
        interpretation: `Clinical Significance:
Electrolytes are essential minerals present in body fluids that carry an electric charge and regulate nerve/muscle function, acid-base equilibrium, hydration, and cellular osmotic pressure.

1. Serum Sodium (Na+):
• Major extracellular cation maintaining plasma osmolality and extracellular volume.
• Hyponatremia (< 136 mmol/L): SIADH, congestive heart failure, cirrhosis, nephrotic syndrome, diuretic therapy, vomiting, diarrhea, adrenal insufficiency.
• Hypernatremia (> 146 mmol/L): Dehydration, diabetes insipidus, excessive salt intake, osmotic diuresis.

2. Serum Potassium (K+):
• Major intracellular cation critical for cardiac neuromuscular excitability and rhythm.
• Hypokalemia (< 3.5 mmol/L): Diuretics, vomiting, diarrhea, hyperaldosteronism, alkalosis.
• Hyperkalemia (> 5.1 mmol/L): Acute/chronic renal failure, potassium-sparing diuretics, ACE inhibitors/ARBs, Addison's disease, severe tissue trauma/rhabdomyolysis, metabolic acidosis.

3. Serum Chloride (Cl-):
• Major extracellular anion involved in maintaining acid-base balance and electroneutrality.
• Alterations frequently parallel sodium abnormalities and acid-base disturbances (anion gap calculation).

4. Serum Total & Ionized Calcium (Ca2+ / iCalcium):
• Ionized Calcium (iCalcium) is the physiologically active, unbound fraction of serum calcium essential for cardiac contractility, neuromuscular transmission, enzyme activation, and blood coagulation.
• Hypocalcemia / Low iCalcium: Hypoparathyroidism, vitamin D deficiency, renal failure, acute pancreatitis, critical illness/sepsis, alkalosis.
• Hypercalcemia / Elevated iCalcium: Primary hyperparathyroidism, malignancies (osteolytic metastases, PTHrP production), granulomatous diseases (sarcoidosis, TB), hypervitaminosis D.`,
        parameters: [
          {
            name: 'Serum Sodium',
            referenceRange: '136 - 146',
            unit: 'mmol/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Potassium',
            referenceRange: '3.5 - 5.1',
            unit: 'mmol/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Chloride',
            referenceRange: '98 - 107',
            unit: 'mmol/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Calcium',
            referenceRange: '8.8 - 10.6',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'iCalcium',
            referenceRange: '1.13 - 1.33',
            unit: 'mmol/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'ESR_WESTERGREN') {
      setReportForm({
        title: 'Erythrocyte sedimentation rate (Westergren)',
        test: 'ESR(Westergren)',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Whole Blood (Sodium Citrate / EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Gold-standard measurement of Erythrocyte Sedimentation Rate by the International Council for Standardization in Haematology (ICSH) Westergren method for assessing acute phase response and systemic inflammation.',
        interpretation: `Interpretation:

Raised ESR can be found in:
1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)
2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)
3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)
4. Malignancy (e.g., lymphoma, breast or colon cancer)
5. Pregnancy
6. Oral contraceptive pill users
7. Obesity can cause a moderately raised ESR

Low ESR is found in:
1. Heart failure
2. Cachexia
3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)
4. Microcytosis
5. Hypofibrinogenemia (e.g., DIC)
6. Massive hepatic necrosis
7. High white cell count (extreme leukocytosis)
8. Treatment with steroids

NB: Very high (> 100 mm/1st hour) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis, temporal arteritis). A false high ESR can occur if the ambient temperature is unusually high or if the sedimentation tube is not strictly vertical.`,
        parameters: [
          {
            name: 'Erythrocyte sedimentation rate (Westergren)',
            referenceRange: '0 - 10',
            unit: 'mm for 1st hour',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'ESR_WINTROBE') {
      setReportForm({
        title: 'Erythrocyte Sedimentation Rate (Wintrobe)',
        test: 'ESR(Wintrobe)',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA / Sodium Citrate)',
        turnaroundTime: 'Same Day',
        description: 'Measurement of the rate at which red blood cells sediment in a period of 1 hour by Wintrobe method to evaluate systemic inflammation.',
        interpretation: `Interpretation:

Raised ESR can be found in:
1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)
2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)
3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)
4. Malignancy (e.g., lymphoma, breast or colon cancer)
5. Pregnancy
6. Oral contraceptive pill users
7. Obesity can cause a moderately raised ESR

Low ESR is found in:
1. Heart failure
2. Cachexia
3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)
4. Microcytosis
5. Hypofibrinogenemia (e.g., DIC)
6. Massive hepatic necrosis
7. High white cell count (extreme leukocytosis)
8. Treatment with steroids

NB: Very high (> 100 mm/1st hour) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis, temporal arteritis). A false high ESR can occur if the ambient temperature is unusually high or if the sedimentation tube is not strictly vertical.`,
        parameters: [
          {
            name: 'Erythrocyte Sedimentation Rate (Wintrobe)',
            referenceRange: '0 - 9',
            unit: 'mm for 1st hour',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FLUID_EXAMINATION') {
      setReportForm({
        title: 'Fluid Examination (Physical, Chemical & Microscopic)',
        test: 'Fluid Examination',
        category: 'LAB',
        basePrice: 500,
        taxPercentage: 0,
        sampleType: 'Body Fluid (Pleural / Ascitic / Synovial / Pericardial / CSF)',
        turnaroundTime: 'Same Day',
        description: 'Comprehensive physical, chemical, and microscopic examination of serous body fluids (Pleural, Ascitic, Peritoneal, Synovial, Pericardial) for transudate vs. exudate differentiation, infection, and cellularity.',
        interpretation: `Clinical Significance & Interpretation:
Body fluid examination (Ascitic, Pleural, Peritoneal, Pericardial, Synovial) is crucial for differentiating transudative effusions from exudative effusions.

1. Transudate vs. Exudate Differentiation (Light's Criteria):
• Transudative Fluid: Non-inflammatory effusion caused by hydrostatic pressure imbalance or decreased plasma oncotic pressure (e.g., Congestive Heart Failure, Cirrhosis, Nephrotic Syndrome, Malnutrition).
  - Appearance: Clear, straw-colored, no coagulum.
  - Protein: < 3.0 g/dl (< 3000 mg%), Fluid/Serum Protein ratio < 0.5.
  - Glucose: Equivalent to serum glucose (> 60 mg%).
  - Total Leukocyte Count (TLC): < 1,000 cells/cumm with predominantly mononuclear / lymphocytes.
  - Specific Gravity: < 1.015.

• Exudative Fluid: Inflammatory or malignant effusion caused by increased vascular permeability or impaired lymphatic drainage (e.g., Bacterial Pneumonia/Parapneumonic, Tuberculosis, Malignancy, Pulmonary Embolism, Pancreatitis).
  - Appearance: Turbid, cloudy, hemorrhagic, or purulent; may form spontaneous fibrinous coagulum.
  - Protein: ≥ 3.0 g/dl (≥ 3000 mg%), Fluid/Serum Protein ratio > 0.5.
  - Glucose: Often decreased (< 60 mg%), especially in bacterial empyema, TB, or rheumatoid effusion.
  - Total Leukocyte Count (TLC): ≥ 1,000 cells/cumm (often > 10,000 in acute bacterial infection).
  - Differential: Neutrophil predominance (> 50%) indicates acute bacterial infection; Lymphocyte predominance (> 50%) suggests Tuberculosis, chronic inflammation, or malignancy.

2. Diagnostic Notes:
• Hemorrhagic fluid: May indicate malignancy, pulmonary infarction, trauma, or traumatic tap.
• Presence of atypical cells requires cytopathological examination (cell block / Papanicolaou staining).`,
        parameters: [
          {
            name: 'Sample Type',
            referenceRange: 'Pleural / Ascitic / Synovial / Pericardial / CSF',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Pleural Fluid', isAbnormal: false },
              { value: 'Ascitic / Peritoneal Fluid', isAbnormal: false },
              { value: 'Synovial Fluid', isAbnormal: false },
              { value: 'Pericardial Fluid', isAbnormal: false },
              { value: 'Cerebrospinal Fluid (CSF)', isAbnormal: false },
              { value: 'Cystic Fluid', isAbnormal: false }
            ]
          },
          {
            name: 'Coagulum',
            referenceRange: 'Absent',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Absent / No Clot Formed', isAbnormal: false },
              { value: 'Present (Cobweb / Fibrinous Coagulum)', isAbnormal: true },
              { value: 'Fine Coagulum', isAbnormal: true },
              { value: 'Gross Clot Formed', isAbnormal: true }
            ]
          },
          {
            name: 'Volume',
            referenceRange: '',
            unit: 'ml',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Appearance',
            referenceRange: 'Clear',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Clear / Transparent', isAbnormal: false },
              { value: 'Slightly Hazy / Opalescent', isAbnormal: true },
              { value: 'Turbid / Cloudy', isAbnormal: true },
              { value: 'Purulent', isAbnormal: true },
              { value: 'Hemorrhagic / Sanguinous', isAbnormal: true },
              { value: 'Milky / Chylous', isAbnormal: true }
            ]
          },
          {
            name: 'Colour',
            referenceRange: 'Pale Yellow',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Pale Yellow / Straw', isAbnormal: false },
              { value: 'Yellow', isAbnormal: false },
              { value: 'Amber', isAbnormal: false },
              { value: 'Reddish / Hemorrhagic', isAbnormal: true },
              { value: 'Brownish / Dark', isAbnormal: true },
              { value: 'Turbid White', isAbnormal: true }
            ]
          },
          {
            name: 'pH (Reaction)',
            referenceRange: '7.35 - 7.45',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Alkaline (7.35 - 7.45)', isAbnormal: false },
              { value: 'Acidic (< 7.30)', isAbnormal: true },
              { value: 'Neutral (7.0 - 7.3)', isAbnormal: false }
            ]
          },
          {
            name: 'Protein',
            referenceRange: 'Transudate < 3000 mg% | Exudate >= 3000 mg%',
            unit: 'mg%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Glucose',
            referenceRange: '60 - 100',
            unit: 'mg%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Total Leukocyte Count',
            referenceRange: 'Transudate < 1000 cumm | Exudate >= 1000 cumm',
            unit: 'cumm',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Neutrophils',
            referenceRange: '< 50',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Lymphocyte',
            referenceRange: '> 50',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'RBCs',
            referenceRange: 'Nil / Occasional',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Nil / Absent', isAbnormal: false },
              { value: 'Occasional (0 - 5 / HPF)', isAbnormal: false },
              { value: 'Plenty / Numerous', isAbnormal: true },
              { value: 'Heavily Hemorrhagic', isAbnormal: true }
            ]
          },
          {
            name: 'Others (Optional)',
            referenceRange: 'Nil',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'No atypical or malignant cells seen', isAbnormal: false },
              { value: 'Mesothelial cells present', isAbnormal: false },
              { value: 'Atypical / Malignant cells noted (Advise Cytology / Cell Block)', isAbnormal: true },
              { value: 'Gram stain / AFB negative', isAbnormal: false }
            ]
          }
        ]
      });
    } else if (presetType === 'FNAC') {
      setReportForm({
        title: 'FNAC (Fine Needle Aspiration)',
        test: 'FNAC',
        category: 'LAB',
        basePrice: 850,
        taxPercentage: 0,
        sampleType: 'Aspirate Smear (Fine Needle Aspiration Cytology)',
        turnaroundTime: '24 - 48 Hours',
        description: 'Cytopathological evaluation of fine needle aspirates from palpable and non-palpable lesions (Thyroid, Breast, Lymph nodes, Salivary glands, Soft tissue) to diagnose benign, inflammatory, and malignant pathologies.',
        interpretation: `FNAC Reporting Protocol & Cytological Guidelines:

1. Specimen Adequacy Criteria:
• Adequate / Satisfactory for evaluation: Presence of sufficient diagnostic cellular material with well-preserved cytomorphological details.
• Unsatisfactory / Inadequate: Scanty cellularity, excessive blood/crush artifact, or drying artifacts precluding definitive cytological evaluation (repeat aspiration recommended).

2. General Diagnostic Categorization:
• Category I (Unsatisfactory / Non-diagnostic): Insufficient diagnostic cells.
• Category II (Benign / Negative for Malignancy): Inflammatory, reactive, hyperplastic, or typical benign cytological features.
• Category III (Atypia of Undetermined Significance / AUS): Cytological atypia insufficient to diagnose neoplasm or malignancy.
• Category IV (Suspicious for Neoplasm / Follicular Neoplasm): Cellular features suggestive of neoplasm.
• Category V (Suspicious for Malignancy): Marked cellular and nuclear atypia strongly suggestive of malignancy.
• Category VI (Malignant / Positive for Malignancy): Definitive cytological criteria of carcinoma, lymphoma, melanoma, or sarcoma.

3. Clinical & Histopathological Correlation:
FNAC is a rapid and highly accurate screening/diagnostic cytological modality. Histopathological examination (core needle biopsy or surgical excision) is recommended for definitive histological typing, grading, surgical margin assessment, and immunohistochemistry (IHC) profiling.`,
        parameters: [
          {
            name: 'SPECIMEN',
            referenceRange: 'As indicated',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'FNAC - Thyroid Gland', isAbnormal: false },
              { value: 'FNAC - Breast Lump / Mass', isAbnormal: false },
              { value: 'FNAC - Lymph Node (Cervical / Axillary / Inguinal)', isAbnormal: false },
              { value: 'FNAC - Salivary Gland (Parotid / Submandibular)', isAbnormal: false },
              { value: 'FNAC - Soft Tissue Swelling / Subcutaneous Nodule', isAbnormal: false },
              { value: 'FNAC - Testicular / Epididymal Swelling', isAbnormal: false }
            ]
          },
          {
            name: 'MICROSCOPIC EXAMINATION',
            referenceRange: 'Descriptive cytomorphological evaluation',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'IMPRESSION',
            referenceRange: 'Cytological Impression',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Category II: Negative for Malignant Cells (Benign Cytology)', isAbnormal: false },
              { value: 'Category I: Unsatisfactory / Inadequate Smear (Scanty Cellularity)', isAbnormal: true },
              { value: 'Category III: Atypia of Undetermined Significance (AUS)', isAbnormal: true },
              { value: 'Category IV: Follicular Neoplasm / Suspicious for Neoplasm', isAbnormal: true },
              { value: 'Category V: Suspicious for Malignancy', isAbnormal: true },
              { value: 'Category VI: Malignant (Positive for Malignancy)', isAbnormal: true }
            ]
          },
          {
            name: 'NOTE',
            referenceRange: 'Histopathological correlation advised',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Histopathological examination & tissue biopsy is advised for definitive histological grading and staging.', isAbnormal: false },
              { value: 'Repeat aspiration under ultrasound guidance or core needle biopsy recommended if clinical suspicion persists.', isAbnormal: false },
              { value: 'Clinical and radiological (USG/Mammography/CT) correlation recommended.', isAbnormal: false }
            ]
          }
        ]
      });
    } else if (presetType === 'DIRECT_COOMBS_TEST') {
      setReportForm({
        title: "Direct Coomb's Test (DAT - Direct Antiglobulin Test)",
        test: 'Direct Coombs Test',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA / Heparin / Clotted Cord Blood)',
        turnaroundTime: 'Same Day',
        description: 'Hemagglutination assay (Direct Antiglobulin Test / DAT) to detect in vivo sensitization of erythrocytes with antibodies (IgG) and/or complement components (C3d).',
        interpretation: `Clinical Significance & Interpretation:
The Direct Antiglobulin Test (DAT / Direct Coombs Test) detects in vivo coating of red blood cells with immunoglobulins (IgG) and/or complement components (C3d).

1. Negative Result:
• Indicates the absence of detectable cell-bound IgG antibodies or complement on the patient's red blood cells.

2. Positive Result (Graded 1+ to 4+):
A positive DAT indicates in vivo sensitization of erythrocytes and is observed in:
• Autoimmune Hemolytic Anemia (AIHA):
  - Warm Antibody AIHA (predominantly IgG ± C3d, often idiopathic, SLE, CLL, lymphoma)
  - Cold Agglutinin Disease / Cold AIHA (predominantly C3d, Mycoplasma pneumoniae, EBV, lymphoproliferative disorders)
  - Paroxysmal Cold Hemoglobinuria (PCH / Donath-Landsteiner antibody)
• Hemolytic Disease of the Fetus and Newborn (HDFN):
  - Maternal IgG antibodies (Anti-D, Anti-c, Anti-Kell, ABO incompatibility) crossing placenta and coating fetal RBCs.
• Immune-Mediated Hemolytic Transfusion Reactions (Acute or Delayed):
  - Recipient antibodies coating transfused incompatible donor RBCs.
• Drug-Induced Immune Hemolytic Anemia (DIIHA):
  - Drugs such as Cephalosporins (Ceftriaxone), Penicillins, Methyldopa, Quinidine, NSAIDs acting via drug-adsorption, immune complex, or autoantibody mechanisms.

Diagnostic Notes:
1. A positive DAT must always be interpreted in conjunction with clinical findings, reticulocyte count, serum LDH, indirect bilirubin, and serum haptoglobin levels.
2. In cases of a positive polyspecific DAT, monospecific anti-IgG and anti-C3d testing with eluate evaluation is recommended.`,
        parameters: [
          {
            name: "Direct Coomb's Test",
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (No Agglutination)', isAbnormal: false },
              { value: 'Positive 1+ (Weak Agglutination)', isAbnormal: true },
              { value: 'Positive 2+ (Moderate Agglutination)', isAbnormal: true },
              { value: 'Positive 3+ (Strong Agglutination)', isAbnormal: true },
              { value: 'Positive 4+ (Solid Agglutination Clump)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'DLC_3_PARTS') {
      setReportForm({
        title: 'Differential Leucocyte Count, 3-Part (DLC 3 Parts)',
        test: 'DLC 3 Parts',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Automated 3-part differential leukocyte count measuring absolute numbers and relative percentages of Granulocytes, Lymphocytes, and Mid-sized cells (Monocytes, Eosinophils, Basophils).',
        interpretation: `Clinical Significance of 3-Part Differential:
Automated 3-part hematology analyzers classify circulating leukocytes into three distinct volumetric cell clusters:

1. Granulocytes (Gran # / Gran %):
• Primarily comprises segmented neutrophils, band forms, eosinophils, and basophils.
• Granulocytosis (Elevated Gran # / Gran %): Acute bacterial infections, systemic inflammation, tissue necrosis, metabolic intoxications (uremia, DKA), acute hemorrhage, corticosteroid therapy, myeloproliferative disorders.
• Granulocytopenia (Decreased Gran # / Gran %): Bone marrow suppression (chemotherapy, radiation), severe overwhelming sepsis, aplastic anemia, drug-induced agranulocytosis.

2. Lymphocytes (Lym # / Lym %):
• Represents circulating T-cells, B-cells, and natural killer (NK) cells.
• Lymphocytosis (Elevated Lym # / Lym %): Acute viral infections (infectious mononucleosis, CMV, viral hepatitis), pertussis, chronic lymphocytic leukemia (CLL), autoimmune conditions.
• Lymphopenia (Decreased Lym # / Lym %): Acute stress, advanced HIV/AIDS, immunosuppressive therapy, systemic lupus erythematosus (SLE), radiation exposure.

3. Mid-Sized Cells (Mid # / Mid % - Monocytes, Eosinophils & Basophils):
• Encompasses monocytes, eosinophils, basophils, and precursor cells of intermediate size.
• Elevated Mid-Cell Fraction: Chronic inflammatory conditions, tuberculosis, allergic reactions/asthma, parasitic infestations, convalescent stage of acute infections, myelomonocytic neoplasms (CMML).`,
        parameters: [
          {
            name: 'Gran #',
            referenceRange: '2 - 7',
            unit: 'x10^3/µL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Lym #',
            referenceRange: '1 - 3',
            unit: 'x10^3/µL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Mid #',
            referenceRange: '0.2 - 1.2',
            unit: 'x10^3/µL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Gran %',
            referenceRange: '40 - 75',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Lym %',
            referenceRange: '20 - 40',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Mid %',
            referenceRange: '2 - 10',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'DOUBLE_MARKER') {
      setReportForm({
        title: 'Double Marker, Maternal Screen - 2 tests',
        test: 'Double Marker, Maternal Screen - 2 tests',
        category: 'LAB',
        basePrice: 2200,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: '24 - 48 Hours',
        description: 'First trimester maternal serum biochemical screening assay measuring Pregnancy-Associated Plasma Protein-A (PAPP-A) and Free Beta hCG to assess fetal risk for Trisomies 21 (Down syndrome), 18 (Edwards syndrome), and 13 (Patau syndrome).',
        interpretation: `Clinical Significance & Interpretation (First Trimester Maternal Screen / Double Marker):
The Double Marker Test is a prenatal screening tool performed between 11 weeks 0 days and 13 weeks 6 days of gestation (Crown-Rump Length CRL 45 to 84 mm) to assess the statistical risk of fetal chromosomal aneuploidies:
• Trisomy 21 (Down Syndrome)
• Trisomy 18 (Edwards Syndrome)
• Trisomy 13 (Patau Syndrome)

1. Biochemical Markers Measured:
• Pregnancy-Associated Plasma Protein-A (PAPP-A): A large zinc metalloproteinase produced by the syncytiotrophoblast.
• Free Beta human Chorionic Gonadotropin (Free β-hCG): The beta subunit of human chorionic gonadotropin secreted by the placenta.

2. Typical Risk Pattern in Fetal Aneuploidies:
• Down Syndrome (Trisomy 21): Significantly elevated Free β-hCG (median ~2.0 MoM) and decreased PAPP-A (median ~0.4 MoM).
• Edwards Syndrome (Trisomy 18) & Patau Syndrome (Trisomy 13): Markedly decreased Free β-hCG (< 0.5 MoM) and markedly decreased PAPP-A (< 0.3 MoM).

3. Multiple of Median (MoM) & Risk Calculation:
Raw analyte concentrations are converted into gestational age-adjusted Multiples of the Median (MoM), corrected for maternal weight, ethnicity, smoking status, IVF, and diabetes. Combined risk assessment incorporates maternal age, Ultrasound Nuchal Translucency (NT), and nasal bone visualization.

4. Important Clinical Notes:
• Screening Test Only: A "Screen Negative / Low Risk" result reduces but does not eliminate the risk of aneuploidy. A "Screen Positive / High Risk" (cutoff typically ≥ 1:250) indicates an increased statistical probability and warrants genetic counseling, cell-free DNA (NIPT), or definitive invasive diagnostic testing (Chorionic Villus Sampling CVS or Amniocentesis).
• Isolated Low PAPP-A (< 0.4 MoM) with normal chromosomes is an independent predictive marker for adverse pregnancy outcomes including pre-eclampsia, fetal growth restriction (FGR/IUGR), and preterm delivery.`,
        parameters: [
          {
            name: 'PAPPA Level',
            referenceRange: '0.5 - 2.5 MoM (11 - 13+6 Weeks)',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Female',
            valueOptions: []
          },
          {
            name: 'HCG Level',
            referenceRange: '0.5 - 2.5 MoM (11 - 13+6 Weeks)',
            unit: 'mIU/mL',
            fieldType: 'Female',
            gender: 'Female',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FASTING_BLOOD_SUGAR') {
      setReportForm({
        title: 'Fasting Blood Sugar',
        test: 'Fasting Blood Sugar',
        category: 'LAB',
        basePrice: 80,
        taxPercentage: 0,
        sampleType: 'Plasma (Fluoride) / Serum (Fasting 8-12 hrs)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative determination of plasma glucose concentration after an overnight fast (8-12 hours) to diagnose and monitor diabetes mellitus and impaired fasting glucose.',
        interpretation: `Clinical Notes
Elevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.

Fasting Glucose (mg/dL) | 2 hours PP Glucose (mg/dL) | Diagnosis
• < 100                 | < 140                      | Normal
• 100 to 125            | 140 to 199                 | Pre-Diabetes
• > 126                 | > 200                      | Diabetes

A level of 126 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.
IGT (2 hrs Post meal), means a person has an increased risk of developing type 2 diabetes but does not have it yet.
A 2-hour glucose level of 200 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.`,
        parameters: [
          {
            name: 'Fasting Blood Sugar',
            referenceRange: '70 - 100',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FASTING_INSULIN') {
      setReportForm({
        title: 'Fasting Insulin (Serum Insulin, Fasting)',
        test: 'Fasting Insulin',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Fasting 8-12 hrs)',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescence Immunoassay (CLIA) for quantitative measurement of fasting serum insulin to evaluate insulin resistance, metabolic syndrome, beta-cell secretory capacity, and hyperinsulinemic hypoglycemia.',
        interpretation: `Clinical Significance & Interpretation (Fasting Insulin):
Insulin is a peptide hormone synthesized and secreted by the beta cells of pancreatic islets of Langerhans. It regulates glucose homeostasis by promoting peripheral glucose uptake into muscle and adipose tissue and suppressing hepatic gluconeogenesis.

1. Reference Interval (Fasting):
• Normal Fasting Insulin: 2.0 - 25.0 µIU/mL (Optimal metabolic fasting insulin is typically < 10.0 µIU/mL).

2. Elevated Fasting Insulin (Hyperinsulinemia):
• Insulin Resistance Syndrome & Metabolic Syndrome
• Type 2 Diabetes Mellitus (early/compensatory hyperinsulinemic phase)
• Polycystic Ovarian Syndrome (PCOS)
• Insulinoma (pancreatic islet beta-cell tumor)
• Obesity and excessive visceral adiposity
• Cushing's Syndrome & Acromegaly
• Exogenous insulin administration / Sulfonylurea use

3. Decreased Fasting Insulin (Hypoinsulinemia):
• Type 1 Diabetes Mellitus (absolute autoimmune beta-cell deficiency)
• Late-stage / End-stage Type 2 Diabetes (beta-cell exhaustion)
• Pancreatectomy, severe chronic pancreatitis, or cystic fibrosis
• Hypopituitarism

4. Assessment of Insulin Resistance (HOMA-IR):
Fasting insulin paired with fasting blood sugar enables the calculation of Homeostatic Model Assessment for Insulin Resistance:
• HOMA-IR = [Fasting Glucose (mg/dL) × Fasting Insulin (µIU/mL)] / 405
• HOMA-IR < 2.0: Normal Insulin Sensitivity
• HOMA-IR ≥ 2.5: Significant Insulin Resistance`,
        parameters: [
          {
            name: 'Fasting Insulin',
            referenceRange: '2 - 25',
            unit: 'µIU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'TORCH_PROFILE') {
      setReportForm({
        title: 'TORCH Profile (Toxoplasma, Rubella, CMV, HSV-1/2)',
        test: 'TORCH Profile',
        category: 'LAB',
        basePrice: 2000,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: '24 - 48 Hours',
        description: 'Comprehensive Chemiluminescence / ELISA immunoassay panel for detecting IgG and IgM antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Viruses (HSV 1 & 2) in maternal antenatal screening.',
        interpretation: `Clinical Significance & Interpretation (TORCH Panel / Profile):
The TORCH profile is a serological panel designed to detect antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV-1 and HSV-2), primarily used during preconception and antenatal screening to prevent congenital infections.

1. Serological Pattern Interpretation:
• IgG Negative (-) & IgM Negative (-): No evidence of past exposure or current infection; Patient is susceptible to primary infection. Preventive counseling and hygiene advised.
• IgG Positive (+) & IgM Negative (-): Indicates past infection and acquired immunity (protective against primary maternal infection for Rubella and Toxoplasma). Low fetal risk.
• IgG Negative (-) & IgM Positive (+): Suggestive of acute primary / early infection or false positive IgM. Advise repeat testing in 2-3 weeks for IgG seroconversion. High risk of vertical transmission.
• IgG Positive (+) & IgM Positive (+): Possible acute recent infection, persistent IgM, or secondary reactivation. IgG avidity testing is recommended to differentiate recent primary infection (< 3-4 months) from remote infection (> 4 months).

2. Pathogen Specific Notes:
• Toxoplasma gondii: Primary infection in pregnancy carries risk of congenital toxoplasmosis (hydrocephalus, intracranial calcifications, chorioretinitis).
• Rubella Virus: Acute primary infection during first trimester causes Congenital Rubella Syndrome (CRS - cataract, cardiac defects, sensorineural deafness).
• Cytomegalovirus (CMV): Most common congenital viral infection causing sensorineural hearing loss, microcephaly, and developmental delay.
• Herpes Simplex Virus (HSV 1/2): High risk of neonatal transmission during vaginal delivery if active maternal genital lesions or primary infection are present near term.`,
        parameters: [
          {
            name: 'Toxo IgG',
            referenceRange: '< 2 IU/mL',
            unit: 'IU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Toxo IgM',
            referenceRange: 'Neg. < 2 AU/mL | Grey Zone 2 - 2.6 AU/mL | Pos. > 2.6 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Rubella IgG',
            referenceRange: '< 2 IU/mL',
            unit: 'IU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Rubella IgM',
            referenceRange: 'Neg. < 2 AU/mL | Grey Zone 2 - 3 AU/mL | Pos. > 3 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'CMV IgG',
            referenceRange: '< 2 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'CMV IgM',
            referenceRange: 'Neg. < 2.0 AU/mL | Grey Zone 2 - 4.2 AU/mL | Pos. > 4.2 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'HSV-1/2 IgG',
            referenceRange: '< 2.0 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'HSV-1/2 IgM',
            referenceRange: 'Neg. < 2 AU/mL | Grey Zone 2 - 4 AU/mL | Pos. >= 4 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'HSV-2 IgG',
            referenceRange: '< 2.0 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'HSV-2 IgM',
            referenceRange: 'Neg. < 2.0 AU/mL | Grey Zone 2 - 4.0 AU/mL | Pos. >= 4.0 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'TLC') {
      setReportForm({
        title: 'Total Leukocyte Count (TLC)',
        test: 'TLC',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: 'Same Day',
        description: 'Automated quantitative enumeration of total circulating white blood cells (WBC / Leukocytes) in peripheral whole blood to screen for infection, inflammation, bone marrow disorders, and leukemia.',
        interpretation: `Physiological basis
The WBC count and differential determine the total number of white blood cells as well as the percentage and absolute number of each type of white cell in a blood sample. It is typically generated by an automated laboratory hematology analyzer as part of the CBC panel.

Interpretation
Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumor (paraneoplastic reaction), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, various drugs, corticosteroids, allergies, hypersensitivity reactions, stress, smoking.

Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (eg, chemotherapy, radiation, various drugs), myelodysplasia, collagen vascular diseases, hypersplenism, cyclic neutropenia, autoimmune neutropenia, alcoholism.

Comments
There are five types of white cells, each with different functions: neutrophils, lymphocytes, monocytes, eosinophils, and basophils. Absolute counts for individual cell populations can be calculated from a combination of the WBC count and the percentage of each cell type from the differential.`,
        parameters: [
          {
            name: 'Total Leukocyte Count',
            referenceRange: '4,800 - 10,800',
            unit: 'cumm',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'TG_HDL') {
      setReportForm({
        title: 'TG / HDL (Triglycerides / HDL Cholesterol Ratio)',
        test: 'TG / HDL',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma (Fasting 10-12 hrs)',
        turnaroundTime: 'Same Day',
        description: 'Calculated ratio of serum triglycerides to high-density lipoprotein cholesterol (TG/HDL-C), serving as a powerful surrogate marker for insulin resistance, atherogenic small dense LDL particles, and cardiometabolic risk.',
        interpretation: `Clinical Significance & Interpretation (TG / HDL Ratio):
The Triglycerides to HDL-Cholesterol ratio (TG/HDL-C) is a powerful, non-invasive surrogate biomarker of insulin resistance, cardiometabolic risk, and the presence of atherogenic small dense low-density lipoprotein (sdLDL) particles.

1. Reference Interval & Risk Stratification:
• < 2.0 (Ideal / Low Risk): Indicates optimal insulin sensitivity, low atherogenic particle burden, and minimal cardiometabolic risk.
• 2.0 - 4.0 (Borderline / Moderate Risk): Indicates emerging insulin resistance, early atherogenic dyslipidemia, and moderate cardiovascular risk.
• > 4.0 (High Risk): Strongly associated with significant insulin resistance, metabolic syndrome, non-alcoholic fatty liver disease (NAFLD/MASLD), and elevated risk for coronary artery disease (CAD).

2. Pathophysiological Insights:
• sdLDL Proxy: A high TG/HDL ratio closely mirrors high circulating levels of small, dense, easily oxidized LDL particles even when standard LDL-C levels appear normal.
• Insulin Resistance & Metabolic Health: TG/HDL ratio > 3.0 in males or > 2.5 in females correlates strongly with hyperinsulinemia and visceral adiposity.
• Lifestyle & Therapeutic Interventions: Dietary carbohydrate restriction, weight optimization, regular aerobic and resistance exercise, and omega-3 fatty acid supplementation effectively reduce the TG/HDL ratio.`,
        parameters: [
          {
            name: 'TG / HDL',
            referenceRange: '< 2.0 (Desirable) | 2.0 - 4.0 (Borderline) | > 4.0 (High Risk)',
            unit: 'Ratio',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'TESTOSTERONE_TOTAL') {
      setReportForm({
        title: 'Testosterone Total',
        test: 'Testosterone Total',
        category: 'LAB',
        basePrice: 550,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Morning 7-10 AM preferred)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative measurement of total serum testosterone (bound and free fractions) via Chemiluminescence Immunoassay (CLIA) to assess gonadal function, hypogonadism, hirsutism, and endocrine disorders.',
        interpretation: `Physiological basis
Testosterone is the principal male sex hormone, produced by the Leydig cells of the testes. Dehydroepiandrosterone (DHEA) is produced in the adrenal cortex, testes, and ovaries and is the main precursor for serum testosterone in women. In normal males after puberty, the testosterone level is twice as high as all androgens in females. In serum, it is largely bound to albumin (38%) and to a specific steroid hormone-binding globulin (SHBG) (60%), but it is the free hormone (2%) that is physiologically active. The total testosterone level measures both bound and free testosterone in the serum (by immunoassay). Free or bioavailable testosterone may be calculated or measured.

Interpretation
Increased in: Idiopathic sexual precocity (in boys, levels may be in adult range), adrenal hyperplasia (boys), adrenocortical tumors, trophoblastic disease during pregnancy, idiopathic hirsutism, virilizing ovarian tumors, arrhenoblastoma, virilizing luteoma, testicular feminization (normal or moderately elevated), cirrhosis (through increased SHBG), hyperthyroidism. Drugs: anticonvulsants, barbiturates, estrogens, oral contraceptives (through increased SHBG).
Decreased in: Hypogonadism (primary and secondary, orchidectomy, Klinefelter syndrome, uremia, hemodialysis, hepatic insufficiency, ethanol [men]). Drugs: digoxin, spironolactone, acarbose.

Comments
Diurnal variation is present in adult males with highest levels in the early morning (around 8 AM) and lowest levels in the evening (around 8 PM). Early morning collection is recommended.`,
        parameters: [
          {
            name: 'Testosterone Total',
            referenceRange: 'Males: 240 - 870 | Females: 15 - 70',
            unit: 'ng/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'TESTOSTERONE_FREE') {
      setReportForm({
        title: 'Testosterone Free',
        test: 'Testosterone Free',
        category: 'LAB',
        basePrice: 750,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Morning 7-10 AM preferred)',
        turnaroundTime: '24 - 48 Hours',
        description: 'Quantitative determination of unbound, biologically active free testosterone in serum via enzyme immunoassay (ELISA) / equilibrium dialysis to assess functional androgen activity in conditions of altered SHBG binding.',
        interpretation: `Clinical Use
1. As a secondary test to investigate alterations in physiologically active testosterone levels.
2. To evaluate androgen status in cases with suspected or established abnormalities in sex hormone-binding globulin (SHBG).
3. To assess functional serum testosterone levels in early pubertal males and older adult men.
4. To measure functional circulating testosterone in females presenting with symptoms or signs of hyperandrogenism despite having normal total testosterone concentrations.

Comments
Testosterone circulates in the blood bound to three proteins: sex hormone-binding globulin (SHBG) (60-80%), albumin, and cortisol-binding globulin. Approximately 1-2% of circulating testosterone remains unbound or free. Measuring free testosterone provides an estimate of the biologically active hormone. This is particularly useful to account for variations in transport proteins that can affect total testosterone levels. Elevated SHBG levels, which can occur with conditions like obesity or advanced age, might obscure a true testosterone deficiency. In conditions such as Polycystic Ovary Syndrome (PCOS), where insulin resistance is prevalent and SHBG levels are often reduced, free or bioavailable testosterone levels may be significantly elevated.`,
        parameters: [
          {
            name: 'Testosterone Free',
            referenceRange: 'Males: 4.5 - 25.0 | Females: 0.1 - 4.1',
            unit: 'pg/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'CUSTOM_TEST') {
      setReportForm({
        title: 'test',
        test: 'test',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Biological Specimen',
        turnaroundTime: 'Same Day',
        description: 'Custom laboratory test panel containing quantitative measurement parameter AAA and multi-option selection parameter BBB.',
        interpretation: '',
        parameters: [
          {
            name: 'AAA',
            referenceRange: '5.4 - 8',
            unit: '',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'BBB',
            referenceRange: '',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Normal', 'Abnormal', 'Positive', 'Negative']
          }
        ]
      });
    } else if (presetType === 'T4') {
      setReportForm({
        title: 'Serum thyroxine, T4',
        test: 'T4',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative immunoassay measurement of total circulating serum thyroxine (T4) to evaluate thyroid metabolic function, hyperthyroidism, and hypothyroidism.',
        interpretation: `Clinical Significance & Interpretation (Serum Thyroxine, Total T4):
Thyroxine (T4) is the major circulating thyroid hormone synthesized and secreted by the follicular cells of the thyroid gland under the regulatory control of Pituitary Thyroid Stimulating Hormone (TSH). More than 99.9% of circulating T4 is bound to plasma transport proteins (predominantly Thyroxine-Binding Globulin [TBG], transthyretin, and albumin), while the remaining unbound fraction represents free T4 (FT4).

1. Clinical Indications & Diagnostics:
• Increased in (Hyperthyroidism / Thyrotoxicosis): Graves' disease, toxic multinodular goiter, toxic adenoma, subacute thyroiditis (early release phase), exogenous thyroid hormone administration, elevated TBG states (pregnancy, estrogen therapy, oral contraceptives, acute hepatitis).
• Decreased in (Hypothyroidism): Primary hypothyroidism (Hashimoto's thyroiditis, post-ablative, post-surgical, iodine deficiency), secondary/central hypothyroidism (pituitary or hypothalamic insufficiency), severe non-thyroidal illness (euthyroid sick syndrome), decreased TBG states (nephrotic syndrome, protein-losing enteropathy, major hepatic failure, androgen/anabolic steroid use).

2. Diagnostic Guidance:
Total T4 levels reflect both bound and unbound hormone. Conditions altering TBG concentrations may alter Total T4 without impacting thyroid metabolic status. Assessing Free T4 (FT4) and TSH is recommended for definitive diagnosis when binding protein abnormalities are suspected.`,
        parameters: [
          {
            name: 'Serum thyroxine, T4',
            referenceRange: '52 - 127',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'T3') {
      setReportForm({
        title: 'Serum Triiodothyronine, T3',
        test: 'T3',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative immunoassay determination of total circulating serum triiodothyronine (T3) for assessing thyroid hyperactivity, T3 thyrotoxicosis, and peripheral thyroid hormone status.',
        interpretation: `Physiologic Basis
T3 is the primary active thyroid hormone. Approximately 80% of T3 is produced by extrathyroidal deiodination of T4 and the rest by thyroid gland. Total T3 is influenced by levels of thyroxine binding proteins.

Interpretation
Increased in: Hyperthyroidism (some) Increased thyroid binding globulin.
Decreased in: Hypothyroidism, nonthyroidal illness, decreased thyroid binding globulin. Drugs: Amiodarone.

Comments
T3 may be increased in approximately 5% of hyperthyroid patients in whom free T4 is normal (T3 toxicosis). Therefore, the test is indicated when hyperthyroidism is suspected and free T4 value is normal. Test is of no value in the diagnosis and treatment of primary hypothyroidism.`,
        parameters: [
          {
            name: 'Serum Triiodothyronine, T3',
            referenceRange: '0.69 - 2.15',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'STOOL_ROUTINE') {
      setReportForm({
        title: 'Stool Routine Examination (Routine & Microscopy)',
        test: 'Stool Routine Examination',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Fresh Stool / Feces (Sterile Container)',
        turnaroundTime: 'Same Day',
        description: 'Comprehensive physical, chemical, and microscopic examination of fecal specimens to evaluate gastrointestinal disorders, intestinal parasites, dysentery, occult bleeding, and malabsorption.',
        interpretation: `Clinical Significance & Interpretation (Stool Routine Examination):
Stool Routine & Microscopic Examination is a vital diagnostic evaluation of gastrointestinal health, intestinal infections, malabsorption disorders, and gastrointestinal bleeding.

1. Macroscopic Findings:
• Colour: Normal stool colour ranges from light to dark brown due to stercobilin. Pale/Clay-coloured stool suggests biliary obstruction (lack of urobilinogen). Black/Tarry stool (melena) indicates upper GI bleeding. Red/Bloody stool (hematochezia) suggests lower GI bleeding, hemorrhoids, or fissures.
• Consistency: Watery or loose stools reflect hypermotility or secretory/osmotic diarrhea. Hard stools indicate delayed transit/constipation. Mucoid stools suggest colonic inflammation, irritable bowel syndrome, or infectious enteritis.
• Occult Blood: Positive occult blood is an indicator of asymptomatic colorectal bleeding, polyps, inflammatory bowel disease (IBD), ulcers, or early colorectal neoplasia.

2. Microscopic Findings:
• Pus Cells (Leukocytes) & RBCs: Presence of significant pus cells (> 5/HPF) with RBCs indicates invasive or inflammatory bacterial infection (e.g., Shigella, Salmonella, Campylobacter, invasive E. coli) or active IBD (Ulcerative Colitis / Crohn's Disease).
• Cysts & Trophozoites: Detection of Entamoeba histolytica (amebiasis) or Giardia lamblia (giardiasis) cysts/trophozoites confirms parasitic intestinal protozoal infection.
• Helminthic Ova: Identification of ova (Ascaris, Hookworm, Trichuris, Taenia) confirms helminthic infestation requiring targeted anthelmintic therapy.
• Undigested Food & Macrophages: Excessive undigested meat fibers/starch or macrophages suggests maldigestion, pancreatic exocrine insufficiency, or severe mucosal inflammation.`,
        parameters: [
          {
            name: 'Colour',
            referenceRange: 'Yellowish Brown / Brown',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Brown', 'Yellowish Brown', 'Dark Brown', 'Clay Coloured', 'Black / Tarry', 'Greenish', 'Red / Bloody']
          },
          {
            name: 'Consistency',
            referenceRange: 'Formed / Semi-formed',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Formed', 'Semi-formed', 'Soft', 'Loose / Watery', 'Hard', 'Mucoid']
          },
          {
            name: 'Mucus',
            referenceRange: 'Absent / NIL',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['NIL', 'Present', 'Trace', 'Moderate', 'Copious']
          },
          {
            name: 'Blood',
            referenceRange: 'Absent / NIL',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['NIL', 'Present', 'Trace', 'Occasional', 'Gross Blood Present']
          },
          {
            name: 'Occult Blood',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Negative', 'Positive', 'Weakly Positive', 'Trace']
          },
          {
            name: 'Parasites',
            referenceRange: 'Not Seen / NIL',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Not Seen', 'NIL', 'Present', 'Adult Worm / Segment Seen']
          },
          {
            name: 'Undigested Food Particles',
            referenceRange: 'Absent / Occasional',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Absent', 'NIL', 'Present', 'Occasional', 'Moderate Amount']
          },
          {
            name: 'OVA',
            referenceRange: 'NIL / Not Seen',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['NIL', 'Not Seen', 'Ascaris lumbricoides seen', 'Hookworm ova seen', 'Trichuris trichiura seen', 'Taenia ova seen', 'Enterobius vermicularis seen']
          },
          {
            name: 'Cysts',
            referenceRange: 'NIL / Not Seen',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['NIL', 'Not Seen', 'E. histolytica cyst seen', 'Giardia lamblia cyst seen', 'E. coli cyst seen', 'Balantidium coli cyst seen', 'Blastocystis hominis seen']
          },
          {
            name: 'Pus Cells',
            referenceRange: '0 - 2 /HPF',
            unit: '/HPF',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['NIL', '0 - 2', '2 - 4', '5 - 10', '10 - 20', 'Plenty / Numerous']
          },
          {
            name: 'Red Blood Cells',
            referenceRange: 'NIL /HPF',
            unit: '/HPF',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['NIL', '0 - 1', '1 - 2', '2 - 5', '5 - 10', 'Plenty / Numerous']
          },
          {
            name: 'Macrophages',
            referenceRange: 'Absent / NIL',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['NIL', 'Absent', 'Present', 'Occasional', 'Few']
          }
        ]
      });
    } else if (presetType === 'STOOL_REDUCING_SUBSTANCES') {
      setReportForm({
        title: 'Stool Reducing Substances (Fecal Reducing Substances)',
        test: 'Stool reducing substances',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Fresh Stool Specimen (Sterile Container)',
        turnaroundTime: 'Same Day',
        description: 'Semi-quantitative chemical screening test (Benedict’s / Clinitest method) to detect reducing carbohydrates (lactose, glucose, galactose, fructose) in stool for diagnosing carbohydrate malabsorption and disaccharidase deficiency.',
        interpretation: `Clinical Significance & Interpretation (Stool Reducing Substances):
Fecal reducing substances testing (Benedict's / Clinitest method) is a critical diagnostic screening tool for carbohydrate malabsorption and disaccharidase deficiencies in infants and young children presenting with chronic watery diarrhea, perianal excoriation, abdominal distension, and failure to thrive.

1. Reference Interval & Grading:
• Negative (< 0.25% or < 0.25 g/dL): Normal carbohydrate absorption without significant fecal loss of reducing sugars.
• Borderline / Suspicious (0.25% - 0.5%): Questionable or mild malabsorption; repeat testing after dietary challenge may be warranted.
• Positive (> 0.5% or > 0.5 g/dL): Clinically significant carbohydrate malabsorption.

2. Clinical Etiologies of Positive Results:
• Primary / Congenital Disaccharidase Deficiencies: Congenital lactase deficiency, sucrase-isomaltase deficiency, glucose-galactose malabsorption.
• Secondary / Acquired Intestinal Malabsorption: Post-rotaviral / post-gastroenteritis mucosal brush border injury, cow's milk protein allergy, celiac disease, short bowel syndrome, or small intestinal bacterial overgrowth (SIBO).

3. Correlative Biomarkers & Pre-analytical Notes:
• Fecal pH: Malabsorbed carbohydrates are fermented by colonic flora into short-chain fatty acids, reducing stool pH to acidic levels (< 5.5).
• Non-reducing Sugars (Sucrose): Sucrose is not a reducing sugar unless acid hydrolyzed. If sucrose malabsorption is suspected, acid hydrolysis prior to testing is required.
• Sample Handling: Feces must be collected fresh and processed immediately to prevent bacterial consumption of sugars prior to analysis.`,
        parameters: [
          {
            name: 'Stool reducing substances',
            referenceRange: 'Negative (< 0.25%)',
            unit: '%',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Negative (< 0.25%)', 'Borderline (0.25% - 0.5%)', 'Positive (> 0.5%)', 'Strongly Positive (> 1.0%)']
          }
        ]
      });
    } else if (presetType === 'SKIN_TEST_LEPROSY') {
      setReportForm({
        title: 'Skin test for Leprosy (Lepromin Test)',
        test: 'Skin test for Leprosy',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Intradermal Antigen (Lepromin)',
        turnaroundTime: '48 Hours (Fernandez) / 21-28 Days (Mitsuda)',
        description: 'Delayed-type hypersensitivity skin test using Lepromin antigen to assess cell-mediated immunity (CMI) against Mycobacterium leprae for classification, prognostication, and host resistance evaluation.',
        interpretation: `Clinical Significance & Interpretation (Skin Test for Leprosy / Lepromin Test):
The Lepromin test (Mitsuda and Fernandez reactions) is a delayed-type hypersensitivity skin test used to assess cell-mediated immunity (CMI) to Mycobacterium leprae. It is primarily used for classification and prognosis of leprosy rather than initial diagnosis.

1. Reaction Types & Interpretation:
• Fernandez Reaction (Early Reaction, read at 48 hours): Erythema and induration > 10 mm indicates pre-existing delayed hypersensitivity to soluble M. leprae antigens.
• Mitsuda Reaction (Late Reaction, read at 21-28 days): Nodular induration > 5 mm indicates intact, functional cell-mediated immunity against M. leprae antigens.

2. Immunological & Prognostic Significance:
• Positive Mitsuda Test: Indicates strong cell-mediated immunity. Associated with Tuberculoid Leprosy (TT) or Borderline Tuberculoid (BT), characterized by low bacterial index (paucibacillary), localized granulomas, and favorable clinical prognosis.
• Negative Mitsuda Test: Indicates deficient cell-mediated immunity to M. leprae. Associated with Lepromatous Leprosy (LL) or Borderline Lepromatous (BL), characterized by high bacterial burden (multibacillary), diffuse skin infiltration, and high transmission potential.
• Note: Healthy non-exposed individuals and BCG-vaccinated persons may exhibit a positive Mitsuda reaction due to cross-reactive mycobacterial immunity.`,
        parameters: [
          {
            name: 'Skin test for Leprosy',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Negative', 'Positive (+)', 'Strongly Positive (++)', 'Equivocal / Doubtful']
          }
        ]
      });
    } else if (presetType === 'STOOL_CS') {
      setReportForm({
        title: 'Stool Culture and Sensitivity (Stool C/S)',
        test: 'Stool/cs',
        category: 'LAB',
        basePrice: 600,
        taxPercentage: 0,
        sampleType: 'Fresh Stool / Feces (Sterile Container / Cary-Blair Transport)',
        turnaroundTime: '48 - 72 Hours',
        description: 'Microbiological culture, pathogen identification, and antibiotic susceptibility testing on stool specimens to isolate bacterial causes of acute gastroenteritis and dysentery.',
        interpretation: `Clinical Significance & Interpretation (Stool Culture & Sensitivity - Stool C/S):
Stool culture is performed to isolate and identify enteric bacterial pathogens responsible for infectious gastroenteritis, food poisoning, and bacterial dysentery, followed by antibiotic sensitivity testing.

1. Common Enteric Pathogens Isolated:
• Salmonella species (S. enterica, S. typhi): Causes acute enterocolitis, enteric fever.
• Shigella species (S. dysenteriae, S. flexneri, S. sonnei): Causes classic bacillary dysentery with bloody, mucoid stools.
• Vibrio cholerae: Causes severe secretory rice-water diarrhea and life-threatening dehydration.
• Campylobacter jejuni: Common cause of bacterial gastroenteritis and inflammatory enterocolitis.
• Enteropathogenic / Enterohemorrhagic E. coli (EPEC/EHEC): Associated with epidemic infantile diarrhea and Hemolytic Uremic Syndrome (HUS).

2. Clinical Guidance:
Isolation of normal commensal colonic flora is reported as "Normal Colonic Flora Grown / No Enteric Pathogen Isolated". In positive cultures, antimicrobial susceptibility testing (AST) guides targeted antibiotic therapy.`,
        parameters: [
          {
            name: 'Growth / Pathogen Isolated',
            referenceRange: 'No enteric pathogen isolated',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Normal Colonic Flora Grown', 'No Pathogenic Organisms Isolated', 'Salmonella species isolated', 'Shigella species isolated', 'Vibrio cholerae isolated', 'Campylobacter jejuni isolated', 'Enteropathogenic E. coli isolated']
          },
          {
            name: 'Antibiotic Sensitivity',
            referenceRange: 'Sensitive to reported antibiotics',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SGPT') {
      setReportForm({
        title: 'SGPT (ALT) - Alanine Aminotransferase',
        test: 'SGPT',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Enzyme biomarker test measuring Serum Glutamic Pyruvic Transaminase (SGPT/ALT) to evaluate hepatic cellular integrity, parenchymal liver damage, and monitor hepatotoxic therapies.',
        interpretation: `Physiological basis
Intracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, kidney; in smaller amounts, in skeletal muscle and heart. Released with tissue damage, particularly liver injury.

Interpretation
Increased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; nonalcoholic steatohepatitis; right heart failure, ischemia or hypoxia, injury to liver ("shock liver"), extensive trauma; drugs that cause cholestasis or hepatotoxicity.
Decreased in: Pyridoxine (vitamin B6) deficiency.

Comments
ALT is the preferred enzyme for evaluation of liver injury.`,
        parameters: [
          {
            name: 'SGPT (ALT)',
            referenceRange: '13 - 40',
            unit: 'U/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SGOT') {
      setReportForm({
        title: 'SGOT (AST) - Aspartate Aminotransferase',
        test: 'SGOT',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Enzyme biomarker test measuring Serum Glutamic Oxaloacetic Transaminase (SGOT/AST) to evaluate hepatic and muscular cellular integrity, parenchymal tissue damage, and AST/ALT de Ritis ratio.',
        interpretation: `Physiological basis:
Intracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, skeletal muscle, brain, red cells, and heart. Released into the bloodstream when tissue is damaged, especially in liver injury.

Interpretation
Increased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; right heart failure, ischemic or hypoxic injury to liver ("shock liver"), extensive trauma. Drugs that cause cholestasis or hepatotoxicity.
Decreased in: Pyridoxine (vitamin B6) deficiency

Comments
Test is not indicated for diagnosis of myocardial infarction.
AST/ALT ratio >1 suggests cirrhosis in patients with hepatitis C`,
        parameters: [
          {
            name: 'SGOT (AST)',
            referenceRange: '0 - 37',
            unit: 'U/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_ZINC') {
      setReportForm({
        title: 'Serum Zinc (Trace Element)',
        test: 'Serum Zinc',
        category: 'LAB',
        basePrice: 900,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Trace Element-Free Plain / Royal Blue Tube)',
        turnaroundTime: '24 - 48 Hours',
        description: 'Trace element biomarker quantitative assay measuring serum zinc levels to diagnose zinc nutritional deficiency, acrodermatitis enteropathica, chronic malabsorption, and monitor trace element therapy.',
        interpretation: `Clinical Significance & Interpretation (Serum Zinc):
Zinc (Zn) is an essential trace element and vital cofactor for more than 300 metalloenzymes (including carbonic anhydrase, alkaline phosphatase, RNA/DNA polymerases, and superoxide dismutase). It plays crucial roles in cellular growth, DNA synthesis, protein metabolism, wound healing, immune function, and spermatogenesis.

1. Reference Interval:
• Normal Serum Zinc: 70 - 120 µg/dL

2. Clinical Implications of Decreased Levels (< 70 µg/dL):
• Inadequate Dietary Intake & Malnutrition: Protein-energy malnutrition, total parenteral nutrition (TPN) without trace element supplementation, anorexia nervosa.
• Gastrointestinal Malabsorption: Celiac disease, Crohn's disease, short bowel syndrome, chronic diarrhea, bariatric surgery.
• Acrodermatitis Enteropathica: Rare autosomal recessive genetic disorder causing severe zinc malabsorption, characterized by periorificial dermatitis, alopecia, chronic diarrhea, and delayed development.
• Increased Losses & Increased Demand: Chronic alcoholism (increased urinary excretion), severe thermal burns, chronic kidney disease (hemodialysis), pregnancy, and lactation.
• Clinical Manifestations of Deficiency: Impaired wound healing, recurrent infections, growth retardation, hypogonadism, skin lesions, alopecia, impaired taste (hypogeusia) and smell (hyposmia), night blindness, and neuropsychiatric disturbances.

3. Clinical Implications of Elevated Levels (> 120 µg/dL):
• Occupational / Industrial Inhalation (Zinc Fume Fever): Inhalation of zinc oxide fumes during welding or metal galvanization.
• Excessive Supplementation / Toxicity: Ingestion of high-dose zinc supplements or zinc-containing dental adhesives, which can induce secondary copper deficiency, sideroblastic anemia, and neutropenia.

4. Pre-analytical Considerations:
• Diurnal Variation: Serum zinc levels peak in the morning (by ~10-15%) and decrease in the evening. Fasting morning collection is recommended.
• Contamination Avoidance: Use trace element-free collection tubes (e.g., Royal Blue top) to prevent environmental zinc contamination. Hemolysis must be avoided as erythrocytes contain high concentrations of zinc.`,
        parameters: [
          {
            name: 'Serum Zinc',
            referenceRange: '70 - 120',
            unit: 'µg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_UREA') {
      setReportForm({
        title: 'Serum Urea (Blood Urea Nitrogen / Urea)',
        test: 'Serum Urea',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma (Plain / Gel / Heparin Tube)',
        turnaroundTime: 'Same Day',
        description: 'Renal function biomarker measuring serum urea concentration to assess glomerular filtration, nitrogenous waste clearance, hydration status, and monitor renal disease progression.',
        interpretation: `Interpretation:
Urea is derived in the liver from amino acids and therefore from protein, whether originating from the diet or from tissues. The normal kidney can excrete large amounts of urea. If the rate of production exceeds the rate of clearance, plasma concentrations rise. The rate of production is accelerated by:
- a high-protein diet
- absorption of amino acids and peptides from digested blood after hemorrhage into the gastrointestinal lumen or soft tissues
- increased catabolism due to starvation, tissue damage, sepsis or steroid treatment.
In catabolic states, glomerular function is often impaired due to circulatory factors and this contributes more to the uraemia than does increased production. Conversely, the plasma urea concentration may be lower than 1.0 mmol/L, the causes of which include the following:

Due to increased GFR or haemodilution:
• Pregnancy
• Overenthusiastic intravenous infusion
• 'Inappropriate' ADH secretion (SIADH)

Due to decreased synthesis:
• Use of amino acids for protein anabolism during growth, especially in children
• Low protein intake, very severe liver disease
• Inborn errors of the urea cycle are rare and usually only occur in infants.`,
        parameters: [
          {
            name: 'Serum Urea',
            referenceRange: '19 - 45',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_SODIUM') {
      setReportForm({
        title: 'Serum Sodium (Na+)',
        test: 'Serum Sodium',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative electrolyte assay measuring serum sodium concentration to assess fluid and electrolyte balance, osmolality, hydration status, and renal/endocrine disorders.',
        interpretation: `Physiologic Basis
Sodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.

Interpretation
Increased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).
Drugs: steroids, licorice, oral contraceptives.
Decreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.
Drugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.

Comments
Hyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.`,
        parameters: [
          {
            name: 'Serum Sodium',
            referenceRange: '136 - 146',
            unit: 'mmol/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_PROTEIN') {
      setReportForm({
        title: 'Serum Protein (Total Protein)',
        test: 'Serum Protein',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative assay measuring total serum protein concentration (albumin and globulins) to evaluate nutritional status, hepatic synthesis capacity, renal protein loss, and monoclonal gammopathies.',
        interpretation: `Physiological basis
Plasma protein concentration is determined by nutritional state, hepatic function, renal function, hydration, and various disease states. Plasma protein concentration determines the colloidal osmotic pressure.

Interpretation
Increased in: Polyclonal or monoclonal gammopathies, marked dehydration. Drugs: anabolic steroids, androgens, corticosteroids, epinephrine.
Decreased in: Protein-losing enteropathies, acute burns, nephrotic syndrome, severe dietary protein deficiency, chronic liver disease, malabsorption syndrome, agammaglobulinemia, cancer cachexia.

Comments
Serum total protein consists primarily of albumin and globulin. Serum globulin level is calculated as total protein minus albumin. Hypoproteinemia usually indicates hypoalbuminemia, because albumin is the major serum protein`,
        parameters: [
          {
            name: 'Serum Protein',
            referenceRange: '6.4 - 8.3',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_POTASSIUM') {
      setReportForm({
        title: 'Serum Potassium (K+)',
        test: 'Serum Potassium',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative electrolyte assay measuring serum potassium concentration to evaluate neuromuscular excitability, cardiac conduction, acid-base homeostasis, and renal excretion disorders.',
        interpretation: `Physiologic Basis
Potassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.

Interpretation
Increased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).
Drugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.
Decreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).
Drugs: adrenergic agents (isoproterenol), diuretics.

Comments
Spurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet application.`,
        parameters: [
          {
            name: 'Serum Potassium',
            referenceRange: '3.5 - 5.1',
            unit: 'mmol/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_PHOSPHORUS') {
      setReportForm({
        title: 'Serum Phosphorus (Inorganic Phosphate)',
        test: 'Serum Phosphorus',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative assay measuring serum inorganic phosphorus (phosphate) to evaluate mineral and bone metabolism, parathyroid disorders, vitamin D status, and renal tubular function.',
        interpretation: `Physiologic Basis
The plasma concentration of inorganic phosphate is determined by parathyroid gland function, action of vitamin D, intestinal absorption, renal function, bone metabolism, and nutrition. Serum phosphorus concentrations have a circadian rhythm (highest level in late morning, lowest in evening) and are subject to rapid change secondary to environmental factors such as diet (carbohydrate), phosphate binding antacids, and fluctuations in GH, insulin, and renal function.

Interpretation
Increased in:
Renal failure, Massive blood transfusion, hypoparathyroidism, neoplasms, adrenal insufficiency, hypervitaminosis D, osteolytic metastases to bone, leukemia, Pseudohypoparathyroidism, Cirrhosis, lactic acidosis.
Drugs: phosphate infusions or enemas, anabolic steroids, ergocalciferol, furosemide, hydrochlorothiazide, clonidine, verapamil, potassium supplements

Decreased in:
Hyperparathyroidism, hypovitaminosis D, starvation or cachexia, refeeding syndrome, bone marrow transplantation, GH deficiency, chronic alcoholism, Severe diarrhea, acute pancreatitis, severe hypercalcemia, acid-base disturbances, hypokalemia, hemodialysis.
Drugs: acetazolamide, phosphate-binding antacids, anticonvulsants, β-adrenergic agonists, catecholamines, estrogens, isoniazid, oral contraceptives, prolonged use of thiazides, glucose infusion, insulin therapy, salicylates (toxicity).`,
        parameters: [
          {
            name: 'Serum Phosphorus',
            referenceRange: '2.5 - 4.5',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_LDH') {
      setReportForm({
        title: 'Serum LDH (Lactate Dehydrogenase)',
        test: 'Serum LDH',
        category: 'LAB',
        basePrice: 300,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube - Non-hemolyzed)',
        turnaroundTime: 'Same Day',
        description: 'Enzyme quantitative assay measuring serum lactate dehydrogenase (LDH) activity to assess tissue turnover, hemolysis, myocardial/pulmonary injury, and monitor hematologic malignancies/lymphomas.',
        interpretation: `Clinical Significance & Interpretation (Serum Lactate Dehydrogenase - LDH):
Lactate dehydrogenase (LDH) is an intracellular zinc metalloenzyme that catalyzes the reversible interconversion of lactate and pyruvate in anaerobic glycolysis. LDH is widely distributed in nearly all major body tissues, with highest concentrations in myocardium, erythrocytes, liver, kidneys, skeletal muscle, lungs, and lymphoreticular system.

1. Reference Interval:
• Normal Serum LDH: 140 - 280 U/L

2. Clinical Implications of Elevated Serum LDH (> 280 U/L):
• Hematologic & Hemolytic Disorders: Intravascular hemolysis, megaloblastic anemia (B12 / folate deficiency — marked elevation due to ineffective erythropoiesis), sickle cell crisis, autoimmune hemolytic anemia, thrombotic thrombocytopenic purpura (TTP).
• Malignancies & Tumor Marker Role: Non-Hodgkin lymphoma, Hodgkin lymphoma, acute and chronic leukemias, germ cell tumors (seminoma, dysgerminoma), metastatic carcinoma, neuroblastoma, melanoma. Serum LDH correlates with overall tumor burden, growth kinetics, and cellular turnover.
• Cardiac & Tissue Ischemia: Acute myocardial infarction (peaks at 48-72 hours, remains elevated 10-14 days), pulmonary embolism, renal infarction, mesenteric ischemia.
• Hepatic & Muscle Pathology: Acute viral hepatitis, toxic/ischemic hepatitis, rhabdomyolysis, progressive muscular dystrophy, extensive polymyositis.
• Infectious & Pulmonary Diseases: Severe pneumonia, Pneumocystis jirovecii pneumonia (PCP in immunocompromised patients), sepsis, severe COVID-19/ARDS (reflecting systemic inflammatory damage).

3. Pre-analytical Considerations & Pitfalls:
• Hemolysis: Erythrocytes contain ~150-fold higher LDH concentration than serum. Even minor in vitro hemolysis causes false elevation (spurious hyper-LDH).
• Specimen Handling: Serum must be promptly separated from the clot. Avoid freezing/thawing or extreme temperatures.`,
        parameters: [
          {
            name: 'Serum LDH',
            referenceRange: '140 - 280',
            unit: 'U/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_IGM') {
      setReportForm({
        title: 'Serum IgM (Immunoglobulin M)',
        test: 'Serum IgM',
        category: 'LAB',
        basePrice: 650,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative nephelometric/turbidimetric immunoassay measuring serum Immunoglobulin M (IgM) to evaluate acute immune response, humoral immunodeficiencies, Waldenström macroglobulinemia, and congenital or autoimmune disorders.',
        interpretation: `Clinical Significance & Interpretation (Serum Immunoglobulin M - IgM):
Immunoglobulin M (IgM) is a high molecular weight pentameric antibody and the primary immunoglobulin synthesized during the early initial immune response to antigenic challenge. It provides early-phase protective humoral immunity against bacterial, viral, and parasitic bloodstream pathogens.

1. Reference Interval:
• Normal Serum IgM: 400 - 2,500 µg/mL (40 - 250 mg/dL)

2. Clinical Implications of Elevated Serum IgM (> 2,500 µg/mL):
• Monoclonal Gammopathy: Waldenström's macroglobulinemia (monoclonal IgM spike producing hyperviscosity syndrome), IgM-MGUS (Monoclonal Gammopathy of Undetermined Significance), non-Hodgkin lymphoma.
• Acute & Recent Infections: Viral hepatitis (HAV, HBV, HCV), infectious mononucleosis (EBV), Cytomegalovirus (CMV), Mycoplasma pneumoniae, Toxoplasmosis, Rubella, acute bacterial bacteremia.
• Autoimmune & Inflammatory Diseases: Primary biliary cholangitis (PBC / primary biliary cirrhosis - classic polyclonal IgM elevation), rheumatoid arthritis (rheumatoid factor is primarily IgM), systemic lupus erythematosus (SLE).
• Congenital / Neonatal Infection: Elevated cord blood IgM indicates intrauterine congenital infection (TORCH panel pathogens).

3. Clinical Implications of Decreased Serum IgM (< 400 µg/mL):
• Primary Immunodeficiency Disorders: Selective IgM deficiency, Common Variable Immunodeficiency (CVID), severe combined immunodeficiency (SCID), X-linked agammaglobulinemia (Bruton's).
• Secondary Hypogammaglobulinemia: Multiple myeloma (IgG/IgA types with suppressed non-involved IgM), chronic lymphocytic leukemia (CLL), amyloidosis, severe protein loss (nephrotic syndrome, protein-losing enteropathy), immunosuppressive/cytotoxic therapy.`,
        parameters: [
          {
            name: 'Serum IgM',
            referenceRange: '400 - 2,500',
            unit: 'µg/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_ELECTROLYTE') {
      setReportForm({
        title: 'Serum Electrolyte (Serum Electrolytes - Na+, K+)',
        test: 'Serum Electrolyte',
        category: 'LAB',
        basePrice: 300,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative electrolyte panel measuring serum sodium and potassium concentrations to evaluate fluid-electrolyte balance, renal function, hydration status, and neuromuscular homeostasis.',
        interpretation: `SERUM SODIUM (Na+):
Physiologic Basis
Sodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.

Interpretation
Increased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).
Drugs: steroids, licorice, oral contraceptives.
Decreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.
Drugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.

Comments
Hyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.

--------------------------------------------------

SERUM POTASSIUM (K+):
Physiologic Basis
Potassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.

Interpretation
Increased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).
Drugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.
Decreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).
Drugs: adrenergic agents (isoproterenol), diuretics.

Comments
Spurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet placement. Very high white blood cell or platelet counts may cause spurious elevation of serum potassium, but plasma potassium levels are normal.`,
        parameters: [
          {
            name: 'Serum Sodium',
            referenceRange: '136 - 146',
            unit: 'mmol/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Serum Potassium',
            referenceRange: '3.5 - 5.1',
            unit: 'mmol/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_ALBUMIN') {
      setReportForm({
        title: 'Serum Albumin',
        test: 'Serum Albumin',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative assay measuring serum albumin concentration to evaluate hepatic synthesis capacity, nutritional status, renal protein-losing nephropathies, and oncotic pressure regulation.',
        interpretation: `Physiologic Basis
Major components of plasma proteins are influenced by nutritional state, hepatic function, renal function, and various diseases. It is a major binding protein, although there are more than 50 different genetic variants (alloalbumins), only occasionally does a mutation cause abnormal binding (eg, in familial dysalbuminemic hyperthyroxinemia).

Interpretation
Increased in: Dehydration, shock, hemoconcentration.
Decreased in: Decreased hepatic synthesis (chronic liver disease, malnutrition, malabsorption, malignancy, congenital analbuminemia [rare]). Increased losses (nephrotic syndrome, burns, trauma, hemorrhage with fluid replacement, fistulas, enteropathy, acute or chronic glomerulonephritis). Hemodilution (pregnancy, CHF). Drugs: estrogens.

Comments
Serum albumin indicates severity in chronic liver disease.
Useful in nutritional assessment if there is no impairment in production or increased loss of albumin. Independent risk factor for all-cause mortality in the elderly (age >70) and for complications in hospitalized and post-surgical patients.
There is a 10% reduction in serum albumin level in late pregnancy (related to hemodilution).`,
        parameters: [
          {
            name: 'Serum Albumin',
            referenceRange: '3.5 - 5.2',
            unit: 'g/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_ALKALINE_PHOSPHATASE') {
      setReportForm({
        title: 'Serum Alkaline Phosphatase (ALP)',
        test: 'Serum Alkaline Phosphatase',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Enzyme assay measuring serum alkaline phosphatase (ALP) activity to evaluate hepatobiliary obstructive disorders, bone diseases with osteoblastic activity, and monitor bone metastases.',
        interpretation: `Physiologic Basis:
Alkaline phosphatases are primarily found in liver, bone, intestines, kidney, and placenta. Test is used to detect liver disease and bone disorders.

Interpretation:
Increased in: Obstructive hepatobiliary disease, bone disease (physiologic bone growth, Paget disease, osteomalacia, osteogenic sarcoma, bone metastases), hyperparathyroidism, rickets, benign familial hyperphosphatasemia, pregnancy (third trimester), GI disease (perforated ulcer or bowel infarct), hepatotoxic drugs.
Decreased in: Hypophosphatasia.

Comment:
Alkaline phosphatase performs well in measuring the extent of bone metastases in prostate cancer. Alkaline phosphatase isoenzyme separation by electrophoresis or differential heat inactivation is unreliable. Use γ-glutamyl transpeptidase, which increases in hepatobiliary disease but not in bone disease, to infer the origin of increased alkaline phosphatase.`,
        parameters: [
          {
            name: 'Serum Alkaline Phosphatase',
            referenceRange: '30 - 120',
            unit: 'U/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_AMYLASE') {
      setReportForm({
        title: 'Serum Amylase',
        test: 'Serum Amylase',
        category: 'LAB',
        basePrice: 250,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Enzyme quantitative assay measuring serum amylase activity to diagnose and monitor acute pancreatitis, pancreatic duct obstruction, and other abdominal/salivary pathologies.',
        interpretation: `Physiological basis
Amylase hydrolyzes complex carbohydrates. Serum amylase is derived primarily from pancreas and salivary glands and is increased with inflammation or obstruction of these glands. Other tissues have some amylase activity, including ovaries, small and large intestine, and skeletal muscle.

Interpretation
Increased in:
Acute pancreatitis (70–95%), pancreatic pseudocyst, pancreatic duct obstruction (cholecystitis, choledocholithiasis, pancreatic carcinoma, stone, stricture, duct sphincter spasm), bowel obstruction and infarction, mumps, parotitis, diabetic keto- acidosis, penetrating peptic ulcer, peritonitis, ruptured ectopic pregnancy, macroamylasemia.
Drugs: azathioprine, hydrochlorothiazide.

Decreased in:
Pancreatic insufficiency, cystic fibrosis. Usually normal or low in chronic pancreatitis.

Comments
Macroamylasemia is indicated by high serum but low urine amylase. Serum or plasma lipase is an alternative test for acute pancreatitis. It has clinical sensitivity equivalent to that of amylase but with better specificity.`,
        parameters: [
          {
            name: 'Serum Amylase',
            referenceRange: '0 - 120',
            unit: 'IU/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_BILIRUBIN_DIRECT') {
      setReportForm({
        title: 'Serum Bilirubin (Direct) (Conjugated Bilirubin)',
        test: 'Serum Bilirubin (Direct)',
        category: 'LAB',
        basePrice: 120,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube - Light Protected)',
        turnaroundTime: 'Same Day',
        description: 'Photometric diazo assay measuring direct (conjugated) serum bilirubin to differentiate intrahepatic and post-hepatic obstructive jaundice from pre-hepatic hemolytic hyperbilirubinemia.',
        interpretation: `Physiological basis
Bilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.

Interpretation
Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.

Comments
Assay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.`,
        parameters: [
          {
            name: 'Serum Bilirubin (Direct)',
            referenceRange: '0 - 0.3',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_BILIRUBIN_INDIRECT') {
      setReportForm({
        title: 'Serum Bilirubin (Indirect) (Unconjugated Bilirubin)',
        test: 'Serum Bilirubin (Indirect)',
        category: 'LAB',
        basePrice: 120,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube - Light Protected)',
        turnaroundTime: 'Same Day',
        description: 'Quantitative assay calculating indirect (unconjugated) serum bilirubin (Total Bilirubin minus Direct Bilirubin) to evaluate hemolytic anemias, neonatal physiologic jaundice, and congenital glucuronyl transferase deficiencies.',
        interpretation: `Physiological basis
Bilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.

Interpretation
Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.

Comments
Assay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.`,
        parameters: [
          {
            name: 'Serum Bilirubin (Indirect)',
            referenceRange: '0.2 - 1',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_CALCIUM') {
      setReportForm({
        title: 'Serum Calcium (Total Calcium)',
        test: 'Serum Calcium',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Colorimetric assay measuring total serum calcium (bound and ionized) to evaluate parathyroid function, bone metabolism, vitamin D disorders, and hypercalcemia of malignancy.',
        interpretation: `Physiological basis
Serum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.

Interpretation
Common causes of Hypocalcemia:
1. Chronic renal failure
2. Hypomagnesemia
3. Hypoalbuminemia

Causes of Hypercalcemia:
1. Increased intestinal absorption (vitamin d intoxication)
2. Increased skeletal resorption
3. Primary hyperparathyroidism

Primary hyperparathyroidism and malignancy account for 90–95% of cases of hypercalcemia.

Comments
Need to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.`,
        parameters: [
          {
            name: 'Serum Calcium',
            referenceRange: '8.8 - 10.6',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SERUM_CORTISOL') {
      setReportForm({
        title: 'Serum Cortisol (Morning Cortisol)',
        test: 'Serum Cortisol',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube - Morning 8 AM preferred)',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescent immunoassay (CLIA) measuring serum cortisol levels to diagnose adrenal dysfunction, Cushing syndrome, Addison disease, and secondary adrenocortical insufficiency.',
        interpretation: `Physiological basis
Cortisol is the major glucocorticoid hormone secreted by the adrenal cortex under the stimulation of pituitary ACTH. Cortisol displays a marked diurnal / circadian rhythm, with highest levels in early morning (8:00 AM) and lowest levels around midnight. It plays a critical role in glucose metabolism, vascular reactivity, immune system suppression, and stress response.

Reference Ranges (Diurnal Variation):
- Morning (7:00 AM - 9:00 AM): 5.27 - 22.45 µg/dl
- Afternoon (3:00 PM - 5:00 PM): 3.0 - 16.0 µg/dl
- Midnight: < 5.0 µg/dl

Interpretation:
Increased in (Hypercortisolemia / Cushing's syndrome):
- Cushing syndrome (pituitary ACTH-secreting adenoma - Cushing disease)
- Adrenal adenoma or carcinoma (ACTH-independent)
- Ectopic ACTH secretion (e.g., small cell lung carcinoma)
- Physiological stress (severe illness, trauma, surgery, sepsis, depression, acute hypoglycemia)
- Pregnancy and oral contraceptive / estrogen therapy (increased cortisol-binding globulin)

Decreased in (Hypocortisolemia / Adrenal Insufficiency):
- Primary adrenal insufficiency (Addison disease - autoimmune adrenalitis, tuberculosis, adrenal hemorrhage)
- Secondary adrenal insufficiency (pituitary ACTH deficiency, hypopituitarism)
- Tertiary adrenal insufficiency (hypothalamic CRH deficiency, abrupt withdrawal of prolonged exogenous corticosteroid therapy)
- Congenital adrenal hyperplasia (CAH - e.g., 21-hydroxylase deficiency)

Comments:
- A single random cortisol level is often insufficient for definitive diagnosis of Cushing syndrome or Addison disease due to diurnal fluctuation and stress sensitivity.
- Dynamic endocrine testing is recommended: Low-dose / High-dose Dexamethasone suppression test for hypercortisolism, and ACTH (Cosyntropin) stimulation test for suspected adrenal insufficiency.
- Midnight salivary cortisol or 24-hour urinary free cortisol (UFC) provides high diagnostic specificity for loss of diurnal rhythm in Cushing syndrome.`,
        parameters: [
          {
            name: 'Serum Cortisol',
            referenceRange: '5.27 - 22.45',
            unit: 'µg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'RUBELLA_IGM') {
      setReportForm({
        title: 'Rubella IgM (Rubella Virus Antibody IgM)',
        test: 'Rubella IgM',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Chemiluminescent immunoassay (CLIA) / ELISA for quantitative/semi-quantitative detection of IgM antibodies to Rubella virus to diagnose acute or recent German measles infection during pregnancy and congenital evaluation.',
        interpretation: `Clinical Interpretation:
Rubella IgM antibodies indicate recent or acute infection with the Rubella virus (German measles) or recent vaccination. Rubella is an acute contagious viral infection characterized by rash, fever, and lymphadenopathy. Primary infection during early pregnancy poses high risk of Congenital Rubella Syndrome (CRS) resulting in congenital heart defects, cataracts, sensorineural deafness, and microcephaly.

Interpretation Guide:
- Negative (< 2.0 AU/mL): No detectable Rubella IgM antibodies. No evidence of acute or recent infection.
- Equivocal / Grey Zone (2.0 - 3.0 AU/mL): Borderline antibody level. Repeat testing with a fresh sample collected 7-14 days later is recommended to assess seroconversion or rising titer.
- Positive (> 3.0 AU/mL): Detectable Rubella IgM antibodies suggestive of acute or recent Rubella virus infection or recent immunization.`,
        parameters: [
          {
            name: 'Rubella IgM',
            referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2-3 AU/mL\nPos. > 3 AU/mL',
            unit: 'AU/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'SCRUB_TYPHUS') {
      setReportForm({
        title: 'Scrub Typhus (Orientia tsutsugamushi Antibodies - IgG & IgM)',
        test: 'Scrub Typhus',
        category: 'LAB',
        basePrice: 600,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Rapid immunochromatographic assay / ELISA for qualitative detection of IgG and IgM antibodies against Orientia tsutsugamushi in human serum to aid in the diagnosis of acute and recent Scrub Typhus.',
        interpretation: `Clinical Interpretation:
Scrub Typhus (also known as bush typhus) is an acute febrile zoonotic disease caused by Orientia tsutsugamushi (formerly Rickettsia tsutsugamushi), transmitted to humans through the bite of infected larval mites (chiggers - Leptotrombidium deliense). Common clinical manifestations include acute high-grade fever, chills, severe headache, myalgia, generalized lymphadenopathy, maculopapular rash, and the characteristic diagnostic 'eschar' (cigarette-burn like lesion at the bite site).

Interpretation Guide:
- IgM Positive: Indicates acute / current or recent active Scrub Typhus infection. IgM antibodies appear by the end of the 1st week of fever and peak during the 2nd–3rd week.
- IgG Positive: Indicates past exposure, secondary immune response, or convalescent phase. A 4-fold rise in IgG titer in paired sera confirms active infection.
- IgM & IgG Negative: No detectable antibodies to Orientia tsutsugamushi. If clinical suspicion is high and sample was collected within the first 5-7 days of illness, repeat testing after 5-7 days is advised.`,
        parameters: [
          {
            name: 'IgG',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Negative', 'Positive', 'Equivocal']
          },
          {
            name: 'IgM',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Select',
            gender: 'Both',
            valueOptions: ['Negative', 'Positive', 'Equivocal']
          }
        ]
      });
    } else if (presetType === 'SERUM_CHLORIDE') {
      setReportForm({
        title: 'Serum Chloride (Cl-)',
        test: 'Serum Chloride',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Ion-selective electrode (ISE) assay measuring serum chloride concentration to assess electrolyte balance, acid-base equilibrium, hydration status, and renal tubular function.',
        interpretation: `Physiological Basis
Chloride, the principal inorganic anion of extracellular fluid, is important in maintaining proper body water distribution, osmotic pressure, and normal acid-base balance. If chloride is lost (as HCl or NH4Cl), alkalosis ensues; if chloride is ingested or retained, acidosis ensues.

Interpretation
Increased in: Renal failure, nephrotic syndrome, renal tubular acidosis, dehydration, overtreatment with saline, hyperparathyroidism, diabetes insipidus, metabolic acidosis from diarrhea (loss of HCO3–), respiratory alkalosis, hyperadrenocorticism.
Drugs: acetazolamide (hyperchloremic acidosis), androgens, hydrochlorothiazide, salicylates (intoxication).

Decreased in: Vomiting, diarrhea, gastrointestinal suction, renal failure combined with salt deprivation, over-treatment with diuretics, chronic respiratory acidosis, diabetic ketoacidosis, excessive sweating, SIADH, salt-losing nephropathy, acute intermittent porphyria, water intoxication, expansion of extracellular fluid volume, adrenal insufficiency, hyperaldosteronism, metabolic alkalosis.
Drugs: chronic laxative or bicarbonate ingestion, corticosteroids, diuretics.

Comments
Test is helpful in assessing normal and increased anion gap metabolic acidosis. It is somewhat helpful in distinguishing hypercalcemia due to primary hyperparathyroidism (high serum chloride) from that due to malignancy (normal serum chloride).`,
        parameters: [
          {
            name: 'Serum Chloride',
            referenceRange: '98 - 107',
            unit: 'mmol/l',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'RHEUMATOID_FACTOR_QUANTITATIVE') {
      setReportForm({
        title: 'Rheumatoid Factor, RA (Quantitative) (RF Quantitative)',
        test: 'Rheumatoid Factor, RA (Quantitative)',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Plain / Gel Tube)',
        turnaroundTime: 'Same Day',
        description: 'Turbidimetric / Nephelometric immunoassay for quantitative determination of Rheumatoid Factor (IgM-class autoantibodies) in human serum to assist in diagnosis and prognosis of Rheumatoid Arthritis.',
        interpretation: `Physiologic Basis
Rheumatoid factor (RF) consists of heterogeneous autoantibodies usually of the IgM class that react against the Fc region of human IgG. Most methods detect only IgM-class RF.

Interpretation
Positive in: Rheumatoid arthritis (75–90%), Sjögren syndrome (80–90%), scleroderma, dermatomyositis, SLE (30%), sarcoidosis, Waldenström macroglobulinemia, chronic infection.
Drugs: methyldopa, others.
Low-titers of RF (eg, ≤1:80) are questionable and can be found in healthy older patients (20%), in 1–4% of normal individuals, and in a variety of acute immune responses (eg, viral infections, including infectious mononucleosis and viral hepatitis), chronic bacterial infections (tuberculosis, leprosy, subacute infective endocarditis), and chronic active hepatitis.

Comments
Rheumatoid factor can be useful in differentiating rheumatoid arthritis from other chronic inflammatory arthritides. However, a positive RF test is only one of several criteria needed to make the diagnosis of rheumatoid arthritis.
RF must be ordered selectively because its predictive value is low (34%) if it is used as a screening test. The test has poor positive predictive value because of its lack of specificity. The subset of patients with seronegative rheumatic disease limits its sensitivity and negative predictive value.`,
        parameters: [
          {
            name: 'Rheumatoid Factor, RA (Quantitative)',
            referenceRange: '0 - 20',
            unit: 'IU/mL',
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
        interpretation: reportForm.interpretation,
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
      interpretation: testItem.interpretation || testItem.notes || '',
      parameters: Array.isArray(testItem.parameters) && testItem.parameters.length > 0
        ? testItem.parameters.map(p => ({
            name: p.name || '',
            referenceRange: p.referenceRange || '',
            unit: p.unit || '',
            fieldType: p.fieldType || 'Number',
            gender: p.gender || 'Both',
            valueOptions: Array.isArray(p.valueOptions) ? p.valueOptions : []
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
                <button
                  type="button"
                  onClick={() => handleApplyPreset('KALA_AZAR')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  KALA AZAR
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('INSULIN_RANDOM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Insulin Random
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('IRON')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Iron
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HPLC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HPLC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HSCRP')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Hscrp
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HSV2_IGG')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HSV-2 IgG
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ICALCIUM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  iCalcium
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('IGA_URINE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  IgA (Urine)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('INDIRECT_COOMBS')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Indirect Coomb&apos;s Test
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('IRON_STUDIES')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Iron Studies
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('LH')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  LH
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('LIPASE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Lipase
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('LDL_CHOLESTEROL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  LDL Cholesterol
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('LDL_HDL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  LDL/HDL
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('LEUKEMIA_DLC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Leukemia DLC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HOMOCYSTEINE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Homocysteine
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HIV_CARD')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HIV (Card Test)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HIV_ELISA')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HIV ELISA I/II
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HCV')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HCV
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HCT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HCT
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HB')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HB
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HAV_IGM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HAV IgM
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('H_ALB')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  H-ALB
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('GTT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  GTT
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('GRAMS_STAIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Gram&apos;s Stain
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('GTT_PREGNANCY')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  GTT (Pregnancy)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('GLOBULIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Globulin
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('GGT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  GGT
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('GCT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  GCT
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('G6PD')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  G6PD
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FUNGAL_SCRAPING_SMEAR')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Fungal Scraping Smear
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FSH')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  FSH
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FT3')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  FT3
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FT4')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  FT4
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FOLIC_ACID')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Folic Acid
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FREE_PSA')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Free PSA
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DHEA')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  DHEA
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DIABETIC_PACKAGE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Diabetic Package
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DLC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  DLC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ESTRADIOL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Estradiol
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FERRITIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Ferritin
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('EGFR')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  eGFR
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DENGUE_NS1')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Dengue NS1 Antigen
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DLC_LEUKEMIA')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  DLC Leukemia
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('LIPID_PROFILE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Lipid Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HBEAG')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HBeAg
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HBSAG')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HBsAg
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HBSAG_ELISA')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HBsAg ELISA
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HB_TLC_DLC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HB, TLC, DLC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ESR')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  ESR
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HCV_RNA_QUANT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HCV RNA Quantitative
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HDL_CHOLESTEROL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HDL Cholesterol
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HSV_1_2_IGM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HSV-1/2 IgM
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HSV_2_IGG')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  HSV-2 IgG
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DIALYSIS_PACKAGE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Dialysis Package
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ELECTROLYTES_PANEL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Electrolytes Panel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ESR_WESTERGREN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  ESR(Westergren)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ESR_WINTROBE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  ESR(Wintrobe)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FLUID_EXAMINATION')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Fluid Examination
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FNAC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  FNAC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DIRECT_COOMBS_TEST')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Direct Coombs Test
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DLC_3_PARTS')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  DLC 3 Parts
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('DOUBLE_MARKER')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Double Marker
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FASTING_BLOOD_SUGAR')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Fasting Blood Sugar
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FASTING_INSULIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Fasting Insulin
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('TORCH_PROFILE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  TORCH Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('TLC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  TLC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('TG_HDL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  TG / HDL
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('TESTOSTERONE_TOTAL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Testosterone Total
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('TESTOSTERONE_FREE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Testosterone Free
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('CUSTOM_TEST')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  test
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('T4')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  T4
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('T3')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  T3
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('STOOL_ROUTINE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Stool Routine Examination
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('STOOL_REDUCING_SUBSTANCES')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Stool reducing substances
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SKIN_TEST_LEPROSY')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Skin test for Leprosy
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('STOOL_CS')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Stool/cs
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SGPT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  SGPT
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SGOT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  SGOT
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_ZINC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Zinc
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_UREA')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Urea
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_SODIUM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Sodium
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_PROTEIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Protein
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_POTASSIUM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Potassium
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_PHOSPHORUS')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Phosphorus
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_LDH')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum LDH
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_IGM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum IgM
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_ELECTROLYTE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Electrolyte
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_ALBUMIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Albumin
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_ALKALINE_PHOSPHATASE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Alkaline Phosphatase
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_AMYLASE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Amylase
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_BILIRUBIN_DIRECT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Bilirubin (Direct)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_BILIRUBIN_INDIRECT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Bilirubin (Indirect)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_CALCIUM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Calcium
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_CORTISOL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Cortisol
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('RUBELLA_IGM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Rubella IgM
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SCRUB_TYPHUS')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Scrub Typhus
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SERUM_CHLORIDE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Serum Chloride
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('RHEUMATOID_FACTOR_QUANTITATIVE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Rheumatoid Factor (RA) Quant.
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
              {previewTest.notes && previewTest.notes !== previewTest.interpretation && (
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
