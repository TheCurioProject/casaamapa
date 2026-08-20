'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function updateSettings(data: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const depositPercentage = parseInt(data.get('depositPercentage') as string);
  const isFullPayment = data.get('paymentMode') === 'full';

  const settings = await prisma.settings.findFirst();
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: { depositPercentage, isFullPayment }
    });
  } else {
    await prisma.settings.create({
      data: { depositPercentage, isFullPayment }
    });
  }

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function updatePassword(data: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const newPassword = data.get('password') as string;
  if (newPassword.length < 6) throw new Error('Password too short');

  const hash = await bcrypt.hash(newPassword, 10);
  
  await prisma.adminUser.update({
    where: { username: 'admin' },
    data: { password: hash }
  });

  return { success: true };
}
