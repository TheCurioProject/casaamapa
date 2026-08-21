'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isWithinInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, User, RefreshCw } from 'lucide-react';

type Unit = { id: string; name: string; price: number; isWholeHouse: boolean };
type Booking = { id: string; apartmentId: string; checkIn: Date; checkOut: Date; guestName: string; status: string };
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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

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
      // Cross-blocking logic:
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

  return (
    <div className="flex flex-col gap-6 w-full overflow-hidden text-[var(--color-sand)]">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-6 h-6 text-[var(--color-rose-3)]" />
          <h2 className="text-xl font-display capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-white/10 hover:bg-[var(--color-rose-3)] px-4 py-2 rounded-xl text-xs font-medium uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar OTAs
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

      {/* Cloudbeds Style Matrix */}
      <div className="w-full overflow-x-auto bg-white/5 rounded-3xl border border-white/10 pb-4 custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Header Row (Days) */}
          <div className="flex border-b border-white/10 sticky top-0 bg-[var(--color-ink)] z-20">
            <div className="w-48 shrink-0 p-4 font-medium text-sm tracking-widest uppercase opacity-70 sticky left-0 z-30 bg-[var(--color-ink)] border-r border-white/10">
              Unidad
            </div>
            <div className="flex flex-1">
              {daysInMonth.map(day => (
                <div key={day.toISOString()} className="w-12 shrink-0 flex flex-col items-center justify-center p-2 border-r border-white/5">
                  <span className="text-[10px] opacity-50 uppercase">{format(day, 'EEE', { locale: es })}</span>
                  <span className="font-medium">{format(day, 'd')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows (Units) */}
          <div className="flex flex-col">
            {units.map(unit => (
              <div key={unit.id} className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors relative">
                {/* Fixed Unit Column */}
                <div className="w-48 shrink-0 p-4 sticky left-0 z-10 bg-[var(--color-ink)] border-r border-white/10 flex flex-col justify-center">
                  <span className="font-semibold text-sm truncate">{unit.name}</span>
                  {unit.isWholeHouse && <span className="text-[9px] text-[var(--color-rose-3)] uppercase tracking-widest mt-1">Casa Completa</span>}
                </div>
                
                {/* Days Grid */}
                <div className="flex flex-1 relative">
                  {daysInMonth.map(day => {
                    const status = getStatusForDayAndUnit(day, unit.id);
                    let cellColor = '';
                    let content = null;

                    if (status?.type === 'booking') {
                      cellColor = 'bg-[var(--color-rose-3)] border-[var(--color-rose-3)]';
                      // Only show icon on start day or first day of month
                      const isStart = isSameDay(new Date((status.data as Booking).checkIn), day) || day.getDate() === 1;
                      content = isStart ? <User className="w-4 h-4 text-white" /> : null;
                    } else if (status?.type === 'block') {
                      const isOta = (status.data as BlockedDate).isOtaBlock;
                      cellColor = isOta ? 'bg-[var(--color-coral)]/80 border-[var(--color-coral)]' : 'bg-white/20 border-white/30';
                      const isStart = isSameDay(new Date((status.data as BlockedDate).startDate), day) || day.getDate() === 1;
                      content = isStart ? <Lock className="w-3 h-3 text-white/80" /> : null;
                    }

                    return (
                      <div 
                        key={day.toISOString()} 
                        className="w-12 shrink-0 border-r border-white/5 relative h-14 flex items-center p-0.5"
                      >
                        {status && (
                          <div 
                            className={`w-full h-full flex items-center justify-center rounded-sm ${cellColor} shadow-sm cursor-help`}
                            title={status.type === 'booking' ? `Reservado por ${(status.data as Booking).guestName}` : `Bloqueado: ${(status.data as BlockedDate).reason}`}
                          >
                            {content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-xs uppercase tracking-widest font-medium opacity-70">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[var(--color-rose-3)] rounded-sm"></div>
          <span>Reserva Directa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[var(--color-coral)]/80 rounded-sm"></div>
          <span>Bloqueo OTA (Airbnb/Booking)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white/20 rounded-sm"></div>
          <span>Bloqueo Manual</span>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-rose-3);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
