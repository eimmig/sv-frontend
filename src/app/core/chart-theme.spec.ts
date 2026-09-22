import { buildComparisonLineChartOption, readCssColor, withAlpha } from './chart-theme';

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
      [10, 20, null],
      [5, null, null],
      'Período A',
      'Período B',
      '#2fa85c',
      '#2e70a0',
      '#dce3e0',
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
