'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getSettings() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  return prisma.settings.upsert({
    where: { key: 'default' },
    update: {},
    create: { key: 'default', depositPercentage: 50, isFullPayment: false },
  });
}

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  try {
    const adminEmail = formData.get('adminEmail')?.toString() || null;
    const depositPercentage = parseInt(formData.get('depositPercentage')?.toString() || '50', 10);
    const isFullPayment = formData.get('paymentMode') === 'full';
    if (!Number.isInteger(depositPercentage) || depositPercentage < 10 || depositPercentage > 100) {
      return { error: 'El porcentaje debe estar entre 10 y 100.' };
    }
    if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      return { error: 'El correo del administrador no es válido.' };
    }

    await prisma.settings.upsert({
      where: { key: 'default' },
      update: { adminEmail, depositPercentage, isFullPayment },
      create: { key: 'default', adminEmail, depositPercentage, isFullPayment },
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { error: 'Failed to update settings' };
  }
}
