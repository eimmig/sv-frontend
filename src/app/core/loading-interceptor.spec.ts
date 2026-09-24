import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Loading } from './loading';
import { loadingInterceptor } from './loading-interceptor';

describe('loadingInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => loadingInterceptor(req, next));

  let loading: Loading;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    loading = TestBed.inject(Loading);
    vi.spyOn(loading, 'begin');
    vi.spyOn(loading, 'end');
  });

  it('tracks a backend request from start until it completes', () => {
    const response = new Subject<HttpResponse<unknown>>();

    interceptor(new HttpRequest('GET', '/api/v1/bets'), () => response).subscribe();
    expect(loading.begin).toHaveBeenCalledTimes(1);
    expect(loading.end).not.toHaveBeenCalled();

    response.next(new HttpResponse());
    response.complete();
    expect(loading.end).toHaveBeenCalledTimes(1);
  });

  it('ends tracking when the backend request fails', () => {
    interceptor(new HttpRequest('GET', '/api/v1/bets'), () =>
      throwError(() => new HttpErrorResponse({ status: 500 })),
    ).subscribe({ error: () => undefined });

    expect(loading.begin).toHaveBeenCalledTimes(1);
    expect(loading.end).toHaveBeenCalledTimes(1);
  });

  it('ends tracking when the caller unsubscribes before the response arrives', () => {
    const subscription = interceptor(new HttpRequest('GET', '/api/v1/bets'), () => new Subject()).subscribe();

    subscription.unsubscribe();

    expect(loading.end).toHaveBeenCalledTimes(1);
  });

  it('ignores translation file requests so the login screen opens without the overlay', () => {
    interceptor(new HttpRequest('GET', '/i18n/pt-BR.json'), () => of(new HttpResponse())).subscribe();

    expect(loading.begin).not.toHaveBeenCalled();
    expect(loading.end).not.toHaveBeenCalled();
  });
});
