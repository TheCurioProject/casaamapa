import '../globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';
import { Calendar, Building, Settings, LogOut } from 'lucide-react';
import { signOut } from '@/auth'; 

export const metadata = {
  title: 'Admin - Casa Amapa',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[var(--color-cream)] flex text-[var(--color-ink)]">
        {/* Sidebar */}
        <aside className="w-64 bg-[var(--color-ink)] text-[var(--color-sand)] flex flex-col fixed inset-y-0 left-0 z-10 rounded-r-[24px] shadow-2xl overflow-y-auto">
          <div className="p-8">
            <Link href="/admin">
              <h1 className="font-display text-3xl tracking-tight text-[var(--color-rose-2)]">Amapa</h1>
              <p className="kicker-light text-[0.6rem] mt-1 tracking-widest uppercase">Admin Panel</p>
            </Link>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--color-rose-1)] transition-colors">
              <Calendar className="w-5 h-5 opacity-70" />
              <span className="text-sm font-medium">Reservas</span>
            </Link>
            <Link href="/admin/units" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--color-rose-1)] transition-colors">
              <Building className="w-5 h-5 opacity-70" />
              <span className="text-sm font-medium">Unidades</span>
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--color-rose-1)] transition-colors">
              <Settings className="w-5 h-5 opacity-70" />
              <span className="text-sm font-medium">Ajustes</span>
            </Link>
          </nav>

          <div className="p-4 mb-4">
            <form action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}>
              <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-[rgba(255,0,0,0.1)] transition-colors">
                <LogOut className="w-5 h-5 opacity-70" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pl-64 min-h-screen">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
