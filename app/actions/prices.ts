'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPricesForDateRange(startDate: Date, endDate: Date) {
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
  try {
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
