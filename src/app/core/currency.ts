const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * The bankroll is always Brazilian Real regardless of the active UI language
 * (no multi-currency in the backlog) - formatting it per interface locale
 * would confuse more than help, so this is fixed independently of transloco.
 */
export function formatBrl(value: number): string {
  return BRL_FORMATTER.format(value);
}
