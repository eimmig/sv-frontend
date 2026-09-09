import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TransactionsApi } from './transactions-api';
import { environment } from '../../environments/environment';

describe('TransactionsApi', () => {
  let api: TransactionsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TransactionsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() GETs /api/v1/transactions with page/size and only the non-empty filters', () => {
    const page = { content: [], page: 1, size: 20, totalElements: 0, totalPages: 1 };

    api.list({ bettingHouseId: 'bh-1', from: '2026-01-01', to: '' }, 1).subscribe((result) => expect(result).toEqual(page));

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/transactions`,
    );
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('bettingHouseId')).toBe('bh-1');
    expect(request.request.params.get('from')).toBe('2026-01-01');
    expect(request.request.params.has('to')).toBe(false);
    request.flush(page);
  });
});
