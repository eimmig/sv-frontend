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

  it.each([
    { locale: 'pt-BR' as const, typed: '09172026', expected: '09/17/2026', label: 'month/day/year order regardless of locale' },
    { locale: 'en-US' as const, typed: '09172026', expected: '09/17/2026', label: 'the same order under en-US - never varies by locale' },
    { locale: 'pt-BR' as const, typed: '09172026999', expected: '09/17/2026', label: 'ignoring non-digit characters and capping at 8 digits' },
  ])('inserts "/" in $label', async ({ locale, typed, expected }) => {
    localStorage.setItem('stakevault.language', locale);
    await createComponent(locale);

    typeDigits(typed);

    expect(input.value).toBe(expected);
  });
});
