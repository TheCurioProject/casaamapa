'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLoaderStore } from '@/store/useLoaderStore';

export function IcalSyncButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { showLoader, hideLoader } = useLoaderStore();

  const handleSync = async () => {
    setStatus('loading');
    showLoader();
    try {
      const res = await fetch('/api/ical/sync', {
        method: 'POST',
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch(e) {}
      
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(`Sincronización completada. ${data.stats?.processed || 0} procesados, ${data.stats?.added || 0} nuevos.`);
        router.refresh();
      } else {
        setStatus('error');
        setMessage(data.error || 'Error desconocido al sincronizar.');
        router.refresh();
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Error de conexión.');
    } finally {
      hideLoader();
      setTimeout(() => {
        setStatus(current => current === 'success' ? 'idle' : current);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <button 
        onClick={handleSync}
        disabled={status === 'loading'}
        className="bg-[var(--color-rose-3)] text-white hover:bg-[var(--color-rose-2)] rounded-xl px-8 py-4 text-sm font-medium tracking-[0.2em] uppercase transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-5 h-5 ${status === 'loading' ? 'animate-spin' : ''}`} />
        {status === 'loading' ? 'Sincronizando...' : 'Sincronizar Ahora'}
      </button>

      {status === 'success' && (
        <div className="mt-6 flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-3 rounded-xl border border-green-500/20 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-6 flex items-center gap-2 text-[var(--color-coral)] bg-[var(--color-coral)]/10 px-4 py-3 rounded-xl border border-[var(--color-coral)]/20 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
