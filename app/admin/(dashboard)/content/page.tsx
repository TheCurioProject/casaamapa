export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BookOpen, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Content | Admin - Casa Amapa',
};

export default async function AdminContentPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="text-[var(--color-sand)] max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-[var(--color-rose-3)]">Contenido de la Web</h1>
        <p className="opacity-70 text-sm">Gestiona los textos y traducciones de la página.</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 text-center py-20 flex flex-col items-center justify-center">
        <BookOpen className="w-16 h-16 text-[var(--color-rose-3)] mb-6 opacity-80" />
        <h2 className="font-display text-3xl mb-4 text-white">Módulo en Desarrollo</h2>
        <p className="max-w-md mx-auto text-sm opacity-60 mb-8">
          La gestión de contenido CMS se integrará próximamente. Por el momento, el contenido general de Amapa Chacala está alojado de forma estática y traducido mediante archivos locales.
        </p>

        <div className="flex items-start gap-3 bg-[var(--color-ink-2)]/30 text-[var(--color-sand)] p-4 rounded-xl border border-white/10 text-xs text-left max-w-lg mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-rose-3)]" />
          <p>Cualquier cambio inmediato en la redacción de la página principal (amenidades, descripciones de cuartos) debe hacerse editando directamente los archivos de mensajes locales (i18n).</p>
        </div>
      </div>
    </div>
  );
}
