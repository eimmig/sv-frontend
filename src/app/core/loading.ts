import { Injectable, signal } from '@angular/core';

export const SHOW_DELAY_MS = 250;
export const SEQUENCE_MS = 2100;
export const FADE_MS = 400;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Whether the loading overlay is on screen. Requests shorter than SHOW_DELAY_MS never show it;
 * once shown, it stays until the logo sequence has finished (docs/sistema-de-design.md item 17)
 * and then fades out.
 */
@Injectable({ providedIn: 'root' })
export class Loading {
  readonly visible = signal(false);
  readonly leaving = signal(false);

  private pending = 0;
  private shownAt = 0;
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  begin(): void {
    this.pending++;
    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
      this.leaving.set(false);
      return;
    }
    if (this.visible() || this.showTimer !== undefined) {
      return;
    }
    this.showTimer = setTimeout(() => {
      this.showTimer = undefined;
      this.shownAt = Date.now();
      this.visible.set(true);
    }, SHOW_DELAY_MS);
  }

  end(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending > 0) {
      return;
    }
    if (this.showTimer !== undefined) {
      clearTimeout(this.showTimer);
      this.showTimer = undefined;
      return;
    }
    if (!this.visible()) {
      return;
    }
    const reducedMotion = prefersReducedMotion();
    const remaining = reducedMotion ? 0 : Math.max(0, this.shownAt + SEQUENCE_MS - Date.now());
    this.hideTimer = setTimeout(() => {
      this.leaving.set(true);
      this.hideTimer = setTimeout(
        () => {
          this.hideTimer = undefined;
          this.leaving.set(false);
          this.visible.set(false);
        },
        reducedMotion ? 0 : FADE_MS,
      );
    }, remaining);
  }
}
