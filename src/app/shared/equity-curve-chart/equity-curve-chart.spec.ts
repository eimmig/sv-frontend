import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { EquityCurveChart } from './equity-curve-chart';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Same jsdom canvas gap as shared/monthly-profit-chart - see that spec for the full rationale. */
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

describe('EquityCurveChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    TestBed.configureTestingModule({
      imports: [
        EquityCurveChart,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': {} },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  it('renders the echarts host element without console errors, empty data', () => {
    const fixture = TestBed.createComponent(EquityCurveChart);

    expect(() => fixture.detectChanges()).not.toThrow();
    const host = (fixture.nativeElement as HTMLElement).querySelector('[echarts]');
    expect(host).toBeTruthy();
  });

  it('renders without error given a real timeline', () => {
    const fixture = TestBed.createComponent(EquityCurveChart);
    fixture.componentRef.setInput('data', [
      { date: '2026-01-03', cumulativeProfit: 30 },
      { date: '2026-01-07', cumulativeProfit: -10 },
    ]);

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
