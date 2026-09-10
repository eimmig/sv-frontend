import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KpiCard, KpiCardSign } from './kpi-card';

@Component({
  imports: [KpiCard],
  template: `<app-kpi-card [icon]="icon" [label]="label" [value]="value" [sign]="sign" [testId]="testId" />`,
})
class HostComponent {
  icon = 'account_balance_wallet';
  label = 'Total apostado';
  value = 'R$ 1.000,00';
  sign: KpiCardSign | undefined;
  testId: string | undefined;
}

describe('KpiCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('renders label and value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.kpi-card__label')?.textContent).toBe('Total apostado');
    expect(el.querySelector('.kpi-card__value')?.textContent).toBe('R$ 1.000,00');
  });

  it('has no sign modifier class when sign is unset', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.kpi-card--positive')).toBeNull();
    expect(el.querySelector('.kpi-card--negative')).toBeNull();
  });

  it('applies the positive/negative modifier class from the sign input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.sign = 'negative';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.kpi-card--negative')).toBeTruthy();
  });

  it('sets data-testid when provided', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.testId = 'my-card';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="my-card"]')).toBeTruthy();
  });
});
