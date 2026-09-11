import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { StatisticsApi } from './statistics-api';
import { environment } from '../../environments/environment';

describe('StatisticsApi', () => {
  let api: StatisticsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(StatisticsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the dashboard bundle without filter params when none are set', () => {
    api.get({}).subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/statistics`);
    expect(request.request.params.keys()).toHaveLength(0);
    request.flush({ overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0 }, bySport: [], byMarket: [], byBettingHouse: [], monthly: [] });
  });

  it('sends only the filter params that are set', () => {
    api.get({ bettingHouseId: 'bh-1', from: '2026-01-01' }).subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics`,
    );
    expect(request.request.params.get('bettingHouseId')).toBe('bh-1');
    expect(request.request.params.get('from')).toBe('2026-01-01');
    expect(request.request.params.has('sportId')).toBe(false);
    request.flush({ overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0 }, bySport: [], byMarket: [], byBettingHouse: [], monthly: [] });
  });

  // feat-014: wonCount/lostCount/voidCount/preCount/liveCount/avgOdd (stats-service epic-014)
  // flow through the response unchanged - the extended BetMetrics fields are consumed by the
  // dashboard's new cards (feat-014.3), not transformed here.
  it('passes through the extended BetMetrics fields (wonCount/lostCount/voidCount/preCount/liveCount/avgOdd)', () => {
    let result: unknown;
    api.get({}).subscribe((dashboard) => (result = dashboard.overall));

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/statistics`);
    request.flush({
      overall: {
        totalStaked: 100,
        netProfit: 50,
        roi: 0.5,
        winRate: 1,
        settledCount: 1,
        wonCount: 1,
        lostCount: 0,
        voidCount: 0,
        preCount: 1,
        liveCount: 0,
        avgOdd: 1.9,
      },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      monthly: [],
    });

    expect(result).toEqual({
      totalStaked: 100,
      netProfit: 50,
      roi: 0.5,
      winRate: 1,
      settledCount: 1,
      wonCount: 1,
      lostCount: 0,
      voidCount: 0,
      preCount: 1,
      liveCount: 0,
      avgOdd: 1.9,
    });
  });

  // feat-015 ("Relatório do período"): real endpoint since stats-service epic-016, never
  // consumed by the frontend until now.
  it('getDaily() GETs /api/v1/statistics/daily with the same filter params as get()', () => {
    let result: unknown;
    api.getDaily({ from: '2026-01-01', to: '2026-01-31' }).subscribe((daily) => (result = daily));

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/daily`,
    );
    expect(request.request.params.get('from')).toBe('2026-01-01');
    expect(request.request.params.get('to')).toBe('2026-01-31');
    const sparseDays = [{ date: '2026-01-03', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 2 }];
    request.flush(sparseDays);

    expect(result).toEqual(sparseDays);
  });
});
