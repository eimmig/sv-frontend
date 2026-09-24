import { Component, computed, inject, input } from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { buildLineChartOption, readCssColor } from '../../core/chart-theme';
import { formatDay, formatMonth } from '../../core/date-format';
import { Language } from '../../core/language';
import { DailyBetMetrics, MonthlyBetMetrics } from '../../core/statistics-api';
import { Theme } from '../../core/theme';
import { ChartFrame } from '../chart-frame/chart-frame';
import { addDays, toDateOnly } from '../period-preset-filter/period-preset-filter';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const MAX_DAILY_SPAN_DAYS = 31;

export interface ProfitSeries {
  readonly labels: string[];
  readonly values: number[];
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isDailyGranularity(from: string, to: string): boolean {
  if (!from || !to) {
    return false;
  }
  const limit = toDateOnly(addDays(parseDateOnly(from), MAX_DAILY_SPAN_DAYS - 1));
  return to >= from && to <= limit;
}

export function buildProfitSeries(
  monthly: readonly MonthlyBetMetrics[],
  daily: readonly DailyBetMetrics[],
  from: string,
  to: string,
  locale: string,
): ProfitSeries {
  if (!isDailyGranularity(from, to)) {
    return {
      labels: monthly.map((entry) => formatMonth(entry.year, entry.month, locale)),
      values: monthly.map((entry) => entry.metrics.netProfit),
    };
  }
  const byDate = new Map(daily.map((day) => [day.date, day.netProfit]));
  const labels: string[] = [];
  const values: number[] = [];
  const end = parseDateOnly(to);
  for (let cursor = parseDateOnly(from); cursor <= end; cursor = addDays(cursor, 1)) {
    const date = toDateOnly(cursor);
    labels.push(formatDay(date, locale));
    values.push(byDate.get(date) ?? 0);
  }
  return { labels, values };
}

@Component({
  imports: [ChartFrame, NgxEchartsDirective, TranslocoPipe],
  providers: [provideEchartsCore({ echarts })],
  selector: 'app-monthly-profit-chart',
  templateUrl: './monthly-profit-chart.html',
  styleUrl: './monthly-profit-chart.scss',
})
export class MonthlyProfitChart {
  private readonly theme = inject(Theme);
  private readonly language = inject(Language);

  readonly data = input<MonthlyBetMetrics[]>([]);
  readonly daily = input<DailyBetMetrics[]>([]);
  readonly from = input('');
  readonly to = input('');

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    this.theme.current();
    const series = buildProfitSeries(this.data(), this.daily(), this.from(), this.to(), this.language.current());
    return buildLineChartOption(
      series.labels,
      series.values,
      readCssColor('--color-brand'),
      readCssColor('--color-border'),
      readCssColor('--color-text-secondary'),
    );
  });
}
