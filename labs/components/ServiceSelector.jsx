'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Check, 
  TestTube, 
  Loader2, 
  X, 
  Sliders, 
  FlaskConical, 
  Activity, 
  Scan, 
  Radio, 
  Layers, 
  Heart, 
  Zap, 
  ChevronDown 
} from 'lucide-react';
import api from '../lib/api';

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
    { id: 'custom_test', title: 'test', price: 100 },
    { id: 't4', title: 'Serum thyroxine, T4', price: 200 },
    { id: 't3', title: 'Serum Triiodothyronine, T3', price: 200 },
    { id: 'stool_routine', title: 'Stool Routine Examination', price: 150 },
    { id: 'stool_reducing_substances', title: 'Stool reducing substances', price: 150 },
    { id: 'skin_test_leprosy', title: 'Skin test for Leprosy', price: 350 },
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
  },
  {
    id: 'pkg_usg_default',
    title: 'Complete Abdominal & Pelvic Scan Package',
    category: 'USG',
    packageCode: 'PKG-USG-01',
    price: 1599,
    originalPrice: 2000,
    isPackage: true,
    description: 'Complete Upper & Lower Abdomen, KUB, Pelvis scan',
    tests: [
      { testName: 'Whole Abdomen Female', price: 500 },
      { testName: 'K.U.B. FEMALE', price: 400 },
      { testName: 'Lower Abdomen', price: 400 }
    ]
  }
];

const toast = {
  success: (msg) => console.log('Notice:', msg),
  error: (msg) => alert(msg)
};

export default function ServiceSelector({ selectedServices, onToggleService, onRemoveService, onUpdateServicePrice }) {
  const router = useRouter();
  
  // Track open investigation box categories (default LAB open)
  const [openBoxes, setOpenBoxes] = useState(['LAB']);
  const [allTests, setAllTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES);
  
  // Per-box search state & dropdown open state
  const [searchState, setSearchState] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Per-box payment override state (Paid, Discount)
  const [boxPayments, setBoxPayments] = useState({
    'LAB': { paid: 0, discount: 0 },
    'USG': { paid: 0, discount: 0 },
    'DIGITAL XRAY': { paid: 0, discount: 0 }
  });

  // Modal states for Quick Add and Fee Update
  const [showAddModalFor, setShowAddModalFor] = useState(null);
  const [newTestForm, setNewTestForm] = useState({ title: '', price: '' });
  
  const [updateFeeModalTest, setUpdateFeeModalTest] = useState(null);
  const [updateFeeValue, setUpdateFeeValue] = useState('');

  // Close dropdown automatically when clicking outside or on another field
  useEffect(() => {
    if (!activeDropdown) return;

    const handleGlobalClick = (event) => {
      const isInsideSearchBox = event.target.closest?.(`.test-search-box-${activeDropdown}`);
      const isInsideDropdown = event.target.closest?.(`.test-dropdown-${activeDropdown}`);
      
      if (!isInsideSearchBox && !isInsideDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [activeDropdown]);

  // Load categories from backend
  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await api.get('/lab/test-categories').catch(() => []);
        if (Array.isArray(catRes) && catRes.length > 0) {
          const mergedMap = new Map();
          CATEGORIES.forEach(cat => {
            mergedMap.set(cat.id.toUpperCase(), cat);
          });
          catRes.forEach(cat => {
            const catName = (cat.name || cat.category || '').toUpperCase();
            if (catName && catName !== 'DIAGNOSIS' && !mergedMap.has(catName)) {
              mergedMap.set(catName, {
                id: catName,
                label: catName,
                title: `${catName} Investigations`,
                icon: FlaskConical
              });
            }
          });
          setDynamicCategories(Array.from(mergedMap.values()));
        }
      } catch (err) {
        console.warn('Error loading dynamic categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Load lab tests & packages from backend
  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      try {
        const [testsRes, pkgsRes] = await Promise.all([
          api.get('/lab/tests').catch(() => []),
          api.get('/lab/packages').catch(() => [])
        ]);

        const rawTests = (Array.isArray(testsRes) && testsRes.length > 0) ? testsRes : [];
        const rawPkgs = (Array.isArray(pkgsRes) && pkgsRes.length > 0) ? pkgsRes : DEFAULT_PACKAGES;

        // Flatten DEFAULT_CATALOG into array of fallback tests
        const catalogFallback = Object.entries(DEFAULT_CATALOG).flatMap(([cat, tests]) => 
          tests.map(t => ({
            id: t.id,
            title: t.title,
            category: cat.toUpperCase(),
            price: t.price
          }))
        );

        const formattedTests = rawTests
          .filter(t => (t.category || '').toUpperCase() !== 'DIAGNOSIS')
          .map(t => ({
            id: t._id || t.id,
            title: t.title || t.test || 'Lab Test',
            category: (t.category || 'LAB').toUpperCase(),
            price: t.basePrice || t.totalAmount || t.amount || 400
          }));

        // Merge rawTests with catalogFallback to ensure everything is searchable
        const testMap = new Map();
        catalogFallback.forEach(t => testMap.set(`${t.category}_${t.title.toLowerCase()}`, t));
        formattedTests.forEach(t => testMap.set(`${t.category}_${t.title.toLowerCase()}`, t));
        const mergedTests = Array.from(testMap.values());

        const formattedPkgs = rawPkgs
          .filter(p => p.status !== 'Inactive')
          .map(pkg => ({
            id: pkg._id || pkg.id,
            title: pkg.name || pkg.title,
            category: (pkg.category || 'LAB').toUpperCase(),
            price: pkg.price || 0,
            originalPrice: pkg.originalPrice || 0,
            isPackage: true,
            packageCode: pkg.code || pkg.packageCode || '',
            tests: pkg.tests || [],
            description: pkg.description || ''
          }));

        setAllTests([...formattedPkgs, ...mergedTests]);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, []);

  // Toggle open box section when clicking top modality tab
  const handleToggleCategoryBox = (catId) => {
    if (openBoxes.includes(catId)) {
      setOpenBoxes(openBoxes.filter(b => b !== catId));
    } else {
      setOpenBoxes([...openBoxes, catId]);
    }
  };

  const handleCloseBox = (catId) => {
    setOpenBoxes(openBoxes.filter(b => b !== catId));
  };

  // Get test catalog for a given category
  const getCatalogForCategory = (catId) => {
    const targetCat = (catId || 'LAB').toUpperCase();
    return allTests.filter(t => {
      const itemCat = (t.category || 'LAB').toUpperCase();
      if (targetCat === 'USG') return itemCat === 'USG' || itemCat.includes('USG');
      if (targetCat === 'DIGITAL XRAY' || targetCat === 'DIGITAL X-RAY') return itemCat.includes('XRAY') || itemCat.includes('X-RAY');
      if (targetCat === 'XRAY') return itemCat === 'XRAY' || itemCat === 'X-RAY';
      return itemCat === targetCat;
    });
  };

  // Handle adding test from dropdown
  const handleSelectTestForBox = (test, catId) => {
    onToggleService({ ...test, category: catId });
    setSearchState(prev => ({ ...prev, [catId]: '' }));
    setActiveDropdown(null);
  };

  // Handle Quick Add New Test
  const handleQuickAddTest = async (e) => {
    e.preventDefault();
    if (!newTestForm.title.trim() || !newTestForm.price) {
      toast.error('Test title and fee are required');
      return;
    }
    const catId = showAddModalFor;
    const priceVal = parseFloat(newTestForm.price) || 0;
    
    const newObj = {
      id: `custom_${Date.now()}`,
      title: newTestForm.title.trim(),
      category: catId,
      price: priceVal
    };

    setAllTests(prev => [newObj, ...prev]);
    onToggleService(newObj);

    try {
      await api.post('/lab/tests', {
        category: catId,
        title: newTestForm.title.trim(),
        test: newTestForm.title.trim(),
        basePrice: priceVal,
        totalAmount: priceVal
      });
      toast.success(`Added ${newTestForm.title} to ${catId} ratelist`);
    } catch (err) {
      console.warn('Backend save notice', err);
    }

    setShowAddModalFor(null);
    setNewTestForm({ title: '', price: '' });
  };

  // Handle Quick Fee Update Modal
  const handleSaveFeeUpdate = async (e) => {
    e.preventDefault();
    if (!updateFeeModalTest) return;
    const newPrice = parseFloat(updateFeeValue) || 0;

    // Update in allTests
    setAllTests(prev => prev.map(t => (t.id === updateFeeModalTest.id || t.title === updateFeeModalTest.title ? { ...t, price: newPrice } : t)));
    
    // Update existing selected service price immutably via parent handler
    if (typeof onUpdateServicePrice === 'function') {
      onUpdateServicePrice(updateFeeModalTest, newPrice);
    } else {
      const match = selectedServices.find(s => s.id === updateFeeModalTest.id || s.title === updateFeeModalTest.title);
      if (match) {
        match.price = newPrice;
      }
    }

    const isValidMongoId = typeof updateFeeModalTest.id === 'string' && /^[0-9a-fA-F]{24}$/.test(updateFeeModalTest.id);

    if (isValidMongoId) {
      try {
        await api.put(`/lab/tests/${updateFeeModalTest.id}`, {
          category: updateFeeModalTest.category || 'LAB',
          title: updateFeeModalTest.title,
          basePrice: newPrice,
          totalAmount: newPrice
        });
        toast.success('Rate updated in Ratelist');
      } catch (err) {
        console.warn(err);
      }
    } else {
      toast.success(`Fee updated to ₹${newPrice}`);
    }

    setUpdateFeeModalTest(null);
  };

  return (
    <div className="space-y-6">
      {/* TOP MODALITY TABS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Select Investigation Categories (Click to open separate investigation boxes)
        </h3>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dynamicCategories.map((cat) => {
            const Icon = cat.icon;
            const isOpen = openBoxes.includes(cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategoryBox(cat.id)}
                className={`
                  flex flex-col items-center justify-center px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 min-w-[95px] h-14
                  ${isOpen
                    ? 'border-orange-500 bg-orange-500 text-white shadow-sm ring-2 ring-orange-500/30'
                    : 'border-slate-300 bg-white text-orange-600 hover:border-orange-400 hover:bg-orange-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 mb-1 ${isOpen ? 'text-white' : 'text-orange-500'}`} />
                <span className="text-[11px] font-extrabold tracking-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEPARATE INVESTIGATION BOXES */}
      {openBoxes.length === 0 ? (
        <div className="p-8 bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
          No investigation category selected. Click any category tab above (e.g. <strong>LAB</strong>, <strong>USG</strong>, <strong>DIGITAL XRAY</strong>) to open investigation boxes.
        </div>
      ) : (
        openBoxes.map((catId) => {
          const categoryObj = dynamicCategories.find(c => c.id === catId) || { label: catId, title: `${catId} Investigations` };
          const catalog = getCatalogForCategory(catId);
          const currentSearch = searchState[catId] || '';
          
          // Selected tests in this category box
          const boxSelectedTests = selectedServices.filter(s => {
            const sCat = (s.category || '').toUpperCase();
            if (sCat === catId) return true;
            if (catId === 'LAB' && (!sCat || sCat === 'LAB')) return true;
            return false;
          });

          // Filter catalog by search query (matches title, package code, description, or bundled tests)
          const q = currentSearch.trim().toLowerCase();
          const filteredCatalog = catalog.filter(t => {
            if (!q) return true;
            if (t.title && t.title.toLowerCase().includes(q)) return true;
            if (t.packageCode && t.packageCode.toLowerCase().includes(q)) return true;
            if (t.code && t.code.toLowerCase().includes(q)) return true;
            if (t.description && t.description.toLowerCase().includes(q)) return true;
            if (t.isPackage && Array.isArray(t.tests)) {
              return t.tests.some(child => {
                const childName = (typeof child === 'string' ? child : child.testName || child.title || child.name || '').toLowerCase();
                return childName.includes(q);
              });
            }
            return false;
          });

          // Calculate box totals & auto-fill Paid if not manually overridden
          const boxTotal = boxSelectedTests.reduce((sum, t) => sum + Number(t.price || 0), 0);
          const currentPayment = boxPayments[catId] || { paid: boxTotal, discount: 0, isManual: false };
          const displayPaid = currentPayment.isManual ? currentPayment.paid : Math.max(0, boxTotal - Number(currentPayment.discount || 0));
          const boxDue = Math.max(0, boxTotal - Number(displayPaid) - Number(currentPayment.discount || 0));

          return (
            <div key={catId} className="bg-white border border-slate-300 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in">
              {/* Box Title Header with Close Icon */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCloseBox(catId)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Remove this category box"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{categoryObj.title}</span>
                  </h3>
                </div>
              </div>

              {/* Input Area & Payment Inputs Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Left (Cols 1-8): Auto-suggest Multi-Select Text Box */}
                <div className="md:col-span-8 space-y-2">
                  <div className="relative">
                    <div 
                      className={`min-h-[70px] w-full p-2.5 bg-white border border-slate-300 rounded-lg flex flex-wrap gap-1.5 items-center cursor-text focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 test-search-box-${catId}`}
                      onClick={() => setActiveDropdown(catId)}
                    >
                      {/* Selected test tag pills */}
                      {boxSelectedTests.map((test) => (
                        <span
                          key={test.id || test.title}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                            test.isPackage 
                              ? 'bg-orange-100 text-orange-950 border border-orange-300' 
                              : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveService(test);
                            }}
                            className="text-slate-500 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {test.isPackage && (
                            <span className="bg-orange-500 text-white text-[8px] font-black px-1 py-0.2 rounded uppercase tracking-wider">
                              PKG
                            </span>
                          )}
                          <span>{test.title} (Rs.{test.price})</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpdateFeeModalTest(test);
                              setUpdateFeeValue(String(test.price));
                            }}
                            className="text-[10px] text-orange-600 underline font-semibold ml-1 cursor-pointer"
                            title="Edit fee"
                          >
                            Edit
                          </button>
                        </span>
                      ))}

                      {/* Search input field */}
                      <input
                        type="text"
                        value={currentSearch}
                        onChange={(e) => {
                          setSearchState(prev => ({ ...prev, [catId]: e.target.value }));
                          setActiveDropdown(catId);
                        }}
                        onFocus={() => setActiveDropdown(catId)}
                        placeholder={boxSelectedTests.length === 0 ? `Search or select ${categoryObj.label} tests...` : "Type to add more tests..."}
                        className="flex-1 min-w-[150px] bg-transparent outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 py-1"
                      />
                    </div>

                    {/* Auto-suggest Dropdown */}
                    {activeDropdown === catId && (
                      <div className={`absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in test-dropdown-${catId}`}>
                        {filteredCatalog.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">
                            {"No matching tests found. Click \"+ Add New\" below to add a custom test."}
                          </div>
                        ) : (
                          filteredCatalog.map((test) => {
                            const isSelected = boxSelectedTests.some(s => s.id === test.id || s.title === test.title);

                            return (
                              <button
                                key={test.id || test.title}
                                type="button"
                                onClick={() => handleSelectTestForBox(test, catId)}
                                className={`
                                  w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer border-b border-slate-50 last:border-b-0
                                  ${isSelected ? 'bg-orange-50/80 text-orange-950 font-bold' : 'hover:bg-orange-50/30 text-slate-800 font-medium'}
                                `}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    {test.isPackage && (
                                      <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase shadow-2xs">
                                        PACKAGE
                                      </span>
                                    )}
                                    <span className="font-bold">{test.title}</span>
                                    <span className="text-slate-500 text-[11px] font-bold">
                                      (Rs.{test.price})
                                    </span>
                                  </div>
                                  {test.isPackage && Array.isArray(test.tests) && test.tests.length > 0 && (
                                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                                      Includes: {test.tests.map(t => t.testName || t.title || t.name).join(', ')}
                                    </span>
                                  )}
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sub-actions Row: + Add New, Ratelist Link, Total & Due */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-3 font-semibold text-orange-600">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModalFor(catId);
                          setNewTestForm({ title: '', price: '' });
                        }}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/setup/ratelist')}
                        className="hover:underline flex items-center gap-1 cursor-pointer text-slate-600 hover:text-orange-600"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Ratelist
                      </button>
                    </div>

                    <div className="font-extrabold text-slate-800 space-x-3">
                      <span>Total: Rs. {boxTotal}</span>
                      <span>Due: Rs. {boxDue}</span>
                    </div>
                  </div>
                </div>

                {/* Right (Cols 9-12): Paid & Discount Input Fields with Labels directly above */}
                <div className="md:col-span-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">* Paid</label>
                    <input
                      type="number"
                      value={displayPaid}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBoxPayments(prev => ({
                          ...prev,
                          [catId]: { ...prev[catId], paid: val, isManual: true }
                        }));
                      }}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">* Discount</label>
                    <input
                      type="number"
                      value={currentPayment.discount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBoxPayments(prev => ({
                          ...prev,
                          [catId]: { ...prev[catId], discount: val }
                        }));
                      }}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* QUICK ADD NEW TEST MODAL */}
      {showAddModalFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New {showAddModalFor} Test</h3>
              <button onClick={() => setShowAddModalFor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  value={newTestForm.title}
                  onChange={(e) => setNewTestForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. ABG / USG Breast"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Test Fee (Rs.) *</label>
                <input
                  type="number"
                  required
                  value={newTestForm.price}
                  onChange={(e) => setNewTestForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="e.g. 600"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModalFor(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold"
                >
                  Add Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE FEE QUICK MODAL (Matching Screenshot 3) */}
      {updateFeeModalTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xl max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Update fee</h3>
              <button onClick={() => setUpdateFeeModalTest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p>
                Fee update required. Visit{' '}
                <button 
                  onClick={() => {
                    setUpdateFeeModalTest(null);
                    router.push('/setup/ratelist');
                  }} 
                  className="text-orange-600 underline font-bold"
                >
                  usg case ratelist
                </button>{' '}
                page to update the entire ratelist.
              </p>

              <form onSubmit={handleSaveFeeUpdate} className="flex items-center gap-3 pt-2">
                <span className="font-bold text-slate-800 text-xs min-w-[100px]">{updateFeeModalTest.title}</span>
                <input
                  type="number"
                  value={updateFeeValue}
                  onChange={(e) => setUpdateFeeValue(e.target.value)}
                  className="w-36 h-9 px-3 border border-orange-500 rounded-lg text-xs font-bold text-slate-900 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Update
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
