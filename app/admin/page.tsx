import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { unit: true },
    take: 10
  });

  const units = await prisma.unit.findMany();

  return (
    <div>
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-[var(--color-ink)]">Panel Principal</h1>
        <p className="opacity-70 text-sm">Resumen de actividad y estado de las reservas recientes.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* KPI Cards */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[rgba(94,58,80,0.1)]">
          <p className="kicker text-[0.6rem] mb-2 opacity-70">Total Reservas</p>
          <p className="font-display text-4xl">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[rgba(94,58,80,0.1)]">
          <p className="kicker text-[0.6rem] mb-2 opacity-70">Ingresos Potenciales</p>
          <p className="font-display text-4xl">
            ${bookings.reduce((acc: any, curr: any) => acc + (curr.unit?.price || 0), 0).toLocaleString()} <span className="text-sm opacity-50">MXN</span>
          </p>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[rgba(94,58,80,0.1)]">
          <p className="kicker text-[0.6rem] mb-2 opacity-70">Unidades Activas</p>
          <p className="font-display text-4xl">{units.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-[rgba(94,58,80,0.1)] overflow-hidden">
        <div className="p-6 border-b border-[rgba(94,58,80,0.1)] flex justify-between items-center">
          <h2 className="font-display text-2xl">Últimas Reservas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[rgba(94,58,80,0.02)] border-b border-[rgba(94,58,80,0.1)] opacity-70 uppercase tracking-widest text-[0.65rem] font-medium">
              <tr>
                <th className="px-6 py-4">Huésped</th>
                <th className="px-6 py-4">Unidad</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(94,58,80,0.05)]">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center opacity-50">No hay reservas recientes.</td>
                </tr>
              ) : bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-[rgba(94,58,80,0.02)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--color-ink)]">{b.guestName}</div>
                    <div className="opacity-60 text-xs mt-1">{b.guestEmail}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--color-rose-3)]">{b.unit?.name || b.apartmentId}</td>
                  <td className="px-6 py-4 opacity-80">{new Date(b.checkIn).toLocaleDateString('es-MX')}</td>
                  <td className="px-6 py-4 opacity-80">{new Date(b.checkOut).toLocaleDateString('es-MX')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[0.65rem] tracking-wider uppercase font-medium ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
