'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useBookingStore } from '@/lib/store';
import { createPendingBooking } from '@/app/actions/bookings';
import dynamic from 'next/dynamic';
import { es } from 'date-fns/locale';
import { isWithinInterval, parseISO } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { createPaymentIntent } from '@/app/actions/payments';
import type { DateRange } from 'react-day-picker';

// Lazy load heavy components
const DayPicker = dynamic(() => import('react-day-picker').then(mod => mod.DayPicker), { ssr: false, loading: () => <div className="h-[300px] w-[300px] bg-white/20 animate-pulse rounded-2xl" /> });
const StripePayment = dynamic(() => import('./stripe-payment').then(mod => mod.StripePayment), { ssr: false, loading: () => <div className="h-[200px] w-full bg-white/20 animate-pulse rounded-lg" /> });

export function BookingModal() {
  const { isOpen, closeBooking } = useBookingStore();
  const overlayRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [apartmentId, setApartmentId] = useState('');
  const [range, setRange] = useState<DateRange | undefined>();
  const [disabledDates, setDisabledDates] = useState<{from: Date, to: Date}[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Payment state
  const [bookingId, setBookingId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [chargeAmount, setChargeAmount] = useState(0);

  const { contextSafe } = useGSAP({ scope: overlayRef });

  const toggleModal = contextSafe((open: boolean) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      gsap.set(overlayRef.current, { display: 'flex' });
      gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.5 });
      gsap.fromTo(wrapRef.current, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', delay: 0.1 });
    } else {
      document.body.style.overflow = '';
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.4, onComplete: () => {
        gsap.set(overlayRef.current, { display: 'none' });
        // Reset form
        setStep(1);
        setApartmentId('');
        setRange(undefined);
        setDisabledDates([]);
        setGuestName('');
        setGuestEmail('');
        setError('');
        setSuccess(false);
        setBookingId('');
        setClientSecret('');
        setChargeAmount(0);
      }});
      gsap.to(wrapRef.current, { y: 20, autoAlpha: 0, duration: 0.4, ease: 'power2.in' });
    }
  });

  useEffect(() => {
    toggleModal(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (step === 2 && apartmentId) {
      // Fetch availability
      fetch(`/api/availability?apartmentId=${apartmentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.disabledRanges) {
            setDisabledDates(data.disabledRanges.map((r: any) => ({
              from: parseISO(r.from),
              to: parseISO(r.to)
            })));
          }
        })
        .catch(console.error);
    }
  }, [step, apartmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Step 1: Create the pending booking in DB (Atomic Lock check)
    if (!range?.from || !range?.to) {
      setError('Por favor selecciona las fechas');
      setLoading(false);
      return;
    }

    const res = await createPendingBooking({
      apartmentId,
      checkIn: range.from,
      checkOut: range.to,
      guestName,
      guestEmail,
      guestPhone: '555-0000',
      guests: 2
    });

    if (res.error || !res.booking?.id) {
      setError(res.error || 'Error creando reservación');
      setLoading(false);
      return;
    }

    setBookingId(res.booking.id);

    // Step 2: Initialize Payment Intent with Stripe
    const amountTotal = 4500; // Mock base price MXN for demo
    const payment = await createPaymentIntent(amountTotal, 'mxn');
    
    if (payment.error || !payment.clientSecret) {
      setError(payment.error || 'Error iniciando el pago');
      setLoading(false);
      return;
    }

    setClientSecret(payment.clientSecret);
    setChargeAmount(payment.chargeAmount || 0);
    setLoading(false);
    setStep(3); // Proceed to payment
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-[rgba(20,8,20,0.85)] hidden place-items-center p-[var(--spacing-pad-x)] backdrop-blur-sm">
      <div ref={wrapRef} className="bg-[var(--color-cream)] w-full max-w-[500px] rounded-[24px] p-[clamp(2rem,5vw,3rem)] shadow-2xl relative text-[var(--color-ink)] will-change-transform">
        <button onClick={closeBooking} className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-[rgba(94,58,80,0.06)] hover:bg-[rgba(94,58,80,0.12)] transition-colors" aria-label="Cerrar">✕</button>
        
        {success ? (
          <div className="text-center py-8">
            <h2 className="font-display text-[2rem] mb-4 text-[var(--color-rose-3)]">¡Reserva confirmada!</h2>
            <p className="opacity-80 mb-6">Hemos enviado los detalles a tu correo electrónico.</p>
            <button onClick={closeBooking} className="bg-[var(--color-rose-2)] text-[var(--color-cream)] rounded-full px-[2em] py-[0.8em] text-[0.8rem] tracking-[0.2em] uppercase">Cerrar</button>
          </div>
        ) : step === 3 ? (
           <>
             <h2 className="font-display text-[2rem] mb-6 leading-tight">Completar Pago</h2>
             {isOpen && (
               <StripePayment 
                 clientSecret={clientSecret} 
                 bookingId={bookingId} 
                 chargeAmount={chargeAmount} 
                 onSuccess={() => setSuccess(true)} 
               />
             )}
           </>
        ) : step === 1 ? (
          <>
            <p className="kicker mb-4 text-[var(--color-rose-3)]">Reservar estancia</p>
            <h2 className="font-display text-[2rem] mb-6 leading-tight">Elige tu espacio</h2>
            <div className="grid gap-3">
              <button onClick={() => { setApartmentId('tierra'); setStep(2); }} className="border border-[rgba(94,58,80,0.2)] rounded-xl p-4 text-left hover:border-[var(--color-rose-3)] transition-colors">
                <span className="block font-display text-xl mb-1">Tierra</span><span className="block opacity-70 text-sm">Planta baja · 2 huéspedes</span>
              </button>
              <button onClick={() => { setApartmentId('aire'); setStep(2); }} className="border border-[rgba(94,58,80,0.2)] rounded-xl p-4 text-left hover:border-[var(--color-rose-3)] transition-colors">
                <span className="block font-display text-xl mb-1">Aire</span><span className="block opacity-70 text-sm">Planta alta · 2-3 huéspedes</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setStep(1)} className="text-[0.8rem] opacity-60 hover:opacity-100 mb-4 inline-block">← Volver</button>
            <h2 className="font-display text-[2rem] mb-6 leading-tight">Detalles ({apartmentId})</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex justify-center mb-4">
                {isOpen && (
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    locale={es}
                    disabled={[{ before: new Date() }, ...disabledDates]}
                    numberOfMonths={1}
                    className="bg-white/50 rounded-2xl p-4 shadow-sm border border-[rgba(94,58,80,0.1)]"
                  />
                )}
              </div>
              <div>
                <label className="block text-[0.8rem] mb-1 opacity-80">Nombre completo</label>
                <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-lg p-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-[0.8rem] mb-1 opacity-80">Correo electrónico</label>
                <input type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-lg p-2 bg-transparent" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button disabled={loading} type="submit" className="bg-[var(--color-rose-2)] text-[var(--color-cream)] rounded-full px-[2.4em] py-[1em] text-[0.72rem] tracking-[0.28em] uppercase font-medium mt-4 hover:bg-[var(--color-rose-3)] disabled:opacity-50">
                {loading ? 'Procesando...' : 'Continuar al pago'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
