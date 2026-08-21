'use client';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { linesReveal, fadeReveal } from '@/lib/animations';

export function Location() {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    linesReveal('.js-lines-loc');
    fadeReveal('.js-fade-loc');
  }, { scope: container });

  return (
    <section 
      ref={container}
      className="bg-[var(--color-green)] text-[var(--color-cream)] pt-[25vh] max-md:pt-[15vh] pb-[40vh] max-md:pb-[20vh] relative z-[7] -mt-[100vh] overflow-hidden sticky bottom-0 min-h-[140dvh] max-md:min-h-[110dvh] flex flex-col justify-center"
      id="ubicacion"
      data-theme="dark"
      style={{ borderRadius: '50% 50% 0 0 / var(--radius-curve-v) var(--radius-curve-v) 0 0' }}
    >
      <div className="max-w-[1200px] mx-auto px-[var(--spacing-pad-x)] flex flex-col md:flex-row gap-[8vw] items-center">
        
        <div className="flex-1 flex flex-col gap-[3vh]">
          <p className="kicker kicker-light">Ubicación</p>
          <h2 className="font-display text-[clamp(3.2rem,9vw,4.5rem)] md:text-[clamp(2.6rem,5vw,4.5rem)] js-lines-loc leading-[1.1]">
            El mar a tus pies
          </h2>
          <p className="lede js-fade-loc">
            Ubicada a tan solo <strong className="font-semibold text-white">5 minutos caminando de la playa</strong>. La distancia perfecta para disfrutar de la tranquilidad del mar y el suave rumor de las olas sin perder la privacidad de tu refugio.
          </p>
          
          <div className="flex flex-wrap gap-[10px] mt-[2vh] js-fade-loc">
            <span className="border border-[rgba(249,241,239,0.4)] rounded-full px-[1.1em] py-[0.45em] text-[0.7rem] tracking-[0.16em] uppercase">
              Chacala, Nayarit
            </span>
            <span className="border border-[rgba(249,241,239,0.4)] rounded-full px-[1.1em] py-[0.45em] text-[0.7rem] tracking-[0.16em] uppercase">
              5 min caminando
            </span>
          </div>
        </div>

        <div className="flex-1 w-full js-fade-loc">
          <div className="aspect-[4/3] w-full rounded-[calc(var(--radius-arch-img)*0.8)_calc(var(--radius-arch-img)*0.8)_20px_20px] overflow-hidden shadow-[0_30px_60px_rgba(30,40,25,0.2)] relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1695.3379879990634!2d-105.22397193705399!3d21.16651790084265!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8420d9d7f1f6da3b%3A0x14abc5b696fa57ee!2sCasa%20Amapa!5e0!3m2!1ses!2smx!4v1787084922270!5m2!1ses!2smx" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[0.2] contrast-[1.1] absolute inset-0"
              title="Ubicación de Casa Amapa en Google Maps"
            ></iframe>
          </div>
        </div>

      </div>
    </section>
  );
}
