import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BankrollApi } from './bankroll-api';
import { environment } from '../../environments/environment';

describe('BankrollApi', () => {
  let api: BankrollApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(BankrollApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getBalance() GETs /api/v1/bankroll/balance without params when at is omitted', () => {
    api.getBalance().subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bankroll/balance`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toHaveLength(0);
    request.flush({ at: '2026-09-11', balance: 4820.5 });
  });

  it('getBalance(at) sends the at query param for a point-in-time balance', () => {
    api.getBalance('2026-09-01').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/bankroll/balance`,
    );
    expect(request.request.params.get('at')).toBe('2026-09-01');
    request.flush({ at: '2026-09-01', balance: 4000 });
  });
});
