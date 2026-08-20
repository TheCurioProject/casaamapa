'use client';
import { useEffect, useState } from 'react';

export function Progress() {
  const [theme, setTheme] = useState('dark');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Theme observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setTheme(document.body.dataset.theme || 'dark');
        }
      });
    });
    observer.observe(document.body, { attributes: true });

    // Scroll progress listener
    const onScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        setProgress((winScroll / height) * 100);
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    // Also attach to lenis if it's running on window
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 h-[3px] z-[100] transition-colors duration-300 ${theme === 'light' ? 'bg-[rgba(94,58,80,0.08)]' : 'bg-[rgba(244,229,225,0.08)]'}`}
        aria-hidden="true"
      >
        <span 
          className="block h-full bg-[var(--color-rose-2)] origin-left will-change-transform"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>

      <nav 
        className="fixed right-[calc(var(--spacing-pad-x)/2.5)] top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-[16px]"
        aria-label="Progreso de secciones"
      >
        {['llegada', 'lugar', 'arquitectura', 'apartamentos', 'azotea', 'vivir', 'reservar'].map((id, i) => (
          <button
            key={id}
            data-target={id}
            className={`w-[6px] h-[6px] rounded-full transition-all duration-300
              ${theme === 'light' ? 'bg-[rgba(94,58,80,0.2)]' : 'bg-[rgba(244,229,225,0.3)]'}
              hover:bg-[var(--color-rose-1)] hover:scale-125
            `}
            aria-label={`Ir a sección ${id}`}
            onClick={(e) => {
              const target = document.getElementById(id);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // En una app real, actualizar el estado activo aquí o con intersection observer
              }
            }}
          />
        ))}
      </nav>
    </>
  );
}
