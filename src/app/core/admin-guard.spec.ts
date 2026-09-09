import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { adminGuard } from './admin-guard';
import { Auth } from './auth';

describe('adminGuard', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
  });

  it('allows navigation for an admin', () => {
    TestBed.inject(Auth).session.set({
      token: 't',
      userId: 'u',
      role: 'ADMIN',
      tenantSlug: 'acme',
      mustChangePassword: false,
    });

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/usuarios' } as never),
    );

    expect(result).toBe(true);
  });

  it('redirects a non-admin to /dashboard', () => {
    TestBed.inject(Auth).session.set({
      token: 't',
      userId: 'u',
      role: 'MEMBER',
      tenantSlug: 'acme',
      mustChangePassword: false,
    });

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/usuarios' } as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe(
      TestBed.inject(Router).createUrlTree(['/dashboard']).toString(),
    );
  });
});
