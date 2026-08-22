'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Calendar, Building, Settings, LogOut, LayoutDashboard, 
  BookOpen, Link as LinkIcon, CreditCard, X, Menu, Globe, DollarSign
} from 'lucide-react';
import { useLoaderStore } from '@/store/useLoaderStore';

export function AdminShell({ 
  children, 
  onSignOut 
}: { 
  children: React.ReactNode;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const showLoader = useLoaderStore(state => state.showLoader);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const dragControls = useDragControls();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, desc: 'Vista general' },
    { name: 'Bookings', href: '/admin/bookings', icon: BookOpen, desc: 'Gestión de reservas' },
    { name: 'Calendario', href: '/admin/calendar', icon: Calendar, desc: 'Tape Chart' },
    { name: 'Precios', href: '/admin/prices', icon: DollarSign, desc: 'Precios diarios' },
    { name: 'Unidades', href: '/admin/units', icon: Building, desc: 'Propiedades' },
    { name: 'iCal Sync', href: '/admin/ical', icon: LinkIcon, desc: 'Conexión OTAs' },
    { name: 'Stripe', href: '/admin/stripe', icon: CreditCard, desc: 'Pagos' },
    { name: 'Ajustes', href: '/admin/settings', icon: Settings, desc: 'Configuración' },
  ];

  const handleNavigation = (href: string) => {
    if (pathname !== href) {
      showLoader();
    }
    setIsToolsOpen(false);
  };

  return (
    <div className="flex w-full min-h-screen bg-[var(--color-ink-2)] text-[var(--color-sand)] font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 z-50 border-r border-white/10 bg-[var(--color-ink)] shadow-2xl">
        <div className="p-10 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cream)] opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <Link href="/admin">
            <h1 className="font-display text-4xl tracking-tight text-[var(--color-cream)] relative z-10">Casa Amapa</h1>
            <p className="text-[0.65rem] mt-2 tracking-[0.3em] uppercase opacity-90 text-[var(--color-cream)] relative z-10">Admin Panel</p>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-8 relative z-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 relative group ${
                  isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-cream)] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabDesktop"
                    className="absolute inset-0 bg-[var(--color-cream)] rounded-2xl shadow-md"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-[var(--color-ink)]' : 'opacity-70 group-hover:opacity-100'}`} />
                <span className={`text-sm font-medium tracking-wide relative z-10 ${isActive ? 'font-bold' : 'opacity-80 group-hover:opacity-100'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10 relative z-10">
          <Link 
            href="/" 
            className="flex items-center gap-4 px-4 py-3 rounded-2xl text-[var(--color-cream)] hover:bg-white/10 transition-all duration-300 mb-2 group"
          >
            <Globe className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-medium tracking-wide opacity-90 group-hover:opacity-100 transition-opacity">Volver a la Web</span>
          </Link>
          <form action={onSignOut}>
            <button type="submit" className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[var(--color-coral)] hover:bg-[rgba(208,73,108,0.15)] transition-all duration-300 group">
              <LogOut className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium tracking-wide opacity-90 group-hover:opacity-100">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 w-full min-h-screen relative overflow-x-hidden bg-[var(--color-ink-2)]">
        <div className="p-4 pt-10 md:p-12 w-full pb-32 md:pb-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Drawer (Tools) */}
      <AnimatePresence>
        {isToolsOpen && (
          <div className="md:hidden fixed inset-0 z-[1000] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToolsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  setIsToolsOpen(false);
                }
              }}
              className="relative z-10 bg-[var(--color-ink)] border-t border-white/10 rounded-t-3xl p-6 pt-2 shadow-2xl text-[var(--color-cream)] max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div 
                className="w-full py-4 flex justify-center cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 bg-white/30 rounded-full" />
              </div>

              <div 
                className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div>
                  <h2 className="font-display text-2xl tracking-tight text-[var(--color-cream)]">Navegación</h2>
                  <p className="text-xs text-[var(--color-cream)]/70 uppercase tracking-widest mt-1">Admin Panel</p>
                </div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setIsToolsOpen(false)}
                  className="p-2 text-[var(--color-cream)]/70 hover:text-white bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={`flex flex-col p-4 rounded-2xl border transition-all duration-200 ${
                        isActive 
                          ? 'bg-[var(--color-cream)] border-[var(--color-cream)] text-[var(--color-ink)] shadow-lg' 
                          : 'bg-white/5 border-white/10 text-[var(--color-cream)] hover:bg-white/10'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl w-fit mb-3 ${isActive ? 'bg-[var(--color-ink)] text-[var(--color-cream)]' : 'bg-white/10 text-[var(--color-cream)]'}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className={`font-bold text-sm mb-0.5 ${isActive ? 'text-[var(--color-ink)]' : 'text-white'}`}>{item.name}</span>
                      <span className={`text-xs md:text-[10px] font-light leading-snug ${isActive ? 'text-[var(--color-ink)]/70' : 'text-[var(--color-cream)]/60'}`}>{item.desc}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <Link
                  href="/"
                  className="w-full py-3.5 px-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Ver Sitio Público
                </Link>
                <form action={onSignOut}>
                  <button
                    type="submit"
                    onClick={() => setIsToolsOpen(false)}
                    className="w-full py-3.5 px-4 bg-[var(--color-coral)]/20 border border-[var(--color-coral)]/30 text-[var(--color-coral)] rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--color-coral)]/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-[900] bg-[var(--color-ink)] border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around px-2 py-3">
          <Link href="/admin" onClick={() => handleNavigation('/admin')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${pathname === '/admin' ? 'text-[var(--color-cream)]' : 'text-[var(--color-cream)]/50 hover:text-[var(--color-cream)]/80'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Inicio</span>
          </Link>
          <Link href="/admin/bookings" onClick={() => handleNavigation('/admin/bookings')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${pathname === '/admin/bookings' ? 'text-[var(--color-cream)]' : 'text-[var(--color-cream)]/50 hover:text-[var(--color-cream)]/80'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Reservas</span>
          </Link>
          <Link href="/admin/calendar" onClick={() => handleNavigation('/admin/calendar')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${pathname === '/admin/calendar' ? 'text-[var(--color-cream)]' : 'text-[var(--color-cream)]/50 hover:text-[var(--color-cream)]/80'}`}>
            <Calendar className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Calendario</span>
          </Link>
          <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isToolsOpen ? 'text-[var(--color-cream)]' : 'text-[var(--color-cream)]/50 hover:text-[var(--color-cream)]/80'}`}>
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Menú</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
