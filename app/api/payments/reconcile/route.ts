import { after, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { applyPaymentIntentState } from '@/lib/payment-processing';
import { sendBookingNotifications } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { bookingId?: string; paymentIntentId?: string };
    if (!body.bookingId || !body.paymentIntentId) {
      return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
    if (!booking) return NextResponse.json({ status: 'not_found' }, { status: 404 });
    if (booking.stripePaymentIntentId && booking.stripePaymentIntentId !== body.paymentIntentId) {
      return NextResponse.json({ error: 'Payment reference mismatch' }, { status: 403 });
    }

    const intent = await getStripe().paymentIntents.retrieve(body.paymentIntentId, {
      expand: ['latest_charge'],
    });
    if (intent.metadata?.bookingId !== booking.id) {
      return NextResponse.json({ error: 'Payment metadata mismatch' }, { status: 403 });
    }

    const updated = await applyPaymentIntentState(intent);
    if (updated.status === 'confirmed') {
      after(async () => {
        await sendBookingNotifications(updated.id).catch((error) => {
          console.error(`Could not send notifications for booking ${updated.id}:`, error);
        });
      });
    }

    return NextResponse.json({
      status: updated.status,
      paid: updated.status === 'confirmed',
      invoiceSent: Boolean(updated.confirmationEmailSentAt),
    });
  } catch (error) {
    console.error('Payment reconciliation failed:', error);
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
  }
}
