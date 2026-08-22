export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BookingsListClient } from '@/components/admin/bookings-list-client';
import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Reservas | Admin - Casa Amapa',
};

export default async function AdminBookingsPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { unit: true }
  });

  return (
    <div className="text-[var(--color-sand)] max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[var(--color-rose-3)]" />
          Reservas
        </h1>
        <p className="opacity-70 text-sm">Gestiona y revisa todas las reservas directas.</p>
      </header>

      <Suspense fallback={<div className="p-8 text-center opacity-50">Cargando reservas...</div>}>
        <BookingsListClient bookings={bookings} />
      </Suspense>
    </div>
  );
}
