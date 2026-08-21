export const dynamic = 'force-dynamic';
import { getAdminCalendarData } from '@/app/actions/admin-calendar';
import { AdminCalendar } from '@/components/admin/admin-calendar';

export const metadata = {
  title: 'Calendario | Admin - Casa Amapa',
};

export default async function AdminCalendarPage() {
  const { units, bookings, blockedDates } = await getAdminCalendarData();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="font-display text-4xl mb-2 text-[var(--color-ink)]">Calendario de Reservas</h1>
        <p className="opacity-70">Visualiza la disponibilidad, añade reservas manuales o bloquea fechas por mantenimiento.</p>
      </div>

      <AdminCalendar 
        units={units} 
        bookings={bookings} 
        blockedDates={blockedDates} 
      />
    </div>
  );
}
