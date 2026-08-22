import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';

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

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #42242C; padding: 20px;">
        <h1 style="color: #D0496C; text-align: center; font-size: 24px;">Casa Amapa</h1>
        <p style="text-align: center; text-transform: uppercase; letter-spacing: 2px; font-size: 12px;">Detalles de tu Reserva</p>
        
        <div style="background-color: #FCF3F6; padding: 20px; border-radius: 12px; margin-top: 30px;">
          <h2 style="margin-top: 0;">¡Hola ${booking.guestName}!</h2>
          <p>Tu reserva para <strong>${booking.unit.name}</strong> ha sido registrada exitosamente.</p>
          
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>Llegada:</strong></td>
              <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid rgba(0,0,0,0.1);">${new Date(booking.checkIn).toLocaleDateString('es-MX')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>Salida:</strong></td>
              <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid rgba(0,0,0,0.1);">${new Date(booking.checkOut).toLocaleDateString('es-MX')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>Total Estimado:</strong></td>
              <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid rgba(0,0,0,0.1);">$${booking.totalPrice?.toLocaleString('es-MX')} MXN</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.1);"><strong>Anticipo Requerido:</strong></td>
              <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid rgba(0,0,0,0.1);">${booking.depositPercentage}%</td>
            </tr>
          </table>
          
          <p style="margin-top: 30px; font-size: 14px; opacity: 0.8;">Por favor contacta con nosotros para proceder con el pago del anticipo y confirmar tu reserva definitivamente.</p>
        </div>
        
        <p style="text-align: center; margin-top: 30px; font-size: 12px; opacity: 0.6;">
          Casa Amapa<br/>
          Zihuatanejo, Guerrero, México
        </p>
      </div>
    `;

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
