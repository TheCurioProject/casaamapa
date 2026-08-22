export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const resolvedParams = await params;
  const { unitId } = resolvedParams;

  try {
    const targetUnit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!targetUnit) {
      return new NextResponse('Unit not found', { status: 404 });
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

    // Fetch manually blocked dates (or imported OTA blocks)
    const blocks = await prisma.blockedDate.findMany({
      where: {
        apartmentId: { in: relatedUnitIds }
      }
    });

    // Generate iCal string
    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Amapa Chacala//Unit Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    // Add bookings
    bookings.forEach(booking => {
      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:booking-${booking.id}@amapachacala.com`);
      icalContent.push(`DTSTAMP:${nowStr}`);
      icalContent.push(`DTSTART;VALUE=DATE:${formatDate(booking.checkIn)}`);
      // iCal DTEND is exclusive, which matches checkOut date conceptually
      icalContent.push(`DTEND;VALUE=DATE:${formatDate(booking.checkOut)}`);
      icalContent.push(`SUMMARY:Amapa Booking (${booking.apartmentId})`);
      icalContent.push('END:VEVENT');
    });

    // Add blocks
    blocks.forEach(block => {
      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:block-${block.id}@amapachacala.com`);
      icalContent.push(`DTSTAMP:${nowStr}`);
      icalContent.push(`DTSTART;VALUE=DATE:${formatDate(block.startDate)}`);
      icalContent.push(`DTEND;VALUE=DATE:${formatDate(block.endDate)}`);
      icalContent.push(`SUMMARY:${block.reason || 'Blocked'} (${block.apartmentId})`);
      icalContent.push('END:VEVENT');
    });

    icalContent.push('END:VCALENDAR');

    const calendarString = icalContent.join('\r\n');

    return new NextResponse(calendarString, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${unitId}-calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error generating iCal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
