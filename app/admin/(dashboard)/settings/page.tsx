export const dynamic = 'force-dynamic';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { Settings, Save, Mail } from 'lucide-react';
import { SubmitButton } from '@/components/admin/submit-button';

export const metadata = {
  title: 'Ajustes | Admin - Casa Amapa',
};

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="font-display text-4xl mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-[var(--color-rose-3)]" />
          Ajustes del Sistema
        </h1>
        <p className="opacity-70">Configura notificaciones, pagos y opciones generales de la plataforma.</p>
      </div>

      <div className="bg-white/5 rounded-3xl p-8 shadow-sm border border-white/10">
        <form action={async (formData) => {
          'use server';
          await updateSettings(formData);
        }} className="space-y-8">
          
          {/* Email Notifications */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-white">
              <Mail className="w-5 h-5 text-[var(--color-rose-3)]" />
              Notificaciones por Correo
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium opacity-80 mb-1">
                  Correo del Administrador
                </label>
                <p className="text-xs opacity-60 mb-3">Este correo recibirá notificaciones automáticas cada vez que un cliente realice una nueva reserva.</p>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  defaultValue={settings?.adminEmail || ''}
                  placeholder="ejemplo@casaamapa.mx"
                  className="w-full md:w-1/2 border border-white/20 rounded-xl px-4 py-3 bg-white/5 focus:bg-white/10 focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none text-white"
                />
              </div>
            </div>
          </section>



          <div className="pt-6 border-t border-white/10 flex justify-end">
            <SubmitButton>
              <Save className="w-4 h-4" />
              Guardar Ajustes
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
