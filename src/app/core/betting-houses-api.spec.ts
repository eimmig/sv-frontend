import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BettingHousesApi } from './betting-houses-api';
import { environment } from '../../environments/environment';

describe('BettingHousesApi', () => {
  let api: BettingHousesApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BettingHousesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() GETs /api/v1/betting-houses with page=0 and the max page size', () => {
    const page = { content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 };

    api.list().subscribe((result) => expect(result).toEqual(page));

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/betting-houses`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('100');
    request.flush(page);
  });

  it('create() POSTs /api/v1/betting-houses with the given input', () => {
    const input = { name: 'Bet365', initialBalance: 100 };

    api.create(input).subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/betting-houses`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ id: '1', ...input, balance: 100, createdAt: '2026-01-01' });
  });
});
