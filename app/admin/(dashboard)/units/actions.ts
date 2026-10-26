'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { assertSafeIcalUrl } from '@/lib/ical-sync';

export async function updatePrice(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
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
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const id = formData.get('id') as string;
  const icalText = formData.get('icalUrls') as string;

  if (id) {
    const urls = icalText.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    await Promise.all(urls.map((url) => assertSafeIcalUrl(url)));
    await prisma.unit.update({
      where: { id },
      data: { icalUrls: urls }
    });
    revalidatePath('/admin/units');
  }
}

export async function createUnit(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));
  const isWholeHouse = formData.get('isWholeHouse') === 'true';

  if (name && price > 0) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!id) throw new Error('Nombre inválido para generar ID');

    const existing = await prisma.unit.findUnique({ where: { id } });
    if (existing) throw new Error('Ya existe una unidad con ese ID/Nombre');

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
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const id = formData.get('id') as string;

  if (id) {
    try {
      await prisma.unit.delete({
        where: { id }
      });
      revalidatePath('/admin/units');
    } catch (e) {
      console.error('Cannot delete unit with existing bookings', e);
      throw new Error('No se puede eliminar la unidad porque tiene reservas o bloqueos activos.');
    }
  }
}
