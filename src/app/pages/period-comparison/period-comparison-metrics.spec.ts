import { DailyBetMetrics } from '../../core/statistics-api';
import { buildComparisonSeries, computeDelta } from './period-comparison-metrics';

function day(date: string, netProfit: number): DailyBetMetrics {
  return { date, netProfit, totalStaked: 0, roi: 0, betCount: 1 };
}

describe('computeDelta', () => {
  it('computes the absolute and percent change of b relative to a', () => {
    expect(computeDelta(100, 150)).toEqual({ absolute: 50, percent: 0.5 });
  });

  it('computes a negative delta when b is smaller than a', () => {
    expect(computeDelta(100, 60)).toEqual({ absolute: -40, percent: -0.4 });
  });

  it('returns a null percent when a is 0, instead of Infinity/NaN', () => {
    expect(computeDelta(0, 50)).toEqual({ absolute: 50, percent: null });
  });

  it('uses the absolute value of a as the percent denominator (a negative a still yields a sensible sign)', () => {
    expect(computeDelta(-100, -50)).toEqual({ absolute: 50, percent: 0.5 });
  });
});

describe('buildComparisonSeries', () => {
  it('accumulates each period independently by day-offset, never resetting', () => {
    const a = { daily: [day('2026-01-01', 100), day('2026-01-02', -50)], from: '2026-01-01', to: '2026-01-02', saldoFinal: 1000 };
    const b = { daily: [day('2025-01-01', 20), day('2025-01-02', 20)], from: '2025-01-01', to: '2025-01-02', saldoFinal: 1000 };

    const result = buildComparisonSeries(a, b, 0.01);

    expect(result.seriesA).toEqual([10, 5]);
    expect(result.seriesB).toEqual([2, 4]);
  });

  it('a day without a settled bet carries the previous accumulated value forward', () => {
    const a = { daily: [day('2026-01-01', 100)], from: '2026-01-01', to: '2026-01-03', saldoFinal: 1000 };
    const b = { daily: [], from: '2025-01-01', to: '2025-01-01', saldoFinal: 1000 };

    const result = buildComparisonSeries(a, b, 0.01);

    expect(result.seriesA).toEqual([10, 10, 10]);
  });

  it('pads the shorter period with null past its own length instead of repeating the last value', () => {
    const a = { daily: [day('2026-01-01', 100)], from: '2026-01-01', to: '2026-01-01', saldoFinal: 1000 };
    const b = {
      daily: [day('2025-01-01', 10), day('2025-01-02', 10), day('2025-01-03', 10)],
      from: '2025-01-01',
      to: '2025-01-03',
      saldoFinal: 1000,
    };

    const result = buildComparisonSeries(a, b, 0.01);

    expect(result.seriesA).toEqual([10, null, null]);
    expect(result.seriesB).toEqual([1, 2, 3]);
  });

  it('returns null for every day of a period when its denominator is 0', () => {
    const a = { daily: [day('2026-01-01', 100)], from: '2026-01-01', to: '2026-01-01', saldoFinal: 0 };
    const b = { daily: [], from: '2025-01-01', to: '2025-01-01', saldoFinal: 1000 };

    const result = buildComparisonSeries(a, b, 0.01);

    expect(result.seriesA).toEqual([null]);
    expect(result.seriesB).toEqual([0]);
  });
});
