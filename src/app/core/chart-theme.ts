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
  readonly yMin?: number;
  readonly yMax?: number;
  readonly xAxisName?: string;
  readonly yAxisName?: string;
}

function axisNameStyle(color: string) {
  return { fontSize: 10, color };
}

export function buildLineChartOption(
  categories: string[],
  values: (number | null)[],
  brandColor: string,
  borderColor: string,
  labelColor: string,
  style: LineChartStyleOptions = {},
): EChartsCoreOption {
  const { smooth = true, splitNumber = 2, yMin, yMax, xAxisName, yAxisName } = style;
  return {
    grid: {
      top: 16,
      right: 16,
      bottom: xAxisName ? 40 : 24,
      left: yAxisName ? 64 : 48,
    },
    tooltip: { trigger: 'axis', ...themedTooltip() },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: labelColor },
      name: xAxisName,
      nameLocation: 'middle',
      nameGap: 22,
      nameTextStyle: axisNameStyle(labelColor),
    },
    yAxis: {
      type: 'value',
      splitNumber,
      min: yMin,
      max: yMax,
      axisLabel: { color: labelColor },
      splitLine: { lineStyle: { color: borderColor, width: 1 } },
      name: yAxisName,
      nameLocation: 'middle',
      nameGap: 40,
      nameRotate: 90,
      nameTextStyle: axisNameStyle(labelColor),
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

export interface ComparisonAxisNames {
  readonly xAxisName?: string;
  readonly yAxisName?: string;
}

export function buildComparisonLineChartOption(
  categories: string[],
  seriesA: ComparisonSeriesStyle,
  seriesB: ComparisonSeriesStyle,
  borderColor: string,
  labelColor: string,
  axisNames: ComparisonAxisNames = {},
): EChartsCoreOption {
  const { xAxisName, yAxisName } = axisNames;
  return {
    grid: {
      top: 16,
      right: 16,
      bottom: xAxisName ? 40 : 24,
      left: yAxisName ? 64 : 48,
    },
    tooltip: { trigger: 'axis', ...themedTooltip() },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: labelColor },
      name: xAxisName,
      nameLocation: 'middle',
      nameGap: 22,
      nameTextStyle: axisNameStyle(labelColor),
    },
    yAxis: {
      type: 'value',
      splitNumber: 2,
      axisLabel: { color: labelColor },
      splitLine: { lineStyle: { color: borderColor, width: 1 } },
      name: yAxisName,
      nameLocation: 'middle',
      nameGap: 40,
      nameRotate: 90,
      nameTextStyle: axisNameStyle(labelColor),
    },
    series: [comparisonSeriesOption(seriesA), comparisonSeriesOption(seriesB)],
  };
}
