import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

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
  readonly status: string;
}

const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/**
 * POST /api/v1/bets - only sends 'Authorization: Bearer' (authInterceptor),
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
}
