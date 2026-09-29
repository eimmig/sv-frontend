import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ResizeObserverStub, restoreLocale, stubBrazilianLocale, stubCanvasContext } from '../../core/chart-theme.testing';
import { EMPTY_BET_METRICS, MonthlyBetMetrics } from '../../core/statistics-api';
import { MonthlyProfitChart, buildProfitSeries, isDailyGranularity } from './monthly-profit-chart';

describe('MonthlyProfitChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    stubBrazilianLocale();
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

  afterEach(() => {
    restoreLocale();
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

  it('labels the axes with the chart-specific translation keys', () => {
    const fixture = TestBed.createComponent(MonthlyProfitChart);
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as { xAxis: { name?: string }; yAxis: { name?: string } };
    expect(options.xAxis.name).toBe('charts.profit.xAxisLabel');
    expect(options.yAxis.name).toBe('charts.profit.yAxisLabel');
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
