'use client';
import { useEffect, useState, useRef } from 'react';

export function Cursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    
    setIsVisible(true);

    let rafId: number;
    let currentX = -100;
    let currentY = -100;
    let targetX = -100;
    let targetY = -100;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setPosition({ x: targetX, y: targetY });
      
      const target = e.target as HTMLElement;
      setIsHovering(
        !!target.closest('a, button, [data-magnetic]') || 
        target.tagName.toLowerCase() === 'input'
      );
    };

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${targetX}px, ${targetY}px)`;
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
      ref={dotRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none -ml-[4px] -mt-[4px]"
    >
      <div 
        className={`w-[8px] h-[8px] rounded-full transition-all duration-300 ${isHovering ? 'scale-[2.5] bg-[var(--color-rose-1)] opacity-70' : 'scale-100 bg-[var(--color-rose-3)]'}`}
      />
    </div>
  );
}
