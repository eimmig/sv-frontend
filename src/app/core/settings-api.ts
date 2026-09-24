import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface TenantSettings {
  readonly unitPercent: number;
}

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
