'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { 
  Search, 
  Plus, 
  Printer, 
  Sliders, 
  Check, 
  ChevronRight, 
  X,
  Download,
  MoreHorizontal,
  Edit2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Activity,
  Scan,
  Radio,
  Layers,
  Heart,
  Zap,
  Loader2,
  Tag,
  Package as PackageIcon,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';

const MODALITIES = [
  { id: 'LAB', label: 'Lab', icon: FlaskConical },
  { id: 'USG', label: 'USG', icon: Activity },
  { id: 'DIGITAL X-RAY', label: 'Digital X-ray', icon: Scan },
  { id: 'XRAY', label: 'X-ray', icon: Radio },
  { id: 'OUTSOURCE LAB', label: 'Outsource Lab', icon: Layers },
  { id: 'ECG', label: 'ECG', icon: Heart },
  { id: 'CT SCAN', label: 'CT Scan', icon: Scan },
  { id: 'MRI', label: 'MRI', icon: Zap },
  { id: 'EPS', label: 'EPS', icon: Activity },
  { id: 'OPG', label: 'OPG', icon: Radio },
  { id: 'CARDIOLOGY', label: 'Cardiology', icon: Heart },
  { id: 'EEG', label: 'EEG', icon: Zap },
  { id: 'MAMMOGRAPHY', label: 'Mammography', icon: Scan }
];

const INITIAL_CATALOG = {
  'LAB': [
    { title: 'ABG', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'ADA', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AEC', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AFB', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AFP', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'A/G Ratio', basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'ALLERGY SCREENING TEST', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AMH', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'AMH Panel', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Ammonia', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Anemia package', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Package' },
    { title: 'Complete Blood Count (CBC)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'KALA AZAR', basePrice: 500, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Insulin Random', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Iron', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HPLC', basePrice: 1200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Hscrp', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HSV-2 IgG', basePrice: 750, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'iCalcium', basePrice: 400, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'IgA (Urine)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: "Indirect Coomb's Test", basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Iron Studies', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'LH (Luteinising Hormone)', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Lipase', basePrice: 500, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'LDL Cholesterol', basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'LDL / HDL', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Leukemia DLC', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Homocysteine', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HIV (Card Test)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HIV ELISA I/II', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Hepatitis C Virus (HCV)', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Hematocrit Value, Hct', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Hemoglobin (Hb)', basePrice: 120, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HAV IgM', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'H-ALB', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Glucose Tolerance Test (GTT)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: "Gram's Stain", basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Glucose Tolerance Test, GTT (Pregnancy)', basePrice: 350, revenueShare: 0, forGender: 'Female', entryType: 'Panel' },
    { title: 'Globulin', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Gamma Glutamyl Transferase, GGT', basePrice: 300, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Glucose Challenge Test (GCT); Pregnancy , 75g Glucose', basePrice: 200, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'Glucose-6-Phosphate Dehydrogenase (G6PD)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Fungal Scraping Smear (KOH Mount)', basePrice: 250, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Follicle Stimulating Hormone (FSH)', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Free Triiodothyronine I, FT3', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Free Thyroxine, FT4', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Folic Acid', basePrice: 800, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Free Prostate Specific Antigen (Free PSA)', basePrice: 850, revenueShare: 0, forGender: 'Male', entryType: 'Test' },
    { title: 'Dehydroepiandrosterone, DHEA', basePrice: 800, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Diabetic Package / Profile', basePrice: 1200, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Dialysis Package / Profile', basePrice: 1200, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: "Direct Coomb's Test (DAT - Direct Antiglobulin Test)", basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Differential Leucocyte Count (DLC)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Differential Leucocyte Count, 3-Part (DLC 3 Parts)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'DLC 3 Parts', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Double Marker, Maternal Screen - 2 tests', basePrice: 2200, revenueShare: 0, forGender: 'Female', entryType: 'Panel' },
    { title: 'Estradiol (E2)', basePrice: 550, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Erythrocyte Sedimentation Rate (Wintrobe)', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'ESR(Wintrobe)', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Erythrocyte sedimentation rate (Westergren)', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Fluid Examination (Physical, Chemical & Microscopic)', basePrice: 500, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'FNAC (Fine Needle Aspiration)', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'FNAC', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Fasting Blood Sugar', basePrice: 80, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Fasting Insulin (Serum Insulin, Fasting)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Fasting Insulin', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Electrolytes Panel (Serum Na, K, Cl, Ca, iCa)', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Ferritin', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Estimated Glomerular Filtration Rate (eGFR)', basePrice: 250, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Dengue NS1 Antigen', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'DLC Leukemia', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Lipid Profile', basePrice: 550, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Hepatitis B Envelope Antigen (HBeAg)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Hepatitis B Surface Antigen (HBsAg)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HBsAg ELISA', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HCV RNA Quantitative (Real-Time PCR)', basePrice: 2800, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'HDL Cholesterol', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Herpes Simplex Virus 1/2 IgM (HSV-1/2 IgM)', basePrice: 750, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Herpes Simplex Virus 2 IgG (HSV-2 IgG)', basePrice: 750, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Hemoglobin, TLC & DLC (HB, TLC, DLC)', basePrice: 250, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Liver Function Test (LFT)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'TORCH Profile (Toxoplasma, Rubella, CMV, HSV-1/2)', basePrice: 2000, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'TORCH Profile', basePrice: 2000, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Total Leukocyte Count (TLC)', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'TLC', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'TG / HDL (Triglycerides / HDL Cholesterol Ratio)', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'TG / HDL', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Testosterone Total', basePrice: 550, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Testosterone Free', basePrice: 750, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'test', basePrice: 100, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum thyroxine, T4', basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'T4', basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Triiodothyronine, T3', basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'T3', basePrice: 200, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Stool Routine Examination (Routine & Microscopy)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Stool Routine Examination', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Stool Reducing Substances (Fecal Reducing Substances)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Stool reducing substances', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Skin test for Leprosy (Lepromin Test)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Skin test for Leprosy', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Stool Culture and Sensitivity (Stool C/S)', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Stool/cs', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Fluid c/s', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Fluid Culture and Sensitivity (Fluid C/S)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Anti Cardiolipin IgG', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Anti Cardiolipin IgG (ACA IgG)', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Anti Cardiolipin IgM', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Anti Cardiolipin IgM (ACA IgM)', basePrice: 850, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Anti-HAV', basePrice: 750, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Anti-HAV (Total Antibody)', basePrice: 750, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'SGPT (ALT) - Alanine Aminotransferase', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'SGPT', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'SGOT (AST) - Aspartate Aminotransferase', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'SGOT', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Zinc (Trace Element)', basePrice: 900, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Zinc', basePrice: 900, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Urea (Blood Urea Nitrogen / Urea)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Urea', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Sodium (Na+)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Sodium', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Protein (Total Protein)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Protein', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Potassium (K+)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Potassium', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Phosphorus (Inorganic Phosphate)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Phosphorus', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum LDH (Lactate Dehydrogenase)', basePrice: 300, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum LDH', basePrice: 300, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum IgM (Immunoglobulin M)', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum IgM', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Electrolyte (Serum Electrolytes - Na+, K+)', basePrice: 300, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Serum Electrolyte', basePrice: 300, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Serum Albumin', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Alkaline Phosphatase (ALP)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Alkaline Phosphatase', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Amylase', basePrice: 250, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Bilirubin (Direct) (Conjugated Bilirubin)', basePrice: 120, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Bilirubin (Direct)', basePrice: 120, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Bilirubin (Indirect) (Unconjugated Bilirubin)', basePrice: 120, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Bilirubin (Indirect)', basePrice: 120, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Calcium (Total Calcium)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Calcium', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Cortisol (Morning Cortisol)', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Cortisol', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Rubella IgM (Rubella Virus Antibody IgM)', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Rubella IgM', basePrice: 450, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Scrub Typhus (Orientia tsutsugamushi Antibodies - IgG & IgM)', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Scrub Typhus', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Panel' },
    { title: 'Serum Chloride (Cl-)', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Serum Chloride', basePrice: 150, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Rheumatoid Factor, RA (Quantitative) (RF Quantitative)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Rheumatoid Factor, RA (Quantitative)', basePrice: 350, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Kidney Function Test (KFT)', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Panel' }
  ],
  'USG': [
    { title: '2d Echo', basePrice: 1800, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Breast', basePrice: 600, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'Color Doppler (Fetus)', basePrice: 1000, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'Follicular study', basePrice: 1200, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'F.W.B.', basePrice: 400, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'K.U.B. FEMALE', basePrice: 400, revenueShare: 0, forGender: 'Female', entryType: 'Test' },
    { title: 'K.U.B. MALE', basePrice: 400, revenueShare: 0, forGender: 'Male', entryType: 'Test' },
    { title: 'Lower Abdomen', basePrice: 400, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Testis', basePrice: 600, revenueShare: 0, forGender: 'Male', entryType: 'Test' },
    { title: 'Thyroid & Neck', basePrice: 600, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Upper Abdomen', basePrice: 400, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Whole Abdomen Female', basePrice: 500, revenueShare: 0, forGender: 'Female', entryType: 'Test' }
  ],
  'DIGITAL X-RAY': [
    { title: 'Chest PA View', basePrice: 400, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Lumbar Spine AP/Lat', basePrice: 650, revenueShare: 0, forGender: 'Both', entryType: 'Test' },
    { title: 'Both Knee Joint', basePrice: 550, revenueShare: 0, forGender: 'Both', entryType: 'Test' }
  ]
};

function RatelistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [activeSection, setActiveSection] = useState(searchParams?.get('tab') === 'packages' ? 'packages' : 'ratelist');
  const [selectedModality, setSelectedModality] = useState('LAB');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkPct, setBulkPct] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTest, setNewTest] = useState({ title: '', basePrice: '', revenueShare: '0', forGender: 'Both', entryType: 'Test' });
  
  // Tab & Sub-category filters matching reference screenshots
  const [activeStatusFilter, setActiveStatusFilter] = useState('active'); // active | inactive
  const [categoryTypeFilter, setCategoryTypeFilter] = useState(searchParams?.get('tab') === 'packages' ? 'Packages' : 'Tests'); // Tests | Packages | Panels | Bill only

  // Packages Management States
  const [packagesList, setPackagesList] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [testPickerSearch, setTestPickerSearch] = useState('');
  const [savingPackage, setSavingPackage] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: '',
    code: '',
    price: '',
    selectedTests: [],
    forGender: 'Both',
    sampleType: 'Blood / Serum / Urine',
    turnaroundTime: 'Same Day',
    description: '',
    status: 'Active'
  });

  // Interactive inline editing states
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [tempFeeValue, setTempFeeValue] = useState('');
  const [savedFeeId, setSavedFeeId] = useState(null);
  const [savedGenderId, setSavedGenderId] = useState(null);
  const [entryTypeMenuId, setEntryTypeMenuId] = useState(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/lab/tests').catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        setTests(data);
      } else {
        const defaults = (INITIAL_CATALOG[selectedModality] || INITIAL_CATALOG['LAB']).map((t, idx) => ({
          _id: `def_${idx}_${t.title}`,
          category: selectedModality,
          title: t.title,
          test: t.title,
          basePrice: t.basePrice,
          totalAmount: t.basePrice,
          revenueShare: t.revenueShare || 0,
          forGender: t.forGender || 'Both',
          entryType: t.entryType || 'Test',
          status: 'Active'
        }));
        setTests(defaults);
      }
    } catch (err) {
      console.warn('Failed to fetch tests', err);
    } finally {
      setLoading(false);
    }
  }, [selectedModality]);

  const loadPackages = useCallback(async () => {
    setLoadingPackages(true);
    try {
      const data = await api.get('/lab/packages').catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        setPackagesList(data);
      } else {
        setPackagesList([
          {
            _id: 'pkg_1',
            name: 'Executive Health Checkup',
            code: 'PKG-EHC',
            price: 1499,
            originalPrice: 2200,
            forGender: 'Both',
            turnaroundTime: 'Same Day',
            status: 'Active',
            description: 'Comprehensive vital organ screening including CBC, Lipid Profile, Liver & Kidney function tests.',
            tests: [
              { testName: 'Complete Blood Count (CBC)', price: 350 },
              { testName: 'Lipid Profile', price: 550 },
              { testName: 'Liver Function Test (LFT)', price: 650 },
              { testName: 'Kidney Function Test (KFT)', price: 600 }
            ]
          },
          {
            _id: 'pkg_2',
            name: 'Diabetic Care Profile',
            code: 'PKG-DCP',
            price: 799,
            originalPrice: 1200,
            forGender: 'Both',
            turnaroundTime: 'Same Day',
            status: 'Active',
            description: 'Fasting Glucose, HbA1c screening, and Urine Routine examination.',
            tests: [
              { testName: 'Fasting Blood Sugar (FBS)', price: 80 },
              { testName: 'Glucose Tolerance Test (GTT)', price: 350 },
              { testName: 'Lipid Profile', price: 550 },
              { testName: 'Urine Routine Examination', price: 150 }
            ]
          },
          {
            _id: 'pkg_3',
            name: 'Fever & Infection Panel',
            code: 'PKG-FIP',
            price: 899,
            originalPrice: 1300,
            forGender: 'Both',
            turnaroundTime: 'Same Day',
            status: 'Active',
            description: 'Complete CBC, Dengue NS1 Antigen, and Widal test.',
            tests: [
              { testName: 'Complete Blood Count (CBC)', price: 350 },
              { testName: 'Dengue NS1 Antigen', price: 600 },
              { testName: 'Widal Slide & Tube Test', price: 350 }
            ]
          }
        ]);
      }
    } catch (err) {
      console.warn('Failed to load packages:', err);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTests();
      loadPackages();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTests, loadPackages]);

  const handleOpenAddPackage = () => {
    setEditingPackageId(null);
    setPackageForm({
      name: '',
      code: '',
      price: '',
      selectedTests: [],
      forGender: 'Both',
      sampleType: 'Blood / Serum / Urine',
      turnaroundTime: 'Same Day',
      description: '',
      status: 'Active'
    });
    setTestPickerSearch('');
    setShowAddPackageModal(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackageId(pkg._id);
    setPackageForm({
      name: pkg.name || '',
      code: pkg.code || '',
      price: String(pkg.price || 0),
      selectedTests: (pkg.tests || []).map(t => ({
        id: t.testId || t._id || t.id,
        title: t.testName || t.title || t.name,
        price: t.price || 0,
        department: t.department || 'PATHOLOGY'
      })),
      forGender: pkg.forGender || 'Both',
      sampleType: pkg.sampleType || 'Blood / Serum / Urine',
      turnaroundTime: pkg.turnaroundTime || 'Same Day',
      description: pkg.description || '',
      status: pkg.status || 'Active'
    });
    setTestPickerSearch('');
    setShowAddPackageModal(true);
  };

  const handleToggleTestInPackage = (testItem) => {
    const testTitle = testItem.title || testItem.test;
    setPackageForm(prev => {
      const exists = prev.selectedTests.some(t => (t.id && t.id === testItem._id) || t.title === testTitle);
      let updatedTests;
      if (exists) {
        updatedTests = prev.selectedTests.filter(t => !( (t.id && t.id === testItem._id) || t.title === testTitle ));
      } else {
        updatedTests = [
          ...prev.selectedTests,
          {
            id: testItem._id,
            title: testTitle,
            price: testItem.basePrice || testItem.totalAmount || 0,
            department: testItem.department || 'PATHOLOGY'
          }
        ];
      }
      return {
        ...prev,
        selectedTests: updatedTests
      };
    });
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!packageForm.name.trim()) {
      showToast('Please enter a Package Name', 'error');
      return;
    }
    if (packageForm.selectedTests.length === 0) {
      showToast('Please select at least one test to include in the package', 'error');
      return;
    }
    const enteredPrice = parseFloat(packageForm.price);
    if (isNaN(enteredPrice) || enteredPrice < 0) {
      showToast('Please enter a valid package price', 'error');
      return;
    }

    const calculatedOriginalPrice = packageForm.selectedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

    const payload = {
      name: packageForm.name.trim(),
      code: packageForm.code?.trim() || `PKG-${packageForm.name.substring(0, 3).toUpperCase()}`,
      category: 'LAB',
      price: enteredPrice,
      originalPrice: calculatedOriginalPrice,
      tests: packageForm.selectedTests.map(t => ({
        testId: t.id,
        testName: t.title,
        price: t.price,
        department: t.department || 'PATHOLOGY'
      })),
      forGender: packageForm.forGender,
      sampleType: packageForm.sampleType,
      turnaroundTime: packageForm.turnaroundTime,
      description: packageForm.description?.trim() || '',
      status: packageForm.status
    };

    setSavingPackage(true);
    try {
      if (editingPackageId) {
        const updated = await api.put(`/lab/packages/${editingPackageId}`, payload);
        setPackagesList(prev => prev.map(p => p._id === editingPackageId ? (updated || { _id: editingPackageId, ...payload }) : p));
        showToast('Package updated successfully!', 'success');
      } else {
        const created = await api.post('/lab/packages', payload);
        setPackagesList(prev => [created || { _id: `pkg_${Date.now()}`, ...payload }, ...prev]);
        showToast('Health package created and added to Lab Catalog!', 'success');
      }
      setShowAddPackageModal(false);
      loadTests();
    } catch (err) {
      showToast(err.data?.message || err.message || 'Failed to save package', 'error');
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDeletePackage = async (pkgId) => {
    if (!window.confirm('Are you sure you want to delete this health package?')) return;
    setPackagesList(prev => prev.filter(p => p._id !== pkgId));
    try {
      await api.delete(`/lab/packages/${pkgId}`);
      showToast('Package deleted', 'success');
      loadTests();
    } catch (err) {
      console.warn('Delete package error:', err);
    }
  };

  const handleTogglePackageStatus = async (pkg) => {
    const newStatus = pkg.status === 'Active' ? 'Inactive' : 'Active';
    setPackagesList(prev => prev.map(p => p._id === pkg._id ? { ...p, status: newStatus } : p));
    try {
      await api.put(`/lab/packages/${pkg._id}`, { status: newStatus });
      showToast(`Package marked as ${newStatus}`, 'success');
    } catch (err) {
      console.warn('Status toggle error:', err);
    }
  };

  // Filter tests by selected modality, search query, active/inactive tab, and sub-category
  const modalityTests = tests.filter(t => {
    const cat = (t.category || t.code || 'LAB').toUpperCase();
    const targetCat = selectedModality.toUpperCase();
    return cat === targetCat || (targetCat === 'USG' && cat.includes('USG')) || (targetCat === 'DIGITAL X-RAY' && cat.includes('XRAY'));
  });

  const filteredTests = modalityTests.filter(t => {
    const titleMatch = (t.title || t.test || '').toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = activeStatusFilter === 'active' ? (t.status !== 'Inactive') : (t.status === 'Inactive');
    
    let categoryMatch = true;
    if (categoryTypeFilter === 'Packages') {
      categoryMatch = t.entryType === 'Package';
    } else if (categoryTypeFilter === 'Panels') {
      categoryMatch = t.entryType === 'Panel';
    } else if (categoryTypeFilter === 'Bill only') {
      categoryMatch = t.entryType === 'Bill only';
    }

    return titleMatch && statusMatch && categoryMatch;
  });

  // Handle inline fee save/cancel
  const handleSaveInlineFee = async (testId) => {
    const parsedPrice = parseFloat(tempFeeValue) || 0;
    setTests(prev => prev.map(t => (t._id === testId ? { ...t, basePrice: parsedPrice, totalAmount: parsedPrice } : t)));
    setSavedFeeId(testId);
    setEditingFeeId(null);

    setTimeout(() => {
      setSavedFeeId(null);
    }, 2500);

    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        const currentTest = tests.find(t => t._id === testId);
        await api.put(`/lab/tests/${testId}`, {
          category: currentTest.category || selectedModality,
          title: currentTest.title || currentTest.test,
          basePrice: parsedPrice,
          totalAmount: parsedPrice,
          revenueShare: currentTest.revenueShare || 0,
          forGender: currentTest.forGender || 'Both'
        });
      } catch (err) {
        console.error('Failed to save fee', err);
      }
    }
  };

  // Handle revenue share update
  const handleUpdateRevenueShare = async (testId, shareVal) => {
    const parsedShare = parseFloat(shareVal) || 0;
    setTests(prev => prev.map(t => (t._id === testId ? { ...t, revenueShare: parsedShare } : t)));

    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        const currentTest = tests.find(t => t._id === testId);
        await api.put(`/lab/tests/${testId}`, {
          category: currentTest.category || selectedModality,
          title: currentTest.title || currentTest.test,
          basePrice: currentTest.basePrice,
          totalAmount: currentTest.totalAmount || currentTest.basePrice,
          revenueShare: parsedShare,
          forGender: currentTest.forGender || 'Both'
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle gender preference update with green checkmark indicator
  const handleUpdateGender = async (testId, genderVal) => {
    setTests(prev => prev.map(t => (t._id === testId ? { ...t, forGender: genderVal } : t)));
    setSavedGenderId(testId);

    setTimeout(() => {
      setSavedGenderId(null);
    }, 2500);

    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        const currentTest = tests.find(t => t._id === testId);
        await api.put(`/lab/tests/${testId}`, {
          category: currentTest.category || selectedModality,
          title: currentTest.title || currentTest.test,
          basePrice: currentTest.basePrice,
          totalAmount: currentTest.totalAmount || currentTest.basePrice,
          revenueShare: currentTest.revenueShare || 0,
          forGender: genderVal
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle Add New Test
  const handleAddNewTest = async (e) => {
    e.preventDefault();
    if (!newTest.title.trim()) {
      showToast('Test title is required', 'error');
      return;
    }
    const basePrice = parseFloat(newTest.basePrice) || 0;
    const payload = {
      category: selectedModality,
      title: newTest.title.trim(),
      test: newTest.title.trim(),
      basePrice,
      totalAmount: basePrice,
      revenueShare: parseFloat(newTest.revenueShare) || 0,
      forGender: newTest.forGender || 'Both',
      entryType: newTest.entryType || 'Test',
      status: 'Active'
    };

    try {
      const created = await api.post('/lab/tests', payload).catch(() => null);
      if (created) {
        setTests(prev => [created, ...prev]);
      } else {
        const mockNew = { _id: `def_${Date.now()}`, ...payload };
        setTests(prev => [mockNew, ...prev]);
      }
      showToast('Test added successfully!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to add test', 'error');
    }
  };

  // Delete test
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to remove this test from the ratelist?')) return;
    setTests(prev => prev.filter(t => t._id !== testId));
    const isMongoId = typeof testId === 'string' && /^[0-9a-fA-F]{24}$/.test(testId);
    if (isMongoId) {
      try {
        await api.delete(`/lab/tests/${testId}`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Download CSV export matching reference button
  const handleDownloadCSV = () => {
    const headers = ['NAME', 'ENTRY TYPE', 'FEE', 'REVENUE SHARE AMOUNT', 'FOR GENDER'];
    const rows = filteredTests.map(t => [
      `"${t.title || t.test}"`,
      `"${t.entryType || 'Test'}"`,
      t.basePrice || t.totalAmount || 0,
      t.revenueShare || 0,
      `"${t.forGender || 'Both'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ratelist_${selectedModality.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print ratelist
  const handlePrintRatelist = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-5 pb-12">
        
        {/* SETUP GUIDE SIDEBAR (Left) */}
        <div className="w-full md:w-56 bg-[#0f172a] text-slate-300 rounded-xl p-4 shadow-md shrink-0 space-y-3 no-print">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Setup Guide</h2>
          <nav className="space-y-1 text-xs font-medium">
            <button 
              type="button"
              onClick={() => { setActiveSection('ratelist'); setCategoryTypeFilter('Tests'); }}
              className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center justify-between shadow-xs transition-colors cursor-pointer ${
                activeSection === 'ratelist' && categoryTypeFilter !== 'Packages'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> Ratelist & Tests
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={() => { setActiveSection('packages'); setCategoryTypeFilter('Packages'); }}
              className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center justify-between shadow-xs transition-colors cursor-pointer ${
                activeSection === 'packages' || categoryTypeFilter === 'Packages'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <PackageIcon className="w-3.5 h-3.5 text-orange-400" /> Health Packages
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={() => showToast('Case registration prefix settings are pre-configured.', 'success')}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Case reg. no.</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={() => { setActiveSection('ratelist'); setCategoryTypeFilter('Panels'); }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Panels</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={() => showToast('Proofread validation rules are active.', 'success')}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Proofread</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
            >
              Skip setup »
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="flex-1 py-1.5 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 text-center hover:bg-slate-800 cursor-pointer"
            >
              ‹ Prev
            </button>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold text-center hover:bg-blue-500 cursor-pointer"
            >
              Finish ›
            </button>
          </div>
        </div>

        {/* MAIN RATELIST CONTENT */}
        <div className="flex-1 space-y-4">
          
          {/* Top Modality Selector Bar matching Screenshot 3 */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs no-print">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {MODALITIES.map(mod => {
                const Icon = mod.icon;
                const isSelected = selectedModality === mod.id;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModality(mod.id)}
                    className={`
                      px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center gap-1 min-w-[90px] cursor-pointer
                      ${isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/80'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="text-[11px] font-bold tracking-tight">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar & Controls */}
          {(activeSection === 'packages' || categoryTypeFilter === 'Packages') ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <PackageIcon className="w-5 h-5 text-orange-500" />
                    <span>Health Packages & Profiles</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-bold">
                      {packagesList.length} Packages
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Create bundled test packages with custom selling prices. Selecting a package in New Bill registers all bundled tests for that patient.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={packageSearchQuery}
                      onChange={(e) => setPackageSearchQuery(e.target.value)}
                      placeholder="Search packages by name or code..."
                      className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddPackage}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Package</span>
                  </button>
                </div>
              </div>

              {/* Packages Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">PACKAGE NAME & CODE</th>
                      <th className="py-3 px-4">INCLUDED TESTS</th>
                      <th className="py-3 px-4">ORIGINAL SUM</th>
                      <th className="py-3 px-4">PACKAGE PRICE</th>
                      <th className="py-3 px-4">SAVINGS</th>
                      <th className="py-3 px-4">GENDER</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {loadingPackages ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-1" />
                          <span>Loading health packages...</span>
                        </td>
                      </tr>
                    ) : packagesList.filter(p => {
                      const q = packageSearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                          No packages found. Click <b>"+ Create Package"</b> to bundle multiple tests into a discounted package.
                        </td>
                      </tr>
                    ) : (
                      packagesList.filter(p => {
                        const q = packageSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
                      }).map((pkg) => {
                        const originalSum = (pkg.tests || []).reduce((sum, t) => sum + (Number(t.price) || 0), 0) || pkg.originalPrice || pkg.price;
                        const savingsAmt = Math.max(0, originalSum - (pkg.price || 0));
                        const discountPct = originalSum > 0 ? Math.round((savingsAmt / originalSum) * 100) : 0;

                        return (
                          <tr key={pkg._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-slate-900 text-xs">{pkg.name}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {pkg.code && (
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                      {pkg.code}
                                    </span>
                                  )}
                                  {pkg.description && (
                                    <span className="text-[10px] text-slate-400 truncate max-w-xs" title={pkg.description}>
                                      {pkg.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 max-w-sm">
                              <div className="flex flex-wrap items-center gap-1">
                                {(pkg.tests || []).slice(0, 3).map((t, idx) => (
                                  <span key={idx} className="bg-orange-50 text-orange-800 border border-orange-200/80 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                                    {t.testName || t.title || t.name}
                                  </span>
                                ))}
                                {(pkg.tests || []).length > 3 && (
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    +{(pkg.tests || []).length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 font-bold text-slate-400 line-through text-xs">
                              ₹{originalSum}
                            </td>

                            <td className="py-3 px-4 font-black text-slate-900 text-sm">
                              ₹{pkg.price}
                            </td>

                            <td className="py-3 px-4">
                              {discountPct > 0 ? (
                                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 w-fit">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>{discountPct}% OFF</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">—</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                              {pkg.forGender || 'Both'}
                            </td>

                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => handleTogglePackageStatus(pkg)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer border transition-colors ${
                                  pkg.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {pkg.status || 'Active'}
                              </button>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPackage(pkg)}
                                  className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                  title="Edit package"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePackage(pkg._id)}
                                  className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="Delete package"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search test name..."
                    className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Bulk revenue share update */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Bulk update revenue share by percentage:</span>
                  <input
                    type="number"
                    placeholder="%"
                    value={bulkPct}
                    onChange={(e) => setBulkPct(e.target.value)}
                    className="w-14 h-8 px-2 border border-slate-200 rounded-md text-xs text-center focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!bulkPct) return;
                      const pct = parseFloat(bulkPct) || 0;
                      setTests(prev => prev.map(t => ({
                        ...t,
                        revenueShare: Math.round(((t.basePrice || 0) * pct) / 100)
                      })));
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Update all
                  </button>
                </div>

                {/* Download CSV, Add New & Print Ratelist buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download CSV</span>
                  </button>
                  <div className="relative inline-flex rounded-lg shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-l-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-r-lg border-l border-blue-500 cursor-pointer"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrintRatelist}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print ratelist</span>
                  </button>
                </div>
              </div>

              {/* Instruction Tip Alert Banner matching Screenshot 3 */}
              <div className="p-2.5 bg-pink-50/80 border border-pink-200/90 rounded-lg text-pink-700 text-xs flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-pink-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">ⓘ</span>
                <span>Use <strong>TAB</strong> button to change the rates one by one.</span>
              </div>

              {/* Status & Sub-Category Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-slate-100 pb-2">
                {/* Active / Inactive Tabs */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveStatusFilter('active')}
                    className={`pb-1 border-b-2 cursor-pointer ${
                      activeStatusFilter === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Active <span className="ml-1 text-slate-500 font-normal">{modalityTests.filter(t => t.status !== 'Inactive').length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStatusFilter('inactive')}
                    className={`pb-1 border-b-2 cursor-pointer ${
                      activeStatusFilter === 'inactive' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Inactive <span className="ml-1 text-slate-500 font-normal">{modalityTests.filter(t => t.status === 'Inactive').length}</span>
                  </button>
                </div>

                {/* Category Filter Pills: Tests, Packages, Panels, Bill only */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {['Tests', 'Packages', 'Panels', 'Bill only'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setCategoryTypeFilter(tab);
                        if (tab === 'Packages') {
                          setActiveSection('packages');
                        } else {
                          setActiveSection('ratelist');
                        }
                      }}
                      className={`
                        px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer
                        ${categoryTypeFilter === tab
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }
                      `}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* RATELIST TABLE MATCHING SCREENSHOTS 1, 2, & 3 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3">NAME</th>
                      <th className="py-2.5 px-3 w-36">ENTRY TYPE</th>
                      <th className="py-2.5 px-3 w-40">FEE</th>
                      <th className="py-2.5 px-3 w-48">REVENUE SHARE AMOUNT</th>
                      <th className="py-2.5 px-3 w-44">FOR GENDER</th>
                      <th className="py-2.5 px-3 w-24 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                          <span>Loading ratelist...</span>
                        </td>
                      </tr>
                    ) : filteredTests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                          {"No tests found matching filter criteria. Click \"+ Add New\" to add a new test."}
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((test) => {
                        const isEditingFee = editingFeeId === test._id;
                        const isFeeSaved = savedFeeId === test._id;
                        const isGenderSaved = savedGenderId === test._id;
                        const isEntryMenuOpen = entryTypeMenuId === test._id;

                        return (
                          <tr key={test._id} className="hover:bg-slate-50/70 transition-colors">
                            {/* NAME */}
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{test.title || test.test}</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setEditingFeeId(test._id);
                                    setTempFeeValue(String(test.basePrice !== undefined ? test.basePrice : (test.totalAmount || 0)));
                                  }}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                  title="Edit test rate"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* ENTRY TYPE with Interactive Dropdown Popup */}
                            <td className="py-2.5 px-3 relative">
                              <button
                                type="button"
                                onClick={() => setEntryTypeMenuId(isEntryMenuOpen ? null : test._id)}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-xs font-semibold flex items-center justify-between w-28 cursor-pointer"
                              >
                                <span>{test.entryType || 'Test'}</span>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                              </button>

                              {isEntryMenuOpen && (
                                <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-xs">
                                  {['Test', 'Package', 'Panel', 'Bill only'].map((typeOption) => (
                                    <button
                                      key={typeOption}
                                      type="button"
                                      onClick={async () => {
                                        setTests(prev => prev.map(t => (t._id === test._id ? { ...t, entryType: typeOption } : t)));
                                        setEntryTypeMenuId(null);
                                        const isMongoId = typeof test._id === 'string' && /^[0-9a-fA-F]{24}$/.test(test._id);
                                        if (isMongoId) {
                                          try {
                                            await api.put(`/lab/tests/${test._id}`, { entryType: typeOption });
                                          } catch (e) {}
                                        }
                                      }}
                                      className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer ${
                                        (test.entryType || 'Test') === typeOption ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                                      }`}
                                    >
                                      <span>{typeOption}</span>
                                      {(test.entryType || 'Test') === typeOption && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* FEE (Inline Editable) */}
                            <td className="py-2.5 px-3">
                              {isEditingFee ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    autoFocus
                                    value={tempFeeValue}
                                    onChange={(e) => setTempFeeValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineFee(test._id);
                                      if (e.key === 'Escape') setEditingFeeId(null);
                                    }}
                                    className="w-20 h-7 px-2 border border-blue-500 rounded text-xs font-bold text-slate-900 bg-blue-50/30 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineFee(test._id)}
                                    className="w-6 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center cursor-pointer"
                                    title="Save"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingFeeId(null)}
                                    className="w-6 h-7 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded flex items-center justify-center cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingFeeId(test._id);
                                      setTempFeeValue(String(test.basePrice !== undefined ? test.basePrice : (test.totalAmount || 0)));
                                    }}
                                    className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer flex items-center gap-1"
                                  >
                                    <span>{test.basePrice !== undefined ? test.basePrice : (test.totalAmount || 0)}</span>
                                    <Edit2 className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                                  </button>
                                  {isFeeSaved && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in" />
                                  )}
                                </div>
                              )}
                            </td>

                            {/* REVENUE SHARE AMOUNT */}
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                value={test.revenueShare || 0}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTests(prev => prev.map(t => (t._id === test._id ? { ...t, revenueShare: val } : t)));
                                }}
                                onBlur={(e) => handleUpdateRevenueShare(test._id, e.target.value)}
                                className="w-28 h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                              />
                            </td>

                            {/* FOR GENDER with Green Checkmark Icon matching Screenshots */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={test.forGender || 'Both'}
                                  onChange={(e) => handleUpdateGender(test._id, e.target.value)}
                                  className="w-32 h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="Both">Both</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                                {isGenderSaved && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in shrink-0" />
                                )}
                              </div>
                            </td>

                            {/* ACTIONS / REMOVE */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteTest(test._id)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600 text-xs font-semibold cursor-pointer"
                                title="Remove test"
                              >
                                <XCircle className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New Test ({selectedModality})</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  value={newTest.title}
                  onChange={(e) => setNewTest(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. ABG / USG Breast"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fee (₹) *</label>
                <input
                  type="number"
                  required
                  value={newTest.basePrice}
                  onChange={(e) => setNewTest(p => ({ ...p, basePrice: e.target.value }))}
                  placeholder="e.g. 600"
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Revenue Share (₹)</label>
                  <input
                    type="number"
                    value={newTest.revenueShare}
                    onChange={(e) => setNewTest(p => ({ ...p, revenueShare: e.target.value }))}
                    placeholder="0"
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">For Gender</label>
                  <select
                    value={newTest.forGender}
                    onChange={(e) => setNewTest(p => ({ ...p, forGender: e.target.value }))}
                    className="w-full h-9 px-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Both">Both</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT HEALTH PACKAGE MODAL */}
      {showAddPackageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-3xl w-full space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PackageIcon className="w-5 h-5 text-orange-500" />
                  <span>{editingPackageId ? 'Edit Health Package' : 'Create New Health Package'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select multiple lab tests and configure a fixed package selling price.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddPackageModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              {/* Basic Package Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={packageForm.name}
                    onChange={(e) => setPackageForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Senior Citizen Health Package"
                    className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    Package Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={packageForm.code}
                    onChange={(e) => setPackageForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. PKG-SCHP"
                    className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* MULTI-TEST SELECTOR */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Select Tests to Include</span>
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {packageForm.selectedTests.length} selected
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Check any tests from your catalog that are part of this package.
                    </p>
                  </div>

                  <div className="relative w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={testPickerSearch}
                      onChange={(e) => setTestPickerSearch(e.target.value)}
                      placeholder="Search tests..."
                      className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Selected Tests Summary Chips */}
                {packageForm.selectedTests.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200/80 max-h-24 overflow-y-auto">
                    {packageForm.selectedTests.map((st) => (
                      <span
                        key={st.id || st.title}
                        className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-900 border border-orange-200 px-2 py-1 rounded-lg text-[11px] font-bold shadow-2xs"
                      >
                        <span>{st.title}</span>
                        <span className="text-[10px] text-orange-600">₹{st.price || 0}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTestInPackage({ _id: st.id, title: st.title })}
                          className="text-orange-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Scrollable Tests Picker List */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
                  {tests.filter(t => {
                    const q = testPickerSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (t.title || t.test || '').toLowerCase().includes(q);
                  }).map((testItem) => {
                    const testTitle = testItem.title || testItem.test;
                    const isSelected = packageForm.selectedTests.some(st => (st.id && st.id === testItem._id) || st.title === testTitle);
                    const itemPrice = testItem.basePrice || testItem.totalAmount || 0;

                    return (
                      <div
                        key={testItem._id}
                        onClick={() => handleToggleTestInPackage(testItem)}
                        className={`flex items-center justify-between p-2.5 px-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50/70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                          />
                          <div>
                            <span className={`text-xs ${isSelected ? 'font-black text-orange-950' : 'font-semibold text-slate-800'}`}>
                              {testTitle}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2 font-medium">
                              ({testItem.category || 'LAB'})
                            </span>
                          </div>
                        </div>

                        <span className="font-extrabold text-slate-700 text-xs">
                          ₹{itemPrice}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Financial Summary */}
              {(() => {
                const totalOriginal = packageForm.selectedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
                const sellingPrice = parseFloat(packageForm.price) || 0;
                const savings = Math.max(0, totalOriginal - sellingPrice);
                const discountPercentage = totalOriginal > 0 ? Math.round((savings / totalOriginal) * 100) : 0;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-orange-50/40 border border-orange-200/80 rounded-2xl items-center">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Original Sum of Tests
                      </span>
                      <span className="text-base font-extrabold text-slate-600 line-through">
                        ₹{totalOriginal}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-orange-900 uppercase tracking-wider mb-0.5">
                        Package Selling Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={packageForm.price}
                        onChange={(e) => setPackageForm(p => ({ ...p, price: e.target.value }))}
                        placeholder="e.g. 999"
                        className="w-full h-9 px-3 border border-orange-300 bg-white rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-orange-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Patient Savings
                      </span>
                      <span className="text-sm font-black text-emerald-600">
                        ₹{savings} ({discountPercentage}% OFF)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Additional Options: Gender, Turnaround Time, Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Applicable Gender</label>
                  <select
                    value={packageForm.forGender}
                    onChange={(e) => setPackageForm(p => ({ ...p, forGender: e.target.value }))}
                    className="w-full h-9 px-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="Both">Both (All Patients)</option>
                    <option value="Female">Female Only</option>
                    <option value="Male">Male Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Turnaround Time</label>
                  <input
                    type="text"
                    value={packageForm.turnaroundTime}
                    onChange={(e) => setPackageForm(p => ({ ...p, turnaroundTime: e.target.value }))}
                    placeholder="e.g. Same Day / 24 Hours"
                    className="w-full h-9 px-3 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Summary</label>
                <textarea
                  rows="2"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Full body screening recommended for routine health checkups."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPackageModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPackage}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {savingPackage && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPackageId ? 'Update Package' : 'Save Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function RatelistPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading ratelist & packages...</div>}>
        <RatelistContent />
      </Suspense>
    </ProtectedRoute>
  );
}
