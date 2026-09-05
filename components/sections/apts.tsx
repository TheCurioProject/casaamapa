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
  const c = {
    kicker: 'Los departamentos',
    introT: 'Tres maneras de habitar la calma',
    introL: 'Tierra abajo, Agua y Aire en el centro y Alberca arriba: tres refugios, que comparten la misma alma de estuco, madera y luz.',
    ctaT: '¿Cuál es el tuyo?',
    ctaNote: 'Cancelación flexible · Atención personal',
    tierra: {
      num: '01',
      name: 'Tierra',
      tag: 'Enraizarse',
      shortDesc: 'Un santuario terrenal de dos habitaciones abrazado por la selva. El refugio perfecto para enraizarse y conectar en familia.',
      desc: 'El refugio perfecto para enraizarse y conectar con la naturaleza en familia. Concebido para el descanso profundo, cuenta con un patio privado abrazado por la selva tropical. Sus espacios incluyen dos habitaciones con camas king size, dos baños completos (uno de ellos con tina), cocina completa y una cálida sala-comedor. Un santuario terrenal que nos recuerda la importancia de volver a nuestro origen natural.',
      specs: ['4 personas', '1 Cama King Size y 1 Cama Queen', 'Patio / Terraza privada', 'Cocina completa', '2 Baños (1 con tina)'],
      imgMain: '/images/tierra.webp',
      cards: [
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/12ad38f46-3c16-40cd-8411-17541666c909.png', c: 'El dormitorio' },
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/1c02f23ec-3e66-41cd-842c-d0d6fd0987c0.png', c: 'El estuco' },
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/10d31ed46-f927-487a-af99-df6cc0f56617.png', c: 'La casa al atardecer' }
      ]
    },
    agua: {
      num: '02',
      name: 'Agua',
      tag: 'Fluir',
      shortDesc: 'Un espacio íntimo y fluido ideal para parejas. Como los afluentes que se unen, invita a la comunicación y conexión profunda.',
      desc: 'Un santuario de fluidez y respiro ideal para parejas; un espacio íntimo que invita a la comunicación y la conexión profunda. Fluye entre una recámara con cama king size, baño completo, cocina equipada y sala-comedor. Como los afluentes que se unen, Agua ofrece la posibilidad de conectarse internamente con Aire, transformándose en un amplio departamento doble para quienes buscan expandir su horizonte.',
      specs: ['2 personas', '1 Cama King Size', 'Conectable con departamento Aire', 'Cocina completa', '1 Baño completo'],
      imgMain: '/images/agua.webp',
      cards: [
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/10d31ed46-f927-487a-af99-df6cc0f56617.png', c: 'La alberca' },
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/12a33d2ee-2f27-4b57-8850-61910eed538c.png', c: 'El baño' },
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/1c02f23ec-3e66-41cd-842c-d0d6fd0987c0.png', c: 'Los detalles' }
      ]
    },
    aire: {
      num: '03',
      name: 'Aire',
      tag: 'Respirar',
      shortDesc: 'Un respiro celestial diseñado para el confort absoluto. Ligero, fresco y elevado, fluyendo libremente hacia la inmensidad.',
      desc: 'Ligero, fresco y elevado. Aire es un respiro celestial diseñado para el confort absoluto. Comparte la armoniosa distribución de su hermano Agua: una recámara con cama king size, baño completo, cocina equipada y sala-comedor bañada en luz natural. Para quienes anhelan la inmensidad, Aire puede entrelazarse con Agua, creando una experiencia expansiva con doble cocina y espacios fluidos compartidos.',
      specs: ['2 personas', '1 Cama King Size', 'Conectable con departamento Agua', 'Cocina completa', '1 Baño completo'],
      imgMain: '/images/aire.webp',
      cards: [
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/1fc047d69-f766-483e-a506-ca8d9c019516.png', c: 'La recámara' },
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/17abb86b4-1418-4923-89ad-4a159686691a.png', c: 'La bahía desde el balcón' },
        { img: 'https://image.qwenlm.ai/public_source/592c4b77-5a7f-4d4f-a31e-8c3c89d757fe/12a33d2ee-2f27-4b57-8850-61910eed538c.png', c: 'La playa, a tres cuadras' }
      ]
    }
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
      const mobSection = document.querySelector('#apartamentos-m');
      if (mobSection) {
        const mobSt = ScrollTrigger.create({
          trigger: mobSection,
          start: 'bottom bottom',
          end: '+=100%',
          pin: true,
          pinSpacing: true,
        });

        const startMobInactivityTimers = () => {
          AutoScrollManager.schedule(() => {
            const currentY = window.scrollY;
            const panels = Array.from(mobSection.querySelectorAll('article'));

            // Measure panel positions at call time (after pin is active)
            const markers = [];
            // First step: Portada (title of the section)
            markers.push(window.scrollY + mobSection.getBoundingClientRect().top);

            panels.forEach(p => {
              markers.push(window.scrollY + p.getBoundingClientRect().top - window.innerHeight * 0.05);
            });
            markers.push(mobSt.end);

            const proxy = { y: currentY };
            const scrollTween = gsap.timeline({
              onUpdate: () => window.scrollTo(0, proxy.y)
            });
            AutoScrollManager.run(scrollTween);

            let isFirstStep = true;
            const addStep = (target: number, duration: number, readDelay: number) => {
              if (currentY < target - 20) {
                const ease = isFirstStep ? 'power2.inOut' : 'power3.inOut';
                isFirstStep = false;
                scrollTween.to(proxy, { y: target, duration, ease });
                if (readDelay > 0) scrollTween.to({}, { duration: readDelay });
              }
            };

            addStep(markers[0], 1.5, 2.2); // Portada
            addStep(markers[1], 1.2, 1.8); // Tierra
            addStep(markers[2], 1.2, 1.8); // Agua
            addStep(markers[3], 1.2, 1.8); // Aire
            addStep(markers[4], 1.2, 0);   // End

          }, 1000);
        };

        const handleMobUserInteraction = () => {
          AutoScrollManager.interact();
          const bounds = mobSection.getBoundingClientRect();
          if (bounds.top < window.innerHeight && bounds.bottom > 0) {
            startMobInactivityTimers();
          }
        };

        const cleanupMobListeners = () => {
          window.removeEventListener('wheel', handleMobUserInteraction);
          window.removeEventListener('touchstart', handleMobUserInteraction);
          window.removeEventListener('touchmove', handleMobUserInteraction);
        };

        const addMobListeners = () => {
          window.addEventListener('wheel', handleMobUserInteraction, { passive: true });
          window.addEventListener('touchstart', handleMobUserInteraction, { passive: true });
          window.addEventListener('touchmove', handleMobUserInteraction, { passive: true });
        };

        ScrollTrigger.create({
          trigger: mobSection,
          start: 'top 80%',
          end: 'bottom top',
          onEnter: () => {
            addMobListeners();
            startMobInactivityTimers();
          },
          onEnterBack: () => {
            addMobListeners();
            startMobInactivityTimers();
          },
          onLeave: () => {
            AutoScrollManager.interact();
            cleanupMobListeners();
          },
          onLeaveBack: () => {
            AutoScrollManager.interact();
            cleanupMobListeners();
          }
        });

        // Start tour when arriving from stairs auto-scroll (CustomEvent)
        const onStairsDone = () => {
          const bounds = mobSection.getBoundingClientRect();
          if (bounds.top < window.innerHeight && bounds.bottom > 0) {
            startMobInactivityTimers();
          }
        };
        window.addEventListener('stairs-tour-complete', onStairsDone);

        // Cleanup on unmount
        return () => {
          cleanupMobListeners();
          window.removeEventListener('stairs-tour-complete', onStairsDone);
        };
      }
    }

    if (isDesktop) {
      const wrap = document.querySelector('.apts-hwrap');
      const cont = document.querySelector('.apts-hscroll');
      const prog = document.querySelector('.apts-prog');

      if (wrap && cont && prog) {
        // Clean up listeners when leaving the section to prevent interference
        const cleanupListeners = () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('wheel', handleWheel);
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
                onUpdate: () => window.scrollTo(0, proxy.y)
              });
              AutoScrollManager.run(scrollTween);

              let isFirstStep = true;
              const addStep = (target: number, duration: number, readDelay: number) => {
                if (currentY < target - 20) {
                  // Use a smoother curve if this is the first tween added (resuming from mid-scroll)
                  const ease = isFirstStep ? 'power2.inOut' : 'power3.inOut';
                  isFirstStep = false;
                  
                  scrollTween.to(proxy, { y: target, duration, ease });
                  if (readDelay > 0) scrollTween.to({}, { duration: readDelay });
                }
              };

              // Add steps sequentially
              addStep(markers[0], 1.5, 2.2); // Portada
              addStep(markers[1], 1.2, 2.0); // Tierra
              addStep(markers[2], 1.2, 2.0); // Agua
              addStep(markers[3], 1.2, 2.0); // Aire
              addStep(markers[4], 1.2, 0);   // Salida
            }, 1000);
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
          if (tl.scrollTrigger && tl.scrollTrigger.isActive) startDeskInactivityTimers(tl.scrollTrigger);
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
          if (tl.scrollTrigger && tl.scrollTrigger.isActive) startDeskInactivityTimers(tl.scrollTrigger);
        };

        const handleWheel = (e: Event) => {
          AutoScrollManager.interact();
          const evt = e as WheelEvent;
          if (Math.abs(evt.deltaX) > Math.abs(evt.deltaY)) {
            if (evt.cancelable) evt.preventDefault();
            window.scrollBy({ top: evt.deltaX });
          }
          if (tl.scrollTrigger && tl.scrollTrigger.isActive) startDeskInactivityTimers(tl.scrollTrigger);
        };

        wrap.addEventListener('touchstart', handleTouchStart, { passive: true });
        wrap.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrap.addEventListener('wheel', handleWheel, { passive: false });

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
          className="py-[14vh] pb-[20vh] lg:landscape:hidden"
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
