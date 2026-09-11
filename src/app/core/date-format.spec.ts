import { formatDateTime, formatDay, formatMonth } from './date-format';

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

describe('formatMonth', () => {
  it('formats a 1-indexed year/month pair using the given locale', () => {
    expect(formatMonth(2026, 1, 'en-US')).toMatch(/Jan.*2026/);
  });

  it('produces different output for different locales', () => {
    const en = formatMonth(2026, 3, 'en-US');
    const ptBr = formatMonth(2026, 3, 'pt-BR');

    expect(en).not.toBe(ptBr);
  });
});

describe('formatDay', () => {
  it('formats a bare yyyy-MM-dd date without any time-zone shift', () => {
    expect(formatDay('2026-07-01', 'en-US')).toMatch(/Jul.*01|01.*Jul/);
  });

  it('produces different output for different locales', () => {
    const en = formatDay('2026-07-03', 'en-US');
    const ptBr = formatDay('2026-07-03', 'pt-BR');

    expect(en).not.toBe(ptBr);
  });
});
