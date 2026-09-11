import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BetsApi, CreateBetInput } from './bets-api';
import { environment } from '../../environments/environment';

describe('BetsApi', () => {
  let api: BetsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BetsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create() POSTs /api/v1/bets with the given input and the Idempotency-Key header', () => {
    const input: CreateBetInput = {
      bettingHouseId: 'bh-1',
      sportId: 'sp-1',
      leagueId: 'lg-1',
      marketId: 'mk-1',
      tipsterId: null,
      ticketNumber: null,
      team1: null,
      team2: null,
      description: null,
      betType: null,
      playType: null,
      stake: 100,
      odd: 1.5,
      betDate: '2026-01-01T00:00:00.000Z',
    };

    api.create(input, 'idem-key-1').subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bets`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    expect(request.request.headers.get('Idempotency-Key')).toBe('idem-key-1');
    request.flush({ id: '1', status: 'pending' });
  });

  it('list() GETs /api/v1/bets with page/size and only the non-empty filters', () => {
    const page = { content: [], page: 2, size: 20, totalElements: 0, totalPages: 3 };

    api
      .list({ bettingHouseId: 'bh-1', sportId: undefined, leagueId: '', marketId: undefined, tipsterId: undefined }, 2)
      .subscribe((result) => expect(result).toEqual(page));

    const request = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/bets`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('bettingHouseId')).toBe('bh-1');
    expect(request.request.params.has('sportId')).toBe(false);
    expect(request.request.params.has('leagueId')).toBe(false);
    request.flush(page);
  });
});
