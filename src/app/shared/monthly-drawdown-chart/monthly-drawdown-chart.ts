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

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

function buildChartOption(
  month: MonthlyDrawdownMonth,
  brandColor: string,
  borderColor: string,
  labelColor: string,
): EChartsCoreOption {
  const categories = month.days.map((_, index) => String(index + 1));
  return buildLineChartOption(categories, [...month.days], brandColor, borderColor, labelColor, {
    smooth: false,
    splitNumber: 4,
  });
}

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
    return buildChartOption(
      this.month(),
      readCssColor('--color-brand'),
      readCssColor('--color-border'),
      readCssColor('--color-text-secondary'),
    );
  });
}
