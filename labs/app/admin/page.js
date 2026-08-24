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
    } else if (presetType === 'WEIL_FELIX') {
      setReportForm({
        title: 'WEIL FELIX TEST, SERUM',
        test: 'WEIL FELIX TEST, SERUM',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '4 Hours',
        description: 'The Weil-Felix test is a tube agglutination serological test for the presumptive diagnosis of rickettsial infections using Proteus vulgaris (OX-19, OX-2) and Proteus mirabilis (OX-K) antigens.',
        interpretation: `Test Principle & Clinical Significance:
The Weil-Felix test is an agglutination test based on the cross-reaction of antibodies produced against Rickettsial species with the somatic (O) antigens of certain non-motile Proteus strains (OX-19, OX-2, and OX-K).

Differential Agglutination Patterns:
1. Epidemic & Endemic Typhus (Rickettsia prowazekii, R. typhi):
   • Proteus Antigen OX 19: Strongly Positive (>= 1:160)
   • Proteus Antigen OX 2: Weakly Positive / Negative
   • Proteus Antigen OX K: Negative

2. Spotted Fever Group (Rocky Mountain Spotted Fever / Indian Tick Typhus - R. rickettsii, R. conorii):
   • Proteus Antigen OX 19: Strongly Positive (>= 1:160)
   • Proteus Antigen OX 2: Strongly Positive (>= 1:160)
   • Proteus Antigen OX K: Negative

3. Scrub Typhus (Orientia tsutsugamushi):
   • Proteus Antigen OX 19: Negative
   • Proteus Antigen OX 2: Negative
   • Proteus Antigen OX K: Strongly Positive (>= 1:160)

4. Q Fever (Coxiella burnetii):
   • Proteus Antigen OX 19: Negative
   • Proteus Antigen OX 2: Negative
   • Proteus Antigen OX K: Negative

Diagnostic Titres:
• Baseline Titres: Titres < 1:80 are considered non-significant / negative and may be present in healthy individuals or due to past infections.
• Significant Titre: A single titre of >= 1:160 (or >= 1:80 in non-endemic areas) in a patient with compatible clinical findings (acute febrile illness, headache, maculopapular rash, eschar) is suggestive of active Rickettsial infection.
• Convalescent Testing: A four-fold or greater rise in antibody titre between paired acute and convalescent phase sera (collected 10-14 days apart) is diagnostically conclusive.
• Cross-Reactivity: False-positive results may be seen in urinary tract infections caused by Proteus species, Leptospirosis, Relapsing fever, and severe chronic liver disease.
• Correlation: Results should always be clinically correlated and confirmed with IFA, ELISA, or PCR where available.`,
        parameters: [
          {
            name: 'Proteus Antigen OX 19',
            referenceRange: '< 1:80',
            unit: 'Titre',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (< 1:20)', isAbnormal: false },
              { value: '1:20', isAbnormal: false },
              { value: '1:40', isAbnormal: false },
              { value: '1:80', isAbnormal: false },
              { value: '1:160', isAbnormal: true },
              { value: '1:320', isAbnormal: true },
              { value: '1:640', isAbnormal: true },
              { value: '1:1280', isAbnormal: true },
              { value: 'Positive', isAbnormal: true },
              { value: 'Negative', isAbnormal: false }
            ]
          },
          {
            name: 'Proteus Antigen OX 2',
            referenceRange: '< 1:80',
            unit: 'Titre',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (< 1:20)', isAbnormal: false },
              { value: '1:20', isAbnormal: false },
              { value: '1:40', isAbnormal: false },
              { value: '1:80', isAbnormal: false },
              { value: '1:160', isAbnormal: true },
              { value: '1:320', isAbnormal: true },
              { value: '1:640', isAbnormal: true },
              { value: '1:1280', isAbnormal: true },
              { value: 'Positive', isAbnormal: true },
              { value: 'Negative', isAbnormal: false }
            ]
          },
          {
            name: 'Proteus Antigen OX K',
            referenceRange: '< 1:80',
            unit: 'Titre',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (< 1:20)', isAbnormal: false },
              { value: '1:20', isAbnormal: false },
              { value: '1:40', isAbnormal: false },
              { value: '1:80', isAbnormal: false },
              { value: '1:160', isAbnormal: true },
              { value: '1:320', isAbnormal: true },
              { value: '1:640', isAbnormal: true },
              { value: '1:1280', isAbnormal: true },
              { value: 'Positive', isAbnormal: true },
              { value: 'Negative', isAbnormal: false }
            ]
          }
        ]
      });
    } else if (presetType === 'WBC_COUNT') {
      setReportForm({
        title: 'WBC Count',
        test: 'WBC Count',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '2 Hours',
        description: 'Total White Blood Cell (WBC) / Leukocyte count measurement in blood to evaluate immune status, infections, inflammation, and hematologic disorders.',
        interpretation: `Clinical Interpretation & Physiological Significance:
White Blood Cells (WBCs) / Leukocytes are vital cellular components of the immune system responsible for defending the body against infectious organisms and foreign substances.

Reference Range:
• Adults (Male & Female): 3,500 - 10,500 mcL (or cells/mcL)

Clinical Significance:
1. Elevated WBC Count (Leukocytosis - > 10,500 mcL):
   • Acute bacterial, viral, fungal, or parasitic infections
   • Systemic inflammatory conditions (e.g., Rheumatoid arthritis, Vasculitis, IBD)
   • Tissue necrosis / injury (e.g., Trauma, Burns, Myocardial infarction)
   • Physical or emotional stress, strenuous exercise, pregnancy
   • Corticosteroid therapy or medication-induced
   • Myeloproliferative disorders and Leukemias (e.g., CML, AML, CLL)

2. Decreased WBC Count (Leukopenia - < 3,500 mcL):
   • Viral infections (e.g., Dengue, HIV, Viral Hepatitis, Influenza)
   • Bone marrow suppression or failure (e.g., Aplastic anemia, myelodysplastic syndrome)
   • Chemotherapy, radiotherapy, or immunosuppressive drugs
   • Autoimmune destruction (e.g., Systemic Lupus Erythematosus)
   • Severe overwhelming bacterial infections (Septic shock)
   • Nutritional deficiencies (Vitamin B12 or Folate deficiency)

Note:
Total WBC count should be evaluated in conjunction with the Differential Leukocyte Count (DLC: Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils) and clinical presentation for accurate diagnosis.`,
        parameters: [
          {
            name: 'WBC Count',
            referenceRange: '3,500 - 10,500',
            unit: 'mcL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'VLDL_CHOLESTEROL') {
      setReportForm({
        title: 'VLDL Cholesterol',
        test: 'VLDL Cholesterol',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum (Fasting)',
        turnaroundTime: '4 Hours',
        description: 'Quantitative measurement or estimation of Very Low-Density Lipoprotein (VLDL) cholesterol in serum to evaluate lipid metabolism and cardiovascular risk.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Very Low-Density Lipoprotein (VLDL) cholesterol is synthesized by the liver and serves as the primary transport vehicle for endogenously produced triglycerides in circulation. Elevated VLDL is an atherogenic risk factor linked to coronary artery disease, metabolic syndrome, and pancreatitis.

Reference Range:
• Desirable: 5 - 40 mg/dl (or < 30 mg/dl fasting)

Clinical Significance:
1. Elevated VLDL Cholesterol (> 40 mg/dl):
   • Familial hypertriglyceridemia / Type IV and Type IIb hyperlipoproteinemia
   • Metabolic Syndrome and Type 2 Diabetes Mellitus (due to insulin resistance)
   • Obesity, sedentary lifestyle, and high-glycemic/high-fat diet
   • Chronic alcohol excess
   • Chronic kidney disease / Nephrotic syndrome
   • Hypothyroidism
   • Increased risk for atherosclerotic cardiovascular disease (ASCVD) and acute pancreatitis (when triglycerides > 500 mg/dl)

2. Decreased VLDL Cholesterol (< 5 mg/dl):
   • Severe malnutrition or malabsorption states
   • Abetalipoproteinemia / Hypobetalipoproteinemia
   • Severe chronic liver parenchymal damage
   • Hyperthyroidism

Estimation & Notes:
• In standard lipid panels, VLDL is commonly estimated using the Friedewald formula (VLDL = Triglycerides / 5), valid when fasting triglycerides are < 400 mg/dl.
• A 10–12 hour overnight fast is recommended for accurate testing.`,
        parameters: [
          {
            name: 'VLDL Cholesterol',
            referenceRange: '5 - 40',
            unit: 'mg/dl',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'VITAMIN_D3') {
      setReportForm({
        title: 'Vitamin D3',
        test: 'Vitamin D3',
        category: 'LAB',
        basePrice: 1200,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '24 Hours',
        description: 'Quantitative measurement of 25-Hydroxy Vitamin D / Vitamin D3 in serum to evaluate vitamin D status, bone mineralization, and calcium homeostasis.',
        interpretation: `Physiological Basis:
The vitamin D system functions to maintain serum calcium levels. Vitamin D is a fat-soluble steroid hormone. Two molecular forms exist: D3 (cholecalciferol), synthesized in the epidermis, and D2 (ergocalciferol), derived from plant sources. To become active, both need to be further metabolized. Two sequential hydroxylations occur: in the liver to 25(OH)D and then, in the kidney, to 1,25[OH] 2 D. Besides consequences for bone health, vitamin D deficiency reportedly is associated with a number of conditions such as cardiovascular disease, autoimmunity and cancer; however, evidence-based cause-and-effect relationships have not been established. 

Interpretation
Increased in:  Heavy milk drinkers (up to 64 ng/mL), vitamin D intoxication, sun exposure.
Decreased in:  Dietary deficiency, malabsorption, rickets, osteomalacia, biliary and portal cirrhosis, nephrotic syndrome, renal failure, inadequate sun exposure, advanced age (> 70), primary hyperparathyroidism.
Drugs: Phenytoin, phenobarbital. 

Comments:
Serum or plasma total 25(OH)D is an integrated marker of vitamin D status, incorporating endogenous synthesis from solar exposure, dietary intake, fortified products and/or supplements. There is no universal or strong evidence-based consensus on the appropriate level of 25(OH)D level. However, according to a 2011 US Institute of Medicine Report, a 25(OH)D level of 20–30 ng/mL is all that is needed for bone and general health, and nearly everyone (97.5%) in the general population is in that range. A 25(OH)D level above 30 ng/mL has not been consistently associated with increased health benefits, and, in fact, risks have been identified for outcomes at levels above 50 ng/mL. Routine screening for vitamin D deficiency is not necessary. Patients with the following conditions should be considered for testing: osteoporosis, osteomalacia, malabsorption, liver disease, pancreatic insufficiency, chronic kidney disease, COPD, bariatric surgery, cancer, bedridden or home-bound, obesity, taking anticonvulsants or long-term glucocorticoids, atraumatic fractures, elderly (> 70 years old), and chronic inflammatory conditions.`,
        parameters: [
          {
            name: '25 Hydroxy (OH) Vitamin D',
            referenceRange: '30 - 100',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'VITAMIN_B12') {
      setReportForm({
        title: 'Vitamin B12',
        test: 'Vitamin B12',
        category: 'LAB',
        basePrice: 850,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '24 Hours',
        description: 'Quantitative measurement of Vitamin B12 (Cobalamin) in serum to diagnose megaloblastic anemia, neuropathy, and malabsorption syndromes.',
        interpretation: `Physiologic Basis
Vitamin B12 is a necessary cofactor for three important biochemical processes: conversion of methylmalonyl-CoA to succinyl-CoA and methylation of homocysteine to methionine and demethylation of methyltetrahydrofolate to tetra-hydrofolate (THF). All vitamin B12 comes from ingestion of foods of animal origin. Vitamin B12 in serum is protein bound, 70% to transcobalamin I (TC I) and 30% to transcobalamin II (TC II). The B12 bound to TC II is physiologically active; that bound to TC I is not.

Interpretation 
Increased in: Leukemia (acute myelocytic, chronic myelocytic, chronic lymphocytic, monocytic), marked leukocytosis, polycythemia vera.
Decreased in: Pernicious anemia, gastrectomy, gastric carcinoma, malabsorption, pregnancy, dietary deficiency, HIV infection, chronic high-flux hemodialysis, Alzheimer disease, drugs (eg, omeprazole, metformin, carbamazepine).

Comments
Low serum B12 levels warrant treatment; intermediate levels should be followed by repeated serum tests or by urine methylmalonic acid tests, as well as by serum homocysteine levels. Neurologic disorders caused by low serum B12 level can occur in the absence of macrocytic anemia or pancytopenia.`,
        parameters: [
          {
            name: 'Vitamin B12',
            referenceRange: '211 - 911',
            unit: 'pg/ml',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'VDRL') {
      setReportForm({
        title: 'VDRL',
        test: 'VDRL',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '4 Hours',
        description: 'Venereal Disease Research Laboratory (VDRL) non-treponemal serological test for the screening and treatment monitoring of Syphilis (Treponema pallidum).',
        interpretation: `Result | Remarks
Reactive | Indicates the presence of IgM & IgG antibodies against non-treponemal antigens
Non-Reactive | Indicates absence of IgM & IgG antibodies against non-treponemal antigens

Note:
1. Titers of ≥1: 8 and rising titres are significant.
2. Positive result indicates ongoing or recent infection and the diagnosis should be confirmed by specific Treponemal tests such as TPHA & FTA- Abs.
3. The reactivity will vary with the Primary (60-86%), Secondary (99%) and Tertiary (98%) stage of Syphilis.
4. False positive results may be observed in patients of Malaria, Hepatitis, Mumps, Leprosy, Infectious Mononucleosis, Rheumatoid Arthritis and Collagen disease.
5. False negative reaction may be due to processing of sample collected early in the course of disease, immunosuppression and due to prozone effect.

Uses :
- To screen for presence and monitor the progression of Syphilis infection.
- To assess the response to therapy (decreasing titres) in patients being treated for Syphilis.`,
        parameters: [
          {
            name: 'VDRL',
            referenceRange: 'Non-Reactive',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Non-Reactive', isAbnormal: false },
              { value: 'Reactive', isAbnormal: true },
              { value: 'Weakly Reactive', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_SUGAR_RANDOM') {
      setReportForm({
        title: 'Urine Sugar Random',
        test: 'Urine Sugar Random',
        category: 'LAB',
        basePrice: 60,
        taxPercentage: 0,
        sampleType: 'Urine (Random)',
        turnaroundTime: '1 Hour',
        description: 'Semi-quantitative detection of glucose/sugar in random urine sample to screen for glycosuria, diabetes mellitus, and renal tubular disorders.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Under normal physiological conditions, glucose is completely filtered by the glomeruli and reabsorbed by the proximal convoluted tubules of the kidneys, resulting in undetectable levels of glucose (Nil/Negative) in the urine.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Glycosuria with Hyperglycemia (Exceeding Renal Threshold ~180 mg/dL):
   • Diabetes Mellitus (Type 1 and Type 2)
   • Gestational Diabetes
   • Endocrine disorders (e.g., Cushing syndrome, Acromegaly, Hyperthyroidism, Pheochromocytoma)
   • Acute severe stress, intracranial trauma, pancreatitis

2. Renal Glycosuria (Normal Blood Glucose with Lowered Renal Threshold):
   • Hereditary renal glycosuria (benign defect in proximal tubular glucose transport)
   • Pregnancy (physiologically lowered renal glucose threshold)
   • Fanconi syndrome and renal tubular acidosis
   • Drug-induced tubular dysfunction (e.g., SGLT2 inhibitors like Dapagliflozin, Empagliflozin)

Note:
A positive urine sugar test should always be correlated with simultaneous blood glucose testing (FBS, PPBS, RBS, or HbA1c) to distinguish between diabetes mellitus and renal glycosuria.`,
        parameters: [
          {
            name: 'Urine Sugar Random',
            referenceRange: 'Nil',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Nil', isAbnormal: false },
              { value: 'Negative', isAbnormal: false },
              { value: 'Trace', isAbnormal: true },
              { value: '+ (0.25 g/dL)', isAbnormal: true },
              { value: '++ (0.5 g/dL)', isAbnormal: true },
              { value: '+++ (1.0 g/dL)', isAbnormal: true },
              { value: '++++ (2.0 g/dL or more)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_SUGAR_PP') {
      setReportForm({
        title: 'Urine Sugar PP',
        test: 'Urine Sugar PP',
        category: 'LAB',
        basePrice: 60,
        taxPercentage: 0,
        sampleType: 'Urine (Postprandial - 2 hrs after meal)',
        turnaroundTime: '1 Hour',
        description: 'Semi-quantitative estimation of postprandial glucose excretion in urine collected 2 hours after a meal for diabetic evaluation and glucose tolerance assessment.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Urine Sugar Postprandial (PP) evaluates the excretion of glucose in urine collected 2 hours after a meal. Under normal physiological conditions in non-diabetic individuals, postprandial blood glucose does not exceed the renal threshold (~180 mg/dL), resulting in absence of glucose (Nil/Negative) in the urine.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Postprandial Glycosuria with Hyperglycemia:
   • Uncontrolled or poorly managed Diabetes Mellitus (Type 1 and Type 2)
   • Impaired Glucose Tolerance (IGT)
   • Gestational Diabetes Mellitus
   • High-carbohydrate meal ingestion exceeding temporary renal threshold in susceptible individuals

2. Postprandial Glycosuria without Significant Hyperglycemia (Renal Glycosuria):
   • Reduced renal threshold for glucose
   • Pregnancy
   • Proximal renal tubular disorders (e.g., Fanconi syndrome)
   • SGLT2 inhibitor therapy (Dapagliflozin, Empagliflozin, Canagliflozin)

Note:
Urine Sugar PP should be evaluated alongside simultaneous Blood Glucose Postprandial (PPBS) and HbA1c for optimal diabetic assessment and treatment monitoring.`,
        parameters: [
          {
            name: 'Urine Sugar PP',
            referenceRange: 'Nil',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Nil', isAbnormal: false },
              { value: 'Negative', isAbnormal: false },
              { value: 'Trace', isAbnormal: true },
              { value: '+ (0.25 g/dL)', isAbnormal: true },
              { value: '++ (0.5 g/dL)', isAbnormal: true },
              { value: '+++ (1.0 g/dL)', isAbnormal: true },
              { value: '++++ (2.0 g/dL or more)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_SUGAR_FASTING') {
      setReportForm({
        title: 'Urine Sugar Fasting',
        test: 'Urine Sugar Fasting',
        category: 'LAB',
        basePrice: 60,
        taxPercentage: 0,
        sampleType: 'Urine (Fasting - Early morning / overnight fast)',
        turnaroundTime: '1 Hour',
        description: 'Semi-quantitative estimation of fasting glucose excretion in urine collected after an overnight fast (8-12 hours) for diabetic screening and evaluation.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Urine Sugar Fasting evaluates the presence of glucose in urine collected after an overnight fast (8-12 hours). Under normal physiological conditions in healthy individuals, fasting blood glucose is well below the renal threshold (~180 mg/dL), resulting in complete tubular reabsorption and no glucose (Nil/Negative) in the urine.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Fasting Glycosuria with Hyperglycemia:
   • Severe or uncontrolled Diabetes Mellitus (Type 1 and Type 2)
   • Severe nocturnal or early morning hyperglycemia (Somogyi effect / Dawn phenomenon)
   • Endocrine disorders causing secondary diabetes (e.g., Cushing syndrome, Pheochromocytoma)

2. Fasting Glycosuria with Normal Blood Glucose (Renal Glycosuria):
   • Hereditary renal glycosuria (impaired tubular reabsorption of glucose)
   • Pregnancy-associated lowering of renal glucose threshold
   • Renal tubular dysfunction (e.g., Fanconi syndrome, heavy metal toxicity)
   • Use of SGLT2 inhibitor medications (e.g., Dapagliflozin, Empagliflozin)

Note:
Fasting urine glucose is a screening test and should always be evaluated alongside Fasting Blood Sugar (FBS), Postprandial Blood Sugar (PPBS), and HbA1c for clinical confirmation.`,
        parameters: [
          {
            name: 'Urine Sugar Fasting',
            referenceRange: 'Nil',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Nil', isAbnormal: false },
              { value: 'Negative', isAbnormal: false },
              { value: 'Trace', isAbnormal: true },
              { value: '+ (0.25 g/dL)', isAbnormal: true },
              { value: '++ (0.5 g/dL)', isAbnormal: true },
              { value: '+++ (1.0 g/dL)', isAbnormal: true },
              { value: '++++ (2.0 g/dL or more)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_PROTEIN_CREATININE') {
      setReportForm({
        title: 'Urine Protein/Creatinine',
        test: 'Urine Protein/Creatinine',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Urine (Spot / Random - First morning preferred)',
        turnaroundTime: '4 Hours',
        description: 'URINE PROTEIN/CREATININE RATIO (UPCR) quantitative estimation in spot urine to evaluate proteinuria and renal disease progression.',
        interpretation: `Reference Interpretation (Adults)

• < 0.2 → Normal
• 0.2 – 0.5 → Mild proteinuria
• 0.5 – 3.0 → Moderate proteinuria
• > 3.0 → Nephrotic range proteinuria

Clinical Significance:
The Urine Protein/Creatinine Ratio (UPCR) on a spot/random urine sample correlates strongly with 24-hour urinary protein excretion (mg/24 hours) and avoids the collection errors of a 24-hour urine collection.

Clinical Applications:
1. Diagnosis and quantitative grading of proteinuria in chronic kidney disease (CKD), diabetic nephropathy, glomerulonephritis, and hypertension.
2. Screening and diagnosis of preeclampsia in pregnancy.
3. Monitoring response to antiproteinuric and immunosuppressive therapy.`,
        parameters: [
          {
            name: 'Urine for creatinine',
            referenceRange: '20 - 320',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Urine for Protein',
            referenceRange: '< 15',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Urine Protein Creatinine Ratio',
            referenceRange: '< 0.2',
            unit: 'mg/mg',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_PROTEIN') {
      setReportForm({
        title: 'Urine for Protein',
        test: 'Urine for Protein',
        category: 'LAB',
        basePrice: 60,
        taxPercentage: 0,
        sampleType: 'Urine (Spot / Random - Early morning preferred)',
        turnaroundTime: '1 Hour',
        description: 'Semi-quantitative detection of protein in urine to screen for proteinuria, renal glomerular and tubular diseases, and preeclampsia.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Normal glomerular capillaries restrict the filtration of high-molecular-weight plasma proteins, and filtered low-molecular-weight proteins are largely reabsorbed and catabolized by proximal renal tubular cells. As a result, minimal protein (Nil / Negative) is excreted in the urine of healthy individuals.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Glomerular Proteinuria (Increased Glomerular Permeability):
   • Nephrotic syndrome (Membranous nephropathy, Minimal change disease, FSGS)
   • Glomerulonephritis (IgA nephropathy, Post-streptococcal, Lupus nephritis)
   • Diabetic nephropathy
   • Hypertensive nephrosclerosis

2. Tubular Proteinuria (Decreased Tubular Reabsorption):
   • Acute tubular necrosis (ATN)
   • Interstitial nephritis
   • Fanconi syndrome
   • Heavy metal poisoning / toxic nephropathy

3. Overflow Proteinuria (Excess Low Molecular Weight Proteins in Plasma):
   • Multiple myeloma (Bence Jones proteins / Free light chains)
   • Rhabdomyolysis (Myoglobinuria)
   • Intravascular hemolysis (Hemoglobinuria)

4. Transient / Functional Proteinuria:
   • High fever, strenuous exercise, severe emotional or physical stress
   • Orthostatic (postural) proteinuria
   • Urinary tract infection (UTI) or hematuria

Note:
Persistent proteinuria on dipstick testing warrants quantitative evaluation (such as Urine Protein/Creatinine Ratio [UPCR] or 24-hour urine protein) and renal function assessment.`,
        parameters: [
          {
            name: 'Urine for Protein',
            referenceRange: 'Nil',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Nil', isAbnormal: false },
              { value: 'Negative', isAbnormal: false },
              { value: 'Trace', isAbnormal: true },
              { value: '+ (30 mg/dL)', isAbnormal: true },
              { value: '++ (100 mg/dL)', isAbnormal: true },
              { value: '+++ (300 mg/dL)', isAbnormal: true },
              { value: '++++ (1000 mg/dL or more)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_MICROALBUMIN') {
      setReportForm({
        title: 'Urine for Microalbumin',
        test: 'Urine for Microalbumin',
        category: 'LAB',
        basePrice: 400,
        taxPercentage: 0,
        sampleType: 'Urine (Spot / Random - First morning preferred)',
        turnaroundTime: '4 Hours',
        description: 'Quantitative / semi-quantitative estimation of microalbumin in urine to detect early diabetic nephropathy and renal microvascular disease.',
        interpretation: `Physiological Basis:
The normal urinary albumin excretion is less than 30 mg/24 hr. On random spot urine collection, the albumin-to-creatinine ratio (ACR, mcg/mg) should be less than 30. The term microalbuminuria is defined as a subtle increase in the urinary excretion of albumin that cannot be detected by conventional urinalysis. Specifically, the excretion of 30–300 mg albumin per 24 hours or an ACR of 30–300 (mcg/mg) is considered microalbuminuria (urine albumin is high). 300 mg or more of albumin excretion per day or an ACR of 300 or higher indicates gross albuminuria (urine albumin very high or nephrotic) range. 

Interpretation:
Increased in: Diabetes mellitus, diabetic nephropathy. 

Comments:
Microalbuminuria is a useful indicator of early nephropathy in diabetic patients. Urine albumin measurement requires a sensitive immunochemical assay. Urine dipstick analysis is often insensitive to microalbuminuria. Screening for microalbuminuria is often performed by measurement of the ACR in a random spot collection (preferred method). Twenty-four-hour or timed urine collections are more burdensome.`,
        parameters: [
          {
            name: 'Urine for Microalbumin',
            referenceRange: '< 20 mg/L',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (< 20 mg/L)', isAbnormal: false },
              { value: 'Microalbuminuria (20 - 200 mg/L)', isAbnormal: true },
              { value: 'Macroalbuminuria (> 200 mg/L)', isAbnormal: true },
              { value: 'Normal (< 30 mg/24hr)', isAbnormal: false },
              { value: 'Positive', isAbnormal: true },
              { value: 'Negative', isAbnormal: false }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_KETONE') {
      setReportForm({
        title: 'Urine for Ketone',
        test: 'Urine for Ketone',
        category: 'LAB',
        basePrice: 60,
        taxPercentage: 0,
        sampleType: 'Urine (Spot / Fresh Random)',
        turnaroundTime: '1 Hour',
        description: 'Semi-quantitative detection of ketone bodies in urine to screen for diabetic ketoacidosis (DKA), starvation ketosis, and metabolic disturbances.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Ketone bodies (acetoacetic acid, beta-hydroxybutyric acid, and acetone) are intermediate products of fatty acid metabolism. In healthy individuals on a standard diet, ketones are completely metabolized by peripheral tissues and are not detectable in urine (Nil / Negative).

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Diabetic Ketoacidosis (DKA):
   • Severe, potentially life-threatening complication of uncontrolled Type 1 (and sometimes Type 2) Diabetes Mellitus, characterized by hyperglycemia, ketonuria, ketonemia, and metabolic acidosis.

2. Non-Diabetic Ketonuria (Carbohydrate Deprivation / Increased Fat Catabolism):
   • Prolonged fasting, starvation, or extreme ketogenic diets
   • Hyperemesis gravidarum (severe pregnancy nausea and vomiting)
   • Severe vomiting, diarrhea, or dehydration in children
   • High fever, strenuous prolonged exercise, cachexia
   • Alcoholic ketoacidosis
   • Inborn errors of metabolism (e.g., glycogen storage diseases, organic acidemias)

Note:
Urine dipstick tests primarily detect acetoacetic acid (and to a lesser degree acetone), but do not measure beta-hydroxybutyrate. In critical situations (suspected DKA), quantitative serum beta-hydroxybutyrate, blood gases, and electrolytes should be measured.`,
        parameters: [
          {
            name: 'Urine for Ketone',
            referenceRange: 'Nil',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Nil', isAbnormal: false },
              { value: 'Negative', isAbnormal: false },
              { value: 'Trace (5 mg/dL)', isAbnormal: true },
              { value: '+ (Small / 15 mg/dL)', isAbnormal: true },
              { value: '++ (Moderate / 40 mg/dL)', isAbnormal: true },
              { value: '+++ (Large / 80 mg/dL)', isAbnormal: true },
              { value: '++++ (Large / 160 mg/dL)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_FUNGAL') {
      setReportForm({
        title: 'Urine for Fungal',
        test: 'Urine for Fungal',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Urine (Clean-catch Midstream / Catheterized)',
        turnaroundTime: '2 Hours',
        description: 'Microscopic examination of urine sediment wet mount / Gram stain for yeast cells, budding cells, and pseudohyphae (funguria/candiduria).',
        interpretation: `Clinical Interpretation & Physiological Significance:
Normal human urine is typically sterile and free from fungal elements (yeast cells or pseudohyphae). The presence of fungal elements in urine (Funguria / Candiduria) can indicate colonization, local urinary tract infection (cystitis, pyelonephritis), or disseminated candidiasis/fungal infection.

Reference Value:
• Normal / Healthy: Absent (Nil / Negative)

Clinical Significance:
1. Asymptomatic Candiduria:
   • Frequently seen in catheterized patients, prolonged hospitalization, or elderly patients.
   • Often represents benign colonization of the catheter or lower urinary tract.

2. Symptomatic Fungal Urinary Tract Infection:
   • Fungal cystitis, pyelonephritis, renal abscess, or fungal balls (bezoars) in the collecting system.
   • Common risk factors include Diabetes Mellitus, broad-spectrum antibiotic therapy, immunosuppression (corticosteroids, chemotherapy, HIV), urinary tract obstruction, or indwelling Foley catheters.

3. Disseminated / Invasive Fungal Infection:
   • Candiduria in immunocompromised or neutropenic patients may be a manifestation of hematogenous renal seeding from systemic candidiasis.

Note:
Microscopic examination of urine wet mount / Gram stain detects budding yeast cells and pseudohyphae. Urine fungal culture and speciation (e.g., Candida albicans, Candida tropicalis, Candida glabrata) is recommended for identifying the causative species and antifungal susceptibility testing.`,
        parameters: [
          {
            name: 'Urine for Fungal',
            referenceRange: 'Absent',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Absent', isAbnormal: false },
              { value: 'Nil', isAbnormal: false },
              { value: 'Negative', isAbnormal: false },
              { value: 'Present', isAbnormal: true },
              { value: 'Few Yeast Cells Seen', isAbnormal: true },
              { value: 'Moderate Yeast Cells with Pseudohyphae Seen', isAbnormal: true },
              { value: 'Plenty Yeast Cells with Pseudohyphae Seen', isAbnormal: true },
              { value: 'Candida species Seen', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_ELISA_PREGNANCY') {
      setReportForm({
        title: 'Urine for ELISA (Pregnancy)',
        test: 'Urine for ELISA (Pregnancy)',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Urine (Early morning first-void preferred)',
        turnaroundTime: '1 Hour',
        description: 'Detection of Human Chorionic Gonadotropin (hCG) in urine by ELISA / Immunochromatographic method for confirmation of pregnancy.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Human Chorionic Gonadotropin (hCG) is a glycoprotein hormone produced by the syncytiotrophoblast cells of the placenta following implantation of a fertilized ovum. Urine ELISA / immunochromatographic assays detect the presence of beta-hCG (typically at concentrations ≥ 20–25 mIU/mL) in urine.

Reference Value:
• Non-Pregnant Females / Males: Negative (< 5 mIU/mL)

Clinical Significance:
1. Positive Result:
   • Confirms intrauterine pregnancy (detectable as early as 7–10 days post-conception or by the first missed menstrual period).
   • Other conditions associated with elevated hCG:
     - Ectopic pregnancy
     - Gestational trophoblastic disease (Hydatidiform mole, Choriocarcinoma)
     - Germ cell tumors producing hCG (e.g., ovarian teratoma, dysgerminoma, testicular choriocarcinoma)

2. Negative Result:
   • Absence of pregnancy or hCG level below the analytical sensitivity threshold of the assay (e.g., early gestation before expected menses).
   • Very dilute urine sample (low specific gravity).

Note:
For optimal sensitivity, an early morning first-void urine sample is recommended as it contains the highest concentration of hCG. If pregnancy is clinically suspected despite a negative or weakly positive urine result, retesting in 48–72 hours or a quantitative Serum Beta-hCG blood test is recommended.`,
        parameters: [
          {
            name: 'Urine for ELISA (Pregnancy)',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true },
              { value: 'Weakly Positive', isAbnormal: true },
              { value: 'Equivocal', isAbnormal: true },
              { value: 'Borderline', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_CREATININE') {
      setReportForm({
        title: 'Urine for creatinine',
        test: 'Urine for creatinine',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Urine (Spot / Random or 24-Hour)',
        turnaroundTime: '2 Hours',
        description: 'Quantitative estimation of creatinine excretion in urine to evaluate glomerular filtration, muscle catabolism, and ratio indices.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Creatinine is a non-protein nitrogenous end product of muscle creatine phosphate catabolism. It is produced at a relatively constant rate proportional to muscle mass and excreted by the kidneys primarily through glomerular filtration with negligible tubular secretion and reabsorption. Urinary creatinine measurement is used to assess renal clearance, evaluate muscle wasting disorders, and standardize concentrations of other excreted urinary analytes (such as albumin and total protein) in spot urine samples.

Reference Ranges:
• Spot / Random Urine: 20 – 320 mg/dL
• 24-Hour Urine Collection:
  - Adult Males: 1,000 – 2,000 mg/24 hours (1.0 – 2.0 g/day)
  - Adult Females: 800 – 1,800 mg/24 hours (0.8 – 1.8 g/day)

Clinical Significance:
1. Decreased Urinary Creatinine:
   • Impaired Glomerular Filtration / Renal Failure (Acute Kidney Injury, Chronic Kidney Disease)
   • Reduced muscle mass (Muscular dystrophy, Amyotrophic lateral sclerosis, severe cachexia)
   • Incomplete 24-hour urine collection
   • Severe hyperthyroidism, advanced liver disease

2. Increased Urinary Creatinine:
   • High dietary meat intake / creatine supplementation
   • Strenuous physical exercise / Rhabdomyolysis
   • Early diabetic nephropathy (hyperfiltration stage)
   • Gigantism, acromegaly, hypopituitarism
   • Catabolic states / severe tissue breakdown

Note:
Measurement of urinary creatinine in a spot urine sample is essential for calculating the Albumin-to-Creatinine Ratio (ACR) and Protein-to-Creatinine Ratio (UPCR) to adjust for variations in urinary concentration.`,
        parameters: [
          {
            name: 'Urine for creatinine',
            referenceRange: '20 - 320',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_CHYLE') {
      setReportForm({
        title: 'Urine for Chyle',
        test: 'Urine for Chyle',
        category: 'LAB',
        basePrice: 100,
        taxPercentage: 0,
        sampleType: 'Urine (Spot / Random - Postprandial / post-fat meal preferred)',
        turnaroundTime: '2 Hours',
        description: 'Detection of chyle (lymph and fat/chylomicrons) in urine to evaluate chyluria, filarial lymphatic obstruction, and lymphatic-urinary fistulae.',
        interpretation: `Clinical Interpretation & Physiological Significance:
Chyluria is the presence of chyle (a milky bodily fluid consisting of lymph and emulsified fats / chylomicrons) in the urine. It occurs due to the formation of an abnormal fistulous communication between the retroperitoneal lymphatic system and the urinary collecting system (pelvicalyceal system, ureter, or bladder).

Reference Value:
• Normal / Healthy: Negative (Absent)

Clinical Significance:
1. Parasitic Causes (Most Common in Endemic Regions):
   • Lymphatic Filariasis caused by Wuchereria bancrofti (leading to lymphatic obstruction, lymphangiectasia, and rupture into urinary tract).

2. Non-Parasitic Causes:
   • Trauma or retroperitoneal / pelvic surgery
   • Retroperitoneal tumors, lymphoma, or granulomatous lymphadenitis (e.g., Tuberculosis)
   • Congenital lymphatic malformations / lymphangiomatosis
   • Thoracic duct obstruction or thrombosis
   • Pregnancy or severe abdominal straining in patients with preexisting lymphatic weakness

Diagnostic Features:
• Appearance: Milky white, opalescent urine, often clearing upon ether / chloroform extraction (Ether Test Positive).
• Staining: Sudan III or Oil Red O positive for fat globules / chylomicrons.
• Urinalysis: High levels of triglycerides and cholesterol, accompanied by proteinuria and lymphocyturia.

Note:
Confirmation is typically performed by the Urine Ether extraction test and measurement of urinary triglycerides (> 15 mg/dL suggests chyluria). High-fat meals prior to testing may accentuate the milky appearance.`,
        parameters: [
          {
            name: 'Urine for Chyle',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative', isAbnormal: false },
              { value: 'Absent', isAbnormal: false },
              { value: 'Positive', isAbnormal: true },
              { value: 'Present', isAbnormal: true },
              { value: 'Milky / Turbid (Ether test Positive)', isAbnormal: true },
              { value: 'Trace', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'URINE_FOR_AFB_24_HOURS') {
      setReportForm({
        title: 'Urine for AFB 24 hours',
        test: 'Urine for AFB 24 hours',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Urine (24-Hour Pooled Collection / Concentrated Morning Urine)',
        turnaroundTime: '24 Hours',
        description: 'Microscopic examination of concentrated urine sediment using Ziehl-Neelsen / Acid-Fast stain for detection of Mycobacterium tuberculosis (Genitourinary TB).',
        interpretation: `Clinical Interpretation & Physiological Significance:
Acid-Fast Bacilli (AFB) stain (Ziehl-Neelsen / Kinyoun or Auramine-O fluorescence) on concentrated urine sediment is performed for the detection of Mycobacterium tuberculosis in suspected cases of Genitourinary Tuberculosis (GUTB) or disseminated tuberculosis.

Reference Value:
• Normal / Healthy: Negative (No Acid Fast Bacilli Seen)

Clinical Significance:
1. Positive Result (Acid Fast Bacilli Seen):
   • Strongly suggestive of active Genitourinary Tuberculosis (affecting kidneys, ureters, bladder, prostate, seminal vesicles, or epididymis).
   • Can occasionally be seen in disseminated / miliary tuberculosis or renal tuberculosis in immunocompromised patients (e.g., HIV co-infection).

2. Negative Result:
   • Does not completely rule out Genitourinary Tuberculosis due to intermittent shedding of mycobacteria in urine.
   • Serial morning urine samples (3 to 5 consecutive first-morning clean-catch specimens) or 24-hour pooled collection significantly increase diagnostic yield.

Important Differential & Caution:
• Commensal non-pathogenic mycobacteria (such as Mycobacterium smegmatis, normally present on external genitalia) are acid-fast and can cause false-positive microscopic smear results if the genital area is not thoroughly cleansed prior to collection.
• Confirmation by CBNAAT / GeneXpert MTB/RIF and Mycobacterial Culture (LJ medium / MGIT liquid culture) is recommended for definitive speciation and drug susceptibility testing (DST).`,
        parameters: [
          {
            name: 'Urine for AFB 24 hours',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative (No Acid Fast Bacilli Seen)', isAbnormal: false },
              { value: 'Not Seen', isAbnormal: false },
              { value: 'Positive (Acid Fast Bacilli Seen)', isAbnormal: true },
              { value: '1+ (1-10 AFB / 100 Oil Immersion Fields)', isAbnormal: true },
              { value: '2+ (1-10 AFB / 10 Oil Immersion Fields)', isAbnormal: true },
              { value: '3+ (> 10 AFB / Oil Immersion Field)', isAbnormal: true },
              { value: 'Doubtful / Repeat Sample Advised', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'MAGNESIUM') {
      setReportForm({
        title: 'Magnesium',
        test: 'Magnesium',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Blood Serum',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination of Magnesium level in serum/plasma to assess electrolyte balance, renal function, neuromuscular excitability, and metabolic disorders.',
        interpretation: `Clinical Significance & Physiological Basis:
Magnesium (Mg²⁺) is the fourth most abundant cation in the human body and the second most prevalent intracellular cation after potassium. It acts as an essential cofactor in over 300 metabolic and enzymatic reactions, including adenosine triphosphate (ATP) synthesis, oxidative phosphorylation, glycolysis, DNA and protein synthesis, neuromuscular transmission, and cardiac rhythm regulation. It is also critical in regulating calcium and potassium transport across cell membranes.

Reference Range:
• Normal: 1.8 - 2.6 mg/dL (0.74 - 1.07 mmol/L)

Clinical Interpretation:

1. Hypomagnesemia (< 1.8 mg/dL):
   • Gastrointestinal Causes: Chronic diarrhea, malabsorption syndromes (celiac disease, Crohn's disease), acute pancreatitis, prolonged nasogastric suction, intestinal fistulae.
   • Renal Losses: Diuretic therapy (loop and thiazide diuretics), osmotic diuresis (uncontrolled diabetes mellitus), chronic renal tubular acidosis, hypercalcemia, nephrotoxic drugs (e.g., Aminoglycosides, Amphotericin B, Cisplatin, Cyclosporine, Proton Pump Inhibitors - PPIs).
   • Decreased Intake / Endocrine: Chronic alcoholism, severe malnutrition, total parenteral nutrition (TPN) lacking magnesium, primary/secondary aldosteronism, hyperthyroidism, diabetic ketoacidosis (recovery phase).
   • Clinical Features: Neuromuscular hyperexcitability, tremors, tetany, muscle spasms, positive Chvostek and Trousseau signs, paresthesias, seizures, refractory hypokalemia, hypocalcemia, cardiac arrhythmias (prolonged PR and QT intervals, widening of QRS, ST depression, T wave inversion, Torsades de Pointes).

2. Hypermagnesemia (> 2.6 mg/dL):
   • Renal Failure: Acute Kidney Injury (AKI) or Chronic Kidney Disease (CKD) with reduced glomerular filtration rate (GFR < 30 mL/min).
   • Iatrogenic / Exogenous Overload: Excessive administration of magnesium-containing antacids, laxatives, enemas, or intravenous magnesium sulfate therapy (e.g., for pre-eclampsia/eclampsia, status asthmaticus).
   • Endocrine & Other Causes: Adrenal insufficiency (Addison's disease), hypothyroidism, severe dehydration, diabetic ketoacidosis, tumor lysis syndrome, lithium therapy.
   • Clinical Features: Flushing, warmth, nausea, vomiting, lethargy, loss of deep tendon reflexes (DTRs at 4-6 mg/dL), hypotension, bradycardia, respiratory depression (> 10 mg/dL), cardiac conduction blocks, and cardiac arrest (> 15 mg/dL).

Notes & Clinical Correlations:
• Extracellular magnesium accounts for only ~1% of total body stores; serum levels may not always reflect total intracellular depletion.
• Hypomagnesemia should be suspected in any patient with unexplained refractory hypokalemia or hypocalcemia, as magnesium is essential for sodium-potassium ATPase pump activity and parathyroid hormone (PTH) release.`,
        parameters: [
          {
            name: 'Magnesium',
            referenceRange: '1.8 - 2.6',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'MALARIA_ANTIGEN') {
      setReportForm({
        title: 'Malaria Antigen',
        test: 'Malaria Antigen',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '2 Hours',
        description: 'Qualitative detection of Malaria parasites and antibodies/antigens in whole blood samples for early diagnosis and differentiation.',
        interpretation: `Malaria antigen detection-whole blood
Four species of the plasmodium parasites are responsible for human malaria infections: P. falciparum, P. vivax, P. ovale and P. malariae. Early detection and differentiation of malaria is of paramount importance due to incidence of cerebral malaria and drug resistance associated with P. falciparum malaria causing most of the morbidity and mortality worldwide.

Test Utility
The current test is a qualitative test for detection of the P. falciparum specific histidine rich protein-2 (Pf. HRP-2) and P. vivax specific lactate dehydrogenase (pLDH) in whole blood samples. The assay is able to detect and distinguish P. vivax and P. falciparum infections and also identify mixed infections.

Notes & Limitations
The test detects P. falciparum specific HRP-2 and P. vivax specific LDH, a negative test result does not rule out infection with P. ovale and P. malariae. Constant exposure to the malarial parasites, as seen in areas of high endemicity, may result in positive results with doubtful clinical significance. Hence, the results must always be correlated with clinical history and relevant epidemiological and therapeutic context.`,
        parameters: [
          {
            name: 'IgG',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true },
              { value: 'Non-Reactive', isAbnormal: false },
              { value: 'Reactive', isAbnormal: true }
            ]
          },
          {
            name: 'IgM',
            referenceRange: 'Negative',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true },
              { value: 'Non-Reactive', isAbnormal: false },
              { value: 'Reactive', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'MEAN_CELL_HAEMOGLOBIN' || presetType === 'MCH') {
      setReportForm({
        title: 'Mean Cell Haemoglobin, MCH',
        test: 'Mean Cell Haemoglobin, MCH',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination of Mean Cell Haemoglobin (MCH) in blood to evaluate the average amount of haemoglobin inside a single red blood cell.',
        interpretation: `Clinical Significance & Physiological Basis:
Mean Cell Haemoglobin (MCH) is a standard red blood cell (RBC) index that measures the average mass / amount of haemoglobin contained inside an individual erythrocyte (red blood cell). It is calculated by dividing total haemoglobin concentration by the total red blood cell count:
MCH (pg) = [Haemoglobin (g/dL) × 10] / RBC count (million/µL).

Reference Range:
• Normal / Desirable: 27 - 32 pg (picograms)

Clinical Interpretation:

1. Low MCH (< 27 pg) - Hypochromic Anemia:
   Indicates that red blood cells contain less haemoglobin than normal (hypochromia), usually appearing pale under microscopic peripheral smear examination.
   Common Etiologies:
   • Iron Deficiency Anemia (most common cause due to impaired heme synthesis)
   • Thalassemia Minor / Major (impaired globin chain synthesis)
   • Sideroblastic Anemia (defective iron utilization)
   • Anemia of Chronic Disease / Chronic Inflammation (hepcidin-mediated iron sequestration)
   • Lead Poisoning

2. High MCH (> 32 pg) - Hyperchromic / Macrocytic Anemia:
   Indicates that red blood cells are larger than normal and carry a greater mass of haemoglobin per cell.
   Common Etiologies:
   • Megaloblastic Anemias (Vitamin B12 deficiency, Folate / Folic Acid deficiency, Pernicious anemia)
   • Chronic Liver Disease / Cirrhosis
   • Chronic Alcoholism
   • Hypothyroidism
   • Myelodysplastic Syndromes (MDS)
   • Reticulocytosis (immature red blood cells are larger in volume and carry more haemoglobin)
   • False elevations due to cold agglutinins, hyperlipidemia, or extreme leukocytosis

Clinical Note:
MCH should always be evaluated in conjunction with other red cell indices, including Mean Corpuscular Volume (MCV), Mean Corpuscular Haemoglobin Concentration (MCHC), and Red Cell Distribution Width (RDW), alongside a Complete Blood Count (CBC) and peripheral blood smear review.`,
        parameters: [
          {
            name: 'Mean Cell Haemoglobin, MCH',
            referenceRange: '27 - 32',
            unit: 'Pg',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'MEAN_CELL_HAEMOGLOBIN_CON' || presetType === 'MCHC') {
      setReportForm({
        title: 'Mean Cell Haemoglobin CON, MCHC',
        test: 'Mean Cell Haemoglobin CON, MCHC',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination of Mean Corpuscular Haemoglobin Concentration (MCHC) in blood to evaluate the average concentration of haemoglobin within a given volume of packed red blood cells.',
        interpretation: `Clinical Significance & Physiological Basis:
Mean Cell Haemoglobin Concentration (MCHC) is an essential red blood cell (RBC) index that measures the average concentration of haemoglobin in a given volume of packed erythrocytes (red blood cells). Unlike MCH (which measures the absolute weight of haemoglobin per individual cell), MCHC relates haemoglobin content to total red cell volume.
Calculation formula:
MCHC (%) = [Haemoglobin (g/dL) / Hematocrit / PCV (%)] × 100
or MCHC = [MCH (pg) / MCV (fL)] × 100.

Reference Range:
• Normal: 31.5 - 34.5 % (or 31.5 - 34.5 g/dL)

Clinical Interpretation:

1. Low MCHC (< 31.5 %) - Hypochromia:
   Indicates diminished haemoglobin synthesis relative to erythrocyte cell volume.
   Common Etiologies:
   • Severe Iron Deficiency Anemia (impaired heme synthesis)
   • Thalassemia Syndromes (α-thalassemia, β-thalassemia minor/major)
   • Sideroblastic Anemia
   • Chronic Lead Poisoning
   • Chronic Disease Anemia with severe microcytosis

2. High MCHC (> 34.5 %) - Hyperchromia:
   True physiological hyperchromia is rare because intracellular haemoglobin reaches physical solubility limits (~37 g/dL). An elevated MCHC is a hallmark diagnostic clue for specific conditions.
   Common Etiologies:
   • Hereditary Spherocytosis (erythrocyte membrane defect causing cell dehydration and cellular spherical compaction)
   • Autoimmune Hemolytic Anemia (AIHA - due to spherocyte formation)
   • Sickle Cell Disease and Hemoglobin C Disease
   • Severe Cellular Dehydration / Hypertonic States
   • Laboratory / Pre-analytical Artifacts: Cold agglutinins (RBC clumping), severe hyperlipidemia, lipemia, hemolysis, high bilirubin, or extreme paraproteinemia.

Clinical Note:
MCHC provides an internal laboratory quality control check. An unusually elevated MCHC (> 36 %) often prompts investigation for cold agglutinins, lipemia, or hereditary spherocytosis. MCHC should always be interpreted in conjunction with MCV, MCH, RDW, and peripheral blood smear examination.`,
        parameters: [
          {
            name: 'Mean Cell Haemoglobin CON, MCHC',
            referenceRange: '31.5 - 34.5',
            unit: '%',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'MEAN_CORPUSCULAR_VOLUME' || presetType === 'MCV') {
      setReportForm({
        title: 'Mean Corpuscular Volume, MCV',
        test: 'Mean Corpuscular Volume, MCV',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination of Mean Corpuscular Volume (MCV) in blood to evaluate the average physical volume / size of a single red blood cell (erythrocyte).',
        interpretation: `Clinical Significance & Physiological Basis:
Mean Corpuscular Volume (MCV) is the cornerstone red blood cell (RBC) index used in the morphological classification of anemias. It measures the average physical volume/size of individual erythrocytes in femtoliters (fL, 10⁻¹⁵ L).
Calculation formula:
MCV (fL) = [Hematocrit / Packed Cell Volume (%) × 10] / Red Blood Cell Count (million/µL).

Reference Range:
• Normal / Normocytic: 83 - 101 fL

Clinical Interpretation & Differential Diagnosis:

1. Microcytic Anemia (Low MCV < 83 fL):
   Indicates abnormally small red blood cells.
   Common Etiologies:
   • Iron Deficiency Anemia (most frequent cause worldwide)
   • Thalassemia Minor / Major / Traits (defective alpha or beta globin chain synthesis; characteristically high RBC count with very low MCV and Mentzer Index < 13)
   • Sideroblastic Anemia (impaired heme synthesis)
   • Anemia of Chronic Disease / Chronic Inflammation (late or severe stages)
   • Chronic Lead Toxicity

2. Macrocytic Anemia (High MCV > 101 fL):
   Indicates abnormally large red blood cells.
   Common Etiologies:
   • Megaloblastic Anemias: Vitamin B12 deficiency (pernicious anemia, malabsorption) or Folate deficiency (impaired DNA synthesis with nuclear-cytoplasmic dyssynchrony and hypersegmented neutrophils)
   • Non-Megaloblastic Macrocytosis:
     - Chronic Liver Disease / Cirrhosis
     - Chronic Alcoholism (direct bone marrow toxicity)
     - Hypothyroidism / Myxedema
     - Myelodysplastic Syndromes (MDS) / Aplastic Anemia
     - Reticulocytosis (marked hemolytic anemia or acute post-hemorrhage response)
     - Drugs: Chemotherapeutic agents (Hydroxyurea, Methotrexate, Azathioprine), antiretrovirals (Zidovudine)
     - Cold agglutinins (clumped RBCs falsely read as single large cells by automated analyzers)

3. Normocytic Anemia (Normal MCV 83 - 101 fL):
   Indicates normal cell size in the setting of decreased total hemoglobin.
   Common Etiologies:
   • Acute Blood Loss / Hemorrhage
   • Early Iron Deficiency or Mixed Nutritional Anemia (combined B12 and Iron deficiency with wide RDW)
   • Anemia of Chronic Renal Failure (decreased erythropoietin production)
   • Bone Marrow Infiltration / Aplasia
   • Hemolytic Anemias without marked reticulocytosis

Clinical Note:
MCV must be interpreted alongside Red Cell Distribution Width (RDW), MCH, MCHC, Serum Ferritin, Vitamin B12/Folate levels, Reticulocyte count, and peripheral blood smear cytology.`,
        parameters: [
          {
            name: 'Mean Corpuscular Volume, MCV',
            referenceRange: '83 - 101',
            unit: 'fL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'FILARIAL_PARASITE') {
      setReportForm({
        title: 'Filarial Parasite (Card Test)',
        test: 'Filarial Parasite (Card Test)',
        category: 'LAB',
        basePrice: 350,
        taxPercentage: 0,
        sampleType: 'Whole Blood / Serum',
        turnaroundTime: '2 Hours',
        description: 'Rapid immunochromatographic card test for the qualitative detection of circulating Wuchereria bancrofti filarial antigens in human blood/serum.',
        interpretation: `Result | Remarks
Detected | Indicates the presence of circulating Wuchereria bancrofti antigen.
Not Detected | Indicates absence of circulating Wuchereria bancrofti antigen

Note:
- Positive results are seen in parasitic disease of the human lymph system caused by Wuchereria bancrofti (W. bancrofti) leading to conditions like lymphedema, hydrocele and disfiguring disease of elephantiasis.
- Results should be correlated with clinical conditions and tests like thick smear microscopy and membrane filtration test.
- False positive results may be due to cross-reactivity with Loa loa spp or other nematode infection.
- False negative reactions may be due to the processing of samples collected early in the course of disease or low threshold of antigen. The test should be repeated on a new specimen obtained after two weeks.

Uses
- To diagnose lymphatic and non-lymphatic filariasis.
- For mapping the endemicity of lymphatic filariasis.
- For monitoring and transmission assessment surveys (TAS) of Wuchereria bancrofti.`,
        parameters: [
          {
            name: 'Filarial Parasite (Card Test)',
            referenceRange: 'Not Detected',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Not Detected', isAbnormal: false },
              { value: 'Detected', isAbnormal: true },
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true },
              { value: 'Equivocal', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'MICROALBUMIN_CREATININE_RATIO' || presetType === 'UACR') {
      setReportForm({
        title: 'Microalbumin Creatinine Ratio, Urine Random',
        test: 'Microalbumin Creatinine Ratio, Urine Random',
        category: 'LAB',
        basePrice: 450,
        taxPercentage: 0,
        sampleType: 'Urine (Random / First Morning)',
        turnaroundTime: '4 Hours',
        description: 'Quantitative determination of urine microalbumin and urinary creatinine to calculate the Urine Albumin-to-Creatinine Ratio (UACR) for early detection of diabetic nephropathy and renal microvascular disease.',
        interpretation: `Physiological Basis
The normal urinary albumin excretion is less than 30 mg/24 hr. On random spot urine collection, the albumin-to-creatinine ratio (ACR, mcg/mg) should be less than 30.

Category | Spot collection ACR (mg/g)
Normal | < 30
Microalbuminuria | 30-300
Clinical albuminuria | > 300

Interpretation
Increased in: Diabetes mellitus, diabetic nephropathy.

Comments
Microalbuminuria is a useful indicator of early nephropathy in diabetic patients. Urine albumin measurement requires a sensitive immunochemical assay. Urine dipstick analysis is often insensitive to microalbuminuria. Screening for microalbuminuria is often performed by measurement of the ACR in a random spot collection (preferred method).`,
        parameters: [
          {
            name: 'Microalbuminuria',
            referenceRange: '0 - 25',
            unit: 'mg/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Urinary creatinine',
            referenceRange: '28 - 217',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Urinary Albumin Creatinine Ratio (UACR)',
            referenceRange: '<30',
            unit: 'mg/g',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'MICROALBUMIN_URINE_24_HOURS') {
      setReportForm({
        title: 'Microalbumin, Urine 24 hours',
        test: 'Microalbumin, Urine 24 hours',
        category: 'LAB',
        basePrice: 400,
        taxPercentage: 0,
        sampleType: 'Urine (24-Hour Collection)',
        turnaroundTime: '24 Hours',
        description: 'Quantitative determination of microalbumin excretion in a 24-hour urine collection using immunoturbidimetry to assess early diabetic nephropathy and renal microvascular disease.',
        interpretation: `Physiological Basis & Clinical Significance:
Microalbuminuria refers to urinary albumin excretion that is above normal physiological levels but below the detection threshold of conventional urine dipstick tests. In healthy individuals, the glomerular filtration barrier restricts albumin excretion, resulting in less than 30 mg of albumin in a 24-hour urine collection.

Reference Interpretation (24-Hour Urine Collection):
• Normal: < 30 mg/24hrs
• Microalbuminuria (Incipient Nephropathy): 30 - 299 mg/24hrs
• Clinical / Macroalbuminuria (Overt Nephropathy): > 300 mg/24hrs

Clinical Significance:
1. Early Marker of Diabetic Nephropathy:
   Microalbuminuria is the earliest clinically detectable sign of diabetic kidney disease in patients with Type 1 and Type 2 Diabetes Mellitus. Early detection allows timely intervention with glycemic control and ACE inhibitors/ARBs to slow or reverse disease progression.
2. Cardiovascular Risk Marker:
   Persistent microalbuminuria is an independent risk factor for cardiovascular morbidity and generalized vascular endothelial dysfunction in hypertensive and non-diabetic patients.
3. Other Causes:
   Transient albuminuria may occur in high fever, strenuous physical exercise, severe urinary tract infections, acute heart failure, and acute hyperglycemia.

Note & Collection Guidelines:
• A complete 24-hour timed urine collection with accurate total volume measurement is essential for accurate quantitative calculation (mg/24 hours = Urine Albumin [mg/L] × Total Urine Volume [L]).
• Repeat testing (2 out of 3 specimens positive over a 3 to 6-month period) is recommended to confirm persistent microalbuminuria.`,
        parameters: [
          {
            name: 'Albumin/Microalbumin in Urine',
            referenceRange: '<= 30',
            unit: 'mg/L',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Urine volume, Total',
            referenceRange: '',
            unit: 'ml',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          },
          {
            name: 'Albumin/Microalbumin by Immunoturbidimetry',
            referenceRange: 'Normal: <30 / Microalbuminuria: 30-299 / Clinical albuminuria: >300',
            unit: 'mg/24hrs',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'MORPHOLOGY') {
      setReportForm({
        title: 'Morphology',
        test: 'Morphology',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '4 Hours',
        description: 'Microscopic examination of peripheral blood smear (PBS) morphology evaluating the structural characteristics, size, shape, and maturity of erythrocytes, leukocytes, and thrombocytes.',
        interpretation: `Clinical Significance & Physiological Basis:
Peripheral Blood Smear (PBS) Morphology examination provides a qualitative and quantitative microscopic evaluation of cellular components of blood (erythrocytes, leukocytes, and thrombocytes). It serves as an invaluable diagnostic tool that complements automated hematology analyzer parameters.

1. RBC Morphology (Erythrocytes):
• Normocytic Normochromic: Normal size (MCV 80-100 fL) and normal central pallor (1/3 of cell diameter).
• Microcytic Hypochromic: Seen in Iron Deficiency Anemia, Thalassemia, Anemia of Chronic Disease, Sideroblastic Anemia.
• Macrocytic / Megaloblastic: Oval macrocytes seen in Vitamin B12 / Folate deficiency; round macrocytes in liver disease, alcoholism, reticulocytosis.
• Anisopoikilocytosis: Variation in size (anisocytosis) and shape (poikilocytosis).
• Specific Poikilocytes:
  - Target Cells (Codocytes): Thalassemia, hemoglobinopathies (HbC, HbS), liver disease, post-splenectomy.
  - Spherocytes: Hereditary Spherocytosis, Autoimmune Hemolytic Anemia (AIHA).
  - Schistocytes (Fragmented RBCs / Helmet cells): Microangiopathic Hemolytic Anemia (TTP, HUS, DIC), mechanical heart valves.
  - Sickle Cells (Drepanocytes): Sickle Cell Anemia (HbSS).
  - Tear-drop cells (Dacryocytes): Primary Myelofibrosis, marrow infiltrative disorders.
  - Acanthocytes / Echinocytes: Liver disease, abetalipoproteinemia / renal disease, uremia.
• RBC Inclusions: Howell-Jolly bodies (hyposplenism), Basophilic stippling (lead poisoning, thalassemia), Cabot rings.

2. WBC Morphology (Leukocytes):
• Normal: Mature segmented neutrophils (2-5 lobes), lymphocytes, monocytes, eosinophils, and basophils.
• Left Shift / Toxic Changes: Band forms, toxic granulation, Döhle bodies, and cytoplasmic vacuolation (seen in acute bacterial infections, sepsis, burns).
• Hypersegmented Neutrophils (≥ 6 lobes): Hallmark of Megaloblastic Anemia (B12/Folate deficiency).
• Reactive / Atypical Lymphocytes: Infectious Mononucleosis (EBV, CMV), viral hepatitis, acute viral infections.
• Blast Cells / Immature Myeloid/Lymphoid Precursors: Acute Leukemias (AML, ALL), Myelodysplastic Syndromes, Chronic Leukemias (CML, CLL).
• Auer Rods: Pathognomonic for Acute Myeloid Leukemia (AML).

3. Platelet Morphology (Thrombocytes):
• Normal: Adequate numbers (approx. 7-15 platelets per 100x oil-immersion field), normal granularity.
• Giant / Large Platelets: Immune Thrombocytopenia (ITP), Bernard-Soulier syndrome, myeloproliferative neoplasms.
• Platelet Clumping: EDTA-induced pseudothrombocytopenia (requires recollection with sodium citrate/heparin).

Clinical Correlation:
Morphological findings must be correlated with clinical history, CBC indices (Hb, TLC, DLC, Platelet Count, MCV, RDW), and relevant biochemical investigations.`,
        parameters: [
          {
            name: 'RBC Morphology',
            referenceRange: 'Normocytic, Normochromic',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Normocytic, normochromic RBCs. No abnormal cells or parasites seen.', isAbnormal: false },
              { value: 'Microcytic, hypochromic RBCs with mild to moderate anisopoikilocytosis.', isAbnormal: true },
              { value: 'Macrocytic RBCs with oval macrocytes.', isAbnormal: true },
              { value: 'Dimorphic red cell picture.', isAbnormal: true },
              { value: 'Target cells and pencil cells seen.', isAbnormal: true },
              { value: 'Polychromatophilic red cells and nucleated RBCs seen.', isAbnormal: true },
              { value: 'Schistocytes and helmet cells seen.', isAbnormal: true },
              { value: 'Spherocytes seen.', isAbnormal: true }
            ]
          },
          {
            name: 'WBC Morphology',
            referenceRange: 'Normal morphology',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Normal in number, distribution, and mature morphology.', isAbnormal: false },
              { value: 'Neutrophilic leukocytosis with toxic granulation and left shift.', isAbnormal: true },
              { value: 'Hypersegmented neutrophils seen (megaloblastic changes).', isAbnormal: true },
              { value: 'Relative/Absolute lymphocytosis with reactive/atypical lymphocytes.', isAbnormal: true },
              { value: 'Eosinophilia present with normal morphology.', isAbnormal: true },
              { value: 'Immature precursors / blast cells seen (advised flow cytometry / bone marrow biopsy).', isAbnormal: true }
            ]
          },
          {
            name: 'Platelet Morphology',
            referenceRange: 'Adequate, normal morphology',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Adequate in number, normal size and distribution.', isAbnormal: false },
              { value: 'Reduced in number on smear (Thrombocytopenia).', isAbnormal: true },
              { value: 'Increased in number on smear (Thrombocytosis).', isAbnormal: true },
              { value: 'Giant platelets and large forms noted.', isAbnormal: true },
              { value: 'Platelet clumping seen (suggest recollection in Citrate).', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'MALARIA_PARASITE_CARD') {
      setReportForm({
        title: 'Malaria Parasite (Card Test)',
        test: 'Malaria Parasite (Card Test)',
        category: 'LAB',
        basePrice: 300,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '1 Hour',
        description: 'Rapid immunochromatographic card assay for the qualitative detection and differential diagnosis of Plasmodium falciparum (Pf HRP-2) and Plasmodium vivax (Pv pLDH) in whole blood.',
        interpretation: `Malaria antigen detection-whole blood
Four species of the plasmodium parasites are responsible for human malaria infection: P. falciparum, P. vivax, P. malariae and P. ovale. Early detection and differentiation of malaria is of paramount importance due to incidence of cerebral malaria and drug resistance associated with P. falciparum infection and to prevent serious morbidity and mortality worldwide.

Test Utility
The current test is a qualitative test for detection of the P. falciparum specific histidine rich protein-2 (HRP-2) and P. vivax specific parasite lactate dehydrogenase (pLDH) in whole blood samples. The assay is able to detect and distinguish P. vivax and P. falciparum infections and also identify mixed infections.

Notes & Limitations
The test detects P. falciparum specific HRP-2 and P. vivax specific LDH, a negative test result does not rule out infection with P. ovale and P. malariae. Constant exposure to the malarial parasites, as seen in areas of high endemicity, may result in positive results with doubtful clinical significance. Hence, the results must always be correlated with clinical history and relevant epidemiological and therapeutic context.`,
        parameters: [
          {
            name: 'Plasmodium falciparum "Pf"',
            referenceRange: 'NEGATIVE',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'NEGATIVE', isAbnormal: false },
              { value: 'POSITIVE', isAbnormal: true },
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true }
            ]
          },
          {
            name: 'Plasmodium vivax "Pv"',
            referenceRange: 'NEGATIVE',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'NEGATIVE', isAbnormal: false },
              { value: 'POSITIVE', isAbnormal: true },
              { value: 'Negative', isAbnormal: false },
              { value: 'Positive', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'MALARIA_PARASITE_MICROSCOPIC') {
      setReportForm({
        title: 'Malaria Parasite (Microscopic)',
        test: 'Malaria Parasite (Microscopic)',
        category: 'LAB',
        basePrice: 200,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA) / Fingerprick Smear',
        turnaroundTime: '2 Hours',
        description: 'Microscopic examination of stained thick and thin peripheral blood films (Giemsa/Leishman stain) for the detection, identification, and speciation of malarial parasites (Plasmodium species).',
        interpretation: `Clinical Significance & Physiological Basis:
Microscopic examination of Giemsa / Leishman stained peripheral blood smears (thick and thin blood films) remains the established gold standard for the laboratory diagnosis of malaria. Thick smears provide high sensitivity for detecting low parasitemia levels, while thin smears allow accurate species identification and quantitation of parasitemia.

Result Interpretation:
1. Not Seen / Negative:
   • Indicates that no malarial parasites (trophozoites, schizonts, or gametocytes) were detected after examining a minimum of 200–300 oil immersion fields (1000x magnification) on the thick smear.
   • Note: A single negative blood smear does not exclude malaria, especially in early infection or low parasite density. Serial blood smears collected every 8 to 12 hours over a 24 to 48-hour period are recommended if clinical suspicion persists.

2. Positive / Seen:
   Identifies intraerythrocytic malarial parasites with species differentiation:
   • Plasmodium vivax (Pv): Enlarged infected erythrocytes, Schüffner's dots, amoeboid trophozoites, mature schizonts (12-24 merozoites), and round gametocytes.
   • Plasmodium falciparum (Pf): Normal-sized RBCs, delicate ring forms (often multiple per cell or appliqué/marginal forms), Maurer's clefts, and characteristic crescent/banana-shaped gametocytes. High risk of severe/cerebral malaria and high parasitemia.
   • Plasmodium malariae (Pm): Normal or slightly smaller RBCs, compact band forms, 'daisy head' schizonts (6-12 merozoites), Ziemann's dots.
   • Plasmodium ovale (Po): Enlarged oval erythrocytes with fimbriated edges and James's dots.

Clinical Recommendation:
If positive for P. falciparum, quantitation of parasitemia (% infected RBCs or parasites/µL) should be calculated and monitored to assess therapeutic response and detect treatment failure or drug resistance.`,
        parameters: [
          {
            name: 'Malaria Parasite (Microscopic)',
            referenceRange: 'Not Seen',
            unit: '',
            fieldType: 'Text',
            gender: 'Both',
            valueOptions: [
              { value: 'Not Seen', isAbnormal: false },
              { value: 'Seen - Plasmodium vivax (Pv) trophozoites / gametocytes seen', isAbnormal: true },
              { value: 'Seen - Plasmodium falciparum (Pf) ring forms / gametocytes seen', isAbnormal: true },
              { value: 'Seen - Mixed infection (P. vivax + P. falciparum)', isAbnormal: true },
              { value: 'Negative for Malarial Parasite (MP)', isAbnormal: false },
              { value: 'Positive for Malarial Parasite (MP)', isAbnormal: true }
            ]
          }
        ]
      });
    } else if (presetType === 'MEAN_PLATELET_VOLUME' || presetType === 'MPV') {
      setReportForm({
        title: 'Mean Platelet Volume, MPV (Optional)',
        test: 'Mean Platelet Volume, MPV (Optional)',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Whole Blood (EDTA)',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination of Mean Platelet Volume (MPV) in blood to evaluate the average size of circulating platelets and bone marrow megakaryocyte activity.',
        interpretation: `Clinical Significance & Physiological Basis:
Mean Platelet Volume (MPV) is a calculated platelet index that measures the average physical size/volume of circulating thrombocytes (platelets) in femtoliters (fL). MPV reflects platelet production rate, bone marrow megakaryopoiesis activity, and platelet turnover.

Reference Range:
• Normal: 6.5 - 12.0 fL

Clinical Interpretation & Differential Diagnosis:

1. High MPV (> 12.0 fL) - Hyperdestructive / Regenerative States:
   Larger platelets are younger, metabolically active platelets recently released from the bone marrow.
   Common Etiologies:
   • Accelerated Platelet Destruction / Turnover with compensatory bone marrow response:
     - Immune / Idiopathic Thrombocytopenic Purpura (ITP)
     - Disseminated Intravascular Coagulation (DIC)
     - Thrombotic Thrombocytopenic Purpura (TTP) / Hemolytic Uremic Syndrome (HUS)
     - Sepsis and severe acute infections
     - Post-splenectomy
   • Myeloproliferative Neoplasms (MPN): Essential Thrombocythemia, Primary Myelofibrosis, Polycythemia Vera
   • Congenital Giant Platelet Syndromes: Bernard-Soulier syndrome, May-Hegglin anomaly
   • Increased Cardiovascular Risk: High MPV is associated with heightened prothrombotic risk, acute myocardial infarction, ischemic stroke, and metabolic syndrome.

2. Low MPV (< 6.5 fL) - Hypoproductive / Marrow Failure States:
   Small platelets indicate impaired bone marrow megakaryocytopoiesis or production failure.
   Common Etiologies:
   • Aplastic Anemia and Bone Marrow Suppression (chemotherapy, radiation)
   • Megaloblastic Anemia (due to Vitamin B12 or Folate deficiency)
   • Hypersplenism (splenic sequestration of larger platelets)
   • Chronic Renal Failure
   • Wiskott-Aldrich Syndrome (classic microthrombocytopenia)

Clinical Note:
MPV must always be evaluated in direct context with the Total Platelet Count, Platelet Distribution Width (PDW), and peripheral blood smear review. EDTA anticoagulant induces time-dependent platelet swelling; optimal measurement is obtained within 1 to 2 hours of venipuncture.`,
        parameters: [
          {
            name: 'Mean Platelet Volume, MPV (Optional)',
            referenceRange: '6.5 - 12',
            unit: 'fL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'MYOGLOBIN') {
      setReportForm({
        title: 'Myoglobin',
        test: 'Myoglobin',
        category: 'LAB',
        basePrice: 600,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination of serum myoglobin concentration to assist in the early assessment of myocardial infarction, cardiac re-infarction, and skeletal muscle injury / rhabdomyolysis.',
        interpretation: `Comments
Myoglobin is a protein found in heart and skeletal muscle. It leaks into the blood when muscle cells are damaged. It's useful for detecting heart attacks, early re-infarctions, and successful treatment. Myoglobin levels rise about 2 hours after a heart attack, peak in 4-12 hours, and return to normal within 24 hours. Since myoglobin is cleared by the kidneys, any changes in kidney function can affect its levels.

Clinical Use
To rule out a heart attack, if myoglobin levels don't change in several samples taken 2-6 hours after chest pain starts, it almost certainly means there's no heart muscle damage.`,
        parameters: [
          {
            name: 'Myoglobin',
            referenceRange: '< 70',
            unit: 'ng/mL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'NON_HDL_CHOLESTEROL') {
      setReportForm({
        title: 'Non-HDL cholesterol',
        test: 'Non-HDL cholesterol',
        category: 'LAB',
        basePrice: 150,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination and calculation of Non-HDL Cholesterol (Total Cholesterol minus HDL) to evaluate total atherogenic lipoprotein burden and cardiovascular disease risk.',
        interpretation: `Clinical Significance & Physiological Basis:
Non-HDL Cholesterol represents the total amount of cholesterol carried in all atherogenic (artery-clogging) apolipoprotein B-containing lipoproteins, which includes LDL (Low-Density Lipoprotein), VLDL (Very Low-Density Lipoprotein), IDL (Intermediate-Density Lipoprotein), and Lipoprotein(a).
Calculation Formula:
Non-HDL Cholesterol (mg/dL) = Total Cholesterol - HDL Cholesterol.

Reference Classification (NCEP ATP III / ACC/AHA Guidelines):
• Desirable / Optimal: < 130 mg/dL (Goal for low to moderate cardiovascular risk)
• Borderline High: 130 - 159 mg/dL
• High: 160 - 189 mg/dL
• Very High: ≥ 190 mg/dL

Therapeutic Targets Based on Atherosclerotic Cardiovascular Disease (ASCVD) Risk:
• Extreme Risk / Established ASCVD with DM: < 80 mg/dL (or < 70 mg/dL)
• Very High Risk (Known ASCVD or Diabetes with Target Organ Damage): < 100 mg/dL
• Moderate to High Risk: < 130 mg/dL

Clinical Advantages of Non-HDL Cholesterol:
1. Better Cardiovascular Predictor than LDL alone:
   Non-HDL cholesterol accounts for all atherogenic particles (including triglyceride-rich remnant lipoproteins like VLDL and IDL), making it a superior predictor of cardiovascular risk, myocardial infarction, and ischemic stroke.
2. Highly Reliable in Hypertriglyceridemia & Diabetes:
   In patients with hypertriglyceridemia (triglycerides > 200 mg/dL), diabetes mellitus, metabolic syndrome, or obesity, calculated LDL-C (Friedewald formula) often underestimates atherogenic particle burden. Non-HDL-C remains robust and accurate even when triglycerides are elevated.
3. Fasting vs Non-Fasting Utility:
   Non-HDL cholesterol is less affected by postprandial lipemia and can be evaluated on non-fasting blood samples.

Clinical Note:
Elevated Non-HDL cholesterol should be managed with lifestyle modifications (dietary changes, aerobic exercise, weight reduction) and guideline-directed lipid-lowering therapies (statins, ezetimibe, PCSK9 inhibitors) based on global ASCVD risk assessment.`,
        parameters: [
          {
            name: 'Non-HDL cholesterol',
            referenceRange: '< 130',
            unit: 'mg/dL',
            fieldType: 'Number',
            gender: 'Both',
            valueOptions: []
          }
        ]
      });
    } else if (presetType === 'NT_PROBNP') {
      setReportForm({
        title: 'NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)',
        test: 'NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)',
        category: 'LAB',
        basePrice: 1500,
        taxPercentage: 0,
        sampleType: 'Blood Serum / Plasma',
        turnaroundTime: '2 Hours',
        description: 'Quantitative determination of N-Terminal Pro-B-Type Natriuretic Peptide (NT-proBNP) in blood to aid in the diagnosis, risk stratification, and monitoring of congestive heart failure and cardiac dysfunction.',
        interpretation: `Chronic Heart failure
AGE OF PATIENTS | TITER | Result
<75 Year | <125 Pg/ml | Chronic heart failure unlikely
≥75 Year | <450 Pg/ml | Chronic heart failure unlikely

ACUTE HEART FAILURE
AGE OF PATIENTS | TITER | Result
<50 YEAR | <450 Pg/ml | Acute heart failure unlikely (Positive if >450 pg/mL)
50-75 YEAR | <900 Pg/ml | Acute heart failure unlikely (Positive if >900 pg/mL)
>75 YEARS | <1800 Pg/ml | Acute heart failure unlikely (Positive if >1800 pg/mL)

Clinical Significance & Physiological Basis:
N-Terminal pro-B-type Natriuretic Peptide (NT-proBNP) is an inactive 76-amino acid N-terminal fragment cleaved from proBNP during the release of the active hormone BNP by ventricular cardiomyocytes in response to increased myocardial wall stress, ventricular stretch, volume overload, and pressure overload. NT-proBNP has a longer biological half-life (~70–120 minutes) than BNP, offering higher diagnostic stability and sensitivity for heart failure.

Reference Range (General Normal Baseline):
• Normal / Low Risk: 0 - 115 pg/mL (or < 125 pg/mL for age < 75 yrs)

Diagnostic Cut-Offs & Clinical Interpretation:

1. Rule-Out Criteria for Chronic Heart Failure (Non-Acute Outpatient Setting):
• Age < 75 Years: < 125 pg/mL → Chronic heart failure unlikely
• Age ≥ 75 Years: < 450 pg/mL → Chronic heart failure unlikely

2. Age-Stratified Decision Cut-Offs for Acute Heart Failure (Emergency / Inpatient Setting):
• Age < 50 Years:
  - < 450 pg/mL: Acute heart failure unlikely (Rule-out)
  - > 450 pg/mL: Highly suggestive of Acute Heart Failure
• Age 50 - 75 Years:
  - < 900 pg/mL: Acute heart failure unlikely (Rule-out)
  - > 900 pg/mL: Highly suggestive of Acute Heart Failure
• Age > 75 Years:
  - < 1800 pg/mL: Acute heart failure unlikely (Rule-out)
  - > 1800 pg/mL: Highly suggestive of Acute Heart Failure

3. Clinical Confounders & Other Causes of Elevation:
• Renal Insufficiency / CKD (NT-proBNP is primarily cleared via renal filtration; eGFR < 60 mL/min leads to reduced clearance)
• Atrial Fibrillation / Tachyarrhythmias
• Pulmonary Embolism / Pulmonary Arterial Hypertension (Right ventricular strain)
• Severe Sepsis / Critical Illness / Advanced Age
• Acute Coronary Syndromes (ACS) / Myocardial Infarction
• Note: Lower NT-proBNP levels may be observed in patients with obesity (high BMI).

Clinical Application:
NT-proBNP is recommended for:
- Differentiating cardiac dyspnea from non-cardiac causes of shortness of breath.
- Risk stratification, prognostic assessment, and monitoring therapeutic response in acute and chronic heart failure.`,
        parameters: [
          {
            name: 'NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)',
            referenceRange: '0 - 115',
            unit: 'pg/mL',
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
        notes: reportForm.interpretation || reportForm.notes || '',
        interpretation: reportForm.interpretation || '',
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
            fieldType: p.fieldType || (Array.isArray(p.valueOptions) && p.valueOptions.length > 0 ? 'Text' : 'Number'),
            gender: p.gender || 'Both',
            valueOptions: p.valueOptions || []
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
                  onClick={() => handleApplyPreset('WEIL_FELIX')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Weil Felix
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('WBC_COUNT')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  WBC Count
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('VLDL_CHOLESTEROL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  VLDL Cholesterol
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('VITAMIN_D3')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Vitamin D3
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('VITAMIN_B12')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Vitamin B12
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('VDRL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  VDRL
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_SUGAR_RANDOM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine Sugar Random
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_SUGAR_PP')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine Sugar PP
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_SUGAR_FASTING')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine Sugar Fasting
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_PROTEIN_CREATININE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine Protein/Creatinine
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_PROTEIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for Protein
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_MICROALBUMIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for Microalbumin
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_KETONE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for Ketone
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_FUNGAL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for Fungal
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_ELISA_PREGNANCY')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for ELISA (Pregnancy)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_CREATININE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for creatinine
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_CHYLE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for Chyle
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('URINE_FOR_AFB_24_HOURS')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Urine for AFB 24 hours
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MAGNESIUM')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Magnesium
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MALARIA_ANTIGEN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Malaria Antigen
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MEAN_CELL_HAEMOGLOBIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  MCH
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MEAN_CELL_HAEMOGLOBIN_CON')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  MCHC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MEAN_CORPUSCULAR_VOLUME')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  MCV
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FILARIAL_PARASITE')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Filarial Parasite
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MICROALBUMIN_CREATININE_RATIO')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  UACR (Random)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MICROALBUMIN_URINE_24_HOURS')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Microalbumin 24h
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MORPHOLOGY')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Morphology
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MALARIA_PARASITE_CARD')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Malaria Parasite
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MALARIA_PARASITE_MICROSCOPIC')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Malaria MP (Smear)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MEAN_PLATELET_VOLUME')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  MPV
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('MYOGLOBIN')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Myoglobin
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('NON_HDL_CHOLESTEROL')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer border border-blue-200"
                >
                  Non-HDL Chol
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('NT_PROBNP')}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                >
                  NT-proBNP
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
              {(previewTest.interpretation || previewTest.notes) && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Clinical Interpretation & Reference Remarks</span>
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {previewTest.interpretation || previewTest.notes}
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
