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
});
