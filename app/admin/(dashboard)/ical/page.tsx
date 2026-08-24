export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Link as LinkIcon, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { IcalSyncButton } from '@/components/admin/ical-sync-button';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata = {
  title: 'iCal Sync | Admin - Casa Amapa',
};

export default async function AdminIcalPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const logs = await prisma.syncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50 // Show last 50 logs max
  });

  return (
    <div className="text-[var(--color-sand)] max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-white flex items-center gap-3">
          <LinkIcon className="w-8 h-8 text-[var(--color-rose-3)]" />
          Sincronización iCal
        </h1>
        <p className="opacity-70 text-sm">Gestiona la conexión con Airbnb, Booking.com y otras OTAs.</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 mb-8">
        <div className="flex items-center gap-4 mb-6 text-[var(--color-rose-3)]">
          <LinkIcon className="w-8 h-8" />
          <h2 className="font-display text-2xl text-white">Estado de Conexión</h2>
        </div>

        <div className="bg-[var(--color-ink-2)]/30 border border-white/5 rounded-2xl p-6 mb-8">
          <p className="text-sm opacity-80 leading-relaxed mb-4">
            Amapa utiliza un sistema de bloqueo cruzado. Cuando importas el calendario de Airbnb de <strong>Tierra</strong>, automáticamente bloqueamos esas fechas para <strong>Tierra</strong> y para la <strong>Casa Completa</strong>. De la misma forma, las reservas de la Casa Completa bloquearán todos los departamentos individuales.
          </p>
          <div className="flex items-start gap-3 bg-[var(--color-coral)]/10 text-[var(--color-coral)] p-4 rounded-xl border border-[var(--color-coral)]/20 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Asegúrate de pegar correctamente las URLs de importación en la pestaña de <strong>Unidades</strong> para cada departamento. Esta página fuerza la actualización manual.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-2xl">
          <RefreshCw className="w-12 h-12 text-white/30 mb-6" />
          <h3 className="text-xl font-medium mb-2">Sincronizar Manualmente</h3>
          <p className="text-sm opacity-50 mb-8 text-center max-w-sm">Pulsa el botón para descargar los calendarios actualizados de todas las OTAs configuradas y aplicar los bloqueos.</p>
          
          <IcalSyncButton />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[24px] p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 text-white/50">
            <Clock className="w-6 h-6" />
            <h2 className="font-display text-2xl text-white">Registro de Actividad</h2>
          </div>
          <span className="text-xs opacity-50">Los registros se eliminan automáticamente tras 30 días.</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 opacity-50 text-sm">
            No hay registros de sincronización recientes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 opacity-60">
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 pr-4 whitespace-nowrap opacity-70">
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider ${
                        log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 
                        log.status === 'ERROR' ? 'bg-red-500/20 text-red-400' : 
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {log.status === 'SUCCESS' ? 'Éxito' : log.status === 'ERROR' ? 'Error' : 'Aviso'}
                      </span>
                    </td>
                    <td className="py-4 opacity-80 min-w-[300px]">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
