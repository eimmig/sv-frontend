import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface BankrollBalance {
  readonly at: string;
  readonly balance: number;
}

/**
 * GET /api/v1/bankroll/balance - only sends 'Authorization: Bearer' (authInterceptor),
 * the gateway injects X-User-Id/X-Tenant-Id from the token. Sums all betting houses of
 * the tenant, no bettingHouseId filter (bets-service epic-013 - always aggregated).
 */
@Injectable({ providedIn: 'root' })
export class BankrollApi {
  private readonly http = inject(HttpClient);

  /** Omit 'at' for the current balance ("now"); pass a yyyy-MM-dd date for a point in time. */
  getBalance(at?: string): Observable<BankrollBalance> {
    return this.http.get<BankrollBalance>(`${environment.apiGatewayUrl}/api/v1/bankroll/balance`, {
      params: at ? new HttpParams().set('at', at) : undefined,
    });
  }
}
