import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { toHttpParams } from './http-params';
import { environment } from '../../environments/environment';

export interface StatisticsSearchFilter {
  readonly sportId: string;
  readonly leagueId: string;
  readonly teamId?: string;
  readonly bettingHouseId?: string;
  readonly marketId?: string;
  readonly tipsterId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly betType?: 'pre' | 'live';
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
