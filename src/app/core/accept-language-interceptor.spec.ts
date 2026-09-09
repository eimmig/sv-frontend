import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpInterceptorFn } from '@angular/common/http';
import { of } from 'rxjs';

import { acceptLanguageInterceptor } from './accept-language-interceptor';
import { ActiveLocale } from './active-locale';

describe('acceptLanguageInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => acceptLanguageInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  function capturedHeader(): string | null {
    const request = new HttpRequest('GET', '/api/v1/bets');
    let seenRequest: HttpRequest<unknown> | undefined;

    interceptor(request, (req) => {
      seenRequest = req;
      return of(new HttpResponse());
    }).subscribe();

    return seenRequest?.headers.get('Accept-Language') ?? null;
  }

  it('sets Accept-Language to the active locale', () => {
    expect(capturedHeader()).toBe('pt-BR');
  });

  it('reflects a locale change made before the request', () => {
    TestBed.inject(ActiveLocale).current.set('en-US');

    expect(capturedHeader()).toBe('en-US');
  });
});
