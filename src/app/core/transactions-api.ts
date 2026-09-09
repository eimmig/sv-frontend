import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PagedResponse } from './paged-response';
import { environment } from '../../environments/environment';

export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  readonly id: string;
  readonly bettingHouseId: string;
  readonly type: TransactionType;
  readonly amount: number;
  readonly createdAt: string;
}

export interface TransactionFilter {
  readonly bettingHouseId?: string;
  readonly from?: string;
  readonly to?: string;
}

const PAGE_SIZE = 20;

/**
 * GET /api/v1/transactions - only sends 'Authorization: Bearer' (authInterceptor),
 * the gateway injects X-User-Id/X-Tenant-Id from the token. Read-only from
 * apps/web for now - creating deposits/withdrawals is feat-010 (RF13 UI).
 */
@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private readonly http = inject(HttpClient);

  list(filter: TransactionFilter, page: number): Observable<PagedResponse<Transaction>> {
    let params = new HttpParams().set('page', page).set('size', PAGE_SIZE);
    if (filter.bettingHouseId) {
      params = params.set('bettingHouseId', filter.bettingHouseId);
    }
    if (filter.from) {
      params = params.set('from', filter.from);
    }
    if (filter.to) {
      params = params.set('to', filter.to);
    }
    return this.http.get<PagedResponse<Transaction>>(`${environment.apiGatewayUrl}/api/v1/transactions`, {
      params,
    });
  }
}
