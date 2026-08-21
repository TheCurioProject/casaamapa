'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function checkAvailability(apartmentId: string, startDate: Date, endDate: Date) {
  try {
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        apartmentId,
        status: { in: ['pending', 'confirmed'] },
        AND: [
          { checkIn: { lt: endDate } },
          { checkOut: { gt: startDate } }
        ]
      }
    });

    return { available: overlappingBookings.length === 0, overlapping: overlappingBookings };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { error: 'Failed to check availability' };
  }
}

export async function createPendingBooking(data: {
  apartmentId: string;
  checkIn: Date;
  checkOut: Date;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
}) {
  try {
    const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Determine which units to check for overlaps
      let idsToCheck = [data.apartmentId];
      if (data.apartmentId === 'amapa') {
        idsToCheck = ['amapa', 'tierra', 'aire', 'agua'];
      } else {
        idsToCheck = [data.apartmentId, 'amapa'];
      }

      // Check overlapping bookings
      const overlapping = await tx.booking.findFirst({
        where: {
          apartmentId: { in: idsToCheck },
          status: { in: ['pending', 'confirmed'] },
          AND: [
            { checkIn: { lt: data.checkOut } },
            { checkOut: { gt: data.checkIn } }
          ]
        }
      });

      if (overlapping) {
        throw new Error('overlap');
      }

      // Create the booking
      return await tx.booking.create({
        data: {
          ...data,
          status: 'pending'
        }
      });
    });

    revalidatePath('/');
    return { success: true, booking };
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.message === 'overlap' || err.code === 'P2010') {
      return { error: 'Las fechas seleccionadas ya no están disponibles.' };
    }
    console.error('Error creating booking:', error);
    return { error: 'Ocurrió un error al procesar la reserva.' };
  }
}

export async function getApartmentBookings(apartmentId: string) {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        apartmentId,
        status: { in: ['pending', 'confirmed'] },
        checkOut: { gte: new Date() } // Sólo reservas actuales y futuras
      },
      select: {
        checkIn: true,
        checkOut: true,
      }
    });

    return { bookings };
  } catch (error) {
    console.error(`Error fetching bookings for ${apartmentId}:`, error);
    return { error: 'Failed to fetch bookings' };
  }
}

export async function getUnits() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { price: 'asc' }
    });
    return { units };
  } catch (error) {
    console.error('Error fetching units:', error);
    return { error: 'Failed to fetch units' };
  }
}
