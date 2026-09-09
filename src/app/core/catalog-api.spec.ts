import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { catalogApi } from './catalog-api';
import { environment } from '../../environments/environment';

describe('catalogApi', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() GETs /api/v1/<resourcePath> and returns the page content', () => {
    const api = catalogApi(http, 'sports');

    api.list().subscribe((result) => expect(result).toEqual([{ id: '1', name: 'Futebol' }]));

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/sports`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('100');
    request.flush({ content: [{ id: '1', name: 'Futebol' }], page: 0, size: 100, totalElements: 1, totalPages: 1 });
  });

  it('create() POSTs /api/v1/<resourcePath> with the given name', () => {
    const api = catalogApi(http, 'leagues');

    api.create('Brasileirão').subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/leagues`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Brasileirão' });
    request.flush({ id: '1', name: 'Brasileirão' });
  });
});
