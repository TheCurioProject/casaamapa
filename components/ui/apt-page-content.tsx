'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { VirtualTour } from '@/components/ui/virtual-tour';
import { Users, BedDouble, Square, Bath, Wifi, Calendar as CalendarIcon, Utensils, ArrowRightLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { es } from 'date-fns/locale';
import { getApartmentBookings } from '@/app/actions/bookings';
import { useBookingStore } from '@/lib/store';
import { AptData } from '@/components/ui/apt-modal';

const DayPicker = dynamic(
  () => import('react-day-picker').then(mod => mod.DayPicker),
  { ssr: false, loading: () => <div className="h-[300px] w-full flex justify-center items-center"><div className="w-8 h-8 border-2 border-[var(--color-rose-3)] border-t-transparent rounded-full animate-spin" /></div> }
);

export function AptPageContent({ apt }: { apt: AptData }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [cleaningDates, setCleaningDates] = useState<Date[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      setIsLoadingBookings(true);
      try {
        const res = await getApartmentBookings(apt.name.toLowerCase());
        if (res && res.bookings) {
          const booked: Date[] = [];
          const cleaning: Date[] = [];

          res.bookings.forEach((booking: any) => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            checkIn.setHours(12, 0, 0, 0);
            checkOut.setHours(12, 0, 0, 0);

            let current = new Date(checkIn);
            while (current < checkOut) {
              booked.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
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
  }, [apt.name]);

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
    <div
      ref={containerRef}
      className="bg-[var(--color-ink)] text-[var(--color-cream)] min-h-screen pt-32 pb-24 px-6 md:px-12 flex justify-center"
    >
      <div className="w-full max-w-5xl">
        <div className="mt-8 md:mt-16 mb-16 text-center md:text-left">
          <span className="font-display text-[var(--color-rose-3)] tracking-widest uppercase text-base md:text-lg block mb-4">
            Departamento {apt.num}
          </span>
          <h1 className="font-display text-6xl md:text-8xl mb-2">{apt.name}</h1>
          <p className="font-display italic text-3xl md:text-4xl text-[var(--color-rose-3)]">{apt.tag}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 mb-20">
          <div>
            <p className="text-xl md:text-2xl leading-relaxed opacity-80">{apt.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-4">
            {apt.specs.map((spec, i) => (
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

        <div className="mb-24 relative">
          <div className="flex items-center justify-center md:justify-between mb-2 md:mb-8 border-b-0 md:border-b border-white/10 pb-0 md:pb-4">
            <h2 className="font-display text-4xl md:text-5xl text-center md:text-left w-full md:w-auto">Recorrido Virtual</h2>
          </div>
          <div className="-mx-6 md:mx-0 w-[calc(100%+3rem)] md:w-full">
            <VirtualTour aptId={apt.name.toLowerCase()} />
          </div>
        </div>

        <div className="bg-white/5 rounded-[2rem] p-4 sm:p-6 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-white/10">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start justify-between">
            <div className="max-w-sm text-center md:text-left">
              <CalendarIcon className="w-8 h-8 text-[var(--color-rose-3)] mb-6 mx-auto md:mx-0" />
              <h3 className="font-display text-5xl mb-4">Disponibilidad</h3>
              <p className="text-lg opacity-70 mb-4">
                Selecciona tus fechas para verificar la disponibilidad en este refugio.
              </p>

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
                  useBookingStore.getState().openBooking(apt.name.toLowerCase());
                }}
                className="bg-[var(--color-cream)] text-[var(--color-ink)] px-8 py-4 rounded-full uppercase tracking-widest text-sm hover:bg-[var(--color-rose-1)] transition-colors w-full md:w-auto font-bold"
              >
                Solicitar Reserva
              </button>
            </div>

            <div className="calendar-wrapper relative w-full md:w-auto flex justify-center overflow-hidden md:overflow-visible">
              {isLoadingBookings && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-ink)]/50 backdrop-blur-sm rounded-3xl">
                  <div className="w-8 h-8 border-2 border-[var(--color-rose-3)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="flex flex-col items-center w-full max-w-full overflow-x-auto pb-4 md:pb-0">
                <DayPicker
                  modifiers={{ booked: bookedDates, cleaning: cleaningDates }}
                  modifiersClassNames={{ booked: 'rdp-day_booked', cleaning: 'rdp-day_cleaning' }}
                  disabled={(date) => {
                    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                    const today = new Date();
                    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                    if (d < t) return true;
                    return [...bookedDates, ...cleaningDates].some(bd =>
                      new Date(bd.getFullYear(), bd.getMonth(), bd.getDate()).getTime() === d
                    );
                  }}
                  className="font-sans custom-neumorphic-calendar dark-theme-calendar read-only-calendar !m-0"
                  locale={es}
                />

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
    </div>
  );
}
