import { DailyBetMetrics } from '../../core/statistics-api';
import { buildLifetimeCurve, buildMonthlyBalances, resolveEarliestDate } from './overview-metrics';

function day(date: string, netProfit: number): DailyBetMetrics {
  return { date, netProfit, totalStaked: 0, roi: 0, betCount: 1 };
}

describe('resolveEarliestDate', () => {
  it('returns the first entry of the date-ascending sparse array', () => {
    const daily = [day('2026-03-01', 10), day('2026-03-05', -5)];

    expect(resolveEarliestDate(daily)).toBe('2026-03-01');
  });

  it('returns null for a tenant with no settled bet yet', () => {
    expect(resolveEarliestDate([])).toBeNull();
  });
});

describe('buildLifetimeCurve', () => {
  it('accumulates across settled-bet days, never resetting', () => {
    const daily = [day('2026-01-01', 100), day('2026-02-15', -50), day('2026-03-01', 20)];

    const curve = buildLifetimeCurve(daily, 1000, 0.01);

    expect(curve).toHaveLength(3);
    expect(curve[0].accumulated).toBeCloseTo(10); // 100 / (1000 * 0.01)
    expect(curve[1].accumulated).toBeCloseTo(5); // 10 + (-50 / 10)
    expect(curve[2].accumulated).toBeCloseTo(7); // 5 + (20 / 10)
  });

  it('returns an empty curve for a tenant with no settled bet yet', () => {
    expect(buildLifetimeCurve([], 1000, 0.01)).toEqual([]);
  });

  it('returns null accumulated values when the denominator is 0', () => {
    const daily = [day('2026-01-01', 100)];

    const curve = buildLifetimeCurve(daily, 0, 0.01);

    expect(curve[0].accumulated).toBeNull();
  });
});

describe('buildMonthlyBalances', () => {
  it('derives saldoComeco/saldoFinal for every month from a running total, no per-month call', () => {
    const daily = [day('2026-01-10', 100), day('2026-01-20', -30), day('2026-03-05', 50)];

    const months = buildMonthlyBalances(daily, 1000, 2026);

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ year: 2026, month: 1, saldoComeco: 1000, saldoFinal: 1070 });
    expect(months[1]).toEqual({ year: 2026, month: 2, saldoComeco: 1070, saldoFinal: 1070 });
    expect(months[2]).toEqual({ year: 2026, month: 3, saldoComeco: 1070, saldoFinal: 1120 });
    expect(months[11].month).toBe(12);
  });

  it('folds netProfit from a prior year into saldoInicioHistorico before January', () => {
    const daily = [day('2025-12-20', 200), day('2026-01-10', 30)];

    const months = buildMonthlyBalances(daily, 1000, 2026);

    expect(months[0]).toEqual({ year: 2026, month: 1, saldoComeco: 1200, saldoFinal: 1230 });
  });

  it('ignores days from a year after the requested one', () => {
    const daily = [day('2026-01-10', 30), day('2027-01-05', 999)];

    const months = buildMonthlyBalances(daily, 1000, 2026);

    expect(months[11].saldoFinal).toBe(1030);
  });

  it('stays flat at saldoInicioHistorico for every month when the tenant has no settled bet', () => {
    const months = buildMonthlyBalances([], 1000, 2026);

    expect(months.every((m) => m.saldoComeco === 1000 && m.saldoFinal === 1000)).toBe(true);
  });
});
