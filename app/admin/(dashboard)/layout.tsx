import { AdminShell } from '@/components/admin/admin-shell';
import { signOut } from '@/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
