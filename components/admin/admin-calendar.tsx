'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker, DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { differenceInDays } from 'date-fns';
import { createManualBooking, createManualBlock, removeManualBlock } from '@/app/actions/admin-calendar';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { SubmitButton } from './submit-button';
import 'react-day-picker/dist/style.css';

type Unit = { id: string; name: string; price: number; isWholeHouse: boolean };
type Booking = { id: string; apartmentId: string; checkIn: Date; checkOut: Date; guestName: string; status: string };
type BlockedDate = { id: string; apartmentId: string; startDate: Date; endDate: Date; reason: string | null };

export function AdminCalendar({
  units,
  bookings,
  blockedDates
}: {
  units: Unit[];
  bookings: Booking[];
  blockedDates: BlockedDate[];
}) {
  const [selectedUnit, setSelectedUnit] = useState<Unit>(units[0] || null);
  const [range, setRange] = useState<DateRange | undefined>();
  const [modalType, setModalType] = useState<'booking' | 'block' | null>(null);
  const [error, setError] = useState('');
  
  // Existing data for the selected unit
  const unitBookings = bookings.filter(b => b.apartmentId === selectedUnit?.id || (b.apartmentId === 'amapa' && selectedUnit?.id !== 'amapa') || (selectedUnit?.id === 'amapa' && b.apartmentId !== 'amapa'));
  const unitBlocks = blockedDates.filter(b => b.apartmentId === selectedUnit?.id || (b.apartmentId === 'amapa' && selectedUnit?.id !== 'amapa') || (selectedUnit?.id === 'amapa' && b.apartmentId !== 'amapa'));

  const bookedDatesForPicker: Date[] = [];
  const cleaningDatesForPicker: Date[] = [];
  
  unitBookings.forEach(b => {
    let current = new Date(b.checkIn);
    current.setHours(12, 0, 0, 0);
    const end = new Date(b.checkOut);
    end.setHours(12, 0, 0, 0);
    while (current < end) {
      bookedDatesForPicker.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    cleaningDatesForPicker.push(new Date(end));
  });
  
  unitBlocks.forEach(b => {
    let current = new Date(b.startDate);
    current.setHours(12, 0, 0, 0);
    const end = new Date(b.endDate);
    end.setHours(12, 0, 0, 0);
    while (current <= end) {
      bookedDatesForPicker.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  });

  const handleAction = async (formData: FormData) => {
    setError('');
    if (!range?.from || !range?.to) {
      setError('Selecciona un rango de fechas válido.');
      return;
    }

    if (modalType === 'block') {
      const reason = formData.get('reason')?.toString();
      const res = await createManualBlock({
        apartmentId: selectedUnit.id,
        startDate: range.from,
        endDate: range.to,
        reason
      });
      if (res.error) setError(res.error);
      else resetState();
    } else if (modalType === 'booking') {
      const res = await createManualBooking({
        apartmentId: selectedUnit.id,
        checkIn: range.from,
        checkOut: range.to,
        guestName: formData.get('guestName')?.toString() || 'Admin Manual',
        guestEmail: formData.get('guestEmail')?.toString() || '',
        guestPhone: formData.get('guestPhone')?.toString() || '',
        guests: 2
      });
      if (res.error) setError(res.error);
      else resetState();
    }
  };

  const resetState = () => {
    setModalType(null);
    setRange(undefined);
    setError('');
  };

  const handleRemoveBlock = async (id: string) => {
    await removeManualBlock(id);
  };

  const nights = range?.to && range?.from ? Math.max(1, differenceInDays(range.to, range.from)) : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Unit Selector */}
      <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden">
        {units.map(unit => (
          <button
            key={unit.id}
            onClick={() => { setSelectedUnit(unit); setRange(undefined); }}
            className={`px-6 py-3 rounded-2xl font-medium tracking-wide whitespace-nowrap transition-all ${
              selectedUnit?.id === unit.id 
                ? 'bg-[var(--color-ink)] text-[var(--color-cream)] shadow-lg' 
                : 'bg-white text-[var(--color-ink)] border border-[rgba(94,58,80,0.1)] hover:border-[var(--color-rose-3)]'
            }`}
          >
            {unit.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Calendar Section */}
        <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-[rgba(94,58,80,0.08)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-[var(--color-rose-3)]" />
              Calendario - {selectedUnit?.name}
            </h2>
          </div>

          <div className="flex flex-col items-center">
            <div className="calendar-wrapper bg-[var(--color-cream)] p-6 rounded-[2rem] border border-[rgba(94,58,80,0.08)] w-full flex flex-col items-center">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                modifiers={{
                  booked: bookedDatesForPicker,
                  cleaning: cleaningDatesForPicker
                }}
                modifiersClassNames={{
                  booked: 'rdp-day_booked',
                  cleaning: 'rdp-day_cleaning'
                }}
                className="custom-neumorphic-calendar font-sans !m-0"
                locale={es}
              />
              <div className="flex justify-center gap-6 mt-6 text-[0.65rem] uppercase tracking-widest font-semibold opacity-70 flex-wrap w-full">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--color-coral)] block shadow-sm"></span>
                  <span>Ocupado / Bloqueado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--color-rose-2)] block shadow-sm"></span>
                  <span>Limpieza</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-white border border-[rgba(94,58,80,0.1)] block shadow-sm"></span>
                  <span>Disponible</span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {range?.from && range?.to && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 10 }}
                className="mt-8 flex flex-col sm:flex-row gap-4"
              >
                <button 
                  onClick={() => setModalType('booking')}
                  className="flex-1 bg-[var(--color-rose-2)] text-[var(--color-cream)] rounded-xl py-4 text-sm font-medium tracking-[0.2em] uppercase hover:bg-[var(--color-rose-3)] transition-all shadow-md"
                >
                  Crear Reserva ({nights} noches)
                </button>
                <button 
                  onClick={() => setModalType('block')}
                  className="flex-1 bg-[var(--color-ink)] text-[var(--color-cream)] rounded-xl py-4 text-sm font-medium tracking-[0.2em] uppercase hover:bg-black transition-all shadow-md"
                >
                  Bloquear Fechas
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Existing Blocks List */}
        <div className="w-full xl:w-80 bg-white rounded-3xl p-6 shadow-sm border border-[rgba(94,58,80,0.08)] flex flex-col h-full">
          <h3 className="font-semibold text-lg border-b border-[rgba(94,58,80,0.1)] pb-3 mb-4">Bloqueos Manuales</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:hidden">
            {unitBlocks.length === 0 ? (
              <p className="opacity-50 text-sm text-center py-8">No hay bloqueos manuales activos para esta unidad.</p>
            ) : (
              unitBlocks.map(block => (
                <div key={block.id} className="bg-[rgba(94,58,80,0.03)] p-4 rounded-xl border border-[rgba(94,58,80,0.05)] relative group">
                  <p className="text-xs font-semibold mb-1">{new Date(block.startDate).toLocaleDateString('es-MX')} - {new Date(block.endDate).toLocaleDateString('es-MX')}</p>
                  <p className="text-xs opacity-70">{block.reason || 'Sin razón especificada'}</p>
                  <button 
                    onClick={() => handleRemoveBlock(block.id)}
                    className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full"
                    title="Eliminar bloqueo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={resetState} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--color-cream)] w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl"
            >
              <h2 className="font-display text-3xl mb-6 text-[var(--color-ink)]">
                {modalType === 'booking' ? 'Nueva Reserva Manual' : 'Bloquear Fechas'}
              </h2>
              <p className="text-sm opacity-70 mb-6">
                Unidad: <strong>{selectedUnit?.name}</strong> <br/>
                Fechas: {range?.from?.toLocaleDateString('es-MX')} al {range?.to?.toLocaleDateString('es-MX')}
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form action={handleAction} className="space-y-4">
                {modalType === 'booking' ? (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Nombre del Huésped</label>
                      <input type="text" name="guestName" required className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Correo (Opcional)</label>
                      <input type="email" name="guestEmail" className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-white focus:border-[var(--color-rose-3)] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Teléfono (Opcional)</label>
                      <input type="tel" name="guestPhone" className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-white focus:border-[var(--color-rose-3)] outline-none" />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Razón del Bloqueo (Opcional)</label>
                    <textarea name="reason" rows={3} placeholder="Mantenimiento, uso personal, etc." className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] outline-none resize-none" />
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={resetState} className="flex-1 py-3 text-sm tracking-widest uppercase font-medium opacity-70 hover:opacity-100 transition-opacity">
                    Cancelar
                  </button>
                  <SubmitButton className="flex-1 !py-3">
                    {modalType === 'booking' ? 'Crear Reserva' : 'Bloquear'}
                  </SubmitButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
