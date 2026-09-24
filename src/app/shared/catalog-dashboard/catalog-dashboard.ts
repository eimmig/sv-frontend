import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { loadInto } from '../../core/api-request';
import { formatBrl } from '../../core/currency';
import { Language } from '../../core/language';
import { formatPercent } from '../../core/percent';
import { EMPTY_STATISTICS_DASHBOARD, SegmentedBetMetrics, StatisticsApi, StatisticsDashboard } from '../../core/statistics-api';
import { KpiCardSign, kpiSign } from '../kpi-card/kpi-card';
import { Panel } from '../panel/panel';
import { PanelLayout } from '../panel-layout/panel-layout';
import { PeriodPresetFilter, PeriodRange } from '../period-preset-filter/period-preset-filter';

export type CatalogSegment = 'bySport' | 'byLeague' | 'byMarket' | 'byTipster' | 'byBettingHouse' | 'byTeam';

@Component({
  imports: [Panel, PanelLayout, PeriodPresetFilter, TranslocoPipe],
  selector: 'app-catalog-dashboard',
  styleUrl: './catalog-dashboard.scss',
  templateUrl: './catalog-dashboard.html',
})
export class CatalogDashboard {
  readonly segment = input.required<CatalogSegment>();
  readonly labelKey = input.required<string>();

  private readonly statisticsApi = inject(StatisticsApi);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  protected readonly formatBrl = formatBrl;

  protected readonly data = signal<StatisticsDashboard>(EMPTY_STATISTICS_DASHBOARD);
  protected readonly error = signal<string | null>(null);

  protected readonly rows = computed(() => [...(this.data()[this.segment()] ?? [])].sort((a, b) => b.metrics.roi - a.metrics.roi));

  protected formatPercent(value: number): string {
    return formatPercent(value, this.language.current());
  }

  protected sign(value: number): KpiCardSign {
    return kpiSign(value);
  }

  protected trackRow(_index: number, row: SegmentedBetMetrics): string {
    return row.dimensionId;
  }

  protected onPeriodChange(range: PeriodRange): void {
    loadInto(
      this.statisticsApi.get({ from: range.from, to: range.to }),
      this.data,
      this.error,
      () => this.transloco.translate('catalogDashboard.genericError'),
    );
  }
}
