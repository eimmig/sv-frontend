import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { KpiCard, KpiCardSign } from './kpi-card';

@Component({
  imports: [KpiCard],
  template: `<app-kpi-card
    [icon]="icon"
    [label]="label"
    [value]="value"
    [sign]="sign"
    [testId]="testId"
    [secondary]="secondary"
    [hint]="hint"
  />`,
})
class HostComponent {
  icon = 'account_balance_wallet';
  label = 'Total apostado';
  value = 'R$ 1.000,00';
  sign: KpiCardSign | undefined;
  testId: string | undefined;
  secondary: string | undefined;
  hint: string | undefined;
}

describe('KpiCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HostComponent,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': { kpiCard: { helpLabel: 'Explicar {{label}}' } } },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
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

  it('renders the secondary line and a closed help button when a hint is informed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.secondary = 'R$ 80,00';
    fixture.componentInstance.hint = 'Lucro em unidades';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector('[data-testid="kpi-card-help-toggle"]');

    expect(el.querySelector('[data-testid="kpi-card-secondary"]')?.textContent).toBe('R$ 80,00');
    expect(toggle?.getAttribute('aria-label')).toBe('Explicar Total apostado');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('[data-testid="kpi-card-help"]')).toBeNull();
    expect(el.querySelector('.kpi-card')?.hasAttribute('title')).toBe(false);
    expect(el.querySelector('.kpi-card')?.classList).toContain('kpi-card--with-help');
  });

  it('opens and closes the hint with the help button, linked by aria-controls', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.hint = 'Lucro em unidades';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLButtonElement>('[data-testid="kpi-card-help-toggle"]')!;

    toggle.click();
    fixture.detectChanges();
    const help = el.querySelector('[data-testid="kpi-card-help"]');
    expect(help?.textContent).toBe('Lucro em unidades');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(help?.id);

    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="kpi-card-help"]')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders neither the secondary line nor a help button when they are not informed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="kpi-card-secondary"]')).toBeNull();
    expect(el.querySelector('[data-testid="kpi-card-help-toggle"]')).toBeNull();
    expect(el.querySelector('.kpi-card')?.classList).not.toContain('kpi-card--with-help');
  });
});
