import { DailyBetMetrics, MonthlyBetMetrics } from '../../core/statistics-api';

export interface LifetimePoint {
  readonly date: string;
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
  readonly profitUnidades: number | null;
}

export function resolveEarliestDate(daily: readonly DailyBetMetrics[]): string | null {
  return daily[0]?.date ?? null;
}

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
