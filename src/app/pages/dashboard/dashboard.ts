import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map, of } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { countAppliedFilters } from '../../core/applied-filters';
import { Auth } from '../../core/auth';
import { BankrollApi } from '../../core/bankroll-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { formatBrl } from '../../core/currency';
import { Language } from '../../core/language';
import { formatOdd } from '../../core/number-format';
import { formatPercent } from '../../core/percent';
import { SettingsApi } from '../../core/settings-api';
import {
  DailyBetMetrics,
  EMPTY_STATISTICS_DASHBOARD,
  SegmentedBetMetrics,
  StatisticsApi,
  StatisticsDashboard,
} from '../../core/statistics-api';
import { KpiCard, KpiCardSign, kpiSign } from '../../shared/kpi-card/kpi-card';
import { MonthlyProfitChart, isDailyGranularity } from '../../shared/monthly-profit-chart/monthly-profit-chart';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';
import { PeriodPresetFilter, PeriodRange } from '../../shared/period-preset-filter/period-preset-filter';
import { SearchableSelect } from '../../shared/searchable-select/searchable-select';
import { MonthlyDrawdownGrid } from './monthly-drawdown-grid/monthly-drawdown-grid';

interface Options {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
}

const EMPTY_OPTIONS: Options = { bettingHouses: [], sports: [], leagues: [], markets: [], tipsters: [] };

interface DashboardData {
  readonly dashboard: StatisticsDashboard;
  readonly period: PeriodRange;
  readonly daily: DailyBetMetrics[];
  readonly bankrollFrom: number;
  readonly bankrollTo: number;
  readonly bankrollNow: number;
  readonly unitPercent: number;
}

const EMPTY_DASHBOARD_DATA: DashboardData = {
  dashboard: EMPTY_STATISTICS_DASHBOARD,
  period: { from: '', to: '' },
  daily: [],
  bankrollFrom: 0,
  bankrollTo: 0,
  bankrollNow: 0,
  unitPercent: 0,
};

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    KpiCard,
    MonthlyProfitChart,
    MonthlyDrawdownGrid,
    Panel,
    PanelLayout,
    PeriodPresetFilter,
    SearchableSelect,
    TranslocoPipe,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly statisticsApi = inject(StatisticsApi);
  private readonly bankrollApi = inject(BankrollApi);
  private readonly settingsApi = inject(SettingsApi);
  private readonly bettingHousesApi = inject(BettingHousesApi);
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);
  protected readonly auth = inject(Auth);

  protected readonly formatBrl = formatBrl;

  protected readonly options = signal<Options>(EMPTY_OPTIONS);
  protected readonly optionsError = signal<string | null>(null);

  protected readonly period = signal<PeriodRange>({ from: '', to: '' });
  protected readonly appliedFilterCount = signal(0);

  protected readonly dashboardData = signal<DashboardData>(EMPTY_DASHBOARD_DATA);
  protected readonly dashboardError = signal<string | null>(null);

  protected readonly unidadesApostadas = computed(() => {
    const data = this.dashboardData();
    const denominator = data.bankrollNow * data.unitPercent;
    return denominator === 0 ? null : data.dashboard.overall.totalStaked / denominator;
  });

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    bettingHouseId: [''],
    sportId: [''],
    leagueId: [''],
    marketId: [''],
    tipsterId: [''],
  });

  protected readonly unitPercentForm = this.formBuilder.nonNullable.group({
    unitPercent: [1, [Validators.required, Validators.min(0.0001), Validators.max(100)]],
  });
  protected readonly unitPercentSubmitting = signal(false);
  protected readonly unitPercentError = signal<string | null>(null);
  protected readonly unitPercentSuccess = signal<string | null>(null);

  constructor() {
    effect(() => {
      const percent = this.dashboardData().unitPercent * 100;
      if (this.unitPercentForm.pristine) {
        this.unitPercentForm.setValue({ unitPercent: percent });
      }
    });
  }

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
  }

  protected formatPercent(value: number): string {
    return formatPercent(value, this.language.current());
  }

  protected formatOdd(value: number): string {
    return formatOdd(value, this.language.current());
  }

  protected sign(value: number): KpiCardSign {
    return kpiSign(value);
  }

  protected onPeriodChange(range: PeriodRange): void {
    this.period.set(range);
    this.applyFilter();
  }

  protected applyFilter(): void {
    const raw = this.filterForm.getRawValue();
    const period = this.period();
    this.appliedFilterCount.set(countAppliedFilters(Object.values(raw)));
    const filter = {
      bettingHouseId: raw.bettingHouseId || undefined,
      sportId: raw.sportId || undefined,
      leagueId: raw.leagueId || undefined,
      marketId: raw.marketId || undefined,
      tipsterId: raw.tipsterId || undefined,
      from: period.from || undefined,
      to: period.to || undefined,
    };
    loadInto(
      forkJoin({
        dashboard: this.statisticsApi.get(filter),
        period: of(period),
        daily: isDailyGranularity(period.from, period.to) ? this.statisticsApi.getDaily(filter) : of([]),
        bankrollFrom: this.bankrollApi.getBalance(period.from).pipe(map((b) => b.balance)),
        bankrollTo: this.bankrollApi.getBalance(period.to).pipe(map((b) => b.balance)),
        bankrollNow: this.bankrollApi.getBalance().pipe(map((b) => b.balance)),
        unitPercent: this.settingsApi.get().pipe(map((s) => s.unitPercent)),
      }),
      this.dashboardData,
      this.dashboardError,
      () => this.transloco.translate('dashboard.genericError'),
    );
  }

  protected submitUnitPercent(): void {
    if (this.unitPercentForm.invalid || this.unitPercentSubmitting()) {
      return;
    }
    const percent = this.unitPercentForm.getRawValue().unitPercent;
    this.unitPercentSuccess.set(null);
    submitForm(
      this.settingsApi.update(percent / 100),
      this.unitPercentSubmitting,
      this.unitPercentError,
      () => this.transloco.translate('dashboard.genericError'),
      (result) => {
        this.dashboardData.update((data) => ({ ...data, unitPercent: result.unitPercent }));
        this.unitPercentForm.markAsPristine();
        this.unitPercentSuccess.set(this.transloco.translate('dashboard.unitPercentSuccess'));
      },
    );
  }

  protected trackSegment(_index: number, segment: SegmentedBetMetrics): string {
    return segment.dimensionId;
  }
}
