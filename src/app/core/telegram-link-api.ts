import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface TelegramLink {
  readonly code: string;
  readonly expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class TelegramLinkApi {
  private readonly http = inject(HttpClient);

  create(): Observable<TelegramLink> {
    return this.http.post<TelegramLink>(`${environment.apiGatewayUrl}/api/v1/telegram-links`, {});
  }
}
