/** Formats a plain decimal (avgOdd, unidadesApostadas - anything without a currency or % shape) with a fixed 2-decimal precision, respecting the given UI locale's decimal separator. */
export function formatOdd(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** Same as formatOdd, but always prefixed with +/- (period-comparison's deltas) - 0 stays unsigned. */
export function formatOddDelta(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(value);
}
