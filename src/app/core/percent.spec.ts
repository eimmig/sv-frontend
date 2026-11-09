import { formatPercent, formatPercentagePoints } from './percent';

describe('formatPercent', () => {
  it('formats a 0..1 fraction as a pt-BR percentage', () => {
    expect(formatPercent(0.153, 'pt-BR')).toBe('15,3%');
  });

  it('formats a 0..1 fraction as an en-US percentage', () => {
    expect(formatPercent(0.153, 'en-US')).toBe('15.3%');
  });

  it('formats zero without throwing', () => {
    expect(formatPercent(0, 'pt-BR')).toBe('0%');
  });
});

describe('formatPercentagePoints', () => {
  it('shows a difference of proportions in percentage points, signed, with one decimal', () => {
    expect(formatPercentagePoints(0.0703, 'en-US')).toBe('+7.0');
    expect(formatPercentagePoints(-0.0627, 'pt-BR')).toBe('-6,3');
    expect(formatPercentagePoints(0.00004, 'en-US')).toBe('0.0');
  });
});
