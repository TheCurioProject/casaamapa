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

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[rgba(94,58,80,0.08)]">
        <form action={async (formData) => {
          'use server';
          await updateSettings(formData);
        }} className="space-y-8">
          
          {/* Email Notifications */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-[rgba(94,58,80,0.1)] pb-3">
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
                  className="w-full md:w-1/2 border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-[var(--color-cream)] focus:bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none"
                />
              </div>
            </div>
          </section>

          {/* Payment Settings */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-[rgba(94,58,80,0.1)] pb-3">
              Pagos y Reservas
            </h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="depositPercentage" className="block text-sm font-medium opacity-80 mb-1">
                  Porcentaje de Anticipo (%)
                </label>
                <input
                  type="number"
                  id="depositPercentage"
                  name="depositPercentage"
                  defaultValue={settings?.depositPercentage || 50}
                  min="10"
                  max="100"
                  className="w-full md:w-1/3 border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-[var(--color-cream)] focus:bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFullPayment"
                  name="isFullPayment"
                  defaultChecked={settings?.isFullPayment}
                  className="w-5 h-5 accent-[var(--color-rose-3)] rounded focus:ring-[var(--color-rose-3)]"
                />
                <label htmlFor="isFullPayment" className="text-sm font-medium opacity-80">
                  Exigir pago completo al reservar (Ignora el porcentaje de anticipo)
                </label>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-[rgba(94,58,80,0.1)] flex justify-end">
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
