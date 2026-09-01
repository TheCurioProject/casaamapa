export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { updatePrice, updateIcalUrls, createUnit, deleteUnit } from './actions';
import { Copy, Plus, Trash2, Building } from 'lucide-react';
import { SubmitButton } from '@/components/admin/submit-button';
import { ICalForm } from '@/components/admin/ical-form';

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
        <form action={createUnit} className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-end gap-4 w-full md:w-auto mt-6 md:mt-0 shadow-lg">
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] uppercase tracking-widest font-medium opacity-70 mb-2">Nombre</label>
            <input 
              type="text" 
              name="name" 
              required
              placeholder="Ej. Suite Sur"
              className="w-full sm:w-48 bg-black/20 border border-white/10 rounded-xl px-4 py-3 sm:py-2 text-sm focus:border-[var(--color-rose-3)] outline-none transition-colors"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] uppercase tracking-widest font-medium opacity-70 mb-2">Precio Base</label>
            <input 
              type="number" 
              name="price" 
              required
              placeholder="3500"
              className="w-full sm:w-32 bg-black/20 border border-white/10 rounded-xl px-4 py-3 sm:py-2 text-sm focus:border-[var(--color-rose-3)] outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 mb-2 sm:mb-3 w-full sm:w-auto p-2 sm:p-0 bg-black/10 sm:bg-transparent rounded-xl">
            <input type="checkbox" name="isWholeHouse" value="true" id="isWholeHouse" className="accent-[var(--color-rose-3)] w-4 h-4" />
            <label htmlFor="isWholeHouse" className="text-xs sm:text-[10px] uppercase tracking-widest font-medium">¿Es Casa Entera?</label>
          </div>
          <SubmitButton className="w-full sm:w-auto bg-[var(--color-rose-3)] text-[var(--color-ink)] hover:bg-[var(--color-rose-2)] rounded-xl px-6 py-3.5 sm:py-2.5 text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors mt-2 sm:mt-0">
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

            <form action={updatePrice} className="flex flex-col gap-4 mb-8">
              <input type="hidden" name="id" value={unit.id} />
              
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">Precio Base (MXN)</label>
                  <input 
                    type="number" 
                    name="price"
                    defaultValue={unit.price}
                    className="w-full bg-black/20 border-b-2 border-white/20 pb-3 focus:border-[var(--color-rose-3)] outline-none transition-colors text-2xl font-medium px-2 rounded-t-lg"
                  />
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto p-3 bg-black/20 rounded-xl border border-white/5">
                  <input 
                    type="checkbox" 
                    name="addStripeCommission" 
                    value="true" 
                    defaultChecked={unit.addStripeCommission} 
                    id={`addStripeCommission-${unit.id}`} 
                    className="accent-[var(--color-rose-3)] w-4 h-4" 
                  />
                  <label htmlFor={`addStripeCommission-${unit.id}`} className="text-[10px] uppercase tracking-widest font-medium opacity-80 cursor-pointer">
                    Sumar 5% comisión Stripe (Público)
                  </label>
                </div>

                <SubmitButton className="w-full sm:w-auto bg-white/10 text-white rounded-xl px-6 py-4 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors mt-2 sm:mt-0 flex justify-center h-[52px] sm:h-auto items-center">
                  Actualizar Precio
                </SubmitButton>
              </div>
            </form>

            <ICalForm unitId={unit.id} initialUrls={unit.icalUrls || []} />
          </div>
        ))}
      </div>
    </div>
  );
}
