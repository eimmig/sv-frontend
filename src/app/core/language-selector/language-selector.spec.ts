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

  // Regression: a mat-icon rendering "language" as a ligature needs the Material Symbols
  // fontSet - without it the browser falls back to a generic font and shows raw clipped text
  // instead of the glyph (feat-036, real bug found in production).
  it('uses the Material Symbols Outlined fontSet for the globe icon in both trigger variants', () => {
    const expanded = TestBed.createComponent(LanguageSelector);
    expanded.detectChanges();
    expect(expanded.nativeElement.querySelector('.language-selector mat-icon')?.getAttribute('fontSet')).toBe(
      'material-symbols-outlined',
    );

    const collapsed = TestBed.createComponent(LanguageSelector);
    collapsed.componentRef.setInput('collapsed', true);
    collapsed.detectChanges();
    expect(
      collapsed.nativeElement.querySelector('.language-selector__collapsed-trigger mat-icon')?.getAttribute('fontSet'),
    ).toBe('material-symbols-outlined');
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
