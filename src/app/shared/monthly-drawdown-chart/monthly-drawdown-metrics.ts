import { DailyBetMetrics } from '../../core/statistics-api';

export interface MonthlyDrawdownMonth {
  readonly year: number;
  readonly month: number;
  readonly days: readonly (number | null)[];
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function resolveMonthRange(fromMonth: string, toMonth: string): { from: string; to: string } {
  const [toYear, toMonthNum] = toMonth.split('-').map(Number);
  return { from: `${fromMonth}-01`, to: `${toMonth}-${pad2(daysInMonth(toYear, toMonthNum))}` };
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
  const [fromYear, fromMonthNum] = from.split('-').map(Number);
  const [toYear, toMonthNum] = to.split('-').map(Number);

  const fromIndex = fromYear * 12 + (fromMonthNum - 1);
  const toIndex = toYear * 12 + (toMonthNum - 1);
  const todayIndex = today.getFullYear() * 12 + today.getMonth();

  const months: MonthlyDrawdownMonth[] = [];
  for (let index = fromIndex; index <= toIndex; index++) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    let total: number;
    if (index < todayIndex) {
      total = daysInMonth(year, month);
    } else if (index === todayIndex) {
      total = today.getDate();
    } else {
      total = 0;
    }
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
  }
  return months;
}
