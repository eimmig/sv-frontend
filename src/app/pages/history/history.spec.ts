import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { History } from './history';
import { Bet } from '../../core/bets-api';
import { environment } from '../../../environments/environment';

describe('History', () => {
  let fixture: ComponentFixture<History>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      history: {
        betsTitle: 'Apostas',
        transactionsTitle: 'Movimentações',
        bettingHouseLabel: 'Casa de apostas',
        sportLabel: 'Esporte',
        fromLabel: 'De',
        toLabel: 'Até',
        filterAll: 'Todas',
        filter: 'Filtrar',
        newTransactionTitle: 'Nova movimentação',
        create: 'Registrar',
        transactionSuccess: 'Movimentação registrada com sucesso.',
        stakeLabel: 'Valor apostado',
        oddLabel: 'Odd',
        statusLabel: 'Status',
        dateLabel: 'Data',
        actionsLabel: 'Ações',
        markWon: 'Ganha',
        markLost: 'Perdida',
        markVoid: 'Devolvida',
        typeLabel: 'Tipo',
        amountLabel: 'Valor',
        previousPage: 'Anterior',
        nextPage: 'Próxima',
        pageIndicator: 'Página {{page}} de {{totalPages}}',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
        status: { pending: 'Pendente', won: 'Ganha', lost: 'Perdida', void: 'Devolvida' },
        type: { deposit: 'Depósito', withdrawal: 'Saque' },
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
    for (const resource of ['sports', 'leagues', 'markets', 'tipsters'] as const) {
      httpMock
        .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/${resource}`)
        .flush({ content: [{ id: `${resource}-1`, name: resource }], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    }
  }

  function flushBets(content: unknown[] = [], page = 0, totalPages = 1) {
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/bets`)
      .flush({ content, page, size: 20, totalElements: content.length, totalPages });
  }

  function flushTransactions(content: unknown[] = [], page = 0, totalPages = 1) {
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/transactions`)
      .flush({ content, page, size: 20, totalElements: content.length, totalPages });
  }

  beforeEach(async () => {
    localStorage.removeItem('stakevault.language');
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    await TestBed.configureTestingModule({
      imports: [
        History,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(History);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushOptions();
    flushBets();
    flushTransactions();
  });

  afterEach(() => {
    httpMock.verify();
    delete (navigator as { language?: string }).language;
  });

  it('loads betting houses, catalogs, bets and transactions on init', () => {
    expect(fixture.componentInstance['options']().bettingHouses).toHaveLength(1);
  });

  it('resolves a betting house id to its name', () => {
    expect(fixture.componentInstance['nameOf'](fixture.componentInstance['options']().bettingHouses, 'bh-1')).toBe(
      'Bet365',
    );
    expect(fixture.componentInstance['nameOf'](fixture.componentInstance['options']().bettingHouses, null)).toBe('');
  });

  it('reloads bets at page 0 when a filter is applied', () => {
    fixture.componentInstance['betFilterForm'].patchValue({ bettingHouseId: 'bh-1' });
    fixture.componentInstance['applyBetFilter']();

    const request = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/bets`);
    expect(request.request.params.get('bettingHouseId')).toBe('bh-1');
    expect(request.request.params.get('page')).toBe('0');
    request.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('advances to the next page of bets and back', () => {
    fixture.componentInstance['betsNextPage']();
    const next = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/bets`);
    expect(next.request.params.get('page')).toBe('1');
    next.flush({ content: [], page: 1, size: 20, totalElements: 0, totalPages: 3 });

    fixture.componentInstance['betsPrevPage']();
    const prev = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/bets`);
    expect(prev.request.params.get('page')).toBe('0');
    prev.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 3 });
  });

  it('reloads transactions when a filter is applied', () => {
    fixture.componentInstance['transactionFilterForm'].patchValue({ bettingHouseId: 'bh-1' });
    fixture.componentInstance['applyTransactionFilter']();

    const request = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/transactions`);
    expect(request.request.params.get('bettingHouseId')).toBe('bh-1');
    request.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('advances to the next page of transactions and back', () => {
    fixture.componentInstance['transactionsNextPage']();
    const next = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/transactions`);
    expect(next.request.params.get('page')).toBe('1');
    next.flush({ content: [], page: 1, size: 20, totalElements: 0, totalPages: 3 });

    fixture.componentInstance['transactionsPrevPage']();
    const prev = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/transactions`);
    expect(prev.request.params.get('page')).toBe('0');
    prev.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 3 });
  });

  it('formats a date using the active language', () => {
    expect(fixture.componentInstance['formatDateTime']('2026-03-05T14:30:00.000Z')).toBeTruthy();
  });

  it('marks a pending bet as won and replaces it in place, without reloading the list', () => {
    const pendingBet: Bet = {
      id: '1',
      bettingHouseId: 'bh-1',
      sportId: 'sp-1',
      leagueId: 'lg-1',
      marketId: 'mk-1',
      tipsterId: null,
      ticketNumber: null,
      team1: null,
      team2: null,
      description: null,
      betType: null,
      playType: null,
      stake: 100,
      odd: 1.85,
      status: 'pending',
      betDate: '2026-03-01T18:00:00Z',
    };
    fixture.componentInstance['betsPage'].set({ content: [pendingBet], page: 0, size: 20, totalElements: 1, totalPages: 1 });

    fixture.componentInstance['markStatus'](pendingBet, 'won');

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/bets/1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'won' });
    request.flush({ ...pendingBet, status: 'won' });

    expect(fixture.componentInstance['betsPage']().content[0].status).toBe('won');
    expect(fixture.componentInstance['settlingBetId']()).toBeNull();
  });

  it('shows the RFC 7807 detail when the status transition is rejected', () => {
    const pendingBet: Bet = {
      id: '1',
      bettingHouseId: 'bh-1',
      sportId: 'sp-1',
      leagueId: 'lg-1',
      marketId: 'mk-1',
      tipsterId: null,
      ticketNumber: null,
      team1: null,
      team2: null,
      description: null,
      betType: null,
      playType: null,
      stake: 100,
      odd: 1.85,
      status: 'pending',
      betDate: '2026-03-01T18:00:00Z',
    };
    fixture.componentInstance['betsPage'].set({ content: [pendingBet], page: 0, size: 20, totalElements: 1, totalPages: 1 });

    fixture.componentInstance['markStatus'](pendingBet, 'won');

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/bets/1/status`)
      .flush({ detail: 'Transição de status inválida.' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(fixture.componentInstance['settleError']()).toBe('Transição de status inválida.');
  });

  it('creates a transaction, resets the form and reloads the current transactions page', () => {
    fixture.componentInstance['transactionsPage'].set({ content: [], page: 1, size: 20, totalElements: 21, totalPages: 2 });
    fixture.componentInstance['createTransactionForm'].setValue({
      bettingHouseId: 'bh-1',
      type: 'deposit',
      amount: 250,
    });

    fixture.componentInstance['createTransaction']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/transactions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ bettingHouseId: 'bh-1', type: 'deposit', amount: 250 });
    request.flush({ id: 't1', bettingHouseId: 'bh-1', type: 'deposit', amount: 250, createdAt: '2026-03-05T10:00:00Z' });

    expect(fixture.componentInstance['createTransactionForm'].value.amount).toBe(0);
    expect(fixture.componentInstance['createTransactionSuccess']()).toBe('Movimentação registrada com sucesso.');
    const reload = httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/transactions`);
    expect(reload.request.params.get('page')).toBe('1');
    reload.flush({ content: [], page: 1, size: 20, totalElements: 21, totalPages: 2 });
  });

  it('shows the backend detail when creating a transaction fails', () => {
    fixture.componentInstance['createTransactionForm'].setValue({ bettingHouseId: 'bh-1', type: 'withdrawal', amount: 50 });

    fixture.componentInstance['createTransaction']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/transactions`)
      .flush({ detail: 'Saldo insuficiente.' }, { status: 400, statusText: 'Bad Request' });

    expect(fixture.componentInstance['createTransactionError']()).toBe('Saldo insuficiente.');
    expect(fixture.componentInstance['creatingTransaction']()).toBe(false);
  });

  it('falls back to the generic error message when the backend response has no RFC 7807 detail', () => {
    fixture.componentInstance['createTransactionForm'].setValue({ bettingHouseId: 'bh-1', type: 'withdrawal', amount: 50 });

    fixture.componentInstance['createTransaction']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/transactions`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(fixture.componentInstance['createTransactionError']()).toBe(
      'Não foi possível completar a operação. Tente novamente.',
    );
  });
});
