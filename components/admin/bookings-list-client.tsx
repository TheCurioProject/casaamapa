'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Mail, Trash2, FileText, ChevronDown, Phone, Loader2 } from 'lucide-react';
import { useDialogStore } from '@/store/useDialogStore';
import { EditBookingModal } from './edit-booking-modal';

export function BookingsListClient({ bookings }: { bookings: any[] }) {
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const dialog = useDialogStore();

  React.useEffect(() => {
    const editId = searchParams?.get('edit');
    if (editId && bookings.some(b => b.id === editId)) {
      setExpandedId(editId);
      setEditingBookingId(editId);
      setIsEditModalOpen(true);
      
      // Clean up the URL to prevent reopening on reload
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams, bookings]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleEdit = (bookingId: string) => {
    setEditingBookingId(bookingId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (bookingId: string) => {
    dialog.confirm({
      title: '¿Eliminar Reserva?',
      description: '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.',
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        setLoadingAction(bookingId);
        try {
          await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' });
          window.location.reload();
        } catch (err) {
          console.error(err);
          dialog.alert({ title: 'Error', description: 'Ocurrió un error al intentar eliminar la reserva.', type: 'danger' });
          setLoadingAction(null);
        }
      }
    });
  };

  const handleSendInvoice = async (bookingId: string, guestEmail: string) => {
    if (!guestEmail) {
      dialog.alert({ title: 'Sin correo', description: 'Esta reserva no tiene un correo electrónico asociado.', type: 'alert' });
      return;
    }
    setLoadingAction(`mail-${bookingId}`);
    try {
      const res = await fetch('/api/admin/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      if (!res.ok) throw new Error('Error al enviar');
      dialog.alert({ title: '¡Enviado!', description: 'El comprobante ha sido reenviado exitosamente al cliente.', type: 'confirm' });
    } catch (err) {
      console.error(err);
      dialog.alert({ title: 'Error de envío', description: 'No se pudo enviar el invoice en este momento.', type: 'danger' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-4">
        {bookings.length === 0 ? (
          <div className="p-8 text-center opacity-50 bg-white/5 rounded-2xl border border-white/10">No hay reservas directas aún.</div>
        ) : (
          bookings.map(booking => {
            const isExpanded = expandedId === booking.id;
            return (
              <motion.div 
                layout
                key={booking.id} 
                onClick={() => toggleExpand(booking.id)}
                className={`bg-white/5 border rounded-[20px] p-5 flex flex-col gap-4 relative cursor-pointer overflow-hidden transition-colors ${
                  isExpanded ? 'border-[var(--color-rose-3)] bg-white/10 shadow-lg' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <motion.div layout className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white text-base flex items-center gap-2">
                      {booking.guestName}
                      {booking.isManual && <span className="text-[8px] bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--color-rose-3)]/30">Manual</span>}
                    </p>
                    <p className="opacity-60 text-[10px] uppercase tracking-widest text-white/70 mt-1">{booking.guestEmail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest ${
                      booking.status === 'confirmed' ? 'bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] border border-[var(--color-rose-3)]/30' : 'bg-white/10 text-white/70'
                    }`}>
                      {booking.status}
                    </span>
                    <motion.div 
                      animate={{ rotate: isExpanded ? 180 : 0 }} 
                      transition={{ duration: 0.3 }}
                      className="text-white/50"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>
                
                <motion.div layout className="flex items-center gap-2">
                  <span className="bg-black/20 text-white/80 border border-white/10 px-2 py-1 rounded text-xs font-semibold tracking-wide capitalize">
                    {booking.unit.name}
                  </span>
                </motion.div>

                <motion.div layout className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Fechas</span>
                    <span className="text-xs font-medium text-white/90">
                      {format(new Date(booking.checkIn), 'd MMM', { locale: es })} - {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] opacity-50 uppercase tracking-widest mb-1">Registro</span>
                    <span className="text-xs font-medium text-white/90">
                      {format(new Date(booking.createdAt), 'd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-4 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="border-t border-white/10 pt-4 mt-2 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] opacity-50 uppercase tracking-widest flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</span>
                          <span className="text-xs text-white">{booking.guestPhone || 'No registrado'}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[9px] opacity-50 uppercase tracking-widest">Total Reservación</span>
                          <span className="text-sm font-bold text-[var(--color-rose-3)]">
                            {booking.totalPrice ? `$${booking.totalPrice.toLocaleString('es-MX')} MXN` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] opacity-50 uppercase tracking-widest">Huéspedes</span>
                          <span className="text-xs text-white">{booking.guests}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[9px] opacity-50 uppercase tracking-widest">Anticipo Req.</span>
                          <span className="text-xs text-white">{booking.depositPercentage || 50}%</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button 
                          onClick={() => handleEdit(booking.id)}
                          className="w-full bg-[var(--color-rose-3)] text-[var(--color-ink)] py-3.5 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 hover:bg-[var(--color-rose-2)] transition-colors shadow-lg"
                        >
                          <Edit className="w-4 h-4" />
                          Editar Reserva
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <a 
                            href={`/api/admin/invoice-html/${booking.id}`}
                            target="_blank"
                            className="bg-white/5 border border-white/10 text-white/90 py-3 rounded-xl font-medium tracking-wide uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 opacity-70" />
                            Ver Invoice
                          </a>
                          <button 
                            onClick={() => handleSendInvoice(booking.id, booking.guestEmail)}
                            disabled={loadingAction === `mail-${booking.id}`}
                            className="bg-white/5 border border-white/10 text-white/90 py-3 rounded-xl font-medium tracking-wide uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                          >
                            {loadingAction === `mail-${booking.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 opacity-70" />}
                            Enviar Invoice
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => handleDelete(booking.id)}
                          disabled={loadingAction === booking.id}
                          className="w-full mt-2 bg-[var(--color-coral)]/20 text-[var(--color-coral)] border border-[var(--color-coral)]/30 py-3 rounded-xl font-bold tracking-widest uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-[var(--color-coral)]/30 transition-colors"
                        >
                          {loadingAction === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Eliminar Reserva
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10 uppercase tracking-widest text-[10px] opacity-70">
            <tr>
              <th className="px-6 py-4 font-medium">Huésped</th>
              <th className="px-6 py-4 font-medium">Unidad</th>
              <th className="px-6 py-4 font-medium">Fechas</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Fecha Registro</th>
              <th className="px-6 py-4 text-center">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center opacity-50">No hay reservas directas aún.</td>
              </tr>
            ) : (
              bookings.map(booking => {
                const isExpanded = expandedId === booking.id;
                
                return (
                  <React.Fragment key={booking.id}>
                    <tr 
                      onClick={() => toggleExpand(booking.id)}
                      className={`transition-colors group cursor-pointer ${isExpanded ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              {booking.guestName}
                              {booking.isManual && <span className="text-[9px] bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--color-rose-3)]/30">Manual</span>}
                            </p>
                            <p className="opacity-70 text-xs">{booking.guestEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize">{booking.unit.name}</td>
                      <td className="px-6 py-4">
                        {format(new Date(booking.checkIn), 'd MMM', { locale: es })} - {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-[var(--color-rose-3)]/20 text-[var(--color-rose-3)] border border-[var(--color-rose-3)]/30' : 'bg-white/10 text-white/70'}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 opacity-70">
                        {format(new Date(booking.createdAt), 'd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="inline-block opacity-50 group-hover:opacity-100 transition-opacity">
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                      </td>
                    </tr>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <tr className="bg-white/5 border-t-0">
                          <td colSpan={6} className="p-0">
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 md:px-8 grid grid-cols-3 gap-8">
                                <div className="col-span-2 grid grid-cols-2 gap-y-6 gap-x-8">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] opacity-50 uppercase tracking-widest flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono Huésped</span>
                                    <span className="text-sm font-medium text-white">{booking.guestPhone || 'No registrado'}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] opacity-50 uppercase tracking-widest">Anticipo Solicitado</span>
                                    <span className="text-sm font-medium text-white">{booking.depositPercentage || 50}%</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] opacity-50 uppercase tracking-widest">Huéspedes Totales</span>
                                    <span className="text-sm font-medium text-white">{booking.guests}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] opacity-50 uppercase tracking-widest">Total de la Reservación</span>
                                    <span className="text-lg font-bold text-[var(--color-rose-3)]">
                                      {booking.totalPrice ? `$${booking.totalPrice.toLocaleString('es-MX')} MXN` : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="col-span-1 flex flex-col gap-3 justify-center border-l border-white/10 pl-8">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(booking.id); }}
                                    className="w-full bg-[var(--color-rose-3)] text-[var(--color-ink)] py-3 rounded-xl font-bold tracking-widest uppercase text-[11px] flex items-center justify-center gap-2 hover:bg-[var(--color-rose-2)] transition-colors shadow-lg"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Editar Reserva
                                  </button>
                                  
                                  <div className="flex gap-2">
                                    <a 
                                      href={`/api/admin/invoice-html/${booking.id}`}
                                      target="_blank"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 bg-white/5 border border-white/10 text-white/90 py-2.5 rounded-xl font-medium tracking-wide uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5 opacity-70" />
                                      Ver Invoice
                                    </a>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleSendInvoice(booking.id, booking.guestEmail); }}
                                      disabled={loadingAction === `mail-${booking.id}`}
                                      className="flex-1 bg-white/5 border border-white/10 text-white/90 py-2.5 rounded-xl font-medium tracking-wide uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                      {loadingAction === `mail-${booking.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 opacity-70" />}
                                      Re-enviar
                                    </button>
                                  </div>
                                  
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(booking.id); }}
                                    disabled={loadingAction === booking.id}
                                    className="w-full mt-2 bg-[var(--color-coral)]/20 text-[var(--color-coral)] border border-[var(--color-coral)]/30 py-2.5 rounded-xl font-bold tracking-widest uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-[var(--color-coral)]/30 transition-colors"
                                  >
                                    {loadingAction === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Eliminar Reserva
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && editingBookingId && (
        <EditBookingModal 
          isOpen={isEditModalOpen} 
          onClose={() => { setIsEditModalOpen(false); setEditingBookingId(null); }} 
          bookingId={editingBookingId} 
        />
      )}
    </>
  );
}
