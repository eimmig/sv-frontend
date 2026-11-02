import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { BYPASS_HTTP_CACHE } from './http-cache-interceptor';

export interface TelegramLink {
  readonly code: string;
  readonly expiresAt: string;
}

export interface TelegramLinkStatus {
  readonly linked: boolean;
  readonly linkedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class TelegramLinkApi {
  private readonly http = inject(HttpClient);

  create(): Observable<TelegramLink> {
    return this.http.post<TelegramLink>(`${environment.apiGatewayUrl}/api/v1/telegram-links`, {});
  }

  status(): Observable<TelegramLinkStatus> {
    return this.http.get<TelegramLinkStatus>(`${environment.apiGatewayUrl}/api/v1/telegram-links/me`, {
      context: new HttpContext().set(BYPASS_HTTP_CACHE, true),
    });
  }
}
