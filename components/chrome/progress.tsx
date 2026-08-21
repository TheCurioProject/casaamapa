'use client';
import { useEffect, useRef } from 'react';

const SECTIONS = [
  { id: 'llegada', label: 'Inicio' },
  { id: 'arquitectura', label: 'Arquitectura' },
  { id: 'apartamentos', label: 'Departamentos' },
  { id: 'amenidades', label: 'Amenidades' },
  { id: 'leyenda', label: 'Leyenda' },
  { id: 'ubicacion', label: 'Ubicación' },
  { id: 'chacala', label: 'Chacala' },
];

export function Progress() {
  const barRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIdRef = useRef<string>('llegada');

  useEffect(() => {
    // --- Scroll progress bar (ref-based, no React re-renders) ---
    const onScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0 && barRef.current) {
        barRef.current.style.transform = `scaleX(${winScroll / height})`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // --- Active section observer ---
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && id !== activeIdRef.current) {
              activeIdRef.current = id;
              dotsRef.current.forEach((dot) => {
                if (!dot) return;
                const isActive = dot.dataset.target === id;
                dot.style.transform = isActive ? 'scale(1.8)' : 'scale(1)';
                dot.style.opacity = isActive ? '1' : '';
                dot.style.backgroundColor = isActive ? 'var(--color-rose-3)' : '';
              });
            }
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // --- Theme reactivity for bar color ---
    const themeObserver = new MutationObserver(() => {
      const theme = document.body.dataset.theme || 'dark';
      const trackEl = barRef.current?.parentElement;
      if (trackEl) {
        trackEl.style.backgroundColor = theme === 'light'
          ? 'rgba(94,58,80,0.08)'
          : 'rgba(244,229,225,0.08)';
      }
      dotsRef.current.forEach(dot => {
        if (!dot || dot.dataset.target === activeIdRef.current) return;
        dot.style.backgroundColor = theme === 'light'
          ? 'rgba(94,58,80,0.2)'
          : 'rgba(244,229,225,0.3)';
      });
    });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] bg-[rgba(244,229,225,0.08)] transition-colors duration-300"
        aria-hidden="true"
      >
        <span
          ref={barRef}
          className="block h-full bg-[var(--color-rose-2)] origin-left will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <nav
        className="fixed right-[calc(var(--spacing-pad-x)/2.5)] top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-[16px] max-md:hidden"
        aria-label="Progreso de secciones"
      >
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            ref={el => { dotsRef.current[i] = el; }}
            data-target={s.id}
            className="w-[6px] h-[6px] rounded-full bg-[rgba(244,229,225,0.3)] transition-all duration-300 hover:bg-[var(--color-rose-1)] hover:scale-125"
            aria-label={`Ir a sección ${s.label}`}
            onClick={() => {
              const target = document.getElementById(s.id);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        ))}
      </nav>
    </>
  );
}
