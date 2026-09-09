import { HttpRequest, HttpResponse, HttpInterceptorFn } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { authInterceptor } from './auth-interceptor';
import { Auth } from './auth';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });

  function capturedAuthorizationHeader(): string | null {
    const request = new HttpRequest('GET', '/api/v1/bets');
    let seenRequest: HttpRequest<unknown> | undefined;

    interceptor(request, (req) => {
      seenRequest = req;
      return of(new HttpResponse());
    }).subscribe();

    return seenRequest?.headers.get('Authorization') ?? null;
  }

  it('does not set Authorization when there is no session', () => {
    expect(capturedAuthorizationHeader()).toBeNull();
  });

  it('sets Authorization: Bearer <token> once a session exists', () => {
    TestBed.inject(Auth).session.set({
      token: 'v4.local.token',
      userId: 'u',
      role: 'MEMBER',
      tenantSlug: 'acme',
      mustChangePassword: false,
    });

    expect(capturedAuthorizationHeader()).toBe('Bearer v4.local.token');
  });
});
