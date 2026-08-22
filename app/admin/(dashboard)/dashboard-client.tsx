'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, DollarSign, Home, ArrowUpRight } from 'lucide-react';

export function AdminDashboardClient({ 
  stats, 
  recentBookings 
}: { 
  stats: { total: number; revenue: number; units: number };
  recentBookings: any[];
}) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.header variants={item} className="mb-12">
        <h1 className="font-display text-5xl mb-3 text-[var(--color-cream)]">Vista General</h1>
        <p className="text-[var(--color-sand)] opacity-80 text-sm max-w-lg">Bienvenido al panel de control de Casa Amapa. Aquí tienes un resumen de la actividad reciente y el estado de tus reservas.</p>
      </motion.header>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[rgba(94,58,80,0.08)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-[var(--color-sand)] rounded-2xl flex items-center justify-center mb-6 text-[var(--color-rose-3)]">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-[0.65rem] uppercase tracking-widest opacity-60 font-semibold mb-1 text-black">Total Reservas</p>
          <p className="font-display text-5xl text-black">{stats.total}</p>
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

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[rgba(94,58,80,0.08)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-[var(--color-sand)] rounded-2xl flex items-center justify-center mb-6 text-[var(--color-rose-3)]">
            <Home className="w-6 h-6" />
          </div>
          <p className="text-[0.65rem] uppercase tracking-widest opacity-60 font-semibold mb-1 text-black">Unidades Activas</p>
          <p className="font-display text-5xl text-black">{stats.units}</p>
        </div>
      </motion.div>

      {/* Recent Bookings */}
      <motion.div variants={item} className="bg-white/5 border border-white/10 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="font-display text-3xl mb-1 text-white">Últimas Reservas</h2>
            <p className="text-xs opacity-60 uppercase tracking-widest text-[var(--color-sand)]">Las más recientes de la plataforma</p>
          </div>
        </div>
        <div className="md:hidden divide-y divide-white/10">
          {recentBookings.length === 0 ? (
            <div className="p-8 text-center opacity-50 text-white">No hay reservas recientes.</div>
          ) : recentBookings.map((b: any, index: number) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              key={b.id}
              className="p-6 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-white text-base mb-0.5">{b.guestName}</div>
                  <div className="opacity-60 text-[10px] uppercase tracking-widest text-white/70">{b.guestEmail}</div>
                </div>
                <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest ${
                  b.status === 'confirmed' ? 'bg-[#E8F5E9]/20 text-[#81C784]' :
                  b.status === 'pending' ? 'bg-[#FFF3E0]/20 text-[#FFB74D]' :
                  'bg-[#FFEBEE]/20 text-[#E57373]'
                }`}>
                  {b.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[var(--color-rose-3)]/20 text-[var(--color-rose-2)] px-2 py-1 rounded text-xs font-semibold tracking-wide">
                  {b.unit?.name || b.apartmentId}
                </span>
              </div>
              <div className="flex items-center gap-2 opacity-80 text-xs text-white bg-black/20 p-2 rounded-lg w-fit">
                <span>{new Date(b.checkIn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                <ArrowUpRight className="w-3 h-3 opacity-40 mx-1" />
                <span>{new Date(b.checkOut).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Huésped</th>
                <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Unidad</th>
                <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Check In / Out</th>
                <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center opacity-50 text-white">No hay reservas recientes.</td>
                </tr>
              ) : recentBookings.map((b: any, index: number) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  key={b.id} 
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="font-medium text-white text-base">{b.guestName}</div>
                    <div className="opacity-60 text-xs mt-0.5 text-white/70">{b.guestEmail}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-[var(--color-rose-3)]/20 text-[var(--color-rose-2)] border border-[var(--color-rose-3)]/30 px-3 py-1 rounded-lg text-xs font-semibold tracking-wide">
                      {b.unit?.name || b.apartmentId}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 opacity-80 text-xs text-white">
                      <span>{new Date(b.checkIn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-40" />
                      <span>{new Date(b.checkOut).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[0.65rem] tracking-widest uppercase font-bold flex inline-flex items-center justify-center ${
                      b.status === 'confirmed' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                      b.status === 'pending' ? 'bg-[#FFF3E0] text-[#EF6C00]' :
                      'bg-[#FFEBEE] text-[#C62828]'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
