import { Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';

@Component({
  selector: 'app-login-border-trace',
  imports: [],
  styleUrl: './login-border-trace.scss',
  templateUrl: './login-border-trace.html',
})
export class LoginBorderTrace {
  private readonly host = inject(ElementRef<HTMLElement>);
  private static readonly RADIUS = 16;
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
