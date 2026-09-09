import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MonthlyProfitChart } from './monthly-profit-chart';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/**
 * jsdom has no real 2D canvas (getContext('2d') returns null without the
 * native `canvas` package, which this project doesn't install) - zrender
 * (echarts' renderer) dereferences that context unconditionally on init and
 * dispose, throwing during test cleanup. A permissive proxy (every method a
 * no-op, every property settable) is enough for echarts to run its full
 * lifecycle without crashing; it isn't asserting pixels, just that nothing
 * throws.
 */
function stubCanvasContext(): void {
  const noop = () => {};
  const context: Record<string, unknown> = {};
  const proxy = new Proxy(context, {
    get: (target, prop) => {
      if (prop === 'canvas' || prop in target) {
        return target[prop as string];
      }
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: noop });
      }
      if (prop === 'measureText') {
        return () => ({ width: 0 });
      }
      return noop;
    },
    set: (target, prop, value) => {
      target[prop as string] = value;
      return true;
    },
  });
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    context['canvas'] = this;
    return proxy;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

describe('MonthlyProfitChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    TestBed.configureTestingModule({
      imports: [
        MonthlyProfitChart,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': {} },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  it('renders the echarts host element without console errors, empty data', () => {
    const fixture = TestBed.createComponent(MonthlyProfitChart);

    expect(() => fixture.detectChanges()).not.toThrow();
    const host = (fixture.nativeElement as HTMLElement).querySelector('[echarts]');
    expect(host).toBeTruthy();
  });

  it('renders without error given real monthly metrics', () => {
    const fixture = TestBed.createComponent(MonthlyProfitChart);
    fixture.componentRef.setInput('data', [
      {
        year: 2026,
        month: 1,
        metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 },
      },
    ]);

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
