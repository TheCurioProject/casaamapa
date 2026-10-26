import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { getInvoiceHtml } from '@/lib/invoice-template';
import { auth } from '@/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Falta bookingId' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { unit: true }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Solo se puede enviar el comprobante de una reserva confirmada.' }, { status: 409 });
    }

    const htmlContent = getInvoiceHtml(booking);
    const settings = await prisma.settings.findUnique({ where: { key: 'default' } });
    const adminEmail = settings?.adminEmail || process.env.ADMIN_EMAIL;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Casa Amapa <reservas@casaamapa.com>',
      to: [booking.guestEmail],
      ...(adminEmail ? { bcc: [adminEmail] } : {}),
      subject: `Invoice de Reserva - Casa Amapa (${booking.unit.name})`,
      html: htmlContent,
    }, { idempotencyKey: `booking-${booking.id}-manual-invoice-${Date.now()}` });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
