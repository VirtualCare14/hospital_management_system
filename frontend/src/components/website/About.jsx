import { motion } from 'framer-motion';
import { Shield, Cloud, BarChart3, Cpu, Activity, Clock, Users, Building } from 'lucide-react';

export default function About() {
  const stats = [
    { number: '100+', label: 'Hospitals Empowered', icon: Building },
    { number: '500K+', label: 'Patients Managed', icon: Users },
    { number: '99.9%', label: 'Platform Uptime', icon: Activity },
    { number: '24×7', label: 'Dedicated Support', icon: Clock },
  ];

  const pillars = [
    {
      title: 'Modern Architecture',
      description: 'Built on high-performance cloud frameworks that scale effortlessly from single clinics to multi-specialty hospital chains.',
      icon: Cpu,
    },
    {
      title: 'Enterprise Security',
      description: 'End-to-end data encryption and HIPAA compliance ensures patient medical histories and financial logs are fully secured.',
      icon: Shield,
    },
    {
      title: 'Cloud Platform Integration',
      description: 'Access clinical data anywhere, anytime, with instant real-time synchronization between billing, lab, and consultation queues.',
      icon: Cloud,
    },
    {
      title: 'Actionable Analytics',
      description: 'Empower administrators with live dashboards tracking revenue trends, bed occupancy, doctor efficiency, and lab turnaround times.',
      icon: BarChart3,
    },
  ];

  const modulesList = [
    'Hospital ERP Platform',
    'EMR (Electronic Medical Records)',
    'Digital Prescription Panel',
    'Laboratory LIMS Workflow',
    'Pharmacy Inventory Suite',
    'IPD Bed Allocation',
    'Billing & Accounts Core',
    'Patient Queue System',
  ];

  return (
    <section id="about" className="relative py-24 md:py-32 overflow-hidden bg-[#FAFAFA] border-t border-black/5">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-[-10%] w-[400px] h-[400px] rounded-full bg-[#FF6A00]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[500px] h-[500px] rounded-full bg-blue-500/3 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* About Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-20">
          <motion.div 
            className="lg:col-span-6 text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-sans font-semibold text-xs tracking-widest text-[#FF6A00] uppercase mb-4 block">About Medora360</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#101828] tracking-tight leading-[1.1] mb-6">
              A Unified Intelligent Ecosystem for Smart Hospitals
            </h2>
            <p className="font-sans text-[#475467] text-lg leading-relaxed mb-6">
              Traditional hospitals run on fragmented systems. Medora360 bridges the gap, unifying patient administration, medical diagnosis, clinical labs, pharmacy logs, and finance.
            </p>
            <p className="font-sans text-[#667085] text-base leading-relaxed">
              Designed for speed and ease, Medora360 minimizes waiting times, prevents errors, and optimizes resource distribution, enabling clinicians to focus entirely on patient care.
            </p>
          </motion.div>

          <motion.div 
            className="lg:col-span-6 grid grid-cols-2 gap-4 lg:pl-6"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {modulesList.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-black/5 hover:border-black/10 hover:shadow-sm transition-all duration-300"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] shadow-md shadow-[#FF6A00]/25" />
                <span className="font-sans font-semibold text-sm text-[#344054]">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Pillars / Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={index}
                className="glass-card p-8 rounded-2xl border border-black/5 text-left flex gap-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FF6A00]/10 border border-[#FF6A00]/20 flex items-center justify-center text-[#FF6A00] shadow-inner">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl text-[#101828] mb-3">{pillar.title}</h3>
                  <p className="font-sans text-[#475467] text-sm leading-relaxed">{pillar.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                className="relative glass-card p-8 rounded-2xl border border-black/5 overflow-hidden flex flex-col items-center justify-center text-center group"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-[#FF6A00]/5 blur-2xl group-hover:bg-[#FF6A00]/10 transition-colors duration-300" />
                
                <div className="w-12 h-12 rounded-full bg-black/[0.02] border border-black/5 flex items-center justify-center text-[#475467] mb-4 group-hover:text-[#FF6A00] group-hover:border-[#FF6A00]/30 transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="font-display font-extrabold text-4xl sm:text-5xl text-[#101828] tracking-tight mb-2">
                  {stat.number}
                </div>
                
                <div className="font-sans font-bold text-xs tracking-wider uppercase text-[#667085]">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
