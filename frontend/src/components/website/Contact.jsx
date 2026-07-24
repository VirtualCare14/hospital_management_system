import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Phone, CheckCircle2, User, Building2, MessageSquare, 
  ArrowRight, Users, Zap, Clock 
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    hospital: '',
    phone: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await client.post('/demo-request', formState);
      if (response.data?.success) {
        setSubmitted(true);
        toast.success('Demo request submitted successfully!');
        setFormState({ name: '', hospital: '', phone: '', email: '', message: '' });
      } else {
        toast.error(response.data?.message || 'Failed to submit demo request.');
      }
    } catch (error) {
      console.error('Demo request error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit demo request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 100, damping: 16 } 
    }
  };

  return (
    <section 
      id="contact" 
      className="relative py-28 md:py-36 overflow-hidden border-t border-[#EAECF0]/60"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F2 100%)' }}
    >
      <div className="absolute top-1/4 right-0 lg:right-[8%] w-[600px] h-[600px] rounded-full bg-[#FF6A00]/8 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full bg-[#FF8A00]/4 blur-[180px] pointer-events-none" />
      <div className="absolute top-10 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-500/3 blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-16 items-start">
          
          {/* LEFT SIDE */}
          <div className="lg:col-span-5 flex flex-col text-left justify-between h-full">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="font-sans font-bold text-xs tracking-widest text-gradient-orange bg-clip-text uppercase">
                  ENTERPRISE CONSULTATION
                </span>
                <span className="w-12 h-[2px] bg-gradient-to-r from-[#FF6A00] to-transparent rounded-full" />
              </div>
              <h2 className="font-display font-extrabold text-4xl sm:text-[54px] text-[#101828] tracking-tight leading-[1.05] mb-6">
                Request Your Free Demo
              </h2>
              <p className="font-sans text-[#667085] text-[18px] leading-relaxed mb-10 max-w-[480px]">
                Ready to transform your healthcare facility? Speak with our enterprise product specialists for a personalized walkthrough of Medora360.
              </p>
            </motion.div>

            {/* Statistics Row */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-10"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center gap-3.5 p-4 bg-white/90 backdrop-blur-md border border-[#EAECF0]/60 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#FF6A00]/30 transition-all duration-300 cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF6A00] flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#101828] leading-tight">100+</p>
                  <p className="text-[11px] text-[#667085] font-semibold tracking-tight whitespace-nowrap">Healthcare Partners</p>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center gap-3.5 p-4 bg-white/90 backdrop-blur-md border border-[#EAECF0]/60 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#FF6A00]/30 transition-all duration-300 cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF6A00] flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#101828] leading-tight">10,000+</p>
                  <p className="text-[11px] text-[#667085] font-semibold tracking-tight whitespace-nowrap">Active Users</p>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center gap-3.5 p-4 bg-white/90 backdrop-blur-md border border-[#EAECF0]/60 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#FF6A00]/30 transition-all duration-300 cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF6A00] flex-shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#101828] leading-tight">99.9%</p>
                  <p className="text-[11px] text-[#667085] font-semibold tracking-tight whitespace-nowrap">System Uptime</p>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center gap-3.5 p-4 bg-white/90 backdrop-blur-md border border-[#EAECF0]/60 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#FF6A00]/30 transition-all duration-300 cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF6A00] flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#101828] leading-tight">24/7</p>
                  <p className="text-[11px] text-[#667085] font-semibold tracking-tight whitespace-nowrap">Enterprise Support</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Cards */}
            <motion.div 
              className="flex flex-col gap-5 mb-10"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.a 
                href="mailto:orangevirtualconnect@gmail.com" 
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.015 }}
                className="flex items-center gap-5 p-6 bg-white border border-[#EAECF0] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:border-[#FF6A00] transition-all duration-300 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF8A00] to-[#FF6A00] flex items-center justify-center text-white group-hover:scale-105 transition-all duration-300 flex-shrink-0 shadow-md shadow-[#FF6A00]/10">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-grow text-left">
                  <h4 className="font-sans font-bold text-base text-[#101828] mb-0.5">Email Us</h4>
                  <p className="font-sans text-xs sm:text-sm text-[#667085] font-medium whitespace-nowrap group-hover:text-[#FF6A00] transition-colors">
                    orangevirtualconnect@gmail.com
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 ml-auto flex-shrink-0" />
              </motion.a>

              <motion.a 
                href="tel:+919310557136" 
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.015 }}
                className="flex items-center gap-5 p-6 bg-white border border-[#EAECF0] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:border-[#FF6A00] transition-all duration-300 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF8A00] to-[#FF6A00] flex items-center justify-center text-white group-hover:scale-105 transition-all duration-300 flex-shrink-0 shadow-md shadow-[#FF6A00]/10">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-grow text-left">
                  <h4 className="font-sans font-bold text-base text-[#101828] mb-0.5">Call Direct</h4>
                  <p className="font-sans text-sm text-[#667085] font-medium group-hover:text-[#FF6A00] transition-colors">
                    +91 93105 57136
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 ml-auto flex-shrink-0" />
              </motion.a>
            </motion.div>
          </div>

          {/* RIGHT SIDE */}
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white rounded-[28px] border border-[#EAECF0] p-8 sm:p-12 shadow-[0_20px_50px_rgba(16,24,40,0.03)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_30px_60px_rgba(16,24,40,0.06)]">
              <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#FF8A00] to-[#FF6A00]" />
              
              <div className="absolute top-6 right-6 bg-[#FFF8F2] border border-[#FF6A00]/25 rounded-full px-3.5 py-1 text-[10px] font-extrabold text-[#FF6A00] uppercase tracking-wider hidden sm:block">
                FREE CONSULTATION
              </div>

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form 
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-left mb-2 pr-16 sm:pr-0">
                      <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#101828] mb-2 tracking-tight">
                        Book Your Enterprise Demo
                      </h3>
                      <p className="font-sans text-sm text-[#667085] leading-relaxed">
                        Talk with our product specialists. Typical response time is under 24 hours.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="name" className="font-sans text-xs font-bold text-[#344054] ml-1">
                          Full Name
                        </label>
                        <div className="relative flex items-center border border-[#EAECF0] bg-white rounded-[16px] focus-within:border-[#FF6A00] focus-within:ring-4 focus-within:ring-[#FF6A00]/10 transition-all duration-300">
                          <User className="absolute left-4 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formState.name}
                            onChange={handleChange}
                            placeholder="John Smith"
                            className="w-full h-[58px] pl-12 pr-4 bg-transparent outline-none text-[#101828] font-sans text-sm placeholder:text-gray-400/80"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="hospital" className="font-sans text-xs font-bold text-[#344054] ml-1">
                          Hospital / Facility Name
                        </label>
                        <div className="relative flex items-center border border-[#EAECF0] bg-white rounded-[16px] focus-within:border-[#FF6A00] focus-within:ring-4 focus-within:ring-[#FF6A00]/10 transition-all duration-300">
                          <Building2 className="absolute left-4 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            id="hospital"
                            name="hospital"
                            required
                            value={formState.hospital}
                            onChange={handleChange}
                            placeholder="City Care Hospital"
                            className="w-full h-[58px] pl-12 pr-4 bg-transparent outline-none text-[#101828] font-sans text-sm placeholder:text-gray-400/80"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="phone" className="font-sans text-xs font-bold text-[#344054] ml-1">
                          Phone Number
                        </label>
                        <div className="relative flex items-center border border-[#EAECF0] bg-white rounded-[16px] focus-within:border-[#FF6A00] focus-within:ring-4 focus-within:ring-[#FF6A00]/10 transition-all duration-300">
                          <Phone className="absolute left-4 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required
                            value={formState.phone}
                            onChange={handleChange}
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full h-[58px] pl-12 pr-4 bg-transparent outline-none text-[#101828] font-sans text-sm placeholder:text-gray-400/80"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="font-sans text-xs font-bold text-[#344054] ml-1">
                          Work Email
                        </label>
                        <div className="relative flex items-center border border-[#EAECF0] bg-white rounded-[16px] focus-within:border-[#FF6A00] focus-within:ring-4 focus-within:ring-[#FF6A00]/10 transition-all duration-300">
                          <Mail className="absolute left-4 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formState.email}
                            onChange={handleChange}
                            placeholder="john@hospital.com"
                            className="w-full h-[58px] pl-12 pr-4 bg-transparent outline-none text-[#101828] font-sans text-sm placeholder:text-gray-400/80"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label htmlFor="message" className="font-sans text-xs font-bold text-[#344054] ml-1">
                        Message / Requirements
                      </label>
                      <div className="relative flex items-start border border-[#EAECF0] bg-white rounded-[16px] focus-within:border-[#FF6A00] focus-within:ring-4 focus-within:ring-[#FF6A00]/10 transition-all duration-300">
                        <MessageSquare className="absolute left-4 top-4.5 w-5 h-5 text-gray-400" />
                        <textarea
                          id="message"
                          name="message"
                          value={formState.message}
                          onChange={handleChange}
                          placeholder="Tell us about your hospital, required modules, staff size, expected timeline, and any questions..."
                          className="w-full h-[180px] pl-12 pr-4 py-4 bg-transparent outline-none text-[#101828] font-sans text-sm resize-none placeholder:text-gray-400/80"
                        />
                      </div>
                    </div>


                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[64px] rounded-[18px] font-sans font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] hover:from-[#FF9E1A] hover:to-[#FF7C1A] shadow-[0_4px_20px_rgba(255,106,0,0.2)] hover:shadow-[0_8px_30px_rgba(255,106,0,0.35)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {loading ? (
                        <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2 text-base tracking-wide">
                          Schedule Free Demo <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </span>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center justify-center py-12 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 mb-6 shadow-md">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-extrabold text-2xl text-[#101828] mb-3">Request Submitted!</h3>
                    <p className="font-sans text-[#475467] text-sm max-w-sm leading-relaxed mb-8">
                      Thank you for contacting Medora360. A product specialist has been assigned to your hospital profile and will schedule your live presentation shortly.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-6 py-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-[#101828] border border-black/5 transition-all bg-black/[0.01]"
                    >
                      Submit Another Query
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
