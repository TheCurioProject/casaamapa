'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { sendConfirmationEmail } from '@/app/actions/payments';
import { createPendingBooking } from '@/app/actions/bookings';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

function CheckoutForm({ bookingId, onSuccess }: { bookingId: string, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Ha ocurrido un error');
      setLoading(false);
      return;
    }

    // Process payment (simulated redirect or server handling)
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/es?booking_success=true`,
      },
      redirect: 'if_required', // Handle success here instead of redirecting if possible
    });

    if (confirmError) {
      setError(confirmError.message ?? 'El pago falló');
      setLoading(false);
    } else {
      // Payment succeeded!
      await sendConfirmationEmail(bookingId);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button 
        disabled={!stripe || loading} 
        className="bg-[var(--color-rose-2)] text-[var(--color-cream)] rounded-full px-[2.4em] py-[1em] text-[0.72rem] tracking-[0.28em] uppercase font-medium mt-4 hover:bg-[var(--color-rose-3)] disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Pagar ahora'}
      </button>
    </form>
  );
}

export function StripePayment({ clientSecret, bookingId, chargeAmount, onSuccess }: { clientSecret: string, bookingId: string, chargeAmount: number, onSuccess: () => void }) {
  if (!clientSecret) return <p>Iniciando pago...</p>;

  return (
    <div>
      <p className="mb-4 opacity-80 text-sm">
        Monto a cobrar ahora: <strong>{chargeAmount} MXN</strong>
      </p>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#734a62' } } }}>
        <CheckoutForm bookingId={bookingId} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}
