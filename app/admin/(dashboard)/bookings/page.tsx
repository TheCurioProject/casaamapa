export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookingActions } from '@/components/admin/booking-actions';
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

      <div className="md:hidden flex flex-col gap-4">
        {bookings.length === 0 ? (
          <div className="p-8 text-center opacity-50 bg-white/5 rounded-2xl border border-white/10">No hay reservas directas aún.</div>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-white/5 border border-white/10 rounded-[20px] p-5 flex flex-col gap-4 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white text-base flex items-center gap-2">
                    {booking.guestName}
                    {booking.isManual && <span className="text-[8px] bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--color-rose-3)]/30">Manual</span>}
                  </p>
                  <p className="opacity-60 text-[10px] uppercase tracking-widest text-white/70 mt-1">{booking.guestEmail}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest ${
                  booking.status === 'confirmed' ? 'bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] border border-[var(--color-rose-3)]/30' : 'bg-white/10 text-white/70'
                }`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="bg-black/20 text-white/80 border border-white/10 px-2 py-1 rounded text-xs font-semibold tracking-wide capitalize">
                  {booking.unit.name}
                </span>
              </div>

              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Fechas</span>
                  <span className="text-xs font-medium text-white/90">
                    {format(new Date(booking.checkIn), 'd MMM', { locale: es })} - {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Registro</span>
                  <span className="text-xs font-medium text-white/90">
                    {format(new Date(booking.createdAt), 'd MMM yyyy', { locale: es })}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-end">
                <BookingActions bookingId={booking.id} isManual={booking.isManual} guestEmail={booking.guestEmail} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10 uppercase tracking-widest text-[10px] opacity-70">
            <tr>
              <th className="px-6 py-4 font-medium">Huésped</th>
              <th className="px-6 py-4 font-medium">Unidad</th>
              <th className="px-6 py-4 font-medium">Fechas</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Fecha Registro</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center opacity-50">No hay reservas directas aún.</td>
              </tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-white flex items-center gap-2">
                          {booking.guestName}
                          {booking.isManual && <span className="text-[9px] bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--color-rose-3)]/30">Manual</span>}
                        </p>
                        <p className="opacity-70 text-xs">{booking.guestEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize">{booking.unit.name}</td>
                  <td className="px-6 py-4">
                    {format(new Date(booking.checkIn), 'd MMM', { locale: es })} - {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] border border-[var(--color-rose-3)]/30' : 'bg-white/10 text-white/70'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 opacity-70">
                    {format(new Date(booking.createdAt), 'd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <BookingActions bookingId={booking.id} isManual={booking.isManual} guestEmail={booking.guestEmail} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
