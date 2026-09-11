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

/** One key per segment array already returned by GET /api/v1/statistics (StatisticsDashboard) -
 *  every catalog dashboard reads the SAME bundle, just a different key. */
export type CatalogSegment = 'bySport' | 'byLeague' | 'byMarket' | 'byTipster' | 'byBettingHouse';

/**
 * Reusable ranking view for a single catalog resource (sports, leagues, markets, tipsters,
 * betting houses - all structurally identical segments of StatisticsDashboard). Instantiated
 * once per route (epic-019) instead of 5 near-identical pages - same precedent as
 * shared/catalog-manager (feat-008), avoiding the SonarCloud duplication finding from feat-003.
 * Always requires a period (reuses shared/period-preset-filter, feat-014.2), same as
 * pages/period-report.
 */
@Component({
  imports: [Panel, PanelLayout, PeriodPresetFilter, TranslocoPipe],
  selector: 'app-catalog-dashboard',
  styleUrl: './catalog-dashboard.scss',
  templateUrl: './catalog-dashboard.html',
})
export class CatalogDashboard {
  readonly segment = input.required<CatalogSegment>();
  /** i18n key for the "Nome" column header, e.g. 'catalogDashboard.sportNameLabel'. */
  readonly labelKey = input.required<string>();

  private readonly statisticsApi = inject(StatisticsApi);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  protected readonly formatBrl = formatBrl;

  protected readonly data = signal<StatisticsDashboard>(EMPTY_STATISTICS_DASHBOARD);
  protected readonly error = signal<string | null>(null);

  /** Ranked most to least profitable - SegmentedBetMetrics.metrics.roi is always a number
   *  (never null), no tie-break/null case to handle. */
  protected readonly rows = computed(() => [...this.data()[this.segment()]].sort((a, b) => b.metrics.roi - a.metrics.roi));

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
