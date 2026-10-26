'use server';

import { prisma } from '@/lib/db';
import { activeBookingWhere } from '@/lib/booking';

export async function getApartmentBookings(apartmentId: string) {
  try {
    const selectedUnit = await prisma.unit.findUnique({ where: { id: apartmentId } });
    if (!selectedUnit) return { error: 'El alojamiento no existe.' };
    let idsToCheck = [selectedUnit.id];
    if (selectedUnit.isWholeHouse) {
      idsToCheck = (await prisma.unit.findMany({ select: { id: true } })).map((unit) => unit.id);
    } else {
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

    const mappedBlocks = blockedDates.map(b => ({
      checkIn: b.startDate,
      checkOut: new Date(new Date(b.endDate).getTime() + 24 * 60 * 60 * 1000)
    }));

    return { bookings: [...bookings, ...mappedBlocks] };
  } catch (error) {
    console.error(`Error fetching bookings for ${apartmentId}:`, error);
    return { error: 'Failed to fetch bookings' };
  }
}

export async function getUnits() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { price: 'asc' },
      include: {
        dailyPrices: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
        },
      },
    });
    return { units };
  } catch (error) {
    console.error('Error fetching units:', error);
    return { error: 'Failed to fetch units' };
  }
}
