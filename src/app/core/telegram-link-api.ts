import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface TelegramLink {
  readonly code: string;
  readonly expiresAt: string;
}

/**
 * POST /api/v1/telegram-links - only sends 'Authorization: Bearer' (authInterceptor), the
 * gateway injects X-User-Id/X-Tenant-Id from the token (docs/services/auth-service.md).
 */
@Injectable({ providedIn: 'root' })
export class TelegramLinkApi {
  private readonly http = inject(HttpClient);

  create(): Observable<TelegramLink> {
    return this.http.post<TelegramLink>(`${environment.apiGatewayUrl}/api/v1/telegram-links`, {});
  }
}
