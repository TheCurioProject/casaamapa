export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CreditCard, ExternalLink, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/db';

export const metadata = {
  title: 'Stripe Pagos | Admin - Casa Amapa',
};

export default async function AdminStripePage() {
  const session = await auth();
  if (!session) redirect('/admin/login');
  const statusGroups = await prisma.booking.groupBy({ by: ['status'], _count: { _all: true } });
  const statusCounts = Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all]));
  const lastEvent = await prisma.stripeWebhookEvent.findFirst({ orderBy: { receivedAt: 'desc' } });
  const notificationFailures = await prisma.booking.count({
    where: { status: 'confirmed', notificationError: { not: null } },
  });
  const configuration = {
    secretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    publishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  };
  const paymentConfigured = configuration.secretKey && configuration.publishableKey && configuration.webhookSecret;

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
            <h2 className="text-xl font-medium text-white mb-2">Estado verificable</h2>
            <p className="text-sm opacity-60 mb-6">La configuración y los eventos se muestran a partir del estado real del servidor.</p>
            <ul className="text-sm space-y-2 mb-6">
              {Object.entries(configuration).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2">
                  {value ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  <span>{key}: {value ? 'configurado' : 'faltante'}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-fit text-xs font-medium uppercase tracking-widest border ${paymentConfigured ? 'text-green-300 bg-green-500/10 border-green-400/20' : 'text-amber-300 bg-amber-500/10 border-amber-400/20'}`}>
            <div className={`w-2 h-2 rounded-full ${paymentConfigured ? 'bg-green-400' : 'bg-amber-400'}`} />
            {paymentConfigured ? 'Configuración completa' : 'Requiere atención'}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Pendientes', statusCounts.pending || 0],
          ['Procesando', statusCounts.processing || 0],
          ['Confirmadas', statusCounts.confirmed || 0],
          ['Atención', (statusCounts.attention_required || 0) + notificationFailures],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-widest opacity-50">{label}</p>
            <p className="text-3xl mt-2 text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm">
        <p className="font-medium text-white mb-2">Último webhook recibido</p>
        {lastEvent ? (
          <p className="opacity-70">{lastEvent.type} · {lastEvent.receivedAt.toLocaleString('es-MX')} · {lastEvent.processedAt ? 'procesado' : `error: ${lastEvent.error || 'pendiente'}`}</p>
        ) : (
          <p className="text-amber-300">Todavía no hay eventos registrados. Confirma en Stripe Workbench que el endpoint sea https://www.casaamapa.com/api/webhooks/stripe.</p>
        )}
      </div>
    </div>
  );
}
