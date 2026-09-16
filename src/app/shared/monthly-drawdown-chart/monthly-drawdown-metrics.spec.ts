import { DailyBetMetrics } from '../../core/statistics-api';
import { buildMonthlyDrawdown, resolveMonthRange } from './monthly-drawdown-metrics';

function day(date: string, netProfit: number): DailyBetMetrics {
  return { date, netProfit, totalStaked: 0, roi: 0, betCount: 1 };
}

describe('resolveMonthRange', () => {
  it('locks to day 01 of the start month and the last day of the end month', () => {
    expect(resolveMonthRange('2026-02', '2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('resolves a leap-year February correctly', () => {
    expect(resolveMonthRange('2028-01', '2028-02')).toEqual({ from: '2028-01-01', to: '2028-02-29' });
  });

  it('resolves a 31-day end month correctly', () => {
    expect(resolveMonthRange('2026-01', '2026-01')).toEqual({ from: '2026-01-01', to: '2026-01-31' });
  });
});

describe('buildMonthlyDrawdown', () => {
  it('accumulates day by day within a month and resets to 0 at the next month', () => {
    const daily = [day('2026-01-01', 100), day('2026-01-02', -50), day('2026-02-01', 20)];

    const months = buildMonthlyDrawdown(daily, '2026-01-01', '2026-02-28', 1000, 0.01);

    expect(months).toHaveLength(2);
    expect(months[0].year).toBe(2026);
    expect(months[0].month).toBe(1);
    expect(months[0].days[0]).toBeCloseTo(10); // 100 / (1000 * 0.01)
    expect(months[0].days[1]).toBeCloseTo(5); // 10 + (-50 / 10)
    expect(months[1].days[0]).toBeCloseTo(2); // resets to 0, then 20 / 10
  });

  it('a day without a settled bet carries the previous day accumulated value forward', () => {
    const daily = [day('2026-01-01', 100)];

    const months = buildMonthlyDrawdown(daily, '2026-01-01', '2026-01-03', 1000, 0.01);

    expect(months[0].days[0]).toBeCloseTo(10);
    expect(months[0].days[1]).toBeCloseTo(10); // day 2, no bet, same as day 1
    expect(months[0].days[2]).toBeCloseTo(10); // day 3, no bet, same as day 1
  });

  it('a month with no bet at all stays flat at 0', () => {
    const months = buildMonthlyDrawdown([], '2026-03-01', '2026-03-31', 1000, 0.01);

    expect(months).toHaveLength(1);
    expect(months[0].days.every((value) => value === 0)).toBe(true);
  });

  it('returns null for every day in every month when the denominator is 0', () => {
    const daily = [day('2026-01-15', 100)];

    const months = buildMonthlyDrawdown(daily, '2026-01-01', '2026-01-31', 0, 0.01);

    expect(months[0].days.every((value) => value === null)).toBe(true);
  });

  it('produces one entry per calendar month across a year boundary', () => {
    const months = buildMonthlyDrawdown([], '2026-12-01', '2027-01-31', 1000, 0.01);

    expect(months).toEqual([
      { year: 2026, month: 12, days: Array(31).fill(0) },
      { year: 2027, month: 1, days: Array(31).fill(0) },
    ]);
  });
});
