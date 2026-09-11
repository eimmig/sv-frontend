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
  /** wonCount/lostCount/voidCount/preCount/liveCount/avgOdd - stats-service epic-014, only
   *  consumed here from feat-014 (web) onward; byBetType/byLeague/byTipster stay out of scope
   *  (epic-019/epic-021 consume those). avgOdd is null when no settled bet has an odd yet. */
  readonly wonCount: number;
  readonly lostCount: number;
  readonly voidCount: number;
  readonly preCount: number;
  readonly liveCount: number;
  readonly avgOdd: number | null;
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

/** GET /api/v1/statistics/daily (stats-service epic-016) - sparse array, only days with at
 *  least 1 settled bet; the caller fills the missing days with zero (see pages/period-report). */
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

  /** feat-015 (web "Relatório do período") - real endpoint existed in stats-service since
   *  epic-016, never consumed by the frontend until now. Same 7 optional filters as get(). */
  getDaily(filter: StatisticsFilter): Observable<DailyBetMetrics[]> {
    return this.http.get<DailyBetMetrics[]>(`${environment.apiGatewayUrl}/api/v1/statistics/daily`, {
      params: toHttpParams(filter),
    });
  }
}
