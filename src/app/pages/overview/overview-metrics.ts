import { DailyBetMetrics, MonthlyBetMetrics } from '../../core/statistics-api';

/** One point per settled-bet day (docs/STATISTICS.md "Curva de lucro acumulado vitalícia") -
 *  unlike the monthly drawdown grid, there is no calendar-day filling and no reset:
 *  the curve only has an entry where `daily` already has one, running from the tenant's first
 *  settled bet onward. */
export interface LifetimePoint {
  readonly date: string;
  /** null only when saldoAtual/unitPercent make the denominator 0 (fresh tenant, no balance
   *  yet) - same defensive convention as profitUnidades elsewhere in this app. */
  readonly accumulated: number | null;
}

export interface MonthlyBalance {
  readonly year: number;
  readonly month: number;
  readonly saldoComeco: number;
  readonly saldoFinal: number;
}

export interface OverviewMonthRow {
  readonly year: number;
  readonly month: number;
  readonly saldoComeco: number;
  readonly saldoFinal: number;
  readonly entradas: number;
  readonly vitorias: number;
  readonly perdas: number;
  readonly oddMedia: number | null;
  readonly winRate: number;
  readonly roi: number;
  readonly profitReais: number;
  /** null only when saldoAtual/unitPercent make the denominator 0 - same convention as the
   *  lifetime cards. */
  readonly profitUnidades: number | null;
}

/** `daily` is the full-history, sparse, date-ascending array (docs/API-CONTRACTS.md) - the first
 *  entry is the tenant's earliest settled-bet day, used as a proxy for "início do histórico"
 *  (no dedicated endpoint exists for it). null when the tenant has no settled bet yet. */
export function resolveEarliestDate(daily: readonly DailyBetMetrics[]): string | null {
  return daily[0]?.date ?? null;
}

/** Continuous accumulated-profit curve (units), never resets - docs/STATISTICS.md "Curva de
 *  lucro acumulado vitalícia". */
export function buildLifetimeCurve(
  daily: readonly DailyBetMetrics[],
  saldoAtual: number,
  unitPercent: number,
): LifetimePoint[] {
  const denominator = saldoAtual * unitPercent;
  let accumulated = 0;
  return daily.map((day) => {
    if (denominator === 0) {
      return { date: day.date, accumulated: null };
    }
    accumulated += day.netProfit / denominator;
    return { date: day.date, accumulated };
  });
}

/**
 * Saldo Começo/Final for every month of `year`, derived from `saldoInicioHistorico` plus the
 * already-fetched daily netProfit - no per-month bankroll call (docs/STATISTICS.md "Saldo
 * Começo/Final por mês, sem N chamadas"). A running total carried month to month is
 * mathematically the same as re-summing "todo dia antes do mês N" each time, without the
 * repeated work. Degrades correctly for an empty `daily` (fresh tenant): every month reads
 * saldoComeco === saldoFinal === saldoInicioHistorico, no special-casing needed.
 */
export function buildMonthlyBalances(
  daily: readonly DailyBetMetrics[],
  saldoInicioHistorico: number,
  year: number,
): MonthlyBalance[] {
  const netProfitByMonth = new Map<number, number>();
  let running = saldoInicioHistorico;
  for (const day of daily) {
    const [dayYear, dayMonth] = day.date.split('-').map(Number);
    if (dayYear < year) {
      running += day.netProfit;
    } else if (dayYear === year) {
      netProfitByMonth.set(dayMonth, (netProfitByMonth.get(dayMonth) ?? 0) + day.netProfit);
    }
  }

  const months: MonthlyBalance[] = [];
  for (let month = 1; month <= 12; month++) {
    const saldoComeco = running;
    const saldoFinal = saldoComeco + (netProfitByMonth.get(month) ?? 0);
    months.push({ year, month, saldoComeco, saldoFinal });
    running = saldoFinal;
  }
  return months;
}

/**
 * Jan-Dec rows of `year`, merging `monthly` (already-fetched BetMetrics per month) with the
 * saldo Começo/Final derived by buildMonthlyBalances. `monthly` is NOT pre-scoped to `year` by
 * the backend when GET /api/v1/statistics is called without a period filter - unlike what the
 * epic description assumed, `aggregateByMonth` (stats-service) groups every (year, month) pair
 * in the tenant's whole history with no date restriction, so this function does the year
 * filtering client-side. A month with no settled bet gets zeroed metrics, not omitted - the
 * table always has exactly 12 rows.
 */
export function buildMonthlyTable(
  monthly: readonly MonthlyBetMetrics[],
  balances: readonly MonthlyBalance[],
  year: number,
  saldoAtual: number,
  unitPercent: number,
): OverviewMonthRow[] {
  const denominator = saldoAtual * unitPercent;
  const metricsByMonth = new Map(monthly.filter((entry) => entry.year === year).map((entry) => [entry.month, entry.metrics]));
  return balances.map((balance) => {
    const metrics = metricsByMonth.get(balance.month);
    return {
      year: balance.year,
      month: balance.month,
      saldoComeco: balance.saldoComeco,
      saldoFinal: balance.saldoFinal,
      entradas: metrics?.settledCount ?? 0,
      vitorias: metrics?.wonCount ?? 0,
      perdas: metrics?.lostCount ?? 0,
      oddMedia: metrics?.avgOdd ?? null,
      winRate: metrics?.winRate ?? 0,
      roi: metrics?.roi ?? 0,
      profitReais: metrics?.netProfit ?? 0,
      profitUnidades: denominator === 0 ? null : (metrics?.netProfit ?? 0) / denominator,
    };
  });
}
