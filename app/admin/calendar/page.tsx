import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminCalendarPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const units = await prisma.unit.findMany();
  const bookings = await prisma.booking.findMany({
    include: { unit: true }
  });

  // To build a truly interactive full-calendar in the future (like react-big-calendar),
  // we would load it here on a Client Component. For now, we list the upcoming timeline.

  return (
    <div>
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-[var(--color-ink)]">Calendario Maestro</h1>
        <p className="opacity-70 text-sm">Vista general de disponibilidad y reservas para todas las unidades.</p>
      </header>
      
      <div className="bg-white rounded-[24px] p-8 shadow-sm border border-[rgba(94,58,80,0.1)]">
        <p className="opacity-70 mb-8">Esta sección integrará una vista de grilla (estilo Cloudbeds) para administrar las fechas de Tierra, Aire, Agua y Amapa. Próximamente se conectará con el arrastrar-y-soltar (Drag & Drop).</p>

        <div className="space-y-6">
          {units.map((unit: any) => {
            const unitBookings = bookings.filter((b: any) => b.apartmentId === unit.id);
            return (
              <div key={unit.id} className="border border-[rgba(94,58,80,0.1)] rounded-2xl p-6">
                <h2 className="font-display text-2xl mb-4 flex items-center justify-between">
                  {unit.name} 
                  <span className="text-sm opacity-60 bg-[rgba(94,58,80,0.05)] px-3 py-1 rounded-full">
                    ${unit.price.toLocaleString()} MXN / Noche
                  </span>
                </h2>
                
                {unitBookings.length > 0 ? (
                  <div className="grid gap-3">
                    {unitBookings.map((b: any) => (
                      <div key={b.id} className="flex justify-between items-center bg-[rgba(94,58,80,0.02)] p-4 rounded-xl">
                        <div>
                          <p className="font-medium text-sm">{b.guestName}</p>
                          <p className="text-xs opacity-60">{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[0.65rem] tracking-wider uppercase font-medium ${
                          b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          b.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm opacity-50">Sin reservas próximas.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
