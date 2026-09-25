import { buildComparisonLineChartOption, buildLineChartOption, readCssColor, withAlpha } from './chart-theme';

describe('withAlpha', () => {
  it('converts a #rrggbb hex color into an rgba() string with the given alpha', () => {
    expect(withAlpha('#3ec46d', 0.12)).toBe('rgba(62, 196, 109, 0.12)');
  });

  it('supports alpha zero (fully transparent)', () => {
    expect(withAlpha('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('readCssColor', () => {
  it('reads a CSS custom property value from :root', () => {
    document.documentElement.style.setProperty('--test-color', '#123456');

    expect(readCssColor('--test-color')).toBe('#123456');
  });
});

describe('buildComparisonLineChartOption', () => {
  it('builds 2 named, colored series sharing the same category axis, with no area fill or connectNulls', () => {
    const option = buildComparisonLineChartOption(
      ['1', '2', '3'],
      { name: 'Período A', color: '#2fa85c', data: [10, 20, null] },
      { name: 'Período B', color: '#2e70a0', data: [5, null, null] },
      '#dce3e0',
      '#5c6b72',
    );

    expect(option['series']).toHaveLength(2);
    const [seriesA, seriesB] = option['series'] as { name: string; data: unknown[]; areaStyle?: unknown; itemStyle: { color: string } }[];
    expect(seriesA.name).toBe('Período A');
    expect(seriesA.data).toEqual([10, 20, null]);
    expect(seriesA.itemStyle.color).toBe('#2fa85c');
    expect(seriesA.areaStyle).toBeUndefined();
    expect(seriesB.name).toBe('Período B');
    expect(seriesB.data).toEqual([5, null, null]);
    expect(seriesB.itemStyle.color).toBe('#2e70a0');
    expect((option['xAxis'] as { data: string[] }).data).toEqual(['1', '2', '3']);
  });
});

type AxisOption = { axisLabel: { color: string }; splitLine?: { lineStyle: { color: string } } };

function axisColors(option: Record<string, unknown>): { xLabel: string; yLabel: string; grid?: string } {
  const xAxis = option['xAxis'] as AxisOption;
  const yAxis = option['yAxis'] as AxisOption;
  return { xLabel: xAxis.axisLabel.color, yLabel: yAxis.axisLabel.color, grid: yAxis.splitLine?.lineStyle.color };
}

describe('axis label contrast', () => {
  it('paints single-series axis labels with the label color, keeping the grid on the border color', () => {
    const colors = axisColors(buildLineChartOption(['jan'], [1], '#2fa85c', '#dce3e0', '#5c6b72'));

    expect(colors).toEqual({ xLabel: '#5c6b72', yLabel: '#5c6b72', grid: '#dce3e0' });
  });

  it('paints comparison axis labels with the label color, keeping the grid on the border color', () => {
    const colors = axisColors(
      buildComparisonLineChartOption(
        ['1'],
        { name: 'A', color: '#2fa85c', data: [1] },
        { name: 'B', color: '#2e70a0', data: [2] },
        '#dce3e0',
        '#5c6b72',
      ),
    );

    expect(colors).toEqual({ xLabel: '#5c6b72', yLabel: '#5c6b72', grid: '#dce3e0' });
  });
});

describe('buildLineChartOption y-axis bounds', () => {
  it('leaves min/max undefined (auto-scale) when yMin/yMax are not given', () => {
    const option = buildLineChartOption(['jan'], [1], '#2fa85c', '#dce3e0', '#5c6b72') as { yAxis: { min?: number; max?: number } };

    expect(option.yAxis.min).toBeUndefined();
    expect(option.yAxis.max).toBeUndefined();
  });

  it('sets explicit min/max when yMin/yMax are given (shared scale across charts)', () => {
    const option = buildLineChartOption(['jan'], [1], '#2fa85c', '#dce3e0', '#5c6b72', { yMin: -1.2, yMax: 3.5 }) as {
      yAxis: { min?: number; max?: number };
    };

    expect(option.yAxis.min).toBe(-1.2);
    expect(option.yAxis.max).toBe(3.5);
  });
});

describe('tooltip theme', () => {
  const tokens = { '--color-surface-elevated': '#1d2a36', '--color-border': '#24323f', '--color-text-primary': '#f2f7f5' };
  const expected = { trigger: 'axis', backgroundColor: '#1d2a36', borderColor: '#24323f', textStyle: { color: '#f2f7f5' } };

  beforeEach(() => {
    for (const [name, value] of Object.entries(tokens)) {
      document.documentElement.style.setProperty(name, value);
    }
  });

  afterEach(() => {
    for (const name of Object.keys(tokens)) {
      document.documentElement.style.removeProperty(name);
    }
  });

  it('paints the single-series tooltip with the active theme tokens', () => {
    const option = buildLineChartOption(['jan'], [1], '#2fa85c', '#dce3e0', '#5c6b72') as { tooltip: unknown };

    expect(option.tooltip).toEqual(expected);
  });

  it('paints the comparison tooltip with the active theme tokens', () => {
    const option = buildComparisonLineChartOption(
      ['1'],
      { name: 'A', color: '#2fa85c', data: [1] },
      { name: 'B', color: '#2e70a0', data: [2] },
      '#dce3e0',
      '#5c6b72',
    ) as { tooltip: unknown };

    expect(option.tooltip).toEqual(expected);
  });
});
