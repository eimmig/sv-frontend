import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ResizeObserverStub, restoreLocale, stubBrazilianLocale, stubCanvasContext } from '../../core/chart-theme.testing';
import { EquityCurveChart } from './equity-curve-chart';

describe('EquityCurveChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    stubBrazilianLocale();
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

  afterEach(() => {
    restoreLocale();
  });

  it('frames the chart with a title, a help toggle and a 1-entry legend', () => {
    const fixture = TestBed.createComponent(EquityCurveChart);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="search-statistics-chart-frame"] h3')).toBeTruthy();
    expect(el.querySelector('[data-testid="search-statistics-chart-frame-help-toggle"]')).toBeTruthy();
    expect(el.querySelectorAll('[data-testid="search-statistics-chart-frame-legend"] li')).toHaveLength(1);
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

  it('adds the year to the dates only when the timeline spans more than one year', () => {
    const fixture = TestBed.createComponent(EquityCurveChart);
    const categories = () =>
      (fixture.componentInstance['chartOptions']() as { xAxis: { data: string[] } }).xAxis.data;

    fixture.componentRef.setInput('data', [
      { date: '2024-01-01', cumulativeProfit: 30 },
      { date: '2026-01-02', cumulativeProfit: -10 },
    ]);
    expect(categories()[0]).toContain('2024');
    expect(categories()[1]).toContain('2026');

    fixture.componentRef.setInput('data', [
      { date: '2026-01-03', cumulativeProfit: 30 },
      { date: '2026-03-07', cumulativeProfit: -10 },
    ]);
    expect(categories().some((label) => label.includes('2026'))).toBe(false);
  });

  it('labels the axes with the chart-specific translation keys', () => {
    const fixture = TestBed.createComponent(EquityCurveChart);
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as { xAxis: { name?: string }; yAxis: { name?: string } };
    expect(options.xAxis.name).toBe('charts.equity.xAxisLabel');
    expect(options.yAxis.name).toBe('charts.equity.yAxisLabel');
  });
});
