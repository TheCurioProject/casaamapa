'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download, X, Mail } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

export function BookingSuccessModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const hasSentRef = useRef(false);

  useEffect(() => {
    if (searchParams?.get('booking_success') === 'true') {
      const id = searchParams.get('booking_id');
      setBookingId(id);
      setIsOpen(true);
      document.body.classList.add('modal-open');

      if (id && !hasSentRef.current) {
        hasSentRef.current = true;
        fetch('/api/admin/send-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: id })
        }).catch(err => console.error('Failed to auto-send invoice', err));
      }
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    document.body.classList.remove('modal-open');
    // Clean up URL without reloading
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  const handleResendInvoice = async () => {
    if (!bookingId) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error re-sending invoice:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9990] flex items-center justify-center bg-[rgba(20,8,20,0.6)] backdrop-blur-md p-[var(--spacing-pad-x)]"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-[var(--color-sand)] rounded-3xl p-8 md:p-12 shadow-2xl relative flex flex-col items-center text-center text-[var(--color-ink)]"
          >
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--color-rose-1)]/10 transition-colors"
            >
              <X className="w-6 h-6 text-[var(--color-rose-3)]" />
            </button>

            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-[#4CAF50]/10 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-10 h-10 text-[#4CAF50]" />
            </motion.div>

            <h2 className="font-display text-4xl mb-4">¡Reserva Confirmada!</h2>
            <p className="text-lg opacity-80 mb-8 leading-relaxed">
              Tu pago ha sido procesado exitosamente. Hemos enviado los detalles de tu reserva y el comprobante de pago a tu correo electrónico.
            </p>

            <div className="w-full space-y-4">
              <button
                onClick={handleClose}
                className="w-full bg-[var(--color-ink)] text-[var(--color-sand)] py-4 rounded-full uppercase tracking-widest text-sm font-medium hover:bg-black transition-colors"
              >
                Volver al inicio
              </button>
              
              <button
                onClick={handleResendInvoice}
                disabled={isSending || !bookingId}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full border-2 border-[var(--color-rose-3)] text-[var(--color-rose-3)] uppercase tracking-widest text-sm font-medium hover:bg-[var(--color-rose-3)] hover:text-white transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : sendSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    ¡Enviado!
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Reenviar Invoice
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
