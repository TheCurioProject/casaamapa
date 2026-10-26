'use server';

import { prisma } from '@/lib/db';
import {
  BookingValidationError,
  calculateBookingQuote,
  CHECKOUT_HOLD_MINUTES,
  lockAndAssertAvailability,
  parseDateOnly,
  toDateOnly,
  validateStay,
} from '@/lib/booking';
import { getStripe } from '@/lib/stripe';

type CheckoutInput = {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
};

function validateGuest(input: CheckoutInput) {
  const guestName = input.guestName.trim();
  const guestEmail = input.guestEmail.trim().toLowerCase();
  const guestPhone = input.guestPhone.trim();
  if (guestName.length < 2 || guestName.length > 120) {
    throw new BookingValidationError('Escribe el nombre completo del huésped.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) || guestEmail.length > 254) {
    throw new BookingValidationError('Escribe un correo electrónico válido.');
  }
  if (guestPhone.length < 7 || guestPhone.length > 40) {
    throw new BookingValidationError('Escribe un teléfono válido.');
  }
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 12) {
    throw new BookingValidationError('La cantidad de huéspedes no es válida.');
  }
  return { guestName, guestEmail, guestPhone };
}

export async function createCheckout(input: CheckoutInput) {
  try {
    const guest = validateGuest(input);
    const checkIn = parseDateOnly(input.checkIn);
    const checkOut = parseDateOnly(input.checkOut);
    validateStay(checkIn, checkOut);

    const booking = await prisma.$transaction(async (tx) => {
      await lockAndAssertAvailability(tx, {
        apartmentId: input.apartmentId,
        checkIn,
        checkOut,
      });
      const quote = await calculateBookingQuote(tx, input.apartmentId, checkIn, checkOut);
      return tx.booking.create({
        data: {
          apartmentId: input.apartmentId,
          checkIn,
          checkOut,
          ...guest,
          guests: input.guests,
          status: 'pending',
          depositPercentage: quote.depositPercentage,
          totalPrice: quote.totalPrice,
          paymentAmountCents: quote.paymentAmountCents,
          currency: 'mxn',
          expiresAt: new Date(Date.now() + CHECKOUT_HOLD_MINUTES * 60 * 1000),
        },
        include: { unit: true },
      });
    }, { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 10_000 });

    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: booking.paymentAmountCents!,
          currency: booking.currency,
          automatic_payment_methods: { enabled: true },
          receipt_email: booking.guestEmail,
          description: `Reserva Casa Amapa - ${booking.unit.name}`,
          metadata: {
            bookingId: booking.id,
            apartmentId: booking.apartmentId,
            checkIn: toDateOnly(booking.checkIn),
            checkOut: toDateOnly(booking.checkOut),
          },
        },
        { idempotencyKey: `booking-${booking.id}-payment-v1` },
      );

      if (!paymentIntent.client_secret) throw new Error('Stripe did not return a client secret');
      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripePaymentIntentId: paymentIntent.id },
      });

      return {
        success: true as const,
        bookingId: booking.id,
        clientSecret: paymentIntent.client_secret,
        totalPrice: booking.totalPrice ?? 0,
        chargeAmount: (booking.paymentAmountCents ?? 0) / 100,
        depositPercentage: booking.depositPercentage ?? 100,
      };
    } catch (error) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'payment_failed',
          paymentFailureReason: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof BookingValidationError) return { error: error.message };
    console.error('Error creating checkout:', error);
    return { error: 'No se pudo iniciar el pago. Intenta nuevamente.' };
  }
}
