'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { linesReveal, fadeReveal, parallaxAll } from '@/lib/animations';

export function Amenities() {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    linesReveal('.js-lines-amenities');
    fadeReveal('.js-fade-amenities');
    parallaxAll();
  }, { scope: container });

  return (
    <section 
      ref={container}
      className="bg-[var(--color-ink-2)] text-[var(--color-sand)] pt-[25vh] max-md:pt-[15vh] pb-[28vh] max-md:pb-[20vh] relative z-[5] -mt-[100vh] overflow-hidden sticky bottom-0 min-h-[140dvh] max-md:min-h-[110dvh] flex flex-col justify-center"
      id="amenidades"
      data-theme="dark"
      style={{ borderRadius: '50% 50% 0 0 / var(--radius-curve-v) var(--radius-curve-v) 0 0' }}
    >
      <div className="max-w-[1200px] mx-auto px-[var(--spacing-pad-x)]">
        <header className="flex flex-col gap-[2.6vh] mb-[8vh] max-w-[600px]">
          <p className="kicker kicker-light">Las amenidades</p>
          <h2 className="font-display text-[clamp(2.6rem,5vw,4.5rem)] js-lines-amenities leading-[1.1]">
            El descanso elevado
          </h2>
          <p className="lede js-fade-amenities">
            En lo alto de la casa, la terraza se abre al cielo. Un espacio diseñado para la pausa absoluta, con una piscina de vista infinita que se funde con el horizonte.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.8fr] gap-[8vw] items-start">
          <div className="flex flex-col gap-[2vw]">
            <figure className="aspect-[4/3] md:aspect-[16/10] shadow-[0_30px_80px_rgba(0,0,0,0.3)] rounded-[calc(var(--radius-arch-img)*1.2)_calc(var(--radius-arch-img)*1.2)_26px_26px] relative overflow-hidden" data-parallax="6">
              <Image 
                src="/images/terrazasat.webp" 
                alt="Vista panorámica desde la terraza" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover !h-[120%] !top-[-10%] !w-full !max-w-none will-change-transform" 
              />
            </figure>
            <figure className="aspect-[4/3] md:aspect-[16/10] shadow-[0_30px_80px_rgba(0,0,0,0.3)] rounded-[26px_26px_calc(var(--radius-arch-img)*1.2)_calc(var(--radius-arch-img)*1.2)] relative overflow-hidden" data-parallax="4">
              <Image 
                src="/images/amenidades.webp" 
                alt="Terraza con piscina de vista infinita en el roof" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover !h-[120%] !top-[-10%] !w-full !max-w-none will-change-transform" 
              />
            </figure>
          </div>
          
          <div className="flex flex-col gap-[6vh] js-fade-amenities">
            <div>
              <h3 className="font-display text-[2.6rem] md:text-[2rem] text-white mb-[1.5vh]">Casa Amapa</h3>
              <p className="opacity-90">La propiedad entera tiene una capacidad máxima de 12 personas, ideal para grandes familias y grupos buscando exclusividad.</p>
            </div>
            <div>
              <h3 className="font-display text-[2.6rem] md:text-[2rem] text-white mb-[1.5vh]">Terraza Roof</h3>
              <p className="opacity-90">Piscina de vista infinita (no climatizada), perfecta para refrescarse bajo el sol de Nayarit mientras el océano se extiende frente a ti.</p>
            </div>
            <div>
              <h3 className="font-display text-[2.6rem] md:text-[2rem] text-white mb-[1.5vh]">Espacios Comunes</h3>
              <p className="opacity-90">Áreas de descanso con sombra, tumbonas para tomar el sol y un ambiente de total privacidad y calma.</p>
            </div>

            <div className="mt-[2vh] pt-[4vh] border-t border-[rgba(255,255,255,0.2)]">
              <div className="grid grid-cols-2 gap-x-[4vw] gap-y-[4vh]">

                <div className="flex flex-col gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  </svg>
                  <span className="font-sans font-medium tracking-wide text-[1.2rem] md:text-[1.1rem] leading-[1.2]">Alberca</span>
                </div>
                <div className="flex flex-col gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                    <path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><circle cx="12" cy="20" r="1"/>
                  </svg>
                  <span className="font-sans font-medium tracking-wide text-[1.2rem] md:text-[1.1rem] leading-[1.2]">Wi-Fi de<br/>alta velocidad</span>
                </div>
                <div className="flex flex-col gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                  </svg>
                  <span className="font-sans font-medium tracking-wide text-[1.2rem] md:text-[1.1rem] leading-[1.2]">Cocina<br/>equipada</span>
                </div>
                <div className="flex flex-col gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                    <line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>
                  </svg>
                  <span className="font-sans font-medium tracking-wide text-[1.2rem] md:text-[1.1rem] leading-[1.2]">Aire<br/>acondicionado</span>
                </div>
                <div className="flex flex-col gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
                  </svg>
                  <span className="font-sans font-medium tracking-wide text-[clamp(1.2rem,4vw,1.1rem)] md:text-[clamp(1rem,4vw,1.1rem)] leading-[1.2] break-words">Estacionamiento<br/>privado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
