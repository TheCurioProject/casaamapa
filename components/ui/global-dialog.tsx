'use client';

import { useDialogStore } from '@/store/useDialogStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export function GlobalDialog() {
  const { isOpen, config, loading, close, setLoading } = useDialogStore();

  if (!config) return null;

  const handleConfirm = async () => {
    if (!config.onConfirm) {
      close();
      return;
    }

    try {
      setLoading(true);
      await config.onConfirm();
    } catch (error) {
      console.error('Error in dialog confirmation:', error);
    } finally {
      setLoading(false);
      close();
    }
  };

  const isDanger = config.type === 'danger';
  const isAlert = config.type === 'alert';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && close()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[var(--color-ink-2)] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className="mb-4">
              {isDanger ? (
                <div className="w-16 h-16 rounded-full bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/20 flex items-center justify-center text-[var(--color-coral)]">
                  <AlertCircle className="w-8 h-8" />
                </div>
              ) : isAlert ? (
                <div className="w-16 h-16 rounded-full bg-[var(--color-sand)]/10 border border-[var(--color-sand)]/20 flex items-center justify-center text-[var(--color-sand)]">
                  <Info className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--color-rose-3)]/10 border border-[var(--color-rose-3)]/20 flex items-center justify-center text-[var(--color-rose-3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
            </div>

            <h3 className="font-display text-2xl text-white mb-2">{config.title}</h3>
            <p className="text-sm text-white/70 mb-8 leading-relaxed">
              {config.description}
            </p>

            <div className="flex gap-3 w-full">
              {!isAlert && (
                <button
                  onClick={close}
                  disabled={loading}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {config.cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 py-3 font-bold uppercase tracking-widest text-xs rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  isDanger 
                    ? 'bg-[var(--color-coral)] hover:bg-[var(--color-coral)]/80 text-white' 
                    : 'bg-[var(--color-rose-3)] hover:bg-[var(--color-rose-2)] text-[var(--color-ink)]'
                } disabled:opacity-50`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {config.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
