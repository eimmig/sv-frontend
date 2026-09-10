import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type KpiCardSign = 'positive' | 'negative' | 'neutral';

/** Maps a money/ROI-shaped value to the kpi-card sign it should render with (docs/DESIGN-SYSTEM.md color semantics) - shared by every screen with kpi-card metrics. */
export function kpiSign(value: number): KpiCardSign {
  if (value > 0) {
    return 'positive';
  }
  if (value < 0) {
    return 'negative';
  }
  return 'neutral';
}

/**
 * Single stat card (icon + label + value), extracted from the dashboard's
 * inline markup (feat-006) once the "Buscar Estatisticas" screen (feat-012)
 * needed the same shape for a second, larger set of cards.
 */
@Component({
  imports: [MatIconModule],
  selector: 'app-kpi-card',
  styleUrl: './kpi-card.scss',
  templateUrl: './kpi-card.html',
})
export class KpiCard {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  /** Omitted (undefined) renders the neutral/default card style - only netProfit/roi-shaped cards pass positive/negative/neutral. */
  readonly sign = input<KpiCardSign>();
  readonly testId = input<string>();
}
