import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto } from '../../core/api-request';
import { BankrollApi } from '../../core/bankroll-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { SettingsApi } from '../../core/settings-api';
import {
  DailyBetMetrics,
  EMPTY_STATISTICS_DASHBOARD,
  StatisticsApi,
  StatisticsDashboard,
} from '../../core/statistics-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';
import { PeriodPresetFilter, PeriodRange, resolvePreset } from '../../shared/period-preset-filter/period-preset-filter';
import { SearchableSelect } from '../../shared/searchable-select/searchable-select';

interface Options {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
}

const EMPTY_OPTIONS: Options = { bettingHouses: [], sports: [], leagues: [], markets: [], tipsters: [] };

interface PeriodComparisonSide {
  readonly dashboard: StatisticsDashboard;
  readonly daily: DailyBetMetrics[];
  readonly bankrollFrom: number;
  readonly bankrollTo: number;
}

const EMPTY_SIDE: PeriodComparisonSide = {
  dashboard: EMPTY_STATISTICS_DASHBOARD,
  daily: [],
  bankrollFrom: 0,
  bankrollTo: 0,
};

interface PeriodComparisonData {
  readonly a: PeriodComparisonSide;
  readonly b: PeriodComparisonSide;
  readonly unitPercent: number;
}

const EMPTY_DATA: PeriodComparisonData = { a: EMPTY_SIDE, b: EMPTY_SIDE, unitPercent: 0 };

/**
 * "Comparativo entre dois períodos" (epic-031, pedido do usuário em 2026-09-22) - 2 seletores de
 * período independentes (shared/period-preset-filter, um por lado) mais o bloco de filtros comuns
 * já usado em pages/dashboard/dashboard.ts, aplicado igualmente aos 2 lados. Zero endpoint novo -
 * cada lado é a mesma bateria de chamadas já usada por outras telas de estatística (GET
 * /api/v1/statistics(/daily), GET /api/v1/bankroll/balance), só disparada 2x.
 */
@Component({
  imports: [MatButtonModule, Panel, PanelLayout, PeriodPresetFilter, ReactiveFormsModule, SearchableSelect, TranslocoPipe],
  selector: 'app-period-comparison',
  styleUrl: './period-comparison.scss',
  templateUrl: './period-comparison.html',
})
export class PeriodComparison implements OnInit {
  private readonly statisticsApi = inject(StatisticsApi);
  private readonly bankrollApi = inject(BankrollApi);
  private readonly settingsApi = inject(SettingsApi);
  private readonly bettingHousesApi = inject(BettingHousesApi);
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  protected readonly options = signal<Options>(EMPTY_OPTIONS);
  protected readonly optionsError = signal<string | null>(null);

  // Seeded already-resolved ("Hoje") instead of {from:'',to:''} - shared/period-preset-filter's 2
  // instances emit independently (not atomically), so an empty seed here would make the 1st
  // applyFilter() run with the other side's period still blank, which StatisticsFilter reads as
  // "no filter" (whole tenant history) - a real flash of wrong data (achado MAJOR do Plan Review
  // de feat-037, 2026-09-22).
  protected readonly periodA = signal<PeriodRange>(resolvePreset('today', new Date()));
  protected readonly periodB = signal<PeriodRange>(resolvePreset('today', new Date()));

  protected readonly data = signal<PeriodComparisonData>(EMPTY_DATA);
  protected readonly error = signal<string | null>(null);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    bettingHouseId: [''],
    sportId: [''],
    leagueId: [''],
    marketId: [''],
    tipsterId: [''],
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
      () => this.transloco.translate('periodComparison.genericError'),
    );
  }

  protected onPeriodAChange(range: PeriodRange): void {
    this.periodA.set(range);
    this.applyFilter();
  }

  protected onPeriodBChange(range: PeriodRange): void {
    this.periodB.set(range);
    this.applyFilter();
  }

  protected applyFilter(): void {
    const raw = this.filterForm.getRawValue();
    const filter = {
      bettingHouseId: raw.bettingHouseId || undefined,
      sportId: raw.sportId || undefined,
      leagueId: raw.leagueId || undefined,
      marketId: raw.marketId || undefined,
      tipsterId: raw.tipsterId || undefined,
    };
    const periodA = this.periodA();
    const periodB = this.periodB();
    loadInto(
      forkJoin({
        dashboardA: this.statisticsApi.get({ ...filter, from: periodA.from, to: periodA.to }),
        dailyA: this.statisticsApi.getDaily({ ...filter, from: periodA.from, to: periodA.to }),
        bankrollFromA: this.bankrollApi.getBalance(periodA.from).pipe(map((b) => b.balance)),
        bankrollToA: this.bankrollApi.getBalance(periodA.to).pipe(map((b) => b.balance)),
        dashboardB: this.statisticsApi.get({ ...filter, from: periodB.from, to: periodB.to }),
        dailyB: this.statisticsApi.getDaily({ ...filter, from: periodB.from, to: periodB.to }),
        bankrollFromB: this.bankrollApi.getBalance(periodB.from).pipe(map((b) => b.balance)),
        bankrollToB: this.bankrollApi.getBalance(periodB.to).pipe(map((b) => b.balance)),
        unitPercent: this.settingsApi.get().pipe(map((s) => s.unitPercent)),
      }).pipe(
        map((result) => ({
          a: { dashboard: result.dashboardA, daily: result.dailyA, bankrollFrom: result.bankrollFromA, bankrollTo: result.bankrollToA },
          b: { dashboard: result.dashboardB, daily: result.dailyB, bankrollFrom: result.bankrollFromB, bankrollTo: result.bankrollToB },
          unitPercent: result.unitPercent,
        })),
      ),
      this.data,
      this.error,
      () => this.transloco.translate('periodComparison.genericError'),
    );
  }
}
