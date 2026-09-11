import { EChartsCoreOption } from 'echarts/core';

/** Reads a CSS custom property (design token) from :root - shared by every ngx-echarts chart so series colors follow the active theme (docs/DESIGN-SYSTEM.md). */
export function readCssColor(name: string): string {
  if (typeof getComputedStyle === 'undefined') {
    return '#3ec46d';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Adds alpha to a `#rrggbb` token for chart area-fill gradients. */
export function withAlpha(hexColor: string, alpha: number): string {
  const value = hexColor.replace('#', '');
  const r = Number.parseInt(value.substring(0, 2), 16);
  const g = Number.parseInt(value.substring(2, 4), 16);
  const b = Number.parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Shared shape for every single-series area/line chart in this app (monthly net profit,
 * equity curve) - category x-axis + one line series with a gradient fill. Callers only prepare
 * their own `categories`/`values` arrays; the visual encoding (grid, axis style, area gradient)
 * stays identical across charts by construction, not by copy-paste.
 */
export function buildLineChartOption(
  categories: string[],
  values: number[],
  brandColor: string,
  borderColor: string,
): EChartsCoreOption {
  return {
    grid: { top: 16, right: 16, bottom: 24, left: 48 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: categories,
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
        data: values,
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
