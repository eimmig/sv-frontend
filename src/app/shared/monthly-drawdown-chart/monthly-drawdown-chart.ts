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
import { Theme } from '../../core/theme';
import { MonthlyDrawdownMonth } from './monthly-drawdown-metrics';

// Tree-shaken build registered per lazy-loaded component (docs/DESIGN-SYSTEM.md item 6), same
// precedent as shared/monthly-profit-chart.
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

function buildChartOption(month: MonthlyDrawdownMonth, brandColor: string, borderColor: string): EChartsCoreOption {
  const categories = month.days.map((_, index) => String(index + 1));
  return buildLineChartOption(categories, [...month.days], brandColor, borderColor);
}

/**
 * One mini-chart per calendar month (epic-020, docs/STATISTICS.md "Grade de gráficos mensais de
 * drawdown") - N instances reused in shared/panel-layout's auto-fit grid, same parameterized-
 * component precedent as shared/monthly-profit-chart, just X-axis by day-of-month instead of
 * by month.
 */
@Component({
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  selector: 'app-monthly-drawdown-chart',
  templateUrl: './monthly-drawdown-chart.html',
  styleUrl: './monthly-drawdown-chart.scss',
})
export class MonthlyDrawdownChart {
  private readonly theme = inject(Theme);
  private readonly language = inject(Language);

  readonly month = input.required<MonthlyDrawdownMonth>();

  protected readonly title = computed(() => formatMonth(this.month().year, this.month().month, this.language.current()));

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    this.theme.current();
    return buildChartOption(this.month(), readCssColor('--color-brand'), readCssColor('--color-border'));
  });
}
