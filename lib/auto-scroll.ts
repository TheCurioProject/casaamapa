import gsap from 'gsap';

export class AutoScrollManager {
  private static scrollTween: gsap.core.Timeline | gsap.core.Tween | null = null;
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
   * Schedule a callback to run after a specific delay of inactivity (default 1000ms).
   */
  static schedule(callback: () => void, delayMs = 1000) {
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
}
