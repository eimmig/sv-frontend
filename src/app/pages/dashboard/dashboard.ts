import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto } from '../../core/api-request';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { formatBrl } from '../../core/currency';
import { Language } from '../../core/language';
import { formatPercent } from '../../core/percent';
import { BetMetrics, SegmentedBetMetrics, StatisticsApi, StatisticsDashboard } from '../../core/statistics-api';
import { MonthlyProfitChart } from '../../shared/monthly-profit-chart/monthly-profit-chart';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

interface Options {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
}

const EMPTY_OPTIONS: Options = { bettingHouses: [], sports: [], leagues: [], markets: [], tipsters: [] };

const EMPTY_METRICS: BetMetrics = { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0 };

const EMPTY_DASHBOARD: StatisticsDashboard = {
  overall: EMPTY_METRICS,
  bySport: [],
  byMarket: [],
  byBettingHouse: [],
  monthly: [],
};

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MonthlyProfitChart,
    Panel,
    PanelLayout,
    TranslocoPipe,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly statisticsApi = inject(StatisticsApi);
  private readonly bettingHousesApi = inject(BettingHousesApi);
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  protected readonly formatBrl = formatBrl;

  protected readonly options = signal<Options>(EMPTY_OPTIONS);
  protected readonly optionsError = signal<string | null>(null);

  protected readonly dashboard = signal<StatisticsDashboard>(EMPTY_DASHBOARD);
  protected readonly dashboardError = signal<string | null>(null);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    bettingHouseId: [''],
    sportId: [''],
    leagueId: [''],
    marketId: [''],
    tipsterId: [''],
    from: [''],
    to: [''],
  });

  ngOnInit(): void {
    loadInto(
      forkJoin({
        bettingHouses: this.bettingHousesApi.list().pipe(map((page) => page.content)),
        sports: catalogApi(this.http, 'sports').list(),
        leagues: catalogApi(this.http, 'leagues').list(),
        markets: catalogApi(this.http, 'markets').list(),
        tipsters: catalogApi(this.http, 'tipsters').list(),
      }),
      this.options,
      this.optionsError,
      () => this.transloco.translate('dashboard.genericError'),
    );
    this.applyFilter();
  }

  protected formatPercent(value: number): string {
    return formatPercent(value, this.language.current());
  }

  /** Money/ROI values are colored consistently with the won/lost badge (docs/DESIGN-SYSTEM.md). */
  protected sign(value: number): 'positive' | 'negative' | 'neutral' {
    return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  }

  protected applyFilter(): void {
    const raw = this.filterForm.getRawValue();
    loadInto(
      this.statisticsApi.get({
        bettingHouseId: raw.bettingHouseId || undefined,
        sportId: raw.sportId || undefined,
        leagueId: raw.leagueId || undefined,
        marketId: raw.marketId || undefined,
        tipsterId: raw.tipsterId || undefined,
        from: raw.from || undefined,
        to: raw.to || undefined,
      }),
      this.dashboard,
      this.dashboardError,
      () => this.transloco.translate('dashboard.genericError'),
    );
  }

  protected trackSegment(_index: number, segment: SegmentedBetMetrics): string {
    return segment.dimensionId;
  }
}
