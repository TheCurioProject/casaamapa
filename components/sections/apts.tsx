'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
import { linesReveal, fadeReveal, parallaxAll } from '@/lib/animations';
import { AutoScrollManager } from '@/lib/auto-scroll';

gsap.registerPlugin(ScrollTrigger);
import { AptModal, AptData } from '@/components/ui/apt-modal';
import { useBookingStore } from '@/lib/store';
import { apartmentsData as c } from '@/lib/data/apartments';

export function Apts() {
  const container = useRef<HTMLElement>(null);
  const [selectedApt, setSelectedApt] = useState<AptData | null>(null);
  const setAptModalOpen = useBookingStore(state => state.setAptModalOpen);
  
  const handleOpenApt = (apt: AptData) => {
    setSelectedApt(apt);
    setAptModalOpen(true);
  };
  const handleCloseApt = () => {
    setSelectedApt(null);
    setAptModalOpen(false);
  };

  const MobileBlock = ({ apt, onOpen }: { apt: typeof c.tierra; onOpen: () => void }) => (
    <article className="mb-[7vh] max-w-full">
      <figure className="aspect-[4/5] mx-[var(--spacing-pad-x)] rounded-[var(--radius-arch-img)_var(--radius-arch-img)_22px_22px] overflow-hidden relative">
        <Image src={apt.imgMain} alt={`Departamento ${apt.name}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover h-[118%] will-change-transform" />
      </figure>
      <div className="p-[5vh_var(--spacing-pad-x)_0] flex flex-col gap-[2.6vh]">
        <h3 className="font-display text-[3.2rem] md:text-[2.6rem]">
          {apt.name} <em className="italic text-[var(--color-rose-3)] text-[0.4em] md:text-[0.62em] font-sans font-medium tracking-wide align-middle">— {apt.tag.toLowerCase()}</em>
        </h3>
        <p className="opacity-80">{apt.shortDesc}</p>
        <ul className="flex flex-wrap gap-[8px]">
          {apt.specs.map(s => (
            <li key={s} className="border border-[rgba(94,58,80,0.32)] rounded-full px-[1em] py-[0.4em] text-[0.66rem] tracking-[0.14em] uppercase">
              {s}
            </li>
          ))}
        </ul>
        <button
          onClick={onOpen}
          className="mt-2 text-[var(--color-sand)] bg-[var(--color-ink)] rounded-full px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase font-semibold hover:bg-black transition-colors w-fit"
        >
          Ver detalles
        </button>
      </div>

    </article>
  );

  const DesktopPanel = ({ apt, onOpen }: { apt: typeof c.tierra; onOpen: () => void }) => (
    <article className="flex-[0_0_84vw] grid grid-cols-[0.85fr_1.15fr] gap-[4vw] items-center">
      <div>
        <span className="font-display text-[var(--color-rose-3)] text-[1rem]">{apt.num}</span>
        <h3 className="text-[clamp(3.5rem,6vw,6rem)] font-display m-[0.1em_0]">{apt.name}</h3>
        <p className="font-sans font-medium italic tracking-wide text-[1.1rem] text-[var(--color-rose-3)] mb-[1.6vh]">{apt.tag}</p>
        <p className="opacity-80 max-w-[42ch] mb-[3vh]">{apt.shortDesc}</p>
        <ul className="flex flex-wrap gap-[10px]">
          {apt.specs.map(s => (
            <li key={s} className="border border-[rgba(94,58,80,0.3)] rounded-full px-[1.1em] py-[0.45em] text-[0.7rem] tracking-[0.16em] uppercase">
              {s}
            </li>
          ))}
        </ul>
        <button
          onClick={onOpen}
          className="mt-8 text-[var(--color-sand)] bg-[var(--color-ink)] rounded-full px-8 py-4 text-[0.75rem] tracking-[0.2em] uppercase font-semibold hover:bg-black transition-all hover:scale-105"
        >
          Ver detalles
        </button>
      </div>
      <figure className="aspect-[16/10] shadow-[0_30px_80px_rgba(61,36,56,0.18)] rounded-[calc(var(--radius-arch-img)*1.2)_calc(var(--radius-arch-img)*1.2)_26px_26px] relative overflow-hidden">
        <Image src={apt.imgMain} alt={`Departamento ${apt.name}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </figure>
    </article>
  );

  useGSAP(() => {
    linesReveal('.js-lines');
    fadeReveal('.js-fade');
    parallaxAll();

    const isDesktop = window.matchMedia('(min-width: 1024px) and (orientation: landscape)').matches;

    if (!isDesktop) {
      // Mobile layout relies solely on native scrolling. Auto-scroll removed as requested.
      return () => {};
    }

    if (isDesktop) {
      const wrap = document.querySelector('.apts-hwrap');
      const cont = document.querySelector('.apts-hscroll');
      const prog = document.querySelector('.apts-prog');

      if (wrap && cont && prog) {
        // Clean up listeners when leaving the section to prevent interference
        const cleanupListeners = () => {
          wrap.removeEventListener('touchstart', handleTouchStart);
          wrap.removeEventListener('touchmove', handleTouchMove);
          wrap.removeEventListener('touchend', handleInteractionEnd);
          wrap.removeEventListener('touchcancel', handleInteractionEnd);
          wrap.removeEventListener('wheel', handleWheel);
          window.removeEventListener('pointerdown', handlePointerDown);
          window.removeEventListener('pointerup', handleInteractionEnd);
          window.removeEventListener('keydown', handleKeyDown);
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: '+=600%',
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              gsap.set(prog, { scaleX: self.progress });
            },
            onEnter: (self) => startDeskInactivityTimers(self),
            onEnterBack: (self) => startDeskInactivityTimers(self),
            onLeaveBack: () => {
              AutoScrollManager.interact();
              cleanupListeners();
            },
            onLeave: () => {
              AutoScrollManager.interact();
              cleanupListeners();
            }
          }
        });

        tl.to(cont, {
          x: () => -(cont.scrollWidth) - window.innerWidth * 0.08 + window.innerWidth,
          ease: 'none',
          duration: 0.85
        })
          .to({}, { duration: 0.22 });

        const startDeskInactivityTimers = (st: globalThis.ScrollTrigger) => {
          if (st.progress >= 0 && st.progress <= 1) {
            AutoScrollManager.schedule(() => {
              const currentY = window.scrollY;
              
              const panels = Array.from(cont.querySelectorAll('article'));
              const maxScrollX = cont.scrollWidth + window.innerWidth * 0.08 - window.innerWidth;
              const totalDist = st.end - st.start;
              
              const markers: number[] = [];
              // First step: Portada (header perfectly centered/visible)
              markers.push(st.start);

              panels.forEach(panel => {
                 const panelCenter = panel.offsetLeft + panel.offsetWidth / 2;
                 const targetX = panelCenter - window.innerWidth / 2;
                 const clampedX = Math.max(0, Math.min(targetX, maxScrollX));
                 
                 const time = (clampedX / maxScrollX) * 0.85;
                 const progress = time / 1.07;
                 
                 markers.push(st.start + totalDist * progress);
              });
              markers.push(st.end);

              const proxy = { y: currentY };
              const scrollTween = gsap.timeline({
                onUpdate: () => AutoScrollManager.setScroll(proxy.y)
              });
              AutoScrollManager.run(scrollTween);

              let prevMarker = st.start;
              let virtualY = currentY;
              let isFirstStep = true;
              const addStep = (target: number, duration: number, readDelay: number) => {
                const stepDist = target - prevMarker;
                prevMarker = target;
                
                if (virtualY < target - 20) {
                  // Use a smoother curve if this is the first tween added (resuming from mid-scroll)
                  const ease = isFirstStep ? 'power2.inOut' : 'power3.inOut';
                  isFirstStep = false;
                  
                  const speed = stepDist > 0 ? stepDist / duration : 1000;
                  const remainingDist = target - virtualY;
                  const adjDuration = Math.max(0.2, speed > 0 ? remainingDist / speed : duration);
                  
                  scrollTween.to(proxy, { y: target, duration: adjDuration, ease });
                  if (readDelay > 0) scrollTween.to({}, { duration: readDelay });
                  
                  virtualY = target;
                }
              };

              // Add steps sequentially
              addStep(markers[0], 1.5, 2.2); // Portada
              addStep(markers[1], 1.2, 2.0); // Tierra
              addStep(markers[2], 1.2, 2.0); // Agua
              addStep(markers[3], 1.2, 0);   // Aire (stop here)
            });
          }
        };

        // Add horizontal touch drag support to drive vertical scroll
        let touchStartX = 0;
        let touchStartY = 0;
        let lastTouchX = 0;
        let isHorizontalSwipe = false;

        const handleTouchStart = (e: Event) => {
          AutoScrollManager.interact();
          const evt = e as TouchEvent;
          touchStartX = evt.touches[0].clientX;
          touchStartY = evt.touches[0].clientY;
          lastTouchX = touchStartX;
          isHorizontalSwipe = false;
        };

        const handleTouchMove = (e: Event) => {
          AutoScrollManager.interact();
          const evt = e as TouchEvent;
          const currentX = evt.touches[0].clientX;
          const currentY = evt.touches[0].clientY;
          
          const deltaX = Math.abs(currentX - touchStartX);
          const deltaY = Math.abs(currentY - touchStartY);

          if (!isHorizontalSwipe && deltaX > 10 && deltaX > deltaY) {
            isHorizontalSwipe = true;
          }

          if (isHorizontalSwipe) {
            if (evt.cancelable) evt.preventDefault();
            const diffX = lastTouchX - currentX;
            window.scrollBy({ top: diffX * 2.5 });
            lastTouchX = currentX;
          }
        };

        const handleInteractionEnd = () => {
          if (tl.scrollTrigger && tl.scrollTrigger.isActive) {
            startDeskInactivityTimers(tl.scrollTrigger);
          }
        };

        const handleWheel = (e: Event) => {
          AutoScrollManager.interact();
          const evt = e as WheelEvent;
          if (Math.abs(evt.deltaX) > Math.abs(evt.deltaY)) {
            if (evt.cancelable) evt.preventDefault();
            window.scrollBy({ top: evt.deltaX });
          }
          if (tl.scrollTrigger && tl.scrollTrigger.isActive) {
            startDeskInactivityTimers(tl.scrollTrigger);
          }
        };

        const handlePointerDown = () => {
          AutoScrollManager.interact();
        };

        const handleKeyDown = (e: Event) => {
          const evt = e as KeyboardEvent;
          const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown', 'Home', 'End'];
          if (navKeys.includes(evt.code)) {
            AutoScrollManager.interact();
            if (tl.scrollTrigger && tl.scrollTrigger.isActive) {
              startDeskInactivityTimers(tl.scrollTrigger);
            }
          }
        };

        wrap.addEventListener('touchstart', handleTouchStart, { passive: true });
        wrap.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrap.addEventListener('touchend', handleInteractionEnd, { passive: true });
        wrap.addEventListener('touchcancel', handleInteractionEnd, { passive: true });
        wrap.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('pointerdown', handlePointerDown, { passive: true });
        window.addEventListener('pointerup', handleInteractionEnd, { passive: true });
        window.addEventListener('keydown', handleKeyDown, { passive: true });

        // Start department tour when arriving from stairs auto-scroll (CustomEvent)
        const onStairsDone = () => {
          const st = tl.scrollTrigger;
          if (st) startDeskInactivityTimers(st);
        };
        window.addEventListener('stairs-tour-complete', onStairsDone);

        // Make sure we remove the CustomEvent listener on unmount/re-run
        return () => {
          cleanupListeners();
          window.removeEventListener('stairs-tour-complete', onStairsDone);
        };
      }
    }
  }, { scope: container });

  return (
    <>
      <section
        ref={container}
        className="bg-[var(--color-sand)] text-[var(--color-ink)] relative z-4 -mt-[var(--spacing-overlap)]"
        id="apartamentos"
        data-theme="light"
        style={{ borderRadius: '50% 50% 0 0 / var(--radius-curve-v) var(--radius-curve-v) 0 0' }}
      >
        {/* Mobile Version */}
        <section
          className="py-[14vh] pb-[120vh] lg:landscape:hidden"
          id="apartamentos-m"
        >


          <header className="px-[var(--spacing-pad-x)] flex flex-col gap-[2.6vh] mb-[9vh]">
            <p className="kicker">{c.kicker}</p>
            <h2 className="font-display text-[clamp(3.5rem,10vw,4.2rem)] md:text-[clamp(2.8rem,9vw,3.2rem)]">{c.introT}</h2>
            <p className="lede">{c.introL}</p>
          </header>

          <MobileBlock apt={c.tierra} onOpen={() => handleOpenApt(c.tierra)} />
          <MobileBlock apt={c.agua} onOpen={() => handleOpenApt(c.agua)} />
          <MobileBlock apt={c.aire} onOpen={() => handleOpenApt(c.aire)} />
        </section>

        {/* Desktop Version */}
        <section
          className="max-lg:hidden portrait:hidden"
        >


          <div className="apts-hwrap h-[100svh] min-h-[600px] overflow-hidden relative">
            <div className="apts-hscroll flex items-center gap-[4vw] h-full px-[8vw] will-change-transform">
              <header className="flex-[0_0_62vw] flex flex-col gap-[3vh]">
                <p className="kicker">{c.kicker}</p>
                <h2 className="font-display text-[clamp(2.6rem,5vw,5rem)] js-lines">{c.introT}</h2>
                <p className="lede">{c.introL}</p>
                <p className="text-[0.7rem] tracking-[0.34em] uppercase opacity-55 mt-[2vh]">Continúa →</p>
              </header>

              <DesktopPanel apt={c.tierra} onOpen={() => handleOpenApt(c.tierra)} />

              <div className="flex-[0_0_35vw] grid place-items-center text-center">
                <div>
                  <h3 className="font-display text-[clamp(3.4rem,7vw,7rem)] text-[var(--color-rose-3)] leading-none">Agua</h3>
                  <p className="font-display italic text-[1.2rem] opacity-65 mt-2">fluir</p>
                </div>
              </div>

              <DesktopPanel apt={c.agua} onOpen={() => handleOpenApt(c.agua)} />

              <div className="flex-[0_0_35vw] grid place-items-center text-center">
                <div>
                  <h3 className="font-display text-[clamp(3.4rem,7vw,7rem)] text-[var(--color-rose-3)] leading-none">Aire</h3>
                  <p className="font-display italic text-[1.2rem] opacity-65 mt-2">respirar</p>
                </div>
              </div>

              <DesktopPanel apt={c.aire} onOpen={() => handleOpenApt(c.aire)} />
              <div className="flex-[0_0_8vw]"></div>
            </div>

            <div className="absolute left-[8vw] right-[8vw] bottom-[12vh] h-[1px] bg-[rgba(94,58,80,0.2)]">
              <span className="apts-prog block h-full bg-[var(--color-rose-3)] origin-left scale-x-0"></span>
            </div>
          </div>
        </section>
      </section>
      <AptModal
        apt={selectedApt}
        isOpen={!!selectedApt}
        onClose={handleCloseApt}
      />
    </>
  );
}
