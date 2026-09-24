import { formatDateTime, formatDay, formatMonth, spansMoreThanOneYear } from './date-format';

describe('formatDateTime', () => {
  it('formats an ISO instant using the given locale', () => {
    const formatted = formatDateTime('2026-03-05T14:30:00.000Z', 'en-US');

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

  it('includes the year only when asked', () => {
    expect(formatDay('2025-07-03', 'en-US', true)).toContain('2025');
    expect(formatDay('2025-07-03', 'en-US')).not.toContain('2025');
  });
});

describe('spansMoreThanOneYear', () => {
  it('is false up to exactly one year', () => {
    expect(spansMoreThanOneYear('2025-03-10', '2026-03-10')).toBe(false);
  });

  it('is true from one year and one day', () => {
    expect(spansMoreThanOneYear('2025-03-10', '2026-03-11')).toBe(true);
  });
});
