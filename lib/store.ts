import { create } from 'zustand';

interface BookingStore {
  isOpen: boolean;
  openBooking: () => void;
  closeBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  isOpen: false,
  openBooking: () => set({ isOpen: true }),
  closeBooking: () => set({ isOpen: false }),
}));
