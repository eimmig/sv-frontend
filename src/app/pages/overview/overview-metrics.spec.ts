import { BetMetrics, DailyBetMetrics, MonthlyBetMetrics } from '../../core/statistics-api';
import { buildLifetimeCurve, buildMonthlyBalances, buildMonthlyTable, resolveEarliestDate } from './overview-metrics';

function betMetrics(overrides: Partial<BetMetrics> = {}): BetMetrics {
  return {
    totalStaked: 0,
    netProfit: 0,
    roi: 0,
    winRate: 0,
    settledCount: 0,
    wonCount: 0,
    lostCount: 0,
    voidCount: 0,
    preCount: 0,
    liveCount: 0,
    avgOdd: null,
    ...overrides,
  };
}

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

describe('buildMonthlyTable', () => {
  it('always returns 12 rows, zeroing metrics for a month with no settled bet', () => {
    const balances = buildMonthlyBalances([], 1000, 2026);

    const table = buildMonthlyTable([], balances, 2026, 1000, 0.01);

    expect(table).toHaveLength(12);
    expect(table[0]).toEqual({
      year: 2026,
      month: 1,
      saldoComeco: 1000,
      saldoFinal: 1000,
      entradas: 0,
      vitorias: 0,
      perdas: 0,
      oddMedia: null,
      winRate: 0,
      roi: 0,
      profitReais: 0,
      profitUnidades: 0,
    });
  });

  it('merges monthly BetMetrics with the balance of the matching month', () => {
    const balances = buildMonthlyBalances([{ date: '2026-03-10', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 1 }], 1000, 2026);
    const monthly: MonthlyBetMetrics[] = [
      { year: 2026, month: 3, metrics: betMetrics({ settledCount: 5, wonCount: 3, lostCount: 2, avgOdd: 1.8, winRate: 0.6, roi: 0.1, netProfit: 50 }) },
    ];

    const table = buildMonthlyTable(monthly, balances, 2026, 1000, 0.01);

    expect(table[2]).toEqual({
      year: 2026,
      month: 3,
      saldoComeco: 1000,
      saldoFinal: 1050,
      entradas: 5,
      vitorias: 3,
      perdas: 2,
      oddMedia: 1.8,
      winRate: 0.6,
      roi: 0.1,
      profitReais: 50,
      profitUnidades: 5, // 50 / (1000 * 0.01)
    });
  });

  it('ignores a monthly entry from a different year than the requested one, even for the same month number', () => {
    const balances = buildMonthlyBalances([], 1000, 2026);
    // Same month number (1), but year 2025 - must not leak into the 2026 table.
    const monthly: MonthlyBetMetrics[] = [{ year: 2025, month: 1, metrics: betMetrics({ settledCount: 99 }) }];

    const table = buildMonthlyTable(monthly, balances, 2026, 1000, 0.01);

    expect(table[0].entradas).toBe(0);
  });

  it('returns null profitUnidades (not a divide-by-zero) when the denominator is 0', () => {
    const balances = buildMonthlyBalances([], 1000, 2026);
    const monthly: MonthlyBetMetrics[] = [{ year: 2026, month: 1, metrics: betMetrics({ netProfit: 50 }) }];

    const table = buildMonthlyTable(monthly, balances, 2026, 0, 0.01);

    expect(table[0].profitUnidades).toBeNull();
  });
});
