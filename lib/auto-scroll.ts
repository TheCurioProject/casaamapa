import gsap from 'gsap';

// A killable handle for rAF-based scrolls that conforms to the GSAP-like interface
interface KillableAnim { kill: () => void; }

export class AutoScrollManager {
  private static scrollTween: gsap.core.Timeline | gsap.core.Tween | KillableAnim | null = null;
  private static inactivityTimeout: NodeJS.Timeout | null = null;

  /**
   * Stop any ongoing auto-scroll animation and clear the inactivity timer.
   * Call this on user interaction (scroll, touch).
   */
  static interact() {
    if (this.scrollTween) {
      this.scrollTween.kill();
      this.scrollTween = null;
    }
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * Schedule a callback to run after a specific delay of inactivity (default 2200ms).
   */
  static schedule(callback: () => void, delayMs = 2200) {
    this.interact(); // Clear previous timers and animations
    this.inactivityTimeout = setTimeout(() => {
      callback();
    }, delayMs);
  }

  /**
   * Register a new GSAP animation (tween or timeline) as the active auto-scroll.
   * Kills any previously running scroll animation to prevent "tirones" (jerks).
   */
  static run(animation: gsap.core.Timeline | gsap.core.Tween) {
    if (this.scrollTween) {
      this.scrollTween.kill();
    }
    this.scrollTween = animation;
  }

  /**
   * Scroll to a target Y position using requestAnimationFrame — completely
   * independent of GSAP. Use this when crossing GSAP pin boundaries, where
   * window.scrollTo() inside a GSAP onUpdate can be ignored by the pin/scrub.
   */
  static rafScroll(targetY: number, durationSec: number, onComplete?: () => void) {
    // Kill any running animation first
    if (this.scrollTween) {
      this.scrollTween.kill();
      this.scrollTween = null;
    }

    const startY = window.scrollY;
    const startTime = performance.now();
    const durationMs = durationSec * 1000;
    let rafId = 0;

    // expo.inOut easing
    const ease = (t: number) =>
      t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / durationMs, 1);
      window.scrollTo(0, Math.round(startY + (targetY - startY) * ease(t)));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        this.scrollTween = null;
        onComplete?.();
      }
    };

    rafId = requestAnimationFrame(tick);

    // Store a killable handle so interact() can cancel the rAF loop
    this.scrollTween = { kill: () => cancelAnimationFrame(rafId) };
  }
}
