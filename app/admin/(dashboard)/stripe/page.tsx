import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CreditCard, ExternalLink, Activity } from 'lucide-react';

export const metadata = {
  title: 'Stripe Pagos | Admin - Casa Amapa',
};

export default async function AdminStripePage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="text-[var(--color-sand)] max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-[var(--color-rose-3)]" />
          Stripe & Pagos
        </h1>
        <p className="opacity-70 text-sm">Gestiona la integración con la pasarela de pagos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 flex flex-col justify-between">
          <div>
            <CreditCard className="w-8 h-8 text-[var(--color-rose-3)] mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Conexión Activa</h2>
            <p className="text-sm opacity-60 mb-6">El sistema está conectado exitosamente a Stripe. Los pagos de las reservas directas se procesan automáticamente.</p>
          </div>
          <div className="flex items-center gap-2 text-[var(--color-rose-3)] bg-[var(--color-rose-3)]/10 px-4 py-2 rounded-full w-fit text-xs font-medium uppercase tracking-widest border border-[var(--color-rose-3)]/20">
            <div className="w-2 h-2 rounded-full bg-[var(--color-rose-3)] animate-pulse" />
            En Línea
          </div>
        </div>

        <div className="bg-[var(--color-rose-3)] text-white rounded-[24px] p-8 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <Activity className="w-8 h-8 mb-4 text-white/80" />
            <h2 className="text-xl font-medium mb-2">Dashboard de Stripe</h2>
            <p className="text-sm text-white/80 mb-6">Para ver el historial de transacciones, devoluciones y depósitos bancarios, accede al panel oficial.</p>
          </div>
          <a 
            href="https://dashboard.stripe.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative z-10 flex items-center justify-center gap-2 bg-white text-[var(--color-rose-3)] py-3 px-6 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-white/90 transition-colors"
          >
            Abrir Stripe <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
