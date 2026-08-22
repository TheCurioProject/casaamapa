import { create } from 'zustand';

export type DialogConfig = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'alert' | 'confirm' | 'danger';
  onConfirm?: () => Promise<void> | void;
};

type DialogState = {
  isOpen: boolean;
  config: DialogConfig | null;
  loading: boolean;
  alert: (config: Omit<DialogConfig, 'onConfirm' | 'cancelText'>) => void;
  confirm: (config: DialogConfig) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
};

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  config: null,
  loading: false,
  alert: (config) => set({ 
    isOpen: true, 
    config: { ...config, type: config.type || 'alert', confirmText: config.confirmText || 'Aceptar' },
    loading: false
  }),
  confirm: (config) => set({ 
    isOpen: true, 
    config: { 
      ...config, 
      type: config.type || 'confirm', 
      confirmText: config.confirmText || 'Confirmar',
      cancelText: config.cancelText || 'Cancelar'
    },
    loading: false
  }),
  close: () => set({ isOpen: false, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
