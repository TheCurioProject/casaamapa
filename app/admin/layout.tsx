import '../globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';
import { Calendar, Building, Settings, LogOut } from 'lucide-react';
import { signOut } from '@/auth'; 

export const metadata = {
  title: 'Admin - Casa Amapa',
  robots: 'noindex, nofollow',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
};

import { GlobalDialog } from '@/components/ui/global-dialog';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-[100dvh] bg-[var(--color-cream)] text-[var(--color-ink)] selection:bg-[var(--color-rose-3)] selection:text-white">
        {children}
        <GlobalDialog />
      </body>
    </html>
  );
}
