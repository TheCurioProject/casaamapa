export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { updatePrice, updateIcalUrls, createUnit, deleteUnit } from './actions';
import { Copy, Plus, Trash2, Building } from 'lucide-react';
import { SubmitButton } from '@/components/admin/submit-button';

export default async function AdminUnitsPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const units = await prisma.unit.findMany({
    orderBy: { id: 'asc' }
  });

  return (
    <div className="text-[var(--color-sand)]">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl mb-2 text-white flex items-center gap-3">
            <Building className="w-8 h-8 text-[var(--color-rose-3)]" />
            Propiedades & Unidades
          </h1>
          <p className="opacity-70 text-sm">Administra habitaciones, precios y enlaces iCal.</p>
        </div>
        
        {/* Create new unit form */}
        <form action={createUnit} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-end gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium opacity-70 mb-1">Nombre</label>
            <input 
              type="text" 
              name="name" 
              required
              placeholder="Ej. Suite Sur"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-[var(--color-rose-3)] outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium opacity-70 mb-1">Precio Base</label>
            <input 
              type="number" 
              name="price" 
              required
              placeholder="3500"
              className="w-24 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-[var(--color-rose-3)] outline-none"
            />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" name="isWholeHouse" value="true" id="isWholeHouse" className="accent-[var(--color-rose-3)]" />
            <label htmlFor="isWholeHouse" className="text-[10px] uppercase tracking-widest">¿Es Casa Entera?</label>
          </div>
          <SubmitButton className="bg-[var(--color-rose-3)] text-white hover:bg-[var(--color-rose-2)] rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Añadir
          </SubmitButton>
        </form>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {units.map((unit: any) => (
          <div key={unit.id} className="bg-white/5 rounded-[24px] p-8 border border-white/10 relative overflow-hidden flex flex-col">
            {unit.isWholeHouse && (
              <div className="absolute top-0 right-0 bg-[var(--color-rose-3)] text-white text-[0.6rem] uppercase tracking-widest px-4 py-2 rounded-bl-[16px] font-medium">
                Casa Completa
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-display text-3xl mb-1 text-white">{unit.name}</h2>
                <p className="text-xs opacity-50 uppercase tracking-widest">ID: {unit.id}</p>
              </div>
              <form action={deleteUnit}>
                <input type="hidden" name="id" value={unit.id} />
                <button type="submit" className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/10 transition-colors" title="Eliminar Unidad">
                  <Trash2 className="w-5 h-5" />
                </button>
              </form>
            </div>

            <form action={updatePrice} className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
              <input type="hidden" name="id" value={unit.id} />
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">Precio Base (MXN)</label>
                <input 
                  type="number" 
                  name="price"
                  defaultValue={unit.price}
                  className="w-full bg-black/20 border-b border-white/20 pb-2 focus:border-[var(--color-rose-3)] outline-none transition-colors text-xl font-medium"
                />
              </div>
              <SubmitButton className="bg-white/10 text-white rounded-xl px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-[var(--color-rose-3)] transition-colors">
                Actualizar Precio
              </SubmitButton>
            </form>

            <form action={updateIcalUrls} className="flex flex-col gap-4 flex-1">
              <input type="hidden" name="id" value={unit.id} />
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2 flex justify-between">
                  <span>Importar iCal (Desde OTAs)</span>
                  <span className="opacity-50 text-[10px]">Una URL por línea</span>
                </label>
                <textarea 
                  name="icalUrls"
                  defaultValue={(unit.icalUrls || []).join('\n')}
                  rows={3}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  className="w-full border border-white/10 rounded-xl px-4 py-3 bg-black/20 focus:bg-black/40 focus:border-[var(--color-rose-3)] outline-none resize-none text-xs font-mono text-[var(--color-sand)]"
                />
              </div>
              <SubmitButton className="self-end bg-white/10 text-white rounded-xl px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-[var(--color-rose-3)] transition-colors">
                Guardar URLs
              </SubmitButton>
            </form>

            {/* iCal Export Information */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">
                Exportar iCal (Para OTAs)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-[10px] sm:text-xs font-mono break-all text-[var(--color-rose-3)]">
                  https://amapachacala.com/api/ical/export/{unit.id}
                </code>
              </div>
              <p className="text-[10px] opacity-50 mt-2">Copia esta URL en Airbnb o Booking para sincronizar la disponibilidad de esta unidad.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
