import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import ical from 'ical-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const resolvedParams = await params;
  const { unitId } = resolvedParams;

  try {
    const targetUnit = await prisma.unit.findFirst({
      where: { 
        id: {
          equals: unitId,
          mode: 'insensitive'
        }
      },
    });

    if (!targetUnit) {
      return new Response('Unit not found', { status: 404 });
    }

    // CROSS-BLOCKING LOGIC
    // Determine which units' availability affects the requested unit.
    let relatedUnitIds = [unitId];

    if (targetUnit.isWholeHouse) {
      // If requesting the whole house, we must block dates if ANY unit is booked/blocked.
      const allUnits = await prisma.unit.findMany({ select: { id: true } });
      relatedUnitIds = allUnits.map(u => u.id);
    } else {
      // If requesting a specific apartment, we must also block dates if the WHOLE HOUSE is booked/blocked.
      const wholeHouseUnits = await prisma.unit.findMany({
        where: { isWholeHouse: true },
        select: { id: true }
      });
      relatedUnitIds = [...relatedUnitIds, ...wholeHouseUnits.map(u => u.id)];
    }

    // Fetch confirmed bookings
    const bookings = await prisma.booking.findMany({
      where: {
        apartmentId: { in: relatedUnitIds },
        status: { not: 'cancelled' } // Only valid bookings block dates
      }
    });

    // Fetch manually blocked dates (excluding imported OTA blocks to prevent infinite loops)
    const blocks = await prisma.blockedDate.findMany({
      where: {
        apartmentId: { in: relatedUnitIds },
        isOtaBlock: false
      }
    });

    const cal = ical({
      name: `Casa Amapa - ${targetUnit.name}`,
      prodId: { company: 'CasaAmapa', product: 'Calendar', language: 'EN' },
      timezone: 'America/Mexico_City',
      scale: 'GREGORIAN',
      method: 'PUBLISH' as any
    });

    // Add bookings (Web reservations) - adding 1 extra day for cleaning
    bookings.forEach(booking => {
      const checkoutWithCleaning = new Date(booking.checkOut);
      checkoutWithCleaning.setDate(checkoutWithCleaning.getDate() + 1);

      cal.createEvent({
        start: booking.checkIn,
        end: checkoutWithCleaning,
        allDay: true,
        summary: `Reservado`,
        id: `booking-${booking.id}@amapachacala.com`,
      });
    });

    // Add blocks
    blocks.forEach(block => {
      cal.createEvent({
        start: block.startDate,
        end: block.endDate,
        allDay: true,
        summary: block.reason || 'Bloqueado',
        id: `block-${block.id}@amapachacala.com`,
      });
    });

    // Always include a dummy event if calendar is completely empty to prevent strict parsers like Airbnb from rejecting it
    if (bookings.length === 0 && blocks.length === 0) {
      cal.createEvent({
        start: new Date(2020, 0, 1),
        end: new Date(2020, 0, 2),
        allDay: true,
        summary: 'Sincronización de Calendario',
        id: `sync-init-${unitId}@amapachacala.com`,
      });
    }

    const calendarString = cal.toString();

    return new Response(calendarString, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${unitId}-calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': new TextEncoder().encode(calendarString).length.toString()
      }
    });

  } catch (error) {
    console.error('Error generating iCal:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
