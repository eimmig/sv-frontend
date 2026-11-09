import { BetMetrics } from '../../core/statistics-api';

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * A taxa de acerto nao se distingue do acaso quando o intervalo de 95% contem a probabilidade
 * implicita media, isto e, a taxa que as cotacoes exigiam para empatar (docs/estatisticas.md).
 */
export function winRateWithinChance(metrics: BetMetrics): boolean {
  const { winRateLower, winRateUpper, impliedProbability } = metrics;
  return (
    isNumber(winRateLower) &&
    isNumber(winRateUpper) &&
    isNumber(impliedProbability) &&
    winRateLower <= impliedProbability &&
    impliedProbability <= winRateUpper
  );
}

/** O ROI nao se distingue do acaso quando o intervalo de 95% contem zero. */
export function roiWithinChance(metrics: BetMetrics): boolean {
  const { roiLower, roiUpper } = metrics;
  return isNumber(roiLower) && isNumber(roiUpper) && roiLower <= 0 && 0 <= roiUpper;
}

export function withinChance(metrics: BetMetrics): boolean {
  return winRateWithinChance(metrics) || roiWithinChance(metrics);
}

/** Vantagem arredondada como e exibida (0,1 p.p.), para o sinal e a cor seguirem o valor mostrado. */
export function displayedEdge(edge: number): number {
  return Math.round(edge * 1000) / 1000;
}

/** Intervalo formatado ("a – b") ou null quando um dos limites nao esta definido. */
export function formatInterval(
  lower: number | null | undefined,
  upper: number | null | undefined,
  format: (value: number) => string,
): string | null {
  return isNumber(lower) && isNumber(upper) ? `${format(lower)} – ${format(upper)}` : null;
}
