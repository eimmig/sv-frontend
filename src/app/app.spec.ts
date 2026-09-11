import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('stakevault.auth');
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'matchMedia', {
      value: () => ({ matches: false }),
      configurable: true,
    });
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              theme: { switchToLight: 'Modo claro', switchToDark: 'Modo escuro' },
              language: { label: 'Idioma' },
              splash: {
                ariaLabel: 'Animação de carregamento',
                title: 'Splash animado StakeVault',
                desc: 'Descrição',
                tagline: 'GESTÃO DE BANCA',
              },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    delete (navigator as { matchMedia?: unknown }).matchMedia;
    vi.useRealTimers();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('does not render the nav or must-change-password banner when unauthenticated', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    vi.runAllTimers();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-nav')).toBeNull();
    expect(el.querySelector('app-must-change-password-banner')).toBeNull();
  });

  it('shows the splash first and dismisses it once the intro finishes', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-splash')).toBeTruthy();

    vi.runAllTimers();
    fixture.detectChanges();

    expect(el.querySelector('app-splash')).toBeNull();
  });
});
