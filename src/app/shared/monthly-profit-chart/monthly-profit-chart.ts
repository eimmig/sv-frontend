import { Component, computed, inject, input } from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { formatMonth } from '../../core/date-format';
import { Language } from '../../core/language';
import { MonthlyBetMetrics } from '../../core/statistics-api';
import { Theme } from '../../core/theme';

// Tree-shaken build registered inside this lazy-loaded component rather than
// app.config.ts, so echarts' ~500kB core only ships to the dashboard route
// (see docs/DESIGN-SYSTEM.md item 6, same scoping already used by the
// feat-001.6 proof-of-concept this component supersedes).
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

function readCssColor(name: string): string {
  if (typeof getComputedStyle === 'undefined') {
    return '#3ec46d';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hexColor: string, alpha: number): string {
  const value = hexColor.replace('#', '');
  const r = Number.parseInt(value.substring(0, 2), 16);
  const g = Number.parseInt(value.substring(2, 4), 16);
  const b = Number.parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildChartOption(
  months: MonthlyBetMetrics[],
  locale: string,
  brandColor: string,
  borderColor: string,
): EChartsCoreOption {
  const labels = months.map((entry) => formatMonth(entry.year, entry.month, locale));
  const netProfit = months.map((entry) => entry.metrics.netProfit);
  return {
    grid: { top: 16, right: 16, bottom: 24, left: 48 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: borderColor },
    },
    yAxis: {
      type: 'value',
      splitNumber: 2,
      axisLabel: { color: borderColor },
      splitLine: { lineStyle: { color: borderColor, width: 1 } },
    },
    series: [
      {
        type: 'line',
        data: netProfit,
        symbol: 'circle',
        symbolSize: 6,
        smooth: true,
        itemStyle: { color: brandColor },
        lineStyle: { color: brandColor, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(brandColor, 0.12) },
              { offset: 1, color: withAlpha(brandColor, 0) },
            ],
          },
        },
      },
    ],
  };
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
