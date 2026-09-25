import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto } from '../../core/api-request';
import { countAppliedFilters } from '../../core/applied-filters';
import { BankrollApi } from '../../core/bankroll-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { formatBrl, formatBrlDelta } from '../../core/currency';
import { Language } from '../../core/language';
import { formatOdd, formatOddDelta } from '../../core/number-format';
import { formatPercent, formatPercentDelta } from '../../core/percent';
import { SettingsApi } from '../../core/settings-api';
import {
  BetMetrics,
  DailyBetMetrics,
  EMPTY_STATISTICS_DASHBOARD,
  StatisticsApi,
  StatisticsDashboard,
} from '../../core/statistics-api';
import { ComparisonEquityChart } from '../../shared/comparison-equity-chart/comparison-equity-chart';
import { ComparisonMetricRow } from '../../shared/comparison-metric-row/comparison-metric-row';
import { KpiCardSign, kpiSign } from '../../shared/kpi-card/kpi-card';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';
import { PeriodPresetFilter, PeriodRange, resolvePreset } from '../../shared/period-preset-filter/period-preset-filter';
import { SearchableSelect } from '../../shared/searchable-select/searchable-select';
import { ComparisonDelta, ComparisonSeries, buildComparisonSeries, computeDelta } from './period-comparison-metrics';
import { SegmentComparisonTable } from './segment-comparison-table/segment-comparison-table';

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

interface ComparisonRow {
  readonly label: string;
  readonly valueA: string;
  readonly valueB: string;
  readonly deltaLabel: string;
  readonly sign?: KpiCardSign;
  readonly testId: string;
}

function unidadesApostadas(overall: BetMetrics, bankrollTo: number, unitPercent: number): number | null {
  const denominator = bankrollTo * unitPercent;
  return denominator === 0 ? null : overall.totalStaked / denominator;
}

function signedInt(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

@Component({
  imports: [
    ComparisonEquityChart,
    ComparisonMetricRow,
    MatButtonModule,
    Panel,
    PanelLayout,
    PeriodPresetFilter,
    ReactiveFormsModule,
    SearchableSelect,
    SegmentComparisonTable,
    TranslocoPipe,
  ],
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
  protected readonly language = inject(Language);

  protected readonly options = signal<Options>(EMPTY_OPTIONS);
  protected readonly optionsError = signal<string | null>(null);

  protected readonly appliedFilterCount = signal(0);
  protected readonly periodA = signal<PeriodRange>(resolvePreset('today', new Date()));
  protected readonly periodB = signal<PeriodRange>(resolvePreset('today', new Date()));

  protected readonly data = signal<PeriodComparisonData>(EMPTY_DATA);
  protected readonly error = signal<string | null>(null);

  protected readonly rows = computed<ComparisonRow[]>(() => {
    const locale = this.language.current();
    const { a, b, unitPercent } = this.data();
    const overallA = a.dashboard.overall;
    const overallB = b.dashboard.overall;
    const indeterminate = this.transloco.translate('periodComparison.indeterminate');

    const money = (key: string, testId: string, valueA: number, valueB: number, colored: boolean): ComparisonRow => {
      const delta = computeDelta(valueA, valueB);
      return {
        label: this.transloco.translate(key),
        valueA: formatBrl(valueA),
        valueB: formatBrl(valueB),
        deltaLabel: this.formatMoneyDeltaLabel(delta, locale),
        sign: colored ? kpiSign(delta.absolute) : undefined,
        testId,
      };
    };

    const percent = (key: string, testId: string, valueA: number, valueB: number, colored: boolean): ComparisonRow => {
      const delta = computeDelta(valueA, valueB);
      return {
        label: this.transloco.translate(key),
        valueA: formatPercent(valueA, locale),
        valueB: formatPercent(valueB, locale),
        deltaLabel: this.formatPercentDeltaLabel(delta, locale),
        sign: colored ? kpiSign(delta.absolute) : undefined,
        testId,
      };
    };

    const count = (key: string, testId: string, valueA: number, valueB: number): ComparisonRow => {
      const delta = computeDelta(valueA, valueB);
      return {
        label: this.transloco.translate(key),
        valueA: String(valueA),
        valueB: String(valueB),
        deltaLabel: signedInt(delta.absolute),
        testId,
      };
    };

    const odd = (key: string, testId: string, valueA: number | null, valueB: number | null): ComparisonRow => ({
      label: this.transloco.translate(key),
      valueA: valueA === null ? indeterminate : formatOdd(valueA, locale),
      valueB: valueB === null ? indeterminate : formatOdd(valueB, locale),
      deltaLabel: valueA === null || valueB === null ? indeterminate : formatOddDelta(valueB - valueA, locale),
      testId,
    });

    return [
      money('periodComparison.netProfitLabel', 'period-comparison-row-net-profit', overallA.netProfit, overallB.netProfit, true),
      percent('periodComparison.roiLabel', 'period-comparison-row-roi', overallA.roi, overallB.roi, true),
      count('periodComparison.settledCountLabel', 'period-comparison-row-settled-count', overallA.settledCount, overallB.settledCount),
      percent('periodComparison.winRateLabel', 'period-comparison-row-win-rate', overallA.winRate, overallB.winRate, false),
      odd('periodComparison.avgOddLabel', 'period-comparison-row-avg-odd', overallA.avgOdd, overallB.avgOdd),
      count('periodComparison.wonCountLabel', 'period-comparison-row-won-count', overallA.wonCount, overallB.wonCount),
      count('periodComparison.lostCountLabel', 'period-comparison-row-lost-count', overallA.lostCount, overallB.lostCount),
      count('periodComparison.voidCountLabel', 'period-comparison-row-void-count', overallA.voidCount, overallB.voidCount),
      count('periodComparison.preCountLabel', 'period-comparison-row-pre-count', overallA.preCount, overallB.preCount),
      count('periodComparison.liveCountLabel', 'period-comparison-row-live-count', overallA.liveCount, overallB.liveCount),
      money('periodComparison.totalStakedLabel', 'period-comparison-row-total-staked', overallA.totalStaked, overallB.totalStaked, false),
      money('periodComparison.balanceFromLabel', 'period-comparison-row-balance-from', a.bankrollFrom, b.bankrollFrom, false),
      money('periodComparison.balanceToLabel', 'period-comparison-row-balance-to', a.bankrollTo, b.bankrollTo, false),
      odd(
        'periodComparison.unitsStakedLabel',
        'period-comparison-row-units-staked',
        unidadesApostadas(overallA, a.bankrollTo, unitPercent),
        unidadesApostadas(overallB, b.bankrollTo, unitPercent),
      ),
    ];
  });

  protected readonly chartSeries = computed<ComparisonSeries>(() => {
    const { a, b, unitPercent } = this.data();
    const periodA = this.periodA();
    const periodB = this.periodB();
    return buildComparisonSeries(
      { daily: a.daily, from: periodA.from, to: periodA.to, saldoFinal: a.bankrollTo },
      { daily: b.daily, from: periodB.from, to: periodB.to, saldoFinal: b.bankrollTo },
      unitPercent,
    );
  });

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
    this.appliedFilterCount.set(countAppliedFilters(Object.values(raw)));
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

  private formatMoneyDeltaLabel(delta: ComparisonDelta, locale: string): string {
    const percent = delta.percent === null ? '' : ` (${formatPercentDelta(delta.percent, locale)})`;
    return `${formatBrlDelta(delta.absolute)}${percent}`;
  }

  private formatPercentDeltaLabel(delta: ComparisonDelta, locale: string): string {
    const percent = delta.percent === null ? '' : ` (${formatPercentDelta(delta.percent, locale)})`;
    return `${formatPercentDelta(delta.absolute, locale)}${percent}`;
  }
}
