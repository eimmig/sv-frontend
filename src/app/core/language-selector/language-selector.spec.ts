import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { LanguageSelector } from './language-selector';
import { Language } from '../language';

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.language');
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    TestBed.configureTestingModule({
      imports: [
        LanguageSelector,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': { language: { label: 'Idioma' } }, 'en-US': {}, es: {} },
          translocoConfig: { availableLangs: ['pt-BR', 'en-US', 'es'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  afterEach(() => {
    delete (navigator as { language?: string }).language;
  });

  it('starts with the active locale selected', () => {
    const fixture = TestBed.createComponent(LanguageSelector);
    fixture.detectChanges();

    expect(TestBed.inject(Language).current()).toBe('pt-BR');
  });

  it('switches the active locale', () => {
    const fixture = TestBed.createComponent(LanguageSelector);
    fixture.detectChanges();

    fixture.componentInstance['onLocaleSelected']('en-US');

    expect(TestBed.inject(Language).current()).toBe('en-US');
  });

  it('renders the mat-select trigger by default, not the collapsed icon button', () => {
    const fixture = TestBed.createComponent(LanguageSelector);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="language-selector"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="language-selector-collapsed"]')).toBeNull();
  });

  it('renders an icon-button trigger instead of the mat-select when collapsed', () => {
    const fixture = TestBed.createComponent(LanguageSelector);
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="language-selector-collapsed"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="language-selector"]')).toBeNull();
  });
});
