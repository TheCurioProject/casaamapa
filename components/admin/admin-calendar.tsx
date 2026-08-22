'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, User, RefreshCw, Plus } from 'lucide-react';
import { ManualBookingModal } from './manual-booking-modal';

type Unit = { id: string; name: string; price: number; isWholeHouse: boolean; icalUrls?: string[] };
type Booking = { id: string; apartmentId: string; checkIn: Date; checkOut: Date; guestName: string; status: string; isManual: boolean };
type BlockedDate = { id: string; apartmentId: string; startDate: Date; endDate: Date; reason: string | null; isOtaBlock: boolean };

export function AdminCalendar({
  units,
  bookings,
  blockedDates
}: {
  units: Unit[];
  bookings: Booking[];
  blockedDates: BlockedDate[];
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isSyncing, setIsSyncing] = useState(false);
  const hasIcalUrls = units.some(u => u.icalUrls && u.icalUrls.length > 0);
  const [direction, setDirection] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handlePrevMonth = () => { setDirection(-1); setCurrentMonth(subMonths(currentMonth, 1)); };
  const handleNextMonth = () => { setDirection(1); setCurrentMonth(addMonths(currentMonth, 1)); };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/ical/sync', { method: 'POST' });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusForDayAndUnit = (date: Date, unitId: string) => {
    const targetDate = startOfDay(date);
    
    // Check bookings
    const booking = bookings.find(b => {
      const start = startOfDay(new Date(b.checkIn));
      const end = startOfDay(new Date(b.checkOut));
      const unitMatch = b.apartmentId === unitId || 
        (units.find(u => u.id === b.apartmentId)?.isWholeHouse) || 
        (units.find(u => u.id === unitId)?.isWholeHouse);
      
      return unitMatch && targetDate >= start && targetDate < end; // checkout day is not occupied
    });

    if (booking) return { type: 'booking', data: booking };

    // Check blocks
    const block = blockedDates.find(b => {
      const start = startOfDay(new Date(b.startDate));
      const end = startOfDay(new Date(b.endDate));
      const unitMatch = b.apartmentId === unitId || 
        (units.find(u => u.id === b.apartmentId)?.isWholeHouse) || 
        (units.find(u => u.id === unitId)?.isWholeHouse);

      return unitMatch && targetDate >= start && targetDate <= end;
    });

    if (block) return { type: 'block', data: block };

    return null;
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
  };

  return (
    <div className="flex flex-col gap-6 w-full overflow-hidden text-[var(--color-sand)]">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-8 bg-white/5 p-4 md:p-6 rounded-3xl border border-white/10 flex-col md:flex-row gap-4">
        <div className="flex items-center gap-4 text-white">
          <CalendarIcon className="w-6 h-6 text-[var(--color-rose-3)]" />
          <h2 className="text-xl font-display capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-rose-3)] hover:bg-[var(--color-rose-2)] text-[var(--color-ink)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Bloqueo / Reserva
          </button>
          <button 
            onClick={handleSync}
            disabled={isSyncing || !hasIcalUrls}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-medium uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            <motion.div animate={{ rotate: isSyncing ? 360 : 0 }} transition={{ repeat: isSyncing ? Infinity : 0, duration: 1, ease: 'linear' }}>
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            Sincronizar
          </button>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Activity List (Mobile First Variant) */}
      <div className="md:hidden flex flex-col gap-4">
        {(() => {
          const start = startOfMonth(currentMonth);
          const end = endOfMonth(currentMonth);
          
          const monthBookings = bookings.filter(b => {
            const bStart = new Date(b.checkIn);
            const bEnd = new Date(b.checkOut);
            return (bStart <= end && bEnd >= start);
          }).map(b => ({ ...b, sortDate: new Date(b.checkIn), type: 'booking' as const }));

          const monthBlocks = blockedDates.filter(b => {
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            return (bStart <= end && bEnd >= start);
          }).map(b => ({ ...b, sortDate: new Date(b.startDate), type: 'block' as const }));

          const activities = [...monthBookings, ...monthBlocks].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

          if (activities.length === 0) {
            return (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center opacity-50 text-white">
                No hay actividad para este mes.
              </div>
            );
          }

          return activities.map((act, idx) => {
            const unit = units.find(u => u.id === (act.type === 'booking' ? (act as Booking).apartmentId : (act as BlockedDate).apartmentId));
            
            if (act.type === 'booking') {
              const b = act as Booking;
              return (
                <div key={`booking-${b.id}-${idx}`} className="bg-white/5 border border-white/10 rounded-[20px] p-5 flex flex-col gap-3 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white text-base flex items-center gap-2">
                        {b.guestName}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest ${
                      b.isManual ? 'bg-[var(--color-rose-1)]/20 text-[var(--color-rose-1)] border border-[var(--color-rose-1)]/30' : 'bg-[var(--color-coral)]/20 text-[var(--color-coral)] border border-[var(--color-coral)]/30'
                    }`}>
                      {b.isManual ? 'Manual' : 'Web'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="bg-black/20 text-white/80 border border-white/10 px-2 py-1 rounded text-xs font-semibold tracking-wide capitalize">
                      {unit?.name || b.apartmentId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Check-in</span>
                      <span className="text-xs font-medium text-white/90">
                        {format(new Date(b.checkIn), 'd MMM', { locale: es })}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Check-out</span>
                      <span className="text-xs font-medium text-white/90">
                        {format(new Date(b.checkOut), 'd MMM', { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            } else {
              const b = act as BlockedDate;
              return (
                <div key={`block-${b.id}-${idx}`} className="bg-[#9b4b62]/10 border border-[#9b4b62]/30 rounded-[20px] p-5 flex flex-col gap-3 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#9b4b62]" />
                      <p className="font-bold text-white text-base">Bloqueo</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest bg-[#9b4b62]/30 text-[#e0a8b9]`}>
                      {b.isOtaBlock ? 'OTA' : 'Manual'}
                    </span>
                  </div>
                  
                  <p className="text-xs opacity-70 italic">{b.reason || 'Sin motivo especificado'}</p>

                  <div className="flex items-center gap-2">
                    <span className="bg-black/20 text-white/80 border border-white/10 px-2 py-1 rounded text-xs font-semibold tracking-wide capitalize">
                      {unit?.name || b.apartmentId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Desde</span>
                      <span className="text-xs font-medium text-white/90">
                        {format(new Date(b.startDate), 'd MMM', { locale: es })}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Hasta</span>
                      <span className="text-xs font-medium text-white/90">
                        {format(new Date(b.endDate), 'd MMM', { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
          });
        })()}
      </div>

      {/* Cloudbeds Style Matrix (Desktop) */}
      <div className="hidden md:flex bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden flex-col">
        <div className="overflow-x-auto w-full pb-4 custom-scrollbar">
          <div className="w-max pr-8">
            
            {/* Header Row (Days) */}
            <div className="flex border-b border-white/10 sticky top-0 bg-[var(--color-ink-2)] z-30 shadow-sm">
              <div className="w-48 shrink-0 p-4 font-bold text-sm tracking-widest uppercase opacity-90 sticky left-0 z-40 bg-[var(--color-ink-2)] border-r border-white/10 flex items-center shadow-[4px_0_12px_rgba(0,0,0,0.1)]">
                Unidad
              </div>
              <div className="flex flex-1 relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div 
                    key={currentMonth.toISOString()} 
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex flex-1"
                  >
                    {daysInMonth.map(day => (
                      <div key={day.toISOString()} className="w-14 shrink-0 flex flex-col items-center justify-center p-2 border-r border-white/5">
                        <span className="text-[9px] opacity-70 uppercase tracking-widest">{format(day, 'EEE', { locale: es })}</span>
                        <span className="font-bold text-sm mt-1">{format(day, 'd')}</span>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Rows (Units) */}
            <div className="flex flex-col relative z-10">
              {units.map(unit => (
                <div key={unit.id} className="flex border-b border-white/5 hover:bg-white/[0.03] transition-colors relative">
                  {/* Fixed Unit Column */}
                  <div className="w-48 shrink-0 p-4 sticky left-0 z-20 bg-[var(--color-ink-2)] border-r border-white/10 flex flex-col justify-center shadow-[4px_0_12px_rgba(0,0,0,0.1)] group-hover:bg-[var(--color-ink-2)]">
                    <span className="font-bold text-sm truncate">{unit.name}</span>
                    {unit.isWholeHouse && <span className="text-[9px] text-[var(--color-rose-3)] uppercase tracking-widest mt-1">Casa Completa</span>}
                  </div>
                  
                  {/* Days Grid */}
                  <div className="flex flex-1 relative overflow-hidden">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                      <motion.div 
                        key={currentMonth.toISOString()} 
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex flex-1"
                      >
                        {daysInMonth.map(day => {
                          const status = getStatusForDayAndUnit(day, unit.id);
                          let cellColor = '';
                          let content = null;

                          if (status?.type === 'booking') {
                            const isManual = (status.data as Booking).isManual;
                            // Reserva Web (Directa): Rojo (coral), Manual: Rosa Claro
                            cellColor = isManual ? 'bg-[var(--color-rose-1)] border-[var(--color-rose-1)]' : 'bg-[var(--color-coral)] border-[var(--color-coral)]';
                            const textColor = isManual ? 'text-[var(--color-ink)]' : 'text-white';
                            
                            const isStart = isSameDay(new Date((status.data as Booking).checkIn), day) || day.getDate() === 1;
                            content = isStart ? <User className={`w-4 h-4 ${textColor}`} /> : null;
                          } else if (status?.type === 'block') {
                            const isOta = (status.data as BlockedDate).isOtaBlock;
                            cellColor = isOta ? 'bg-[#9b4b62] border-[#9b4b62]' : 'bg-[var(--color-rose-1)] border-[var(--color-rose-1)]'; // manual block same as manual booking or white/20
                            const textColor = isOta ? 'text-white' : 'text-[var(--color-ink)]';
                            
                            const isStart = isSameDay(new Date((status.data as BlockedDate).startDate), day) || day.getDate() === 1;
                            content = isStart ? <Lock className={`w-3 h-3 ${textColor} opacity-80`} /> : null;
                          }

                          return (
                            <div 
                              key={day.toISOString()} 
                              className="w-14 shrink-0 border-r border-white/5 relative h-16 flex items-center p-0.5"
                            >
                              {status && (
                                <div 
                                  className={`w-full h-full flex items-center justify-center rounded-md ${cellColor} shadow-md cursor-help overflow-hidden`}
                                  title={status.type === 'booking' ? `Reservado por ${(status.data as Booking).guestName}` : `Bloqueado: ${(status.data as BlockedDate).reason}`}
                                >
                                  {content}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-[10px] uppercase tracking-widest mt-6 px-6 pb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--color-coral)] rounded-sm shadow-sm"></div>
          <span>Reserva Web (Roja)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#9b4b62] rounded-sm shadow-sm"></div>
          <span>Bloqueo OTA (Rosa Obscuro)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--color-rose-1)] rounded-sm shadow-sm"></div>
          <span className="text-[var(--color-sand)]">Bloqueo Manual (Rosa Claro)</span>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-rose-3);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-coral);
        }
      `}</style>

      {isModalOpen && (
        <ManualBookingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          units={units}
          bookedDates={blockedDates.map(b => b.startDate)} // simplified for picker disabled state
        />
      )}
    </div>
  );
}
