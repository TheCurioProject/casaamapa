'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { linesReveal, fadeReveal } from '@/lib/animations';
import { AutoScrollManager } from '@/lib/auto-scroll';

export function Stairs() {
  const steps = [
    { n: '01', t: 'La sombra', d: 'El recibimiento fresco. El primer silencio de la casa.' },
    { n: '02', t: 'La curva', d: 'Estuco rosa aplicado a mano: la imperfección como firma.' },
    { n: '03', t: 'La luz', d: 'La escalera se abre: aparece la bahía, aparece el aire.' },
    { n: '04', t: 'El cielo', d: 'La azotea. El mar a lo lejos. El final del ascenso.' }
  ];

  const container = useRef<HTMLElement>(null);
  const [showHint, setShowHint] = useState(false);

  useGSAP(() => {
    linesReveal('.js-lines');
    fadeReveal('.js-fade');

    const stage = document.querySelector('.spiral-stage');
    const mask = document.querySelector('.spiral-mask');
    const wrap = document.querySelector('.spiral-imgwrap');
    const ring = document.querySelector('.spiral-ring');
    const stepEls = gsap.utils.toArray('.spiral-step') as HTMLElement[];

    if (stage && mask && wrap && ring) {
      const isMobile = window.innerWidth < 768;
      gsap.set(mask, { scale: isMobile ? 0.85 : 0.42 });

      const startInactivityTimers = (st: globalThis.ScrollTrigger) => {
        // progress >= 0 so onEnter at top of section also schedules the tour
        if (st.progress >= 0 && st.progress <= 1) {
          setShowHint(true);
          AutoScrollManager.schedule(() => {
            const currentY = window.scrollY;
            const totalDist = st.end - st.start;

            const p1 = st.start + totalDist * 0.315; // Step 02 visible
            const p2 = st.start + totalDist * 0.465; // Step 03 visible
            const p3 = st.start + totalDist * 0.755; // Step 04 visible
            // st.end is exactly where the pin releases = start of #apartamentos
            const pNext = st.end;

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

            addStep(p1, 1.2, 1.8);
            addStep(p2, 1.2, 1.8);
            addStep(p3, 1.2, 2.2);

            // The final cross-section scroll to #apartamentos cannot use the GSAP proxy
            // because window.scrollTo() inside a GSAP onUpdate is overridden by the
            // scrub:1 pin machinery when crossing the st.end boundary.
            // We use rafScroll (pure requestAnimationFrame) which bypasses GSAP entirely.
            if (currentY < pNext - 20) {
              scrollTween.add(() => {
                AutoScrollManager.rafScroll(pNext, 1.8, () => {
                  window.dispatchEvent(new CustomEvent('stairs-tour-complete'));
                });
              });
            } else {
              // Already at or past the target, dispatch immediately after a brief delay
              scrollTween.add(() => {
                setTimeout(() => window.dispatchEvent(new CustomEvent('stairs-tour-complete')), 100);
              });
            }

          }, 1000);
        }
      };

      const handleUserInteraction = () => {
        AutoScrollManager.interact();
        setShowHint(false);
        const st = tl.scrollTrigger;
        // Only restart the inactivity timer while still inside the stairs section
        if (st && st.isActive) {
          startInactivityTimers(st);
        }
      };

      window.addEventListener('wheel', handleUserInteraction, { passive: true });
      window.addEventListener('touchstart', handleUserInteraction, { passive: true });
      window.addEventListener('touchmove', handleUserInteraction, { passive: true });
      window.addEventListener('mousedown', handleUserInteraction, { passive: true });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=800%',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: () => {
            // interactions caught by event listeners
          },
          onEnter: (self) => startInactivityTimers(self),
          onEnterBack: (self) => startInactivityTimers(self),
          onLeaveBack: () => AutoScrollManager.interact(),
          onLeave: () => {
            // Remove stairs listeners when leaving so they don't kill the
            // apts.tsx auto-scroll tween through the shared AutoScrollManager
            window.removeEventListener('wheel', handleUserInteraction);
            window.removeEventListener('touchstart', handleUserInteraction);
            window.removeEventListener('touchmove', handleUserInteraction);
            window.removeEventListener('mousedown', handleUserInteraction);
          }
        }
      });

      tl.to(mask, { scale: 1, duration: 1.5, ease: 'power2.out' }, 0)
        .fromTo(wrap, { scale: 1.06, rotation: isMobile ? -15 : -5 }, { scale: 1.22, rotation: isMobile ? 15 : 5, duration: 5, ease: 'none' }, 0)
        .to(ring, { rotation: 150, transformOrigin: '50% 50%', duration: 5, ease: 'none' }, 0);

      let t = 0.55;
      stepEls.forEach((s, i) => {
        if (!i) return;

        if (i === 1) t += 0.72;
        else if (i === 2) t += 0.85;
        else if (i === 3) t += 1.6;

        tl.to(stepEls[i - 1], { autoAlpha: 0, y: -16, duration: 0.3 }, t)
          .fromTo(s, { autoAlpha: 0, y: 20 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            onComplete() { s.classList.add('is-active'); },
            onReverseComplete() {
              stepEls[i - 1].classList.add('is-active');
              s.classList.remove('is-active');
            }
          }, t + 0.05);

        if (i === 2) {
          tl.to('.img-luz', { autoAlpha: 1, duration: 0.8 }, t - 0.2);
        } else if (i === 3) {
          tl.to('.img-cielo', { autoAlpha: 1, duration: 0.8 }, t - 0.2);
        }
      });

      tl.set({}, {}, t + 1.8);
    }
  }, { scope: container });

  return (
    <section
      ref={container}
      className="bg-[var(--color-rose-3)] text-[var(--color-cream)] pb-[20vh] relative z-3 -mt-[var(--spacing-overlap)]"
      id="arquitectura"
      data-theme="rose"
      style={{ borderRadius: '50% 50% 0 0 / var(--radius-curve-v) var(--radius-curve-v) 0 0' }}
    >
      <div
        className="spiral-stage h-[100svh] min-h-[100svh] flex flex-col md:grid md:grid-cols-[1fr_1fr] gap-[2vh] md:gap-[6vw] px-[var(--spacing-pad-x)] items-center justify-center relative overflow-hidden py-[8vh] max-md:pt-[clamp(90px,14vh,130px)] max-md:pb-[clamp(40px,6vh,80px)] md:py-0"
        style={{ borderRadius: '50% 50% 0 0 / var(--radius-curve-v) var(--radius-curve-v) 0 0' }}
      >

        <div className="relative h-[24vh] max-md:h-[22vh] md:h-[80vh] w-full flex justify-center items-center mt-0 md:-mt-[10vh]">
          <div className="relative w-[clamp(160px,45vw,22vh)] md:w-[min(70vh,38vw)] aspect-square shrink-0">
            <div className="spiral-mask absolute inset-0 rounded-full overflow-hidden will-change-transform shadow-[0_40px_120px_rgba(20,8,20,0.45)] z-2">
              <div className="spiral-imgwrap absolute inset-0 will-change-transform">
                <Image
                  src="/images/la-arquitectura.webp"
                  alt="Escalera caracol de estuco rosa vista desde abajo"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover img-arq absolute inset-0 z-[1]"
                  priority
                />
                <Image
                  src="/images/la-luz.webp"
                  alt="La luz en la escalera caracol"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover img-luz absolute inset-0 z-[2] opacity-0 invisible"
                />
                <Image
                  src="/images/el-cielo.webp"
                  alt="El cielo desde la escalera caracol"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover img-cielo absolute inset-0 z-[3] opacity-0 invisible"
                />
              </div>
            </div>
            
            <div className="spiral-ring absolute inset-[-14%] w-[128%] h-[128%] pointer-events-none will-change-transform z-1">
              <svg className="w-full h-full" viewBox="0 0 600 600" aria-hidden="true">
                <circle cx="300" cy="300" r="262"
                  fill="none" 
                  stroke="var(--color-sand)" 
                  strokeWidth="1.5"
                  strokeDasharray="820 1646" 
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="opacity-60"
                />
                <circle cx="300" cy="300" r="248"
                  fill="none" 
                  stroke="var(--color-sand)" 
                  strokeWidth="1"
                  strokeDasharray="300 1558" 
                  strokeDashoffset="260"
                  strokeLinecap="round"
                  className="opacity-30"
                />
              </svg>
            </div>
          </div>
        </div>

        <aside className="relative z-2 flex flex-col gap-[1vh] md:mt-[14vh] max-md:text-center max-md:items-center shrink-0">
          <p className="kicker kicker-light max-md:text-[0.75rem]">La arquitectura</p>
          <h2 className="text-[clamp(3rem,11vw,5rem)] md:text-[clamp(2.4rem,8.4vw,5rem)] leading-[0.9] font-display js-lines">Inspirado en el<br className="max-lg:hidden" /> Wabi-Sabi</h2>
          <p className="lede mt-1 max-md:text-[0.85rem] max-md:leading-snug opacity-80 max-md:max-w-[40ch] md:js-fade max-md:text-balance">
            Un caracol de estuco rosa que abraza la belleza de lo imperfecto y lo orgánico. No es solo una escalera: es el corazón de la casa, donde la textura manual y la luz natural celebran la esencia de la filosofía Wabi-Sabi.
          </p>
          <div className="relative h-[120px] md:h-[260px] mt-[1vh] md:mt-2 w-full max-w-[400px]">
            {steps.map((s, i) => (
              <div key={i} className={`spiral-step absolute inset-0 flex flex-col md:grid md:grid-cols-[auto_1fr] gap-[0.5vh] md:gap-[1.8vw] content-start ${i === 0 ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <span className="font-sans font-semibold tracking-wider text-[1.1rem] md:text-[1.5rem] xl:text-[1.8rem] text-[var(--color-cream)] opacity-60 md:mt-1">{s.n}</span>
                <div>
                  <h3 className="font-sans font-medium tracking-tight text-[1.6rem] md:text-[2.2rem] xl:text-[2.8rem] mb-[0.1em] leading-tight">{s.t}</h3>
                  <p className="opacity-80 max-w-[38ch] text-[0.9rem] md:text-[1.1rem] xl:text-[1.2rem] leading-relaxed font-normal">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
