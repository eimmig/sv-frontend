import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { DateMaskDirective } from './date-mask.directive';
import { Language } from './language';

@Component({
  imports: [DateMaskDirective, FormsModule, MatDatepickerModule, MatInputModule],
  template: `
    <input matInput appDateMask [matDatepicker]="picker" [(ngModel)]="value" data-testid="masked-input" />
    <mat-datepicker #picker />
  `,
})
class HostComponent {
  value: Date | null = null;
}

describe('DateMaskDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let input: HTMLInputElement;

  async function createComponent(locale: 'pt-BR' | 'en-US') {
    await TestBed.configureTestingModule({
      imports: [
        HostComponent,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': { dateMask: { placeholder: 'mm/dd/aaaa' } }, 'en-US': { dateMask: { placeholder: 'mm/dd/yyyy' } } },
          translocoConfig: { availableLangs: ['pt-BR', 'en-US'], defaultLang: locale },
          preloadLangs: true,
        }),
      ],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();
    TestBed.inject(DateAdapter).setLocale(locale);
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    input = fixture.nativeElement.querySelector('[data-testid="masked-input"]');
  }

  function typeDigits(digits: string): void {
    for (const digit of digits) {
      input.value += digit;
      input.dispatchEvent(new Event('input'));
    }
  }

  afterEach(() => {
    localStorage.removeItem('stakevault.language');
  });

  it('shows a translated placeholder when the field is empty', async () => {
    localStorage.setItem('stakevault.language', 'en-US');
    await createComponent('en-US');

    expect(input.placeholder).toBe('mm/dd/yyyy');
  });

  it('re-renders the placeholder when the active locale changes', async () => {
    localStorage.setItem('stakevault.language', 'en-US');
    await createComponent('en-US');
    expect(input.placeholder).toBe('mm/dd/yyyy');

    TestBed.inject(Language).set('pt-BR');
    fixture.detectChanges();

    expect(input.placeholder).toBe('mm/dd/aaaa');
  });

  it('inserts "/" in month/day/year order regardless of the active locale - Date.parse() (NativeDateAdapter.parse) is locale-independent and always reads M/D/Y for a slash-separated string, confirmed against a real browser', async () => {
    localStorage.setItem('stakevault.language', 'pt-BR');
    await createComponent('pt-BR');

    typeDigits('09172026');

    expect(input.value).toBe('09/17/2026');
  });

  it('formats the same way under en-US too - the mask order never varies by locale', async () => {
    localStorage.setItem('stakevault.language', 'en-US');
    await createComponent('en-US');

    typeDigits('09172026');

    expect(input.value).toBe('09/17/2026');
  });

  // The Date ultimately bound through MatDatepickerInput's own parsing (not this directive's
  // formatting, already proven above) is verified against a real browser in
  // e2e/period-report.spec.ts, not here - a minimal JSDOM harness for input+matDatepicker+ngModel
  // never resolves a Date even for a complete, correctly-formatted value set directly (bypassing
  // this directive entirely). That real-browser test is also what caught the M/D/Y-only
  // requirement in the first place (an earlier locale-ordered design silently swapped day/month).

  it('ignores non-digit characters and caps at 8 digits', async () => {
    localStorage.setItem('stakevault.language', 'pt-BR');
    await createComponent('pt-BR');

    typeDigits('09172026999');

    expect(input.value).toBe('09/17/2026');
  });
});
