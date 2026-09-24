export function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export function formatMonth(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(new Date(year, month - 1, 1));
}

function parseDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDay(value: string, locale: string, withYear = false): string {
  const options: Intl.DateTimeFormatOptions = withYear
    ? { day: '2-digit', month: 'short', year: 'numeric' }
    : { day: '2-digit', month: 'short' };
  return new Intl.DateTimeFormat(locale, options).format(parseDay(value));
}

export function spansMoreThanOneYear(first: string, last: string): boolean {
  const start = parseDay(first);
  const oneYearLater = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  return parseDay(last) > oneYearLater;
}
