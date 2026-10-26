export const dynamic = 'force-dynamic';
import { getAdminCalendarData } from '@/app/actions/admin-calendar';
import { AdminCalendar } from '@/components/admin/admin-calendar';

export const metadata = {
  title: 'Calendario | Admin - Casa Amapa',
};

import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminCalendarPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const { units, bookings, blockedDates, manualDepositPercentage } = await getAdminCalendarData();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="font-display text-4xl mb-2 text-white">Calendario de Reservas</h1>
        <p className="opacity-70 text-sm">Visualiza la disponibilidad, añade reservas manuales o bloquea fechas por mantenimiento.</p>
      </header>

      <AdminCalendar
        units={units}
        bookings={bookings}
        blockedDates={blockedDates}
        manualDepositPercentage={manualDepositPercentage}
      />
    </div>
  );
}
