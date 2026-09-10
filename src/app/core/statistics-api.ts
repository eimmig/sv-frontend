import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { toHttpParams } from './http-params';
import { environment } from '../../environments/environment';

export interface BetMetrics {
  readonly totalStaked: number;
  readonly netProfit: number;
  readonly roi: number;
  readonly winRate: number;
  readonly settledCount: number;
}

export interface SegmentedBetMetrics {
  readonly dimensionId: string;
  readonly dimensionName: string;
  readonly metrics: BetMetrics;
}

export interface MonthlyBetMetrics {
  readonly year: number;
  readonly month: number;
  readonly metrics: BetMetrics;
}

export interface StatisticsDashboard {
  readonly overall: BetMetrics;
  readonly bySport: SegmentedBetMetrics[];
  readonly byMarket: SegmentedBetMetrics[];
  readonly byBettingHouse: SegmentedBetMetrics[];
  readonly monthly: MonthlyBetMetrics[];
}

export interface StatisticsFilter {
  readonly bettingHouseId?: string;
  readonly sportId?: string;
  readonly leagueId?: string;
  readonly marketId?: string;
  readonly tipsterId?: string;
  readonly from?: string;
  readonly to?: string;
}

/**
 * GET /api/v1/statistics - only sends 'Authorization: Bearer' (authInterceptor),
 * the gateway injects X-User-Id/X-Tenant-Id from the token. Every filter change
 * is a new request (RN08 - metrics are recalculated server-side, not filtered
 * client-side over already-loaded data).
 */
@Injectable({ providedIn: 'root' })
export class StatisticsApi {
  private readonly http = inject(HttpClient);

  get(filter: StatisticsFilter): Observable<StatisticsDashboard> {
    return this.http.get<StatisticsDashboard>(`${environment.apiGatewayUrl}/api/v1/statistics`, {
      params: toHttpParams(filter),
    });
  }
}
