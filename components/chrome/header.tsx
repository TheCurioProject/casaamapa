'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/lib/store';

export function Header() {
  const { openBooking, isOpen, isAptModalOpen } = useBookingStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [headerTheme, setHeaderTheme] = useState('dark');
  const headerThemeRef = useRef('dark');
  const [showScrollHint, setShowScrollHint] = useState(false);

  // Simplest way for now to observe the current theme set by sections
  useEffect(() => {
    // Initial theme setup in case it's already set on body
    const initialTheme = document.body.dataset.theme || 'dark';
    setTheme(initialTheme);
    setHeaderTheme(initialTheme);
    headerThemeRef.current = initialTheme;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setTheme(document.body.dataset.theme || 'dark');
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    const checkHeaderTheme = () => {
      // Find what element is visually behind the header right now
      const elements = document.elementsFromPoint(window.innerWidth / 2, 30);
      for (const el of elements) {
        const themeEl = el.closest('[data-theme]');
        if (themeEl) {
          const t = themeEl.getAttribute('data-theme');
          if (t && t !== headerThemeRef.current) {
            setHeaderTheme(t);
            headerThemeRef.current = t;
          }
          break; // Found the topmost layer that defines a theme
        }
      }
    };

    // Run once on mount
    setTimeout(checkHeaderTheme, 100);

    // Inactivity scroll hint logic
    let timeout: NodeJS.Timeout;
    const checkAndShow = (delay: number) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // threshold can be ~1 viewport height to hide before footer
        const threshold = window.innerHeight * 0.8;
        const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - threshold);
        if (!atBottom) {
          setShowScrollHint(true);
        }
      }, delay);
    };

    let ticking = false;
    const onScroll = () => {
      setShowScrollHint(false);
      checkAndShow(800);

      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkHeaderTheme();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Initial timeout
    checkAndShow(1500);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }, [menuOpen]);

  return (
    <>
      <motion.header 
        className="fixed top-0 left-0 right-0 px-[var(--spacing-pad-x)] pt-[clamp(20px,3vh,48px)] pb-0 z-[110] flex justify-between items-start pointer-events-none"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 2.0, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pointer-events-auto relative">
          <Link href="#llegada" className={`font-display text-[clamp(2.2rem,4vw,2.3rem)] leading-none transition-all duration-300 ${headerTheme === 'light' ? 'text-[var(--color-ink-2)]' : 'text-[var(--color-cream)]'} ${isOpen ? 'max-md:opacity-0 max-md:pointer-events-none' : 'max-md:opacity-100'}`}>
            Casa Amapa
          </Link>
          <div className={`absolute top-full left-0 mt-1 flex items-center gap-2 text-[0.85rem] md:text-[0.8rem] tracking-[0.25em] uppercase transition-all duration-700 pointer-events-none whitespace-nowrap font-medium ${(showScrollHint && !isOpen && !isAptModalOpen) ? 'opacity-60 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
             <span className={headerTheme === 'light' ? 'text-[var(--color-ink-2)]' : 'text-[var(--color-cream)]'}>Continúa deslizando</span>
             <span className={`animate-bounce ${headerTheme === 'light' ? 'text-[var(--color-ink-2)]' : 'text-[var(--color-cream)]'}`}>↓</span>
          </div>
        </div>
        
        <div className="flex items-center gap-[10px] pointer-events-auto">
          <button 
            onClick={() => openBooking()}
            className={`
              max-md:hidden h-[46px] px-[1.8em] flex items-center justify-center rounded-full text-[0.8rem] tracking-[0.22em] uppercase transition-all duration-300 font-medium
              ${theme === 'rose' 
                ? 'bg-[var(--color-ink)] text-[var(--color-cream)] hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]' 
                : 'bg-[var(--color-rose-3)] text-[var(--color-cream)] hover:bg-[var(--color-ink)]'}
              ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
            `}
          >
            Reservar
          </button>
          
          <button 
            className={`
              w-[46px] h-[46px] rounded-full grid place-items-center content-center gap-[5px] transition-all duration-300
              ${theme === 'rose'
                ? 'bg-[var(--color-ink)] hover:bg-[var(--color-cream)]'
                : 'bg-[var(--color-rose-3)] hover:bg-[var(--color-ink)]'}
              ${(isOpen || isAptModalOpen) ? 'max-md:opacity-0 max-md:pointer-events-none max-md:scale-90' : 'max-md:opacity-100 max-md:scale-100'}
            `}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            <i className={`block w-[18px] h-[1.5px] transition-transform duration-400 ease-[var(--ease-expo)] origin-center bg-[var(--color-cream)] ${menuOpen && headerTheme !== 'rose' ? '!bg-[var(--color-cream)]' : ''} ${menuOpen ? 'translate-y-[2.75px] rotate-45' : ''}`}></i>
            <i className={`block w-[18px] h-[1.5px] transition-transform duration-400 ease-[var(--ease-expo)] origin-center bg-[var(--color-cream)] ${menuOpen && headerTheme !== 'rose' ? '!bg-[var(--color-cream)]' : ''} ${menuOpen ? '-translate-y-[2.75px] -rotate-45' : ''}`}></i>
          </button>
        </div>
      </motion.header>

      {/* Menú Overlay Animado */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            style={{ transformOrigin: 'calc(100% - 21px) -10px' }}
            className={`fixed top-[calc(clamp(20px,3vh,48px)+54px)] right-[var(--spacing-pad-x)] w-[min(320px,calc(100vw-var(--spacing-pad-x)*2))] p-[3.5vh_4vw_3vh] rounded-[20px] flex flex-col gap-[2.5vh] shadow-[0_20px_60px_rgba(20,8,20,0.4)] z-[105] border border-[rgba(61,36,56,0.06)] transition-colors duration-500 ${theme === 'rose' ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-rose-3)]'}`}
          >
            <nav className="flex flex-col gap-[0.6vh]">
              {[
                { id: 'ubicacion', n: '01', t: 'Encuéntranos', ext: 'https://www.google.com/maps/search/?api=1&query=Casa+Amapa,+Playa+Chacala,+Nayarit' },
                { id: 'apartamentos', n: '02', t: 'Departamentos' }
              ].map((item, i) => (
                <motion.a 
                  key={item.id}
                  href={item.ext || `#${item.id}`} 
                  target={item.ext ? "_blank" : undefined}
                  rel={item.ext ? "noopener noreferrer" : undefined}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: 'easeOut' }}
                  className={`flex items-baseline gap-[0.8em] py-[0.4em] px-[0.1em] font-medium text-lg text-[var(--color-cream)] border-b border-[rgba(249,241,239,0.1)] transition-colors ${theme === 'rose' ? 'hover:text-[var(--color-rose-3)]' : 'hover:text-[var(--color-ink)]'}`}
                >
                  <em className="not-italic text-[0.65rem] tracking-[0.3em] text-[var(--color-cream)] opacity-60">{item.n}</em>
                  {item.t}
                </motion.a>
              ))}
            </nav>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex flex-col gap-4 pt-[0.2rem] text-[0.65rem] tracking-[0.16em] uppercase text-[var(--color-cream)] opacity-80"
            >
              <a href="mailto:admin.casaamapa@gmail.com" className={`transition-colors break-all ${theme === 'rose' ? 'hover:text-[var(--color-rose-3)]' : 'hover:text-[var(--color-ink)]'}`}>admin.casaamapa@gmail.com</a>
              
              <div className="flex items-center gap-5 mt-1">
                {/* Facebook */}
                <a href="#" className={`transition-colors ${theme === 'rose' ? 'hover:text-[var(--color-rose-3)]' : 'hover:text-[var(--color-ink)]'}`} aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="16" height="16" fill="currentColor"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>
                </a>
                {/* Instagram */}
                <a href="#" className={`transition-colors ${theme === 'rose' ? 'hover:text-[var(--color-rose-3)]' : 'hover:text-[var(--color-ink)]'}`} aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill="currentColor"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                </a>
                {/* WhatsApp */}
                <a href="https://wa.me/523113944729" target="_blank" rel="noopener noreferrer" className={`transition-colors ${theme === 'rose' ? 'hover:text-[var(--color-rose-3)]' : 'hover:text-[var(--color-ink)]'}`} aria-label="WhatsApp">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Floating Booking Button */}
      <button 
        onClick={() => openBooking()}
        className={`
          md:hidden fixed z-[110] h-[46px] px-[1.8em] flex items-center justify-center rounded-full text-[0.8rem] tracking-[0.22em] uppercase transition-all duration-300 font-medium shadow-[0_10px_30px_rgba(61,36,56,0.3)]
          ${theme === 'rose' 
            ? 'bg-[var(--color-ink)] text-[var(--color-cream)] active:bg-[var(--color-cream)] active:text-[var(--color-ink)]' 
            : 'bg-[var(--color-rose-3)] text-[var(--color-cream)] active:bg-[var(--color-ink)]'}
          ${isOpen ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
        `}
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))', right: 'var(--spacing-pad-x)' }}
      >
        Reservar
      </button>
    </>
  );
}
