import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { History } from './history';
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
        stakeLabel: 'Valor apostado',
        oddLabel: 'Odd',
        statusLabel: 'Status',
        dateLabel: 'Data',
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
});
