import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Link as LinkIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { SubmitButton } from '@/components/admin/submit-button';

export const metadata = {
  title: 'iCal Sync | Admin - Casa Amapa',
};

export default async function AdminIcalPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="text-[var(--color-sand)] max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-white flex items-center gap-3">
          <LinkIcon className="w-8 h-8 text-[var(--color-rose-3)]" />
          Sincronización iCal
        </h1>
        <p className="opacity-70 text-sm">Gestiona la conexión con Airbnb, Booking.com y otras OTAs.</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-[24px] p-8">
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

        <form action="/api/ical/sync" method="POST" className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-2xl">
          <RefreshCw className="w-12 h-12 text-white/30 mb-6" />
          <h3 className="text-xl font-medium mb-2">Sincronizar Manualmente</h3>
          <p className="text-sm opacity-50 mb-8 text-center max-w-sm">Pulsa el botón para descargar los calendarios actualizados de todas las OTAs configuradas y aplicar los bloqueos.</p>
          
          <SubmitButton className="bg-[var(--color-rose-3)] text-white hover:bg-[var(--color-rose-2)] rounded-xl px-8 py-4 text-sm font-medium tracking-[0.2em] uppercase transition-all shadow-lg">
            Sincronizar Ahora
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
