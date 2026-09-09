/** Formats an ISO instant respecting the given UI locale (unlike currency, dates are genuinely locale-dependent). */
export function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

/** Formats a year/month pair (MonthlyBetMetrics, 1-indexed month) respecting the given UI locale. */
export function formatMonth(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(new Date(year, month - 1, 1));
}
