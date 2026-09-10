import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { toHttpParams } from './http-params';
import { environment } from '../../environments/environment';

/** sportId/leagueId are required by the backend (400 RFC 7807 otherwise) - see docs/API-CONTRACTS.md. */
export interface StatisticsSearchFilter {
  readonly sportId: string;
  readonly leagueId: string;
  readonly teamId?: string;
  readonly bettingHouseId?: string;
  readonly marketId?: string;
  readonly tipsterId?: string;
  readonly from?: string;
  readonly to?: string;
}

export interface StatisticsSearchSummary {
  readonly betCount: number;
  readonly totalStaked: number;
  readonly netProfit: number;
  readonly roi: number;
  readonly winRate: number;
  readonly avgOdd: number;
  readonly maxDrawdown: number;
  readonly sharpeRatio: number | null;
}

export interface StatisticsTimelinePoint {
  readonly date: string;
  readonly cumulativeProfit: number;
}

export interface StatisticsSearchResult {
  readonly summary: StatisticsSearchSummary;
  readonly timeline: StatisticsTimelinePoint[];
}

export interface StatisticsTeam {
  readonly id: string;
  readonly name: string;
}

/**
 * GET /api/v1/statistics/search and GET /api/v1/statistics/teams - the
 * "Buscar Estatisticas" pre-bet decision screen (feat-012), distinct from
 * the dashboard bundle in statistics-api.ts. Both endpoints are separate
 * from the dashboard's GET /api/v1/statistics on purpose (see
 * docs/API-CONTRACTS.md): sport+league are mandatory here.
 */
@Injectable({ providedIn: 'root' })
export class StatisticsSearchApi {
  private readonly http = inject(HttpClient);

  search(filter: StatisticsSearchFilter): Observable<StatisticsSearchResult> {
    return this.http.get<StatisticsSearchResult>(`${environment.apiGatewayUrl}/api/v1/statistics/search`, {
      params: toHttpParams(filter),
    });
  }

  listTeams(sportId: string): Observable<StatisticsTeam[]> {
    return this.http.get<StatisticsTeam[]>(`${environment.apiGatewayUrl}/api/v1/statistics/teams`, {
      params: toHttpParams({ sportId }),
    });
  }
}
