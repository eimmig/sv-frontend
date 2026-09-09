import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Auth } from './auth';
import { environment } from '../../environments/environment';

describe('Auth', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('starts unauthenticated when nothing is persisted', () => {
    const auth = TestBed.inject(Auth);

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.session()).toBeNull();
  });

  it('login() stores the session and marks the user authenticated', () => {
    const auth = TestBed.inject(Auth);
    const httpMock = TestBed.inject(HttpTestingController);
    auth.login('acme', 'ana@acme', 'secret').subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/auth/login`);
    expect(request.request.body).toEqual({ slug: 'acme', email: 'ana@acme', password: 'secret' });
    request.flush({ token: 'v4.local.token', userId: 'user-1', role: 'ADMIN', mustChangePassword: false });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(auth.session()).toEqual({
      token: 'v4.local.token',
      userId: 'user-1',
      role: 'ADMIN',
      tenantSlug: 'acme',
      mustChangePassword: false,
    });
    expect(JSON.parse(localStorage.getItem('stakevault.auth') ?? '{}')).toEqual(auth.session());
  });

  it('a fresh service picks up a session persisted by a previous instance', () => {
    localStorage.setItem(
      'stakevault.auth',
      JSON.stringify({
        token: 't',
        userId: 'u',
        role: 'MEMBER',
        tenantSlug: 'acme',
        mustChangePassword: true,
      }),
    );

    const fresh = TestBed.inject(Auth);

    expect(fresh.isAuthenticated()).toBe(true);
    expect(fresh.isAdmin()).toBe(false);
    expect(fresh.mustChangePassword()).toBe(true);
  });

  it('logout() clears the session and localStorage', () => {
    const auth = TestBed.inject(Auth);
    const httpMock = TestBed.inject(HttpTestingController);
    auth.login('acme', 'ana@acme', 'secret').subscribe();
    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/auth/login`)
      .flush({ token: 't', userId: 'u', role: 'MEMBER', mustChangePassword: false });

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('stakevault.auth')).toBeNull();
  });
});
