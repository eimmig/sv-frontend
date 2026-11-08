export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

/** Diferenca entre duas proporcoes em pontos percentuais, com sinal e uma casa decimal (0.0703 -> "+7.0"). */
export function formatPercentagePoints(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(
    Math.round(value * 1000) / 10,
  );
}

export function formatPercentDelta(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(value);
}
