import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';

import { dateSegmentOrder, provideLocaleDateAdapter } from './locale-date-adapter';

describe('LocaleDateAdapter', () => {
  let adapter: DateAdapter<Date>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideLocaleDateAdapter() });
    adapter = TestBed.inject(DateAdapter);
  });

  it.each([
    { locale: 'pt-BR', typed: '25/08/2026' },
    { locale: 'es', typed: '25/08/2026' },
    { locale: 'en-US', typed: '08/25/2026' },
  ])('reads $typed in the $locale order as 25 August 2026', ({ locale, typed }) => {
    adapter.setLocale(locale);

    const date = adapter.parse(typed, null) as Date;

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 7, 25]);
  });

  it('reads day and month apart when both are 12 or less', () => {
    adapter.setLocale('pt-BR');

    const date = adapter.parse('05/09/2026', null) as Date;

    expect([date.getMonth(), date.getDate()]).toEqual([8, 5]);
  });

  it.each(['31/02/2026', '25/13/2026', '00/08/2026'])('returns an invalid date for %s in pt-BR', (typed) => {
    adapter.setLocale('pt-BR');

    const date = adapter.parse(typed, null);

    expect(date).not.toBeNull();
    expect(adapter.isValid(date as Date)).toBe(false);
  });

  it('parses back the text it displays after the field loses focus', () => {
    const formats = TestBed.inject<MatDateFormats>(MAT_DATE_FORMATS);
    for (const locale of ['pt-BR', 'es', 'en-US']) {
      adapter.setLocale(locale);
      const original = new Date(2026, 7, 5);

      const shown = adapter.format(original, formats.display.dateInput);

      expect(adapter.parse(shown, null)?.getTime()).toBe(original.getTime());
    }
  });

  it('leaves the timepicker text to parseTime', () => {
    adapter.setLocale('pt-BR');

    const time = adapter.parseTime('17:26', null) as Date;

    expect([time.getHours(), time.getMinutes()]).toEqual([17, 26]);
  });
});

describe('dateSegmentOrder', () => {
  it.each([
    { locale: 'pt-BR', order: ['day', 'month', 'year'] },
    { locale: 'es', order: ['day', 'month', 'year'] },
    { locale: 'en-US', order: ['month', 'day', 'year'] },
  ])('orders $locale as $order', ({ locale, order }) => {
    expect(dateSegmentOrder(locale)).toEqual(order);
  });
});
