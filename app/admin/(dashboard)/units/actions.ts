'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updatePrice(formData: FormData) {
  const id = formData.get('id') as string;
  const price = Number(formData.get('price'));
  const addStripeCommission = formData.get('addStripeCommission') === 'true';

  if (id && price > 0) {
    await prisma.unit.update({
      where: { id },
      data: { price, addStripeCommission }
    });
    revalidatePath('/admin/units');
  }
}

export async function updateIcalUrls(formData: FormData) {
  const id = formData.get('id') as string;
  const icalText = formData.get('icalUrls') as string;

  if (id) {
    const urls = icalText.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    await prisma.unit.update({
      where: { id },
      data: { icalUrls: urls }
    });
    revalidatePath('/admin/units');
  }
}

export async function createUnit(formData: FormData) {
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));
  const isWholeHouse = formData.get('isWholeHouse') === 'true';
  
  if (name && price > 0) {
    // Generate a simple ID from the name
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await prisma.unit.create({
      data: {
        id,
        name,
        price,
        isWholeHouse
      }
    });
    revalidatePath('/admin/units');
  }
}

export async function deleteUnit(formData: FormData) {
  const id = formData.get('id') as string;
  
  if (id) {
    // Note: in a real scenario we'd need to handle relations (bookings, etc)
    // but Prisma is set to Restrict onDelete, so it will fail if bookings exist.
    try {
      await prisma.unit.delete({
        where: { id }
      });
      revalidatePath('/admin/units');
    } catch (e) {
      console.error('Cannot delete unit with existing bookings', e);
    }
  }
}
