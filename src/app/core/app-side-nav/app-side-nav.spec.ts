import { OverlayContainer } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { AppSideNav } from './app-side-nav';
import { Auth } from '../auth';

describe('AppSideNav', () => {
  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    localStorage.removeItem('stakevault.navCollapsed');
    TestBed.configureTestingModule({
      imports: [
        AppSideNav,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              nav: {
                overview: 'Visão geral',
                dashboard: 'Dashboard',
                bettingHouses: 'Casas de apostas',
                newBet: 'Registrar aposta',
                history: 'Histórico',
                registerMenuItem: 'Cadastrar',
                dashboardMenuItem: 'Dashboard',
                searchStatistics: 'Buscar estatísticas',
                periodReport: 'Relatório do período',
                betTypeDashboard: 'Por tipo de aposta',
                telegramLink: 'Vincular Telegram',
                users: 'Usuários',
                logout: 'Sair',
                collapse: 'Retrair menu',
                expand: 'Expandir menu',
              },
              catalogs: {
                sports: { title: 'Esportes' },
                leagues: { title: 'Ligas' },
                markets: { title: 'Mercados' },
                tipsters: { title: 'Tipsters' },
                teams: { title: 'Times' },
              },
              theme: { switchToLight: 'Modo claro', switchToDark: 'Modo escuro' },
              language: { label: 'Idioma' },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideRouter([]), provideHttpClient()],
    });
  });

  function session(role: 'ADMIN' | 'MEMBER') {
    TestBed.inject(Auth).session.set({
      token: 't',
      userId: 'u',
      role,
      tenantSlug: 'acme',
      mustChangePassword: false,
    });
  }

  it('shows the "Usuários" link for an admin', () => {
    session('ADMIN');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="nav-users"]')).toBeTruthy();
  });

  it('hides the "Usuários" link for a member', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="nav-users"]')).toBeNull();
  });

  it('opens the sports mat-menu and shows the Cadastrar/Dashboard items', async () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="nav-sports-menu"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.querySelector('[data-testid="nav-sports-register"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="nav-sports-dashboard"]')).toBeTruthy();
  });

  it('shows the "Times" link (no dashboard counterpart, unlike the other catalogs)', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('[data-testid="nav-teams"]');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/teams');
  });

  it('uses the Symbols Outlined fontSet for nav icons, except "telegram" (no glyph in that font)', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const telegramIcon = el.querySelector('[data-testid="nav-telegram-link"] mat-icon');
    const searchStatsIcon = el.querySelector('[data-testid="nav-search-statistics"] mat-icon');

    expect(telegramIcon?.classList.contains('material-symbols-outlined')).toBe(false);
    expect(searchStatsIcon?.classList.contains('material-symbols-outlined')).toBe(true);
  });

  it('logout() clears the session and navigates to /login', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="nav-logout"]')?.click();

    expect(TestBed.inject(Auth).isAuthenticated()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('starts expanded and toggles to collapsed, persisting the choice', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.side-nav--collapsed')).toBeNull();

    el.querySelector<HTMLButtonElement>('[data-testid="nav-collapse-toggle"]')?.click();
    fixture.detectChanges();

    expect(el.querySelector('.side-nav--collapsed')).toBeTruthy();
    expect(localStorage.getItem('stakevault.navCollapsed')).toBe('true');
  });

  it('applies Material button styling to the collapse toggle', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();

    const toggle = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="nav-collapse-toggle"]');

    expect(toggle?.classList.contains('mat-mdc-icon-button')).toBe(true);
  });

  // CDK's BreakpointObserver expects a real MediaQueryList shape - a bare {matches} stub throws.
  function stubMatchMedia(matches: boolean) {
    const mql = {
      matches,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    return vi.fn().mockReturnValue(mql);
  }

  it('defaults to collapsed on a narrow viewport when the user has not chosen explicitly', () => {
    const matchMedia = stubMatchMedia(true);
    vi.stubGlobal('matchMedia', matchMedia);
    session('MEMBER');

    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.side-nav--collapsed')).toBeTruthy();
    expect(matchMedia).toHaveBeenCalledWith('(max-width: 599px)');
    vi.unstubAllGlobals();
  });

  it('an explicit stored choice overrides the narrow-viewport default', () => {
    vi.stubGlobal('matchMedia', stubMatchMedia(true));
    localStorage.setItem('stakevault.navCollapsed', 'false');
    session('MEMBER');

    const fixture = TestBed.createComponent(AppSideNav);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.side-nav--collapsed')).toBeNull();
    vi.unstubAllGlobals();
  });
});
