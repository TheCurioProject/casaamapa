'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
import { useDevice } from '@/hooks/use-device';

gsap.registerPlugin(ScrollTrigger);

export function Leyenda() {
  const container = useRef<HTMLElement>(null);
  const [showHint, setShowHint] = useState(false);
  const { isMobile, isHydrated } = useDevice();
  
  useGSAP(() => {
    if (!isHydrated) return;

    if (isMobile) {
      ScrollTrigger.config({ ignoreMobileResize: true });
    }

    let hintTimeout: NodeJS.Timeout;

    // Initial states for SVG elements to avoid transform origin bugs
    gsap.set('.tree-flower', { scale: 0, transformOrigin: '50% 50%' });
    gsap.set('.cosmos, .season-snow', { scale: 0.8, svgOrigin: '50 50' });
    gsap.set('.season-sun', { scale: 0.5, svgOrigin: '50 30' });
    gsap.set('.season-leaf1', { scale: 0.5, svgOrigin: '30 55' });
    gsap.set('.season-leaf2', { scale: 0.5, svgOrigin: '70 55' });



    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=900%',
        scrub: 1.5,
        pin: true,
        onUpdate: (self) => {
          setShowHint(false);
          clearTimeout(hintTimeout);
          if (self.progress > 0 && self.progress < 0.95) {
            hintTimeout = setTimeout(() => setShowHint(true), 800);
          }
        },
        onLeave: () => {
          setShowHint(false);
          clearTimeout(hintTimeout);
        },
        onEnter: () => {
          hintTimeout = setTimeout(() => setShowHint(true), 800);
        }
      }
    });

    const texts = gsap.utils.toArray('.legend-text');
    
    // Scene 0: Cosmos
    tl.to(container.current, { "--radius-progress": 0, duration: 0.15, ease: "power1.inOut" }, 0)
      .to(texts[0] as HTMLElement, { opacity: 1, duration: 0.15 }, 0)
      .to('.cosmos', { scale: 1, opacity: 1, rotation: 90, duration: 0.15, ease: "power2.out" }, 0)
      .to(texts[0] as HTMLElement, { opacity: 0, duration: 0.1 }, "+=0.15")
      .to('.cosmos', { opacity: 0, scale: 0.9, duration: 0.1 }, "<");

    // Scene 1: Seasons
    tl.to(texts[1] as HTMLElement, { opacity: 1, duration: 0.15 })
      .to('.season-sun, .season-leaf1, .season-leaf2', { opacity: 1, scale: 1, stagger: 0.05, duration: 0.2, ease: "back.out(1.5)" }, "<")
      .to(texts[1] as HTMLElement, { opacity: 0, duration: 0.1 }, "+=0.15")
      .to('.season-sun, .season-leaf1, .season-leaf2', { opacity: 0, scale: 0.8, duration: 0.1 }, "<");

    // Scene 2: Winter
    tl.to(texts[2] as HTMLElement, { opacity: 1, duration: 0.15 })
      .to('.season-snow', { opacity: 1, scale: 1, rotation: 45, duration: 0.2, ease: "back.out(1.5)" }, "<")
      .to(texts[2] as HTMLElement, { opacity: 0, duration: 0.1 }, "+=0.15")
      .to('.season-snow', { opacity: 0, scale: 0.8, duration: 0.1 }, "<");

    // Scene 3: Tree grows
    tl.to(texts[3] as HTMLElement, { opacity: 1, duration: 0.15 })
      .to('.tree-path', { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, "<")
      .to(texts[3] as HTMLElement, { opacity: 0, duration: 0.1 }, "+=0.15");

    // Scene 4: Bloom
    tl.to(texts[4] as HTMLElement, { opacity: 1, scale: 1.05, duration: 0.15 })
      .to('.tree-flower', { scale: 1, opacity: 1, stagger: 0.01, duration: 0.3, ease: "back.out(2)" }, "<")
      .to(texts[4] as HTMLElement, { opacity: 0, duration: 0.1 }, "+=0.15");

    // Scene 5: Other trees scared
    tl.to(texts[5] as HTMLElement, { opacity: 1, duration: 0.15 })
      .to(texts[5] as HTMLElement, { opacity: 0, duration: 0.1 }, "+=0.15");

    // Scene 6: God's gift (Colors)
    tl.to(texts[6] as HTMLElement, { opacity: 1, duration: 0.15 })
      .to('.tree-flower', { 
        fill: (index) => {
          const colors = ["#FFFFFF", "#FDE047", "var(--color-rose-2)", "#D946EF", "#A855F7"];
          return colors[index % colors.length];
        },
        stagger: { each: 0.01, from: "center" }, 
        duration: 0.4 
      }, "<")
      .to({}, { duration: 0.4 }); // Extended end buffer to account for the extra 100vh scroll

  }, { scope: container, dependencies: [isHydrated, isMobile] });

  return (
    <section 
      ref={container}
      className="bg-[var(--color-ink)] text-[var(--color-sand)] relative z-[6] -mt-[var(--spacing-overlap)] overflow-hidden"
      id="leyenda"
      data-theme="dark"
      style={{ 
        '--radius-progress': 1,
        borderRadius: 'calc(50% * var(--radius-progress)) calc(50% * var(--radius-progress)) 0 0 / calc(var(--radius-curve-v) * var(--radius-progress)) calc(var(--radius-curve-v) * var(--radius-progress)) 0 0' 
      } as React.CSSProperties}
    >
      <div className="h-[100svh] w-full flex flex-col items-center justify-center pt-[8vh] max-md:pt-[12vh]">
          

          <div className="kicker kicker-light opacity-70 mb-4 md:mb-8">La Leyenda de la Amapa</div>

          <div className="relative w-[85vmin] h-[85vmin] md:w-[50vmin] md:h-[50vmin] flex-shrink-0">
            
            {/* The Stage */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100">
               
               {/* 1. Cosmos */}
               <g className="cosmos opacity-0 will-change-transform" stroke="var(--color-cream)" strokeWidth="0.5" fill="none">
                 <circle cx="50" cy="50" r="18" stroke="var(--color-sand)"/>
                 <circle cx="50" cy="50" r="28" strokeDasharray="1 3" stroke="var(--color-cream)"/>
                 <path d="M50 15 L50 85 M15 50 L85 50 M25 25 L75 75 M25 75 L75 25" stroke="var(--color-rose-1)" opacity="0.6"/>
               </g>

               {/* 2. Seasons */}
               <g className="seasons" strokeWidth="1" fill="none">
                 <g className="season-sun opacity-0 will-change-transform">
                   <circle cx="50" cy="30" r="6" fill="var(--color-sand)" stroke="none"/>
                   <path d="M50 15 L50 20 M50 40 L50 45 M35 30 L40 30 M60 30 L65 30 M39 19 L43 23 M61 41 L57 37 M61 19 L57 23 M39 41 L43 37" stroke="var(--color-sand)" strokeWidth="1.5" strokeLinecap="round"/>
                 </g>
                 <g className="season-leaf1 opacity-0 will-change-transform">
                   <path d="M30 70 C15 55, 15 45, 30 45 C45 45, 45 55, 30 70 Z" stroke="var(--color-cream)" strokeWidth="1.2"/>
                   <path d="M30 45 L30 70 M25 55 L30 50 M35 55 L30 50" stroke="var(--color-cream)" strokeLinecap="round"/>
                 </g>
                 <g className="season-leaf2 opacity-0 will-change-transform">
                   <path d="M70 70 C55 55, 55 45, 70 45 C85 45, 85 55, 70 70 Z" stroke="var(--color-sand)" strokeWidth="1.2"/>
                   <path d="M70 45 L70 70 M65 55 L70 50 M75 55 L70 50" stroke="var(--color-sand)" strokeLinecap="round"/>
                 </g>
               </g>

               {/* 3. Winter */}
               <g className="season-snow opacity-0 will-change-transform" stroke="var(--color-rose-1)" strokeWidth="1" fill="none">
                 <path d="M50 15 L50 85 M15 50 L85 50 M25 25 L75 75 M25 75 L75 25" strokeLinecap="round"/>
                 <path d="M45 25 L50 20 L55 25 M45 75 L50 80 L55 75 M25 45 L20 50 L25 55 M75 45 L80 50 L75 55" strokeLinecap="round"/>
                 <circle cx="50" cy="50" r="3" fill="var(--color-ink)" stroke="var(--color-rose-1)"/>
               </g>

               {/* 4. The Tree */}
               <path 
                 className="tree-path" 
                 d="
                   M50,95 C48,80 49,65 50,55 
                   M50,55 C43,45 33,40 18,36 
                   M50,55 C57,45 67,40 82,36 
                   M45,49 C38,38 28,28 15,22 
                   M55,49 C62,38 72,28 85,22 
                   M48,52 C44,38 38,22 30,12 
                   M52,52 C56,38 62,22 70,12 
                   M50,55 C50,40 50,22 50,8
                   M32,41 C27,33 20,28 12,28
                   M68,41 C73,33 80,28 88,28
                   M25,29 C20,22 15,16 10,12
                   M75,29 C80,22 85,16 90,12
                 " 
                 fill="none" 
                 stroke="var(--color-cream)" 
                 strokeWidth="1.2" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
                 style={{ strokeDasharray: 400, strokeDashoffset: 400 }} 
               />
               
               {/* 5. Flowers */}
               <g className="flowers" fill="var(--color-rose-2)">
                  {[
                    // Clusters around the ends of the branches
                    [18,36], [16,38], [19,39], [15,35], [20,34],
                    [82,36], [84,38], [81,39], [85,35], [80,34],
                    [15,22], [13,24], [16,25], [12,21], [17,20],
                    [85,22], [87,24], [84,25], [88,21], [83,20],
                    [30,12], [28,14], [31,15], [27,11], [32,10],
                    [70,12], [72,14], [69,15], [73,11], [68,10],
                    [50,8], [48,10], [52,10], [47,7], [53,7], [50,5],
                    [12,28], [10,30], [13,31], [9,27], [14,26],
                    [88,28], [90,30], [87,31], [91,27], [86,26],
                    [10,12], [8,14], [11,15], [7,11], [12,10],
                    [90,12], [92,14], [89,15], [93,11], [88,10],
                  ].map(([x,y], i) => (
                    <circle key={i} className="tree-flower opacity-0 will-change-transform" cx={x} cy={y} r={((i * 13) % 15) / 10 + 2} />
                  ))}
               </g>
            </svg>
          </div>

          <div className="relative w-[90%] max-w-[700px] h-[30vh] md:h-[180px] mt-4 md:mt-8 flex items-center justify-center px-4">
             <p className="legend-text opacity-0 absolute text-[clamp(1.1rem,3.5vw,1.5rem)] font-sans font-medium tracking-wide text-[var(--color-cream)] leading-[1.5] text-center w-full text-balance">
               Cuando los dioses preparaban el mundo, pidieron a todos los árboles que eligieran una estación para florecer.
             </p>
             <p className="legend-text opacity-0 absolute text-[clamp(1.1rem,3.5vw,1.5rem)] font-sans font-medium tracking-wide text-[var(--color-cream)] leading-[1.5] text-center w-full text-balance">
               La mayoría eligió el otoño, el verano o la primavera, evitando el invierno por ser frío y seco.
             </p>
             <p className="legend-text opacity-0 absolute text-[clamp(1.1rem,3.5vw,1.5rem)] font-sans font-medium tracking-wide text-[var(--color-cream)] leading-[1.5] text-center w-full text-balance">
               Ante la falta de voluntarios, un árbol callado y valiente se ofreció a florecer en esa época difícil.
             </p>
             <p className="legend-text opacity-0 absolute text-[clamp(1.1rem,3.5vw,1.5rem)] font-sans font-medium tracking-wide text-[var(--color-cream)] leading-[1.5] text-center w-full text-balance">
               Los dioses, impresionados por su coraje, le preguntaron su nombre...
             </p>
             <p className="legend-text opacity-0 absolute text-[clamp(1.5rem,5vw,2.5rem)] font-sans font-bold text-[var(--color-cream)] uppercase tracking-widest text-center w-full text-balance">
               ¡Me llamo Amapa!
             </p>
             <p className="legend-text opacity-0 absolute text-[clamp(1.1rem,3.5vw,1.5rem)] font-sans font-medium tracking-wide text-[var(--color-cream)] leading-[1.5] text-center w-full text-balance">
               Los demás árboles quedaron espantados ante la locura de querer florecer en invierno.
             </p>
             <p className="legend-text opacity-0 absolute text-[clamp(1rem,3.2vw,1.35rem)] font-sans font-medium tracking-wide text-[var(--color-cream)] leading-[1.5] text-center w-full text-balance">
               Los dioses respondieron: “Por tu valentía, te haré florecer con varios colores. Serás blanca, amarilla, rosa y púrpura... para que el invierno nunca pierda la alegría.”
             </p>
          </div>
        </div>
    </section>
  );
}
