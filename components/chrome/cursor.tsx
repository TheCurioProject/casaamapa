'use client';
import { useEffect, useState, useRef } from 'react';

export function Cursor() {
  const [isVisible, setIsVisible] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    
    setIsVisible(true);

    let rafId: number;
    let targetX = -100;
    let targetY = -100;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      
      const target = e.target as HTMLElement;
      const isHovering = !!target.closest('a, button, [data-magnetic]') || 
                         target.tagName.toLowerCase() === 'input';
      
      if (dotRef.current) {
        if (isHovering) {
          dotRef.current.className = 'w-[8px] h-[8px] rounded-full transition-all duration-300 scale-[2.5] bg-[var(--color-rose-1)] opacity-70';
        } else {
          dotRef.current.className = 'w-[8px] h-[8px] rounded-full transition-all duration-300 scale-100 bg-[var(--color-rose-3)]';
        }
      }
    };

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${targetX}px, ${targetY}px) translateZ(0)`; // translateZ(0) forces GPU
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
        className="w-[8px] h-[8px] rounded-full transition-all duration-300 scale-100 bg-[var(--color-rose-3)]"
        style={{ transform: 'translate(-100px, -100px) translateZ(0)' }}
      />
    </div>
  );
}
