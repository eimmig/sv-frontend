import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { RegisterBet } from './register-bet';
import { environment } from '../../../environments/environment';

describe('RegisterBet', () => {
  let fixture: ComponentFixture<RegisterBet>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      dateMask: {
        placeholder: 'mm/dd/aaaa',
      },
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
        team1Label: 'Time 1',
        team1None: 'Nenhum',
        team2Label: 'Time 2',
        team2None: 'Nenhum',
        stakeLabel: 'Valor apostado',
        oddLabel: 'Odd',
        betDateLabel: 'Data do evento',
        betTimeLabel: 'Hora do evento',
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
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/teams`)
      .flush({
        content: [{ id: 'tm-1', name: 'Flamengo', sportId: 'sp-1' }],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      });
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
    // RegisterBet now injects Language (via DateMaskDirective on betDateOnly, feat-034) for the
    // first time in this file's lifecycle. Without this, Language.current() falls back to
    // browserLocale() - and this Vitest/jsdom environment's navigator.language is 'en-US', not
    // 'pt-BR' - so it would pick 'en-US', which isn't in this suite's `langs`/`availableLangs`
    // ('pt-BR' only), and every translate() call in the component (not just this directive's)
    // would silently resolve against an unregistered active lang instead of the langs mock below.
    localStorage.setItem('stakevault.language', 'pt-BR');
    await TestBed.configureTestingModule({
      imports: [
        RegisterBet,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
          preloadLangs: true,
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterBet);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushOptions();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads betting houses, the 4 catalogs and the team catalog into the dropdown options', () => {
    const options = fixture.componentInstance['options']();

    expect(options.bettingHouses).toHaveLength(1);
    expect(options.sports).toHaveLength(1);
    expect(options.leagues).toHaveLength(1);
    expect(options.markets).toHaveLength(1);
    expect(options.tipsters).toHaveLength(1);
    expect(options.teams).toHaveLength(1);
  });

  it('submits with the Idempotency-Key header, shows a success banner and resets the form', () => {
    fillRequiredFields();

    fixture.componentInstance['submit']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bets`);
    expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
    expect(request.request.body.bettingHouseId).toBe('bh-1');
    expect(request.request.body.betType).toBe('pre');
    request.flush({ id: '1', status: 'pending' });

    expect(fixture.componentInstance['successMessage']()).toBe('Aposta registrada com sucesso.');
    expect(fixture.componentInstance['form'].value.bettingHouseId).toBe('');
  });

  it('keeps team1/team2 disabled and empty until a sport is chosen, then only lists that sport\'s teams', () => {
    expect(fixture.componentInstance['form'].controls.team1Id.disabled).toBe(true);
    expect(fixture.componentInstance['form'].controls.team2Id.disabled).toBe(true);
    expect(fixture.componentInstance['teamOptions']()).toEqual([]);

    fixture.componentInstance['form'].controls.sportId.setValue('sp-1');

    expect(fixture.componentInstance['form'].controls.team1Id.disabled).toBe(false);
    expect(fixture.componentInstance['form'].controls.team2Id.disabled).toBe(false);
    expect(fixture.componentInstance['teamOptions']()).toEqual([{ id: 'tm-1', name: 'Flamengo', sportId: 'sp-1' }]);
  });

  it('clears the previously chosen teams and re-disables both selects when the sport changes away', () => {
    fixture.componentInstance['form'].controls.sportId.setValue('sp-1');
    fixture.componentInstance['form'].patchValue({ team1Id: 'tm-1' });

    fixture.componentInstance['form'].controls.sportId.setValue('');

    expect(fixture.componentInstance['form'].controls.team1Id.disabled).toBe(true);
    expect(fixture.componentInstance['form'].controls.team1Id.value).toBe('');
    expect(fixture.componentInstance['teamOptions']()).toEqual([]);
  });

  it('sends the selected team ids, not free text, when both teams are chosen', () => {
    fillRequiredFields();
    fixture.componentInstance['form'].patchValue({ team1Id: 'tm-1', team2Id: '' });

    fixture.componentInstance['submit']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bets`);
    expect(request.request.body.team1Id).toBe('tm-1');
    expect(request.request.body.team2Id).toBeNull();
    request.flush({ id: '1', status: 'pending' });
  });

  it('sends the chosen bet type (pre/live) instead of the previous free-text value', () => {
    fillRequiredFields();
    fixture.componentInstance['form'].patchValue({ betType: 'live' });

    fixture.componentInstance['submit']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bets`);
    expect(request.request.body.betType).toBe('live');
    request.flush({ id: '1', status: 'pending' });
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

  // feat-022.4: betDateOnly/betTimeOnly sao 2 FormControl independentes (nunca compartilham
  // valor) exatamente para evitar o merge assimetrico do proprio Angular Material entre
  // mat-datepicker e mat-timepicker (trocar a data zerar a hora pra meia-noite).
  it('changing the date does not reset the previously chosen time', () => {
    fixture.componentInstance['form'].controls.betTimeOnly.setValue(new Date(2026, 0, 1, 21, 30));

    fixture.componentInstance['form'].controls.betDateOnly.setValue(new Date(2026, 5, 15));

    const time = fixture.componentInstance['form'].controls.betTimeOnly.value;
    expect(time?.getHours()).toBe(21);
    expect(time?.getMinutes()).toBe(30);
  });

  it('changing the time does not affect the previously chosen date', () => {
    fixture.componentInstance['form'].controls.betDateOnly.setValue(new Date(2026, 5, 15));

    fixture.componentInstance['form'].controls.betTimeOnly.setValue(new Date(2026, 0, 1, 21, 30));

    const date = fixture.componentInstance['form'].controls.betDateOnly.value;
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(5);
    expect(date?.getDate()).toBe(15);
  });

  it('combines the date and time pickers into the final ISO sent to bets-service', () => {
    fillRequiredFields();
    fixture.componentInstance['form'].patchValue({
      betDateOnly: new Date(2026, 5, 15),
      betTimeOnly: new Date(2020, 0, 1, 21, 30),
    });

    fixture.componentInstance['submit']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bets`);
    const sentDate = new Date(request.request.body.betDate as string);
    expect(sentDate.getFullYear()).toBe(2026);
    expect(sentDate.getMonth()).toBe(5);
    expect(sentDate.getDate()).toBe(15);
    expect(sentDate.getHours()).toBe(21);
    expect(sentDate.getMinutes()).toBe(30);
    request.flush({ id: '1', status: 'pending' });
  });

  it('does not submit while the form is invalid', () => {
    expect(fixture.componentInstance['form'].invalid).toBe(true);

    fixture.componentInstance['submit']();

    httpMock.expectNone(`${environment.apiGatewayUrl}/api/v1/bets`);
  });
});
