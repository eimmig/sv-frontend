import { DailyBetMetrics } from '../../core/statistics-api';
import { buildMonthlyDrawdown, computeSharedYRange, MonthlyDrawdownMonth, resolveMonthRange } from './monthly-drawdown-metrics';

function month(year: number, monthNum: number, days: (number | null)[]): MonthlyDrawdownMonth {
  return { year, month: monthNum, days };
}

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
    expect(months[0].days[0]).toBeCloseTo(10);
    expect(months[0].days[1]).toBeCloseTo(5);
    expect(months[1].days[0]).toBeCloseTo(2);
  });

  it('a day without a settled bet carries the previous day accumulated value forward', () => {
    const daily = [day('2026-01-01', 100)];

    const months = buildMonthlyDrawdown(daily, '2026-01-01', '2026-01-03', 1000, 0.01);

    expect(months[0].days[0]).toBeCloseTo(10);
    expect(months[0].days[1]).toBeCloseTo(10);
    expect(months[0].days[2]).toBeCloseTo(10);
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

  it('stops plotting the current month at today instead of padding flat to the end of the month', () => {
    const daily = [day('2026-09-01', 100)];

    const months = buildMonthlyDrawdown(daily, '2026-09-01', '2026-09-30', 1000, 0.01, new Date(2026, 8, 10));

    expect(months[0].days).toHaveLength(10);
  });

  it('a month entirely after today has no days yet', () => {
    const months = buildMonthlyDrawdown([], '2026-11-01', '2026-11-30', 1000, 0.01, new Date(2026, 8, 10));

    expect(months[0].days).toHaveLength(0);
  });

  it('a past month is unaffected by today and still plots every day', () => {
    const months = buildMonthlyDrawdown([], '2026-01-01', '2026-01-31', 1000, 0.01, new Date(2026, 8, 10));

    expect(months[0].days).toHaveLength(31);
  });

  it('produces one entry per calendar month across a year boundary', () => {
    const months = buildMonthlyDrawdown([], '2026-12-01', '2027-01-31', 1000, 0.01, new Date(2027, 1, 15));

    expect(months).toEqual([
      { year: 2026, month: 12, days: Array(31).fill(0) },
      { year: 2027, month: 1, days: Array(31).fill(0) },
    ]);
  });
});

describe('computeSharedYRange', () => {
  it('returns null when every day in every month is null (denominator 0)', () => {
    expect(computeSharedYRange([month(2026, 1, [null, null])])).toBeNull();
  });

  it('returns null for an empty months array', () => {
    expect(computeSharedYRange([])).toBeNull();
  });

  it('spans the min and max across all months, always including 0 as baseline', () => {
    const range = computeSharedYRange([month(2026, 1, [1, 2, 3]), month(2026, 2, [0.5, -0.5])]);

    expect(range).toEqual({ min: -0.5, max: 3 });
  });

  it('keeps the baseline at 0 when every value is positive', () => {
    const range = computeSharedYRange([month(2026, 1, [1, 2])]);

    expect(range).toEqual({ min: 0, max: 2 });
  });

  it('rounds outward to 1 decimal place so axis labels stay legible', () => {
    const range = computeSharedYRange([month(2026, 1, [-1.23, 3.456])]);

    expect(range).toEqual({ min: -1.3, max: 3.5 });
  });

  it('ignores null days while still scanning the rest of the month', () => {
    const range = computeSharedYRange([month(2026, 1, [null, 2, null, -1])]);

    expect(range).toEqual({ min: -1, max: 2 });
  });
});
