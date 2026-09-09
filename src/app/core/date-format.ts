/** Formats an ISO instant respecting the given UI locale (unlike currency, dates are genuinely locale-dependent). */
export function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
