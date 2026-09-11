import { readCssColor, withAlpha } from './chart-theme';

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
