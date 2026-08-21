'use client';
import { useEffect, useState, useRef } from 'react';

export function Cursor() {
  const [isVisible, setIsVisible] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on non-touch, non-reduced-motion devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    setIsVisible(true);

    let rafId: number;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    const LERP = 0.15; // Smooth trailing factor — lower = more lag, higher = snappier

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      
      const target = e.target as HTMLElement;
      const isHovering = !!target.closest('a, button, [data-magnetic]') || 
                         target.tagName.toLowerCase() === 'input';
      
      if (dotRef.current) {
        if (isHovering) {
          dotRef.current.className = 'w-[8px] h-[8px] rounded-full transition-[background-color,transform] duration-300 scale-[2.5] bg-[var(--color-rose-1)] opacity-70';
        } else {
          dotRef.current.className = 'w-[8px] h-[8px] rounded-full transition-[background-color,transform] duration-300 scale-100 bg-[var(--color-rose-3)]';
        }
      }
    };

    const animate = () => {
      // Lerp interpolation for smooth trailing
      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-0 left-0 z-[9999] pointer-events-none -ml-[4px] -mt-[4px] will-change-transform"
    >
      <div 
        ref={dotRef}
        className="w-[8px] h-[8px] rounded-full transition-[background-color,transform] duration-300 scale-100 bg-[var(--color-rose-3)]"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />
    </div>
  );
}
