'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { activeBookingWhere, addDays, BookingValidationError, lockAndAssertAvailability, parseDateOnly, toDateOnly, validateDateRange } from '@/lib/booking';
import { withBookingTransaction } from '@/lib/booking-transaction';
import { plainData } from '@/lib/plain-data';
import { propertyDateKey } from '@/lib/calendar-dates';

function bookingDate(value: Date | string) {
  return parseDateOnly(typeof value === 'string' ? value : toDateOnly(value));
}

function validateManualDetails(data: { guestName?: string; guestEmail?: string; guestPhone?: string; guests?: number; depositPercentage?: number | null; totalPrice?: number | null }) {
  if (data.guestName !== undefined && (data.guestName.trim().length < 2 || data.guestName.trim().length > 120)) {
    throw new BookingValidationError('Escribe el nombre completo del huésped.');
  }
  if (data.guestEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail.trim()) || data.guestEmail.length > 254)) {
    throw new BookingValidationError('Escribe un correo electrónico válido.');
  }
  if (data.guestPhone && (data.guestPhone.trim().length < 7 || data.guestPhone.length > 40)) {
    throw new BookingValidationError('Escribe un teléfono válido.');
  }
  if (data.guests !== undefined && (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > 12)) {
    throw new BookingValidationError('La cantidad de huéspedes no es válida.');
  }
  if (data.depositPercentage != null && (!Number.isInteger(data.depositPercentage) || data.depositPercentage < 0 || data.depositPercentage > 100)) {
    throw new BookingValidationError('El anticipo debe estar entre 0% y 100%.');
  }
  if (data.totalPrice != null && (!Number.isFinite(data.totalPrice) || data.totalPrice < 0)) {
    throw new BookingValidationError('El total de la reserva manual no es válido.');
  }
}

export async function createManualBlock(data: { apartmentId: string; startDate: Date | string; endDate: Date | string; reason?: string }) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    const startDate = bookingDate(data.startDate);
    const endDate = bookingDate(data.endDate);
    validateDateRange(startDate, addDays(endDate, 1));
    await withBookingTransaction(async (tx) => {
      await lockAndAssertAvailability(tx, {
        apartmentId: data.apartmentId,
        checkIn: startDate,
        checkOut: addDays(endDate, 1),
      });

      await tx.blockedDate.create({
        data: {
          apartmentId: data.apartmentId,
          startDate,
          endDate,
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
  checkIn: Date | string;
  checkOut: Date | string;
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
    validateManualDetails(data);
    const checkIn = bookingDate(data.checkIn);
    const checkOut = bookingDate(data.checkOut);
    validateDateRange(checkIn, checkOut);
    const booking = await withBookingTransaction(async (tx) => {
      await lockAndAssertAvailability(tx, { apartmentId: data.apartmentId, checkIn, checkOut });
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
          checkIn,
          checkOut,
          guestName: data.guestName.trim(),
          guestEmail: data.guestEmail?.trim().toLowerCase() || 'admin@manual.com',
          guestPhone: data.guestPhone?.trim() || '',
          guests: data.guests,
          status: 'confirmed',
          isManual: true,
          idPhotoUrl: data.idPhotoUrl || null,
          depositPercentage,
          totalPrice: data.totalPrice ?? null,
        },
      });
    });
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
    revalidatePath('/');
    return { success: true, booking: plainData(booking) };
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

  return plainData({ units, bookings, blockedDates, manualDepositPercentage, today: propertyDateKey() });
}

export async function getBookingById(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { unit: true }
    });
    return { booking: plainData(booking) };
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
    validateManualDetails(data);
    const booking = await withBookingTransaction(async (tx) => {
      const current = await tx.booking.findUniqueOrThrow({ where: { id } });
      const apartmentId = data.apartmentId ?? current.apartmentId;
      const checkIn = data.checkIn ? bookingDate(data.checkIn) : current.checkIn;
      const checkOut = data.checkOut ? bookingDate(data.checkOut) : current.checkOut;
      await lockAndAssertAvailability(tx, { apartmentId, checkIn, checkOut, excludeBookingId: id });
      return tx.booking.update({
        where: { id },
        data: {
          apartmentId: data.apartmentId,
          checkIn: data.checkIn ? checkIn : undefined,
          checkOut: data.checkOut ? checkOut : undefined,
          guestName: data.guestName?.trim(),
          guestEmail: data.guestEmail?.trim().toLowerCase(),
          guestPhone: data.guestPhone?.trim(),
          idPhotoUrl: data.idPhotoUrl,
          depositPercentage: data.depositPercentage,
          totalPrice: data.totalPrice,
        },
      });
    });
    
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
    revalidatePath('/');
    return { success: true, booking: plainData(booking) };
  } catch (error) {
    if (error instanceof BookingValidationError) return { error: error.message };
    console.error('Error updating booking:', error);
    return { error: 'No se pudo actualizar la reserva.' };
  }
}
