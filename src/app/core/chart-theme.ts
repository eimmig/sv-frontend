import { EChartsCoreOption } from 'echarts/core';

export function readCssColor(name: string): string {
  if (typeof getComputedStyle === 'undefined') {
    return '#3ec46d';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function themedTooltip(): { backgroundColor: string; borderColor: string; textStyle: { color: string } } {
  return {
    backgroundColor: readCssColor('--color-surface-elevated'),
    borderColor: readCssColor('--color-border'),
    textStyle: { color: readCssColor('--color-text-primary') },
  };
}

export function withAlpha(hexColor: string, alpha: number): string {
  const value = hexColor.replace('#', '');
  const r = Number.parseInt(value.substring(0, 2), 16);
  const g = Number.parseInt(value.substring(2, 4), 16);
  const b = Number.parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface LineChartStyleOptions {
  readonly smooth?: boolean;
  readonly splitNumber?: number;
}

export function buildLineChartOption(
  categories: string[],
  values: (number | null)[],
  brandColor: string,
  borderColor: string,
  labelColor: string,
  style: LineChartStyleOptions = {},
): EChartsCoreOption {
  const { smooth = true, splitNumber = 2 } = style;
  return {
    grid: { top: 16, right: 16, bottom: 24, left: 48 },
    tooltip: { trigger: 'axis', ...themedTooltip() },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: labelColor },
    },
    yAxis: {
      type: 'value',
      splitNumber,
      axisLabel: { color: labelColor },
      splitLine: { lineStyle: { color: borderColor, width: 1 } },
    },
    series: [
      {
        type: 'line',
        data: values,
        symbol: 'circle',
        symbolSize: 6,
        smooth,
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

export interface ComparisonSeriesStyle {
  readonly name: string;
  readonly color: string;
  readonly data: (number | null)[];
}

function comparisonSeriesOption(style: ComparisonSeriesStyle) {
  return {
    name: style.name,
    type: 'line',
    data: style.data,
    symbol: 'circle',
    symbolSize: 6,
    smooth: true,
    itemStyle: { color: style.color },
    lineStyle: { color: style.color, width: 2 },
  };
}

export function buildComparisonLineChartOption(
  categories: string[],
  seriesA: ComparisonSeriesStyle,
  seriesB: ComparisonSeriesStyle,
  borderColor: string,
  labelColor: string,
): EChartsCoreOption {
  return {
    grid: { top: 16, right: 16, bottom: 24, left: 48 },
    tooltip: { trigger: 'axis', ...themedTooltip() },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: labelColor },
    },
    yAxis: {
      type: 'value',
      splitNumber: 2,
      axisLabel: { color: labelColor },
      splitLine: { lineStyle: { color: borderColor, width: 1 } },
    },
    series: [comparisonSeriesOption(seriesA), comparisonSeriesOption(seriesB)],
  };
}
