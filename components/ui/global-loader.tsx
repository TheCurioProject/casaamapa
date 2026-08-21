'use client';

import { useLoaderStore } from '@/store/useLoaderStore';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalLoader() {
  const { isOpen, text, progress } = useLoaderStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[var(--color-ink)]/90 backdrop-blur-md"
        >
          <div className="flex flex-col items-center justify-center text-white">
            <svg 
              className="w-16 h-20 mb-8 overflow-visible" 
              viewBox="0 0 100 120"
            >
              <motion.path 
                d="M 20 120 L 20 50 A 30 30 0 0 1 80 50 L 80 120"
                fill="transparent"
                stroke="white"
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

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-2xl md:text-3xl tracking-wide text-center"
            >
              {text}
            </motion.h2>

            {progress > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex flex-col items-center w-48"
              >
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.2 }}
                  />
                </div>
                <span className="font-sans text-xs tracking-widest uppercase opacity-70">
                  {Math.round(progress)}%
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
