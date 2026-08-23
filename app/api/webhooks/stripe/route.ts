import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import { BookingConfirmationEmail } from '@/components/emails/booking-confirmation';
import { AdminNotificationEmail } from '@/components/emails/admin-notification';
import { getInvoiceHtml } from '@/lib/invoice-template';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || 'sk_test_dummy') as string, {
  apiVersion: '2026-07-29.dahlia' as any,
});

const resend = new Resend((process.env.RESEND_API_KEY || 're_dummy') as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook secret is not set in environment variables.' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No stripe signature found.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      console.error('No bookingId found in payment intent metadata.');
      return NextResponse.json({ error: 'No bookingId found in payment intent metadata.' }, { status: 400 });
    }

    try {
      // 1. Marcar reserva como confirmada (esto automáticamente bloquea las fechas)
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'confirmed' },
        include: { unit: true }
      });

      if (!booking) {
        throw new Error('Booking not found in database.');
      }

      const settings = await prisma.settings.findFirst();
      const adminEmail = settings?.adminEmail;
      
      const amountPaid = paymentIntent.amount / 100;

      // 2. Generar Invoice en HTML para el correo del huésped
      const invoiceHtml = getInvoiceHtml(booking as any); // using cast because of type differences potentially

      // 3. Enviar Invoice/Confirmación al cliente
      await resend.emails.send({
        from: 'Casa Amapa <reservas@casaamapa.mx>',
        to: [booking.guestEmail],
        subject: `Confirmación de reserva e Invoice - Casa Amapa (${booking.unit.name})`,
        html: invoiceHtml, // Mandamos el invoice como HTML en vez de React Component
      });

      // 4. Enviar notificación y copia al Admin
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

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return NextResponse.json({ error: 'Error processing webhook event' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
