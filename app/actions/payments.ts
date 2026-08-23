'use server';

import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import { BookingConfirmationEmail } from '@/components/emails/booking-confirmation';
import { AdminNotificationEmail } from '@/components/emails/admin-notification';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || 'sk_test_dummy') as string, { apiVersion: '2026-07-29.dahlia' as any });
const resend = new Resend((process.env.RESEND_API_KEY || 're_dummy') as string);

export async function createPaymentIntent(amount: number, currency: string = 'mxn', bookingId?: string) {
  try {
    const settings = await prisma.settings.findFirst();
    const isFullPayment = settings?.isFullPayment ?? false;
    const depositPercentage = settings?.depositPercentage ?? 50;

    let finalAmount = amount;
    if (!isFullPayment) {
      finalAmount = Math.round(amount * (depositPercentage / 100));
    }

    // Stripe expects amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount * 100,
      currency,
      automatic_payment_methods: { enabled: true },
      ...(bookingId && { metadata: { bookingId } })
    });
    
    return { clientSecret: paymentIntent.client_secret, chargeAmount: finalAmount };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { error: 'Failed to initialize payment' };
  }
}

// sendConfirmationEmail fue removido porque ahora es manejado de forma segura
// por el webhook de Stripe en app/api/webhooks/stripe/route.ts
