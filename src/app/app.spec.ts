import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { App } from './app';
import { Language } from './core/language';
import { Loading } from './core/loading';

const brokenScreen = signal(false);

@Component({ template: '<p>{{ content() }}</p>' })
class BrokenScreen {
  protected readonly content = computed(() => {
    if (brokenScreen()) {
      throw new TypeError('render failure');
    }
    return 'ok';
  });
}

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('stakevault.auth');
    localStorage.removeItem('stakevault.language');
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
              loadingOverlay: {
                ariaLabel: 'Carregando',
                title: 'Arka',
                desc: 'Descrição',
                tagline: 'GESTÃO DE BANCA',
              },
            },
            'en-US': {},
          },
          translocoConfig: { availableLangs: ['pt-BR', 'en-US'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
      ],
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

    expect(el.querySelector('app-side-nav')).toBeNull();
    expect(el.querySelector('app-must-change-password-banner')).toBeNull();
  });

  it('rebinds the DateAdapter locale whenever Language.current changes, not only once at bootstrap', () => {
    const fixture = TestBed.createComponent(App);
    const language = TestBed.inject(Language);
    const dateAdapter = TestBed.inject(DateAdapter);
    const date = new Date(2026, 8, 16);
    const format = { year: 'numeric', month: 'long', day: 'numeric' };

    language.set('pt-BR');
    fixture.detectChanges();
    const ptBrFormatted = dateAdapter.format(date, format);

    language.set('en-US');
    fixture.detectChanges();
    const enUsFormatted = dateAdapter.format(date, format);

    expect(enUsFormatted).not.toBe(ptBrFormatted);
    expect(enUsFormatted).toContain('September');
    expect(ptBrFormatted.toLowerCase()).toContain('setembro');
  });

  it('opens straight to the app, with no overlay while nothing is loading', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="loading-overlay"]')).toBeNull();
    expect(el.querySelector<HTMLElement>('.app-shell')?.inert).toBe(false);
  });

  it('shows the overlay and makes the shell inert while a backend call is loading', () => {
    const fixture = TestBed.createComponent(App);
    TestBed.inject(Loading).visible.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="loading-overlay"]')).toBeTruthy();
    expect(el.querySelector<HTMLElement>('.app-shell')?.inert).toBe(true);
  });

  it('removes the overlay even when a screen fails to render in the same pass', async () => {
    brokenScreen.set(false);
    TestBed.inject(Router).resetConfig([{ path: '', component: BrokenScreen }]);
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    const loading = TestBed.inject(Loading);
    loading.visible.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="loading-overlay"]')).toBeTruthy();

    brokenScreen.set(true);
    loading.visible.set(false);
    expect(() => fixture.detectChanges()).toThrow('render failure');

    expect(el.querySelector('[data-testid="loading-overlay"]')).toBeNull();
    expect(el.querySelector<HTMLElement>('.app-shell')?.inert).toBe(false);
  });
});
