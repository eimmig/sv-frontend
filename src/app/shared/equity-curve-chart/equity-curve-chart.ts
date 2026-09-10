import { Component, computed, inject, input } from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { readCssColor, withAlpha } from '../../core/chart-theme';
import { formatDay } from '../../core/date-format';
import { Language } from '../../core/language';
import { StatisticsTimelinePoint } from '../../core/statistics-search-api';
import { Theme } from '../../core/theme';

// Same tree-shaken registration as shared/monthly-profit-chart - this
// component is lazy-loaded only by the search-statistics page.
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

function buildChartOption(
  timeline: StatisticsTimelinePoint[],
  locale: string,
  brandColor: string,
  borderColor: string,
): EChartsCoreOption {
  const labels = timeline.map((point) => formatDay(point.date, locale));
  const cumulativeProfit = timeline.map((point) => point.cumulativeProfit);
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
        data: cumulativeProfit,
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

/** Equity curve (cumulative profit) for the "Buscar Estatisticas" screen (feat-012) - one series over StatisticsSearchResult.timeline. */
@Component({
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  selector: 'app-equity-curve-chart',
  templateUrl: './equity-curve-chart.html',
  styleUrl: './equity-curve-chart.scss',
})
export class EquityCurveChart {
  private readonly theme = inject(Theme);
  private readonly language = inject(Language);

  readonly data = input<StatisticsTimelinePoint[]>([]);

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
