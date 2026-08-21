'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        depositPercentage: 50,
        isFullPayment: false,
      }
    });
  }
  return settings;
}

export async function updateSettings(formData: FormData) {
  try {
    const adminEmail = formData.get('adminEmail')?.toString() || null;
    const depositPercentage = parseInt(formData.get('depositPercentage')?.toString() || '50', 10);
    const isFullPayment = formData.get('isFullPayment') === 'on';

    const settings = await prisma.settings.findFirst();

    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: {
          adminEmail,
          depositPercentage,
          isFullPayment,
        }
      });
    } else {
      await prisma.settings.create({
        data: {
          adminEmail,
          depositPercentage,
          isFullPayment,
        }
      });
    }

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { error: 'Failed to update settings' };
  }
}
