import { prisma } from '@/lib/db';
import { CHECKOUT_HOLD_MINUTES } from '@/lib/booking';
import { getStripe } from '@/lib/stripe';
import { applyPaymentIntentState } from '@/lib/payment-processing';
import { sendBookingNotifications } from '@/lib/notifications';

export async function reconcilePayments() {
  const stripe = getStripe();
  const now = new Date();
  const legacyCutoff = new Date(now.getTime() - CHECKOUT_HOLD_MINUTES * 60 * 1000);
  const candidates = await prisma.booking.findMany({
    where: {
      OR: [
        { status: 'processing' },
        { status: 'pending', expiresAt: { lte: now } },
        { status: 'pending', expiresAt: null, createdAt: { lte: legacyCutoff } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const stats = { checked: 0, confirmed: 0, processing: 0, expired: 0, errors: 0, notificationsRetried: 0 };
  for (const booking of candidates) {
    stats.checked += 1;
    try {
      if (!booking.stripePaymentIntentId) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'expired', paymentFailureReason: 'Checkout expired before PaymentIntent was linked' },
        });
        stats.expired += 1;
        continue;
      }

      const intent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId, {
        expand: ['latest_charge'],
      });
      if (intent.status === 'succeeded' || intent.status === 'processing') {
        const updated = await applyPaymentIntentState(intent);
        if (updated.status === 'confirmed') {
          stats.confirmed += 1;
          await sendBookingNotifications(updated.id).catch((error) => {
            console.error(`Notification retry failed for booking ${updated.id}:`, error);
          });
        } else stats.processing += 1;
        continue;
      }

      if (intent.status !== 'canceled') {
        await stripe.paymentIntents.cancel(intent.id).catch((error) => {
          console.error(`Could not cancel expired PaymentIntent ${intent.id}:`, error);
        });
      }
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'expired', paymentFailureReason: `Checkout expired with Stripe status ${intent.status}` },
      });
      stats.expired += 1;
    } catch (error) {
      stats.errors += 1;
      console.error(`Payment reconciliation failed for booking ${booking.id}:`, error);
    }
  }

  const unsent = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      OR: [{ confirmationEmailSentAt: null }, { adminNotificationSentAt: null }],
    },
    select: { id: true },
    take: 50,
  });
  for (const booking of unsent) {
    try {
      await sendBookingNotifications(booking.id);
      stats.notificationsRetried += 1;
    } catch (error) {
      stats.errors += 1;
      console.error(`Notification reconciliation failed for booking ${booking.id}:`, error);
    }
  }

  return stats;
}
