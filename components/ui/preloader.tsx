'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Artificial delay to show the elegant loading animation
    // The total time should be around 2.4s before it starts exiting
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  // Full screen SVG path that covers the screen (y=0 to 100)
  const initialPath = `M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z`;
  // The path curves upwards (less pronounced)
  const [targetPath, setTargetPath] = useState(`M 0 0 L 100 0 L 100 0 Q 50 20 0 0 Z`);

  useEffect(() => {
    // Adjust curve depth based on screen size (even shallower on mobile)
    if (window.innerWidth < 768) {
      setTargetPath(`M 0 0 L 100 0 L 100 0 Q 50 8 0 0 Z`);
    }
  }, []);
  // Finally it flattens
  const finalPath = `M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z`;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }} // We don't fade out the container, the SVG path does the exit
        >
          {/* The curved background curtain */}
          <motion.svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            <motion.path 
              fill="var(--color-rose-3)"
              initial={{ d: initialPath }}
              exit={{ 
                d: [initialPath, targetPath, finalPath],
                transition: { duration: 1.4, times: [0, 0.5, 1], ease: [0.85, 0, 0.15, 1] }
              }}
            />
          </motion.svg>

          {/* Content inside the preloader */}
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center text-white"
            exit={{ opacity: 0, y: -30, transition: { duration: 0.6, ease: "easeOut" } }}
          >
            {/* Arch Vector Animation */}
            <svg 
              className="w-16 h-20 mb-6 stroke-white stroke-[2px] fill-none overflow-visible" 
              viewBox="0 0 100 120"
            >
              <motion.path 
                d="M 20 120 L 20 50 A 30 30 0 0 1 80 50 L 80 120"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
              />
            </svg>

            {/* Brand Text */}
            <motion.h2 
              className="font-display text-4xl md:text-5xl tracking-wide mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Casa Amapa
            </motion.h2>

            {/* Progress Line */}
            <motion.div 
              className="w-[120px] h-[2px] bg-white/20 rounded-full overflow-hidden relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <motion.div 
                className="absolute top-0 left-0 bottom-0 bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.0, ease: "easeInOut", delay: 1.2 }}
              />
            </motion.div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
