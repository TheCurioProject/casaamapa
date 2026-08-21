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
      <body className="min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)] selection:bg-[var(--color-rose-3)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
