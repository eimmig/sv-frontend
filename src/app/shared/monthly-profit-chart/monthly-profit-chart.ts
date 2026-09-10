import { Component, computed, inject, input } from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { buildLineChartOption, readCssColor } from '../../core/chart-theme';
import { formatMonth } from '../../core/date-format';
import { Language } from '../../core/language';
import { MonthlyBetMetrics } from '../../core/statistics-api';
import { Theme } from '../../core/theme';

// Tree-shaken build registered inside this lazy-loaded component rather than
// app.config.ts, so echarts' ~500kB core only ships to the dashboard route
// (see docs/DESIGN-SYSTEM.md item 6, same scoping already used by the
// feat-001.6 proof-of-concept this component supersedes).
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

function buildChartOption(
  months: MonthlyBetMetrics[],
  locale: string,
  brandColor: string,
  borderColor: string,
): EChartsCoreOption {
  const labels = months.map((entry) => formatMonth(entry.year, entry.month, locale));
  const netProfit = months.map((entry) => entry.metrics.netProfit);
  return buildLineChartOption(labels, netProfit, brandColor, borderColor);
}

/** Real dashboard chart (feat-006) - monthly net profit trend from StatisticsDashboard.monthly. */
@Component({
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  selector: 'app-monthly-profit-chart',
  templateUrl: './monthly-profit-chart.html',
  styleUrl: './monthly-profit-chart.scss',
})
export class MonthlyProfitChart {
  private readonly theme = inject(Theme);
  private readonly language = inject(Language);

  readonly data = input<MonthlyBetMetrics[]>([]);

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    this.theme.current();
    return buildChartOption(
      this.data(),
      this.language.current(),
      readCssColor('--color-brand'),
      readCssColor('--color-border'),
    );
  });
}
