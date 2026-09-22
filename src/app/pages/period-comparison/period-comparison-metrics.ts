import { DailyBetMetrics } from '../../core/statistics-api';
import { addDays, toDateOnly } from '../../shared/period-preset-filter/period-preset-filter';

export interface ComparisonDelta {
  readonly absolute: number;
  /** null when `a` is 0 - avoids Infinity/NaN rendered as a percent change. */
  readonly percent: number | null;
}

/** B relative to A - "how did period B do compared to period A". */
export function computeDelta(a: number, b: number): ComparisonDelta {
  return { absolute: b - a, percent: a === 0 ? null : (b - a) / Math.abs(a) };
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Cumulative profit-in-units curve for one period, indexed by day offset within it (day 1, day
 * 2, ...), never resetting - distinct from shared/monthly-drawdown-chart/monthly-drawdown-metrics.ts,
 * which resets every calendar month. A day without a settled bet contributes 0, which - being an
 * accumulator - naturally carries the previous day's value forward, same trick as that precedent.
 */
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

/** One side's inputs for buildComparisonSeries - groups daily/from/to/saldoFinal instead of 4
 *  separate positional params per side (SonarCloud typescript:S107, max 7 params/function). */
export interface ComparisonSeriesInput {
  readonly daily: readonly DailyBetMetrics[];
  readonly from: string;
  readonly to: string;
  readonly saldoFinal: number;
}

/**
 * Overlays the 2 periods' equity curves on a shared day-index axis (not calendar date, since A
 * and B cover different date ranges by definition). The shorter period's array is padded with
 * null past its own length (not the last value repeated) - shared/comparison-equity-chart's
 * chart option doesn't set connectNulls, so ECharts breaks the line there instead of flatlining.
 */
export function buildComparisonSeries(a: ComparisonSeriesInput, b: ComparisonSeriesInput, unitPercent: number): ComparisonSeries {
  const seriesA = accumulateDaily(a.daily, a.from, a.to, a.saldoFinal, unitPercent);
  const seriesB = accumulateDaily(b.daily, b.from, b.to, b.saldoFinal, unitPercent);
  const length = Math.max(seriesA.length, seriesB.length);
  return { seriesA: padTo(seriesA, length), seriesB: padTo(seriesB, length) };
}
