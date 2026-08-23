'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, DollarSign, Home, ArrowUpRight, Lock, Globe, FileEdit, Link as LinkIcon, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function ActivitySection({ title, subtitle, icon: Icon, data, type, colorClass }: { title: string, subtitle: string, icon: any, data: any[], type: 'booking' | 'block', colorClass: string }) {
  if (!data || data.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 border border-white/10 rounded-[2rem] shadow-sm overflow-hidden mb-8"
    >
      <div className="p-8 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl mb-1 text-white">{title}</h2>
            <p className="text-xs opacity-60 uppercase tracking-widest text-[var(--color-sand)]">{subtitle}</p>
          </div>
        </div>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden divide-y divide-white/10">
        {data.map((item: any, index: number) => (
          <div key={item.id} className="p-6 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-white text-base mb-0.5">
                  {type === 'booking' ? item.guestName : item.reason}
                </div>
                {type === 'booking' && <div className="opacity-60 text-[10px] uppercase tracking-widest text-white/70">{item.guestEmail}</div>}
              </div>
              {type === 'booking' && (
                <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest ${
                  item.status === 'confirmed' ? 'bg-[#E8F5E9]/20 text-[#81C784]' :
                  item.status === 'pending' ? 'bg-[#FFF3E0]/20 text-[#FFB74D]' :
                  'bg-[#FFEBEE]/20 text-[#E57373]'
                }`}>
                  {item.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-black/20 border border-white/10 px-2 py-1 rounded text-xs font-semibold tracking-wide text-white/90">
                {item.unit?.name || item.apartmentId}
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-80 text-xs text-white bg-black/20 p-2 rounded-lg w-fit mt-1">
              <span>{format(new Date(type === 'booking' ? item.checkIn : item.startDate), 'dd MMM yyyy', { locale: es })}</span>
              <ArrowUpRight className="w-3 h-3 opacity-40 mx-1" />
              <span>{format(new Date(type === 'booking' ? item.checkOut : item.endDate), 'dd MMM yyyy', { locale: es })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">
                {type === 'booking' ? 'Huésped' : 'Motivo / Origen'}
              </th>
              <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Unidad</th>
              <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">
                {type === 'booking' ? 'Check In / Out' : 'Desde / Hasta'}
              </th>
              {type === 'booking' && <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Estado</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((item: any) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="font-medium text-white text-base">
                    {type === 'booking' ? item.guestName : item.reason}
                  </div>
                  {type === 'booking' && <div className="opacity-60 text-xs mt-0.5 text-white/70">{item.guestEmail}</div>}
                </td>
                <td className="px-8 py-5">
                  <span className="bg-black/20 border border-white/10 text-white/90 px-3 py-1 rounded-lg text-xs font-semibold tracking-wide">
                    {item.unit?.name || item.apartmentId}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3 opacity-80 text-xs text-white">
                    <span>{format(new Date(type === 'booking' ? item.checkIn : item.startDate), 'dd MMM yyyy', { locale: es })}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-40" />
                    <span>{format(new Date(type === 'booking' ? item.checkOut : item.endDate), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                </td>
                {type === 'booking' && (
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[0.65rem] tracking-widest uppercase font-bold flex inline-flex items-center justify-center ${
                      item.status === 'confirmed' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                      item.status === 'pending' ? 'bg-[#FFF3E0] text-[#EF6C00]' :
                      'bg-[#FFEBEE] text-[#C62828]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export function AdminDashboardClient({ 
  stats, 
  webBookings,
  manualBookings,
  otaBlocks,
  manualBlocks
}: { 
  stats: { total: number; revenue: number; units: number, webBookingsCount: number, manualBookingsCount: number, otaBlocksCount: number, manualBlocksCount: number };
  webBookings: any[];
  manualBookings: any[];
  otaBlocks: any[];
  manualBlocks: any[];
}) {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.header variants={item} className="mb-12">
        <h1 className="font-display text-5xl mb-3 text-[var(--color-cream)]">Vista General</h1>
        <p className="text-[var(--color-sand)] opacity-80 text-sm max-w-lg">Bienvenido al panel de control de Casa Amapa. Aquí tienes un resumen categorizado de la actividad reciente.</p>
      </motion.header>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[rgba(94,58,80,0.08)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500">
            <Globe className="w-6 h-6" />
          </div>
          <p className="text-[0.65rem] uppercase tracking-widest opacity-60 font-semibold mb-1 text-black">Reservas Web / Directas</p>
          <div className="flex items-end gap-3">
            <p className="font-display text-5xl text-black">{stats.webBookingsCount}</p>
          </div>
        </div>

        <div className="bg-[var(--color-ink)] text-[var(--color-cream)] rounded-3xl p-8 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-[var(--color-rose-3)] opacity-20 rounded-full blur-2xl"></div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-[var(--color-rose-2)]">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-[0.65rem] uppercase tracking-widest opacity-60 font-semibold mb-1">Ingresos Potenciales</p>
          <p className="font-display text-5xl text-white">
            ${stats.revenue.toLocaleString()} <span className="text-sm opacity-50 font-sans">MXN</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[rgba(94,58,80,0.08)] relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[var(--color-sand)] rounded-2xl flex items-center justify-center mb-6 text-[var(--color-rose-3)]">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-[0.65rem] uppercase tracking-widest opacity-60 font-semibold mb-1 text-black">Bloqueos Activos</p>
            <div className="flex items-end gap-3">
              <p className="font-display text-5xl text-black">{stats.otaBlocksCount + stats.manualBlocksCount}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="text-xs text-black/60"><span className="font-bold text-[#9b4b62]">{stats.otaBlocksCount}</span> OTA</div>
            <div className="text-xs text-black/60"><span className="font-bold text-[var(--color-rose-3)]">{stats.manualBlocksCount}</span> Manuales</div>
          </div>
        </div>
      </motion.div>

      {/* Categorized Sections */}
      <AnimatePresence>
        <ActivitySection 
          title="Reservas Web" 
          subtitle="Realizadas directamente desde Casa Amapa" 
          icon={Globe} 
          data={webBookings} 
          type="booking"
          colorClass="bg-red-500/20 text-red-500" 
        />

        <ActivitySection 
          title="Reservas Manuales" 
          subtitle="Agregadas manualmente por un administrador" 
          icon={FileEdit} 
          data={manualBookings} 
          type="booking"
          colorClass="bg-[var(--color-rose-1)]/20 text-[var(--color-rose-1)]" 
        />

        <ActivitySection 
          title="Bloqueos OTA" 
          subtitle="Fechas no disponibles por reservas en Airbnb, Booking, etc." 
          icon={LinkIcon} 
          data={otaBlocks} 
          type="block"
          colorClass="bg-[#9b4b62]/20 text-[#e0a8b9]" 
        />

        <ActivitySection 
          title="Bloqueos Manuales" 
          subtitle="Fechas cerradas por mantenimiento o uso personal" 
          icon={PenTool} 
          data={manualBlocks} 
          type="block"
          colorClass="bg-[var(--color-rose-1)]/20 text-[var(--color-rose-1)]" 
        />
      </AnimatePresence>
    </motion.div>
  );
}
