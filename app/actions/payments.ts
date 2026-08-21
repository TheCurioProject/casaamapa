'use server';

import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import { BookingConfirmationEmail } from '@/components/emails/booking-confirmation';
import { AdminNotificationEmail } from '@/components/emails/admin-notification';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || 'sk_test_dummy') as string, { apiVersion: '2026-07-29.dahlia' as any });
const resend = new Resend((process.env.RESEND_API_KEY || 're_dummy') as string);

export async function createPaymentIntent(amount: number, currency: string = 'mxn') {
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
    });
    
    return { clientSecret: paymentIntent.client_secret, chargeAmount: finalAmount };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { error: 'Failed to initialize payment' };
  }
}

export async function sendConfirmationEmail(bookingId: string) {
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'confirmed' }
    });
    
    if (!booking) throw new Error('Booking not found');

    const settings = await prisma.settings.findFirst();
    const adminEmail = settings?.adminEmail;

    const amountPaid = 0; // We'd ideally track paid amount, but simplifying here
    
    // Correo al cliente
    await resend.emails.send({
      from: 'Casa Amapa <reservas@casaamapa.mx>',
      to: [booking.guestEmail],
      subject: 'Confirmación de reserva - Casa Amapa',
      react: BookingConfirmationEmail({
        guestName: booking.guestName,
        apartmentName: booking.apartmentId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        amount: amountPaid
      }) as React.ReactElement,
    });

    // Correo al administrador
    if (adminEmail) {
      await resend.emails.send({
        from: 'Casa Amapa <reservas@casaamapa.mx>',
        to: [adminEmail],
        subject: `Nueva Reserva Confirmada: ${booking.apartmentId} - Casa Amapa`,
        react: AdminNotificationEmail({
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          apartmentName: booking.apartmentId,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          amount: amountPaid,
          guests: booking.guests
        }) as React.ReactElement,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { error: 'Failed to send confirmation email' };
  }
}
