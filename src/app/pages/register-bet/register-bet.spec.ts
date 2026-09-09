import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { RegisterBet } from './register-bet';
import { environment } from '../../../environments/environment';

describe('RegisterBet', () => {
  let fixture: ComponentFixture<RegisterBet>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      registerBet: {
        eventTitle: 'Evento',
        detailsTitle: 'Detalhes',
        valuesTitle: 'Valores',
        bettingHouseLabel: 'Casa de apostas',
        sportLabel: 'Esporte',
        leagueLabel: 'Liga',
        marketLabel: 'Mercado',
        tipsterLabel: 'Tipster',
        tipsterNone: 'Nenhum',
        stakeLabel: 'Valor apostado',
        oddLabel: 'Odd',
        betDateLabel: 'Data da aposta',
        reset: 'Limpar',
        submit: 'Registrar aposta',
        success: 'Aposta registrada com sucesso.',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function flushOptions() {
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/betting-houses`)
      .flush({
        content: [{ id: 'bh-1', name: 'Bet365', initialBalance: 0, balance: 0, createdAt: '2026-01-01' }],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      });
    for (const [resource, id, name] of [
      ['sports', 'sp-1', 'Futebol'],
      ['leagues', 'lg-1', 'Brasileirão'],
      ['markets', 'mk-1', 'Handicap'],
      ['tipsters', 'tp-1', 'Ana'],
    ] as const) {
      httpMock
        .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/${resource}`)
        .flush({ content: [{ id, name }], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    }
  }

  function fillRequiredFields() {
    fixture.componentInstance['form'].patchValue({
      bettingHouseId: 'bh-1',
      sportId: 'sp-1',
      leagueId: 'lg-1',
      marketId: 'mk-1',
      stake: 100,
      odd: 1.5,
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterBet,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterBet);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushOptions();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads betting houses and the 4 catalogs into the dropdown options', () => {
    const options = fixture.componentInstance['options']();

    expect(options.bettingHouses).toHaveLength(1);
    expect(options.sports).toHaveLength(1);
    expect(options.leagues).toHaveLength(1);
    expect(options.markets).toHaveLength(1);
    expect(options.tipsters).toHaveLength(1);
  });

  it('submits with the Idempotency-Key header, shows a success banner and resets the form', () => {
    fillRequiredFields();

    fixture.componentInstance['submit']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bets`);
    expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
    expect(request.request.body.bettingHouseId).toBe('bh-1');
    request.flush({ id: '1', status: 'pending' });

    expect(fixture.componentInstance['successMessage']()).toBe('Aposta registrada com sucesso.');
    expect(fixture.componentInstance['form'].value.bettingHouseId).toBe('');
  });

  it('shows the RFC 7807 detail on a validation error (e.g. invalid odd)', () => {
    fillRequiredFields();

    fixture.componentInstance['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/bets`)
      .flush(
        { detail: 'A odd informada deve ser estritamente maior que 1,00 (RN07).' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

    expect(fixture.componentInstance['formError']()).toBe('A odd informada deve ser estritamente maior que 1,00 (RN07).');
  });

  it('does not submit while the form is invalid', () => {
    fixture.componentInstance['submit']();

    httpMock.expectNone(`${environment.apiGatewayUrl}/api/v1/bets`);
  });
});
