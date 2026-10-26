import type Stripe from 'stripe';
import { prisma, type ExtTxClient } from '@/lib/db';
import { BookingValidationError, lockAndAssertAvailability } from '@/lib/booking';

function paymentIntentId(paymentIntent: Stripe.PaymentIntent) {
  return paymentIntent.id;
}

function latestCard(paymentIntent: Stripe.PaymentIntent) {
  const charge = typeof paymentIntent.latest_charge === 'object' ? paymentIntent.latest_charge : null;
  const card = charge ? charge.payment_method_details?.card : null;
  return { brand: card?.brand ?? null, last4: card?.last4 ?? null };
}

export function shouldPreserveSettledBooking(bookingStatus: string, paymentIntentStatus: string) {
  return (
    (bookingStatus === 'confirmed' || bookingStatus === 'attention_required') &&
    paymentIntentStatus !== 'succeeded'
  );
}

async function findBooking(tx: ExtTxClient, paymentIntent: Stripe.PaymentIntent) {
  const metadataBookingId = paymentIntent.metadata?.bookingId;
  return tx.booking.findFirst({
    where: {
      OR: [
        ...(metadataBookingId ? [{ id: metadataBookingId }] : []),
        { stripePaymentIntentId: paymentIntent.id },
      ],
    },
    include: { unit: true },
  });
}

export async function applyPaymentIntentState(paymentIntent: Stripe.PaymentIntent) {
  return prisma.$transaction(async (tx) => {
    const booking = await findBooking(tx, paymentIntent);
    if (!booking) throw new Error(`No booking found for PaymentIntent ${paymentIntent.id}`);

    if (booking.stripePaymentIntentId && booking.stripePaymentIntentId !== paymentIntent.id) {
      throw new Error(`PaymentIntent mismatch for booking ${booking.id}`);
    }

    const common = {
      stripePaymentIntentId: paymentIntentId(paymentIntent),
      currency: paymentIntent.currency,
    };

    // Stripe doesn't guarantee event delivery order. Never let a delayed
    // processing/failed event downgrade a booking that already recorded payment.
    if (shouldPreserveSettledBooking(booking.status, paymentIntent.status)) {
      return booking;
    }

    if (paymentIntent.status === 'succeeded') {
      let availabilityConflict: string | null = null;
      try {
        await lockAndAssertAvailability(tx, {
          apartmentId: booking.apartmentId,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          excludeBookingId: booking.id,
        });
      } catch (error) {
        if (!(error instanceof BookingValidationError)) throw error;
        availabilityConflict = error.message;
      }

      const expected = booking.paymentAmountCents ?? paymentIntent.amount;
      const attentionReasons: string[] = [];
      if (availabilityConflict) {
        attentionReasons.push(`Payment succeeded but availability changed: ${availabilityConflict}`);
      }
      if (paymentIntent.amount_received < expected) {
        attentionReasons.push(`Amount received (${paymentIntent.amount_received}) is lower than expected (${expected})`);
      }

      const card = latestCard(paymentIntent);
      if (attentionReasons.length) {
        return tx.booking.update({
          where: { id: booking.id },
          data: {
            ...common,
            status: 'attention_required',
            amountPaidCents: paymentIntent.amount_received,
            paidAt: booking.paidAt ?? new Date(),
            paymentBrand: card.brand,
            paymentLast4: card.last4,
            paymentFailureReason: attentionReasons.join('; '),
          },
          include: { unit: true },
        });
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          ...common,
          status: 'confirmed',
          amountPaidCents: paymentIntent.amount_received,
          paidAt: booking.paidAt ?? new Date(),
          paymentBrand: card.brand,
          paymentLast4: card.last4,
          paymentFailureReason: null,
        },
        include: { unit: true },
      });
    }

    if (paymentIntent.status === 'processing') {
      return tx.booking.update({
        where: { id: booking.id },
        data: { ...common, status: 'processing', expiresAt: null, paymentFailureReason: null },
        include: { unit: true },
      });
    }

    const failed = paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method';
    return tx.booking.update({
      where: { id: booking.id },
      data: {
        ...common,
        ...(failed ? { status: 'payment_failed' } : {}),
        paymentFailureReason:
          paymentIntent.last_payment_error?.message ??
          (paymentIntent.status === 'canceled' ? 'PaymentIntent canceled' : null),
      },
      include: { unit: true },
    });
  }, { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 10_000 });
}

export async function processStripeEvent(event: Stripe.Event, intentOverride?: Stripe.PaymentIntent) {
  const supportedEvents = new Set([
    'payment_intent.succeeded',
    'payment_intent.processing',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
  ]);
  if (!supportedEvents.has(event.type)) return { handled: false as const };
  const paymentIntent = intentOverride ?? (event.data.object as Stripe.PaymentIntent);
  const bookingId = paymentIntent.metadata?.bookingId || null;

  const existing = await prisma.stripeWebhookEvent.findUnique({ where: { id: event.id } });
  if (existing?.processedAt) {
    return { handled: true as const, duplicate: true as const, bookingId: existing.bookingId };
  }

  await prisma.stripeWebhookEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      type: event.type,
      paymentIntentId: paymentIntent.id,
      bookingId,
    },
    update: { error: null },
  });

  try {
    const booking = await applyPaymentIntentState(paymentIntent);
    await prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: { bookingId: booking.id, processedAt: new Date(), error: null },
    });
    return { handled: true as const, duplicate: false as const, booking };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.stripeWebhookEvent.update({ where: { id: event.id }, data: { error: message } });
    throw error;
  }
}
