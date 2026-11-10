import { Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

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

let nextHelpId = 0;

@Component({
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  selector: 'app-kpi-card',
  styleUrl: './kpi-card.scss',
  templateUrl: './kpi-card.html',
})
export class KpiCard {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly sign = input<KpiCardSign>();
  readonly secondary = input<string>();
  /** Explicacao do indicador, aberta pelo botao de ajuda do card (teclado, toque e mouse). */
  readonly hint = input<string>();
  readonly testId = input<string>();

  protected readonly helpId = `kpi-card-help-${nextHelpId++}`;
  protected readonly helpOpen = signal(false);

  protected toggleHelp(): void {
    this.helpOpen.update((open) => !open);
  }
}
