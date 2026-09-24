import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto } from '../../../core/api-request';
import { BankrollApi } from '../../../core/bankroll-api';
import { SettingsApi } from '../../../core/settings-api';
import { StatisticsApi } from '../../../core/statistics-api';
import { ChartFrame } from '../../../shared/chart-frame/chart-frame';
import { MonthlyDrawdownChart } from '../../../shared/monthly-drawdown-chart/monthly-drawdown-chart';
import { buildMonthlyDrawdown, MonthlyDrawdownMonth, resolveMonthRange } from '../../../shared/monthly-drawdown-chart/monthly-drawdown-metrics';

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * "Grade de gráficos mensais de drawdown" (ver docs/STATISTICS.md) - own dedicated
 * month-range filter (2 MatDatepicker in month/year mode, deliberately NOT shared/period-preset-filter,
 * which is day-granularity and reused elsewhere for a different purpose). Both fields are
 * batched behind an explicit "Aplicar" submit, same convention as dashboard.ts's own 5-select
 * filterForm - reacting to each field independently would fire 2 overlapping requests when the
 * user changes both (from then to), risking the stale one resolving last. One HTTP round trip
 * for the whole interval; the grid of N mini-charts is client-side grouping only.
 */
@Component({
  imports: [
    ChartFrame,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MonthlyDrawdownChart,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  selector: 'app-monthly-drawdown-grid',
  styleUrl: './monthly-drawdown-grid.scss',
  templateUrl: './monthly-drawdown-grid.html',
})
export class MonthlyDrawdownGrid implements OnInit {
  private readonly statisticsApi = inject(StatisticsApi);
  private readonly bankrollApi = inject(BankrollApi);
  private readonly settingsApi = inject(SettingsApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    fromMonth: [firstOfMonth(new Date()), Validators.required],
    toMonth: [firstOfMonth(new Date()), Validators.required],
  });

  protected readonly months = signal<MonthlyDrawdownMonth[]>([]);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  protected onMonthSelected(
    date: Date,
    picker: { close(): void },
    controlName: 'fromMonth' | 'toMonth',
  ): void {
    this.filterForm.controls[controlName].setValue(firstOfMonth(date));
    picker.close();
  }

  protected applyFilter(): void {
    if (this.filterForm.invalid) {
      return;
    }
    this.reload();
  }

  protected trackMonth(_index: number, month: MonthlyDrawdownMonth): string {
    return `${month.year}-${month.month}`;
  }

  private reload(): void {
    const { fromMonth, toMonth } = this.filterForm.getRawValue();
    const { from, to } = resolveMonthRange(toYearMonth(fromMonth), toYearMonth(toMonth));
    loadInto(
      forkJoin({
        daily: this.statisticsApi.getDaily({ from, to }),
        saldoAtual: this.bankrollApi.getBalance().pipe(map((b) => b.balance)),
        unitPercent: this.settingsApi.get().pipe(map((s) => s.unitPercent)),
      }).pipe(map(({ daily, saldoAtual, unitPercent }) => buildMonthlyDrawdown(daily, from, to, saldoAtual, unitPercent))),
      this.months,
      this.loadError,
      () => this.transloco.translate('monthlyDrawdown.genericError'),
    );
  }
}
