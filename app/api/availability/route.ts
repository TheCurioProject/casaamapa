import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { activeBookingWhere } from '@/lib/booking';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apartmentId = searchParams.get('apartmentId');

  if (!apartmentId) {
    return NextResponse.json({ error: 'apartmentId is required' }, { status: 400 });
  }

  try {
    const selectedUnit = await prisma.unit.findUnique({ where: { id: apartmentId } });
    if (!selectedUnit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    let idsToCheck = [selectedUnit.id];

    if (selectedUnit.isWholeHouse) {
      // If booking the whole house, check if ANY subunit or the house itself is booked
      idsToCheck = (await prisma.unit.findMany({ select: { id: true } })).map((unit) => unit.id);
    } else {
      // If booking a subunit, check if the subunit itself OR the whole house is booked
      const wholeHouses = await prisma.unit.findMany({ where: { isWholeHouse: true }, select: { id: true } });
      idsToCheck = [selectedUnit.id, ...wholeHouses.map((unit) => unit.id)];
    }

    const [bookings, blockedDates] = await Promise.all([
      prisma.booking.findMany({
        where: {
          apartmentId: { in: idsToCheck },
          AND: [activeBookingWhere(), { checkOut: { gte: new Date() } }]
        },
        select: { checkIn: true, checkOut: true }
      }),
      prisma.blockedDate.findMany({
        where: {
          apartmentId: { in: idsToCheck },
          endDate: { gte: new Date() }
        },
        select: { startDate: true, endDate: true }
      })
    ]);

    const disabledRanges = [
      ...bookings.map((b) => ({
        from: b.checkIn.toISOString(),
        to: b.checkOut.toISOString(),
      })),
      ...blockedDates.map((b) => {
        const toDate = new Date(b.endDate);
        toDate.setDate(toDate.getDate() + 1);
        return {
          from: b.startDate.toISOString(),
          to: toDate.toISOString(),
        };
      })
    ];

    return NextResponse.json({ disabledRanges }, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
