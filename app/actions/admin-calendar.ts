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
        status: 'confirmed'
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
