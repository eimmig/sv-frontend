import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface TenantSettings {
  readonly unitPercent: number;
}

/**
 * GET/PATCH /api/v1/settings - only sends 'Authorization: Bearer' (authInterceptor).
 * GET is not role-restricted (every user needs unitPercent for "unidades apostadas");
 * PATCH is admin-only server-side (X-User-Role, 403 otherwise) - the caller gates the
 * edit form with Auth.isAdmin() for UX, the backend enforces the real restriction.
 */
@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);

  get(): Observable<TenantSettings> {
    return this.http.get<TenantSettings>(`${environment.apiGatewayUrl}/api/v1/settings`);
  }

  update(unitPercent: number): Observable<TenantSettings> {
    return this.http.patch<TenantSettings>(`${environment.apiGatewayUrl}/api/v1/settings`, { unitPercent });
  }
}
