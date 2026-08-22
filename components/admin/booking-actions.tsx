'use client';

import { useState } from 'react';
import { MoreHorizontal, Mail, Trash2, Edit, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialogStore } from '@/store/useDialogStore';

import { EditBookingModal } from './edit-booking-modal';

export function BookingActions({ bookingId, isManual, guestEmail }: { bookingId: string, isManual: boolean, guestEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dialog = useDialogStore();

  const handleDelete = () => {
    dialog.confirm({
      title: '¿Eliminar Reserva?',
      description: '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.',
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        setLoading(true);
        try {
          await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' });
          window.location.reload();
        } catch (err) {
          console.error(err);
          dialog.alert({ title: 'Error', description: 'Ocurrió un error al intentar eliminar la reserva.', type: 'danger' });
          setLoading(false);
        }
      }
    });
  };

  const handleSendInvoice = async () => {
    if (!guestEmail) {
      dialog.alert({ title: 'Sin correo', description: 'Esta reserva no tiene un correo electrónico asociado.', type: 'alert' });
      return;
    }
    setLoading(true);
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
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        disabled={loading}
        className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-70 hover:opacity-100 disabled:opacity-30"
      >
        {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <MoreHorizontal className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-ink-2)] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="py-1">
                <button 
                  onClick={() => { setIsEditModalOpen(true); setIsOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <Edit className="w-4 h-4 opacity-70" />
                  Editar Reserva
                </button>
                <a 
                  href={`/api/admin/invoice-html/${bookingId}`}
                  target="_blank"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <FileText className="w-4 h-4 opacity-70" />
                  Descargar Invoice
                </a>
                <button 
                  onClick={handleSendInvoice}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <Mail className="w-4 h-4 opacity-70" />
                  Re-enviar Invoice
                </button>
                <div className="border-t border-white/10 my-1" />
                <button 
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-coral)] hover:bg-[var(--color-coral)]/10 transition-colors flex items-center gap-3"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {isEditModalOpen && (
        <EditBookingModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          bookingId={bookingId} 
        />
      )}
    </div>
  );
}
