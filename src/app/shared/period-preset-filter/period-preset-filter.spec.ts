import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PeriodPresetFilter, resolvePreset } from './period-preset-filter';

// Fixed reference date (a Wednesday) so preset math never depends on the day the suite runs.
const TODAY = new Date(2026, 8, 16); // 2026-09-16

describe('resolvePreset (pure date math, no real clock dependency)', () => {
  it('today resolves to the same date for from and to', () => {
    expect(resolvePreset('today', TODAY)).toEqual({ from: '2026-09-16', to: '2026-09-16' });
  });

  it('lastWeek resolves to a 7-day rolling window ending today', () => {
    expect(resolvePreset('lastWeek', TODAY)).toEqual({ from: '2026-09-10', to: '2026-09-16' });
  });

  it('last15Days resolves to a 15-day rolling window ending today', () => {
    expect(resolvePreset('last15Days', TODAY)).toEqual({ from: '2026-09-02', to: '2026-09-16' });
  });

  it('lastMonth resolves to the previous full calendar month', () => {
    expect(resolvePreset('lastMonth', TODAY)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('lastMonth handles a January reference date by rolling back to the previous December', () => {
    expect(resolvePreset('lastMonth', new Date(2026, 0, 15))).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('thisMonth resolves from day 1 of the current month through today', () => {
    expect(resolvePreset('thisMonth', TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-16' });
  });
});

describe('PeriodPresetFilter', () => {
  let fixture: ComponentFixture<PeriodPresetFilter>;
  let component: PeriodPresetFilter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        PeriodPresetFilter,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': {} },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
    fixture = TestBed.createComponent(PeriodPresetFilter);
    component = fixture.componentInstance;
  });

  it('emits the "today" range once on construction, without user interaction', () => {
    const emitted: unknown[] = [];
    component.rangeChange.subscribe((range) => emitted.push(range));

    fixture.detectChanges();

    expect(emitted).toHaveLength(1);
    const [range] = emitted as { from: string; to: string }[];
    expect(range.from).toBe(range.to);
  });

  it('emits a new range when the preset changes to lastWeek', () => {
    const emitted: { from: string; to: string }[] = [];
    component.rangeChange.subscribe((range) => emitted.push(range));
    fixture.detectChanges();

    component['setPreset']('lastWeek');
    fixture.detectChanges();

    expect(emitted).toHaveLength(2);
    expect(emitted[1].from).not.toBe(emitted[1].to);
  });

  it('does not emit for "custom" until both from and to are set', () => {
    const emitted: unknown[] = [];
    fixture.detectChanges();
    component['setPreset']('custom');
    component.rangeChange.subscribe((range) => emitted.push(range));

    component['setCustomFrom']('2026-01-01');
    fixture.detectChanges();
    expect(emitted).toHaveLength(0);

    component['setCustomTo']('2026-01-31');
    fixture.detectChanges();
    expect(emitted).toEqual([{ from: '2026-01-01', to: '2026-01-31' }]);
  });
});
