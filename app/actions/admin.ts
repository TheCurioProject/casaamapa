'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

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
