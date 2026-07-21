import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, LayoutGrid } from 'lucide-react';
import logoImg from '../../assets/yt.jpeg';
import PortalAccessModal from './PortalAccessModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Service', href: '#services' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full h-[90px] z-50 transition-all duration-300 flex items-center ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full flex justify-between items-center relative">

          {/* Logo */}
          <a href="#home" className="flex items-center flex-shrink-0 group" aria-label="Medora360 Home">
            <div className="relative transition-all duration-300 group-hover:scale-[1.04]">
              <img
                src={logoImg}
                alt="Medora360"
                loading="eager"
                decoding="async"
                className="h-[60px] sm:h-[72px] md:h-[84px] w-auto object-contain transition-all duration-300"
              />
            </div>
          </a>

          {/* Center Links (Desktop - Home, About, Service, Contact) */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 items-center gap-7 font-sans font-semibold text-[14.5px]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[#475467] hover:text-[#0F172A] transition-colors duration-200 py-1.5"
              >
                <span>{link.name}</span>
              </a>
            ))}
          </div>

          {/* Desktop fallback for md screen size */}
          <div className="hidden md:flex lg:hidden items-center gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-sans font-semibold text-[13.5px] text-[#475467] hover:text-[#0F172A] transition-colors duration-200"
              >
                <span>{link.name}</span>
              </a>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => setIsPortalModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-[9px] rounded-lg font-sans font-bold text-[13.5px] text-[#FF6A00] bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all duration-200 cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Portal Entry</span>
            </button>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-5 py-[9px] rounded-lg font-sans font-bold text-[14px] text-white bg-[#EA580C] hover:bg-[#C2410C] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Book a Demo</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg text-[#344054] hover:text-[#101828]" aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[90px] z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 py-6 px-6 flex flex-col gap-4 md:hidden shadow-lg"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-sans font-semibold text-[16px] text-[#344054] hover:text-[#0F172A] transition-colors py-2 border-b border-slate-100 flex justify-between items-center"
              >
                <span>{link.name}</span>
              </a>
            ))}
            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsPortalModalOpen(true);
                }}
                className="flex justify-center items-center gap-2 py-3 rounded-lg font-sans font-bold text-[#FF6A00] bg-orange-50 border border-orange-200 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" /> Portal Access
              </button>
              <a href="#contact" onClick={() => setIsOpen(false)} className="flex justify-center items-center gap-2 py-3 rounded-lg font-sans font-bold text-white bg-[#EA580C]">
                Book a Demo <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal Access Popup Form Modal */}
      <PortalAccessModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
      />
    </>
  );
}
