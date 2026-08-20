'use client';

import { useBookingStore } from '@/lib/store';

export function FAB() {
  const openBooking = useBookingStore(state => state.openBooking);

  return (
    <button 
      className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[90] bg-[var(--color-rose-2)] text-[var(--color-cream)] text-[0.62rem] tracking-[0.26em] uppercase px-[2em] py-[0.9em] rounded-full flex md:hidden items-center gap-[12px] shadow-[0_8px_30px_rgba(168,85,64,0.3)] transition-all duration-300 hover:bg-[var(--color-rose-3)] hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(168,85,64,0.4)]"
      onClick={openBooking}
      aria-label="Reservar en Casa Amapa"
    >
      Reservar
    </button>
  );
}
