/** Formats a decimal odd (e.g. avgOdd) with a fixed 2-decimal precision, respecting the given UI locale's decimal separator. */
export function formatOdd(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
