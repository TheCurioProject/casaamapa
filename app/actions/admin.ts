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

  if (!Number.isInteger(depositPercentage) || depositPercentage < 10 || depositPercentage > 100) {
    throw new Error('Invalid deposit percentage');
  }
  await prisma.settings.upsert({
    where: { key: 'default' },
    update: { depositPercentage, isFullPayment },
    create: { key: 'default', depositPercentage, isFullPayment },
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function updatePassword(data: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const newPassword = data.get('password') as string;
  if (newPassword.length < 12) throw new Error('Password too short');

  const hash = await bcrypt.hash(newPassword, 12);
  
  await prisma.adminUser.update({
    where: { username: 'admin' },
    data: { password: hash }
  });

  return { success: true };
}
