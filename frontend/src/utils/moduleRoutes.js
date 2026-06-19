import {
  Activity,
  Bed,
  ClipboardList,
  CreditCard,
  FlaskConical,
  HeartPulse,
  Pill,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export const moduleCards = [
  {
    id: 'admin',
    title: 'Admin Control',
    subtitle: 'Users, doctors, departments, credentials, permissions',
    icon: ShieldCheck,
    path: '/admin'
  },
  {
    id: 1,
    title: 'Reception / EMR',
    subtitle: 'Patient registration, UHID, appointments, demographics',
    icon: ClipboardList,
    path: '/reception/register'
  },
  {
    id: 2,
    title: 'Doctor Consultation',
    subtitle: 'Today appointments, symptoms, vitals, tests, follow-up',
    icon: Stethoscope,
    path: '/doctor'
  },
  {
    id: 3,
    title: 'Digital Prescription',
    subtitle: 'Medicines, PDF, print, multilingual WhatsApp sharing',
    icon: HeartPulse,
    path: '/doctor'
  },
  {
    id: 4,
    title: 'Lab',
    subtitle: 'Doctor test requests and lab status workflow',
    icon: FlaskConical,
    path: '/lab'
  },
  {
    id: 5,
    title: 'IPD',
    subtitle: 'Beds configuration, pricing, patient admission, tracking, discharge',
    icon: Bed,
    path: '/ipd/admission'
  },
  {
    id: 6,
    title: 'Nursing',
    subtitle: 'Separate nursing login for future nursing task workflow',
    icon: Activity,
    path: '/nursing'
  },
  {
    id: 7,
    title: 'Pharmacy',
    subtitle: 'Separate pharmacy login for future inventory and dispensing',
    icon: Pill,
    path: '/pharmacy'
  },
  {
    id: 8,
    title: 'Billing',
    subtitle: 'Separate billing login for future invoices and receipts',
    icon: CreditCard,
    path: '/module/8'
  }
];

export const getModuleById = (moduleId) => moduleCards.find((item) => String(item.id) === String(moduleId));

export const getDefaultPathForUser = (user, requestedModule) => {
  if (!user) return '/';
  const module = getModuleById(requestedModule);

  if (requestedModule === 'admin' || user.role === 'admin') {
    return module?.path || '/admin';
  }

  if (module && user.moduleAccess?.includes(Number(module.id))) {
    return module.path;
  }

  if (user.moduleAccess?.includes(2) || user.moduleAccess?.includes(3)) return '/doctor';
  if (user.moduleAccess?.includes(1)) return '/reception/register';
  const firstModule = user.moduleAccess?.[0];
  return firstModule ? `/module/${firstModule}` : '/';
};
