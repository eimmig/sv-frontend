import { Component, effect, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';

export type PeriodPreset = 'today' | 'lastWeek' | 'last15Days' | 'lastMonth' | 'thisMonth' | 'custom';

export interface PeriodRange {
  readonly from: string;
  readonly to: string;
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfMonth(date: Date, monthOffset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

function endOfMonth(date: Date, monthOffset: number): Date {
  // Day 0 of the following month is the last day of the target month.
  return new Date(date.getFullYear(), date.getMonth() + monthOffset + 1, 0);
}

/**
 * Resolves a preset into a {from, to} range anchored on `today` - pure function so tests can
 * inject a fixed reference date instead of depending on the real clock (see period-preset-filter.spec.ts).
 * "Ultima semana"/"Ultimos 15 dias" are rolling windows ending today (7/15 days inclusive);
 * "Ultimo mes" is the previous full calendar month; "Este mes" is day 1 of the current month
 * through today - decisions made in feat-014's plan review, not specified further in docs/STATISTICS.md.
 */
export function resolvePreset(preset: Exclude<PeriodPreset, 'custom'>, today: Date): PeriodRange {
  switch (preset) {
    case 'today':
      return { from: toDateOnly(today), to: toDateOnly(today) };
    case 'lastWeek':
      return { from: toDateOnly(addDays(today, -6)), to: toDateOnly(today) };
    case 'last15Days':
      return { from: toDateOnly(addDays(today, -14)), to: toDateOnly(today) };
    case 'lastMonth':
      return { from: toDateOnly(startOfMonth(today, -1)), to: toDateOnly(endOfMonth(today, -1)) };
    case 'thisMonth':
      return { from: toDateOnly(startOfMonth(today, 0)), to: toDateOnly(today) };
  }
}

/**
 * Reusable period filter (presets + custom range) - extracted for feat-014 (dashboard) because
 * epic-017 ("Relatorio do periodo") reuses the exact same presets/date-range shape (see
 * docs/services/web.md). Presets resolve client-side to yyyy-MM-dd (StatisticsApi's existing
 * from/to contract, no new query param). Defaults to "Hoje" and emits once on construction so
 * the parent doesn't need to duplicate default-preset logic.
 */
@Component({
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, TranslocoPipe],
  selector: 'app-period-preset-filter',
  styleUrl: './period-preset-filter.scss',
  templateUrl: './period-preset-filter.html',
})
export class PeriodPresetFilter {
  readonly rangeChange = output<PeriodRange>();

  protected readonly preset = signal<PeriodPreset>('today');
  protected readonly customFrom = signal('');
  protected readonly customTo = signal('');

  constructor() {
    effect(() => {
      const preset = this.preset();
      if (preset === 'custom') {
        const from = this.customFrom();
        const to = this.customTo();
        if (from && to) {
          this.rangeChange.emit({ from, to });
        }
        return;
      }
      this.rangeChange.emit(resolvePreset(preset, new Date()));
    });
  }

  protected setPreset(preset: PeriodPreset): void {
    this.preset.set(preset);
  }

  protected setCustomFrom(value: string): void {
    this.customFrom.set(value);
  }

  protected setCustomTo(value: string): void {
    this.customTo.set(value);
  }
}
