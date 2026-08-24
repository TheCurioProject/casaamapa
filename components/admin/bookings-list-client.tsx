'use client';

import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Mail, Trash2, FileText, ChevronDown, Phone, Loader2, Globe, FileEdit, Link as LinkIcon, PenTool, ArrowUpRight } from 'lucide-react';
import { useDialogStore } from '@/store/useDialogStore';
import { EditBookingModal } from './edit-booking-modal';

function BookingSection({ 
  title, subtitle, icon: Icon, colorClass, bookings, 
  expandedId, toggleExpand, handleEdit, handleDelete, handleSendInvoice, loadingAction 
}: any) {
  if (!bookings || bookings.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 border border-white/10 rounded-[2rem] shadow-sm overflow-hidden mb-8"
    >
      <div className="p-8 border-b border-white/10 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl mb-1 text-white">{title}</h2>
          <p className="text-xs opacity-60 uppercase tracking-widest text-[var(--color-sand)]">{subtitle}</p>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-4 p-4">
        {bookings.map((booking: any) => {
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
                  {booking.unit?.name || booking.apartmentId}
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
                        <span className="text-[9px] opacity-50 uppercase tracking-widest">Total</span>
                        <span className="text-sm font-bold text-[var(--color-rose-3)]">
                          {(() => {
                            if (booking.totalPrice) return `$${booking.totalPrice.toLocaleString('es-MX')} MXN`;
                            if (!booking.unit) return 'N/A';
                            const nights = Math.max(1, differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn)));
                            return `$${(nights * booking.unit.price).toLocaleString('es-MX')} MXN (Est.)`;
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] opacity-50 uppercase tracking-widest">Huéspedes</span>
                        <span className="text-xs text-white">{booking.guests}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] opacity-50 uppercase tracking-widest">{booking.isManual ? 'Anticipo' : 'Estado de Pago'}</span>
                        <span className="text-xs text-white">{booking.isManual ? `${booking.depositPercentage || 50}%` : 'Liquidado'}</span>
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
        })}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
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
            {bookings.map((booking: any) => {
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
                          </p>
                          <p className="opacity-70 text-xs">{booking.guestEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{booking.unit?.name || booking.apartmentId}</td>
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
                                  <span className="text-[10px] opacity-50 uppercase tracking-widest">{booking.isManual ? 'Anticipo Solicitado' : 'Estado de Pago'}</span>
                                  <span className="text-sm font-medium text-white">{booking.isManual ? `${booking.depositPercentage || 50}%` : 'Liquidación Total'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] opacity-50 uppercase tracking-widest">Huéspedes Totales</span>
                                  <span className="text-sm font-medium text-white">{booking.guests}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] opacity-50 uppercase tracking-widest">Total de la Reservación</span>
                                  <span className="text-lg font-bold text-[var(--color-rose-3)]">
                                    {(() => {
                                      if (booking.totalPrice) return `$${booking.totalPrice.toLocaleString('es-MX')} MXN`;
                                      if (!booking.unit) return 'N/A';
                                      const nights = Math.max(1, differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn)));
                                      return `$${(nights * booking.unit.price).toLocaleString('es-MX')} MXN (Est.)`;
                                    })()}
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
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function BlockSection({ title, subtitle, icon: Icon, colorClass, blocks, handleDeleteBlock, loadingAction }: any) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 border border-white/10 rounded-[2rem] shadow-sm overflow-hidden mb-8"
    >
      <div className="p-8 border-b border-white/10 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl mb-1 text-white">{title}</h2>
          <p className="text-xs opacity-60 uppercase tracking-widest text-[var(--color-sand)]">{subtitle}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Motivo / Origen</th>
              <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Unidad</th>
              <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white">Desde / Hasta</th>
              <th className="px-8 py-5 text-[0.65rem] uppercase tracking-widest font-semibold opacity-60 text-white text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {blocks.map((block: any) => (
              <tr key={block.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-5">
                  <div className="font-medium text-white text-base">{block.reason || 'Sin motivo'}</div>
                </td>
                <td className="px-8 py-5">
                  <span className="bg-black/20 border border-white/10 text-white/90 px-3 py-1 rounded-lg text-xs font-semibold tracking-wide">
                    {block.unit?.name || block.apartmentId}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3 opacity-80 text-xs text-white">
                    <span>{format(new Date(block.startDate), 'dd MMM yyyy', { locale: es })}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-40" />
                    <span>{format(new Date(block.endDate), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => handleDeleteBlock(block.id)}
                    disabled={loadingAction === block.id}
                    className="inline-flex bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors text-xs items-center gap-2 disabled:opacity-50"
                  >
                    {loadingAction === block.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export function BookingsListClient({ 
  webBookings, manualBookings, otaBlocks, manualBlocks 
}: { 
  webBookings: any[]; manualBookings: any[]; otaBlocks: any[]; manualBlocks: any[];
}) {
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const dialog = useDialogStore();

  React.useEffect(() => {
    const editId = searchParams?.get('edit');
    if (editId && (webBookings.some(b => b.id === editId) || manualBookings.some(b => b.id === editId))) {
      setExpandedId(editId);
      setEditingBookingId(editId);
      setIsEditModalOpen(true);
      
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams, webBookings, manualBookings]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleEdit = (bookingId: string) => {
    setEditingBookingId(bookingId);
    setIsEditModalOpen(true);
  };

  const handleDeleteBooking = (bookingId: string) => {
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

  const handleDeleteBlock = (blockId: string) => {
    dialog.confirm({
      title: '¿Eliminar Bloqueo?',
      description: 'Si es un bloqueo de OTA, podría volver a aparecer en la siguiente sincronización. ¿Estás seguro?',
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        setLoadingAction(blockId);
        try {
          await fetch(`/api/admin/calendar/${blockId}`, { method: 'DELETE' });
          window.location.reload();
        } catch (err) {
          console.error(err);
          dialog.alert({ title: 'Error', description: 'Ocurrió un error al intentar eliminar el bloqueo.', type: 'danger' });
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

  const hasAnyData = webBookings.length > 0 || manualBookings.length > 0 || otaBlocks.length > 0 || manualBlocks.length > 0;

  return (
    <>
      <AnimatePresence>
        {!hasAnyData && (
          <div className="p-8 text-center opacity-50 bg-white/5 rounded-2xl border border-white/10">No hay registros para mostrar.</div>
        )}

        <BookingSection 
          title="Reservas Web" 
          subtitle="Realizadas directamente desde Casa Amapa" 
          icon={Globe}
          colorClass="bg-red-500/10 text-red-500"
          bookings={webBookings}
          expandedId={expandedId}
          toggleExpand={toggleExpand}
          handleEdit={handleEdit}
          handleDelete={handleDeleteBooking}
          handleSendInvoice={handleSendInvoice}
          loadingAction={loadingAction}
        />

        <BookingSection 
          title="Reservas Manuales" 
          subtitle="Agregadas manualmente por un administrador" 
          icon={FileEdit}
          colorClass="bg-[var(--color-rose-1)]/20 text-[var(--color-rose-1)]"
          bookings={manualBookings}
          expandedId={expandedId}
          toggleExpand={toggleExpand}
          handleEdit={handleEdit}
          handleDelete={handleDeleteBooking}
          handleSendInvoice={handleSendInvoice}
          loadingAction={loadingAction}
        />

        <BlockSection 
          title="Bloqueos OTA" 
          subtitle="Sincronizados vía iCal desde otras plataformas" 
          icon={LinkIcon}
          colorClass="bg-[#9b4b62]/20 text-[#e0a8b9]"
          blocks={otaBlocks}
          handleDeleteBlock={handleDeleteBlock}
          loadingAction={loadingAction}
        />

        <BlockSection 
          title="Bloqueos Manuales" 
          subtitle="Fechas cerradas por administración" 
          icon={PenTool}
          colorClass="bg-[var(--color-rose-1)]/20 text-[var(--color-rose-1)]"
          blocks={manualBlocks}
          handleDeleteBlock={handleDeleteBlock}
          loadingAction={loadingAction}
        />
      </AnimatePresence>

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
