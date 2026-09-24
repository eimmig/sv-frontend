import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { HttpCache } from './http-cache';
import { httpCacheInterceptor } from './http-cache-interceptor';

describe('httpCacheInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => httpCacheInterceptor(req, next));

  const get = (url: string, language = 'pt-BR') =>
    new HttpRequest('GET', url, { headers: new HttpHeaders({ 'Accept-Language': language }) });

  let cache: HttpCache;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    cache = TestBed.inject(HttpCache);
  });

  function fetch(req: HttpRequest<unknown>, next: HttpHandlerFn): unknown {
    let body: unknown;
    interceptor(req, next).subscribe((event) => {
      if (event instanceof HttpResponse) {
        body = event.body;
      }
    });
    return body;
  }

  it('answers a repeated GET from the cache without calling the backend again', () => {
    const next = vi.fn(() => of(new HttpResponse({ status: 200, body: { roi: 0.1 } })));

    fetch(get('/api/v1/statistics?from=2026-01-01'), next);
    const second = fetch(get('/api/v1/statistics?from=2026-01-01'), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ roi: 0.1 });
  });

  it('goes to the backend when the query params or the language differ', () => {
    const next = vi.fn(() => of(new HttpResponse({ status: 200, body: {} })));

    fetch(get('/api/v1/statistics?from=2026-01-01'), next);
    fetch(get('/api/v1/statistics?from=2026-02-01'), next);
    fetch(get('/api/v1/statistics?from=2026-01-01', 'es'), next);

    expect(next).toHaveBeenCalledTimes(3);
  });

  it('never caches a failed GET', () => {
    const next = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 500 })));

    interceptor(get('/api/v1/bets'), next).subscribe({ error: () => undefined });
    interceptor(get('/api/v1/bets'), next).subscribe({ error: () => undefined });

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('clears the cache before the caller sees a mutation response', () => {
    const readNext = vi.fn(() => of(new HttpResponse({ status: 200, body: ['old'] })));
    fetch(get('/api/v1/betting-houses'), readNext);

    let cachedWhenCallerNotified: unknown = 'not-called';
    interceptor(new HttpRequest('POST', '/api/v1/betting-houses', {}), () =>
      of(new HttpResponse({ status: 201 })),
    ).subscribe(() => {
      cachedWhenCallerNotified = cache.get('/api/v1/betting-houses|pt-BR');
    });

    expect(cachedWhenCallerNotified).toBeUndefined();
  });

  it('clears the cache when a mutation fails', () => {
    fetch(get('/api/v1/bets'), () => of(new HttpResponse({ status: 200, body: [] })));

    interceptor(new HttpRequest('DELETE', '/api/v1/bets/1'), () =>
      throwError(() => new HttpErrorResponse({ status: 409 })),
    ).subscribe({ error: () => undefined });

    expect(cache.get('/api/v1/bets|pt-BR')).toBeUndefined();
  });

  it('does not store a GET that was in flight while a mutation cleared the cache', () => {
    const inFlight = new Subject<HttpResponse<unknown>>();
    interceptor(get('/api/v1/bets'), () => inFlight).subscribe();

    interceptor(new HttpRequest('POST', '/api/v1/bets', {}), () => of(new HttpResponse({ status: 201 }))).subscribe();
    inFlight.next(new HttpResponse({ status: 200, body: ['stale'] }));
    inFlight.complete();

    expect(cache.get('/api/v1/bets|pt-BR')).toBeUndefined();
  });

  it('leaves requests outside /api/ untouched', () => {
    const next = vi.fn(() => of(new HttpResponse({ status: 200, body: {} })));

    fetch(get('/i18n/pt-BR.json'), next);
    fetch(get('/i18n/pt-BR.json'), next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
