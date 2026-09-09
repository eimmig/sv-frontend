import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ThemeToggle } from './theme-toggle';
import { Theme } from '../theme';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.theme');
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({
      imports: [
        ThemeToggle,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': { theme: { switchToLight: 'Modo claro', switchToDark: 'Modo escuro' } },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  it('toggles the theme when clicked', () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    const theme = TestBed.inject(Theme);
    const before = theme.current();

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(theme.current()).not.toBe(before);
  });
});
