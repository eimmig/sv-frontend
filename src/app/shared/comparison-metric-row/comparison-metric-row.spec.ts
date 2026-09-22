import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ComparisonMetricRow } from './comparison-metric-row';
import { KpiCardSign } from '../kpi-card/kpi-card';

@Component({
  imports: [ComparisonMetricRow],
  template: `<app-comparison-metric-row
    [label]="label"
    [valueA]="valueA"
    [valueB]="valueB"
    [deltaLabel]="deltaLabel"
    [sign]="sign"
    [testId]="testId"
  />`,
})
class HostComponent {
  label = 'Lucro líquido';
  valueA = 'R$ 100,00';
  valueB = 'R$ 150,00';
  deltaLabel = '+R$ 50,00 (+50.0%)';
  sign: KpiCardSign | undefined;
  testId: string | undefined;
}

describe('ComparisonMetricRow', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('renders the label, both values, and the delta', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.comparison-metric-row__label')?.textContent).toBe('Lucro líquido');
    expect(el.querySelector('[data-testid="comparison-metric-row-value-a"]')?.textContent?.trim()).toBe('R$ 100,00');
    expect(el.querySelector('[data-testid="comparison-metric-row-value-b"]')?.textContent?.trim()).toBe('R$ 150,00');
    expect(el.querySelector('[data-testid="comparison-metric-row-delta"]')?.textContent?.trim()).toBe('+R$ 50,00 (+50.0%)');
  });

  it('has no sign modifier class when sign is unset', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.comparison-metric-row__delta--positive')).toBeNull();
    expect(el.querySelector('.comparison-metric-row__delta--negative')).toBeNull();
  });

  it('applies the positive/negative modifier class from the sign input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.sign = 'negative';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.comparison-metric-row__delta--negative')).toBeTruthy();
  });

  it('sets data-testid when provided', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.testId = 'row-net-profit';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="row-net-profit"]')).toBeTruthy();
  });
});
