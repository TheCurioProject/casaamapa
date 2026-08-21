'use client';
import Image from 'next/image';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Parallax effect using GSAP ScrollTrigger
    gsap.to('.hero-img-inner', {
      y: "30%",
      ease: "none",
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Content scrolls up and fades out
    gsap.to('.hero-content-wrapper', {
      y: "-30%",
      ease: "none",
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
    
    gsap.to('.hero-content-wrapper', {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "50% top",
        scrub: true
      }
    });

    // Background breathing effect
    gsap.to('.hero-bg-scale', {
      scale: 1.05,
      duration: 10, // 20s for full cycle, so 10s up, 10s down
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1
    });

    // Entrance animation timeline
    const tl = gsap.timeline({ delay: 2.6 });
    
    // Draw SVG path (starts at 2.8s)
    const archPath = document.querySelector('.hero-arc path') as SVGPathElement;
    if (archPath) {
      const length = archPath.getTotalLength();
      gsap.set(archPath, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(archPath, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", delay: 0.2 });
    }

    // Stagger text items
    tl.fromTo('.hero-text-item', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", stagger: 0.15 }
    );

  }, { scope: container });

  return (
    <section ref={container} className="relative h-[calc(100svh+var(--spacing-overlap))] overflow-hidden bg-[var(--color-ink)]" id="llegada" data-theme="dark" style={{ zIndex: 1 }}>
      
      {/* Background breathing & parallax (Image always there) */}
      <div className="hero-bg-scale absolute inset-0 will-change-transform" style={{ transform: 'translateZ(0)' }}>
        <div className="hero-img-inner absolute inset-0 will-change-transform" style={{ transform: 'translateZ(0)' }}>
          <Image 
            src="/images/hero.webp" 
            alt="Fachada rosa de Casa Amapa con escalera caracol"
            fill
            sizes="100vw"
            className="h-[108%] object-cover object-[50%_42%] max-md:hidden"
            priority
          />
          <Image 
            src="/images/mobile-hero.webp" 
            alt="Fachada rosa de Casa Amapa con escalera caracol"
            fill
            sizes="100vw"
            className="h-[108%] object-cover object-[50%_90%] md:hidden"
            priority
          />
        </div>
      </div>
      
      <div className="absolute inset-0 z-2 bg-gradient-to-t from-[rgba(61,36,56,0.52)] to-transparent to-48% pointer-events-none" />
      
      {/* Content wrapper with staggering */}
      <div className="hero-content-wrapper absolute z-4 left-[var(--spacing-pad-x)] right-[var(--spacing-pad-x)] bottom-[calc(22vh+var(--spacing-overlap))] max-md:bottom-[calc(20vh+var(--spacing-overlap))] flex flex-col gap-[2vh] items-start will-change-transform" style={{ transform: 'translateZ(0)' }}>
        
        <svg className="hero-text-item w-[min(300px,56vw)] stroke-[var(--color-sand)] fill-none stroke-[1.5] opacity-90 [stroke-linecap:round] hero-arc opacity-0" viewBox="0 0 320 60" aria-hidden="true" style={{ transform: 'translateZ(0)' }}>
          <path d="M4 56 C 90 6, 230 6, 316 56" />
        </svg>
        
        <p className="hero-text-item text-[var(--color-sand)] tracking-[0.42em] max-md:tracking-[0.3em] text-[11px] uppercase opacity-0" style={{ transform: 'translateZ(0)' }}>
          Playa Chacala · Nayarit · México
        </p>
        
        <h1 className="hero-text-item text-[var(--color-cream)] text-[clamp(3.4rem,10.5vw,9.5rem)] max-md:text-[clamp(2.7rem,13.5vw,4.8rem)] overflow-hidden font-display opacity-0" style={{ transform: 'translateZ(0)' }}>
          Casa Amapa
        </h1>
        
        <p className="hero-text-item text-[var(--color-sand)] text-[clamp(0.95rem,1.3vw,1.15rem)] opacity-92 max-w-[40ch] opacity-0" style={{ transform: 'translateZ(0)' }}>
          Una casa que ya te estaba esperando.
        </p>
      </div>
      
    </section>
  );
}
