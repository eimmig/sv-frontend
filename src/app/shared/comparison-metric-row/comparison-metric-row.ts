import { Component, input } from '@angular/core';

import { KpiCardSign } from '../kpi-card/kpi-card';

/**
 * One KPI compared across Período A/B (rótulo | valor A | valor B | delta) - the "Linha de
 * lista"/"Texto de valor + variação" pattern from docs/sistema-de-design.md (item 4/5), not a
 * 3rd kpi-card per metric (achado MAJOR do plan review de feat-037: 3 cards por métrica foge do
 * padrão já documentado e gera ruído visual).
 */
@Component({
  selector: 'app-comparison-metric-row',
  templateUrl: './comparison-metric-row.html',
  styleUrl: './comparison-metric-row.scss',
})
export class ComparisonMetricRow {
  readonly label = input.required<string>();
  readonly valueA = input.required<string>();
  readonly valueB = input.required<string>();
  readonly deltaLabel = input.required<string>();
  /** Omitted (undefined) renders the neutral delta style - only netProfit/roi-shaped rows pass
   *  positive/negative/neutral (same restraint already used by kpi-card across the app: a plain
   *  count going up/down isn't inherently "good" or "bad"). */
  readonly sign = input<KpiCardSign>();
  readonly testId = input<string>();
}
