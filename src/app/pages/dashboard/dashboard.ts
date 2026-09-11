import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { Auth } from '../../core/auth';
import { BankrollApi } from '../../core/bankroll-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { formatBrl } from '../../core/currency';
import { Language } from '../../core/language';
import { formatOdd } from '../../core/number-format';
import { formatPercent } from '../../core/percent';
import { SettingsApi } from '../../core/settings-api';
import { EMPTY_BET_METRICS, SegmentedBetMetrics, StatisticsApi, StatisticsDashboard } from '../../core/statistics-api';
import { KpiCard, KpiCardSign, kpiSign } from '../../shared/kpi-card/kpi-card';
import { MonthlyProfitChart } from '../../shared/monthly-profit-chart/monthly-profit-chart';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';
import { PeriodPresetFilter, PeriodRange } from '../../shared/period-preset-filter/period-preset-filter';

interface Options {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
}

const EMPTY_OPTIONS: Options = { bettingHouses: [], sports: [], leagues: [], markets: [], tipsters: [] };

const EMPTY_DASHBOARD: StatisticsDashboard = {
  overall: EMPTY_BET_METRICS,
  bySport: [],
  byMarket: [],
  byBettingHouse: [],
  byLeague: [],
  byTipster: [],
  monthly: [],
};

interface DashboardData {
  readonly dashboard: StatisticsDashboard;
  /** GET /api/v1/bankroll/balance?at=<from|to> (bets-service epic-013) - saldoInicial/saldoFinal
   *  do periodo filtrado, corte por settledAt (nao betDate), soma todas as casas do tenant. */
  readonly bankrollFrom: number;
  readonly bankrollTo: number;
  /** GET /api/v1/bankroll/balance sem 'at' ("agora") - usado so pra unidadesApostadas
   *  (totalStaked/(saldoAtual x unitPercent)), formula em docs/STATISTICS.md - deliberadamente
   *  nao versionado, usa o saldo/unitPercent vigentes aplicados retroativamente ao periodo. */
  readonly bankrollNow: number;
  readonly unitPercent: number;
}

const EMPTY_DASHBOARD_DATA: DashboardData = {
  dashboard: EMPTY_DASHBOARD,
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
    MatSelectModule,
    MatTabsModule,
    KpiCard,
    MonthlyProfitChart,
    Panel,
    PanelLayout,
    PeriodPresetFilter,
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

  /** Resolved by <app-period-preset-filter> - defaults to "Hoje" (its own default preset) and
   *  applies on every change, unlike the 5 catalog selects below (batched behind "Aplicar"). */
  protected readonly period = signal<PeriodRange>({ from: '', to: '' });

  protected readonly dashboardData = signal<DashboardData>(EMPTY_DASHBOARD_DATA);
  protected readonly dashboardError = signal<string | null>(null);

  /** null (rendered as "Indeterminado") when saldoAtual or unitPercent is 0 - not defined by
   *  docs/STATISTICS.md, decision from feat-014's plan review (no exception thrown/divide-by-zero). */
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

  /** Admin-only (Auth.isAdmin()) - GET /api/v1/settings isn't role-restricted (every user needs
   *  unitPercent for unidadesApostadas), only PATCH is. Value shown/edited as a percent (1 for
   *  1%), converted to the API's decimal fraction (0.01) on submit. */
  protected readonly unitPercentForm = this.formBuilder.nonNullable.group({
    unitPercent: [1, [Validators.required, Validators.min(0.0001), Validators.max(100)]],
  });
  protected readonly unitPercentSubmitting = signal(false);
  protected readonly unitPercentError = signal<string | null>(null);
  protected readonly unitPercentSuccess = signal<string | null>(null);

  constructor() {
    // Seeds the field with the loaded unitPercent, but only while the admin hasn't started
    // editing it (pristine) - avoids clobbering an in-progress edit on every applyFilter() reload.
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
    // No explicit applyFilter() call here - <app-period-preset-filter> emits its default range
    // ("Hoje") once on construction, which drives the initial load via onPeriodChange().
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
    loadInto(
      forkJoin({
        dashboard: this.statisticsApi.get({
          bettingHouseId: raw.bettingHouseId || undefined,
          sportId: raw.sportId || undefined,
          leagueId: raw.leagueId || undefined,
          marketId: raw.marketId || undefined,
          tipsterId: raw.tipsterId || undefined,
          from: period.from || undefined,
          to: period.to || undefined,
        }),
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
