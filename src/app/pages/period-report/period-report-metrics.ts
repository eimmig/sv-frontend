import { DailyBetMetrics, BetMetrics } from '../../core/statistics-api';
import { addDays, toDateOnly } from '../../shared/period-preset-filter/period-preset-filter';

export interface DailyTableRow {
  readonly date: string;
  readonly roiPercent: number;
  /** null when saldoFinal or unitPercent is 0 - same defensive pattern as the dashboard's
   *  unidadesApostadas (feat-014), never divides by zero in the template. */
  readonly roiUnidades: number | null;
  readonly roiReais: number;
  readonly apostas: number;
}

export interface PeriodReportSummary {
  /** netProfit(período) / saldoInicial - distinct from the existing roi (netProfit/totalStaked). */
  readonly roiBankroll: number | null;
  /** Simple (unweighted) average of each day's roi - only days with at least 1 settled bet. */
  readonly roiMedioDiario: number | null;
  readonly profitUnidades: number | null;
  readonly profitReais: number;
  readonly unitPercentTotal: number;
  readonly stakeMedio: number | null;
  readonly diasVerdes: number;
  readonly diasVermelhos: number;
  /** wonCount/(wonCount+lostCount) − 1/avgOdd - void excluded from the denominator, distinct
   *  from the existing winRate (which includes void). */
  readonly evPercent: number | null;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * One row per calendar day in [from, to] - the API's /daily response is a sparse array (only
 * days with at least 1 settled bet), this fills the gaps with zero so the table has no missing
 * rows. "saldoFinal" here plays the role of docs/STATISTICS.md's generic "saldoAtual" (see
 * feat-015's plan_review: this page fetches only saldoInicial/saldoFinal, no separate "now" call).
 */
export function buildDailyTable(
  daily: readonly DailyBetMetrics[],
  from: string,
  to: string,
  saldoFinal: number,
  unitPercent: number,
): DailyTableRow[] {
  const byDate = new Map(daily.map((day) => [day.date, day]));
  const denominator = saldoFinal * unitPercent;
  const rows: DailyTableRow[] = [];
  let cursor = parseDateOnly(from);
  const end = parseDateOnly(to);
  while (cursor <= end) {
    const dateStr = toDateOnly(cursor);
    const day = byDate.get(dateStr);
    const netProfit = day?.netProfit ?? 0;
    rows.push({
      date: dateStr,
      roiPercent: day?.roi ?? 0,
      roiUnidades: denominator === 0 ? null : netProfit / denominator,
      roiReais: netProfit,
      apostas: day?.betCount ?? 0,
    });
    cursor = addDays(cursor, 1);
  }
  return rows;
}

/**
 * Summary cards for the "Relatório do período" page - formulas and reference values in
 * docs/STATISTICS.md. All ratios return null (rendered as "Indeterminado") on a zero
 * denominator instead of throwing or dividing by zero.
 */
export function computeSummary(
  overall: BetMetrics,
  daily: readonly DailyBetMetrics[],
  saldoInicial: number,
  saldoFinal: number,
  unitPercent: number,
): PeriodReportSummary {
  const roiBankroll = saldoInicial === 0 ? null : overall.netProfit / saldoInicial;

  const roiMedioDiario = daily.length === 0 ? null : daily.reduce((sum, day) => sum + day.roi, 0) / daily.length;

  const unitsDenominator = saldoFinal * unitPercent;
  const profitUnidades = unitsDenominator === 0 ? null : overall.netProfit / unitsDenominator;

  const stakeMedio = overall.settledCount === 0 ? null : overall.totalStaked / overall.settledCount;

  const diasVerdes = daily.filter((day) => day.netProfit > 0).length;
  const diasVermelhos = daily.filter((day) => day.netProfit < 0).length;

  const entradas = overall.wonCount + overall.lostCount;
  const taxaAcertoEntradas = entradas === 0 ? null : overall.wonCount / entradas;
  const evPercent =
    taxaAcertoEntradas === null || overall.avgOdd === null || overall.avgOdd === 0
      ? null
      : taxaAcertoEntradas - 1 / overall.avgOdd;

  return {
    roiBankroll,
    roiMedioDiario,
    profitUnidades,
    profitReais: overall.netProfit,
    unitPercentTotal: unitPercent,
    stakeMedio,
    diasVerdes,
    diasVermelhos,
    evPercent,
  };
}
