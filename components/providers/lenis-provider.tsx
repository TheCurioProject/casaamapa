'use client';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis
    const lenis = new Lenis({
      lerp: 0.09, // Similar to desktop mode in original prototype
      smoothWheel: true,
      touchMultiplier: 1.3,
    });
    lenisRef.current = lenis;

    // Synchronize Lenis scrolling with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const handleBookingClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-open-booking]');
      if (target) {
        e.preventDefault();
        import('@/lib/store').then(({ useBookingStore }) => {
          useBookingStore.getState().openBooking();
        });
      }
    };

    document.addEventListener('click', handleBookingClick);

    // Theme logic on scroll (Intersection Observer)
    const sections = document.querySelectorAll('section[data-theme], footer[data-theme]');
    const themeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Trigger theme change when the section hits the middle part of the screen
        if (entry.isIntersecting) {
          const theme = entry.target.getAttribute('data-theme');
          if (theme) {
            document.body.setAttribute('data-theme', theme);
          }
        }
      });
    }, { rootMargin: "-30% 0px -30% 0px" }); // Use rootMargin instead of threshold for very tall/pinned sections

    sections.forEach(sec => themeObserver.observe(sec));

    return () => {
      // Cleanup
      themeObserver.disconnect();
      document.removeEventListener('click', handleBookingClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
