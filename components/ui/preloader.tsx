'use client';
import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function Preloader() {
  const [isUnmounted, setIsUnmounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    const isMobile = window.innerWidth < 768;
    const initialPath = `M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z`;
    const targetPath = isMobile ? `M 0 0 L 100 0 L 100 0 Q 50 8 0 0 Z` : `M 0 0 L 100 0 L 100 0 Q 50 20 0 0 Z`;
    const finalPath = `M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z`;

    const tl = gsap.timeline();

    // 1. Arch vector draw (using stroke-dashoffset trick)
    const archPath = document.querySelector('.preloader-arch path') as SVGPathElement;
    if (archPath) {
      const length = archPath.getTotalLength();
      gsap.set(archPath, { strokeDasharray: length, strokeDashoffset: length });
      tl.to(archPath, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0.2);
    }

    // 2. Brand text fade in
    tl.fromTo('.preloader-text',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8 },
      0.6
    );

    // 3. Progress line
    tl.fromTo('.preloader-line-container',
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      1.2
    );
    tl.fromTo('.preloader-line',
      { width: "0%" },
      { width: "100%", duration: 1.0, ease: "power2.inOut" },
      1.2
    );

    // After 2.4s, start the exit
    tl.to('.preloader-content', { opacity: 0, y: -30, duration: 0.6, ease: "power2.out" }, 2.4);

    // Exit SVG morph (Framer motion easing [0.85, 0, 0.15, 1] is similar to power3.inOut or CustomEase, we'll split into power2.in and power2.out)
    tl.to('.preloader-svg-path', {
      attr: { d: targetPath },
      duration: 0.7,
      ease: "power2.in"
    }, 2.4);
    
    tl.to('.preloader-svg-path', {
      attr: { d: finalPath },
      duration: 0.7,
      ease: "power2.out",
      onComplete: () => setIsUnmounted(true)
    }, 3.1);

  }, { scope: containerRef });

  if (isUnmounted) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
    >
      <svg 
        className="absolute inset-0 w-full h-full will-change-transform" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <path 
          className="preloader-svg-path"
          fill="var(--color-rose-3)"
          d="M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z"
        />
      </svg>

      <div className="preloader-content relative z-10 flex flex-col items-center justify-center text-white will-change-transform">
        <svg 
          className="preloader-arch w-16 h-20 mb-6 stroke-white stroke-[2px] fill-none overflow-visible" 
          viewBox="0 0 100 120"
        >
          <path d="M 20 120 L 20 50 A 30 30 0 0 1 80 50 L 80 120" />
        </svg>

        <h2 className="preloader-text font-display text-4xl md:text-5xl tracking-wide mb-6 opacity-0 will-change-transform">
          Casa Amapa
        </h2>

        <div className="preloader-line-container w-[120px] h-[2px] bg-white/20 rounded-full overflow-hidden relative opacity-0">
          <div className="preloader-line absolute top-0 left-0 bottom-0 bg-white w-0" />
        </div>
      </div>
    </div>
  );
}
