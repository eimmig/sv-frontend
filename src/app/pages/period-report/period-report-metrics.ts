import { DailyBetMetrics, BetMetrics } from '../../core/statistics-api';
import { addDays, toDateOnly } from '../../shared/period-preset-filter/period-preset-filter';

export interface DailyTableRow {
  readonly date: string;
  readonly roiPercent: number;
  readonly roiUnidades: number | null;
  readonly roiReais: number;
  readonly apostas: number;
}

export interface PeriodReportSummary {
  readonly roiBankroll: number | null;
  readonly roiMedioDiario: number | null;
  readonly profitUnidades: number | null;
  readonly profitReais: number;
  readonly unitPercentTotal: number;
  readonly stakeMedio: number | null;
  readonly diasVerdes: number;
  readonly diasVermelhos: number;
  readonly evPercent: number | null;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

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

export function roiMedioDiario(daily: readonly DailyBetMetrics[]): number | null {
  return daily.length === 0 ? null : daily.reduce((sum, day) => sum + day.roi, 0) / daily.length;
}

export function computeSummary(
  overall: BetMetrics,
  daily: readonly DailyBetMetrics[],
  saldoInicial: number,
  saldoFinal: number,
  unitPercent: number,
): PeriodReportSummary {
  const roiBankroll = saldoInicial === 0 ? null : overall.netProfit / saldoInicial;

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
    roiMedioDiario: roiMedioDiario(daily),
    profitUnidades,
    profitReais: overall.netProfit,
    unitPercentTotal: unitPercent,
    stakeMedio,
    diasVerdes,
    diasVermelhos,
    evPercent,
  };
}
