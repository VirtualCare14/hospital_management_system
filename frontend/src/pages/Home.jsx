import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HeartPulse, ChevronRight } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { moduleCards } from '../utils/moduleRoutes';

import Navbar from '../components/website/Navbar';
import Hero from '../components/website/Hero';
import About from '../components/website/About';
import Services from '../components/website/Services';
import PortalAccess from '../components/website/PortalAccess';
import Contact from '../components/website/Contact';
import Footer from '../components/website/Footer';

const Home = () => {
  const { hospitalId } = useParams();
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);

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

  // ROUTE FLOW B: Main public website (Medora Website Integration)
  return (
    <div className="bg-[#FAFAFA] text-[#101828] min-h-screen font-sans selection:bg-[#FF6A00] selection:text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <PortalAccess />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;
