import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { getInvoiceHtml } from '@/lib/invoice-template';
import { AdminNotificationEmail } from '@/components/emails/admin-notification';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(apiKey);
}

function sender() {
  return process.env.EMAIL_FROM || 'Casa Amapa <reservas@casaamapa.com>';
}

export async function sendBookingNotifications(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { unit: true },
  });
  if (!booking || booking.status !== 'confirmed') return { skipped: true };

  const resend = getResend();
  const errors: string[] = [];

  if (!booking.confirmationEmailSentAt) {
    const response = await resend.emails.send(
      {
        from: sender(),
        to: [booking.guestEmail],
        subject: `Confirmación de reserva y comprobante - Casa Amapa (${booking.unit.name})`,
        html: getInvoiceHtml(booking),
      },
      { idempotencyKey: `booking-${booking.id}-guest-confirmation-v1` },
    );
    if (response.error) errors.push(`Guest email: ${response.error.message}`);
    else {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { confirmationEmailSentAt: new Date() },
      });
    }
  }

  const settings = await prisma.settings.findUnique({ where: { key: 'default' } });
  const adminEmail = settings?.adminEmail || process.env.ADMIN_EMAIL;
  if (adminEmail && !booking.adminNotificationSentAt) {
    const amount = booking.amountPaidCents / 100;
    const response = await resend.emails.send(
      {
        from: sender(),
        to: [adminEmail],
        subject: `Nueva reserva confirmada: ${booking.unit.name} - Casa Amapa`,
        react: AdminNotificationEmail({
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          apartmentName: booking.unit.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          amount,
          guests: booking.guests,
        }),
      },
      { idempotencyKey: `booking-${booking.id}-admin-notification-v1` },
    );
    if (response.error) errors.push(`Admin email: ${response.error.message}`);
    else {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { adminNotificationSentAt: new Date() },
      });
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { notificationError: errors.length ? errors.join('; ') : null },
  });

  if (errors.length) throw new Error(errors.join('; '));
  return { success: true };
}
