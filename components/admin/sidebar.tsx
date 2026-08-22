'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Building, Settings, LogOut, LayoutDashboard, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Calendario', href: '/admin/calendar', icon: Calendar },
    { name: 'Precios', href: '/admin/prices', icon: DollarSign },
    { name: 'Unidades', href: '/admin/units', icon: Building },
    { name: 'Ajustes', href: '/admin/settings', icon: Settings },
  ];

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="w-72 bg-[var(--color-ink)] text-[var(--color-sand)] flex flex-col fixed inset-y-0 left-0 z-50 rounded-r-[2rem] shadow-2xl overflow-hidden border-r border-[rgba(255,255,255,0.05)]"
    >
      <div className="p-10 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-rose-3)] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <Link href="/admin">
          <h1 className="font-display text-4xl tracking-tight text-[var(--color-rose-2)] relative z-10">Amapa</h1>
          <p className="text-[0.65rem] mt-2 tracking-[0.3em] uppercase opacity-70 relative z-10">Admin Panel</p>
        </Link>
      </div>
      
      <nav className="flex-1 px-6 space-y-2 mt-4 relative z-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group ${
                isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-sand)] hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[var(--color-cream)] rounded-2xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-[var(--color-rose-3)]' : 'opacity-50 group-hover:opacity-100'}`} />
              <span className={`text-sm font-medium tracking-wide relative z-10 ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mb-4">
        <form action={onSignOut}>
          <button type="submit" className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[var(--color-coral)] hover:bg-[rgba(208,73,108,0.1)] transition-all duration-300 group">
            <LogOut className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-medium tracking-wide">Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </motion.aside>
  );
}
