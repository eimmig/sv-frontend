import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { EMPTY_BET_METRICS, MonthlyBetMetrics } from '../../core/statistics-api';
import { MonthlyProfitChart, buildProfitSeries, isDailyGranularity } from './monthly-profit-chart';

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

  it('frames the chart with a title, a help toggle and a 1-entry legend', () => {
    const fixture = TestBed.createComponent(MonthlyProfitChart);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="dashboard-profit-chart-frame"] h3')).toBeTruthy();
    expect(el.querySelector('[data-testid="dashboard-profit-chart-frame-help-toggle"]')).toBeTruthy();
    expect(el.querySelectorAll('[data-testid="dashboard-profit-chart-frame-legend"] li')).toHaveLength(1);
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

describe('profit series granularity', () => {
  const monthly: MonthlyBetMetrics[] = [{ year: 2026, month: 1, metrics: { ...EMPTY_BET_METRICS, netProfit: 150 } }];

  it('plots one point per day, filling days without bets with 0, for a 31-day period', () => {
    const series = buildProfitSeries(
      monthly,
      [
        { date: '2026-01-01', totalStaked: 100, netProfit: 40, roi: 0.4, betCount: 1 },
        { date: '2026-01-31', totalStaked: 100, netProfit: -10, roi: -0.1, betCount: 1 },
      ],
      '2026-01-01',
      '2026-01-31',
      'pt-BR',
    );

    expect(series.values).toHaveLength(31);
    expect(series.values[0]).toBe(40);
    expect(series.values[1]).toBe(0);
    expect(series.values[30]).toBe(-10);
  });

  it('crosses a month boundary day by day for a short period', () => {
    const series = buildProfitSeries(monthly, [], '2026-02-27', '2026-03-02', 'pt-BR');

    expect(series.values).toEqual([0, 0, 0, 0]);
  });

  it('falls back to one point per month for a 32-day period', () => {
    expect(isDailyGranularity('2026-01-01', '2026-02-01')).toBe(false);
    expect(buildProfitSeries(monthly, [], '2026-01-01', '2026-02-01', 'pt-BR').values).toEqual([150]);
  });

  it('plots per month when the period is open-ended', () => {
    expect(isDailyGranularity('', '')).toBe(false);
    expect(isDailyGranularity('2026-01-01', '')).toBe(false);
  });
});
