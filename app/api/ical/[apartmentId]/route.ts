import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

function formatICalDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { apartmentId } = resolvedParams;

    // Obtener reservas de esta unidad y de Amapa (si es sub-unidad) o de todas (si es Amapa)
    let idsToCheck = [apartmentId];
    if (apartmentId === 'amapa') {
      idsToCheck = ['amapa', 'tierra', 'aire', 'agua'];
    } else {
      idsToCheck = [apartmentId, 'amapa'];
    }

    const bookings = await prisma.booking.findMany({
      where: {
        apartmentId: { in: idsToCheck },
        status: { in: ['confirmed', 'pending'] },
      },
    });

    let icalContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Casa Amapa//Booking System//ES\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n`;

    bookings.forEach((booking: any) => {
      icalContent += `BEGIN:VEVENT\r\n`;
      icalContent += `UID:${booking.id}@casaamapa.com\r\n`;
      icalContent += `DTSTAMP:${formatICalDate(booking.createdAt)}\r\n`;
      icalContent += `DTSTART;VALUE=DATE:${formatICalDate(booking.checkIn).substring(0, 8)}\r\n`;
      icalContent += `DTEND;VALUE=DATE:${formatICalDate(booking.checkOut).substring(0, 8)}\r\n`;
      icalContent += `SUMMARY:Reserva - ${booking.guestName}\r\n`;
      icalContent += `STATUS:CONFIRMED\r\n`;
      icalContent += `END:VEVENT\r\n`;
    });

    icalContent += `END:VCALENDAR`;

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="amapa-${apartmentId}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating iCal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
