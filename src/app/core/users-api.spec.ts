import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UsersApi } from './users-api';
import { environment } from '../../environments/environment';

describe('UsersApi', () => {
  let api: UsersApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UsersApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() GETs /api/v1/users', () => {
    const users = [
      { id: '1', name: 'Ana', email: 'ana@acme', role: 'ADMIN', mustChangePassword: false, createdAt: '2026-01-01' },
    ];

    api.list().subscribe((result) => expect(result).toEqual(users));

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`);
    expect(request.request.method).toBe('GET');
    request.flush(users);
  });

  it('create() POSTs /api/v1/users with the given input', () => {
    const input = { name: 'Bob', email: 'bob@acme', password: 'secret' };

    api.create(input).subscribe();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ id: '2', ...input, role: 'MEMBER', mustChangePassword: false, createdAt: '2026-01-01' });
  });
});
