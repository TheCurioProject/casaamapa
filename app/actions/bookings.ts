'use server';

import { prisma, ExtTxClient } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function cleanupExpiredPendingBookings() {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const result = await prisma.booking.deleteMany({
      where: {
        status: 'pending',
        createdAt: { lt: fifteenMinsAgo }
      }
    });
    if (result.count > 0) {
      revalidatePath('/');
      revalidatePath('/admin/calendar');
      revalidatePath('/admin/bookings');
    }
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error('Error cleaning up expired bookings:', error);
    return { error: 'Failed to clean up bookings' };
  }
}

export async function checkAvailability(apartmentId: string, startDate: Date, endDate: Date) {
  try {
    await cleanupExpiredPendingBookings();

    let idsToCheck = [apartmentId];
    if (apartmentId === 'amapa') {
      idsToCheck = ['amapa', 'tierra', 'aire', 'agua'];
    } else {
      idsToCheck = [apartmentId, 'amapa'];
    }

    const [overlappingBookings, overlappingBlocks] = await Promise.all([
      prisma.booking.findMany({
        where: {
          apartmentId: { in: idsToCheck },
          status: { in: ['pending', 'confirmed'] },
          AND: [
            { checkIn: { lt: endDate } },
            { checkOut: { gt: startDate } }
          ]
        }
      }),
      prisma.blockedDate.findMany({
        where: {
          apartmentId: { in: idsToCheck },
          AND: [
            { startDate: { lt: endDate } },
            { endDate: { gte: startDate } } // blocks are inclusive, so gt or gte depends on logic, use gte to be safe
          ]
        }
      })
    ]);

    return { available: overlappingBookings.length === 0 && overlappingBlocks.length === 0, overlapping: [...overlappingBookings, ...overlappingBlocks] };
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
  totalPrice?: number;
}) {
  try {
    await cleanupExpiredPendingBookings();

    const booking = await prisma.$transaction(async (tx: ExtTxClient) => {
      let idsToCheck = [data.apartmentId];
      if (data.apartmentId === 'amapa') {
        idsToCheck = ['amapa', 'tierra', 'aire', 'agua'];
      } else {
        idsToCheck = [data.apartmentId, 'amapa'];
      }

      const [overlappingBooking, overlappingBlock] = await Promise.all([
        tx.booking.findFirst({
          where: {
            apartmentId: { in: idsToCheck },
            status: { in: ['pending', 'confirmed'] },
            AND: [
              { checkIn: { lt: data.checkOut } },
              { checkOut: { gt: data.checkIn } }
            ]
          }
        }),
        tx.blockedDate.findFirst({
          where: {
            apartmentId: { in: idsToCheck },
            AND: [
              { startDate: { lt: data.checkOut } },
              { endDate: { gte: data.checkIn } }
            ]
          }
        })
      ]);

      if (overlappingBooking || overlappingBlock) {
        throw new Error('overlap');
      }

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
    await cleanupExpiredPendingBookings();

    const isWholeHouseReq = apartmentId === 'amapa';
    
    let idsToCheck = [apartmentId];
    if (isWholeHouseReq) {
      idsToCheck = ['amapa', 'tierra', 'aire', 'agua'];
    } else {
      idsToCheck = [apartmentId, 'amapa'];
    }

    const [bookings, blockedDates] = await Promise.all([
      prisma.booking.findMany({
        where: {
          apartmentId: { in: idsToCheck },
          status: { in: ['pending', 'confirmed'] },
          checkOut: { gte: new Date() }
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
      orderBy: { price: 'asc' }
    });
    return { units };
  } catch (error) {
    console.error('Error fetching units:', error);
    return { error: 'Failed to fetch units' };
  }
}
