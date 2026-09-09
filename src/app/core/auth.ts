import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';

export type Role = 'ADMIN' | 'MEMBER';

export interface Session {
  readonly token: string;
  readonly userId: string;
  readonly role: Role;
  readonly tenantSlug: string;
  readonly mustChangePassword: boolean;
}

interface LoginResponse {
  readonly token: string;
  readonly userId: string;
  readonly role: Role;
  readonly mustChangePassword: boolean;
}

const STORAGE_KEY = 'stakevault.auth';

function storedSession(): Session | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/**
 * PASETO v4.local session, persisted in localStorage (same 'stakevault.*'
 * pattern as Theme/Language) - the token is symmetrically encrypted, so
 * userId/role are returned by the login endpoint itself (auth-service
 * feat-010) rather than decoded client-side.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);

  readonly session = signal<Session | null>(storedSession());
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.session()?.role === 'ADMIN');
  readonly mustChangePassword = computed(() => this.session()?.mustChangePassword ?? false);

  login(tenantSlug: string, email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiGatewayUrl}/api/v1/auth/login`, {
        slug: tenantSlug,
        email,
        password,
      })
      .pipe(
        tap((response) => {
          const session: Session = {
            token: response.token,
            userId: response.userId,
            role: response.role,
            tenantSlug,
            mustChangePassword: response.mustChangePassword,
          };
          this.session.set(session);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          }
        }),
      );
  }

  logout(): void {
    this.session.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
