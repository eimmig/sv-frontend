import { Component, computed, inject, input } from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { buildComparisonLineChartOption, readCssColor } from '../../core/chart-theme';
import { Theme } from '../../core/theme';
import { ChartFrame } from '../chart-frame/chart-frame';

// Tree-shaken build registered per lazy-loaded component (docs/DESIGN-SYSTEM.md item 6), same
// precedent as shared/equity-curve-chart/shared/monthly-drawdown-chart. The legend lives in
// shared/chart-frame, not in ECharts.
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

/**
 * Overlays Período A/B's cumulative profit-in-units curves on a shared day-offset axis (see
 * pages/period-comparison/period-comparison-metrics.ts buildComparisonSeries) - 2 series, not a
 * generic parameterization of shared/equity-curve-chart (that component is single-series and
 * reused by a different page with a different data shape).
 */
@Component({
  imports: [ChartFrame, NgxEchartsDirective, TranslocoPipe],
  providers: [provideEchartsCore({ echarts })],
  selector: 'app-comparison-equity-chart',
  templateUrl: './comparison-equity-chart.html',
  styleUrl: './comparison-equity-chart.scss',
})
export class ComparisonEquityChart {
  private readonly theme = inject(Theme);
  private readonly transloco = inject(TranslocoService);

  readonly seriesA = input<(number | null)[]>([]);
  readonly seriesB = input<(number | null)[]>([]);

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    this.theme.current();
    const seriesA = this.seriesA();
    const seriesB = this.seriesB();
    const categories = Array.from({ length: Math.max(seriesA.length, seriesB.length) }, (_, index) => String(index + 1));
    return buildComparisonLineChartOption(
      categories,
      { name: this.transloco.translate('periodComparison.periodALabel'), color: readCssColor('--color-brand'), data: seriesA },
      { name: this.transloco.translate('periodComparison.periodBLabel'), color: readCssColor('--color-action-neutral'), data: seriesB },
      readCssColor('--color-border'),
      readCssColor('--color-text-secondary'),
    );
  });
}
