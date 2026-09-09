import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { AppNav } from './app-nav';
import { Auth } from '../auth';

describe('AppNav', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    TestBed.configureTestingModule({
      imports: [
        AppNav,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              nav: {
                dashboard: 'Dashboard',
                bettingHouses: 'Casas de apostas',
                newBet: 'Registrar aposta',
                history: 'Histórico',
                users: 'Usuários',
                logout: 'Sair',
              },
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
    const fixture = TestBed.createComponent(AppNav);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="nav-users"]')).toBeTruthy();
  });

  it('hides the "Usuários" link for a member', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppNav);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="nav-users"]')).toBeNull();
  });

  it('logout() clears the session and navigates to /login', () => {
    session('MEMBER');
    const fixture = TestBed.createComponent(AppNav);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="nav-logout"]')?.click();

    expect(TestBed.inject(Auth).isAuthenticated()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
