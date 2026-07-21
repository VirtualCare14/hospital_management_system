import { useRef, useLayoutEffect, useState, useCallback } from 'react';
import {
  ClipboardList, UserCheck, FileSpreadsheet, Beaker, Bed,
  BriefcaseMedical, Pill, CreditCard, ArrowRight, Check, ShieldAlert,
  Sparkles, CheckCircle2, FileText, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const modules = [
  {
    id: 0,
    num: '01',
    name: 'Reception / EMR',
    icon: ClipboardList,
    accent: '#FF6A00',
    gradient: 'from-[#FF8A00] to-[#FF6A00]',
    badgeBg: 'bg-[#FFF8F2]',
    badgeBorder: 'border-[#FF6A00]/25',
    badgeText: 'text-[#FF6A00]',
    cardGlow: 'from-[#FF6A00]/10 via-[#FF8A00]/5 to-transparent',
    title: 'Patient Onboarding & EMR Ecosystem',
    description: 'Medora360 EMR module provides standard-compliant patient registration and record creation. The Unified Health ID (UHID) is automatically generated and synchronized across all departments.',
    features: ['Patient Registration', 'UHID Generation', 'Appointment Scheduling', 'Electronic Medical Records'],
    metrics: [{ label: 'Avg Reg Time', val: '< 90s' }, { label: 'Record Accuracy', val: '99.9%' }],
    mockup: 'RegisterNewPatient'
  },
  {
    id: 1,
    num: '02',
    name: 'Doctor Consultation',
    icon: UserCheck,
    accent: '#4F46E5',
    gradient: 'from-[#6366F1] to-[#4F46E5]',
    badgeBg: 'bg-[#EEF2FF]',
    badgeBorder: 'border-[#4F46E5]/25',
    badgeText: 'text-[#4F46E5]',
    cardGlow: 'from-[#4F46E5]/10 via-[#6366F1]/5 to-transparent',
    title: 'Doctor Portal & Clinical Consultation',
    description: 'Enable physicians to manage their patient queue in real-time, record detailed diagnosis reports, draft clinical progress notes, and schedule next follow-ups.',
    features: ['Patient Queue Management', 'Clinical Notes Taking', 'Diagnosis Recording', 'Follow-up Management'],
    metrics: [{ label: 'Queue Eff.', val: '+45%' }, { label: 'Docs Onboarded', val: '10k+' }],
    mockup: 'ConsultationQueue'
  },
  {
    id: 2,
    num: '03',
    name: 'Digital Prescription',
    icon: FileSpreadsheet,
    accent: '#FF6B00',
    gradient: 'from-[#FF8A00] to-[#FF6B00]',
    badgeBg: 'bg-[#FFF3EB]',
    badgeBorder: 'border-[#FF6B00]/40',
    badgeText: 'text-[#FF6B00]',
    cardGlow: 'from-[#FF6B00]/15 via-[#FF8A00]/8 to-transparent',
    isFeatured: true,
    title: 'Digital Rx & Medicine Dispensation',
    description: 'Auto-compile drug lists with pre-configured dosages and frequencies. Instantly export to PDF or share with patients directly via SMS and WhatsApp.',
    features: ['Smart Prescription Builder', 'AI Medicine Suggestions', 'PDF Export Capability', 'WhatsApp Sharing'],
    metrics: [{ label: 'Rx Shared', val: '1.2M+' }, { label: 'Rx Error Reduction', val: '98%' }],
    mockup: 'PrescriptionPDF'
  },
  {
    id: 3,
    num: '04',
    name: 'Laboratory',
    icon: Beaker,
    accent: '#0D9488',
    gradient: 'from-[#14B8A6] to-[#0D9488]',
    badgeBg: 'bg-[#F0FDFA]',
    badgeBorder: 'border-[#0D9488]/25',
    badgeText: 'text-[#0D9488]',
    cardGlow: 'from-[#0D9488]/10 via-[#14B8A6]/5 to-transparent',
    title: 'LIMS - Laboratory Information System',
    description: 'Streamline specimen tracking and test scheduling. Automated analytical instruments upload findings directly to patient records without human error.',
    features: ['Test Requests Dispatch', 'Sample Collection Status', 'Report Generation', 'Lab Workflow Tracking'],
    metrics: [{ label: 'Turnaround Time', val: '-30%' }, { label: 'Reports Shared', val: '400k+' }],
    mockup: 'LabReports'
  },
  {
    id: 4,
    num: '05',
    name: 'IPD Management',
    icon: Bed,
    accent: '#0284C7',
    gradient: 'from-[#38BDF8] to-[#0284C7]',
    badgeBg: 'bg-[#F0F9FF]',
    badgeBorder: 'border-[#0284C7]/25',
    badgeText: 'text-[#0284C7]',
    cardGlow: 'from-[#0284C7]/10 via-[#38BDF8]/5 to-transparent',
    title: 'In-Patient Department & OT Control',
    description: 'Comprehensive occupancy tracker for wards, semi-private rooms, and critical care units. Schedule surgeries and auto-compile patient history upon discharge.',
    features: ['Bed Allocation Dashboard', 'Patient Admission Protocol', 'OT Scheduling', 'Discharge Summary Builder'],
    metrics: [{ label: 'OT Utilization', val: '92%' }, { label: 'Discharge Time', val: '< 30m' }],
    mockup: 'IPDAllotment'
  },
  {
    id: 5,
    num: '06',
    name: 'Same Day Care',
    icon: BriefcaseMedical,
    accent: '#E11D48',
    gradient: 'from-[#FB7185] to-[#E11D48]',
    badgeBg: 'bg-[#FFF1F2]',
    badgeBorder: 'border-[#E11D48]/25',
    badgeText: 'text-[#E11D48]',
    cardGlow: 'from-[#E11D48]/10 via-[#FB7185]/5 to-transparent',
    title: 'Day Care Operations & Quick Care',
    description: 'Built for minor operations, chemotherapy rounds, dialysis cycles, and outpatient surgeries that do not require overnight bed allocation.',
    features: ['Day Care Procedures Registry', 'Treatment Tracking Timeline', 'Patient Monitoring', 'Quick Billing Gateway'],
    metrics: [{ label: 'Active Beds', val: '45 Units' }, { label: 'Daily Outflow', val: '180 Patients' }],
    mockup: 'DayCareDashboard'
  },
  {
    id: 6,
    num: '07',
    name: 'Pharmacy',
    icon: Pill,
    accent: '#7C3AED',
    gradient: 'from-[#A855F7] to-[#7C3AED]',
    badgeBg: 'bg-[#F3E8FF]',
    badgeBorder: 'border-[#7C3AED]/25',
    badgeText: 'text-[#7C3AED]',
    cardGlow: 'from-[#7C3AED]/10 via-[#A855F7]/5 to-transparent',
    title: 'Enterprise Pharmacy & Stock System',
    description: 'Track expiration dates, trigger low-stock alerts, and auto-generate purchase orders. Verify patient prescription IDs before dispensing medication.',
    features: ['Inventory Management Panel', 'Medicine Dispensing Checks', 'Stock Alerts Automation', 'Purchase Management'],
    metrics: [{ label: 'Stock Accuracy', val: '99.7%' }, { label: 'Auto PO', val: 'Enabled' }],
    mockup: 'PharmacyInventory'
  },
  {
    id: 7,
    num: '08',
    name: 'Billing & Accounts',
    icon: CreditCard,
    accent: '#059669',
    gradient: 'from-[#10B981] to-[#059669]',
    badgeBg: 'bg-[#ECFDF5]',
    badgeBorder: 'border-[#059669]/25',
    badgeText: 'text-[#059669]',
    cardGlow: 'from-[#059669]/10 via-[#10B981]/5 to-transparent',
    title: 'Enterprise Finance & Billing Portal',
    description: 'Unify corporate client lists, government schemes, and third-party insurance payers. Generate smart billing summaries and print dynamic audit reports.',
    features: ['Invoice Generation Core', 'Insurance Billing Bridge', 'Payment Tracking', 'Financial Reports Engine'],
    metrics: [{ label: 'Claims Cleared', val: '94%' }, { label: 'Billing Speed', val: 'Instant' }],
    mockup: 'InvoiceAccounts'
  }
];

function AnimatedMetric({ value, shouldAnimate }) {
  const [displayValue, setDisplayValue] = useState(value);
  const played = useRef(false);
  useLayoutEffect(() => {
    if (!shouldAnimate || played.current) return;
    const match = String(value).trim().match(/^(?<prefix>[<+\-]?)\s*(?<number>\d+(?:\.\d+)?)(?<suffix>%|k|m|s|\+)?$/);
    if (!match?.groups) { setDisplayValue(value); return; }
    played.current = true;
    const { prefix, number, suffix } = match.groups;
    const num = parseFloat(number);
    const suf = suffix || '';
    const obj = { v: 0 };
    gsap.to(obj, {
      v: num, duration: 0.9, ease: 'power3.out',
      onUpdate: () => setDisplayValue(`${prefix}${obj.v.toFixed(number.includes('.') ? 1 : 0)}${suf}`),
      onComplete: () => setDisplayValue(value),
    });
  }, [shouldAnimate, value]);
  return <>{displayValue}</>;
}

function MockupContent({ mockup, moduleAccent }) {
  switch (mockup) {
    case 'RegisterNewPatient':
      return (
        <div className="flex flex-col gap-2.5 text-left font-sans">
          <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs" style={{ backgroundColor: moduleAccent }}>JD</div>
              <div>
                <div className="text-xs font-bold text-slate-800">Jane Doe</div>
                <div className="text-[10px] text-slate-500">28 yrs • Female • O+</div>
              </div>
            </div>
            <span className="text-[8.5px] bg-emerald-100/80 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Verified</span>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-600">Assigned UHID:</span>
            <span className="text-[11px] font-mono font-bold text-[#FF6A00] tracking-wider">MED-2026-9821</span>
          </div>
          <button className="h-8.5 rounded-xl text-[10.5px] font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: moduleAccent }}>
            <span>Generate UHID Record</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      );
    case 'ConsultationQueue':
      return (
        <div className="flex flex-col gap-2 text-[11px] font-semibold font-sans">
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200/60 text-[#4F46E5] shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-ping" />
              <span className="font-bold">#01 John Smith</span>
            </div>
            <span className="text-[9.5px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">In Cabin</span>
          </div>
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-100 text-slate-700">
            <span>#02 Alice Brown</span>
            <span className="text-[9.5px] text-slate-400 font-normal">Next In Line (10:15)</span>
          </div>
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-slate-100 text-slate-700">
            <span>#03 David Clark</span>
            <span className="text-[9.5px] text-slate-400 font-normal">Waiting</span>
          </div>
        </div>
      );
    case 'PrescriptionPDF':
      return (
        <div className="p-3 rounded-xl border border-slate-100 bg-white flex flex-col gap-2 text-[11px] text-slate-700 shadow-xs font-sans">
          <div className="font-bold border-b border-slate-100 pb-2 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-slate-800">
              <FileText className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Dr. Andrew Stone</span>
            </div>
            <span className="text-[#FF6B00] font-mono text-[9.5px] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 font-bold">Rx #4920</span>
          </div>
          <div className="space-y-1.5">
            <div className="font-medium text-slate-600 flex justify-between">
              <span>• Amoxicillin 500mg</span>
              <span className="text-slate-400 text-[9.5px]">1-0-1 (5d)</span>
            </div>
            <div className="font-medium text-slate-600 flex justify-between">
              <span>• Paracetamol 650mg</span>
              <span className="text-slate-400 text-[9.5px]">SOS</span>
            </div>
          </div>
          <div className="mt-0.5 text-[9px] bg-emerald-50 text-emerald-600 py-1.5 px-2 rounded-lg border border-emerald-100 font-bold flex items-center justify-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>WhatsApp & SMS Shared ✓</span>
          </div>
        </div>
      );
    case 'LabReports':
      return (
        <div className="flex flex-col gap-2.5 font-semibold text-[11px] text-slate-700 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">CBC Panel</span>
            <span className="text-teal-700 font-bold bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full text-[9px]">Ready</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Thyroid Profile</span>
            <span className="text-teal-700 font-bold bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full text-[9px]">Ready</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lipid Profile</span>
              <span className="text-amber-500 font-bold text-[9px] animate-pulse">75% Analyzing...</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full w-[75%] transition-all duration-500" />
            </div>
          </div>
        </div>
      );
    case 'IPDAllotment':
      return (
        <div className="flex flex-col gap-2 font-sans">
          <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] text-sky-900 font-bold">Ward 10A (ICU)</span>
            </div>
            <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Occupied</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-800 font-bold">Ward 10B (Deluxe)</span>
            </div>
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Available</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-slate-700 font-bold">OT-2 Scheduled</span>
            </div>
            <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">3:30 PM</span>
          </div>
        </div>
      );
    case 'DayCareDashboard':
      return (
        <div className="flex flex-col gap-2 font-semibold text-[11px] font-sans">
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-bold">Dialysis Session</span>
            <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full text-[9px]">Active</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/40">
            <div className="bg-gradient-to-r from-rose-400 to-[#E11D48] h-full rounded-full w-[70%]" />
          </div>
          <div className="flex justify-between text-[9.5px] text-slate-400">
            <span>Elapsed: 2h 15m</span>
            <span>Est: 3h total</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 text-[10px]">Bed 12 · Patient Monitored</span>
            <span className="text-[9px] text-emerald-600 font-bold">Stable</span>
          </div>
        </div>
      );
    case 'PharmacyInventory':
      return (
        <div className="flex flex-col gap-2 font-semibold text-[11px] text-slate-700 font-sans">
          <div className="flex justify-between text-slate-400 border-b border-slate-100 pb-1.5 text-[9.5px] uppercase tracking-wider">
            <span>Medicine</span>
            <span>Stock</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Metformin 500mg</span>
            <span className="text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-mono text-[9.5px]">1,240</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Atorvastatin</span>
            <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-mono text-[9.5px] flex items-center gap-0.5 font-bold">
              <ShieldAlert className="w-3 h-3" />
              12 (Low)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Cetirizine 10mg</span>
            <span className="text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-mono text-[9.5px]">860</span>
          </div>
        </div>
      );
    case 'InvoiceAccounts':
      return (
        <div className="p-3 rounded-xl bg-white border border-slate-100 flex flex-col gap-2 text-[11px] text-slate-700 shadow-xs font-sans">
          <div className="flex justify-between font-bold border-b border-slate-100 pb-1.5 text-slate-800">
            <span>Invoice</span>
            <span className="font-mono text-[#059669]">#INV-4029</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Pharmacy</span>
            <span>$145.00</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Consultation</span>
            <span>$50.00</span>
          </div>
          <div className="flex justify-between font-bold pt-1.5 border-t border-slate-100 text-slate-900">
            <span>Total</span>
            <span className="text-[#059669]">$195.00</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function Services() {
  const sectionRef = useRef(null);
  const pinWrapRef = useRef(null);
  const pinnedRef = useRef(null);
  const leftContentRefs = useRef([]);
  const rightMockupRefs = useRef([]);
  const timelineVertLineRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [countUpTriggered, setCountUpTriggered] = useState(false);

  const trackRef = useRef(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  const scrollMobileTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(modules.length - 1, idx));
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[clamped];
    if (child) track.scrollTo({ left: child.offsetLeft - 24, behavior: 'smooth' });
    setMobileIndex(clamped);
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const children = Array.from(track.children);
        let closest = 0;
        let minDist = Infinity;
        children.forEach((child, i) => {
          const dist = Math.abs(child.offsetLeft - 24 - track.scrollLeft);
          if (dist < minDist) { minDist = dist; closest = i; }
        });
        setMobileIndex(closest);
        ticking = false;
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px)', () => {
        const total = modules.length;
        const navOffset = 90;
        const scrollDistance = window.innerHeight * total * 0.85;
        const leftElements = leftContentRefs.current.filter(Boolean);
        const rightElements = rightMockupRefs.current.filter(Boolean);

        gsap.set(timelineVertLineRef.current, { scaleY: 0, transformOrigin: 'top' });

        const TRANSITION_START = 0.65;

        const layoutElements = (floatIdx) => {
          const idxFloor = Math.min(total - 1, Math.max(0, Math.floor(floatIdx)));
          const frac = floatIdx - idxFloor;
          const t = frac <= TRANSITION_START ? 0 : (frac - TRANSITION_START) / (1 - TRANSITION_START);

          modules.forEach((_, i) => {
            const leftEl = leftElements[i];
            const rightEl = rightElements[i];
            if (!leftEl || !rightEl) return;

            let y, opacity, scale, zIndex, pointerEvents;

            if (i < idxFloor) {
              y = -40; opacity = 0; scale = 0.96; zIndex = 5; pointerEvents = 'none';
            } else if (i === idxFloor) {
              y = -30 * t;
              opacity = 1 - t;
              scale = 1 - 0.04 * t;
              zIndex = 20;
              pointerEvents = t > 0.4 ? 'none' : 'auto';
            } else if (i === idxFloor + 1) {
              y = 30 * (1 - t);
              opacity = t;
              scale = 0.96 + 0.04 * t;
              zIndex = 15;
              pointerEvents = t > 0.6 ? 'auto' : 'none';
            } else {
              y = 40; opacity = 0; scale = 0.96; zIndex = 5; pointerEvents = 'none';
            }

            gsap.set([leftEl, rightEl], { y, opacity, scale, zIndex, pointerEvents });
          });
        };

        layoutElements(0);

        const updateProgress = (raw) => {
          const floatIdx = raw * (total - 1);
          const idxFloor = Math.min(total - 1, Math.max(0, Math.floor(floatIdx)));
          const frac = floatIdx - idxFloor;
          const t = frac <= TRANSITION_START ? 0 : (frac - TRANSITION_START) / (1 - TRANSITION_START);
          const current = t > 0.5 ? Math.min(total - 1, idxFloor + 1) : idxFloor;

          layoutElements(floatIdx);
          setActiveIndex(current);
          setCountUpTriggered(true);

          gsap.to(timelineVertLineRef.current, {
            scaleY: (current + 1) / total,
            duration: 0.35, overwrite: 'auto',
          });
        };

        const st = ScrollTrigger.create({
          trigger: pinWrapRef.current,
          start: `top ${navOffset}px`,
          end: `+=${scrollDistance}`,
          pin: pinnedRef.current,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateProgress(self.progress),
        });

        return () => st.kill();
      });

      return () => mm.revert();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleScrollToModule = (index) => {
    if (!pinWrapRef.current) return;
    const total = modules.length;
    const navOffset = 90;
    const scrollDistance = window.innerHeight * total * 0.85;
    const pinTop = pinWrapRef.current.offsetTop - navOffset;
    const targetScroll = pinTop + (index / (total - 1)) * scrollDistance;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} id="services" className="relative bg-[#FAF8F5] overflow-hidden border-t border-slate-200/60 isolate">
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <svg className="absolute top-[20%] left-0 w-full h-40 opacity-5 stroke-[#FF6A00]" viewBox="0 0 1200 120" fill="none">
          <path d="M0,60 L300,60 L320,20 L340,100 L360,40 L380,80 L400,60 L1200,60" strokeWidth="2" strokeDasharray="6 6" />
        </svg>

        <div
          className="absolute top-[10%] left-[-8%] w-[550px] h-[550px] rounded-full blur-[150px] transition-colors duration-1000 opacity-20"
          style={{ backgroundColor: modules[activeIndex].accent }}
        />
        <div className="absolute bottom-[10%] right-[-8%] w-[600px] h-[600px] rounded-full bg-[#4F46E5]/10 blur-[160px]" />
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-amber-400/10 blur-[130px]" />
      </div>

      {/* Desktop 2-Column Pinned View */}
      <div ref={pinWrapRef} className="relative hidden lg:block">
        <div ref={pinnedRef} className="w-full z-10 h-[calc(100vh-90px)] flex flex-col justify-center">
          <div className="w-full max-w-[1380px] mx-auto px-6 md:px-12">
            
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 font-sans font-bold text-[11px] tracking-[0.18em] text-[#FF6A00] uppercase px-3 py-1 rounded-full bg-[#FFF8F2] border border-[#FF6A00]/25">
                    <Sparkles className="w-3 h-3 text-[#FF6A00]" />
                    Powerful Healthcare SaaS Ecosystem
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-2xl lg:text-3xl text-slate-900 tracking-tight">
                  Our <span className="bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] bg-clip-text text-transparent">Services & 8 Clinical Modules</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center justify-between gap-10">

              {/* Timeline Bar */}
              <div className="flex-shrink-0 relative pl-6 flex flex-col justify-center" style={{ width: '190px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-display font-extrabold text-2xl text-slate-900 tabular-nums">
                    {String(activeIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-slate-400 font-semibold">/ {String(modules.length).padStart(2, '0')}</span>
                </div>

                <div className="relative pl-5">
                  <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-slate-200 rounded-full" />
                  <div
                    ref={timelineVertLineRef}
                    className="absolute left-0 top-1 w-[2px] bg-gradient-to-b from-[#FF6A00] via-[#4F46E5] to-[#059669] rounded-full"
                    style={{ height: 'calc(100% - 8px)', transformOrigin: 'top', transform: 'scaleY(0)' }}
                  />
                  <div className="flex flex-col gap-1.5">
                    {modules.map((m, i) => {
                      const isActive = i === activeIndex;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleScrollToModule(i)}
                          className="text-left py-1 group transition-all duration-300"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="font-display font-bold text-xs tabular-nums transition-colors"
                              style={{ color: isActive ? m.accent : '#94A3B8' }}
                            >
                              {m.num}
                            </span>
                            <span
                              className={`font-display font-bold text-xs truncate transition-colors ${
                                isActive ? 'text-slate-900 font-extrabold' : 'text-slate-400 group-hover:text-slate-600'
                              }`}
                            >
                              {m.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Left Column: Details */}
              <div className="flex-1 min-w-0 relative h-[440px] flex items-center">
                {modules.map((m, i) => {
                  const isActive = i === activeIndex;
                  return (
                    <div
                      key={m.id}
                      ref={(el) => (leftContentRefs.current[i] = el)}
                      className="absolute inset-0 flex flex-col justify-center pr-4 will-change-transform"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${m.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0`}
                        >
                          <m.icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-display font-extrabold text-[11px] tracking-[0.18em] ${m.badgeText} ${m.badgeBg} border ${m.badgeBorder} px-3 py-0.5 rounded-full uppercase shadow-2xs`}>
                            MODULE {m.num}
                          </span>
                          {m.isFeatured && (
                            <span className="flex items-center gap-1 text-[9.5px] font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF6B00] px-2.5 py-0.5 rounded-full shadow-xs">
                              <Star className="w-2.5 h-2.5 fill-white" /> Featured Spotlight
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-display font-extrabold text-2xl lg:text-[32px] text-slate-900 mb-2 leading-tight tracking-tight">
                        {m.title}
                      </h3>
                      <p className="font-sans text-slate-600 text-sm lg:text-base leading-relaxed mb-5 max-w-lg">
                        {m.description}
                      </p>

                      <ul className="grid grid-cols-2 gap-2.5 mb-5 max-w-lg">
                        {m.features.map((f, fi) => (
                          <li key={fi} className="flex items-center gap-2">
                            <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            </div>
                            <span className="font-sans text-slate-700 text-xs font-semibold">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center gap-4 max-w-lg pt-3 border-t border-slate-200/60">
                        {m.metrics.map((met, mi) => (
                          <div key={mi} className="flex-1 bg-white/90 backdrop-blur border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs">
                            <div className="font-display font-extrabold text-xl lg:text-2xl leading-none mb-1" style={{ color: m.accent }}>
                              <AnimatedMetric value={met.val} shouldAnimate={countUpTriggered && isActive} />
                            </div>
                            <div className="font-sans text-[9px] uppercase tracking-widest text-slate-400 font-bold">{met.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Floating Simulator Window */}
              <div className="flex-1 min-w-0 relative h-[440px] flex items-center justify-end">
                {modules.map((m, i) => (
                  <div
                    key={m.id}
                    ref={(el) => (rightMockupRefs.current[i] = el)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-full max-w-[480px] will-change-transform"
                  >
                    <div
                      className={`rounded-[22px] border bg-white shadow-[0_20px_50px_rgba(16,24,40,0.1)] overflow-hidden transition-all duration-300 ${
                        m.isFeatured ? 'border-[#FF6B00]/40 shadow-[0_20px_50px_rgba(255,107,0,0.15)]' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between px-4.5 pt-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 bg-white border border-slate-200/70 px-2 py-0.5 rounded-full shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Simulator
                        </span>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 min-h-[200px] flex flex-col justify-center">
                        <MockupContent mockup={m.mockup} moduleAccent={m.accent} />
                      </div>

                      <div className="px-4.5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.accent }} />
                          <span className="font-display font-bold text-xs text-slate-800">{m.name}</span>
                        </div>
                        <span className="text-[9.5px] font-mono font-semibold text-slate-400">MEDORA-360-V2</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Fallback Carousel */}
      <div className="lg:hidden relative z-10 pt-12 pb-16">
        <div className="text-center px-6 mb-6">
          <span className="font-sans font-bold text-[10px] tracking-widest text-[#FF6A00] uppercase px-3 py-1 rounded-full bg-[#FFF8F2] border border-[#FF6A00]/25">
            Services & 8 Modules
          </span>
          <h3 className="font-display font-extrabold text-2xl text-slate-900 mt-2">Medora360 Clinical Platform</h3>
        </div>

        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory px-6 md:px-12 pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {modules.map((m) => (
            <div key={m.id} className="snap-center shrink-0 w-[90vw] sm:w-[65vw] first:ml-0">
              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${m.gradient} flex items-center justify-center text-white shadow-xs`}>
                      <m.icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className={`font-display font-extrabold text-[10px] tracking-[0.16em] ${m.badgeText} uppercase`}>Module {m.num}</span>
                      <h4 className="font-display font-bold text-base text-slate-900">{m.name}</h4>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                    <MockupContent mockup={m.mockup} moduleAccent={m.accent} />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 mb-2">{m.title}</h3>
                  <p className="font-sans text-xs text-slate-600 leading-relaxed mb-4">{m.description}</p>
                  <ul className="space-y-2 mb-4">
                    {m.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    {m.metrics.map((met, mi) => (
                      <div key={mi} className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                        <div className="font-display font-extrabold text-base leading-none mb-1" style={{ color: m.accent }}>{met.val}</div>
                        <div className="font-sans text-[8.5px] uppercase tracking-wider text-slate-400 font-bold">{met.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 px-6">
          <button
            onClick={() => scrollMobileTo(mobileIndex - 1)}
            disabled={mobileIndex === 0}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 disabled:opacity-30 transition-opacity"
            aria-label="Previous module"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {modules.map((m, i) => (
              <button
                key={m.id}
                onClick={() => scrollMobileTo(i)}
                aria-label={`Go to ${m.name}`}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === mobileIndex ? '22px' : '8px',
                  backgroundColor: i === mobileIndex ? m.accent : '#D0D5DD',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => scrollMobileTo(mobileIndex + 1)}
            disabled={mobileIndex === modules.length - 1}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 disabled:opacity-30 transition-opacity"
            aria-label="Next module"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
