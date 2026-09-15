import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TelegramLinkApi } from './telegram-link-api';
import { environment } from '../../environments/environment';

describe('TelegramLinkApi', () => {
  let api: TelegramLinkApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(TelegramLinkApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('create() POSTs /api/v1/telegram-links with an empty body', () => {
    api.create().subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/telegram-links`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ code: 'ABC23XYZ', expiresAt: '2026-09-15T12:15:00Z' });
  });
});
