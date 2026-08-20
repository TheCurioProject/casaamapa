import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updateSettings, updatePassword } from '@/app/actions/admin';

import { SettingsForm } from '@/components/admin/settings-form';

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = { id: '', depositPercentage: 50, isFullPayment: false, updatedAt: new Date() };
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-gray-500 hover:text-gray-900">← Volver</Link>
        <h1 className="text-3xl font-semibold">Configuración</h1>
      </header>

      <div className="grid gap-8">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-medium mb-4">Pagos y Depósitos</h2>
          <SettingsForm initialSettings={{ depositPercentage: settings.depositPercentage, isFullPayment: settings.isFullPayment }} />
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-medium mb-4">Seguridad</h2>
          <form action={async (formData) => {
            'use server';
            await updatePassword(formData);
          }} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nueva Contraseña Admin</label>
              <input type="password" name="password" minLength={6} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-200 outline-none max-w-sm" />
            </div>
            <button type="submit" className="bg-rose-50 text-rose-600 border border-rose-200 rounded-lg px-4 py-2 text-sm font-medium self-start hover:bg-rose-100">
              Actualizar Contraseña
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
