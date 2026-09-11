import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { authGuard } from './auth-guard';
import { Auth } from './auth';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
  });

  it('allows navigation when authenticated', () => {
    TestBed.inject(Auth).session.set({
      token: 't',
      userId: 'u',
      role: 'MEMBER',
      tenantSlug: 'acme',
      mustChangePassword: false,
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    );

    expect(result).toBe(true);
  });

  it('redirects to /login when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe(TestBed.inject(Router).createUrlTree(['/login']).toString());
  });
});
