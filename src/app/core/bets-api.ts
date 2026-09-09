import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PagedResponse } from './paged-response';
import { environment } from '../../environments/environment';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

export interface CreateBetInput {
  readonly bettingHouseId: string;
  readonly sportId: string;
  readonly leagueId: string;
  readonly marketId: string;
  readonly tipsterId: string | null;
  readonly ticketNumber: string | null;
  readonly team1: string | null;
  readonly team2: string | null;
  readonly description: string | null;
  readonly betType: string | null;
  readonly playType: string | null;
  readonly stake: number;
  readonly odd: number;
  readonly betDate: string;
}

export interface Bet {
  readonly id: string;
  readonly bettingHouseId: string;
  readonly sportId: string;
  readonly leagueId: string;
  readonly marketId: string;
  readonly tipsterId: string | null;
  readonly ticketNumber: string | null;
  readonly team1: string | null;
  readonly team2: string | null;
  readonly description: string | null;
  readonly betType: string | null;
  readonly playType: string | null;
  readonly stake: number;
  readonly odd: number;
  readonly status: BetStatus;
  readonly betDate: string;
}

export interface BetFilter {
  readonly bettingHouseId?: string;
  readonly sportId?: string;
  readonly leagueId?: string;
  readonly marketId?: string;
  readonly tipsterId?: string;
  readonly from?: string;
  readonly to?: string;
}

const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
const PAGE_SIZE = 20;

function filterParams(filter: BetFilter, page: number): HttpParams {
  let params = new HttpParams().set('page', page).set('size', PAGE_SIZE);
  for (const [key, value] of Object.entries(filter) as [string, string | undefined][]) {
    if (value) {
      params = params.set(key, value);
    }
  }
  return params;
}

/**
 * POST/GET /api/v1/bets - only sends 'Authorization: Bearer' (authInterceptor),
 * the gateway injects X-User-Id/X-Tenant-Id from the token. Idempotency-Key
 * is caller-supplied (see docs/API-CONTRACTS.md) - protects against a
 * duplicate submission on network retry or a double click.
 */
@Injectable({ providedIn: 'root' })
export class BetsApi {
  private readonly http = inject(HttpClient);

  create(input: CreateBetInput, idempotencyKey: string): Observable<Bet> {
    return this.http.post<Bet>(`${environment.apiGatewayUrl}/api/v1/bets`, input, {
      headers: new HttpHeaders({ [IDEMPOTENCY_KEY_HEADER]: idempotencyKey }),
    });
  }

  list(filter: BetFilter, page: number): Observable<PagedResponse<Bet>> {
    return this.http.get<PagedResponse<Bet>>(`${environment.apiGatewayUrl}/api/v1/bets`, {
      params: filterParams(filter, page),
    });
  }

  /** Only pending -> won|lost|void is a valid transition (RN06) - the backend rejects anything else with 422. */
  updateStatus(id: string, status: 'won' | 'lost' | 'void'): Observable<Bet> {
    return this.http.patch<Bet>(`${environment.apiGatewayUrl}/api/v1/bets/${id}/status`, { status });
  }
}
