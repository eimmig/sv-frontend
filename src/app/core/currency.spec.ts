import { formatBrl } from './currency';

// Intl.NumberFormat('pt-BR') separates the currency symbol from the amount with
// a non-breaking space ( ), not a regular space - a literal " " here looks
// identical in an editor but silently fails to match.
describe('formatBrl', () => {
  it('formats a number as Brazilian Real, independent of the active UI language', () => {
    expect(formatBrl(1234.5)).toBe('R$ 1.234,50');
  });

  it('formats zero correctly', () => {
    expect(formatBrl(0)).toBe('R$ 0,00');
  });
});
