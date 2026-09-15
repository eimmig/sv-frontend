import { DailyBetMetrics } from '../../core/statistics-api';

/** One point per settled-bet day (docs/STATISTICS.md "Curva de lucro acumulado vitalícia") -
 *  unlike the monthly drawdown grid (epic-020), there is no calendar-day filling and no reset:
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
