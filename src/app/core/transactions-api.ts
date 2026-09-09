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

export interface CreateTransactionInput {
  readonly bettingHouseId: string;
  readonly type: TransactionType;
  readonly amount: number;
}

const PAGE_SIZE = 20;

/**
 * POST/GET /api/v1/transactions - only sends 'Authorization: Bearer' (authInterceptor),
 * the gateway injects X-User-Id/X-Tenant-Id from the token. No Idempotency-Key here
 * (unlike POST /bets) - the backend contract doesn't require one for transactions.
 */
@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private readonly http = inject(HttpClient);

  create(input: CreateTransactionInput): Observable<Transaction> {
    return this.http.post<Transaction>(`${environment.apiGatewayUrl}/api/v1/transactions`, input);
  }

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
