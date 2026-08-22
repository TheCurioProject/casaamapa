import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4 opacity-50">
        <Loader2 className="w-12 h-12 text-[var(--color-rose-3)] animate-spin" />
        <p className="text-sm font-medium tracking-widest uppercase text-[var(--color-sand)]">Cargando...</p>
      </div>
    </div>
  );
}
