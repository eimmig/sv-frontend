import { OverlayContainer } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { AppSideNav } from './app-side-nav';
import { Auth } from '../auth';

describe('AppSideNav', () => {
  // mat-menu (first CDK overlay used in this app, see feat-016) renders into a pane appended to
  // document.body, outside the fixture - TestBed teardown doesn't remove it, so a leftover pane
  // from one test could leak into the next test's DOM queries without this cleanup.
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
                dashboard: 'Dashboard',
                bettingHouses: 'Casas de apostas',
                newBet: 'Registrar aposta',
                history: 'Histórico',
                registerMenuItem: 'Cadastrar',
                dashboardMenuItem: 'Dashboard',
                searchStatistics: 'Buscar estatísticas',
                periodReport: 'Relatório do período',
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
});
