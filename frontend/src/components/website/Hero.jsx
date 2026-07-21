import { motion } from 'framer-motion';
import { Sparkles, Check, Activity, Users, UserCheck, CheckSquare } from 'lucide-react';
import hospitalBg from '../../assets/hospital_hero_bg.png';
import doctorsHoldingTablet from '../../assets/ktk.png';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const LEFT_LIST = [
  'Appointment Management',
  'Outpatient Department (OPD)',
  'Inpatient Department (IPD)/Emergency/Same Day Care',
  'Electronic Medical Records (EMR)',
  'Doctor Dashboard',
  'Nurse Station'
];
const RIGHT_LIST = [
  'Pharmacy Management',
  'Laboratory Information System (LIS)/ Radiology Management',
  'Operation Theatre (OT) Management',
  'Billing & Finance',
  'Pharmacy & Stores',
  'MIS & Business Intelligence'
];

const STATS = [
  { value: '10K+', label: 'Happy Patients', icon: Users },
  { value: '500+', label: 'Healthcare Providers', icon: UserCheck },
  { value: '1M+', label: 'Appointments', icon: CheckSquare },
  { value: '99.9%', label: 'Uptime SLA', icon: Activity },
];

export default function Hero() {
  return (
    <>
      {/* HERO SECTION */}
      <section
        id="home"
        className="relative min-h-[95vh] flex flex-col justify-center overflow-hidden bg-white isolate"
        style={{ paddingTop: '90px' }}
      >
        {/* Background depth layers */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url(${hospitalBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(1px)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
            }}
          />
          <div
            className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
          />
          <div
            className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,180,100,0.05) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
        </div>

        <div className="max-w-[1380px] mx-auto px-6 lg:px-12 w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-6 pt-3 pb-10">

          {/* LEFT COLUMN */}
          <motion.div
            className="w-full lg:w-[52%] flex flex-col items-start"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-100 bg-gradient-to-r from-orange-50/50 via-white to-orange-50/30 mb-4 shadow-sm backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF6A00]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ALL-IN-ONE HEALTHCARE MANAGEMENT SYSTEM
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-extrabold tracking-[-0.03em] leading-[1.1] text-[#0F172A] mb-6"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
              }}
            >
              The Operating System<br />
              for Modern<br />
              <span
                className="relative inline-block pb-2"
                style={{
                  background: 'linear-gradient(135deg, #FF6A00 0%, #FF9D4D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Healthcare.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="text-[#475467] text-[16px] sm:text-[18px] leading-[1.7] mb-8 max-w-[520px]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Medora360 unifies appointments, EMR, billing, pharmacy, lab management and analytics into one intelligent, cloud-native platform — built for the future of Indian healthcare.
            </motion.p>

            {/* Checklist */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-9 w-full max-w-[620px]">
              {[...LEFT_LIST, ...RIGHT_LIST].map((item, i) => (
                <div key={i} className="flex items-start gap-3 group transition-all duration-300 hover:translate-x-1">
                  <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF8C3A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-orange-500/10 group-hover:scale-110 transition-all duration-300">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                  </div>
                  <span
                    className="text-[13.5px] font-bold text-[#344054] leading-snug group-hover:text-[#FF6A00] transition-colors duration-300"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </motion.div>

          </motion.div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[48%] flex justify-center items-center lg:pl-4">
            <motion.div
              className="relative transition-all duration-500 hover:-translate-y-2"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={doctorsHoldingTablet}
                alt="Medora360 Doctors showing thumbs up and holding a tablet with dashboard"
                className="w-full h-auto object-contain max-w-[540px] md:max-w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
              />
            </motion.div>
          </div>

        </div>
      </section>

      {/* STATS BAR */}
      <section className="w-full py-12 relative z-10 overflow-hidden border-t border-slate-800/10 bg-gradient-to-br from-[#0F172A] to-[#1E293B] shadow-lg">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.01] border border-white/[0.02] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/[0.01] border border-white/[0.02] pointer-events-none" />

        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-2 gap-3.5 sm:gap-6 md:flex md:flex-row md:justify-between md:items-center">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                className="flex items-center gap-3 sm:gap-4 text-left p-3.5 sm:p-4 rounded-2xl bg-slate-800/30 md:bg-transparent border border-slate-700/30 md:border-0 md:flex-1 md:justify-center group transition-all hover:bg-slate-800/50"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800/60 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-slate-700/50 shadow-inner group-hover:border-[#FF8C3A]/50 group-hover:bg-slate-800/90 transition-all duration-300">
                  <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF8C3A] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="font-extrabold text-[20px] sm:text-[28px] md:text-[32px] text-white tracking-tight leading-none mb-1 bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent truncate"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-[9px] sm:text-[10px] font-extrabold text-[#94A3B8] leading-tight uppercase tracking-wider sm:tracking-widest truncate"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
}
