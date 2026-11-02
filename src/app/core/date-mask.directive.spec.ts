import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { DateMaskDirective } from './date-mask.directive';
import { Language } from './language';
import { provideLocaleDateAdapter } from './locale-date-adapter';

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
          langs: { 'pt-BR': { dateMask: { placeholder: 'dd/mm/aaaa' } }, 'en-US': { dateMask: { placeholder: 'mm/dd/yyyy' } } },
          translocoConfig: { availableLangs: ['pt-BR', 'en-US'], defaultLang: locale },
          preloadLangs: true,
        }),
      ],
      providers: [provideLocaleDateAdapter()],
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

    expect(input.placeholder).toBe('dd/mm/aaaa');
  });

  it.each([
    { locale: 'pt-BR' as const, typed: '25082026', expected: '25/08/2026', label: 'day/month/year order under pt-BR' },
    { locale: 'en-US' as const, typed: '08252026', expected: '08/25/2026', label: 'month/day/year order under en-US' },
    { locale: 'pt-BR' as const, typed: '25082026999', expected: '25/08/2026', label: 'ignoring non-digit characters and capping at 8 digits' },
  ])('inserts "/" in $label', async ({ locale, typed, expected }) => {
    localStorage.setItem('stakevault.language', locale);
    await createComponent(locale);

    typeDigits(typed);

    expect(input.value).toBe(expected);
  });
});
