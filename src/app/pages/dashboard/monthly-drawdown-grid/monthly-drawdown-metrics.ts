import { DailyBetMetrics } from '../../../core/statistics-api';

export interface MonthlyDrawdownMonth {
  readonly year: number;
  readonly month: number;
  /** Index 0 = day 1. null only when saldoAtual/unitPercent make the denominator 0 (fresh tenant,
   *  no balance yet) - every day in every month is null uniformly in that case, same defensive
   *  convention as profitUnidades elsewhere (period-report-metrics.ts). */
  readonly days: readonly (number | null)[];
}

function daysInMonth(year: number, month: number): number {
  // Day 0 of the following month is the last day of `month` (1-indexed) - same trick already
  // used by shared/period-preset-filter's endOfMonth().
  return new Date(year, month, 0).getDate();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Locks a {yyyy-MM, yyyy-MM} month-picker pair to full calendar-month boundaries (docs/
 * STATISTICS.md "Grade de gráficos mensais de drawdown") - day 01 of the start month through the
 * last day of the end month. <input type="month"> never carries a day component, so there is no
 * "exact day clicked" to ignore - the lock is automatic by construction.
 */
export function resolveMonthRange(fromMonth: string, toMonth: string): { from: string; to: string } {
  const [toYear, toMonthNum] = toMonth.split('-').map(Number);
  return { from: `${fromMonth}-01`, to: `${toMonth}-${pad2(daysInMonth(toYear, toMonthNum))}` };
}

/**
 * One accumulated-drawdown curve per calendar month in [from, to] (docs/STATISTICS.md), resetting
 * to 0 on day 1 of each month. A day without a settled bet contributes 0 profit, which - being an
 * accumulator - naturally carries the previous day's value forward (straight line), not a reset;
 * no special-casing needed for that rule. saldoAtual/unitPercent are single current-value
 * snapshots (not historical per-day), the same deliberate simplification as profitUnidades
 * elsewhere in this app.
 */
export function buildMonthlyDrawdown(
  daily: readonly DailyBetMetrics[],
  from: string,
  to: string,
  saldoAtual: number,
  unitPercent: number,
): MonthlyDrawdownMonth[] {
  const byDate = new Map(daily.map((day) => [day.date, day]));
  const denominator = saldoAtual * unitPercent;
  const [fromYear, fromMonthNum] = from.split('-').map(Number);
  const [toYear, toMonthNum] = to.split('-').map(Number);

  const months: MonthlyDrawdownMonth[] = [];
  let year = fromYear;
  let month = fromMonthNum;
  while (year < toYear || (year === toYear && month <= toMonthNum)) {
    const total = daysInMonth(year, month);
    const days: (number | null)[] = [];
    let accumulated = 0;
    for (let day = 1; day <= total; day++) {
      if (denominator === 0) {
        days.push(null);
        continue;
      }
      const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
      const netProfit = byDate.get(dateStr)?.netProfit ?? 0;
      accumulated += netProfit / denominator;
      days.push(accumulated);
    }
    months.push({ year, month, days });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}
