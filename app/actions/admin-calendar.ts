'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createManualBlock(data: { apartmentId: string; startDate: Date; endDate: Date; reason?: string }) {
  try {
    await prisma.blockedDate.create({
      data: {
        apartmentId: data.apartmentId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || 'Bloqueo Manual'
      }
    });
    revalidatePath('/admin/calendar');
    revalidatePath('/'); // To update public availability
    return { success: true };
  } catch (error) {
    console.error('Error creating manual block:', error);
    return { error: 'No se pudo crear el bloqueo.' };
  }
}

export async function removeManualBlock(id: string) {
  try {
    await prisma.blockedDate.delete({
      where: { id }
    });
    revalidatePath('/admin/calendar');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error removing manual block:', error);
    return { error: 'No se pudo eliminar el bloqueo.' };
  }
}

export async function createManualBooking(data: {
  apartmentId: string;
  checkIn: Date;
  checkOut: Date;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guests: number;
  idPhotoUrl?: string;
  depositPercentage?: number;
  totalPrice?: number;
}) {
  try {
    const booking = await prisma.booking.create({
      data: {
        apartmentId: data.apartmentId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guestName: data.guestName,
        guestEmail: data.guestEmail || 'admin@manual.com',
        guestPhone: data.guestPhone || '',
        guests: data.guests,
        status: 'confirmed',
        isManual: true,
        idPhotoUrl: data.idPhotoUrl || null,
        depositPercentage: data.depositPercentage || null,
        totalPrice: data.totalPrice || null
      }
    });
    revalidatePath('/admin/calendar');
    revalidatePath('/');
    return { success: true, booking };
  } catch (error) {
    console.error('Error creating manual booking:', error);
    return { error: 'No se pudo crear la reserva manual.' };
  }
}

export async function getAdminCalendarData() {
  const [units, bookings, blockedDates] = await Promise.all([
    prisma.unit.findMany({ orderBy: { price: 'asc' } }),
    prisma.booking.findMany({
      where: { status: { in: ['pending', 'confirmed'] } }
    }),
    prisma.blockedDate.findMany()
  ]);

  return { units, bookings, blockedDates };
}

export async function getBookingById(id: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { unit: true }
    });
    return { booking };
  } catch (error) {
    console.error('Error fetching booking:', error);
    return { error: 'No se pudo cargar la reserva.' };
  }
}

export async function updateBooking(id: string, data: any) {
  try {
    // Check overlap if dates are updated
    if (data.checkIn && data.checkOut && data.apartmentId) {
      let idsToCheck = [data.apartmentId];
      if (data.apartmentId === 'amapa') {
        idsToCheck = ['amapa', 'tierra', 'aire', 'agua'];
      } else {
        idsToCheck = [data.apartmentId, 'amapa'];
      }

      const overlapping = await prisma.booking.findFirst({
        where: {
          id: { not: id }, // ignore current booking
          apartmentId: { in: idsToCheck },
          status: { in: ['pending', 'confirmed'] },
          AND: [
            { checkIn: { lt: new Date(data.checkOut) } },
            { checkOut: { gt: new Date(data.checkIn) } }
          ]
        }
      });
      if (overlapping) return { error: 'Las fechas seleccionadas se solapan con otra reserva existente.' };
    }

    const booking = await prisma.booking.update({
      where: { id },
      data
    });
    
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
    revalidatePath('/');
    return { success: true, booking };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { error: 'No se pudo actualizar la reserva.' };
  }
}
