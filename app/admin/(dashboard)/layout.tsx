import { Sidebar } from '@/components/admin/sidebar';
import { signOut } from '@/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/admin/login' });
  };

  return (
    <div className="flex w-full min-h-screen bg-[var(--color-cream)]">
      <Sidebar onSignOut={handleSignOut} />
      <main className="flex-1 pl-72 w-full">
        <div className="p-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
