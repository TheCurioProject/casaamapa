'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CheckoutForm({ bookingId }: { bookingId: string }) {
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

    // Process payment
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?booking_success=true&booking_id=${bookingId}`,
      },
      // By using 'always', Stripe will redirect the user upon success.
      // The frontend will intercept 'booking_success=true' on the main layout to show the modal.
      redirect: 'always', 
    });

    if (confirmError) {
      setError(confirmError.message ?? 'El pago falló');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button 
        disabled={!stripe || loading} 
        className="bg-[var(--color-ink)] text-[var(--color-cream)] rounded-full px-[2.4em] py-[1em] text-[0.72rem] tracking-[0.28em] uppercase font-medium mt-4 hover:bg-black disabled:opacity-50 transition-colors"
      >
        {loading ? 'Procesando...' : 'Pagar ahora'}
      </button>
    </form>
  );
}

export function StripePayment({ clientSecret, bookingId, chargeAmount }: { clientSecret: string, bookingId: string, chargeAmount: number }) {
  if (!clientSecret) return <p>Iniciando pago...</p>;
  if (!stripePromise) return <p className="text-red-600">La pasarela de pago no está configurada.</p>;

  return (
    <div>
      <p className="mb-4 opacity-80 text-sm">
        Monto a cobrar ahora: <strong>{chargeAmount.toLocaleString('es-MX')} MXN</strong>
      </p>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#734a62' } } }}>
        <CheckoutForm bookingId={bookingId} />
      </Elements>
    </div>
  );
}
