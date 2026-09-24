import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MonthlyDrawdownChart } from './monthly-drawdown-chart';

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

describe('MonthlyDrawdownChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    TestBed.configureTestingModule({
      imports: [
        MonthlyDrawdownChart,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': {} },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  it('renders the month title and the echarts host without error', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, days: [0, 5, 5, 3] });

    expect(() => fixture.detectChanges()).not.toThrow();
    const title = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="monthly-drawdown-chart-title"]');
    const host = (fixture.nativeElement as HTMLElement).querySelector('[echarts]');
    expect(title?.textContent).toBeTruthy();
    expect(host).toBeTruthy();
  });

  it('renders without error when every day is null (zero denominator)', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, days: [null, null, null] });

    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('disables line smoothing and widens the y-axis grid so real reversals stay visible', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, days: [0, 5, 2, 8] });
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as {
      series: { smooth: boolean }[];
      yAxis: { splitNumber: number };
    };
    expect(options.series[0].smooth).toBe(false);
    expect(options.yAxis.splitNumber).toBe(4);
  });
});
