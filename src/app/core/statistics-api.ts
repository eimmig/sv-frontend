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
  readonly wonCount: number;
  readonly lostCount: number;
  readonly voidCount: number;
  readonly preCount: number;
  readonly liveCount: number;
  readonly avgOdd: number | null;
}

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
  readonly byTeam: SegmentedBetMetrics[];
  readonly byBetType: SegmentedBetMetrics[];
  readonly monthly: MonthlyBetMetrics[];
}

export const EMPTY_STATISTICS_DASHBOARD: StatisticsDashboard = {
  overall: EMPTY_BET_METRICS,
  bySport: [],
  byMarket: [],
  byBettingHouse: [],
  byLeague: [],
  byTipster: [],
  byTeam: [],
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

export interface DailyBetMetrics {
  readonly date: string;
  readonly totalStaked: number;
  readonly netProfit: number;
  readonly roi: number;
  readonly betCount: number;
}

@Injectable({ providedIn: 'root' })
export class StatisticsApi {
  private readonly http = inject(HttpClient);

  get(filter: StatisticsFilter): Observable<StatisticsDashboard> {
    return this.http.get<StatisticsDashboard>(`${environment.apiGatewayUrl}/api/v1/statistics`, {
      params: toHttpParams(filter),
    });
  }

  getDaily(filter: StatisticsFilter): Observable<DailyBetMetrics[]> {
    return this.http.get<DailyBetMetrics[]>(`${environment.apiGatewayUrl}/api/v1/statistics/daily`, {
      params: toHttpParams(filter),
    });
  }
}
