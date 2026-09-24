import { DailyBetMetrics } from '../../core/statistics-api';
import { addDays, toDateOnly } from '../../shared/period-preset-filter/period-preset-filter';

export interface ComparisonDelta {
  readonly absolute: number;
  readonly percent: number | null;
}

export function computeDelta(a: number, b: number): ComparisonDelta {
  return { absolute: b - a, percent: a === 0 ? null : (b - a) / Math.abs(a) };
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function accumulateDaily(daily: readonly DailyBetMetrics[], from: string, to: string, saldoFinal: number, unitPercent: number): (number | null)[] {
  const byDate = new Map(daily.map((day) => [day.date, day]));
  const denominator = saldoFinal * unitPercent;
  const values: (number | null)[] = [];
  let cursor = parseDateOnly(from);
  const end = parseDateOnly(to);
  let accumulated = 0;
  while (cursor <= end) {
    if (denominator === 0) {
      values.push(null);
    } else {
      accumulated += (byDate.get(toDateOnly(cursor))?.netProfit ?? 0) / denominator;
      values.push(accumulated);
    }
    cursor = addDays(cursor, 1);
  }
  return values;
}

function padTo(values: readonly (number | null)[], length: number): (number | null)[] {
  return values.length >= length ? [...values] : [...values, ...new Array<null>(length - values.length).fill(null)];
}

export interface ComparisonSeries {
  readonly seriesA: (number | null)[];
  readonly seriesB: (number | null)[];
}

export interface ComparisonSeriesInput {
  readonly daily: readonly DailyBetMetrics[];
  readonly from: string;
  readonly to: string;
  readonly saldoFinal: number;
}

export function buildComparisonSeries(a: ComparisonSeriesInput, b: ComparisonSeriesInput, unitPercent: number): ComparisonSeries {
  const seriesA = accumulateDaily(a.daily, a.from, a.to, a.saldoFinal, unitPercent);
  const seriesB = accumulateDaily(b.daily, b.from, b.to, b.saldoFinal, unitPercent);
  const length = Math.max(seriesA.length, seriesB.length);
  return { seriesA: padTo(seriesA, length), seriesB: padTo(seriesB, length) };
}
