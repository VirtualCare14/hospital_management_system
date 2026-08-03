import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const HeaderContext = createContext(null);

// Route title & subtitle dictionary matching all hospital management system modules
const ROUTE_HEADER_MAP = [
  // IPD Module
  { path: '/ipd/admission', title: 'IPD Inpatient Admissions', subtitle: 'Admit patient cases to available beds, assign clinical consultants, and print admission summary cards.' },
  { path: '/ipd/patients', title: 'IPD Patient Directory', subtitle: 'View and manage all active admitted IPD patients, bed assignments, and ward statuses.' },
  { path: '/ipd/discharged-patients', title: 'Discharged Patients Archive', subtitle: 'Browse complete history of discharged inpatients, clearance summaries, and final bill records.' },
  { path: '/ipd/services', title: 'IPD Services & Consumables', subtitle: 'Log daily nursing care, medical consumables, ward procedures, and diagnostic requests.' },
  { path: '/ipd/ot-management', title: 'Operation Theatre Desk', subtitle: 'Monitor live surgical suites, OT scheduling, procedures, and surgeon availability.' },
  { path: '/ipd/same-day', title: 'Same Day Care IPD Desk', subtitle: 'Manage rapid surgical inpatient admissions, short-term ward stays, and fast-track recovery.' },
  { path: '/ipd/patient/', title: 'Inpatient Clinical Summary', subtitle: 'Detailed inpatient profile, bed transfer history, active medications, and care plan.' },
  { path: '/ipd/discharge/', title: 'IPD Discharge Clearance', subtitle: 'Prepare medical discharge summary notes, prescription advice, and billing clearance.' },
  { path: '/ipd/chart/', title: 'IPD Medication Chart', subtitle: 'Record drug administrations, nurse dosage logs, and daily inpatient medication schedules.' },
  { path: '/ipd/ot-flow/', title: 'OT Patient Flow Tracker', subtitle: 'Track real-time surgical patient movements from pre-op preparation to recovery.' },
  { path: '/ipd/ot/', title: 'IPD OT Surgery Booking', subtitle: 'Schedule operation theatre procedures and assign surgical teams for inpatients.' },

  // Billing Module
  { path: '/billing', title: 'Billing & Invoicing', subtitle: 'Process patient invoices, OPD/IPD collections, lab charges, pharmacy bills, and payments.' },
  { path: '/module/8', title: 'Billing & Invoicing', subtitle: 'Process patient invoices, OPD/IPD collections, lab charges, pharmacy bills, and payments.' },

  // Pharmacy Module
  { path: '/pharmacy', title: 'Pharmacy Workspace', subtitle: 'Manage medicine stock inventory, dispense prescriptions, counter sales, and purchase orders.' },

  // Lab Module
  { path: '/lab-assistant/portal', title: 'Laboratory Information System', subtitle: 'Process test orders, enter diagnostic results, manage sample queues, and print lab reports.' },
  { path: '/lab', title: 'Laboratory Information System', subtitle: 'Process test orders, enter diagnostic results, manage sample queues, and print lab reports.' },

  // Same Day Care Module
  { path: '/same-day-care/ipd-patients', title: 'Same Day Inpatient Directory', subtitle: 'Monitor active daycare patients, post-procedure observation, and discharge status.' },
  { path: '/same-day-care/dialysis/treatment', title: 'Dialysis Session Record', subtitle: 'Log pre & post dialysis parameters, dialyzer usage, and clinical session notes.' },
  { path: '/same-day-care/dialysis', title: 'Dialysis Unit Workspace', subtitle: 'Schedule dialysis sessions, track machine allocations, and log patient vitals.' },
  { path: '/same-day-care/treatment', title: 'Same Day Procedure Form', subtitle: 'Record daycare treatment details, procedure notes, and assigned ward beds.' },
  { path: '/same-day-care', title: 'Same Day Care Workspace', subtitle: 'Manage daycare procedures, rapid admissions, recovery beds, and patient tracking.' },

  // Reception Module
  { path: '/reception/register', title: 'Patient Registration', subtitle: 'Register new patients, issue unique UHID numbers, and capture demographic records.' },
  { path: '/reception/patients/', title: 'Patient Profile & History', subtitle: 'View complete patient demographics, past medical visits, lab reports, and billing history.' },
  { path: '/reception/patients', title: 'Patient Directory', subtitle: 'Search, view, and manage registered outpatient and inpatient hospital records.' },
  { path: '/reception/follow-ups', title: 'Follow-Up Appointments', subtitle: 'Schedule and manage patient return visits, follow-up queues, and doctor slots.' },

  // Doctor Module
  { path: '/doctor/patients', title: 'Outpatient Queue', subtitle: 'Manage waiting patients, perform clinical consultations, and issue digital prescriptions.' },
  { path: '/doctor/completed/', title: 'Completed Consultation Details', subtitle: 'Review detailed prescription, clinical diagnosis notes, and patient records.' },
  { path: '/doctor/completed', title: 'Completed Consultations', subtitle: 'Review past consultation records, digital prescriptions, and clinical diagnosis logs.' },
  { path: '/doctor/consultation-track/', title: 'Patient Treatment Timeline', subtitle: 'Track patient complete clinical journey, vitals trends, and visit history.' },
  { path: '/doctor/consultation/', title: 'Digital Prescription', subtitle: 'Examine patient, record vitals, chief complaints, symptoms, diagnosis, and advice.' },
  { path: '/doctor/prescription/', title: 'Digital Prescription', subtitle: 'Generate electronic prescriptions, dosage instructions, and follow-up guidance.' },
  { path: '/doctor/ipd-patients', title: 'IPD Inpatient Rounds', subtitle: 'Manage admitted patients, record daily doctor progress notes, and order treatments.' },
  { path: '/doctor/ot-patients', title: 'Surgical Case Management', subtitle: 'Track scheduled operation theatre cases, pre-op assessments, and surgical records.' },
  { path: '/doctor/ot/', title: 'OT Surgery Notes', subtitle: 'Record intraoperative notes, surgical team details, and anesthesia notes.' },
  { path: '/doctor/discharge-requests', title: 'Clinical Discharge Review', subtitle: 'Review, complete, and sign patient discharge summary notes and clinical clearances.' },
  { path: '/doctor', title: 'Doctor Workspace', subtitle: 'Overview of daily consultation queue, scheduled appointments, and active cases.' },

  // Admin Module
  { path: '/admin/users', title: 'User & Staff Management', subtitle: 'Create and manage hospital staff accounts, system roles, and access credentials.' },
  { path: '/admin/departments', title: 'Department Management', subtitle: 'Manage clinical departments, specialties, and doctor assignments.' },
  { path: '/admin/hospital-settings', title: 'Hospital Settings', subtitle: 'Configure hospital details, logo branding, contact info, and system preferences.' },
  { path: '/admin/room-settings', title: 'IPD Settings', subtitle: 'Configure wards, room types, bed capacities, admission dates, and daily rate structures.' },
  { path: '/admin/consumable-services', title: 'Consumables & Services', subtitle: 'Manage IPD consumable catalog, service pricing, and item master.' },
  { path: '/admin/ot-settings', title: 'Operation Theatre Settings', subtitle: 'Configure OT suites, equipment, procedure categories, and schedules.' },
  { path: '/admin/same-day-care', title: 'Same Day Care Settings', subtitle: 'Configure daycare wards, procedure packages, and treatment settings.' },
  { path: '/admin/pharmacy-settings', title: 'Pharmacy Settings', subtitle: 'Manage pharmacy inventory settings, categories, and tax rules.' },
  { path: '/admin/delete-data', title: 'System Data Cleanup', subtitle: 'Manage system reset, test data purge, and database housekeeping.' },
  { path: '/admin', title: 'Hospital Admin Dashboard', subtitle: 'System overview, operational metrics, staff activity, and department management.' },

  // Super Admin
  { path: '/super-admin/dashboard', title: 'Super Admin Portal', subtitle: 'Manage hospital subscriptions, multi-tenant instances, and global system configurations.' }
];

export const getDefaultHeaderForPath = (pathname) => {
  const matched = ROUTE_HEADER_MAP.find(route => 
    route.path === pathname || (route.path.endsWith('/') && pathname.startsWith(route.path))
  );

  if (matched) {
    return { title: matched.title, subtitle: matched.subtitle };
  }

  // Fallback formatting for any unmapped route
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const lastSeg = segments[segments.length - 1];
    const formattedTitle = lastSeg
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    return {
      title: formattedTitle || 'Hospital Management System',
      subtitle: 'Manage hospital clinical workflows, patient care, and administrative tasks.'
    };
  }

  return {
    title: 'Hospital Management System',
    subtitle: 'Manage hospital clinical workflows, patient care, and administrative tasks.'
  };
};

export const HeaderProvider = ({ children }) => {
  const location = useLocation();
  const [customHeader, setCustomHeaderState] = useState(null);
  const onRefreshRef = useRef(null);

  // Clear custom page header and refresh ref on route changes
  useEffect(() => {
    setCustomHeaderState(null);
    onRefreshRef.current = null;
  }, [location.pathname]);

  const defaultHeader = getDefaultHeaderForPath(location.pathname);

  const title = customHeader?.title || defaultHeader.title;
  const subtitle = customHeader?.subtitle || defaultHeader.subtitle;

  const setCustomHeader = useCallback((headerObj) => {
    setCustomHeaderState(prev => {
      if (prev?.title === headerObj?.title && prev?.subtitle === headerObj?.subtitle) {
        return prev;
      }
      return headerObj;
    });
  }, []);

  const registerRefresh = useCallback((fn) => {
    onRefreshRef.current = fn;
  }, []);

  const handleRefresh = useCallback(() => {
    if (typeof onRefreshRef.current === 'function') {
      onRefreshRef.current();
    } else {
      window.location.reload();
    }
  }, []);

  return (
    <HeaderContext.Provider value={{
      title,
      subtitle,
      setCustomHeader,
      registerRefresh,
      handleRefresh
    }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = (options) => {
  const context = useContext(HeaderContext);
  
  const title = options?.title;
  const subtitle = options?.subtitle;
  const onRefresh = options?.onRefresh;

  useEffect(() => {
    if (!context) return;
    if (title || subtitle) {
      context.setCustomHeader({ title, subtitle });
    }
  }, [context, title, subtitle]);

  useEffect(() => {
    if (!context) return;
    if (onRefresh) {
      context.registerRefresh(onRefresh);
    }
  }, [context, onRefresh]);

  return context;
};
