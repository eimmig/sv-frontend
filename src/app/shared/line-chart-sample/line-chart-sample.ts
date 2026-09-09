import { Component, computed, inject } from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { Theme } from '../../core/theme';

// Tree-shaken build (only what a line chart with a subtle grid needs, see
// docs/DESIGN-SYSTEM.md item 6) registered inside this lazy-loaded component rather than
// app.config.ts, so echarts' ~500kB core only ships to the routes that render a chart.
echarts.use([LineChart, GridComponent, CanvasRenderer]);

const MOCK_DATA = [820, 932, 901, 934, 1290, 1330, 1320, 1450, 1400, 1620, 1580, 1710];

function readCssColor(name: string): string {
  if (typeof getComputedStyle === 'undefined') {
    return '#3ec46d';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hexColor: string, alpha: number): string {
  const value = hexColor.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildLineChartOption(brandColor: string, borderColor: string): EChartsCoreOption {
  return {
    grid: { top: 16, right: 16, bottom: 24, left: 40 },
    xAxis: {
      type: 'category',
      data: MOCK_DATA.map((_, i) => `${i + 1}`),
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
        data: MOCK_DATA,
        symbol: 'none',
        smooth: true,
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
        markPoint: {
          symbol: 'circle',
          symbolSize: 8,
          label: { show: false },
          itemStyle: { color: brandColor },
          data: [{ coord: [MOCK_DATA.length - 1, MOCK_DATA[MOCK_DATA.length - 1]] }],
        },
      },
    ],
  };
}

/** Proves the ngx-echarts integration (docs/DESIGN-SYSTEM.md item 6) - real dashboard charts are feat-006. */
@Component({
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  selector: 'app-line-chart-sample',
  templateUrl: './line-chart-sample.html',
  styleUrl: './line-chart-sample.scss',
})
export class LineChartSample {
  private readonly theme = inject(Theme);

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    this.theme.current();
    return buildLineChartOption(readCssColor('--color-brand'), readCssColor('--color-border'));
  });
}
