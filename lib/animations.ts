import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

/** Check if user prefers reduced motion */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const linesReveal = (selector: string | HTMLElement | NodeList | HTMLElement[], start = 'top 82%') => {
  const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : Array.isArray(selector) || selector instanceof NodeList ? selector : [selector];
  
  elements.forEach((el) => {
    if (prefersReducedMotion()) {
      // Show content immediately without animation
      gsap.set(el, { opacity: 1, visibility: 'visible' });
      return;
    }

    const text = new SplitType(el as HTMLElement, { types: 'lines', lineClass: 'rl' });
    
    gsap.from(text.lines, {
      y: 46,
      autoAlpha: 0,
      duration: 1.15,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: {
        trigger: el as HTMLElement,
        start,
        once: true
      }
    });
  });
};

export const fadeReveal = (selector: string | HTMLElement | NodeList | HTMLElement[], start = 'top 86%') => {
  const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : Array.isArray(selector) || selector instanceof NodeList ? selector : [selector];
  
  elements.forEach((el) => {
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, visibility: 'visible' });
      return;
    }

    gsap.from(el, {
      y: 26,
      autoAlpha: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el as HTMLElement,
        start,
        once: true
      }
    });
  });
};

export const parallaxAll = (selector = '[data-parallax]') => {
  if (prefersReducedMotion()) return;

  const elements = document.querySelectorAll(selector);
  
  elements.forEach((fig) => {
    const amp = Number((fig as HTMLElement).dataset.parallax);
    const im = fig.querySelector('img');
    if (!im) return;
    
    gsap.fromTo(im, 
      { yPercent: -amp },
      { 
        yPercent: amp, 
        ease: 'none', 
        scrollTrigger: {
          trigger: fig,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  });
};

export const drawPath = (path: SVGPathElement | null, trigger: HTMLElement | null, start = 'top 85%') => {
  if (!path || !path.getTotalLength) return null;

  const L = path.getTotalLength();

  if (prefersReducedMotion()) {
    gsap.set(path, { strokeDasharray: L, strokeDashoffset: 0 });
    return L;
  }

  gsap.set(path, { strokeDasharray: L, strokeDashoffset: L });
  gsap.to(path, {
    strokeDashoffset: 0,
    duration: 1.3,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: trigger || path,
      start,
      once: true
    }
  });
  return L;
};
