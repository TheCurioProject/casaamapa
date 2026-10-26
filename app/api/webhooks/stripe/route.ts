import { after, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import { processStripeEvent } from '@/lib/payment-processing';
import { sendBookingNotifications } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  let webhookSecret: string;
  try {
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  try {
    let expandedIntent: Stripe.PaymentIntent | undefined;
    if (event.type.startsWith('payment_intent.')) {
      const snapshot = event.data.object as Stripe.PaymentIntent;
      expandedIntent = await stripe.paymentIntents.retrieve(snapshot.id, { expand: ['latest_charge'] });
    }
    const result = await processStripeEvent(event, expandedIntent);
    const booking = 'booking' in result ? result.booking : null;
    const duplicateBookingId = 'bookingId' in result ? result.bookingId : null;
    const bookingId = booking?.id ?? duplicateBookingId;

    if ((booking?.status === 'confirmed' || duplicateBookingId) && bookingId) {
      after(async () => {
        await sendBookingNotifications(bookingId).catch((error) => {
          console.error(`Could not send notifications for booking ${bookingId}:`, error);
        });
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Stripe event ${event.id} processing failed:`, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
