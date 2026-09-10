import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { StatisticsSearchApi } from './statistics-search-api';
import { environment } from '../../environments/environment';

describe('StatisticsSearchApi', () => {
  let api: StatisticsSearchApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(StatisticsSearchApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends sportId/leagueId and omits unset optional filters', () => {
    api.search({ sportId: 'sp-1', leagueId: 'lg-1' }).subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/search`,
    );
    expect(request.request.params.get('sportId')).toBe('sp-1');
    expect(request.request.params.get('leagueId')).toBe('lg-1');
    expect(request.request.params.has('teamId')).toBe(false);
    request.flush({
      summary: { betCount: 0, totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, avgOdd: 0, maxDrawdown: 0, sharpeRatio: null },
      timeline: [],
    });
  });

  it('sends optional filters when set', () => {
    api.search({ sportId: 'sp-1', leagueId: 'lg-1', teamId: 'tm-1', from: '2026-01-01' }).subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/search`,
    );
    expect(request.request.params.get('teamId')).toBe('tm-1');
    expect(request.request.params.get('from')).toBe('2026-01-01');
    request.flush({
      summary: { betCount: 0, totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, avgOdd: 0, maxDrawdown: 0, sharpeRatio: null },
      timeline: [],
    });
  });

  it('lists teams scoped by sportId', () => {
    api.listTeams('sp-1').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams`,
    );
    expect(request.request.params.get('sportId')).toBe('sp-1');
    request.flush([{ id: 'tm-1', name: 'Flamengo' }]);
  });
});
