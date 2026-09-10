import { formatOdd } from './number-format';

describe('formatOdd', () => {
  it('formats with 2 fixed decimals in pt-BR (comma separator)', () => {
    expect(formatOdd(1.8, 'pt-BR')).toBe('1,80');
  });

  it('formats with 2 fixed decimals in en-US (dot separator)', () => {
    expect(formatOdd(1.8, 'en-US')).toBe('1.80');
  });

  it('rounds instead of truncating', () => {
    expect(formatOdd(1.875, 'en-US')).toBe('1.88');
  });
});
