import { Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

export interface ChartLegendItem {
  readonly label: string;
  /** Design token name (e.g. `--color-brand`) - the swatch follows the active theme. */
  readonly colorToken: string;
}

let nextHelpId = 0;

/** Title, legend and an inline "?" explanation around any chart. */
@Component({
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  selector: 'app-chart-frame',
  templateUrl: './chart-frame.html',
  styleUrl: './chart-frame.scss',
})
export class ChartFrame {
  readonly title = input.required<string>();
  readonly help = input.required<string>();
  readonly legend = input<ChartLegendItem[]>([]);
  readonly testId = input.required<string>();

  protected readonly helpId = `chart-frame-help-${nextHelpId++}`;
  protected readonly helpOpen = signal(false);

  protected toggleHelp(): void {
    this.helpOpen.update((open) => !open);
  }
}
