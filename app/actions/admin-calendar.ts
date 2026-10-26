'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { activeBookingWhere, addDays, BookingValidationError, lockAndAssertAvailability } from '@/lib/booking';

export async function createManualBlock(data: { apartmentId: string; startDate: Date; endDate: Date; reason?: string }) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    await prisma.$transaction(async (tx) => {
      await lockAndAssertAvailability(tx, {
        apartmentId: data.apartmentId,
        checkIn: data.startDate,
        checkOut: addDays(data.endDate, 1),
      });

      await tx.blockedDate.create({
        data: {
          apartmentId: data.apartmentId,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason || 'Bloqueo Manual'
        }
      });
    });

    revalidatePath('/admin/calendar');
    revalidatePath('/'); // To update public availability
    return { success: true };
  } catch (error) {
    if (error instanceof BookingValidationError) return { error: error.message };
    console.error('Error creating manual block:', error);
    return { error: 'No se pudo crear el bloqueo.' };
  }
}

export async function removeManualBlock(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
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
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    const booking = await prisma.$transaction(async (tx) => {
      await lockAndAssertAvailability(tx, data);
      const settings = await tx.settings.findUnique({ where: { key: 'default' } });
      const defaultDepositPercentage = settings?.isFullPayment
        ? 100
        : settings?.depositPercentage ?? 50;
      const depositPercentage = data.depositPercentage ?? defaultDepositPercentage;
      if (!Number.isInteger(depositPercentage) || depositPercentage < 0 || depositPercentage > 100) {
        throw new BookingValidationError('El anticipo debe estar entre 0% y 100%.');
      }
      if (data.totalPrice !== undefined && (!Number.isFinite(data.totalPrice) || data.totalPrice < 0)) {
        throw new BookingValidationError('El total de la reserva manual no es válido.');
      }
      return tx.booking.create({
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
          depositPercentage,
          totalPrice: data.totalPrice ?? null,
        },
      });
    }, { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 10_000 });
    revalidatePath('/admin/calendar');
    revalidatePath('/');
    return { success: true, booking };
  } catch (error) {
    if (error instanceof BookingValidationError) return { error: error.message };
    console.error('Error creating manual booking:', error);
    return { error: 'No se pudo crear la reserva manual.' };
  }
}

export async function getAdminCalendarData() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const units = await prisma.unit.findMany({ 
    orderBy: { price: 'asc' },
    include: { dailyPrices: true }
  });
  const bookings = await prisma.booking.findMany({
    where: activeBookingWhere()
  });
  const blockedDates = await prisma.blockedDate.findMany();
  const settings = await prisma.settings.findUnique({ where: { key: 'default' } });
  const manualDepositPercentage = settings?.isFullPayment
    ? 100
    : settings?.depositPercentage ?? 50;

  return { units, bookings, blockedDates, manualDepositPercentage };
}

export async function getBookingById(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
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

type BookingEdits = {
  apartmentId?: string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  idPhotoUrl?: string | null;
  depositPercentage?: number | null;
  totalPrice?: number | null;
};

export async function updateBooking(id: string, data: BookingEdits) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUniqueOrThrow({ where: { id } });
      const apartmentId = data.apartmentId ?? current.apartmentId;
      const checkIn = data.checkIn ? new Date(data.checkIn) : current.checkIn;
      const checkOut = data.checkOut ? new Date(data.checkOut) : current.checkOut;
      await lockAndAssertAvailability(tx, { apartmentId, checkIn, checkOut, excludeBookingId: id });
      return tx.booking.update({
        where: { id },
        data: {
          apartmentId: data.apartmentId,
          checkIn: data.checkIn ? checkIn : undefined,
          checkOut: data.checkOut ? checkOut : undefined,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          idPhotoUrl: data.idPhotoUrl,
          depositPercentage: data.depositPercentage,
          totalPrice: data.totalPrice,
        },
      });
    }, { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 10_000 });
    
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
    revalidatePath('/');
    return { success: true, booking };
  } catch (error) {
    if (error instanceof BookingValidationError) return { error: error.message };
    console.error('Error updating booking:', error);
    return { error: 'No se pudo actualizar la reserva.' };
  }
}
