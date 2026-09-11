import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SettingsApi } from './settings-api';
import { environment } from '../../environments/environment';

describe('SettingsApi', () => {
  let api: SettingsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(SettingsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('get() GETs /api/v1/settings', () => {
    api.get().subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/settings`);
    expect(request.request.method).toBe('GET');
    request.flush({ unitPercent: 0.01 });
  });

  it('update() PATCHes /api/v1/settings with the given unitPercent', () => {
    api.update(0.02).subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/settings`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ unitPercent: 0.02 });
    request.flush({ unitPercent: 0.02 });
  });
});
