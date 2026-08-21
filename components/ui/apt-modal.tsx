'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { VirtualTour } from '@/components/ui/virtual-tour';
import { X, ChevronLeft, ChevronRight, Users, BedDouble, Square, Bath, Wifi, Calendar as CalendarIcon, Utensils, ArrowRightLeft } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { es } from 'date-fns/locale';
import { getApartmentBookings } from '@/app/actions/bookings';
import { useBookingStore } from '@/lib/store';

interface AptCard {
  img: string;
  c: string;
}

export interface AptData {
  num: string;
  name: string;
  tag: string;
  desc: string;
  specs: string[];
  imgMain: string;
  cards: AptCard[];
}

interface AptModalProps {
  apt: AptData | null;
  isOpen: boolean;
  onClose: () => void;
}

function AptModalContent({ localApt, onClose }: { localApt: AptData, onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Immersive cinematic effect based on scroll position
  // Widen the ranges slightly to make the transition smoother and more progressive 'frame by frame'
  const backgroundColor = useTransform(
    scrollYProgress, 
    [0.40, 0.55, 0.60, 0.75], 
    ['#F8E8EC', '#42242C', '#42242C', '#F8E8EC']
  );
  const textColor = useTransform(
    scrollYProgress, 
    [0.40, 0.55, 0.60, 0.75], 
    ['#42242C', '#FCF3F6', '#FCF3F6', '#42242C']
  );

  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [cleaningDates, setCleaningDates] = useState<Date[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      setIsLoadingBookings(true);
      try {
        const res = await getApartmentBookings(localApt.name.toLowerCase());
        if (res && res.bookings) {
          const booked: Date[] = [];
          const cleaning: Date[] = [];
          
          res.bookings.forEach((booking: any) => {
            // Aseguramos que se instancien como Date y evitamos problemas de UTC
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            checkIn.setHours(12, 0, 0, 0);
            checkOut.setHours(12, 0, 0, 0);
            
            // Días ocupados: Desde Check-in hasta un día antes del Check-out
            let current = new Date(checkIn);
            while (current < checkOut) {
              booked.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
            
            // Día de limpieza: El día exacto de Check-out (+1)
            cleaning.push(new Date(checkOut));
          });
          
          setBookedDates(booked);
          setCleaningDates(cleaning);
        }
      } catch (err) {
        console.error("Error loading bookings:", err);
      } finally {
        setIsLoadingBookings(false);
      }
    }
    loadBookings();
  }, [localApt.name]);

  // Lock body scroll when open and handle mounting
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const preventDefault = (e: TouchEvent | WheelEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('wheel', preventDefault, { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('wheel', preventDefault);
    };
  }, []);

  // Swipe down to close logic
  const touchState = useRef({ startY: 0, currentY: 0, isDragging: false });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      touchState.current.startY = e.targetTouches[0].clientY;
      touchState.current.isDragging = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.current.isDragging || !containerRef.current) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchState.current.startY;

    if (diff > 0) { // Only pull down
      containerRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchState.current.isDragging || !containerRef.current) return;
    touchState.current.isDragging = false;

    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - touchState.current.startY;

    if (diff > 120) {
      // Threshold met, close modal
      onClose();
    } else {
      // Revert back
      containerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      containerRef.current.style.transform = '';
      setTimeout(() => {
        if (containerRef.current) containerRef.current.style.transition = '';
      }, 300);
    }
  };

  // Icons mapping for specs
  const getIconForSpec = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes('huésped') || s.includes('persona') || s.includes('adulto')) return <Users className="w-5 h-5 opacity-60" />;
    if (s.includes('cama')) return <BedDouble className="w-5 h-5 opacity-60" />;
    if (s.includes('m²')) return <Square className="w-5 h-5 opacity-60" />;
    if (s.includes('baño') || s.includes('alberca') || s.includes('terraza') || s.includes('balcón') || s.includes('patio')) return <Bath className="w-5 h-5 opacity-60" />;
    if (s.includes('cocina')) return <Utensils className="w-5 h-5 opacity-60" />;
    if (s.includes('conect')) return <ArrowRightLeft className="w-5 h-5 opacity-60" />;
    return <Wifi className="w-5 h-5 opacity-60" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-[rgba(20,8,20,0.85)] backdrop-blur-sm p-0 md:p-[var(--spacing-pad-x)]"
    >
      <motion.div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{ backgroundColor, color: textColor }}
        className="w-full h-[85vh] md:h-auto md:max-h-[90vh] md:max-w-5xl rounded-t-[32px] md:rounded-3xl overflow-y-auto relative flex flex-col shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overscroll-contain transform-gpu"
      >
        {/* Custom Animated Scrollbar */}
        <motion.div
          style={{ scaleY }}
          className="hidden md:block absolute top-4 right-2 bottom-4 w-2 bg-[var(--color-rose-3)] origin-top z-50 rounded-full opacity-80"
        />

        {/* Header & Close Button */}
        <div className="sticky top-0 z-10 flex flex-col bg-transparent pb-4 pt-2 md:pt-4 pointer-events-none">
          {/* Drag Handle for Mobile */}
          <div className="w-full flex justify-center pt-2 pb-2 md:hidden pointer-events-auto">
            <div className="w-12 h-1.5 bg-[rgba(94,58,80,0.2)] rounded-full" />
          </div>
          
          <div className="flex justify-end items-start px-4 md:px-6 pointer-events-auto w-full">
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="group flex items-center hover:opacity-70 transition-opacity p-2 -m-2"
            >
              <span className="font-sans text-[0.65rem] md:text-xs tracking-[0.2em] uppercase font-semibold drop-shadow-sm mr-2">Cerrar</span>
              <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </motion.div>
            </button>
          </div>
        </div>

        <div className="px-6 md:px-12 pb-24">
          {/* Title Section */}
          <div className="mt-4 mb-16 text-center md:text-left">
            <span className="font-display text-[var(--color-rose-3)] tracking-widest uppercase text-base md:text-lg block mb-4">
              Departamento {localApt.num}
            </span>
            <h2 className="font-display text-6xl md:text-8xl mb-2">{localApt.name}</h2>
            <p className="font-display italic text-3xl md:text-4xl text-[var(--color-rose-3)]">{localApt.tag}</p>
          </div>

          {/* Description & Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 mb-20">
            <div>
              <p className="text-xl md:text-2xl leading-relaxed opacity-80">{localApt.desc}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-4">
              {localApt.specs.map((spec, i) => (
                <div key={i} className="flex flex-col items-start gap-1">
                  {getIconForSpec(spec)}
                  <span className="text-[0.95rem] md:text-base tracking-wider uppercase opacity-80">{spec}</span>
                </div>
              ))}
              <div className="flex flex-col items-start gap-1">
                <Wifi className="w-5 h-5 opacity-60" />
                <span className="text-[0.95rem] md:text-base tracking-wider uppercase opacity-80">Wi-Fi Alta Velocidad</span>
              </div>
            </div>
          </div>

          {/* Virtual Tour Section */}
          <div className="mb-24 relative">
            <div className="flex items-center justify-center md:justify-between mb-2 md:mb-8 border-b-0 md:border-b border-[rgba(94,58,80,0.1)] pb-0 md:pb-4">
              <h3 className="font-display text-4xl md:text-5xl text-center md:text-left w-full md:w-auto">Recorrido Virtual</h3>
            </div>
            
            <div className="-mx-6 md:mx-0 w-[calc(100%+3rem)] md:w-full">
              <VirtualTour aptId={localApt.name.toLowerCase()} />
            </div>
          </div>

          {/* Aesthetic Calendar Section */}
          <div className="bg-white/10 rounded-[2rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-white/5">
            <div className="flex flex-col md:flex-row gap-12 items-center md:items-start justify-between">
              <div className="max-w-sm text-center md:text-left">
                <CalendarIcon className="w-8 h-8 text-[var(--color-rose-3)] mb-6 mx-auto md:mx-0" />
                <h3 className="font-display text-5xl mb-4">Disponibilidad</h3>
                <p className="text-lg opacity-70 mb-4">
                  Selecciona tus fechas para verificar la disponibilidad en este refugio.
                </p>
                
                {/* Leyenda de Colores */}
                <div className="flex flex-col gap-2 mb-8 items-center md:items-start text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-md bg-[var(--color-coral)]" />
                    <span className="opacity-80">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-md bg-[var(--color-rose-2)]" />
                    <span className="opacity-80">Día de Limpieza</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    useBookingStore.getState().openBooking(localApt.name.toLowerCase());
                  }}
                  className="bg-[var(--color-ink)] text-[var(--color-sand)] px-8 py-4 rounded-full uppercase tracking-widest text-sm hover:bg-black transition-colors w-full md:w-auto"
                >
                  Solicitar Reserva
                </button>
              </div>
              
              <div className="calendar-wrapper relative w-full md:w-auto flex justify-center overflow-hidden md:overflow-visible">
                {isLoadingBookings && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-sand)]/50 backdrop-blur-sm rounded-3xl">
                    <div className="w-8 h-8 border-2 border-[var(--color-rose-3)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="flex flex-col items-center w-full max-w-full overflow-x-auto pb-4 md:pb-0">
                  <DayPicker
                    modifiers={{ booked: bookedDates, cleaning: cleaningDates }}
                    modifiersClassNames={{ booked: 'rdp-day_booked', cleaning: 'rdp-day_cleaning' }}
                    disabled={[{ before: new Date() }, ...bookedDates, ...cleaningDates]}
                    className="font-sans custom-neumorphic-calendar !m-0"
                    locale={es}
                  />
                  
                  {/* Leyenda del calendario */}
                  <div className="flex justify-center gap-4 mt-6 text-[0.65rem] uppercase tracking-widest font-semibold opacity-70 flex-wrap w-full px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[var(--color-coral)] block shadow-sm"></span>
                      <span>Ocupado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[var(--color-rose-2)] block shadow-sm"></span>
                      <span>Limpieza</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-white/20 block shadow-sm"></span>
                      <span>Disponible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AptModal({ apt, isOpen, onClose }: AptModalProps) {
  const [mounted, setMounted] = useState(false);
  const [localApt, setLocalApt] = useState(apt);
  
  // Persist apt data for exit animation
  useEffect(() => {
    if (apt) setLocalApt(apt);
  }, [apt]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !localApt) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && <AptModalContent localApt={localApt} onClose={onClose} />}
    </AnimatePresence>,
    document.body
  );
}
