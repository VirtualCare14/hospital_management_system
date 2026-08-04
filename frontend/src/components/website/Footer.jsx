import logoImg from '../../assets/medora360_logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const cols = [
    {
      title: 'Solutions',
      links: ['Reception / EMR', 'Doctor Portal', 'Digital Prescription', 'Laboratory (LIMS)', 'IPD Management', 'Pharmacy', 'Billing & Accounts'],
    },
    {
      title: 'Company',
      links: ['About Medora360', 'Careers', 'Press Room', 'Contact Sales', 'Partner Program'],
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Use', 'Data Security', 'Cookie Policy'],
    },
  ];

  return (
    <footer id="footer" className="bg-[#101828] text-[#FAFAFA] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <div className="w-fit">
              <a href="#home" className="block group" aria-label="Medora360 Home">
                <img
                  src={logoImg}
                  alt="Medora360"
                  loading="lazy"
                  decoding="async"
                  className="h-[42px] w-auto object-contain transition-all duration-300 group-hover:scale-[1.04]"
                />
              </a>
            </div>
            <p className="font-sans text-sm text-white/40 leading-relaxed max-w-xs">
              Transforming hospitals through intelligent, integrated digital solutions that elevate patient care and operational efficiency.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'YouTube', path: 'M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z M9.75 15.02l5.75-3.02-5.75-3.02v6.04z' },
              ].map((s) => (
                <button key={s.label} aria-label={s.label} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-[#FF6A00]/20 hover:border-[#FF6A00]/30 transition-all duration-300 group">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40 group-hover:text-[#FF6A00] transition-colors">
                    <path d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {cols.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="font-display font-extrabold text-xs uppercase tracking-widest text-white/30">{col.title}</h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-sans text-sm text-white/55 hover:text-[#FF6A00] transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-7 border-t border-white/6">
          <p className="font-sans text-xs text-white/28">
            &copy; {currentYear} Medora360. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms'].map((item) => (
              <a key={item} href="#" className="font-sans text-xs text-white/28 hover:text-[#FF6A00] transition-colors duration-200">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
