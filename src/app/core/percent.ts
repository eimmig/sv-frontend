/** Formats a 0..1 fraction (roi, winRate) as a percentage, respecting the given UI locale (a ratio, not money - see core/currency.ts). */
export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value);
}
