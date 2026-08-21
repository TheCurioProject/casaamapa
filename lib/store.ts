import { create } from 'zustand';

interface BookingStore {
  isOpen: boolean;
  preselectedUnit: string | null;
  openBooking: (unitId?: string) => void;
  closeBooking: () => void;
  
  isAptModalOpen: boolean;
  setAptModalOpen: (isOpen: boolean) => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  isOpen: false,
  preselectedUnit: null,
  openBooking: (unitId?: string) => set({ isOpen: true, preselectedUnit: unitId || null }),
  closeBooking: () => set({ isOpen: false, preselectedUnit: null }),
  
  isAptModalOpen: false,
  setAptModalOpen: (isOpen: boolean) => set({ isAptModalOpen: isOpen }),
}));
