'use client';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fadeReveal, linesReveal } from '@/lib/animations';

export function Chacala() {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    fadeReveal('.js-fade-chacala');
    linesReveal('.js-lines-chacala');
  }, { scope: container });

  return (
    <section
      ref={container}
      className="bg-[var(--color-ink)] text-[var(--color-sand)] relative z-[9] -mt-[var(--spacing-overlap)] pt-[25vh] pb-[30vh] overflow-hidden min-h-[140dvh] flex flex-col justify-center w-full sticky bottom-0"
      id="chacala"
      data-theme="dark"
      style={{ borderRadius: '50% 50% 0 0 / var(--radius-curve-v) var(--radius-curve-v) 0 0' }}
    >
      {/* Scenic Lineart Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Sun (Cortado por el borde derecho y superior curvo) */}
        <svg className="absolute -top-[5vh] md:-top-[8vh] -right-[15vw] md:-right-[5vw] w-[45vw] max-w-[400px] h-auto opacity-40" viewBox="0 0 200 200" fill="none" stroke="var(--color-rose-3)" strokeWidth="1.5">
          <circle cx="100" cy="100" r="80" />
        </svg>

        {/* Clouds (Cortadas por los bordes) */}
        <svg className="absolute top-[15%] -left-[15vw] md:-left-[5vw] w-[50vw] max-w-[500px] h-auto opacity-30" viewBox="0 0 300 100" fill="none" stroke="var(--color-cream)" strokeWidth="1.2">
          <path d="M 20 70 Q 50 70 60 50 A 30 30 0 0 1 120 45 A 25 25 0 0 1 160 55 Q 170 70 200 70" />
          <path d="M 80 85 Q 110 85 120 70 A 20 20 0 0 1 160 65 A 15 15 0 0 1 190 75 Q 200 85 240 85" />
        </svg>
        
        <svg className="absolute top-[35%] -right-[10vw] md:-right-[2vw] w-[35vw] max-w-[300px] h-auto opacity-20" viewBox="0 0 300 100" fill="none" stroke="var(--color-sand)" strokeWidth="1">
          <path d="M 30 60 Q 50 60 60 45 A 20 20 0 0 1 100 45 A 15 15 0 0 1 130 50 Q 140 60 170 60" />
        </svg>

        {/* Ocean Waves */}
        <div className="absolute bottom-[5vh] md:bottom-[10vh] left-0 right-0 h-[25vh] opacity-40 flex flex-col justify-end">
          <svg className="w-[200vw] h-auto absolute bottom-[40px] -left-[10vw]" viewBox="0 0 1440 100" fill="none" stroke="var(--color-cream)" strokeWidth="1" preserveAspectRatio="none">
            <path d="M0 50 Q 120 10, 240 50 T 480 50 T 720 50 T 960 50 T 1200 50 T 1440 50" />
          </svg>
          <svg className="w-[200vw] h-auto absolute bottom-[20px] -left-[5vw]" viewBox="0 0 1440 100" fill="none" stroke="var(--color-rose-3)" strokeWidth="1.5" preserveAspectRatio="none">
            <path d="M0 60 Q 150 20, 300 60 T 600 60 T 900 60 T 1200 60 T 1500 60" />
          </svg>
          <svg className="w-[200vw] h-auto absolute bottom-0 -left-[15vw]" viewBox="0 0 1440 100" fill="none" stroke="var(--color-sand)" strokeWidth="1" preserveAspectRatio="none">
            <path d="M0 70 Q 100 40, 200 70 T 400 70 T 600 70 T 800 70 T 1000 70 T 1200 70 T 1440 70" />
          </svg>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-[var(--spacing-pad-x)] relative z-10 text-center flex flex-col items-center pt-24 pb-4 md:py-32">
        <p className="kicker kicker-light opacity-80 js-fade-chacala">Descubre Chacala</p>

        <h2 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] js-lines-chacala leading-tight mb-8">
          Entre la jungla <br />y el <span className="italic text-[var(--color-rose-3)]">mar salado</span>
        </h2>

        <div className="space-y-6 text-lg md:text-xl opacity-80 leading-relaxed max-w-[700px] js-fade-chacala">
          <p>
            Chacala no es solo una playa, es un secreto guardado a voces en la Riviera Nayarit. Un pequeño pueblo de pescadores donde el ritmo se dicta por las mareas y el sonido de las aves tropicales.
          </p>
          <p>
            Aquí no hay prisa. La bahía en forma de medialuna ofrece aguas tranquilas perfectas para nadar o hacer paddleboard, mientras que la densa jungla que la rodea esconde cascadas y petroglifos antiguos. Es el balance perfecto entre el verde profundo y el azul infinito.
          </p>
          <p className="pt-4 font-display italic text-2xl text-[var(--color-rose-3)]">
            El verdadero lujo es la calma.
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="w-1px h-12 bg-gradient-to-b from-[var(--color-rose-3)] to-transparent mx-auto mt-8 mb-4 js-fade-chacala"></div>
      </div>
    </section>
  );
}
