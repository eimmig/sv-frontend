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
  /** avgOdd is null when no settled bet has an odd yet. */
  readonly wonCount: number;
  readonly lostCount: number;
  readonly voidCount: number;
  readonly preCount: number;
  readonly liveCount: number;
  readonly avgOdd: number | null;
}

/** Shared zero-value default, used by any page/signal whose data hasn't loaded yet. */
export const EMPTY_BET_METRICS: BetMetrics = {
  totalStaked: 0,
  netProfit: 0,
  roi: 0,
  winRate: 0,
  settledCount: 0,
  wonCount: 0,
  lostCount: 0,
  voidCount: 0,
  preCount: 0,
  liveCount: 0,
  avgOdd: null,
};

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
  readonly byLeague: SegmentedBetMetrics[];
  readonly byTipster: SegmentedBetMetrics[];
  /** Fixed 2-item segment (dimensionId PRE/LIVE only, never a 3rd bucket) - apostas sem betType
   *  não entram em nenhum dos 2 (docs/API-CONTRACTS.md). */
  readonly byBetType: SegmentedBetMetrics[];
  readonly monthly: MonthlyBetMetrics[];
}

/** Shared zero-value default, used before the first GET /api/v1/statistics response arrives. */
export const EMPTY_STATISTICS_DASHBOARD: StatisticsDashboard = {
  overall: EMPTY_BET_METRICS,
  bySport: [],
  byMarket: [],
  byBettingHouse: [],
  byLeague: [],
  byTipster: [],
  byBetType: [],
  monthly: [],
};

export interface StatisticsFilter {
  readonly bettingHouseId?: string;
  readonly sportId?: string;
  readonly leagueId?: string;
  readonly marketId?: string;
  readonly tipsterId?: string;
  readonly from?: string;
  readonly to?: string;
}

/** GET /api/v1/statistics/daily - sparse array, only days with at least 1 settled bet; the
 *  caller fills the missing days with zero. */
export interface DailyBetMetrics {
  readonly date: string;
  readonly totalStaked: number;
  readonly netProfit: number;
  readonly roi: number;
  readonly betCount: number;
}

/**
 * GET /api/v1/statistics(/daily) - only sends 'Authorization: Bearer' (authInterceptor),
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

  /** Same 7 optional filters as get(). */
  getDaily(filter: StatisticsFilter): Observable<DailyBetMetrics[]> {
    return this.http.get<DailyBetMetrics[]>(`${environment.apiGatewayUrl}/api/v1/statistics/daily`, {
      params: toHttpParams(filter),
    });
  }
}
