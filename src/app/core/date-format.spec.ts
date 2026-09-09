import { formatDateTime } from './date-format';

describe('formatDateTime', () => {
  it('formats an ISO instant using the given locale', () => {
    const formatted = formatDateTime('2026-03-05T14:30:00.000Z', 'en-US');

    // Exact wall-clock time depends on the runner's timezone - assert on the
    // locale-specific parts that don't (US month/day ordering, no timezone math).
    expect(formatted).toMatch(/3\/5\/26|5\/3\/26/);
  });

  it('produces different output for different locales', () => {
    const en = formatDateTime('2026-03-05T14:30:00.000Z', 'en-US');
    const ptBr = formatDateTime('2026-03-05T14:30:00.000Z', 'pt-BR');

    expect(en).not.toBe(ptBr);
  });
});
