'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { X, ChevronLeft, ChevronRight, Users, BedDouble, Square, Bath, Wifi, Calendar as CalendarIcon, Utensils, ArrowRightLeft } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { es } from 'date-fns/locale';

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

export function AptModal({ apt, isOpen, onClose }: AptModalProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'center',
    dragFree: true
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Persist apt data for exit animation
  const [localApt, setLocalApt] = useState(apt);
  useEffect(() => {
    if (apt) setLocalApt(apt);
  }, [apt]);

  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Lock body scroll when open and handle mounting
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
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
    }
  }, [isOpen]);

  if (!mounted || !localApt) return null;


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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-[var(--color-ink)]/60 backdrop-blur-sm p-0 md:p-6"
        >
          <motion.div
            ref={containerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-[var(--color-sand)] text-[var(--color-ink)] w-full h-[95vh] md:h-auto md:max-h-[90vh] md:max-w-5xl rounded-t-[32px] md:rounded-3xl overflow-y-auto relative flex flex-col shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overscroll-contain"
          >
            {/* Custom Animated Scrollbar */}
            <motion.div
              style={{ scaleY }}
              className="hidden md:block absolute top-4 right-2 bottom-4 w-2 bg-[var(--color-rose-3)] origin-top z-50 rounded-full opacity-80"
            />

            {/* Header & Close Button */}
            <div className="sticky top-0 z-10 flex flex-col bg-gradient-to-b from-[var(--color-sand)] via-[var(--color-sand)] to-transparent pb-4 pt-2 md:pt-0 md:pb-0">
              {/* Drag Handle for Mobile */}
              <div className="w-full flex justify-center pt-2 pb-1 md:hidden">
                <div className="w-12 h-1.5 bg-[rgba(94,58,80,0.2)] rounded-full" />
              </div>
              <div className="flex justify-between items-center px-6 md:p-6">
                <span className="font-display text-[var(--color-rose-3)] tracking-widest uppercase text-sm">
                  Departamento {localApt.num}
                </span>
                <button 
                  onClick={onClose}
                  className="p-3 bg-[var(--color-sand)] rounded-full hover:bg-[var(--color-cream)] transition-colors shadow-sm border border-[rgba(94,58,80,0.1)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 md:px-12 pb-24">
              {/* Title Section */}
              <div className="mt-4 mb-16 text-center md:text-left">
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

              {/* Carousel Section */}
              <div className="mb-24 relative">
                <div className="flex items-center justify-between mb-8 border-b border-[rgba(94,58,80,0.1)] pb-4">
                  <h3 className="font-display text-4xl md:text-5xl">Galería</h3>
                  {/* Navigation Arrows (Desktop) */}
                  <div className="hidden md:flex gap-3">
                    <button 
                      onClick={scrollPrev}
                      className="p-3 rounded-full border border-[rgba(94,58,80,0.2)] hover:bg-[rgba(94,58,80,0.05)] transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={scrollNext}
                      className="p-3 rounded-full border border-[rgba(94,58,80,0.2)] hover:bg-[rgba(94,58,80,0.05)] transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-4 md:gap-6 touch-pan-y">
                    {/* Combine main image and cards for gallery */}
                    {[
                      { img: localApt.imgMain, c: 'Vista Principal' },
                      ...localApt.cards
                    ].map((item, index) => (
                      <div key={index} className="flex-[0_0_85%] md:flex-[0_0_60%] min-w-0 relative aspect-[16/10] rounded-2xl overflow-hidden group">
                        <Image
                          src={item.img}
                          alt={item.c}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-[var(--color-cream)] text-base tracking-widest uppercase">{item.c}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aesthetic Calendar Section */}
              <div className="bg-[var(--color-cream)] rounded-[2rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(94,58,80,0.05)]">
                <div className="flex flex-col md:flex-row gap-12 items-center md:items-start justify-between">
                  <div className="max-w-sm text-center md:text-left">
                    <CalendarIcon className="w-8 h-8 text-[var(--color-rose-3)] mb-6 mx-auto md:mx-0" />
                    <h3 className="font-display text-5xl mb-4">Disponibilidad</h3>
                    <p className="text-lg opacity-70 mb-8">
                      Selecciona tus fechas para verificar la disponibilidad en este refugio. Por el momento es una vista previa estética.
                    </p>
                    <button className="bg-[var(--color-ink)] text-[var(--color-sand)] px-8 py-4 rounded-full uppercase tracking-widest text-sm hover:bg-black transition-colors w-full md:w-auto">
                      Solicitar Reserva
                    </button>
                  </div>
                  
                  <div className="calendar-wrapper">
                    <DayPicker
                      mode="single"
                      locale={es}
                      disabled={[
                        new Date(new Date().setDate(new Date().getDate() + 2)),
                        new Date(new Date().setDate(new Date().getDate() + 3)),
                        new Date(new Date().setDate(new Date().getDate() + 5)),
                      ]}
                      modifiers={{
                        booked: [
                          new Date(new Date().setDate(new Date().getDate() + 2)),
                          new Date(new Date().setDate(new Date().getDate() + 3)),
                          new Date(new Date().setDate(new Date().getDate() + 5)),
                        ]
                      }}
                      modifiersStyles={{
                        booked: { textDecoration: 'line-through', opacity: 0.5 }
                      }}
                      className="font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
