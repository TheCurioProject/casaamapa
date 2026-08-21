import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function updatePrice(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const price = Number(formData.get('price'));

  if (id && price > 0) {
    await prisma.unit.update({
      where: { id },
      data: { price }
    });
    revalidatePath('/admin/units');
  }
}

async function updateIcalUrls(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const icalText = formData.get('icalUrls') as string;

  if (id) {
    const urls = icalText.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    await prisma.unit.update({
      where: { id },
      data: { icalUrls: urls }
    });
    revalidatePath('/admin/units');
  }
}

export default async function AdminUnitsPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const units = await prisma.unit.findMany({
    orderBy: { id: 'asc' }
  });

  return (
    <div>
      <header className="mb-12">
        <h1 className="font-display text-4xl mb-2 text-[var(--color-ink)]">Unidades & Precios</h1>
        <p className="opacity-70 text-sm">Administra la configuración de precios para cada espacio.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {units.map((unit: any) => (
          <div key={unit.id} className="bg-white rounded-[24px] p-8 shadow-sm border border-[rgba(94,58,80,0.1)] relative overflow-hidden">
            {unit.isWholeHouse && (
              <div className="absolute top-0 right-0 bg-[var(--color-rose-3)] text-white text-[0.6rem] uppercase tracking-widest px-4 py-2 rounded-bl-[16px] font-medium">
                Casa Completa
              </div>
            )}
            
            <h2 className="font-display text-3xl mb-1">{unit.name}</h2>
            <p className="text-xs opacity-50 uppercase tracking-widest mb-8">ID: {unit.id}</p>

            <form action={updatePrice} className="flex items-end gap-4">
              <input type="hidden" name="id" value={unit.id} />
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2">Precio Base (MXN)</label>
                <input 
                  type="number" 
                  name="price"
                  defaultValue={unit.price}
                  className="w-full bg-transparent border-b border-[rgba(94,58,80,0.2)] pb-2 focus:border-[var(--color-rose-3)] outline-none transition-colors text-lg"
                />
              </div>
              <button 
                type="submit"
                className="bg-[var(--color-ink)] text-white rounded-xl px-6 py-2 text-xs uppercase tracking-widest hover:bg-[var(--color-rose-3)] transition-colors"
              >
                Guardar
              </button>
            </form>

            <form action={updateIcalUrls} className="mt-8 pt-6 border-t border-[rgba(94,58,80,0.1)] flex flex-col gap-4">
              <input type="hidden" name="id" value={unit.id} />
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-2 flex justify-between">
                  <span>URLs de iCal (OTAs)</span>
                  <span className="opacity-50 text-[10px]">Una URL por línea</span>
                </label>
                <textarea 
                  name="icalUrls"
                  defaultValue={(unit.icalUrls || []).join('\n')}
                  rows={3}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  className="w-full border border-[rgba(94,58,80,0.2)] rounded-xl px-4 py-3 bg-[var(--color-cream)] focus:bg-white focus:border-[var(--color-rose-3)] focus:ring-1 focus:ring-[var(--color-rose-3)] outline-none resize-none text-sm font-mono"
                />
              </div>
              <button 
                type="submit"
                className="self-end bg-[var(--color-ink)] text-white rounded-xl px-6 py-2 text-xs uppercase tracking-widest hover:bg-[var(--color-rose-3)] transition-colors"
              >
                Sincronizar URLs
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
