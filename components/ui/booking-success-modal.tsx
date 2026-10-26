'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock3, LoaderCircle, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type VerificationState = 'verifying' | 'confirmed' | 'processing' | 'failed';

export function BookingSuccessModal() {
  const searchParams = useSearchParams();
  const shouldOpen = searchParams.get('booking_success') === 'true';
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<VerificationState>('verifying');

  useEffect(() => {
    if (!shouldOpen) return;
    const bookingId = searchParams.get('booking_id');
    const paymentIntentId = searchParams.get('payment_intent');
    const controller = new AbortController();

    async function verify() {
      if (!bookingId || !paymentIntentId) {
        setStatus('failed');
        return;
      }
      try {
        const response = await fetch('/api/payments/reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, paymentIntentId }),
          signal: controller.signal,
        });
        const result = (await response.json()) as { status?: string; paid?: boolean };
        if (!response.ok) setStatus('failed');
        else if (result.paid) setStatus('confirmed');
        else if (result.status === 'processing' || result.status === 'pending') setStatus('processing');
        else setStatus('failed');
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('failed');
      }
    }

    document.body.classList.add('modal-open');
    void verify();
    return () => {
      controller.abort();
      document.body.classList.remove('modal-open');
    };
  }, [searchParams, shouldOpen]);

  const close = () => {
    setDismissed(true);
    document.body.classList.remove('modal-open');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const content = {
    verifying: {
      icon: <LoaderCircle className="w-10 h-10 text-[var(--color-rose-3)] animate-spin" />,
      title: 'Verificando tu pago',
      description: 'Estamos confirmando la operación directamente con Stripe. No cierres esta ventana.',
    },
    confirmed: {
      icon: <CheckCircle className="w-10 h-10 text-[#4CAF50]" />,
      title: '¡Reserva confirmada!',
      description: 'Tu pago fue confirmado, las fechas quedaron bloqueadas y enviaremos el comprobante a tu correo.',
    },
    processing: {
      icon: <Clock3 className="w-10 h-10 text-amber-600" />,
      title: 'Pago en procesamiento',
      description: 'Stripe todavía está procesando el pago. Conservamos tus fechas y te avisaremos por correo al confirmarse.',
    },
    failed: {
      icon: <AlertCircle className="w-10 h-10 text-red-600" />,
      title: 'No pudimos verificar el pago',
      description: 'No realices otro pago. Comunícate con Casa Amapa para que revisemos la operación en Stripe.',
    },
  }[status];

  return (
    <AnimatePresence>
      {shouldOpen && !dismissed && (
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
            className="w-full max-w-lg bg-[var(--color-sand)] rounded-3xl p-8 md:p-12 shadow-2xl relative flex flex-col items-center text-center text-[var(--color-ink)]"
          >
            <button onClick={close} aria-label="Cerrar" className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--color-rose-1)]/10 transition-colors">
              <X className="w-6 h-6 text-[var(--color-rose-3)]" />
            </button>
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6">{content.icon}</div>
            <h2 className="font-display text-4xl mb-4">{content.title}</h2>
            <p className="text-lg opacity-80 mb-8 leading-relaxed">{content.description}</p>
            {status !== 'verifying' && (
              <button onClick={close} className="w-full bg-[var(--color-ink)] text-[var(--color-sand)] py-4 rounded-full uppercase tracking-widest text-sm font-medium hover:bg-black transition-colors">
                Volver al inicio
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
