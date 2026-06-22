import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Building,
  Phone,
  Send,
  Info,
  Activity,
  ClipboardList,
  Shield,
  ChevronRight,
  MapPin,
  Mail,
  UserCheck,
  LayoutGrid
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { moduleCards } from '../utils/moduleRoutes';
import toast from 'react-hot-toast';

const Home = () => {
  const { hospitalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);

  // Portal lookup form state
  const [searchName, setSearchName] = useState('');
  const [searching, setSearching] = useState(false);

  // Active website section state
  const [activeSection, setActiveSection] = useState('home'); // 'home', 'about', 'services', 'contact', 'login'

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    if (!hospitalId) {
      document.title = "Medora360 | Enterprise Hospital Information System";
      return;
    }
    client.get(`/auth/hospital/${hospitalId}`)
      .then(({ data }) => {
        setHospital(data);
        document.title = `${data.name} | Hospital Portal`;
      })
      .catch(() => {
        setHospital(null);
        document.title = "Hospital Portal";
      });
  }, [hospitalId]);

  const handlePortalLookup = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) {
      toast.error('Please enter a hospital name');
      return;
    }
    setSearching(true);
    try {
      const { data } = await client.get(`/auth/hospital-lookup?name=${encodeURIComponent(searchName.trim())}`);
      toast.success(`Redirecting to ${data.name} Portal...`);
      // Redirect to the super admin created URL
      navigate(`/hospital/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Hospital not found in super admin records.');
    } finally {
      setSearching(false);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmittingContact(true);
    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you soon.');
      setContactForm({ name: '', email: '', message: '' });
      setSubmittingContact(false);
    }, 1000);
  };

  const loginPrefix = hospitalId ? `/hospital/${hospitalId}/login` : '/login';
  const hospitalName = hospital?.name || user?.hospitalName || 'Hospital Portal';

  // ROUTE FLOW A: Hospital specific portal (render modules list)
  if (hospitalId) {
    return (
      <main className="min-h-screen bg-orange-50/50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-orange-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-500 p-3 text-white shadow-lg shadow-orange-500/20">
                <HeartPulse className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{hospitalName}</h1>
                <p className="text-sm text-gray-500 mt-1">Select a module and sign in with your department credentials.</p>
              </div>
            </div>
            <Link to="/" className="btn-secondary text-xs self-start sm:self-center">
              Back to Main Website
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {moduleCards.map((module) => (
              <Link
                key={module.id}
                to={`${loginPrefix}?module=${module.id}`}
                className="card group block p-6 transition duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100 bg-white rounded-2xl border border-orange-50"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-orange-100 p-3.5 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900 group-hover:text-orange-600 transition">{module.title}</h2>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{module.subtitle}</p>
                    <div className="mt-5 flex items-center text-sm font-bold text-orange-600 gap-1">
                      <span>Open module</span>
                      <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition duration-200" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ROUTE FLOW B: Main public website
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-50">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveSection('home')}>
            <div className="bg-orange-500 p-2 rounded-xl text-white shadow-md">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Medora360 <span className="text-orange-500">HMS</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            {['home', 'about', 'services', 'contact'].map((sect) => (
              <button
                key={sect}
                onClick={() => setActiveSection(sect)}
                className={`capitalize transition duration-200 hover:text-orange-500 ${activeSection === sect ? 'text-orange-500 font-extrabold' : ''}`}
              >
                {sect}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setActiveSection('login')}
            className="btn bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" /> Portal Access
          </button>
        </div>
      </header>

      {/* Main content sections */}
      <main className="flex-grow">

        {/* VIEW 1: HOME SECTION */}
        {activeSection === 'home' && (
          <div className="space-y-16 py-12 md:py-20">
            {/* Hero & Portal Finder */}
            <div className="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <div className="inline-flex bg-orange-100 text-orange-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Enterprise EMR & Management
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight">
                  Next-generation <span className="text-orange-500">Hospital Control</span> & Care.
                </h1>
                <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-xl">
                  Medora360 delivers complete clinical workflows, custom doctor prescriptions, lab report automation, IPD/OPD coordination, pharmacy billing, and deep administrative analytics.
                </p>

                {/* Search Hospital form card */}
                <div className="card p-6 border border-orange-100 bg-white rounded-2xl shadow-xl shadow-orange-100/40 max-w-lg mt-8">
                  <h3 className="font-bold text-gray-800 text-base mb-3">Open Hospital Portal</h3>
                  <form onSubmit={handlePortalLookup} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter hospital name..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="input rounded-xl border-orange-100 focus:border-orange-500 py-3"
                      disabled={searching}
                    />
                    <button
                      type="submit"
                      disabled={searching}
                      className="btn bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-6 py-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {searching ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Enter'
                      )}
                    </button>
                  </form>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold">Lookups are case-insensitive. Admin setup required.</p>
                </div>
              </div>

              {/* Graphical illustration card */}
              <div className="relative flex justify-center">
                <div className="w-full max-w-md bg-white border border-orange-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-orange-500/10 h-32 w-32 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-3 border-b border-orange-50 pb-4 mb-4">
                    <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">Medora360 Platform Suite</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">Active cloud connection running</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: 'Reception & Patient EMR', desc: 'Patient registrations, visit checkins' },
                      { title: 'Doctor Digital Prescriptions', desc: 'Drug suggestions, medical histories' },
                      { title: 'Laboratory Workflows', desc: 'Sample tracking, auto-saving reports' },
                      { title: 'IPD Ward & OT Control', desc: 'Bed availability, surgery bookings' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs hover:border-orange-100 hover:bg-orange-50/10 transition duration-300 flex items-start gap-3">
                        <span className="font-black text-orange-500 mt-0.5">0{idx + 1}</span>
                        <div>
                          <p className="font-bold text-gray-800">{item.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick summary stats banner */}
            <div className="bg-white border-y border-orange-50 py-10">
              <div className="mx-auto max-w-7xl px-4 grid gap-8 grid-cols-2 md:grid-cols-4 text-center">
                {[
                  { value: '100%', label: 'Cloud Availability' },
                  { value: '250k+', label: 'Registered Patients' },
                  { value: '1,500+', label: 'Daily Consultations' },
                  { value: '10+', label: 'Modules Fully Integrated' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-3xl font-black text-orange-600">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ABOUT US */}
        {activeSection === 'about' && (
          <div className="mx-auto max-w-4xl px-4 py-16 space-y-8">
            <div className="text-center space-y-2">
              <Info className="h-10 w-10 text-orange-500 mx-auto" />
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">About Medora360</h2>
              <p className="text-sm text-gray-500">Transforming healthcare digital workflows since 2026.</p>
            </div>

            <div className="card p-8 bg-white border border-orange-100 rounded-2xl shadow-xl shadow-orange-100/20 space-y-6 leading-relaxed text-gray-600 text-sm">
              <p className="font-semibold text-gray-900 text-base">
                Medora360 HMS is an all-in-one Enterprise Hospital Management System built to optimize clinical operations, manage patient billing records, record vitals history, and simplify department workflows.
              </p>
              <p>
                Our vision is to build software that doctors love using, that administration finds completely transparent, and that lab assistants can easily rely on. By keeping patient safety at the center, Medora360 helps decrease waiting times, automates test notifications, generates structured PDF prescriptions, and tracks active bed occupancy in real-time.
              </p>

              <div className="grid gap-4 md:grid-cols-3 pt-4">
                <div className="p-4 border border-orange-50 bg-orange-50/10 rounded-xl space-y-2">
                  <Shield className="h-6 w-6 text-orange-500" />
                  <h4 className="font-bold text-gray-900">Secure & Compliant</h4>
                  <p className="text-xs text-gray-500 leading-normal">Data encryption, session isolation, and secure role-based accessibility standard on all portals.</p>
                </div>
                <div className="p-4 border border-orange-50 bg-orange-50/10 rounded-xl space-y-2">
                  <Activity className="h-6 w-6 text-indigo-500" />
                  <h4 className="font-bold text-gray-900">Real-time Analytics</h4>
                  <p className="text-xs text-gray-500 leading-normal">Full hospital tracking, IPD/OPD stats, billing metrics, and active bed availability update instantly.</p>
                </div>
                <div className="p-4 border border-orange-50 bg-orange-50/10 rounded-xl space-y-2">
                  <ClipboardList className="h-6 w-6 text-emerald-500" />
                  <h4 className="font-bold text-gray-900">Automated EMR</h4>
                  <p className="text-xs text-gray-500 leading-normal">Visits logs, prescription history, lab results, and pharmacy invoices mapped under a single UHID.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SERVICES */}
        {activeSection === 'services' && (
          <div className="mx-auto max-w-7xl px-4 py-16 space-y-10">
            <div className="text-center space-y-2">
              <Activity className="h-10 w-10 text-orange-500 mx-auto" />
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Our Integrated Modules</h2>
              <p className="text-sm text-gray-500">A look at the services Medora360 connects across departments.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'OPD Reception Desk', desc: 'Register patients, look up Aadhaar history, and generate sequential appointment schedules instantly.', color: 'border-orange-100 text-orange-600 bg-orange-100/35' },
                { title: 'Clinical Consultation', desc: 'Allows doctors to log vitals, track symptoms history, record diagnosis comments, and request tests.', color: 'border-blue-100 text-blue-600 bg-blue-100/35' },
                { title: 'Digital Prescription', desc: 'Allows custom medicine descriptions or auto-suggests drugs in pharmacy inventory, with WhatsApp share.', color: 'border-green-100 text-green-600 bg-green-100/35' },
                { title: 'Laboratory Workspace', desc: 'Assigned assistant portal for sample collection status history, report draft building, and lock settings.', color: 'border-purple-100 text-purple-600 bg-purple-100/35' },
                { title: 'IPD Wards & Admissions', desc: 'Bed booking management, daily consumables tracking, medicine assignments, and OT bookings logs.', color: 'border-indigo-100 text-indigo-600 bg-indigo-100/35' },
                { title: 'Billing & Pharmacy Desks', desc: 'Calculate patient bill subtotals, adjust advances, print invoices, and record stock movements.', color: 'border-teal-100 text-teal-600 bg-teal-100/35' }
              ].map((item, idx) => (
                <div key={idx} className="card p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition duration-200 space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${item.color}`}>
                    0{idx + 1}
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-base">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: CONTACT US */}
        {activeSection === 'contact' && (
          <div className="mx-auto max-w-4xl px-4 py-16 space-y-8">
            <div className="text-center space-y-2">
              <Phone className="h-10 w-10 text-orange-500 mx-auto" />
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contact Medora360 Support</h2>
              <p className="text-sm text-gray-500">Reach out to our global technical operations team.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_280px]">
              {/* Contact Form Card */}
              <div className="card p-6 md:p-8 bg-white border border-orange-100 rounded-2xl shadow-xl shadow-orange-100/20">
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold text-gray-700">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block mb-2 font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="input"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="input"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-bold uppercase tracking-wider text-gray-500">Your Message</label>
                    <textarea
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="input min-h-[120px] py-3"
                      placeholder="Write your query or feedback here..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingContact}
                    className="btn bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 px-6 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 self-start text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-500/10"
                  >
                    <Send className="h-4 w-4" /> {submittingContact ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>

              {/* Side contact info card */}
              <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 rounded-2xl shadow-xl flex flex-col justify-between text-xs leading-normal">
                <div className="space-y-4">
                  <h4 className="font-extrabold text-orange-500 text-sm">Medora360 Operations</h4>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4.5 w-4.5 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300">123 Cloud Ave, Health Tech Center, Medical District</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4.5 w-4.5 text-orange-400 shrink-0" />
                    <p className="text-slate-300">support@medora360.com</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4.5 w-4.5 text-orange-400 shrink-0" />
                    <p className="text-slate-300">+91 99999 99999</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-700/50 mt-6">
                  <p className="text-[10px] text-slate-400 font-semibold">Response window: 24h</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: PORTAL ACCESS / LOGIN DIRECT */}
        {activeSection === 'login' && (
          <div className="mx-auto max-w-md px-4 py-16">
            <div className="card p-6 md:p-8 bg-white border border-orange-100 rounded-3xl shadow-2xl shadow-orange-100/50 relative overflow-hidden">
              <div className="text-center mb-6">
                <div className="inline-flex bg-orange-100 text-orange-600 p-3 rounded-2xl mb-3 shadow-inner">
                  <UserCheck className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Hospital Portal Entry</h3>
                <p className="text-xs text-gray-500 mt-1">Enter your organization name registered in super admin records.</p>
              </div>

              <form onSubmit={handlePortalLookup} className="space-y-4 text-xs font-semibold text-gray-700">
                <div>
                  <label className="block mb-2 font-bold uppercase tracking-wider text-gray-500">Hospital Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter hospital name (e.g. Prayas healthcare)..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="input rounded-xl py-3 text-sm focus:border-orange-500 focus:ring-orange-100 transition-all duration-300"
                    disabled={searching}
                  />
                </div>

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 flex items-center justify-center cursor-pointer text-sm"
                >
                  {searching ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Search & Access Portal'
                  )}
                </button>
              </form>

              <div className="border-t border-orange-50 pt-4 mt-6 text-center">
                <button onClick={() => setActiveSection('home')} className="text-xs font-bold text-orange-600 hover:text-orange-700 transition">
                  Back to main page
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Medora360 HMS. All rights reserved.</p>
          <div className="flex gap-6 font-semibold">
            {['home', 'about', 'services', 'contact'].map((sect) => (
              <button key={sect} onClick={() => setActiveSection(sect)} className="capitalize hover:text-white transition">
                {sect}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
