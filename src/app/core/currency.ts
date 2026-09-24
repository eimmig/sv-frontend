const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL_DELTA_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', signDisplay: 'exceptZero' });

export function formatBrl(value: number): string {
  return BRL_FORMATTER.format(value);
}

export function formatBrlDelta(value: number): string {
  return BRL_DELTA_FORMATTER.format(value);
}
