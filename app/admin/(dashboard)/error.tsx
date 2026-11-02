'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-[var(--color-sand)]">
      <h1 className="font-display text-3xl mb-4">No se pudo cargar el panel</h1>
      <p className="mb-6 opacity-80">Revisa tu conexión e intenta de nuevo. Si acabas de guardar una operación, comprueba el calendario antes de repetirla.</p>
      <button onClick={reset} className="rounded-xl bg-[var(--color-rose-3)] px-6 py-3 font-semibold text-[var(--color-ink)]">Intentar de nuevo</button>
    </div>
  );
}
