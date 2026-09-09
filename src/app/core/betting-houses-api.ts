import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PagedResponse } from './paged-response';
import { environment } from '../../environments/environment';

export interface BettingHouse {
  readonly id: string;
  readonly name: string;
  readonly initialBalance: number;
  readonly balance: number;
  readonly createdAt: string;
}

export interface CreateBettingHouseInput {
  readonly name: string;
  readonly initialBalance: number;
}

const MAX_PAGE_SIZE = 100;

/**
 * GET/POST /api/v1/betting-houses - only sends 'Authorization: Bearer' (authInterceptor),
 * the gateway injects X-User-Id/X-Tenant-Id from the token.
 */
@Injectable({ providedIn: 'root' })
export class BettingHousesApi {
  private readonly http = inject(HttpClient);

  list(): Observable<PagedResponse<BettingHouse>> {
    return this.http.get<PagedResponse<BettingHouse>>(`${environment.apiGatewayUrl}/api/v1/betting-houses`, {
      params: new HttpParams().set('page', 0).set('size', MAX_PAGE_SIZE),
    });
  }

  create(input: CreateBettingHouseInput): Observable<BettingHouse> {
    return this.http.post<BettingHouse>(`${environment.apiGatewayUrl}/api/v1/betting-houses`, input);
  }
}
