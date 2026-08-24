'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useBookingStore } from '@/lib/store';
import { useLoaderStore } from '@/store/useLoaderStore';
import { createPendingBooking, getApartmentBookings, getUnits } from '@/app/actions/bookings';
import dynamic from 'next/dynamic';
import { es } from 'date-fns/locale';
import { differenceInDays, isWithinInterval, parseISO, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import { createPaymentIntent } from '@/app/actions/payments';
import type { DateRange } from 'react-day-picker';

interface BookingUnit {
  id: string;
  name: string;
  price: number;
}

interface BookingDateInfo {
  checkIn: Date;
  checkOut: Date;
}

// Lazy load heavy components
const DayPicker = dynamic(() => import('react-day-picker').then(mod => mod.DayPicker), { ssr: false, loading: () => <div className="h-[300px] w-full flex justify-center items-center"><div className="w-8 h-8 border-2 border-[var(--color-rose-3)] border-t-transparent rounded-full animate-spin" /></div> });
const StripePayment = dynamic(() => import('./stripe-payment').then(mod => mod.StripePayment), { ssr: false, loading: () => <div className="h-[200px] w-full flex justify-center items-center"><div className="w-8 h-8 border-2 border-[var(--color-rose-3)] border-t-transparent rounded-full animate-spin" /></div> });

const LADAS = [
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+1', country: 'EE. UU. / Canadá', flag: '🇺🇸' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+49', country: 'Alemania', flag: '🇩🇪' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
];

export function BookingModal() {
  const { isOpen, closeBooking, preselectedUnit } = useBookingStore();
  const { showLoader, hideLoader } = useLoaderStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  // State
  const [step, setStep] = useState(1);
  const [units, setUnits] = useState<BookingUnit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  // Selections
  const [selectedUnit, setSelectedUnit] = useState<BookingUnit | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [cleaningDates, setCleaningDates] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [datesError, setDatesError] = useState<string | null>(null);

  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [lada, setLada] = useState(LADAS[0]);
  const [showLadaMenu, setShowLadaMenu] = useState(false);

  // Payment state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [chargeAmount, setChargeAmount] = useState(0);

  // GSAP logic for modal open/close (kept to maintain current behavior)
  const { contextSafe } = useGSAP({ scope: overlayRef });

  const toggleModal = contextSafe((open: boolean) => {
    if (open) {
      document.body.classList.add('modal-open');
      gsap.set(overlayRef.current, { display: 'flex' });
      gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.4 });
      if (scrollContainerRef.current) {
        gsap.fromTo(scrollContainerRef.current, { y: '100%' }, { y: 0, duration: 0.5, ease: 'power3.out' });
      }
    } else {
      if (!useBookingStore.getState().isAptModalOpen) {
        document.body.classList.remove('modal-open');
      }
      if (scrollContainerRef.current) {
        gsap.to(scrollContainerRef.current, { y: '100%', duration: 0.4, ease: 'power3.in' });
      }
      gsap.to(overlayRef.current, {
        autoAlpha: 0, duration: 0.4, delay: 0.1, onComplete: () => {
          gsap.set(overlayRef.current, { display: 'none' });
          // Reset state after close
          setTimeout(() => {
            setStep(1);
            setSelectedUnit(null);
            setRange(undefined);
            setGuestName('');
            setGuestEmail('');
            setGuestPhone('');
            setError('');
            setUnitsError(null);
            setDatesError(null);
            setSuccess(false);
            setBookingId('');
            setClientSecret('');
          }, 300);
        }
      });
    }
  });

  // Comprehensive scroll lock for mobile/iOS
  useEffect(() => {
    if (!isOpen) return;
    
    const preventDefault = (e: TouchEvent | WheelEvent) => {
      if (scrollContainerRef.current && scrollContainerRef.current.contains(e.target as Node)) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('wheel', preventDefault, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('wheel', preventDefault);
    };
  }, [isOpen]);

  useEffect(() => {
    toggleModal(isOpen);
    if (isOpen && units.length === 0) {
      setIsLoadingUnits(true);
      setUnitsError(null);
      showLoader();
      getUnits().then(res => {
        if (res && res.units) {
          setUnits(res.units);
        } else if (res && res.error) {
          setUnitsError(res.error);
        }
      }).catch(err => {
        console.error("Failed to load units", err);
        setUnitsError(err instanceof Error ? err.message : String(err));
      }).finally(() => {
        setIsLoadingUnits(false);
        hideLoader();
      });
    }
  }, [isOpen]);

  const hasAutoAdvanced = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasAutoAdvanced.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && preselectedUnit && units.length > 0 && step === 1 && !hasAutoAdvanced.current) {
      const unit = units.find(u => u.name.toLowerCase() === preselectedUnit.toLowerCase());
      if (unit) {
        setSelectedUnit(unit);
        setStep(2);
        hasAutoAdvanced.current = true;
      }
    }
  }, [isOpen, preselectedUnit, units, step]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  useEffect(() => {
    if (step === 2 && selectedUnit) {
      setIsLoadingDates(true);
      showLoader();
      getApartmentBookings(selectedUnit.id)
        .then(res => {
          if (res && res.bookings) {
            const booked: Date[] = [];
            const cleaning: Date[] = [];
            res.bookings.forEach((b: BookingDateInfo) => {
              const checkIn = new Date(b.checkIn);
              const checkOut = new Date(b.checkOut);
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
        })
        .catch(err => {
          console.error("Failed to load dates", err);
        })
        .finally(() => {
          setIsLoadingDates(false);
          hideLoader();
        });
    }
  }, [step, selectedUnit]);

  // Derived state
  const nights = range?.to && range?.from ? Math.max(1, differenceInDays(range.to, range.from)) : (range?.from ? 1 : 0);
  const totalPrice = selectedUnit ? nights * selectedUnit.price : 0;

  const getSmartHint = () => {
    if (!range?.from) return { text: "Selecciona tu fecha de llegada", status: "pending" };
    if (range.from && !range.to) return { text: "1 noche seleccionada. Selecciona salida o continúa.", status: "partial" };
    return { text: `${nights} noche${nights > 1 ? 's' : ''} seleccionada${nights > 1 ? 's' : ''}.`, status: "complete" };
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    setError('');

    if (!range?.from) {
      setError('Por favor selecciona las fechas');
      setLoading(false);
      return;
    }

    const checkOutDate = range.to || new Date(range.from.getTime() + 24 * 60 * 60 * 1000); // Check out next day if 1 night selected

    const res = await createPendingBooking({
      apartmentId: selectedUnit!.id,
      checkIn: range.from,
      checkOut: checkOutDate,
      guestName,
      guestEmail,
      guestPhone: `${lada.code} ${guestPhone}`,
      guests: 2, // Or make dynamic if needed
      totalPrice
    });

    if (res.error || !res.booking?.id) {
      setError(res.error || 'Error creando reservación');
      setLoading(false);
      return;
    }

    setBookingId(res.booking.id);

    // Initialize Payment Intent
    const payment = await createPaymentIntent(totalPrice, 'mxn', res.booking.id);

    if (payment.error || !payment.clientSecret) {
      setError(payment.error || 'Error iniciando el pago');
      setLoading(false);
      return;
    }

    setClientSecret(payment.clientSecret);
    setChargeAmount(payment.chargeAmount || 0);
    setLoading(false);
    setStep(4);
  };

  // Animation variants
  const variants = {
    initial: { opacity: 0, x: 20, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
    exit: { opacity: 0, x: -20, scale: 0.98, transition: { duration: 0.3 } }
  };

  const smartHint = getSmartHint();

  // Swipe down to close logic
  const touchState = useRef({ startY: 0, currentY: 0, isDragging: false });

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start dragging if at the top of the scroll container
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 0) {
      touchState.current.startY = e.targetTouches[0].clientY;
      touchState.current.isDragging = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.current.isDragging || !scrollContainerRef.current) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchState.current.startY;

    if (diff > 0) { // Only pull down
      gsap.set(scrollContainerRef.current, { y: diff, ease: 'none' });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchState.current.isDragging || !scrollContainerRef.current) return;
    touchState.current.isDragging = false;

    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - touchState.current.startY;

    if (diff > 120) {
      // Threshold met, close modal
      closeBooking();
      // Reset Y transform after modal animation finishes
      setTimeout(() => {
        if (scrollContainerRef.current) gsap.set(scrollContainerRef.current, { y: 0 });
      }, 400);
    } else {
      // Revert back
      gsap.to(scrollContainerRef.current, { y: 0, duration: 0.3, ease: 'power2.out' });
    }
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[10000] bg-[rgba(20,8,20,0.85)] hidden place-items-end md:place-items-center md:p-[var(--spacing-pad-x)] backdrop-blur-sm" data-theme="dark" role="dialog" aria-modal="true" aria-label="Reservar en Casa Amapa">
      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-[var(--color-cream)] w-full h-[85vh] md:h-auto md:max-h-[90vh] md:max-w-[550px] rounded-[32px_32px_0_0] md:rounded-[32px] p-[clamp(2rem,6vw,3.5rem)] pt-6 shadow-2xl relative text-[var(--color-ink)] flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transform-gpu"
      >

        {/* Drag handle pill (Mobile only) */}
        <div className="w-12 h-1.5 bg-[rgba(94,58,80,0.15)] rounded-full mx-auto mb-6 shrink-0 md:hidden" />

        {/* Header Bar */}
        <div className="flex justify-between items-center mb-8 shrink-0">
          {step > 1 && !success ? (
            <button onClick={() => setStep(step - 1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(94,58,80,0.06)] hover:bg-[rgba(94,58,80,0.12)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-10 h-10" />}

          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-[var(--color-rose-3)]' : step > s ? 'w-4 bg-[var(--color-rose-3)] opacity-40' : 'w-4 bg-[rgba(94,58,80,0.1)]'}`} />
            ))}
          </div>

          <button onClick={closeBooking} className="w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(94,58,80,0.06)] hover:bg-[rgba(94,58,80,0.12)] transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 relative" aria-live="polite" aria-atomic="true" role="status">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center py-12 flex flex-col items-center">
                <CheckCircle2 className="w-20 h-20 text-[var(--color-rose-3)] mb-6" />
                <h2 className="font-sans font-bold text-[2.5rem] mb-4 text-[var(--color-rose-3)] leading-none">¡Reserva confirmada!</h2>
                <p className="opacity-80 mb-10 text-lg">Hemos enviado los detalles a tu correo electrónico. Te esperamos en Casa Amapa.</p>
                <button onClick={closeBooking} className="bg-[var(--color-ink)] text-[var(--color-cream)] rounded-full px-8 py-4 text-sm tracking-[0.2em] uppercase w-full">Cerrar y Volver</button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
                <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--color-rose-3)] mb-2 font-semibold">Paso 1 de 4</p>
                <h2 className="font-sans font-bold text-[2.5rem] mb-8 leading-none">Elige tu espacio</h2>

                {isLoadingUnits ? null : units.length > 0 ? (
                  <div className="grid gap-3">
                    {units.map((unit: BookingUnit) => (
                      <button
                        key={unit.id}
                        onClick={() => { setSelectedUnit(unit); setStep(2); }}
                        className="group flex flex-col md:flex-row justify-between items-start md:items-center border border-[rgba(94,58,80,0.15)] rounded-2xl p-5 md:p-6 text-left hover:border-[var(--color-rose-3)] hover:bg-[var(--color-rose-3)]/5 transition-all duration-300 relative overflow-hidden"
                      >
                        <div>
                          <span className="block font-sans font-bold text-2xl md:text-3xl mb-1 capitalize">{unit.name}</span>
                          <span className="block opacity-60 text-sm">{unit.id === 'amapa' ? 'Casa Completa' : 'Departamento'}</span>
                        </div>
                        <div className="mt-3 md:mt-0 md:text-right">
                          <span className="block font-sans font-bold text-xl md:text-2xl text-[var(--color-rose-3)] group-hover:scale-105 transition-transform origin-right">
                            {unit.price.toLocaleString('es-MX')} MXN
                          </span>
                          <span className="block opacity-50 text-xs tracking-widest uppercase mt-1">Por noche</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 opacity-70 border border-dashed border-[rgba(94,58,80,0.3)] rounded-2xl flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 opacity-50 mb-2" />
                    <p>No se pudieron cargar los espacios.</p>
                    {unitsError && (
                      <p className="text-xs font-mono bg-black/5 p-2 rounded-lg mt-2 text-red-600/80 break-words max-w-[90%]">
                        Error: {unitsError}
                      </p>
                    )}
                    <p className="text-sm mt-2">Por favor, recarga la página o intenta de nuevo.</p>
                  </div>
                )}
              </motion.div>
            ) : step === 2 ? (
              <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full pb-8">
                <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--color-rose-3)] mb-2 font-semibold">Paso 2 de 4</p>
                <h2 className="font-sans font-bold text-[2.5rem] mb-2 leading-none">Tus fechas</h2>
                <p className="opacity-70 mb-6">En <strong className="capitalize">{selectedUnit!.name}</strong> ({selectedUnit!.price.toLocaleString()} MXN / noche)</p>

                <div className="flex flex-col justify-center items-center mb-6 relative w-full">
                  {isOpen && !isLoadingDates && (
                    <div className="calendar-wrapper bg-white/40 p-2 md:p-6 rounded-[2rem] shadow-sm border border-[rgba(94,58,80,0.08)] w-full flex flex-col items-center relative">
                      <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={(newRange, selectedDay) => {
                          if (!newRange) {
                            setRange(undefined);
                            return;
                          }
                          // If clicking the same day that is already the 'from' date, set it as a 1-night stay
                          if (range?.from && !range?.to && isSameDay(selectedDay, range.from)) {
                            setRange({ from: range.from, to: range.from });
                          } else {
                            setRange(newRange);
                          }
                        }}
                        modifiers={{
                          booked: bookedDates,
                          cleaning: cleaningDates
                        }}
                        modifiersClassNames={{
                          booked: 'rdp-day_booked',
                          cleaning: 'rdp-day_cleaning'
                        }}
                        disabled={(date) => {
                          const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                          const today = new Date();
                          const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                          if (d < t) return true;
                          
                          const isBooked = bookedDates.some(bd => new Date(bd.getFullYear(), bd.getMonth(), bd.getDate()).getTime() === d);
                          const isCleaning = cleaningDates.some(cd => new Date(cd.getFullYear(), cd.getMonth(), cd.getDate()).getTime() === d);
                          
                          if (isBooked || isCleaning) return true;
                          
                          if (range?.from) {
                            const fromTime = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate()).getTime();
                            if (d <= fromTime) return true; // Cannot check out before or on check-in day (same day handled by onSelect)
                            
                            const nextDisabledDate = [...bookedDates, ...cleaningDates]
                              .map(bd => new Date(bd.getFullYear(), bd.getMonth(), bd.getDate()).getTime())
                              .filter(time => time > fromTime)
                              .sort((a, b) => a - b)[0];
                              
                            if (nextDisabledDate && d > nextDisabledDate) {
                              return true;
                            }
                            return false;
                          }
                          return false;
                        }}
                        className="custom-neumorphic-calendar font-sans !m-0"
                        locale={es}
                      />

                      <AnimatePresence>
                        {range?.from && !range?.to && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-xs text-center w-[90%] md:w-auto shadow-2xl z-10 border border-white/20 pointer-events-none"
                          >
                            <span>Pulsa sobre la <strong>misma fecha</strong> para 1 noche, o selecciona otra para un rango.</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

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
                          <span className="w-3 h-3 rounded-full bg-[var(--color-cream)] border border-[rgba(94,58,80,0.1)] block shadow-sm"></span>
                          <span>Disponible</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Smart Hint & Dynamic Price */}
                <div className="bg-white/60 p-4 rounded-2xl border border-[rgba(94,58,80,0.08)] mb-8 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    {smartHint.status === 'complete' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                    <span className="text-sm font-medium opacity-80">{smartHint.text}</span>
                  </div>
                  {(smartHint.status === 'complete' || smartHint.status === 'partial') && (
                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-[rgba(94,58,80,0.1)]">
                      <span className="text-xs uppercase tracking-widest opacity-60">Total</span>
                      <span className="font-sans font-bold text-2xl text-[var(--color-rose-3)]">{totalPrice.toLocaleString('es-MX')} MXN</span>
                    </div>
                  )}
                </div>

                <button
                  disabled={!range?.from}
                  onClick={() => setStep(3)}
                  className="mt-auto bg-[var(--color-ink)] text-[var(--color-cream)] rounded-full px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium hover:bg-black disabled:opacity-30 disabled:hover:bg-[var(--color-ink)] transition-all flex justify-center w-full shrink-0"
                >
                  Continuar
                </button>
              </motion.div>
            ) : step === 3 ? (
              <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
                <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--color-rose-3)] mb-2 font-semibold">Paso 3 de 4</p>
                <h2 className="font-sans font-bold text-[2.5rem] mb-8 leading-none">Tus datos</h2>

                <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="flex flex-col gap-5 flex-1 pb-8">
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Nombre completo</label>
                    <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Ej. Ana García" className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-white/50 focus:bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Correo electrónico</label>
                    <input type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="tu@correo.com" className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-white/50 focus:bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none" />
                  </div>

                  <div className="relative">
                    <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Teléfono</label>
                    <div className="flex gap-2 relative">
                      <button type="button" onClick={() => setShowLadaMenu(!showLadaMenu)} className="flex items-center gap-1 md:gap-2 border border-[rgba(94,58,80,0.2)] rounded-xl px-2 md:px-3 py-3 bg-white/50 hover:bg-white transition-colors shrink-0">
                        <span>{lada.flag}</span>
                        <span className="text-[0.8rem] md:text-sm font-medium">{lada.code}</span>
                        <ChevronDown className="w-3 h-3 md:w-4 md:h-4 opacity-50 shrink-0" />
                      </button>

                      <AnimatePresence>
                        {showLadaMenu && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-[calc(100%+8px)] md:top-[calc(100%+8px)] md:bottom-auto left-0 w-[280px] max-w-[calc(100vw-4rem)] bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-black/5 z-20 py-2 flex flex-col max-h-48 overflow-y-auto">
                            {LADAS.map(l => (
                              <button key={l.code} type="button" onClick={() => { setLada(l); setShowLadaMenu(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-sand)] text-left transition-colors">
                                <span className="shrink-0">{l.flag}</span>
                                <span className="font-medium shrink-0">{l.code}</span>
                                <span className="text-sm opacity-60 ml-auto truncate">{l.country}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input type="tel" required maxLength={10} value={guestPhone} onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="123 456 7890" className="flex-1 min-w-0 border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-white/50 focus:bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none" />
                    </div>
                  </div>

                  <button type="submit" className="mt-auto bg-[var(--color-ink)] text-[var(--color-cream)] rounded-full px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium hover:bg-black transition-all flex justify-center w-full">
                    Resumen y Pago
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full pb-8">
                <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--color-rose-3)] mb-2 font-semibold">Paso 4 de 4</p>
                <h2 className="font-sans font-bold text-[2.5rem] mb-6 leading-none">Resumen y Pago</h2>

                <div className="bg-white/60 rounded-2xl p-5 border border-[rgba(94,58,80,0.1)] mb-8 flex flex-col gap-4 text-sm shrink-0">
                  <div className="flex justify-between items-center pb-4 border-b border-[rgba(94,58,80,0.1)]">
                    <span className="opacity-70">Espacio</span>
                    <span className="font-medium capitalize">{selectedUnit!.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-[rgba(94,58,80,0.1)]">
                    <span className="opacity-70">Estancia</span>
                    <span className="font-medium">{nights} noche{nights > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-[rgba(94,58,80,0.1)]">
                    <span className="opacity-70">Huésped</span>
                    <span className="font-medium">{guestName}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="opacity-70 text-xs uppercase tracking-widest">Total a pagar</span>
                    <span className="font-sans font-bold text-2xl text-[var(--color-rose-3)]">{totalPrice.toLocaleString('es-MX')} MXN</span>
                  </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-2 shrink-0"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}

                {!clientSecret ? (
                  <button disabled={loading} onClick={handleCreateBooking} className="mt-auto bg-[var(--color-ink)] text-[var(--color-cream)] rounded-full px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium hover:bg-black disabled:opacity-50 transition-all flex justify-center items-center gap-2 w-full shrink-0">
                    {loading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                    {loading ? 'Procesando...' : 'Pagar de forma segura'}
                  </button>
                ) : (
                  <div className="mt-4 shrink-0">
                    <StripePayment
                      clientSecret={clientSecret}
                      bookingId={bookingId}
                      chargeAmount={chargeAmount}
                      onSuccess={() => setSuccess(true)}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
