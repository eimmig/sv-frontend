/** Formats an ISO instant respecting the given UI locale (unlike currency, dates are genuinely locale-dependent). */
export function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

/** Formats a year/month pair (MonthlyBetMetrics, 1-indexed month) respecting the given UI locale. */
export function formatMonth(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(new Date(year, month - 1, 1));
}

/** Formats a bare yyyy-MM-dd date (no time component - e.g. the statistics search timeline) respecting the given UI locale. */
export function formatDay(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(year, month - 1, day));
}
