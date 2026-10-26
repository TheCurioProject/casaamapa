import { AdminShell } from '@/components/admin/admin-shell';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/admin/login' });
  };

  return (
    <AdminShell onSignOut={handleSignOut}>
      {children}
    </AdminShell>
  );
}
