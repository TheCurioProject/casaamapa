'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Calendar as CalendarIcon, User } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { differenceInDays, startOfDay, isSameDay } from 'date-fns';
import { getBookingById, updateBooking, getAdminCalendarData } from '@/app/actions/admin-calendar';
import { useLoaderStore } from '@/store/useLoaderStore';

type Unit = { id: string; name: string; price: number; isWholeHouse: boolean };
type Booking = { id: string; checkIn: Date; checkOut: Date; guestName: string; guestEmail: string; guestPhone: string; idPhotoUrl: string | null; depositPercentage: number | null; totalPrice: number | null; apartmentId: string; status: string };
type Block = { id: string; startDate: Date; endDate: Date; apartmentId: string };

export function EditBookingModal({
  isOpen,
  onClose,
  bookingId
}: {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}) {
  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allBlocks, setAllBlocks] = useState<Block[]>([]);
  
  const [range, setRange] = useState<DateRange | undefined>();
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [idPhotoUrl, setIdPhotoUrl] = useState('');
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [depositPercentage, setDepositPercentage] = useState(50);
  
  const [isInteracted, setIsInteracted] = useState(false);
  
  const [error, setError] = useState('');
  const { showLoader, hideLoader } = useLoaderStore();

  useEffect(() => {
    async function loadData() {
      try {
        const [bookingRes, calendarRes] = await Promise.all([
          getBookingById(bookingId),
          getAdminCalendarData()
        ]);
        
        if (bookingRes.error || !bookingRes.booking) throw new Error(bookingRes.error || 'Error loading booking');
        
        const b = bookingRes.booking;
        setBooking(b as unknown as Booking);
        setRange({ from: new Date(b.checkIn), to: new Date(b.checkOut) });
        setGuestName(b.guestName);
        setGuestEmail(b.guestEmail || '');
        setGuestPhone(b.guestPhone || '');
        setIdPhotoUrl(b.idPhotoUrl || '');
        setDepositPercentage(b.depositPercentage || 50);

        setUnits(calendarRes.units);
        setAllBookings(calendarRes.bookings as unknown as Booking[]);
        setAllBlocks(calendarRes.blockedDates as unknown as Block[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    }
    if (isOpen) loadData();
  }, [isOpen, bookingId]);

  const selectedUnit = units.find(u => u.id === booking?.apartmentId);
  const nights = range?.from && range?.to ? Math.max(1, differenceInDays(range.to, range.from)) : 0;
  // Calculate price dynamically if dates change
  const estimatedPrice = selectedUnit ? nights * selectedUnit.price : (booking?.totalPrice || 0);

  // Filter out the current booking dates to allow re-selecting them
  const isDateDisabled = (date: Date) => {
    if (!booking) return false;
    const target = startOfDay(date);
    if (target < startOfDay(new Date())) return true; // past dates

    // Check overlaps with OTHER bookings for this unit
    const unitId = booking.apartmentId;
    
    for (const b of allBookings) {
      if (b.id === booking.id) continue; // skip self
      
      const bStart = startOfDay(new Date(b.checkIn));
      const bEnd = startOfDay(new Date(b.checkOut));
      const unitMatch = b.apartmentId === unitId || 
        (units.find(u => u.id === b.apartmentId)?.isWholeHouse) || 
        (units.find(u => u.id === unitId)?.isWholeHouse);
      
      if (unitMatch && target >= bStart && target < bEnd) return true;
    }

    for (const bl of allBlocks) {
      const blStart = startOfDay(new Date(bl.startDate));
      const blEnd = startOfDay(new Date(bl.endDate));
      const unitMatch = bl.apartmentId === unitId || 
        (units.find(u => u.id === bl.apartmentId)?.isWholeHouse) || 
        (units.find(u => u.id === unitId)?.isWholeHouse);
      
      if (unitMatch && target >= blStart && target <= blEnd) return true;
    }

    return false;
  };

  const currentCheckIn = booking ? startOfDay(new Date(booking.checkIn)) : null;
  const currentCheckOut = booking ? startOfDay(new Date(booking.checkOut)) : null;

  const modifiers = {
    currentBooking: (date: Date) => {
      if (!currentCheckIn || !currentCheckOut) return false;
      const target = startOfDay(date);
      return target >= currentCheckIn && target <= currentCheckOut;
    }
  };

  const modifiersStyles = {
    currentBooking: {
      color: 'var(--color-ink)',
      backgroundColor: 'rgba(230, 160, 90, 0.3)', // Amber color for "being edited"
      fontWeight: 'bold',
      borderRadius: '50%',
      ...( !isInteracted ? {
        boxShadow: '0 0 15px rgba(230, 160, 90, 0.8)',
        border: '1px solid rgba(230, 160, 90, 0.5)',
      } : {})
    }
  };

  const handleSelectRange = (newRange: DateRange | undefined) => {
    setIsInteracted(true);
    setRange(newRange);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoader();
    setError('');

    if (!range?.from || !range?.to) {
      setError('Por favor selecciona un rango de fechas válido.');
      hideLoader();
      return;
    }

    try {
      let uploadedUrl = idPhotoUrl;
      if (idPhotoFile) {
        const formData = new FormData();
        formData.append('file', idPhotoFile);
        
        const uploadRes = await fetch('/api/admin/upload-id', {
          method: 'POST',
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Error subiendo la imagen.');
        }
        uploadedUrl = uploadData.url;
      }

      const res = await updateBooking(bookingId, {
        checkIn: range.from,
        checkOut: range.to,
        guestName,
        guestEmail,
        guestPhone,
        idPhotoUrl: uploadedUrl,
        depositPercentage,
        totalPrice: estimatedPrice
      });
      
      if (res.error) throw new Error(res.error);
      setStep(3); // Success step
    } catch (err: any) {
      setError(err.message);
    } finally {
      hideLoader();
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
            {step === 3 ? 'Reserva Actualizada' : 'Editar Reserva'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loadingData ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-black/10 border-t-[var(--color-rose-3)] rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Unidad: {selectedUnit?.name}</span>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                      <div className="w-3 h-3 bg-[rgba(230,160,90,0.3)] rounded-full border border-[var(--color-ink)]" />
                      Fechas Actuales
                    </div>
                  </div>
                  
                  <div className="calendar-wrapper bg-white/40 p-4 rounded-[2rem] shadow-sm border border-[rgba(94,58,80,0.08)] mb-6 flex justify-center">
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={handleSelectRange}
                      disabled={isDateDisabled}
                      modifiers={modifiers}
                      modifiersStyles={modifiersStyles}
                      defaultMonth={currentCheckIn || undefined}
                      className={`custom-neumorphic-calendar font-sans !m-0 ${!isInteracted ? 'animate-pulse-slow' : ''}`}
                      locale={es}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-black/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-black/5">Cancelar</button>
                    <button disabled={!range?.from || !range?.to} onClick={() => setStep(2)} className="flex-1 py-3 bg-[var(--color-rose-3)] text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-[var(--color-rose-2)] disabled:opacity-50">Continuar</button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.form key="step2" onSubmit={handleSubmit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Nombre</label>
                        <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Teléfono</label>
                        <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Correo Electrónico</label>
                      <input type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Foto ID (Opcional - Reemplazar)</label>
                      <input type="file" accept="image/*" onChange={e => setIdPhotoFile(e.target.files?.[0] || null)} className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-3 py-2 bg-white/50 focus:bg-white outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-rose-3)] file:text-white hover:file:bg-[var(--color-rose-2)]" />
                      {idPhotoUrl && !idPhotoFile && <a href={idPhotoUrl} target="_blank" className="text-xs text-[var(--color-rose-3)] hover:underline mt-1 block">Ver ID actual</a>}
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

                  <div className="flex gap-4">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-white border border-black/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-black/5">Atrás</button>
                    <button type="submit" className="flex-1 py-3 bg-[var(--color-ink)] text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-black flex items-center justify-center gap-2">
                      Guardar Cambios
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                  <h3 className="font-bold text-2xl mb-2">¡Operación exitosa!</h3>
                  <p className="opacity-70 mb-8">La reserva ha sido actualizada correctamente.</p>
                  
                  <button onClick={() => window.location.reload()} className="w-full py-3 bg-[var(--color-rose-3)] text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-[var(--color-rose-2)]">
                    Volver
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
