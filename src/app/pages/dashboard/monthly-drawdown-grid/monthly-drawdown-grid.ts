import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { loadInto } from '../../../core/api-request';
import { DailyBetMetrics, StatisticsApi, StatisticsFilter } from '../../../core/statistics-api';
import { ChartFrame } from '../../../shared/chart-frame/chart-frame';
import { MonthlyDrawdownChart } from '../../../shared/monthly-drawdown-chart/monthly-drawdown-chart';
import {
  buildMonthlyDrawdown,
  computeSharedYRange,
  MonthlyDrawdownMonth,
} from '../../../shared/monthly-drawdown-chart/monthly-drawdown-metrics';

@Component({
  imports: [ChartFrame, MonthlyDrawdownChart, TranslocoPipe],
  selector: 'app-monthly-drawdown-grid',
  styleUrl: './monthly-drawdown-grid.scss',
  templateUrl: './monthly-drawdown-grid.html',
})
export class MonthlyDrawdownGrid {
  private readonly statisticsApi = inject(StatisticsApi);
  private readonly transloco = inject(TranslocoService);

  readonly filter = input.required<StatisticsFilter>();
  readonly bankrollNow = input.required<number>();
  readonly unitPercent = input.required<number>();

  protected readonly daily = signal<DailyBetMetrics[]>([]);
  protected readonly loadError = signal<string | null>(null);

  protected readonly months = computed(() => {
    const filter = this.filter();
    if (!filter.from || !filter.to) {
      return [];
    }
    return buildMonthlyDrawdown(this.daily(), filter.from, filter.to, this.bankrollNow(), this.unitPercent());
  });
  protected readonly yRange = computed(() => computeSharedYRange(this.months()));

  constructor() {
    effect(() => {
      const filter = this.filter();
      if (!filter.from || !filter.to) {
        this.daily.set([]);
        this.loadError.set(null);
        return;
      }
      loadInto(this.statisticsApi.getDaily(filter), this.daily, this.loadError, () => this.transloco.translate('monthlyDrawdown.genericError'));
    });
  }

  protected trackMonth(_index: number, month: MonthlyDrawdownMonth): string {
    return `${month.year}-${month.month}`;
  }
}
