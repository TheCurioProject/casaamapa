'use client';
import { useState, useEffect } from 'react';

export function useDevice() {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true, // Default to desktop for SSR
    isHydrated: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isHydrated: true,
      });
    };

    handleResize(); // Initial check on mount

    // We don't necessarily need to listen to resize if we only care about initial load for physics,
    // but it's safe to have it for orientation changes.
    // Throttling isn't strictly necessary here since it's just checking width.
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return device;
}
