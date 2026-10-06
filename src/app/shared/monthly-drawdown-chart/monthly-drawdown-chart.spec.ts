import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ResizeObserverStub, restoreLocale, stubBrazilianLocale, stubCanvasContext } from '../../core/chart-theme.testing';
import { MonthlyDrawdownChart } from './monthly-drawdown-chart';

describe('MonthlyDrawdownChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    stubBrazilianLocale();
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

  afterEach(() => {
    restoreLocale();
  });

  it('renders the month title and the echarts host without error', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, startDay: 1, days: [0, 5, 5, 3] });

    expect(() => fixture.detectChanges()).not.toThrow();
    const title = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="monthly-drawdown-chart-title"]');
    const host = (fixture.nativeElement as HTMLElement).querySelector('[echarts]');
    expect(title?.textContent).toBeTruthy();
    expect(host).toBeTruthy();
  });

  it('renders without error when every day is null (zero denominator)', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, startDay: 1, days: [null, null, null] });

    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('disables line smoothing and widens the y-axis grid so real reversals stay visible', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, startDay: 1, days: [0, 5, 2, 8] });
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as {
      series: { smooth: boolean }[];
      yAxis: { splitNumber: number };
    };
    expect(options.series[0].smooth).toBe(false);
    expect(options.yAxis.splitNumber).toBe(4);
  });

  it('applies the shared yRange input as explicit yAxis min/max, for comparable scale across months', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, startDay: 1, days: [0, 5, 2, 8] });
    fixture.componentRef.setInput('yRange', { min: -1, max: 10 });
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as { yAxis: { min?: number; max?: number } };
    expect(options.yAxis.min).toBe(-1);
    expect(options.yAxis.max).toBe(10);
  });

  it('labels the x axis from the real start day of the month, not from 1', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 9, startDay: 20, days: [0, 1, 2] });
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as { xAxis: { data: string[] } };
    expect(options.xAxis.data).toEqual(['20', '21', '22']);
  });

  it('labels the axes with the chart-specific translation keys', () => {
    const fixture = TestBed.createComponent(MonthlyDrawdownChart);
    fixture.componentRef.setInput('month', { year: 2026, month: 3, startDay: 1, days: [0, 5, 2, 8] });
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as { xAxis: { name?: string }; yAxis: { name?: string } };
    expect(options.xAxis.name).toBe('charts.drawdown.xAxisLabel');
    expect(options.yAxis.name).toBe('charts.drawdown.yAxisLabel');
  });
});
