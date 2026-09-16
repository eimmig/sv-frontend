import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TelegramLinkPage } from './telegram-link';
import { environment } from '../../../environments/environment';

describe('TelegramLinkPage', () => {
  let fixture: ComponentFixture<TelegramLinkPage>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      telegramLink: {
        title: 'Vincular conta do Telegram',
        intro: 'Gere um código de curta duração e envie-o para o bot do Telegram para vincular sua conta e registrar apostas por lá.',
        generate: 'Gerar código',
        regenerate: 'Gerar novo código',
        codeLabel: 'Código de vínculo',
        expiresAtLabel: 'Expira em {{expiresAt}}',
        genericError: 'Não foi possível gerar o código. Tente novamente.',
      },
    },
  };

  function createComponent() {
    fixture = TestBed.createComponent(TelegramLinkPage);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.removeItem('stakevault.language');
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    await TestBed.configureTestingModule({
      imports: [
        TelegramLinkPage,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    httpMock.verify();
    delete (navigator as { language?: string }).language;
  });

  it('does not call the API until the user clicks generate', () => {
    createComponent();
    expect(fixture.componentInstance['link']()).toBeNull();
    httpMock.expectNone(`${environment.apiGatewayUrl}/api/v1/telegram-links`);
  });

  it('generates a code and shows it with its expiration', () => {
    createComponent();

    fixture.componentInstance['generate']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/telegram-links`);
    expect(request.request.method).toBe('POST');
    request.flush({ code: 'ABC23XYZ', expiresAt: '2026-09-15T12:15:00Z' });
    fixture.detectChanges();

    const code: HTMLElement = fixture.nativeElement.querySelector('[data-testid="telegram-link-code"]');
    expect(code.textContent).toBe('ABC23XYZ');
    const expires: HTMLElement = fixture.nativeElement.querySelector('[data-testid="telegram-link-expires"]');
    expect(expires.textContent).toContain('Expira em');
  });

  it('shows the RFC 7807 detail when generation fails', () => {
    createComponent();

    fixture.componentInstance['generate']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/telegram-links`)
      .flush({ detail: 'Muitas tentativas. Aguarde antes de gerar um novo código.' }, { status: 429, statusText: 'Too Many Requests' });

    expect(fixture.componentInstance['formError']()).toBe('Muitas tentativas. Aguarde antes de gerar um novo código.');
  });

  it('ignores a second click while a request is in flight', () => {
    createComponent();

    fixture.componentInstance['generate']();
    fixture.componentInstance['generate']();

    expect(fixture.componentInstance['submitting']()).toBe(true);
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/telegram-links`);
  });
});
