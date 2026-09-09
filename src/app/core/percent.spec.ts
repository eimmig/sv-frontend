import { formatPercent } from './percent';

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
