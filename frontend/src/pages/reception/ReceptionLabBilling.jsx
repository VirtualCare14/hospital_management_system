import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHeader } from '../../context/HeaderContext';
import client from '../../api/client';
import toast from 'react-hot-toast';
import LabBillReceipt from '../../components/LabBillReceipt';
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Printer,
  Search,
  Plus,
  X,
  User,
  Phone,
  Building2,
  Sliders,
  Receipt,
  FlaskConical,
  Activity,
  Scan,
  Radio,
  Layers,
  Heart,
  Zap,
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Save
} from 'lucide-react';

/* ─── Standard Category & Master Lists matching Labs Portal ─── */
const CATEGORIES = [
  { id: 'LAB', label: 'LAB', title: 'Lab Investigations', icon: FlaskConical },
  { id: 'USG', label: 'USG', title: 'USG Investigations', icon: Activity },
  { id: 'DIGITAL XRAY', label: 'DIGITAL XRAY', title: 'Digital X-ray Investigations', icon: Scan },
  { id: 'XRAY', label: 'XRAY', title: 'X-ray Investigations', icon: Radio },
  { id: 'OUTSOURCE LAB', label: 'OUTSOURCE LAB', title: 'Outsource Lab Investigations', icon: Layers },
  { id: 'ECG', label: 'ECG', title: 'ECG Investigations', icon: Heart },
  { id: 'CT SCAN', label: 'CT SCAN', title: 'CT Scan Investigations', icon: Scan },
  { id: 'MRI', label: 'MRI', title: 'MRI Investigations', icon: Zap },
  { id: 'EPS', label: 'EPS', title: 'EPS Investigations', icon: Activity },
  { id: 'OPG', label: 'OPG', title: 'OPG Investigations', icon: Radio },
  { id: 'CARDIOLOGY', label: 'CARDIOLOGY', title: 'Cardiology Investigations', icon: Heart },
  { id: 'EEG', label: 'EEG', title: 'EEG Investigations', icon: Zap },
  { id: 'MAMMOGRAPHY', label: 'MAMMOGRAPHY', title: 'Mammography Investigations', icon: Scan }
];

const DEFAULT_CATALOG = {
  'LAB': [
    { id: 'abg', title: 'ABG', price: 600 },
    { id: 'ada', title: 'ADA', price: 100 },
    { id: 'aec', title: 'AEC', price: 100 },
    { id: 'afb', title: 'AFB', price: 100 },
    { id: 'afp', title: 'AFP', price: 100 },
    { id: 'cbc', title: 'Complete Blood Count (CBC)', price: 350 },
    { id: 'kala_azar', title: 'KALA AZAR', price: 500 },
    { id: 'insulin_random', title: 'Insulin Random', price: 650 },
    { id: 'iron', title: 'Iron', price: 450 },
    { id: 'hplc', title: 'HPLC', price: 1200 },
    { id: 'hscrp', title: 'Hscrp', price: 650 },
    { id: 'hsv2_igg', title: 'HSV-2 IgG', price: 750 },
    { id: 'icalcium', title: 'iCalcium', price: 400 },
    { id: 'iga_urine', title: 'IgA (Urine)', price: 650 },
    { id: 'indirect_coombs', title: "Indirect Coomb's Test", price: 450 },
    { id: 'iron_studies', title: 'Iron Studies', price: 850 },
    { id: 'lh', title: 'LH (Luteinising Hormone)', price: 450 },
    { id: 'lipase', title: 'Lipase', price: 500 },
    { id: 'ldl_cholesterol', title: 'LDL Cholesterol', price: 200 },
    { id: 'hdl_cholesterol', title: 'HDL Cholesterol', price: 150 },
    { id: 'ldl_hdl', title: 'LDL / HDL', price: 150 },
    { id: 'leukemia_dlc', title: 'Leukemia DLC', price: 350 },
    { id: 'homocysteine', title: 'Homocysteine', price: 850 },
    { id: 'hiv_card', title: 'HIV (Card Test)', price: 350 },
    { id: 'hiv_elisa', title: 'HIV ELISA I/II', price: 650 },
    { id: 'hsv_igm', title: 'Herpes Simplex Virus 1/2 IgM (HSV-1/2 IgM)', price: 750 },
    { id: 'hsv_2_igg', title: 'Herpes Simplex Virus 2 IgG (HSV-2 IgG)', price: 750 },
    { id: 'hcv', title: 'Hepatitis C Virus (HCV)', price: 450 },
    { id: 'hcv_rna_quant', title: 'HCV RNA Quantitative', price: 2800 },
    { id: 'hct', title: 'Hematocrit Value, Hct', price: 150 },
    { id: 'hb', title: 'Hemoglobin (Hb)', price: 120 },
    { id: 'hb_tlc_dlc', title: 'Hemoglobin, TLC & DLC (HB, TLC, DLC)', price: 250 },
    { id: 'hav_igm', title: 'HAV IgM', price: 650 },
    { id: 'h_alb', title: 'H-ALB', price: 450 },
    { id: 'gtt', title: 'Glucose Tolerance Test (GTT)', price: 350 },
    { id: 'grams_stain', title: "Gram's Stain", price: 200 },
    { id: 'gtt_pregnancy', title: 'Glucose Tolerance Test, GTT (Pregnancy)', price: 350 },
    { id: 'globulin', title: 'Globulin', price: 150 },
    { id: 'ggt', title: 'Gamma Glutamyl Transferase, GGT', price: 300 },
    { id: 'gct', title: 'Glucose Challenge Test (GCT)', price: 200 },
    { id: 'g6pd', title: 'Glucose-6-Phosphate Dehydrogenase (G6PD)', price: 650 },
    { id: 'fungal_scraping', title: 'Fungal Scraping Smear (KOH Mount)', price: 250 },
    { id: 'fsh', title: 'Follicle Stimulating Hormone (FSH)', price: 450 },
    { id: 'ft3', title: 'Free Triiodothyronine (FT3)', price: 350 },
    { id: 'ft4', title: 'Free Thyroxine (FT4)', price: 350 },
    { id: 'folic_acid', title: 'Folic Acid', price: 800 },
    { id: 'free_psa', title: 'Free Prostate Specific Antigen (Free PSA)', price: 850 },
    { id: 'dhea', title: 'Dehydroepiandrosterone (DHEA)', price: 800 },
    { id: 'diabetic_package', title: 'Diabetic Package / Profile', price: 1200 },
    { id: 'dialysis_package', title: 'Dialysis Package / Profile', price: 1200 },
    { id: 'direct_coombs_test', title: "Direct Coomb's Test (DAT)", price: 350 },
    { id: 'dlc', title: 'Differential Leucocyte Count (DLC)', price: 150 },
    { id: 'dlc_3_parts', title: 'DLC 3 Parts (Differential Leucocyte Count, 3-Part)', price: 150 },
    { id: 'double_marker', title: 'Double Marker, Maternal Screen - 2 tests', price: 2200 },
    { id: 'estradiol', title: 'Estradiol (E2)', price: 550 },
    { id: 'esr', title: 'Erythrocyte Sedimentation Rate (ESR)', price: 100 },
    { id: 'esr_westergren', title: 'Erythrocyte Sedimentation Rate (Westergren)', price: 100 },
    { id: 'esr_wintrobe', title: 'Erythrocyte Sedimentation Rate (Wintrobe)', price: 100 },
    { id: 'fluid_exam', title: 'Fluid Examination (Physical, Chemical & Microscopic)', price: 500 },
    { id: 'fnac', title: 'FNAC (Fine Needle Aspiration Cytology)', price: 850 },
    { id: 'fasting_blood_sugar', title: 'Fasting Blood Sugar (FBS)', price: 80 },
    { id: 'fasting_insulin', title: 'Fasting Insulin (Serum Insulin, Fasting)', price: 650 },
    { id: 'electrolytes_panel', title: 'Electrolytes Panel (Na, K, Cl, Ca, iCa)', price: 450 },
    { id: 'ferritin', title: 'Ferritin', price: 450 },
    { id: 'egfr', title: 'Estimated Glomerular Filtration Rate (eGFR)', price: 250 },
    { id: 'dengue_ns1', title: 'Dengue NS1 Antigen', price: 600 },
    { id: 'hbeag', title: 'Hepatitis B Envelope Antigen (HBeAg)', price: 650 },
    { id: 'hbsag', title: 'Hepatitis B Surface Antigen (HBsAg)', price: 350 },
    { id: 'hbsag_elisa', title: 'HBsAg ELISA', price: 650 },
    { id: 'lft', title: 'Liver Function Test (LFT)', price: 650 },
    { id: 'kft', title: 'Kidney Function Test (KFT)', price: 600 },
    { id: 'lipid', title: 'Lipid Profile', price: 550 },
    { id: 'torch_profile', title: 'TORCH Profile (Toxoplasma, Rubella, CMV, HSV)', price: 2000 },
    { id: 'tlc', title: 'Total Leukocyte Count (TLC)', price: 100 },
    { id: 'tg_hdl', title: 'TG / HDL (Triglycerides / HDL Ratio)', price: 100 },
    { id: 'testosterone_total', title: 'Testosterone Total', price: 550 },
    { id: 'testosterone_free', title: 'Testosterone Free', price: 750 },
    { id: 't4', title: 'Serum thyroxine, T4', price: 200 },
    { id: 't3', title: 'Serum Triiodothyronine, T3', price: 200 },
    { id: 'stool_routine', title: 'Stool Routine Examination', price: 150 },
    { id: 'stool_reducing_substances', title: 'Stool reducing substances', price: 150 },
    { id: 'stool_cs', title: 'Stool/cs (Stool Culture & Sensitivity)', price: 600 },
    { id: 'sgpt', title: 'SGPT (ALT)', price: 150 },
    { id: 'sgot', title: 'SGOT (AST)', price: 150 },
    { id: 'serum_zinc', title: 'Serum Zinc', price: 900 },
    { id: 'serum_urea', title: 'Serum Urea', price: 150 },
    { id: 'serum_sodium', title: 'Serum Sodium', price: 150 },
    { id: 'serum_protein', title: 'Serum Protein', price: 150 },
    { id: 'serum_potassium', title: 'Serum Potassium', price: 150 },
    { id: 'serum_phosphorus', title: 'Serum Phosphorus', price: 150 },
    { id: 'serum_ldh', title: 'Serum LDH (Lactate Dehydrogenase)', price: 300 },
    { id: 'serum_igm', title: 'Serum IgM (Immunoglobulin M)', price: 650 },
    { id: 'serum_electrolyte', title: 'Serum Electrolyte (Na+, K+)', price: 300 },
    { id: 'serum_albumin', title: 'Serum Albumin', price: 150 },
    { id: 'serum_alkaline_phosphatase', title: 'Serum Alkaline Phosphatase (ALP)', price: 150 },
    { id: 'serum_amylase', title: 'Serum Amylase', price: 250 },
    { id: 'serum_bilirubin_direct', title: 'Serum Bilirubin (Direct)', price: 120 },
    { id: 'serum_bilirubin_indirect', title: 'Serum Bilirubin (Indirect)', price: 120 },
    { id: 'serum_calcium', title: 'Serum Calcium', price: 150 },
    { id: 'serum_cortisol', title: 'Serum Cortisol', price: 450 },
    { id: 'rubella_igm', title: 'Rubella IgM', price: 450 },
    { id: 'scrub_typhus', title: 'Scrub Typhus (IgG & IgM)', price: 600 },
    { id: 'serum_chloride', title: 'Serum Chloride (Cl-)', price: 150 },
    { id: 'rheumatoid_factor_quantitative', title: 'Rheumatoid Factor, RA (Quantitative)', price: 350 },
    { id: 'thyroid', title: 'Thyroid Profile', price: 500 }
  ],
  'USG': [
    { id: 'usg_echo', title: '2d Echo', price: 1800 },
    { id: 'usg_breast', title: 'Breast', price: 600 },
    { id: 'usg_doppler', title: 'Color Doppler (Fetus)', price: 1000 },
    { id: 'usg_follicular', title: 'Follicular study', price: 1200 },
    { id: 'usg_fwb', title: 'F.W.B.', price: 400 },
    { id: 'usg_kub_f', title: 'K.U.B. FEMALE', price: 400 },
    { id: 'usg_kub_m', title: 'K.U.B. MALE', price: 400 },
    { id: 'usg_lower_abd', title: 'Lower Abdomen', price: 400 },
    { id: 'usg_testis', title: 'Testis', price: 600 },
    { id: 'usg_thyroid', title: 'Thyroid & Neck', price: 600 },
    { id: 'usg_upper_abd', title: 'Upper Abdomen', price: 400 },
    { id: 'usg_whole_abd', title: 'Whole Abdomen Female', price: 500 }
  ],
  'DIGITAL XRAY': [
    { id: 'xr_chest', title: 'Chest PA View', price: 400 },
    { id: 'xr_spine', title: 'Lumbar Spine AP/Lat', price: 650 },
    { id: 'xr_knee', title: 'Both Knee Joint', price: 550 }
  ]
};

const DEFAULT_PACKAGES = [
  {
    id: 'pkg_ehc_default',
    title: 'Executive Health Checkup',
    category: 'LAB',
    packageCode: 'PKG-EHC',
    price: 1499,
    originalPrice: 2150,
    isPackage: true,
    description: 'Comprehensive vital organ screening including CBC, Lipid Profile, LFT, KFT',
    tests: [
      { testName: 'Complete Blood Count (CBC)', price: 350 },
      { testName: 'Lipid Profile', price: 550 },
      { testName: 'Liver Function Test (LFT)', price: 650 },
      { testName: 'Kidney Function Test (KFT)', price: 600 }
    ]
  },
  {
    id: 'pkg_dcp_default',
    title: 'Diabetic Care Profile',
    category: 'LAB',
    packageCode: 'PKG-DCP',
    price: 699,
    originalPrice: 980,
    isPackage: true,
    description: 'Specialized diabetic monitor package (FBS, GTT, Lipid Profile)',
    tests: [
      { testName: 'Fasting Blood Sugar (FBS)', price: 80 },
      { testName: 'Glucose Tolerance Test (GTT)', price: 350 },
      { testName: 'Lipid Profile', price: 550 }
    ]
  },
  {
    id: 'pkg_fip_default',
    title: 'Fever & Infection Panel',
    category: 'LAB',
    packageCode: 'PKG-FIP',
    price: 899,
    originalPrice: 1250,
    isPackage: true,
    description: 'Essential diagnostic panel for acute fever (CBC, Dengue NS1, ESR, Widal)',
    tests: [
      { testName: 'Complete Blood Count (CBC)', price: 350 },
      { testName: 'Dengue NS1 Antigen', price: 600 },
      { testName: 'Erythrocyte Sedimentation Rate (ESR)', price: 100 },
      { testName: 'Widal Card Test', price: 200 }
    ]
  }
];

function amountInWords(num) {
  const n = Math.round(num || 0);
  if (n === 0) return 'Zero rupees only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (val) => {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' ' + inWords(val % 100) : '');
    if (val < 100000) return inWords(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + inWords(val % 1000) : '');
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 !== 0 ? ' ' + inWords(val % 100000) : '');
    return inWords(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 !== 0 ? ' ' + inWords(val % 10000000) : '');
  };

  const words = inWords(n);
  return `${words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()} rupees only`;
}

export default function ReceptionLabBilling() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Receipt Modal State
  const [createdBillReceiptData, setCreatedBillReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState(null);

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
    referredBy: 'Self',
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
    amountReceived: '',
    paymentMode: 'Cash',
    remarks: '',
    isManualAmountReceived: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Patient Details sub-states
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [showFields, setShowFields] = useState({
    email: false,
    address: false,
    aadhaar: false,
    history: false
  });

  // Case Details sub-states
  const [showReferrerDropdown, setShowReferrerDropdown] = useState(false);
  const [referrerSearchQuery, setReferrerSearchQuery] = useState('');
  const [referrers, setReferrers] = useState([
    { id: 'self', name: 'Self' }
  ]);
  const [collectionCentres, setCollectionCentres] = useState([
    'Main Hospital Lab',
    'Home Collection'
  ]);
  const [collectionAgents, setCollectionAgents] = useState([
    'Self (Patient Walk-in)'
  ]);

  const filteredReferrers = useMemo(() => {
    const q = referrerSearchQuery.toLowerCase().trim();
    if (!q) return referrers;
    return referrers.filter(r => r.name.toLowerCase().includes(q));
  }, [referrers, referrerSearchQuery]);

  // Service Selector sub-states
  const [openBoxes, setOpenBoxes] = useState(['LAB']);
  const [allTests, setAllTests] = useState([]);
  const [searchQueries, setSearchQueries] = useState({});
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customTestCategory, setCustomTestCategory] = useState('LAB');
  const [customTestName, setCustomTestName] = useState('');
  const [customTestPrice, setCustomTestPrice] = useState('');

  // Edit Master Price Modal state
  const [editingTestPrice, setEditingTestPrice] = useState(null);
  const [newPriceInput, setNewPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  useHeader({
    title: 'New Bill',
    subtitle: 'Create patient registration and generate diagnostic lab billing'
  });

  // Fetch hospital doctors and settings on mount
  useEffect(() => {
    client.get('/admin/hospital-settings')
      .then(res => {
        if (res.data) setHospitalInfo(res.data.data || res.data);
      })
      .catch(() => {});

    // Fetch doctors present in this hospital
    client.get('/admin/doctors')
      .then(res => {
        const docs = Array.isArray(res.data) ? res.data : (res.data?.doctors || res.data?.data || []);
        const docReferrers = docs.map(d => {
          const rawName = (d.doctorName || d.name || d.username || 'Doctor').trim();
          const nameWithPrefix = rawName.toLowerCase().startsWith('dr') ? rawName : `Dr. ${rawName}`;
          return {
            id: `doc_${d._id}`,
            name: nameWithPrefix,
            doctorName: rawName,
            department: d.department
          };
        });
        
        setReferrers([{ id: 'self', name: 'Self' }, ...docReferrers]);
      })
      .catch(err => {
        console.error('Failed to load hospital doctors:', err);
      });

    // Optionally fetch staff for collection agents if accessible
    client.get('/admin/users')
      .then(res => {
        const users = res.data?.users || (Array.isArray(res.data) ? res.data : []);
        const staff = users.filter(u => u.role === 'lab' || u.role === 'lab_technician' || u.role === 'staff' || u.role === 'phlebotomist');
        
        const agentList = ['Self (Patient Walk-in)'];
        staff.forEach(s => {
          const sName = s.name || s.doctorName || s.username;
          if (sName && !agentList.includes(sName)) {
            agentList.push(sName);
          }
        });
        if (agentList.length > 1) {
          setCollectionAgents(agentList);
        }
      })
      .catch(() => {});

    // Fetch dynamic test masters
    Promise.all([
      client.get('/lab/tests').catch(() => ({ data: [] })),
      client.get('/lab/packages').catch(() => ({ data: [] }))
    ]).then(([tRes, pRes]) => {
      const dbTests = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.tests || []);
      const dbPkgs = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.packages || []);

      const formattedTests = dbTests.map(t => ({
        id: t._id || t.testKey,
        title: t.title || t.test,
        category: (t.category || 'LAB').toUpperCase(),
        price: Number(t.basePrice || t.totalAmount || 100)
      }));

      const formattedPkgs = dbPkgs.map(p => ({
        id: p._id,
        title: p.name || p.title,
        category: 'LAB',
        packageCode: p.code || 'PKG',
        price: Number(p.price || 500),
        isPackage: true,
        tests: p.tests || []
      }));

      setAllTests([...formattedTests, ...formattedPkgs]);
    });
  }, []);

  // Pre-fill from query params
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

    if (fn || uhid || pid || mobile) {
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
        setCaseData(prev => ({ ...prev, referredBy: ref }));
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
    }
  }, [searchParams]);

  const isPhoneValid = /^\d{10}$/.test(patientData.mobileNumber?.trim() || '');

  // Phone search & Autofill
  const handlePhoneSearch = async (overrideMobile) => {
    const rawMobile = (typeof overrideMobile === 'string' ? overrideMobile : patientData.mobileNumber)?.trim();
    const mobile = rawMobile ? rawMobile.replace(/\D/g, '') : '';
    if (!mobile || mobile.length < 5) return;
    setSearchingPhone(true);
    try {
      // 1. Primary lookup via /patients/lookup
      const { data } = await client.get('/patients/lookup', { params: { mobile } });
      const found = data?.found ? data.patient : null;

      if (found) {
        const rawName = (found.patientName || '').trim();
        let title = 'Mr.';
        let cleanName = rawName;
        const titleMatch = rawName.match(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Master)\s+/i);
        if (titleMatch) {
          title = titleMatch[1];
          cleanName = rawName.slice(titleMatch[0].length).trim();
        } else if (found.gender === 'Female') {
          title = 'Mrs.';
        }
        const parts = cleanName.split(' ').filter(Boolean);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        // Calculate age
        let ageStr = '';
        if (found.age !== undefined && found.age !== null && found.age !== '') {
          ageStr = String(found.age);
        } else if (found.dob) {
          const bYear = new Date(found.dob).getFullYear();
          const cAge = new Date().getFullYear() - bYear;
          if (cAge >= 0 && cAge <= 150) ageStr = String(cAge);
        }

        setPatientData(prev => ({
          ...prev,
          patientId: found._id || found.patientId,
          uhid: found.uhid || '',
          lookedUpPatientName: rawName,
          title: title,
          firstName: firstName,
          lastName: lastName,
          gender: found.gender || prev.gender || 'Male',
          ageYears: ageStr || prev.ageYears || '',
          email: found.email || prev.email,
          address: found.address && found.address !== 'Not specified' ? found.address : prev.address,
          aadhaar: found.aadhaar || prev.aadhaar
        }));

        if (found.email) setShowFields(prev => ({ ...prev, email: true }));
        if (found.address && found.address !== 'Not specified') setShowFields(prev => ({ ...prev, address: true }));
        if (found.aadhaar) setShowFields(prev => ({ ...prev, aadhaar: true }));

        toast.success(`Found patient: ${rawName} (${found.uhid || 'UHID'})`);
        return;
      }

      // 2. Fallback lookup via /patients/registrations/list?search=...
      const listRes = await client.get('/patients/registrations/list', { params: { search: mobile, limit: 1 } });
      const regFound = listRes.data?.registrations?.[0];
      if (regFound) {
        const rawName = (regFound.patientName || '').trim();
        let title = 'Mr.';
        let cleanName = rawName;
        const titleMatch = rawName.match(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Master)\s+/i);
        if (titleMatch) {
          title = titleMatch[1];
          cleanName = rawName.slice(titleMatch[0].length).trim();
        } else if (regFound.gender === 'Female') {
          title = 'Mrs.';
        }
        const parts = cleanName.split(' ').filter(Boolean);

        let ageStr = '';
        if (regFound.age) {
          ageStr = String(regFound.age);
        } else if (regFound.dob) {
          const bYear = new Date(regFound.dob).getFullYear();
          const cAge = new Date().getFullYear() - bYear;
          if (cAge >= 0 && cAge <= 150) ageStr = String(cAge);
        }

        setPatientData(prev => ({
          ...prev,
          patientId: regFound.patientId || regFound._id,
          uhid: regFound.uhid || '',
          lookedUpPatientName: rawName,
          title: title,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          gender: regFound.gender || prev.gender || 'Male',
          ageYears: ageStr || prev.ageYears || '',
          email: regFound.email || prev.email,
          address: regFound.address && regFound.address !== 'Not specified' ? regFound.address : prev.address,
          aadhaar: regFound.aadhaar || prev.aadhaar
        }));

        if (regFound.email) setShowFields(prev => ({ ...prev, email: true }));
        if (regFound.address && regFound.address !== 'Not specified') setShowFields(prev => ({ ...prev, address: true }));
        if (regFound.aadhaar) setShowFields(prev => ({ ...prev, aadhaar: true }));

        toast.success(`Found patient: ${rawName} (${regFound.uhid || 'UHID'})`);
      }
    } catch (err) {
      console.warn('Patient lookup fallback error:', err);
    } finally {
      setSearchingPhone(false);
    }
  };

  const handlePatientChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;
    
    setPatientData(prev => {
      const updated = {
        ...prev,
        [name]: finalVal
      };

      // If user is editing firstName or lastName, check if it matches the looked up patient
      if ((name === 'firstName' || name === 'lastName') && prev.lookedUpPatientName) {
        const normalize = (s) => (s || '').toLowerCase().replace(/^(mr|mrs|ms|dr|master|miss)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
        const currentFullName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
        if (normalize(currentFullName) !== normalize(prev.lookedUpPatientName)) {
          updated.patientId = null;
          updated.uhid = '';
        }
      }

      return updated;
    });

    if (name === 'mobileNumber' && typeof finalVal === 'string') {
      const cleanDigits = finalVal.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        handlePhoneSearch(cleanDigits);
      }
    }
  };

  const toggleField = (field) => {
    setShowFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Add / remove test toggle
  const handleToggleService = (test) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === test.id || s.title.toLowerCase() === test.title.toLowerCase());
      if (exists) {
        return prev.filter(s => !(s.id === test.id || s.title.toLowerCase() === test.title.toLowerCase()));
      } else {
        return [...prev, { ...test, price: Number(test.price) || 0 }];
      }
    });
  };

  const handleRemoveService = (service) => {
    setSelectedServices(prev => prev.filter(s => !(s.id === service.id || s.title === service.title)));
  };

  const handleUpdateServicePrice = (test, newPrice) => {
    const val = newPrice === '' ? '' : Number(newPrice);
    setSelectedServices(prev =>
      prev.map(s =>
        (s.id && s.id === test.id) || (s.title && s.title === test.title)
          ? { ...s, price: val }
          : s
      )
    );
  };

  // Save updated test price to DB master test catalog so all future patients receive this new price
  const handleSaveMasterPrice = async (testToUpdate, newPrice) => {
    const priceNum = Number(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid positive price');
      return;
    }
    setSavingPrice(true);
    try {
      const res = await client.post('/lab/tests/update-price', {
        testId: testToUpdate.id && !String(testToUpdate.id).startsWith('custom_') && !String(testToUpdate.id).startsWith('opd_') ? testToUpdate.id : undefined,
        testName: testToUpdate.title,
        title: testToUpdate.title,
        category: testToUpdate.category || selectedCategory || 'LAB',
        price: priceNum
      });

      const updatedDoc = res.data?.test;

      // Update in allTests master state
      setAllTests(prev => {
        const idx = prev.findIndex(
          t => (t.id && t.id === testToUpdate.id) || t.title.toLowerCase() === testToUpdate.title.toLowerCase()
        );
        const updatedItem = {
          ...testToUpdate,
          id: updatedDoc?._id || testToUpdate.id,
          price: priceNum
        };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...updatedItem };
          return copy;
        }
        return [...prev, updatedItem];
      });

      // Also update currently selected services
      setSelectedServices(prev =>
        prev.map(s =>
          (s.id && s.id === testToUpdate.id) || s.title.toLowerCase() === testToUpdate.title.toLowerCase()
            ? { ...s, price: priceNum }
            : s
        )
      );

      toast.success(`Price updated to ₹${priceNum} for "${testToUpdate.title}". Future bills for other patients will now use this updated price.`);
      setEditingTestPrice(null);
    } catch (err) {
      console.error('Failed to update price:', err);
      toast.error(err.response?.data?.message || 'Failed to update test price');
    } finally {
      setSavingPrice(false);
    }
  };

  // Financial calculations
  const totalAmount = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const discountPercent = Number(paymentData.discountPercent) || 0;
  const discountAmount = (totalAmount * discountPercent) / 100;
  const netTotal = Math.max(0, totalAmount - discountAmount);

  useEffect(() => {
    if (!paymentData.isManualAmountReceived) {
      setPaymentData(prev => ({
        ...prev,
        amountReceived: String(netTotal)
      }));
    }
  }, [netTotal, paymentData.isManualAmountReceived]);

  const amountReceivedNum = paymentData.amountReceived !== undefined && paymentData.amountReceived !== ''
    ? Number(paymentData.amountReceived)
    : netTotal;
  const balanceDue = Math.max(0, netTotal - amountReceivedNum);

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

          const selectedDocObj = referrers.find(r => r.name === caseData.referredBy && r.id?.startsWith('doc_'))?.rawDoctor;
          const dept = selectedCategory === 'LAB' ? 'Laboratory' : (selectedCategory ? `${selectedCategory.toUpperCase()} / Lab` : 'Laboratory');

          const patientPayload = {
            patientName: `${patientData.firstName.trim()} ${patientData.lastName.trim()}`.trim(),
            gender: patientData.gender || 'Male',
            dob: calculatedDob,
            mobile: patientData.mobileNumber?.trim() || '9999999999',
            email: patientData.email || '',
            address: patientData.address?.trim() || 'Not specified',
            aadhaar: patientData.aadhaar || '',
            department: dept,
            doctorId: selectedDocObj?._id || undefined,
            visitType: 'Lab',
            slot: 'Lab Walk-in',
            isLab: true,
            isEmergency: false
          };

          const newPatientRes = await client.post('/patients/create', patientPayload);
          const p = newPatientRes.data?.patient || newPatientRes.data;
          if (p) {
            resolvedPatientId = p.patientId || p._id;
            setPatientData(prev => ({ ...prev, patientId: resolvedPatientId, uhid: p.uhid || prev.uhid }));
          }
        } catch (patientErr) {
          console.warn('Patient creation fallback:', patientErr);
        }
      }

      // 2. Submit Direct Lab Request / Bill
      const selectedDocObj = referrers.find(r => r.name === caseData.referredBy && r.id?.startsWith('doc_'))?.rawDoctor;
      const testNames = selectedServices.map(s => s.title);
      const billPayload = {
        patientId: resolvedPatientId,
        doctorId: selectedDocObj?._id || undefined,
        patientName: `${patientData.title} ${patientData.firstName} ${patientData.lastName}`.trim(),
        firstName: patientData.firstName?.trim(),
        lastName: patientData.lastName?.trim(),
        patientMobile: patientData.mobileNumber?.trim(),
        mobile: patientData.mobileNumber?.trim(),
        gender: patientData.gender || 'Male',
        ageYears: patientData.ageYears,
        uhid: patientData.uhid || '',
        address: patientData.address || 'Not specified',
        email: patientData.email || '',
        aadhaar: patientData.aadhaar || '',
        department: 'Laboratory',
        visitType: 'Lab',
        tests: testNames,
        collectionType: caseData.collectionCentre,
        bookingDate: new Date(),
        remarks: `${paymentData.remarks ? paymentData.remarks + ' | ' : ''}Referred by: ${caseData.referredBy || 'Self'}`,
        paymentMode: paymentData.paymentMode,
        discountPercent: Number(paymentData.discountPercent) || 0,
        amountReceived: Number(amountReceivedNum) || 0
      };

      const response = await client.post('/lab/requests/direct', billPayload);
      const resData = response.data || response;

      // 3. Build receipt payload
      const staffName = user?.doctorName || user?.name || user?.username || 'Staff';

      const receiptPayload = {
        billNo: resData.labId || resData.billNo || resData.bill?._id?.substring(0, 8) || String(Math.floor(1000 + Math.random() * 9000)),
        categoryBadge: selectedCategory === 'LAB' ? 'L1' : selectedCategory,
        patientName: `${patientData.title} ${patientData.firstName} ${patientData.lastName}`.trim(),
        ageSex: `${patientData.ageYears || '25'} YRS / ${patientData.gender === 'Female' ? 'F' : 'M'}`,
        mobileNumber: patientData.mobileNumber || 'N/A',
        referredBy: caseData.referredBy || 'Self',
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        receivedBy: staffName,
        paymentMode: paymentData.paymentMode,
        investigations: selectedServices.map((s, idx) => ({
          sno: idx + 1,
          name: s.title,
          amount: Number(s.price) || 0
        })),
        totalAmount: netTotal,
        amountPaid: amountReceivedNum,
        balanceDue: balanceDue
      };

      setCreatedBillReceiptData(receiptPayload);
      setShowReceiptModal(true);

      setSuccessMessage(
        `Bill created successfully! ${resData.message || 'Lab request generated.'}`
      );
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Create bill error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to create bill. Please check required fields.'
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
    setCaseData({
      referredBy: 'Self',
      collectionCentre: 'Main Hospital Lab',
      sampleAgent: 'Self (Patient Walk-in)'
    });
    setSuccessMessage(null);
    setErrorMessage(null);
    setCreatedBillReceiptData(null);
    setShowReceiptModal(false);
  };

  // Add custom test handler
  const handleAddCustomTest = () => {
    if (!customTestName.trim()) {
      alert('Please enter test name');
      return;
    }
    const newTest = {
      id: `custom_${Date.now()}`,
      title: customTestName.trim(),
      category: customTestCategory,
      price: Number(customTestPrice) || 100
    };
    setSelectedServices(prev => [...prev, newTest]);
    setCustomTestName('');
    setCustomTestPrice('');
    setShowAddCustomModal(false);
  };

  // Category tests helper - ensures updated master prices in allTests override defaults
  const getCategoryTests = (catId) => {
    const defaults = (DEFAULT_CATALOG[catId] || []).map(t => ({ ...t, category: catId }));
    
    // Merge defaults with dynamic allTests, prioritizing dynamic allTests price
    const merged = defaults.map(def => {
      const dynamicMatch = allTests.find(
        dt => dt.category === catId && (dt.id === def.id || dt.title.toLowerCase() === def.title.toLowerCase())
      );
      return dynamicMatch ? { ...def, ...dynamicMatch, price: Number(dynamicMatch.price) } : def;
    });

    // Include extra dynamic tests not present in defaults
    const extraTests = allTests.filter(
      t => t.category === catId && !t.isPackage && !merged.some(m => m.title.toLowerCase() === t.title.toLowerCase())
    );

    const combined = [...merged, ...extraTests];
    const query = (searchQueries[catId] || '').toLowerCase();
    if (!query) return combined;
    return combined.filter(t => t.title.toLowerCase().includes(query));
  };

  const getCategoryPackages = (catId) => {
    const defaults = DEFAULT_PACKAGES.filter(p => p.category === catId);
    const dynamic = allTests.filter(t => t.category === catId && t.isPackage);
    return [...defaults, ...dynamic];
  };

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/reception/patients')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
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
            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={() => navigate('/reception/patients')}
            className="px-3.5 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors cursor-pointer"
          >
            Patient Directory
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="px-3 py-1 bg-orange-500 text-white rounded-md text-xs font-bold shadow-xs hover:bg-orange-600 flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill Receipt</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              Create Another Bill
            </button>
            <button
              type="button"
              onClick={() => navigate('/reception/patients')}
              className="px-3 py-1 border border-emerald-300 text-emerald-800 rounded-md text-xs font-bold hover:bg-emerald-100 cursor-pointer"
            >
              Patient Directory
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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-orange-500" />
            <span>Patient Details</span>
          </h2>
          {patientData.uhid && (
            <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 rounded-md text-xs font-semibold border border-orange-200">
              UHID: {patientData.uhid}
            </span>
          )}
        </div>

        {/* Row 1: Mobile Search, Title, First Name, Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Mobile Number */}
          <div className="md:col-span-4">
            <label className="lab-label">Mobile Number</label>
            <div className="flex items-center">
              <span className={`h-9 px-2.5 border border-r-0 rounded-l-lg text-xs font-semibold flex items-center transition-colors ${
                isPhoneValid
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                +91
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  name="mobileNumber"
                  maxLength={10}
                  value={patientData.mobileNumber || ''}
                  onChange={handlePatientChange}
                  onBlur={() => handlePhoneSearch()}
                  placeholder="Enter mobile no."
                  className={`w-full h-9 pl-3 pr-8 bg-white rounded-r-lg text-xs transition-colors focus:outline-none ${
                    isPhoneValid
                      ? 'border border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 font-medium'
                      : 'border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handlePhoneSearch()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${
                    isPhoneValid ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-orange-500'
                  }`}
                >
                  {isPhoneValid && !searchingPhone ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Search className={`w-3.5 h-3.5 ${searchingPhone ? 'animate-spin text-orange-500' : ''}`} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="md:col-span-2">
            <label className="lab-label">Title*</label>
            <select
              name="title"
              value={patientData.title || 'Mr.'}
              onChange={handlePatientChange}
              className="lab-input text-xs"
            >
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Smt.">Smt.</option>
              <option value="Kumari">Kumari</option>
              <option value="Shri.">Shri.</option>
              <option value="Miss.">Miss.</option>
              <option value="Master">Master</option>
              <option value="Mohd.">Mohd.</option>
              <option value="Baby">Baby</option>
              <option value="Baby of">Baby of</option>
              <option value="Wife of">Wife of</option>
              <option value="Mother of">Mother of</option>
              <option value="Son of">Son of</option>
              <option value="Daughter of">Daughter of</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>

          {/* First Name */}
          <div className="md:col-span-3">
            <label className="lab-label lab-label-required">First Name</label>
            <input
              type="text"
              name="firstName"
              required
              value={patientData.firstName || ''}
              onChange={handlePatientChange}
              placeholder="First name"
              className="lab-input"
            />
          </div>

          {/* Last Name */}
          <div className="md:col-span-3">
            <label className="lab-label">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={patientData.lastName || ''}
              onChange={handlePatientChange}
              placeholder="Last name"
              className="lab-input"
            />
          </div>
        </div>

        {/* Row 2: Sex & Age */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* Sex */}
          <div className="md:col-span-5">
            <label className="lab-label lab-label-required">Sex</label>
            <div className="flex items-center gap-2 h-9">
              {['Male', 'Female', 'Other'].map((g) => (
                <label
                  key={g}
                  className={`flex-1 h-full flex items-center justify-center rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    patientData.gender === g
                      ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={patientData.gender === g}
                    onChange={handlePatientChange}
                    className="sr-only"
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Age (Years, Months, Days) */}
          <div className="md:col-span-7">
            <label className="lab-label lab-label-required">Age</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <input
                  type="number"
                  name="ageYears"
                  min="0"
                  max="120"
                  value={patientData.ageYears || ''}
                  onChange={handlePatientChange}
                  placeholder="Yrs"
                  className="lab-input pr-9"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                  Yrs
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  name="ageMonths"
                  min="0"
                  max="11"
                  value={patientData.ageMonths || ''}
                  onChange={handlePatientChange}
                  placeholder="M"
                  className="lab-input pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                  M
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  name="ageDays"
                  min="0"
                  max="31"
                  value={patientData.ageDays || ''}
                  onChange={handlePatientChange}
                  placeholder="D"
                  className="lab-input pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                  D
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable chips for additional details */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {!showFields.email && (
              <button
                type="button"
                onClick={() => toggleField('email')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Email</span>
              </button>
            )}
            {!showFields.address && (
              <button
                type="button"
                onClick={() => toggleField('address')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Address</span>
              </button>
            )}
            {!showFields.aadhaar && (
              <button
                type="button"
                onClick={() => toggleField('aadhaar')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Aadhaar</span>
              </button>
            )}
            {!showFields.history && (
              <button
                type="button"
                onClick={() => toggleField('history')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Patient History</span>
              </button>
            )}
          </div>

          {/* Dynamic Expanded Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {showFields.email && (
              <div className="relative">
                <label className="lab-label flex items-center justify-between">
                  <span>Email Address</span>
                  <button type="button" onClick={() => toggleField('email')} className="text-slate-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </label>
                <input
                  type="email"
                  name="email"
                  value={patientData.email || ''}
                  onChange={handlePatientChange}
                  placeholder="patient@example.com"
                  className="lab-input"
                />
              </div>
            )}

            {showFields.address && (
              <div className="relative">
                <label className="lab-label flex items-center justify-between">
                  <span>Residential Address</span>
                  <button type="button" onClick={() => toggleField('address')} className="text-slate-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </label>
                <input
                  type="text"
                  name="address"
                  value={patientData.address || ''}
                  onChange={handlePatientChange}
                  placeholder="Street address, city, pin code"
                  className="lab-input"
                />
              </div>
            )}

            {showFields.aadhaar && (
              <div className="relative">
                <label className="lab-label flex items-center justify-between">
                  <span>Aadhaar Number</span>
                  <button type="button" onClick={() => toggleField('aadhaar')} className="text-slate-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </label>
                <input
                  type="text"
                  name="aadhaar"
                  value={patientData.aadhaar || ''}
                  onChange={handlePatientChange}
                  placeholder="12-digit Aadhaar number"
                  className="lab-input"
                />
              </div>
            )}

            {showFields.history && (
              <div className="relative md:col-span-2">
                <label className="lab-label flex items-center justify-between">
                  <span>Clinical Notes & Patient History</span>
                  <button type="button" onClick={() => toggleField('history')} className="text-slate-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </label>
                <textarea
                  name="history"
                  rows="2"
                  value={patientData.history || ''}
                  onChange={handlePatientChange}
                  placeholder="Fasting status, ongoing medications, medical conditions..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2 — CASE DETAILS & SERVICE CATEGORIES */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" />
            <span>Case Details</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Referred By */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              * Referred By
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReferrerDropdown(!showReferrerDropdown)}
                className="w-full h-9 px-3 bg-white border border-orange-400 rounded-md text-xs font-medium text-slate-800 flex items-center justify-between hover:border-orange-600 focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
              >
                <span className="truncate font-medium">{caseData.referredBy || 'Self'}</span>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {showReferrerDropdown && (
                <div 
                  className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in"
                  onMouseLeave={() => setShowReferrerDropdown(false)}
                >
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <input
                      type="text"
                      autoFocus
                      value={referrerSearchQuery}
                      onChange={(e) => setReferrerSearchQuery(e.target.value)}
                      placeholder="Search referrer doctor or type name..."
                      className="w-full h-8 px-2.5 bg-white border border-slate-300 focus:border-orange-500 rounded-md text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {filteredReferrers.map((r) => {
                      const itemText = r.name;
                      const isSelected = caseData.referredBy === itemText;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setCaseData(prev => ({ ...prev, referredBy: itemText }));
                            setShowReferrerDropdown(false);
                            setReferrerSearchQuery('');
                          }}
                          className={`w-full text-left px-3 py-2 transition-colors cursor-pointer ${
                            isSelected ? 'bg-orange-500 text-white font-bold' : 'hover:bg-orange-50 text-slate-800'
                          }`}
                        >
                          {itemText}
                        </button>
                      );
                    })}

                    {referrerSearchQuery.trim() && !referrers.some(r => r.name.toLowerCase() === referrerSearchQuery.toLowerCase().trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          const customName = referrerSearchQuery.trim();
                          setReferrers(prev => [...prev, { id: `custom_${Date.now()}`, name: customName }]);
                          setCaseData(prev => ({ ...prev, referredBy: customName }));
                          setShowReferrerDropdown(false);
                          setReferrerSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-orange-600 font-semibold hover:bg-orange-50 cursor-pointer border-t border-dashed border-orange-200"
                      >
                        + Use "{referrerSearchQuery.trim()}" as referrer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collection Centre */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              * Collection Centre
            </label>
            <select
              value={caseData.collectionCentre}
              onChange={(e) => setCaseData(prev => ({ ...prev, collectionCentre: e.target.value }))}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-orange-500"
            >
              {collectionCentres.map((centre) => (
                <option key={centre} value={centre}>{centre}</option>
              ))}
            </select>
          </div>

          {/* Sample Agent */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              * Sample Agent
            </label>
            <select
              value={caseData.sampleAgent}
              onChange={(e) => setCaseData(prev => ({ ...prev, sampleAgent: e.target.value }))}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-orange-500"
            >
              {collectionAgents.map((agent) => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Pills Grid */}
        <div className="pt-2 border-t border-slate-100">
          <label className="lab-label mb-2">Service Category Tabs</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (!openBoxes.includes(cat.id)) {
                      setOpenBoxes(prev => [...prev, cat.id]);
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer
                    ${isSelected
                      ? 'border-orange-500 bg-orange-500 text-white shadow-xs font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-orange-50 hover:border-orange-200'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span className="text-[10px] uppercase tracking-wider truncate w-full">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3 — SERVICE SELECTOR (INVESTIGATION ACCORDIONS) */}
      <div className="space-y-4">
        {CATEGORIES.filter(c => openBoxes.includes(c.id)).map((cat) => {
          const categoryTests = getCategoryTests(cat.id);
          const categoryPackages = getCategoryPackages(cat.id);

          return (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              {/* Category Box Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <cat.icon className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-slate-800 text-sm">{cat.title}</h3>
                  <span className="text-xs text-slate-500 font-normal">
                    ({categoryTests.length} tests available)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTestCategory(cat.id);
                      setShowAddCustomModal(true);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom</span>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {/* Search Bar for this category */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQueries[cat.id] || ''}
                    onChange={(e) => setSearchQueries(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    placeholder={`Search ${cat.label} tests by name...`}
                    className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Popular Packages in Category */}
                {categoryPackages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Popular Profiles & Packages
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {categoryPackages.map(pkg => {
                        const isPkgChecked = selectedServices.some(s => s.id === pkg.id || s.title === pkg.title);
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => handleToggleService(pkg)}
                            className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isPkgChecked
                                ? 'bg-orange-50 border-orange-500 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="inline-block px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded">
                                  PACKAGE
                                </span>
                                <h4 className="font-bold text-xs text-slate-800 mt-1">{pkg.title}</h4>
                              </div>
                              <span className="font-bold text-xs text-slate-900">₹{pkg.price}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                              <span>{pkg.tests?.length || 4} Tests included</span>
                              <span className={`text-xs font-bold ${isPkgChecked ? 'text-orange-600' : 'text-slate-400'}`}>
                                {isPkgChecked ? '✓ Added' : '+ Add'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Standard Individual Tests Grid */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Individual Investigations
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                    {categoryTests.map((t) => {
                      const isChecked = selectedServices.some(s => s.id === t.id || s.title === t.title);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleService(t)}
                          className={`
                            group p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer select-none
                            ${isChecked
                              ? 'bg-orange-50 border-orange-500 text-orange-900 font-semibold shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-slate-900">₹{t.price}</span>
                            <button
                              type="button"
                              title="Edit & Save Test Price"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTestPrice(t);
                                setNewPriceInput(String(t.price));
                              }}
                              className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-100/70 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 4 — PAYMENT DETAILS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" />
            <span>Payment Details</span>
          </h2>
          <span className="text-xs text-slate-500">
            {selectedServices.length} Test(s) Selected
          </span>
        </div>

        {/* Selected Services Summary Table */}
        {selectedServices.length > 0 && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Selected Tests & Services
              </p>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                Edit price inline or click <Save className="w-3 h-3 text-orange-500 inline" /> to save as new master price
              </span>
            </div>
            <div className="divide-y divide-slate-200/60 max-h-48 overflow-y-auto pr-1">
              {selectedServices.map((s, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-slate-800 truncate">{s.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">({s.category || 'LAB'})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                      <span className="text-slate-400 text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={s.price === '' ? '' : s.price}
                        onChange={(e) => handleUpdateServicePrice(s, e.target.value)}
                        className="w-16 text-right text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      title="Save this price to Test Master (for all future patients)"
                      onClick={() => handleSaveMasterPrice(s, s.price)}
                      className="p-1 rounded text-slate-500 hover:text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(s)}
                      className="text-slate-400 hover:text-red-500 font-bold p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Structure for Calculations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Numeric inputs & calculation */}
          <div className="space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">₹{totalAmount.toFixed(2)}</span>
            </div>

            {/* Discount (%) */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-600">Discount (%)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="discountPercent"
                  value={paymentData.discountPercent}
                  onChange={(e) => setPaymentData({ ...paymentData, discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                  className="w-20 h-8 px-2 text-right border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                />
                <span className="text-xs font-semibold text-slate-500">
                  (-₹{discountAmount.toFixed(2)})
                </span>
              </div>
            </div>

            {/* Net Total */}
            <div className="flex items-center justify-between py-2 border-b border-slate-200 bg-orange-50/50 px-2 rounded-lg">
              <span className="text-xs font-bold text-slate-900">Net Total</span>
              <span className="text-base font-bold text-orange-600">₹{netTotal.toFixed(2)}</span>
            </div>

            {/* Amount Received */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-600">Amount Received</span>
              <input
                type="number"
                min="0"
                name="amountReceived"
                value={paymentData.amountReceived}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  amountReceived: e.target.value,
                  isManualAmountReceived: true
                })}
                placeholder={String(netTotal)}
                className="w-28 h-8 px-2 text-right border border-slate-200 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Balance Due */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs font-semibold text-slate-700">Balance Due</span>
              <span className={`text-sm font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ₹{balanceDue.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Right Column: Payment Method & Submit */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Payment Mode */}
              <div>
                <label className="lab-label">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card', 'Bank Transfer'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, paymentMode: mode })}
                      className={`
                        h-9 rounded-lg border text-xs font-medium transition-colors cursor-pointer
                        ${paymentData.paymentMode === mode
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }
                      `}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="lab-label">Remarks / Notes</label>
                <input
                  type="text"
                  name="remarks"
                  value={paymentData.remarks || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                  placeholder="Optional internal remark"
                  className="lab-input"
                />
              </div>
            </div>

            {/* CREATE BILL CTA BUTTON */}
            <button
              type="button"
              disabled={submitting || selectedServices.length === 0}
              onClick={handleCreateBill}
              className={`
                w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer
                ${submitting || selectedServices.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.99] shadow-orange-500/25'
                }
              `}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Bill...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Save Bill & Generate Receipt (₹{netTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Custom Test Adder Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Add Custom Test / Service</h3>
              <button onClick={() => setShowAddCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="lab-label">Category</label>
                <select
                  value={customTestCategory}
                  onChange={(e) => setCustomTestCategory(e.target.value)}
                  className="lab-input"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="lab-label lab-label-required">Test Name</label>
                <input
                  type="text"
                  value={customTestName}
                  onChange={(e) => setCustomTestName(e.target.value)}
                  placeholder="e.g. Special Serology Test"
                  className="lab-input"
                />
              </div>

              <div>
                <label className="lab-label lab-label-required">Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={customTestPrice}
                  onChange={(e) => setCustomTestPrice(e.target.value)}
                  placeholder="e.g. 500"
                  className="lab-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomTest}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Add Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1.5: Edit Test Master Price Modal */}
      {editingTestPrice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800">Update Lab Test Price</h3>
              </div>
              <button onClick={() => setEditingTestPrice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Test Name</label>
                <div className="font-bold text-slate-900 mt-0.5 text-sm">{editingTestPrice.title}</div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{editingTestPrice.category || 'LAB'}</span>
              </div>

              <div>
                <label className="lab-label lab-label-required">New Master Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    value={newPriceInput}
                    onChange={(e) => setNewPriceInput(e.target.value)}
                    placeholder="Enter price"
                    className="lab-input pl-7 text-sm font-bold text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  This price will be saved in the database master catalog and automatically applied for all future patients.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={savingPrice}
                onClick={() => setEditingTestPrice(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPrice}
                onClick={() => handleSaveMasterPrice(editingTestPrice, newPriceInput)}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {savingPrice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Apply Price</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Exact Lab Bill Receipt Modal matching Labs module */}
      {showReceiptModal && createdBillReceiptData && (
        <LabBillReceipt
          billData={createdBillReceiptData}
          hospitalSettings={hospitalInfo}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}
