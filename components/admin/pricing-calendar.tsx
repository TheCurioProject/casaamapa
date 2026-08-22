'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  format, isSameDay, startOfDay, isBefore, isAfter, min, max
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, X, Info, RotateCcw, Loader2 } from 'lucide-react';
import { useLoaderStore } from '@/store/useLoaderStore';
import { setPricesForDates, deletePricesForDates } from '@/app/actions/prices';
import { useDialogStore } from '@/store/useDialogStore';

type Unit = { id: string; name: string; price: number; isWholeHouse: boolean };
type Booking = { id: string; apartmentId: string; checkIn: Date; checkOut: Date; status: string };
type BlockedDate = { id: string; apartmentId: string; startDate: Date; endDate: Date };
type DailyPrice = { date: Date; price: number };

export function PricingCalendar({
  units,
  bookings,
  blockedDates,
  dailyPrices
}: {
  units: Unit[];
  bookings: Booking[];
  blockedDates: BlockedDate[];
  dailyPrices: DailyPrice[];
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [direction, setDirection] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<string>(units[0]?.id || '');
  
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { showLoader, hideLoader } = useLoaderStore();
  const dialog = useDialogStore();

  const handlePrevMonth = () => { setDirection(-1); setCurrentMonth(subMonths(currentMonth, 1)); };
  const handleNextMonth = () => { setDirection(1); setCurrentMonth(addMonths(currentMonth, 1)); };

  const getMonths = () => {
    // Show 2 months on desktop, 1 on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return [currentMonth];
    }
    return [currentMonth, addMonths(currentMonth, 1)];
  };

  const currentUnit = units.find(u => u.id === selectedUnit);

  const getStatusForDay = (date: Date) => {
    if (!currentUnit) return null;
    const targetDate = startOfDay(date);
    
    // Check bookings
    const booking = bookings.find(b => {
      const start = startOfDay(new Date(b.checkIn));
      const end = startOfDay(new Date(b.checkOut));
      const unitMatch = b.apartmentId === currentUnit.id || currentUnit.isWholeHouse || units.find(u => u.id === b.apartmentId)?.isWholeHouse;
      return unitMatch && targetDate >= start && targetDate < end; 
    });

    if (booking) return { type: 'booked' };

    // Check blocks
    const block = blockedDates.find(b => {
      const start = startOfDay(new Date(b.startDate));
      const end = startOfDay(new Date(b.endDate));
      const unitMatch = b.apartmentId === currentUnit.id || currentUnit.isWholeHouse || units.find(u => u.id === b.apartmentId)?.isWholeHouse;
      return unitMatch && targetDate >= start && targetDate <= end;
    });

    if (block) return { type: 'blocked' };

    return null;
  };

  const getCustomPriceForDay = (date: Date) => {
    const targetDate = startOfDay(date);
    return dailyPrices.find(p => isSameDay(new Date(p.date), targetDate));
  };

  const isSelected = (date: Date) => {
    if (!selectionStart) return false;
    const target = startOfDay(date);
    if (!selectionEnd) {
      if (hoverDate) {
        const minDate = min([selectionStart, hoverDate]);
        const maxDate = max([selectionStart, hoverDate]);
        return target >= minDate && target <= maxDate;
      }
      return isSameDay(target, selectionStart);
    }
    const minDate = min([selectionStart, selectionEnd]);
    const maxDate = max([selectionStart, selectionEnd]);
    return target >= minDate && target <= maxDate;
  };

  const handleDateClick = (date: Date) => {
    const status = getStatusForDay(date);
    if (status) return; // cannot select booked or blocked

    if (!selectionStart) {
      setSelectionStart(date);
      setSelectionEnd(null);
    } else if (!selectionEnd) {
      if (isSameDay(date, selectionStart)) {
        // Double click same day to just select one
        setSelectionEnd(date);
        setIsModalOpen(true);
      } else {
        setSelectionEnd(date);
        setIsModalOpen(true);
      }
    } else {
      setSelectionStart(date);
      setSelectionEnd(null);
      setIsModalOpen(false);
    }
  };

  const handleMouseEnter = (date: Date) => {
    if (selectionStart && !selectionEnd) {
      setHoverDate(date);
    }
  };

  const handleSavePrices = async () => {
    if (!selectionStart || !selectionEnd || !currentUnit || !newPrice) return;
    
    setIsSaving(true);
    showLoader('Guardando precios...');
    
    const minDate = min([selectionStart, selectionEnd]);
    const maxDate = max([selectionStart, selectionEnd]);
    
    const datesToUpdate = eachDayOfInterval({ start: minDate, end: maxDate }).filter(d => !getStatusForDay(d));
    
    const res = await setPricesForDates(currentUnit.id, datesToUpdate, parseInt(newPrice));
    
    hideLoader();
    setIsSaving(false);
    if (res.success) {
      setIsModalOpen(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      window.location.reload(); // simple reload to get new data
    } else {
      dialog.alert({ title: 'Error al Guardar', description: res.error || 'Error desconocido', type: 'danger' });
    }
  };

  const handleResetPrices = async () => {
    if (!selectionStart || !selectionEnd || !currentUnit) return;
    
    setIsResetting(true);
    showLoader('Restableciendo precios...');
    
    const minDate = min([selectionStart, selectionEnd]);
    const maxDate = max([selectionStart, selectionEnd]);
    
    const datesToUpdate = eachDayOfInterval({ start: minDate, end: maxDate }).filter(d => !getStatusForDay(d));
    
    const res = await deletePricesForDates(currentUnit.id, datesToUpdate);
    
    hideLoader();
    setIsResetting(false);
    if (res.success) {
      setIsModalOpen(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      window.location.reload();
    } else {
      dialog.alert({ title: 'Error al Restablecer', description: res.error || 'Error desconocido', type: 'danger' });
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
  };

  return (
    <div className="flex flex-col gap-6 w-full text-[var(--color-sand)]">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-display text-white">Precios por Fecha</h2>
          <p className="text-sm opacity-70">Selecciona un rango de fechas para modificar los precios.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            value={selectedUnit}
            onChange={(e) => { setSelectedUnit(e.target.value); setSelectionStart(null); setSelectionEnd(null); }}
            className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-rose-3)] w-full md:w-48"
          >
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
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

      <AnimatePresence>
        {selectionStart && !selectionEnd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--color-rose-3)]/20 border border-[var(--color-rose-3)] text-white px-4 py-3 rounded-2xl flex justify-center items-center gap-2 text-sm text-center mx-auto max-w-lg w-full"
          >
            <Info className="w-4 h-4 text-[var(--color-rose-3)] shrink-0" />
            <span>Selecciona <strong>otra fecha</strong> para un rango, o haz clic en la <strong>misma fecha</strong> para configurar un solo día.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid */}
      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentMonth.toISOString()}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col md:flex-row gap-8"
          >
            {getMonths().map((month, idx) => {
              const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
              const firstDayIndex = (startOfMonth(month).getDay() + 6) % 7; // Monday start
              const blanks = Array.from({ length: firstDayIndex });
              
              return (
                <div key={idx} className="flex-1">
                  <h3 className="text-center font-display text-lg mb-6 capitalize text-[var(--color-rose-3)]">
                    {format(month, 'MMMM yyyy', { locale: es })}
                  </h3>
                  <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-sm font-bold opacity-50 mb-2">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                    {days.map(day => {
                      const status = getStatusForDay(day);
                      const customPrice = getCustomPriceForDay(day);
                      const selected = isSelected(day);
                      const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                      
                      let cellClass = "relative aspect-square flex flex-col justify-center items-center rounded-xl md:rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ";
                      let displayPrice = customPrice ? customPrice.price : currentUnit?.price;

                      if (status) {
                        cellClass += "bg-[var(--color-coral)] border-[var(--color-coral)] opacity-80 cursor-not-allowed";
                        displayPrice = undefined;
                      } else if (isPast) {
                        cellClass += "bg-black/20 border-transparent opacity-40 grayscale pointer-events-none";
                      } else if (selected) {
                        cellClass += "bg-[var(--color-rose-3)] border-[var(--color-rose-3)] text-[var(--color-ink)] scale-105 shadow-lg z-10";
                      } else if (customPrice) {
                        // Custom price color: maybe a green tint or just white border
                        cellClass += "bg-[var(--color-ink-2)] border-[var(--color-rose-2)] text-white";
                      } else {
                        cellClass += "bg-white/5 border-white/5 hover:border-white/20 text-white";
                      }

                      return (
                        <div 
                          key={day.toISOString()}
                          className={cellClass}
                          onClick={() => !isPast && handleDateClick(day)}
                          onMouseEnter={() => !isPast && handleMouseEnter(day)}
                        >
                          <span className={`font-bold ${selected ? 'text-[var(--color-ink)]' : ''}`}>{format(day, 'd')}</span>
                          {displayPrice && (
                            <span className={`text-[9px] md:text-[10px] mt-1 tracking-wider ${selected ? 'text-[var(--color-ink)] opacity-80' : customPrice ? 'text-[var(--color-rose-2)]' : 'opacity-50'}`}>
                              ${displayPrice}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 text-[10px] uppercase tracking-widest mt-6 px-4 bg-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--color-coral)] rounded-sm opacity-80"></div>
          <span>Reservado / Bloqueado (Rojo)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-[var(--color-rose-2)] bg-[var(--color-ink-2)] rounded-sm"></div>
          <span>Precio Personalizado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/5 rounded-sm"></div>
          <span>Precio Base</span>
        </div>
      </div>

      {/* Price Edit Modal */}
      <AnimatePresence>
        {isModalOpen && selectionStart && selectionEnd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--color-ink-2)] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-display text-2xl text-white mb-2">Ajustar Precio</h3>
              <p className="text-sm opacity-70 mb-6">
                {format(min([selectionStart, selectionEnd]), "d 'de' MMMM", { locale: es })} al {format(max([selectionStart, selectionEnd]), "d 'de' MMMM", { locale: es })}
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest opacity-70">Nuevo Precio (MXN)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input 
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder={currentUnit?.price.toString()}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:border-[var(--color-rose-3)] outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[var(--color-ink)]/50 p-4 rounded-xl flex items-start gap-3 mt-2">
                  <Info className="w-5 h-5 text-[var(--color-rose-3)] shrink-0" />
                  <p className="text-xs opacity-70 leading-relaxed">
                    Este precio se aplicará a todas las fechas seleccionadas, excepto los días que ya tengan una reserva o bloqueo.
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={handleSavePrices}
                    disabled={!newPrice || isSaving || isResetting}
                    className="w-full bg-[var(--color-rose-3)] text-[var(--color-ink)] font-bold tracking-widest uppercase text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--color-rose-2)] transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    onClick={handleResetPrices}
                    disabled={isSaving || isResetting}
                    className="w-full bg-white/5 border border-white/10 text-white font-bold tracking-widest uppercase text-[10px] py-3 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors mt-2 disabled:opacity-50"
                  >
                    {isResetting ? 'Restableciendo...' : `Regresar al valor por defecto ($${currentUnit?.price})`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
