import { Component, effect, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';

import { DateMaskDirective } from '../../core/date-mask.directive';

export type PeriodPreset = 'today' | 'lastWeek' | 'last15Days' | 'lastMonth' | 'thisMonth' | 'custom';

export interface PeriodRange {
  readonly from: string;
  readonly to: string;
}

export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfMonth(date: Date, monthOffset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

function endOfMonth(date: Date, monthOffset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset + 1, 0);
}

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

@Component({
  imports: [
    DateMaskDirective,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslocoPipe,
  ],
  selector: 'app-period-preset-filter',
  styleUrl: './period-preset-filter.scss',
  templateUrl: './period-preset-filter.html',
})
export class PeriodPresetFilter {
  readonly rangeChange = output<PeriodRange>();

  protected readonly preset = signal<PeriodPreset>('today');
  protected readonly customFrom = signal<Date | null>(null);
  protected readonly customTo = signal<Date | null>(null);

  constructor() {
    effect(() => {
      const preset = this.preset();
      if (preset === 'custom') {
        const from = this.customFrom();
        const to = this.customTo();
        if (from && to) {
          this.rangeChange.emit({ from: toDateOnly(from), to: toDateOnly(to) });
        }
        return;
      }
      this.rangeChange.emit(resolvePreset(preset, new Date()));
    });
  }

  protected setPreset(preset: PeriodPreset): void {
    this.preset.set(preset);
  }

  protected setCustomFrom(value: Date | null): void {
    this.customFrom.set(value);
  }

  protected setCustomTo(value: Date | null): void {
    this.customTo.set(value);
  }
}
