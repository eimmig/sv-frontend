import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { loadInto } from '../../core/api-request';
import { BankrollApi } from '../../core/bankroll-api';
import { formatOdd } from '../../core/number-format';
import { formatPercent } from '../../core/percent';
import { SettingsApi } from '../../core/settings-api';
import { DailyBetMetrics, EMPTY_BET_METRICS, BetMetrics, MonthlyBetMetrics, SegmentedBetMetrics, StatisticsApi } from '../../core/statistics-api';
import { roiMedioDiario } from '../period-report/period-report-metrics';
import { Language } from '../../core/language';
import { KpiCard, KpiCardSign, kpiSign } from '../../shared/kpi-card/kpi-card';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';
import { buildLifetimeCurve, resolveEarliestDate } from './overview-metrics';

interface OverviewData {
  readonly overall: BetMetrics;
  readonly monthly: MonthlyBetMetrics[];
  readonly byBetType: SegmentedBetMetrics[];
  readonly daily: DailyBetMetrics[];
  readonly saldoAtual: number;
  readonly saldoInicioHistorico: number;
  readonly unitPercent: number;
}

const EMPTY_DATA: OverviewData = {
  overall: EMPTY_BET_METRICS,
  monthly: [],
  byBetType: [],
  daily: [],
  saldoAtual: 0,
  saldoInicioHistorico: 0,
  unitPercent: 0,
};

/**
 * "Visão geral" pós-login (epic-021) - vida inteira do tenant, sem filtro de período (única tela
 * desta rodada sem shared/period-preset-filter). Formulas em docs/STATISTICS.md "Tela 'Visão
 * geral'".
 */
@Component({
  imports: [KpiCard, Panel, PanelLayout, TranslocoPipe],
  selector: 'app-overview',
  styleUrl: './overview.scss',
  templateUrl: './overview.html',
})
export class Overview implements OnInit {
  private readonly statisticsApi = inject(StatisticsApi);
  private readonly bankrollApi = inject(BankrollApi);
  private readonly settingsApi = inject(SettingsApi);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  protected readonly data = signal<OverviewData>(EMPTY_DATA);
  protected readonly error = signal<string | null>(null);

  /** null only when saldoAtual/unitPercent make the denominator 0 (fresh tenant) - same
   *  defensive convention as buildLifetimeCurve/profitUnidades elsewhere in this app. */
  protected readonly lucroTotalUnidades = computed(() => {
    const curve = buildLifetimeCurve(this.data().daily, this.data().saldoAtual, this.data().unitPercent);
    return curve.length === 0 ? null : curve[curve.length - 1].accumulated;
  });

  protected readonly lucroMedioMensal = computed(() => {
    const total = this.lucroTotalUnidades();
    return total === null ? null : total / 12;
  });

  protected readonly lucroPreUnidades = computed(() => this.betTypeUnidades('PRE'));
  protected readonly lucroLiveUnidades = computed(() => this.betTypeUnidades('LIVE'));

  protected readonly roi = computed(() => roiMedioDiario(this.data().daily));

  ngOnInit(): void {
    this.reload();
  }

  protected formatOdd(value: number): string {
    return formatOdd(value, this.language.current());
  }

  protected formatPercent(value: number): string {
    return formatPercent(value, this.language.current());
  }

  protected sign(value: number): KpiCardSign {
    return kpiSign(value);
  }

  private betTypeUnidades(dimensionId: 'PRE' | 'LIVE'): number | null {
    const data = this.data();
    const denominator = data.saldoAtual * data.unitPercent;
    if (denominator === 0) {
      return null;
    }
    const netProfit = data.byBetType.find((segment) => segment.dimensionId === dimensionId)?.metrics.netProfit ?? 0;
    return netProfit / denominator;
  }

  private reload(): void {
    const base$ = forkJoin({
      dashboard: this.statisticsApi.get({}),
      daily: this.statisticsApi.getDaily({}),
      saldoAtual: this.bankrollApi.getBalance().pipe(map((b) => b.balance)),
      unitPercent: this.settingsApi.get().pipe(map((s) => s.unitPercent)),
    });

    loadInto(
      base$.pipe(
        switchMap((base) => {
          const earliestDate = resolveEarliestDate(base.daily);
          const saldoInicioHistorico$ =
            earliestDate === null ? of(base.saldoAtual) : this.bankrollApi.getBalance(earliestDate).pipe(map((b) => b.balance));
          return saldoInicioHistorico$.pipe(
            map(
              (saldoInicioHistorico): OverviewData => ({
                overall: base.dashboard.overall,
                monthly: base.dashboard.monthly,
                byBetType: base.dashboard.byBetType,
                daily: base.daily,
                saldoAtual: base.saldoAtual,
                saldoInicioHistorico,
                unitPercent: base.unitPercent,
              }),
            ),
          );
        }),
      ),
      this.data,
      this.error,
      () => this.transloco.translate('overview.genericError'),
    );
  }
}
