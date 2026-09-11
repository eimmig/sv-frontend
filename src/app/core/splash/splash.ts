import { Component, OnInit, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

const INTRO_DURATION_MS = 5400;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Plays the StakeVault splash once and locks on the formed logo (see
 * docs/design-references/splash-animation-artistic.html) - `done` fires when
 * the intro finishes so the app can dismiss the overlay. Under
 * prefers-reduced-motion the CSS jumps straight to the final frame, so there
 * is nothing to wait for.
 */
@Component({
  imports: [TranslocoPipe],
  selector: 'app-splash',
  templateUrl: './splash.html',
  styleUrl: './splash.scss',
})
export class Splash implements OnInit {
  readonly done = output<void>();

  ngOnInit(): void {
    const introDurationMs = prefersReducedMotion() ? 0 : INTRO_DURATION_MS;
    setTimeout(() => this.done.emit(), introDurationMs);
  }
}
