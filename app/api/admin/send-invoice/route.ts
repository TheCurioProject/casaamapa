import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { getInvoiceHtml } from '@/lib/invoice-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
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

    const htmlContent = getInvoiceHtml(booking);

    const { data, error } = await resend.emails.send({
      from: 'Casa Amapa <reservas@casaamapa.com>',
      to: [booking.guestEmail],
      bcc: ['admin.casaamapa@gmail.com'], // Copia al admin
      subject: `Invoice de Reserva - Casa Amapa (${booking.unit.name})`,
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
