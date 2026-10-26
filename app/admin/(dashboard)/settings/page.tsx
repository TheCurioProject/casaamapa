export const dynamic = 'force-dynamic';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { updatePassword } from '@/app/actions/admin';
import { Settings, Save, Mail, LockKeyhole } from 'lucide-react';
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
        <p className="opacity-70">Configura notificaciones y valores predeterminados para operaciones administrativas.</p>
      </div>

      <div className="bg-white/5 rounded-3xl p-8 shadow-sm border border-white/10">
        <form action={async (formData) => {
          'use server';
          const result = await updateSettings(formData);
          if (result.error) throw new Error(result.error);
          if (formData.get('password')) await updatePassword(formData);
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

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-white">
              <LockKeyhole className="w-5 h-5 text-[var(--color-rose-3)]" />
              Seguridad del administrador
            </h2>
            <label htmlFor="password" className="block text-sm font-medium opacity-80 mb-1">
              Nueva contraseña (opcional)
            </label>
            <p className="text-xs opacity-60 mb-3">Mínimo 12 caracteres. Déjalo vacío para conservar la contraseña actual.</p>
            <input
              type="password"
              id="password"
              name="password"
              minLength={12}
              autoComplete="new-password"
              className="w-full md:w-1/2 border border-white/20 rounded-xl px-4 py-3 bg-white/5 focus:bg-white/10 focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none text-white"
            />
          </section>

          {/* Manual booking defaults */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-white">
              <Settings className="w-5 h-5 text-[var(--color-rose-3)]" />
              Reservas manuales e invoices externos
            </h2>
            <div className="space-y-6">
              <p className="text-sm opacity-70 max-w-2xl">
                Este ajuste solo define el anticipo predeterminado al crear una reserva desde el panel.
                Las reservas hechas en el sitio web siempre se cobran al 100% mediante Stripe.
              </p>
              <div>
                <label className="block text-sm font-medium opacity-80 mb-1">Cobro predeterminado para reservas manuales</label>
                <select
                  name="paymentMode"
                  defaultValue={settings?.isFullPayment ? 'full' : 'deposit'}
                  className="w-full md:w-1/2 border border-white/20 rounded-xl px-4 py-3 bg-[var(--color-ink)] focus:bg-[var(--color-ink-2)] focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] transition-all outline-none text-white"
                >
                  <option value="deposit">Registrar anticipo</option>
                  <option value="full">Registrar pago completo (100%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium opacity-80 mb-1">
                  Porcentaje de anticipo manual (si aplica)
                </label>
                <input
                  type="number"
                  name="depositPercentage"
                  min="10" max="100" step="5"
                  defaultValue={settings?.depositPercentage || 50}
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
