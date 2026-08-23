'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { differenceInDays } from 'date-fns';
import { createManualBooking, createManualBlock } from '@/app/actions/admin-calendar';

type Unit = { id: string; name: string; price: number; isWholeHouse: boolean };

export function ManualBookingModal({
  isOpen,
  onClose,
  units,
  bookings,
  blockedDates
}: {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  bookings: any[];
  blockedDates: any[];
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'booking' | 'block'>('booking');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Booking fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [depositPercentage, setDepositPercentage] = useState(50);
  
  // Block fields
  const [reason, setReason] = useState('');

  const [bookingResultId, setBookingResultId] = useState('');

  const nights = range?.from && range?.to ? Math.max(1, differenceInDays(range.to, range.from)) : 0;
  const estimatedPrice = selectedUnit ? nights * selectedUnit.price : 0;

  const computedDates = useMemo(() => {
    if (!selectedUnit) return { booked: [], cleaning: [] };
    const booked: Date[] = [];
    const cleaning: Date[] = [];

    const unitBookings = bookings.filter(b => b.apartmentId === selectedUnit.id || selectedUnit.isWholeHouse || units.find(u => u.id === b.apartmentId)?.isWholeHouse);
    const unitBlocks = blockedDates.filter(b => b.apartmentId === selectedUnit.id || selectedUnit.isWholeHouse || units.find(u => u.id === b.apartmentId)?.isWholeHouse);

    unitBookings.forEach(b => {
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

    unitBlocks.forEach(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      start.setHours(12, 0, 0, 0);
      end.setHours(12, 0, 0, 0);
      let current = new Date(start);
      while (current <= end) {
        booked.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });

    return { booked, cleaning };
  }, [selectedUnit, bookings, blockedDates, units]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!range?.from || !range?.to) {
      setError('Por favor selecciona un rango de fechas válido.');
      setLoading(false);
      return;
    }

    try {
      if (type === 'booking') {
        let uploadedUrl = '';
        if (idPhotoFile) {
          const formData = new FormData();
          formData.append('file', idPhotoFile);
          
          const uploadRes = await fetch('/api/admin/upload-id', {
            method: 'POST',
            body: formData
          });
          
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.success) {
            throw new Error(uploadData.error || 'Error subiendo la imagen de identificación.');
          }
          uploadedUrl = uploadData.url;
        }

        const res = await createManualBooking({
          apartmentId: selectedUnit!.id,
          checkIn: range.from,
          checkOut: range.to,
          guestName,
          guestEmail,
          guestPhone,
          idPhotoUrl: uploadedUrl,
          depositPercentage,
          totalPrice: estimatedPrice,
          guests: 2
        });
        
        if (res.error || !res.booking) throw new Error(res.error || 'Error creating booking');
        setBookingResultId(res.booking.id);
        setStep(4); // Show "Send Invoice" prompt
      } else {
        const res = await createManualBlock({
          apartmentId: selectedUnit!.id,
          startDate: range.from,
          endDate: range.to,
          reason
        });
        
        if (res.error) throw new Error(res.error);
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingResultId })
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('Error al enviar el correo.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[var(--color-cream)] rounded-[2rem] shadow-2xl border border-[rgba(94,58,80,0.08)] relative z-50 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar text-[var(--color-ink)] relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-[rgba(94,58,80,0.06)] rounded-full hover:bg-[rgba(94,58,80,0.12)] transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-display text-3xl mb-6 text-[var(--color-rose-3)]">
            {step === 4 ? 'Reserva Creada' : 'Nueva Operación'}
          </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-4 mb-6">
                <button onClick={() => setType('booking')} className={`flex-1 py-2 sm:py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors leading-relaxed sm:leading-normal ${type === 'booking' ? 'bg-[var(--color-ink)] text-[var(--color-cream)]' : 'bg-white text-[var(--color-ink)] border border-black/10'}`}>
                  Reserva<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Manual
                </button>
                <button onClick={() => setType('block')} className={`flex-1 py-2 sm:py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors leading-relaxed sm:leading-normal ${type === 'block' ? 'bg-[var(--color-ink)] text-[var(--color-cream)]' : 'bg-white text-[var(--color-ink)] border border-black/10'}`}>
                  Bloquear<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Fechas
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {units.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => { setSelectedUnit(unit); setStep(2); }}
                    className="p-4 rounded-2xl border border-black/10 hover:border-[var(--color-rose-3)] hover:bg-[var(--color-rose-3)]/5 text-left transition-colors"
                  >
                    <span className="block font-bold text-lg capitalize">{unit.name}</span>
                    <span className="text-xs opacity-60 uppercase tracking-widest">{unit.price} MXN / noche</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-4">
                <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Unidad: {selectedUnit?.name}</span>
              </div>
              
              <div className="calendar-wrapper bg-white/40 p-4 rounded-[2rem] shadow-sm border border-[rgba(94,58,80,0.08)] mb-6 flex justify-center">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={(newRange, selectedDay) => {
                    if (!newRange) {
                      setRange(undefined);
                      return;
                    }
                    if (range?.from && !range?.to && new Date(selectedDay).getTime() === new Date(range.from).getTime()) {
                      setRange({ from: range.from, to: range.from });
                    } else {
                      setRange(newRange);
                    }
                  }}
                  modifiers={{
                    booked: computedDates.booked,
                    cleaning: computedDates.cleaning
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
                    
                    const isBooked = computedDates.booked.some(bd => new Date(bd.getFullYear(), bd.getMonth(), bd.getDate()).getTime() === d);
                    const isCleaning = computedDates.cleaning.some(cd => new Date(cd.getFullYear(), cd.getMonth(), cd.getDate()).getTime() === d);
                    
                    if (isBooked || isCleaning) return true;
                    
                    if (range?.from) {
                      const fromTime = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate()).getTime();
                      if (d <= fromTime) return true;
                      
                      const nextDisabledDate = [...computedDates.booked, ...computedDates.cleaning]
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
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-white border border-black/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-black/5">Atrás</button>
                <button disabled={!range?.from || !range?.to} onClick={() => setStep(3)} className="flex-1 py-3 bg-[var(--color-rose-3)] text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-[var(--color-rose-2)] disabled:opacity-50">Continuar</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.form key="step3" onSubmit={handleSubmit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {type === 'booking' ? (
                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Nombre</label>
                      <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Teléfono</label>
                      <input type="tel" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Correo Electrónico (Para Invoice)</label>
                    <input type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Foto ID (Opcional)</label>
                    <input type="file" accept="image/*" onChange={e => setIdPhotoFile(e.target.files?.[0] || null)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-rose-3)] file:text-white hover:file:bg-[var(--color-rose-2)]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">% Depósito Anticipo</label>
                      <select value={depositPercentage} onChange={e => setDepositPercentage(Number(e.target.value))} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2.5 bg-white/50 focus:bg-white outline-none">
                        <option value={0}>0%</option>
                        <option value={50}>50%</option>
                        <option value={100}>100%</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Total Estimado</label>
                      <div className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2.5 bg-black/5 font-bold text-lg text-[var(--color-rose-3)]">
                        ${estimatedPrice.toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Motivo del Bloqueo (Opcional)</label>
                  <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none resize-none" />
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 bg-white border border-black/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-black/5">Atrás</button>
                <button disabled={loading} type="submit" className="flex-1 py-3 bg-[var(--color-ink)] text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-black flex items-center justify-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                  Confirmar {type === 'booking' ? 'Reserva' : 'Bloqueo'}
                </button>
              </div>
            </motion.form>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h3 className="font-bold text-2xl mb-2">¡Operación exitosa!</h3>
              <p className="opacity-70 mb-8">¿Deseas enviar el Invoice (factura) con los detalles de pago al correo {guestEmail} y a ti mismo?</p>
              
              <div className="flex gap-4 flex-col sm:flex-row">
                <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-white border border-black/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-black/5">
                  Omitir
                </button>
                <button onClick={handleSendInvoice} disabled={loading} className="flex-1 py-3 bg-[var(--color-rose-3)] text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-[var(--color-rose-2)] flex justify-center items-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                  Enviar Invoice
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
