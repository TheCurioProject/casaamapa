'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getPricesForDateRange(startDate: Date, endDate: Date) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    const prices = await prisma.dailyPrice.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}

export async function setPricesForDates(apartmentId: string, dates: Date[], price: number) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    if (!Number.isInteger(price) || price < 1 || price > 1_000_000 || dates.length < 1 || dates.length > 366) {
      return { success: false, error: 'Precio o rango de fechas no válido.' };
    }
    const unit = await prisma.unit.findUnique({ where: { id: apartmentId }, select: { id: true } });
    if (!unit) return { success: false, error: 'La unidad no existe.' };
    await prisma.$transaction(
      dates.map(date => {
        return prisma.dailyPrice.upsert({
          where: {
            apartmentId_date: {
              apartmentId,
              date,
            },
          },
          update: {
            price,
          },
          create: {
            apartmentId,
            date,
            price,
          },
        });
      })
    );

    revalidatePath('/admin/prices');
    revalidatePath('/admin/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error setting prices:', error);
    return { success: false, error: 'Error al actualizar precios' };
  }
}

export async function deletePricesForDates(apartmentId: string, dates: Date[]) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    if (dates.length < 1 || dates.length > 366) {
      return { success: false, error: 'Rango de fechas no válido.' };
    }
    // Normalize dates to match exactly what is stored in the database
    // We use a transaction of deletes based on the unique compound key
    await prisma.$transaction(
      dates.map(date => {
        return prisma.dailyPrice.deleteMany({
          where: {
            apartmentId,
            date,
          },
        });
      })
    );

    revalidatePath('/admin/prices');
    revalidatePath('/admin/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error deleting prices:', error);
    return { success: false, error: 'Error al restablecer precios' };
  }
}
