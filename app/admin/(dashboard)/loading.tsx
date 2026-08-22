'use client';

import { motion } from 'framer-motion';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4 opacity-50">
        <svg 
          className="w-16 h-20 mb-2 overflow-visible" 
          viewBox="0 0 100 120"
        >
          <motion.path 
            d="M 20 120 L 20 50 A 30 30 0 0 1 80 50 L 80 120"
            fill="transparent"
            stroke="var(--color-rose-3)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: {
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              },
              opacity: {
                duration: 0.3
              }
            }}
          />
        </svg>
        <p className="text-sm font-medium tracking-widest uppercase text-[var(--color-sand)]">Cargando...</p>
      </div>
    </div>
  );
}
