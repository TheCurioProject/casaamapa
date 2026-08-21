'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence, useInView } from 'framer-motion';
import { Maximize, Minimize } from 'lucide-react';
import tourDataRaw from '@/public/data/tours.json';

interface VirtualTourProps {
  aptId: string; // "agua", "aire", "tierra"
}

export function VirtualTour({ aptId }: VirtualTourProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "200px 0px" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Storage for preloaded image elements
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0); // 0 to 100
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Interaction states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0 to 1

  // Framer motion values for smooth UI
  const motionProgress = useMotionValue(0);
  const fillWidth = useTransform(motionProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    let isCancelled = false;

    if (!isInView) return;

    async function loadTour() {
      setIsReady(false);
      setLoadProgress(0);
      setProgress(0);
      motionProgress.set(0);
      imagesRef.current = [];
      
      try {
        const data = tourDataRaw as Record<string, any>;
        
        const tourData = data[aptId.toLowerCase()];
        if (!tourData) throw new Error(`No video data for ${aptId}`);

        const duration = tourData.duration;
        const fps = 15; // 15 fps gives great smoothness without destroying memory
        const totalFrames = Math.floor(duration * fps);
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'yqxjvhgh'; 
        
        imagesRef.current = new Array(totalFrames).fill(null);
        let loadedCount = 0;

        // Robust single frame loader with timeout to prevent hanging
        const loadFrame = (i: number): Promise<void> => {
          return new Promise((resolve) => {
            if (isCancelled) return resolve();
            
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Critical for canvas drawing
            
            // Timeout prevents Promise.all from hanging if Cloudinary drops connection
            const timeoutId = setTimeout(() => {
              if (!isCancelled) {
                loadedCount++;
                setLoadProgress(Math.min((loadedCount / totalFrames) * 100, 100));
              }
              resolve();
            }, 10000); // 10s max per frame

            img.onload = () => {
              clearTimeout(timeoutId);
              if (!isCancelled) {
                imagesRef.current[i] = img;
                loadedCount++;
                setLoadProgress(Math.min((loadedCount / totalFrames) * 100, 100));
                
                // If this is the first frame to load, set canvas size
                if (i === 0 && canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  if (ctx) {
                    canvasRef.current.width = img.width;
                    canvasRef.current.height = img.height;
                    ctx.drawImage(img, 0, 0);
                  }
                }
              }
              resolve();
            };
            
            img.onerror = () => {
              clearTimeout(timeoutId);
              if (!isCancelled) {
                loadedCount++;
                setLoadProgress(Math.min((loadedCount / totalFrames) * 100, 100));
              }
              resolve();
            };

            const offset = (i / fps).toFixed(2);
            // Tamaño dinámico: 720p para móviles (mucho más rápido), 1080p para desktop. f_auto para formatos de última generación (AVIF/WebP)
            const widthParam = typeof window !== 'undefined' && window.innerWidth < 768 ? 'w_720' : 'w_1080';
            img.src = `https://res.cloudinary.com/${cloudName}/video/upload/${widthParam},so_${offset},f_auto,q_auto:eco/${tourData.publicId}.jpg`;
          });
        };

        // Load frame 0 immediately
        await loadFrame(0);

        // Concurrency queue for the rest of the frames (loads 24 at a time to saturate HTTP/2)
        const concurrency = 24;
        let index = 1;
        
        const worker = async () => {
          while (index < totalFrames && !isCancelled) {
            const currentIndex = index++;
            await loadFrame(currentIndex);
          }
        };

        const workers = [];
        for (let w = 0; w < concurrency; w++) {
          workers.push(worker());
        }
        
        await Promise.all(workers);

        if (!isCancelled) {
          setIsReady(true);
        }

      } catch (err) {
        console.error(err);
        if (!isCancelled) setIsReady(true); // Unblock UI on complete failure
      }
    }
    loadTour();

    return () => {
      isCancelled = true;
    };
  }, [aptId, motionProgress, isInView]);

  // Canvas drawing loop based on scrubber progress
  useEffect(() => {
    if (imagesRef.current.length === 0 || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const totalFrames = imagesRef.current.length;
    let frameIndex = Math.min(Math.floor(progress * totalFrames), totalFrames - 1);
    
    // Find the closest loaded frame if the exact one isn't loaded yet
    if (!imagesRef.current[frameIndex]) {
      let found = false;
      for (let i = frameIndex; i >= 0; i--) {
        if (imagesRef.current[i]) {
          frameIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        for (let i = frameIndex; i < totalFrames; i++) {
          if (imagesRef.current[i]) {
            frameIndex = i;
            break;
          }
        }
      }
    }

    const imgToDraw = imagesRef.current[frameIndex];
    if (imgToDraw) {
      if (currentIndex !== frameIndex) {
        setCurrentIndex(frameIndex);
        requestAnimationFrame(() => {
          if (canvasRef.current) {
            ctx.drawImage(imgToDraw, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        });
      }
    }
    
  }, [progress, currentIndex]);

  // Handle touch/mouse events for the scrubber
  const handleInteraction = (clientX: number) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const newProgress = x / rect.width;
    
    setProgress(newProgress);
    motionProgress.set(newProgress);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="pt-6 pb-0 md:py-6 w-full">
      <div 
        ref={containerRef}
        className={`relative w-full ${isFullscreen ? 'h-screen bg-black' : 'aspect-[4/3] md:aspect-[2/1] bg-[var(--color-ink)] rounded-none md:rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-y md:border border-[rgba(94,58,80,0.15)]'} overflow-hidden group flex flex-col justify-center`}
      >
        {/* Loading Overlay (Inline) */}
        <AnimatePresence>
          {!isReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--color-ink)]/95 backdrop-blur-xl text-[var(--color-sand)] rounded-[inherit]"
            >
              <div className="flex flex-col items-center justify-center w-full max-w-[200px]">
                <svg className="w-12 h-16 mb-6 overflow-visible" viewBox="0 0 100 120">
                  <motion.path 
                    d="M 20 120 L 20 50 A 30 30 0 0 1 80 50 L 80 120"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3"
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ pathLength: { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }, opacity: { duration: 0.3 } }}
                  />
                </svg>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    className="h-full bg-[var(--color-sand)] rounded-full"
                    animate={{ width: `${loadProgress}%` }}
                    transition={{ ease: "linear", duration: 0.2 }}
                  />
                </div>
                <span className="font-sans text-[0.65rem] tracking-[0.2em] uppercase opacity-70">
                  Preparando {Math.round(loadProgress)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Layer */}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover bg-black"
          style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.8s ease' }}
        />

        {/* Overlay UI (Controls and Progress) */}
        <div 
          className={`absolute inset-x-0 bottom-0 p-5 md:p-8 pt-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-10 ${
            isDragging || loadProgress < 100 ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
          }`}
          style={{ pointerEvents: isReady ? 'auto' : 'none' }}
        >
          {/* Controls Group: Instruction (Left) */}
          <div className="flex justify-between items-end mb-0 px-1 relative z-10 translate-y-1">
            <motion.div 
              className="flex items-center gap-2 md:gap-3 text-white/80 pointer-events-none"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: isDragging ? 0 : 1, y: isDragging ? 5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg width="32" height="10" viewBox="0 0 40 12" fill="none" className="md:w-[40px] md:h-[12px]">
                <motion.path 
                  d="M5 6H35M35 6L30 2M35 6L30 10M5 6L10 2M5 6L10 10" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  animate={{ x: [-3, 3, -3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
              <span className="font-sans text-[0.6rem] md:text-xs tracking-[0.2em] uppercase">
                Desliza para explorar
              </span>
            </motion.div>
          </div>

          {/* Elegant Fill Scrubber */}
          <motion.div 
            className="relative w-full h-12 flex items-center cursor-pointer touch-none group/scrubber"
            ref={progressBarRef}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setIsDragging(true);
              handleInteraction(e.clientX);
            }}
            onPointerMove={(e) => {
              if (isDragging) handleInteraction(e.clientX);
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              setIsDragging(false);
            }}
            onPointerCancel={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              setIsDragging(false);
            }}
            whileHover={{ scaleY: 1.1 }}
          >
            {/* Track (Background Loading Progress) */}
            <div className="absolute inset-x-0 h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-md shadow-inner transition-[height,background-color] duration-300 group-hover/scrubber:h-3 group-hover/scrubber:bg-white/20">
              <motion.div 
                className="h-full bg-white/20"
                animate={{ width: `${loadProgress}%` }}
                transition={{ ease: "linear", duration: 0.2 }}
              />
              
              {/* Inner Glow Animation (Sweep) */}
              <AnimatePresence>
                {!isDragging && (
                  <motion.div 
                    className="absolute top-0 bottom-0 left-0 w-[30%] max-w-[200px] bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-20deg]"
                    initial={{ x: '-150%' }}
                    animate={{ x: '500%' }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
            </div>
            
            {/* Fill Effect (User Scrubbing) */}
            <motion.div 
              style={{ width: fillWidth }}
              className="absolute left-0 h-1.5 md:h-2 bg-white rounded-full pointer-events-none transition-[height] duration-300 group-hover/scrubber:h-3"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
