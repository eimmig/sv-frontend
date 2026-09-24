import { Component, input } from '@angular/core';

import { KpiCardSign } from '../kpi-card/kpi-card';

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
  readonly sign = input<KpiCardSign>();
  readonly testId = input<string>();
  readonly columnALabel = input<string>('');
  readonly columnBLabel = input<string>('');
  readonly columnDeltaLabel = input<string>('');
}
