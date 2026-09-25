import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { authInterceptor } from './auth-interceptor';
import { Auth } from './auth';
import { Loading } from './loading';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  let router: Router;

  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  function signIn(): void {
    TestBed.inject(Auth).session.set({
      token: 'v4.local.token',
      userId: 'u',
      role: 'MEMBER',
      tenantSlug: 'acme',
      mustChangePassword: false,
    });
  }

  function capturedAuthorizationHeader(): string | null {
    const request = new HttpRequest('GET', '/api/v1/bets');
    let seenRequest: HttpRequest<unknown> | undefined;

    interceptor(request, (req) => {
      seenRequest = req;
      return of(new HttpResponse());
    }).subscribe();

    return seenRequest?.headers.get('Authorization') ?? null;
  }

  function failWith(status: number, type?: string): Observable<never> {
    return throwError(
      () => new HttpErrorResponse({ status, error: type ? { type, status } : null, url: '/api/v1/bets' }),
    );
  }

  function send(response: Observable<never>, url = '/api/v1/bets'): unknown {
    let received: unknown;
    interceptor(new HttpRequest('GET', url), () => response).subscribe({ error: (error) => (received = error) });
    return received;
  }

  it('does not set Authorization when there is no session', () => {
    expect(capturedAuthorizationHeader()).toBeNull();
  });

  it('sets Authorization: Bearer <token> once a session exists', () => {
    signIn();

    expect(capturedAuthorizationHeader()).toBe('Bearer v4.local.token');
  });

  it('expires the session, drops the overlay and goes to the login on an invalid-token 401', () => {
    signIn();
    const reset = vi.spyOn(TestBed.inject(Loading), 'reset');

    const error = send(failWith(401, 'https://docs/errors/invalid-token'));

    const auth = TestBed.inject(Auth);
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.sessionExpired()).toBe(true);
    expect(reset).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(error).toBeInstanceOf(HttpErrorResponse);
  });

  it('navigates only once when several requests fail with an expired token', () => {
    signIn();

    send(failWith(401, 'https://docs/errors/invalid-token'));
    send(failWith(401, 'https://docs/errors/invalid-token'));

    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('ignores a late expired-token 401 from a request sent before the user signed in again', () => {
    signIn();
    const auth = TestBed.inject(Auth);
    let failLate: (() => void) | undefined;
    const late = new Observable<never>((subscriber) => {
      failLate = () =>
        subscriber.error(
          new HttpErrorResponse({ status: 401, error: { type: 'https://docs/errors/invalid-token' } }),
        );
    });
    interceptor(new HttpRequest('GET', '/api/v1/bets'), () => late).subscribe({ error: () => undefined });

    auth.session.set({ token: 'v4.local.fresh', userId: 'u', role: 'MEMBER', tenantSlug: 'acme', mustChangePassword: false });
    failLate?.();

    expect(auth.session()?.token).toBe('v4.local.fresh');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('keeps the session on a 401 that is a business error, such as a wrong current password', () => {
    signIn();

    const error = send(
      failWith(401, 'https://docs/errors/current-password-mismatch'),
      '/api/v1/auth/change-password',
    );

    expect(TestBed.inject(Auth).isAuthenticated()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(HttpErrorResponse);
  });

  it('keeps the session on a 401 without a problem body', () => {
    signIn();

    send(failWith(401));

    expect(TestBed.inject(Auth).isAuthenticated()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('keeps the session on other errors', () => {
    signIn();

    send(failWith(500, 'https://docs/errors/invalid-token'));

    expect(TestBed.inject(Auth).isAuthenticated()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('leaves a 401 without a session alone, as on a failed sign-in', () => {
    send(failWith(401, 'https://docs/errors/invalid-token'), '/api/v1/auth/login');

    expect(TestBed.inject(Auth).sessionExpired()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
