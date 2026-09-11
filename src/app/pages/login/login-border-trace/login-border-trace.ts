import { Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';

/**
 * Decorative focal-moment animation for the login card (feat-018.3, user request): a green line
 * leaves the top-center point in 2 directions, races down each side, meets at the bottom-center
 * point, then retracts back the way it came - loops while the login page is visible.
 *
 * Both halves are built from the SAME start point (top-center) to the SAME end point
 * (bottom-center), one clockwise and one counter-clockwise, through matching corners - that
 * mirror symmetry guarantees equal path length without measuring, so animating both with
 * identical keyframes makes them meet exactly at the bottom-center point every cycle.
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

  protected readonly width = signal(0);
  protected readonly height = signal(0);

  protected readonly radius = computed(() => Math.min(LoginBorderTrace.RADIUS, this.width() / 2, this.height() / 2));

  protected readonly length = computed(() => {
    const w = this.width();
    const h = this.height();
    const r = this.radius();
    return Math.max(0, w - 2 * r + (h - 2 * r) + Math.PI * r);
  });

  protected readonly pathRight = computed(() => this.halfPath('right'));
  protected readonly pathLeft = computed(() => this.halfPath('left'));

  constructor() {
    const observer = new ResizeObserver(([entry]) => {
      this.width.set(entry.contentRect.width);
      this.height.set(entry.contentRect.height);
    });
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  private halfPath(side: 'left' | 'right'): string {
    const w = this.width();
    const h = this.height();
    const r = this.radius();
    if (w === 0 || h === 0) {
      return '';
    }
    if (side === 'right') {
      return `M ${w / 2} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${w / 2}`;
    }
    return `M ${w / 2} 0 H ${r} A ${r} ${r} 0 0 0 0 ${r} V ${h - r} A ${r} ${r} 0 0 0 ${r} ${h} H ${w / 2}`;
  }
}
