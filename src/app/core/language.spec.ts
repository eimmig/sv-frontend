import { TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { Language } from './language';

describe('Language', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.language');
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': {}, 'en-US': {}, es: {} },
          translocoConfig: { availableLangs: ['pt-BR', 'en-US', 'es'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  afterEach(() => {
    delete (navigator as { language?: string }).language;
  });

  it('falls back to pt-BR when nothing is stored and the browser locale is unsupported', () => {
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });

    const language = TestBed.inject(Language);

    expect(language.current()).toBe('pt-BR');
  });

  it('defaults to the browser locale when it is one of the supported ones', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-GB', configurable: true });

    const language = TestBed.inject(Language);

    expect(language.current()).toBe('en-US');
  });

  it('a stored locale wins over the browser locale', () => {
    localStorage.setItem('stakevault.language', 'es');
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });

    const language = TestBed.inject(Language);

    expect(language.current()).toBe('es');
  });

  it('set() persists the choice and drives TranslocoService', () => {
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    const language = TestBed.inject(Language);

    language.set('en-US');

    expect(language.current()).toBe('en-US');
    expect(localStorage.getItem('stakevault.language')).toBe('en-US');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('en-US');
  });
});
