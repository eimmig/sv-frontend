import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ResizeObserverStub, restoreLocale, stubBrazilianLocale, stubCanvasContext } from '../../core/chart-theme.testing';
import { ComparisonEquityChart } from './comparison-equity-chart';

describe('ComparisonEquityChart', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    stubBrazilianLocale();
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

  afterEach(() => {
    restoreLocale();
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

  it('formats the tooltip value in units with the unit suffix and two decimals', () => {
    const fixture = TestBed.createComponent(ComparisonEquityChart);
    fixture.componentRef.setInput('seriesA', [1, 2]);
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as { tooltip: { valueFormatter: (value: unknown) => string } };
    expect(options.tooltip.valueFormatter(2.340533100752622)).toMatch(/^2[.,]34 U$/);
  });

  it('labels the axes with the chart-specific translation keys', () => {
    const fixture = TestBed.createComponent(ComparisonEquityChart);
    fixture.detectChanges();

    const options = fixture.componentInstance['chartOptions']() as { xAxis: { name?: string }; yAxis: { name?: string } };
    expect(options.xAxis.name).toBe('charts.comparison.xAxisLabel');
    expect(options.yAxis.name).toBe('charts.comparison.yAxisLabel');
  });
});
