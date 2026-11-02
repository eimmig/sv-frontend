import { Injectable, Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';

export type DateSegment = 'day' | 'month' | 'year';

const TYPED_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function dateSegmentOrder(locale: string): DateSegment[] {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    .formatToParts(new Date(2026, 0, 31))
    .map((part) => part.type)
    .filter((type): type is DateSegment => type === 'day' || type === 'month' || type === 'year');
}

@Injectable()
export class LocaleDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    const match = typeof value === 'string' ? TYPED_DATE.exec(value.trim()) : null;
    if (!match) {
      return super.parse(value, parseFormat);
    }
    const parts: Record<string, number> = {};
    dateSegmentOrder(this.locale).forEach((segment, index) => (parts[segment] = Number(match[index + 1])));
    const date = new Date(parts['year'], parts['month'] - 1, parts['day']);
    const matches =
      date.getFullYear() === parts['year'] && date.getMonth() === parts['month'] - 1 && date.getDate() === parts['day'];
    return matches ? date : this.invalid();
  }
}

export function provideLocaleDateAdapter(): Provider[] {
  return [
    { provide: DateAdapter, useClass: LocaleDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ];
}
