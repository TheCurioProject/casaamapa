import { create } from 'zustand';

interface LoaderState {
  isOpen: boolean;
  text: string;
  progress: number;
  showLoader: (text?: string) => void;
  hideLoader: () => void;
  setProgress: (progress: number) => void;
}

export const useLoaderStore = create<LoaderState>((set) => ({
  isOpen: false,
  text: 'Cargando...',
  progress: 0,
  showLoader: (text = 'Cargando...') => set({ isOpen: true, text, progress: 0 }),
  hideLoader: () => set({ isOpen: false, progress: 0 }),
  setProgress: (progress) => set({ progress }),
}));
