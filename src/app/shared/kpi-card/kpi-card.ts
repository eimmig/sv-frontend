import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type KpiCardSign = 'positive' | 'negative' | 'neutral';

export function kpiSign(value: number): KpiCardSign {
  if (value > 0) {
    return 'positive';
  }
  if (value < 0) {
    return 'negative';
  }
  return 'neutral';
}

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
  readonly sign = input<KpiCardSign>();
  readonly testId = input<string>();
}
