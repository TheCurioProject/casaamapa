'use client';

import { useState } from 'react';
import { updateSettings } from '@/app/actions/admin';

export function SettingsForm({ initialSettings }: { initialSettings: { depositPercentage: number, isFullPayment: boolean } }) {
  const [isFull, setIsFull] = useState(initialSettings.isFullPayment);
  const [percentage, setPercentage] = useState(initialSettings.depositPercentage);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateSettings(formData);
    setLoading(false);
    alert('Configuración guardada');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-medium mb-2">Modalidad de cobro</label>
        <select 
          name="paymentMode" 
          value={isFull ? 'full' : 'deposit'} 
          onChange={(e) => setIsFull(e.target.value === 'full')}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-200 outline-none"
        >
          <option value="deposit">Cobrar anticipo (Depósito)</option>
          <option value="full">Cobrar 100% al reservar</option>
        </select>
      </div>
      
      {!isFull && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Porcentaje de depósito: <span className="text-rose-600 font-bold">{percentage}%</span>
          </label>
          <input 
            type="range" 
            name="depositPercentage" 
            min="10" max="100" step="5" 
            value={percentage}
            onChange={(e) => setPercentage(parseInt(e.target.value))}
            className="w-full accent-[var(--color-rose-3)]"
          />
        </div>
      )}
      
      <button type="submit" disabled={loading} className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium self-start hover:bg-gray-800 disabled:opacity-50">
        {loading ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </form>
  );
}
