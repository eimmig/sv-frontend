import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto } from '../../core/api-request';
import { BankrollApi } from '../../core/bankroll-api';
import { formatBrl } from '../../core/currency';
import { Language } from '../../core/language';
import { formatOdd } from '../../core/number-format';
import { formatPercent } from '../../core/percent';
import { SettingsApi } from '../../core/settings-api';
import { DailyBetMetrics, EMPTY_BET_METRICS, BetMetrics, StatisticsApi } from '../../core/statistics-api';
import { KpiCard, KpiCardSign, kpiSign } from '../../shared/kpi-card/kpi-card';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';
import { PeriodPresetFilter, PeriodRange } from '../../shared/period-preset-filter/period-preset-filter';
import { buildDailyTable, computeSummary } from './period-report-metrics';

interface PeriodReportData {
  readonly overall: BetMetrics;
  readonly daily: DailyBetMetrics[];
  /** GET /api/v1/bankroll/balance?at=<from|to> (bets-service epic-013) - only 2 calls, unlike
   *  the dashboard's 3 (epic-015): this page has no separate "saldoAtual agora" fetch, saldoFinal
   *  plays that role in every formula here (see period-report-metrics.ts and feat-015's plan_review). */
  readonly saldoInicial: number;
  readonly saldoFinal: number;
  readonly unitPercent: number;
}

const EMPTY_DATA: PeriodReportData = {
  overall: EMPTY_BET_METRICS,
  daily: [],
  saldoInicial: 0,
  saldoFinal: 0,
  unitPercent: 0,
};

/**
 * "Relatório do período" (epic-017) - closed-form view of performance within a period, always
 * with a mandatory date filter (reuses shared/period-preset-filter from feat-014, which always
 * has a value - defaults to "Hoje" - so this page never has a "no filter" state by construction).
 * Distinct from the consolidated dashboard (epic-006/015) and "Buscar Estatísticas" (epic-012).
 */
@Component({
  imports: [KpiCard, Panel, PanelLayout, PeriodPresetFilter, TranslocoPipe],
  selector: 'app-period-report',
  styleUrl: './period-report.scss',
  templateUrl: './period-report.html',
})
export class PeriodReport {
  private readonly statisticsApi = inject(StatisticsApi);
  private readonly bankrollApi = inject(BankrollApi);
  private readonly settingsApi = inject(SettingsApi);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  protected readonly formatBrl = formatBrl;

  protected readonly period = signal<PeriodRange>({ from: '', to: '' });
  protected readonly data = signal<PeriodReportData>(EMPTY_DATA);
  protected readonly error = signal<string | null>(null);

  protected readonly dailyTable = computed(() => {
    const data = this.data();
    const period = this.period();
    return buildDailyTable(data.daily, period.from, period.to, data.saldoFinal, data.unitPercent);
  });

  protected readonly summary = computed(() => {
    const data = this.data();
    return computeSummary(data.overall, data.daily, data.saldoInicial, data.saldoFinal, data.unitPercent);
  });

  protected formatPercent(value: number): string {
    return formatPercent(value, this.language.current());
  }

  protected formatOdd(value: number): string {
    return formatOdd(value, this.language.current());
  }

  protected sign(value: number): KpiCardSign {
    return kpiSign(value);
  }

  protected trackDay(_index: number, row: { date: string }): string {
    return row.date;
  }

  protected onPeriodChange(range: PeriodRange): void {
    this.period.set(range);
    loadInto(
      forkJoin({
        overall: this.statisticsApi.get({ from: range.from, to: range.to }).pipe(map((dashboard) => dashboard.overall)),
        daily: this.statisticsApi.getDaily({ from: range.from, to: range.to }),
        saldoInicial: this.bankrollApi.getBalance(range.from).pipe(map((b) => b.balance)),
        saldoFinal: this.bankrollApi.getBalance(range.to).pipe(map((b) => b.balance)),
        unitPercent: this.settingsApi.get().pipe(map((s) => s.unitPercent)),
      }),
      this.data,
      this.error,
      () => this.transloco.translate('periodReport.genericError'),
    );
  }
}
