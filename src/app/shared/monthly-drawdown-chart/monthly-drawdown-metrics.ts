import { DailyBetMetrics } from '../../core/statistics-api';

export interface MonthlyDrawdownMonth {
  readonly year: number;
  readonly month: number;
  readonly days: readonly (number | null)[];
}

export interface MonthlyDrawdownYRange {
  readonly min: number;
  readonly max: number;
}

function roundStep(value: number, round: (value: number) => number): number {
  return round(value * 10) / 10;
}

export function computeSharedYRange(months: readonly MonthlyDrawdownMonth[]): MonthlyDrawdownYRange | null {
  let min = 0;
  let max = 0;
  let hasValue = false;
  for (const month of months) {
    for (const value of month.days) {
      if (value === null) {
        continue;
      }
      hasValue = true;
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }
  }
  if (!hasValue) {
    return null;
  }
  return { min: roundStep(min, Math.floor), max: roundStep(max, Math.ceil) };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function buildMonthlyDrawdown(
  daily: readonly DailyBetMetrics[],
  from: string,
  to: string,
  saldoAtual: number,
  unitPercent: number,
  today: Date = new Date(),
): MonthlyDrawdownMonth[] {
  const byDate = new Map(daily.map((day) => [day.date, day]));
  const denominator = saldoAtual * unitPercent;
  const [fromYear, fromMonthNum, fromDay] = from.split('-').map(Number);
  const [toYear, toMonthNum, toDay] = to.split('-').map(Number);

  const fromIndex = fromYear * 12 + (fromMonthNum - 1);
  const toIndex = toYear * 12 + (toMonthNum - 1);
  const todayIndex = today.getFullYear() * 12 + today.getMonth();

  const months: MonthlyDrawdownMonth[] = [];
  for (let index = fromIndex; index <= toIndex; index++) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    const startDay = index === fromIndex ? fromDay : 1;
    let endDay = index === toIndex ? Math.min(toDay, daysInMonth(year, month)) : daysInMonth(year, month);
    if (index === todayIndex) {
      endDay = Math.min(endDay, today.getDate());
    } else if (index > todayIndex) {
      endDay = startDay - 1;
    }
    const days: (number | null)[] = [];
    let accumulated = 0;
    for (let day = startDay; day <= endDay; day++) {
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
  }
  return months;
}
