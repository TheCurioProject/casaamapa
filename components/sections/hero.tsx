'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Hero() {
  const container = useRef<HTMLElement>(null);

  // Parallax effect using Framer Motion
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"]
  });

  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Entrance variants for text elements
  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1.2, ease: "easeOut" } 
    },
  };

  return (
    <section ref={container} className="relative h-[calc(100svh+var(--spacing-overlap))] overflow-hidden bg-[var(--color-ink)]" id="llegada" data-theme="dark" style={{ zIndex: 1 }}>
      
      {/* Background breathing & parallax (Image always there) */}
      <motion.div 
        className="absolute inset-0 will-change-transform"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div className="absolute inset-0 will-change-transform" style={{ y: imgY }}>
          <Image 
            src="/images/hero.webp" 
            alt="Fachada rosa de Casa Amapa con escalera caracol"
            fill
            className="h-[108%] object-cover object-[50%_42%] max-md:hidden"
            priority
          />
          <Image 
            src="/images/mobile-hero.webp" 
            alt="Fachada rosa de Casa Amapa con escalera caracol"
            fill
            className="h-[108%] object-cover object-[50%_90%] md:hidden"
            priority
          />
        </motion.div>
      </motion.div>
      
      <div className="absolute inset-0 z-2 bg-gradient-to-t from-[rgba(61,36,56,0.52)] to-transparent to-48% pointer-events-none" />
      
      {/* Content wrapper with staggering */}
      <motion.div 
        className="absolute z-4 left-[var(--spacing-pad-x)] right-[var(--spacing-pad-x)] bottom-[calc(22vh+var(--spacing-overlap))] max-md:bottom-[calc(20vh+var(--spacing-overlap))] flex flex-col gap-[2vh] items-start"
        style={{ y: contentY, opacity: contentOpacity }}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.15, delayChildren: 2.6 }}
      >
        <motion.svg variants={itemVariants} className="w-[min(300px,56vw)] stroke-[var(--color-sand)] fill-none stroke-[1.5] opacity-90 [stroke-linecap:round] hero-arc" viewBox="0 0 320 60" aria-hidden="true">
          <motion.path 
            d="M4 56 C 90 6, 230 6, 316 56" 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1], delay: 2.8 }}
          />
        </motion.svg>
        
        <motion.p variants={itemVariants} className="text-[var(--color-sand)] tracking-[0.42em] max-md:tracking-[0.3em] text-[11px] uppercase">
          Playa Chacala · Nayarit · México
        </motion.p>
        
        <motion.h1 variants={itemVariants} className="text-[var(--color-cream)] text-[clamp(3.4rem,10.5vw,9.5rem)] max-md:text-[clamp(2.7rem,13.5vw,4.8rem)] overflow-hidden font-display">
          Casa Amapa
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-[var(--color-sand)] text-[clamp(0.95rem,1.3vw,1.15rem)] opacity-92 max-w-[40ch]">
          Una casa que ya te estaba esperando.
        </motion.p>
      </motion.div>
      
    </section>
  );
}
