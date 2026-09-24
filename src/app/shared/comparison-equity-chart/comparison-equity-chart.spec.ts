import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ComparisonEquityChart } from './comparison-equity-chart';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

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

describe('ComparisonEquityChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    TestBed.configureTestingModule({
      imports: [
        ComparisonEquityChart,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': { periodComparison: { periodALabel: 'Período A', periodBLabel: 'Período B' } } },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  it('frames the chart with a title, a help toggle and a 2-entry legend', () => {
    const fixture = TestBed.createComponent(ComparisonEquityChart);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="period-comparison-chart-frame"] h3')).toBeTruthy();
    expect(el.querySelector('[data-testid="period-comparison-chart-frame-help-toggle"]')).toBeTruthy();
    expect(el.querySelectorAll('[data-testid="period-comparison-chart-frame-legend"] li')).toHaveLength(2);
  });

  it('renders the echarts host element without console errors, empty data', () => {
    const fixture = TestBed.createComponent(ComparisonEquityChart);

    expect(() => fixture.detectChanges()).not.toThrow();
    const host = (fixture.nativeElement as HTMLElement).querySelector('[echarts]');
    expect(host).toBeTruthy();
  });

  it('renders without error given 2 real series of different lengths', () => {
    const fixture = TestBed.createComponent(ComparisonEquityChart);
    fixture.componentRef.setInput('seriesA', [10, 20, 15]);
    fixture.componentRef.setInput('seriesB', [5, null, null]);

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
