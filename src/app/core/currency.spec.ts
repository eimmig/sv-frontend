import { formatBrl } from './currency';

describe('formatBrl', () => {
  it('formats a number as Brazilian Real, independent of the active UI language', () => {
    expect(formatBrl(1234.5)).toBe('R$ 1.234,50');
  });

  it('formats zero correctly', () => {
    expect(formatBrl(0)).toBe('R$ 0,00');
  });
});
