import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpInterceptorFn } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { acceptLanguageInterceptor } from './accept-language-interceptor';
import { Language } from './language';

describe('acceptLanguageInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => acceptLanguageInterceptor(req, next));

  beforeEach(() => {
    localStorage.removeItem('stakevault.language');
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': {}, 'en-US': {}, es: {} },
          translocoConfig: { availableLangs: ['pt-BR', 'en-US', 'es'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  afterEach(() => {
    delete (navigator as { language?: string }).language;
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
    TestBed.inject(Language).set('en-US');

    expect(capturedHeader()).toBe('en-US');
  });
});
