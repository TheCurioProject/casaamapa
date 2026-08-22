'use client';

import { useState } from 'react';
import { Plus, X, Loader2, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { updateIcalUrls } from '@/app/admin/(dashboard)/units/actions';

export function ICalForm({ unitId, initialUrls }: { unitId: string; initialUrls: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialUrls.length > 0 ? initialUrls : ['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportUrl = `https://amapachacala.com/api/ical/export/${unitId}/calendar.ics`;

  const handleAdd = () => {
    setUrls([...urls, '']);
  };

  const handleRemove = (index: number) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    if (newUrls.length === 0) newUrls.push('');
    setUrls(newUrls);
  };

  const handleChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
    setError('');
    setSuccess(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const validUrls = urls.filter(u => u.trim() !== '');

    // Verify all URLs first
    for (const url of validUrls) {
      try {
        const res = await fetch('/api/admin/verify-ical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        
        if (!data.success) {
          setError(`Fallo en URL: ${url}. ${data.error}`);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setError(`Error al verificar ${url}: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    // All verified, save them
    const formData = new FormData();
    formData.append('id', unitId);
    formData.append('icalUrls', validUrls.join('\n'));
    
    try {
      await updateIcalUrls(formData);
      setSuccess(true);
      // Clean up empty inputs
      if (validUrls.length === 0) {
        setUrls(['']);
      } else {
        setUrls(validUrls);
      }
    } catch (err: any) {
      setError('Error al guardar en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        <div className="flex-1 w-full">
          <label className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-2">
            <span className="text-xs uppercase tracking-widest font-medium opacity-70">Importar iCal (Desde OTAs)</span>
            {success && <span className="text-[10px] uppercase tracking-widest text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Guardado</span>}
          </label>
          
          <div className="flex flex-col gap-3">
            {urls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <input 
                  type="url"
                  value={url}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  className="flex-1 border border-white/10 rounded-xl px-4 py-3 bg-black/20 focus:bg-black/40 focus:border-[var(--color-rose-3)] outline-none text-xs font-mono text-[var(--color-sand)]"
                />
                <button 
                  type="button" 
                  onClick={() => handleRemove(index)}
                  className="p-3 bg-black/20 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-xl transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleAdd}
            className="mt-3 text-[10px] uppercase tracking-widest font-bold opacity-70 hover:opacity-100 flex items-center gap-1 transition-opacity text-[var(--color-rose-3)]"
          >
            <Plus className="w-3 h-3" /> Añadir URL
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto sm:self-end bg-white/10 text-white rounded-xl px-6 py-4 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors flex justify-center items-center gap-2 mt-4"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Verificando y Guardando...' : 'Guardar URLs'}
        </button>
      </form>

      {/* iCal Export Information */}
      <div className="mt-auto pt-8 border-t border-white/10">
        <label className="block text-xs uppercase tracking-widest font-medium opacity-70 mb-3">
          Exportar iCal (Para OTAs)
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full gap-2">
          <code className="flex-1 bg-black/30 border border-white/5 rounded-xl px-4 py-4 sm:py-3 text-[10px] sm:text-xs font-mono break-all text-[var(--color-rose-3)] shadow-inner">
            {exportUrl}
          </code>
          <button 
            onClick={handleCopy}
            className="bg-[var(--color-rose-3)] hover:bg-[var(--color-rose-2)] text-[var(--color-ink)] px-4 py-4 sm:py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors shrink-0"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="text-[10px] sm:text-xs opacity-50 mt-3 leading-relaxed">Copia esta URL en Airbnb o Booking para sincronizar la disponibilidad de esta unidad.</p>
      </div>
    </div>
  );
}
