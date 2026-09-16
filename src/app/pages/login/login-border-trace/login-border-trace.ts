import { Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';

/**
 * Decorative focal-moment animation for the login card: a single closed path traces the card's
 * full rounded-rect outline, with a stroke-dasharray of 2 dashes + 2 gaps sized so each dash/gap
 * pair spans exactly half the perimeter - that makes the two dashes always sit opposite each
 * other, never drifting closer or farther apart. Animating stroke-dashoffset continuously spins
 * both dashes around the whole card forever, one chasing the other with a fixed gap between them.
 */
@Component({
  selector: 'app-login-border-trace',
  imports: [],
  styleUrl: './login-border-trace.scss',
  templateUrl: './login-border-trace.html',
})
export class LoginBorderTrace {
  private readonly host = inject(ElementRef<HTMLElement>);
  private static readonly RADIUS = 16; // matches shared/panel's border-radius (panel.scss)
  // Fraction of each half-perimeter given to the gap (rest is the visible dash) - keeps the two
  // dashes clearly separated without shrinking them into short ticks.
  private static readonly GAP_FRACTION = 0.3;

  protected readonly width = signal(0);
  protected readonly height = signal(0);

  protected readonly radius = computed(() => Math.min(LoginBorderTrace.RADIUS, this.width() / 2, this.height() / 2));

  private readonly halfPerimeter = computed(() => {
    const w = this.width();
    const h = this.height();
    const r = this.radius();
    return Math.max(0, w - 2 * r + (h - 2 * r) + Math.PI * r);
  });

  protected readonly perimeter = computed(() => this.halfPerimeter() * 2);

  private readonly gapLength = computed(() => this.halfPerimeter() * LoginBorderTrace.GAP_FRACTION);
  private readonly dashLength = computed(() => this.halfPerimeter() - this.gapLength());

  protected readonly dashArray = computed(() => {
    const dash = this.dashLength();
    const gap = this.gapLength();
    return `${dash} ${gap} ${dash} ${gap}`;
  });

  protected readonly path = computed(() => {
    const w = this.width();
    const h = this.height();
    const r = this.radius();
    if (w === 0 || h === 0) {
      return '';
    }
    // Starts just clockwise of the top-left corner so that corner is a dash's literal starting
    // point; the second dash (offset by exactly half the perimeter) lands opposite it.
    return (
      `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} ` +
      `H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`
    );
  });

  constructor() {
    const observer = new ResizeObserver(([entry]) => {
      this.width.set(entry.contentRect.width);
      this.height.set(entry.contentRect.height);
    });
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
