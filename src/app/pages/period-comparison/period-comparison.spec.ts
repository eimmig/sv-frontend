import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { PeriodComparison } from './period-comparison';
import { environment } from '../../../environments/environment';

const BANKROLL_URL = `${environment.apiGatewayUrl}/api/v1/bankroll/balance`;
const SETTINGS_URL = `${environment.apiGatewayUrl}/api/v1/settings`;
const STATISTICS_URL = `${environment.apiGatewayUrl}/api/v1/statistics`;
const DAILY_URL = `${environment.apiGatewayUrl}/api/v1/statistics/daily`;

const EMPTY_DASHBOARD = {
  overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0, wonCount: 0, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: null },
  bySport: [],
  byMarket: [],
  byBettingHouse: [],
  byLeague: [],
  byTipster: [],
  byBetType: [],
  monthly: [],
};

describe('PeriodComparison', () => {
  let fixture: ComponentFixture<PeriodComparison>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      periodPresetFilter: {
        label: 'Período',
        presetToday: 'Hoje',
        presetLastWeek: 'Última semana',
        presetLast15Days: 'Últimos 15 dias',
        presetLastMonth: 'Último mês',
        presetThisMonth: 'Este mês',
        presetCustom: 'Personalizado',
        fromLabel: 'De',
        toLabel: 'Até',
      },
      periodComparison: {
        filtersTitle: 'Filtros',
        periodALabel: 'Período A',
        periodBLabel: 'Período B',
        bettingHouseLabel: 'Casa de apostas',
        sportLabel: 'Esporte',
        leagueLabel: 'Liga',
        marketLabel: 'Mercado',
        tipsterLabel: 'Tipster',
        filterAll: 'Todas',
        applyFilter: 'Aplicar filtro',
        resultsTitle: 'Comparativo',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function flushOptions(): void {
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/betting-houses`)
      .flush({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 1 });
    for (const resource of ['sports', 'leagues', 'markets', 'tipsters'] as const) {
      httpMock
        .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/${resource}`)
        .flush({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 1 });
    }
  }

  /**
   * Drains every pending comparison request (statistics/daily/bankroll/settings) in whatever
   * batches they arrive - shared/period-preset-filter's 2 instances (Período A/B) each emit their
   * own default on construction, so applyFilter() can run more than once before the view settles
   * (same redundant-initial-load tradeoff already accepted elsewhere in this app for a single
   * filter). Every statistics/daily request's from/to is asserted non-empty here - the regression
   * this subtask fixes (achado MAJOR do plan review) is exactly an empty/undefined period slipping
   * through on the very first request.
   */
  function drainComparisonRequests(balance = 1000, unitPercent = 0.01): void {
    let pending: TestRequest[];
    while ((pending = httpMock.match((req) => [STATISTICS_URL, DAILY_URL, BANKROLL_URL, SETTINGS_URL].includes(req.url))).length > 0) {
      for (const request of pending) {
        if (request.request.url === STATISTICS_URL) {
          expect(request.request.params.get('from')).toBeTruthy();
          expect(request.request.params.get('to')).toBeTruthy();
          request.flush(EMPTY_DASHBOARD);
        } else if (request.request.url === DAILY_URL) {
          expect(request.request.params.get('from')).toBeTruthy();
          expect(request.request.params.get('to')).toBeTruthy();
          request.flush([]);
        } else if (request.request.url === BANKROLL_URL) {
          request.flush({ at: request.request.params.get('at') ?? 'now', balance });
        } else {
          request.flush({ unitPercent });
        }
      }
    }
  }

  function createComponent(): void {
    fixture = TestBed.createComponent(PeriodComparison);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    // Both period-preset-filter defaults ("Hoje") resolve from a real `new Date()` - freeze the
    // clock so assertions on the emitted from/to don't depend on which day the suite runs on.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-22T12:00:00Z'));
    await TestBed.configureTestingModule({
      imports: [
        PeriodComparison,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('seeds both periods already resolved to "Hoje" - no request is ever sent with an empty from/to', () => {
    createComponent();
    flushOptions();
    drainComparisonRequests();
    fixture.detectChanges();

    expect(fixture.componentInstance['periodA']()).toEqual({ from: '2026-09-22', to: '2026-09-22' });
    expect(fixture.componentInstance['periodB']()).toEqual({ from: '2026-09-22', to: '2026-09-22' });
    expect(fixture.nativeElement.querySelector('[data-testid="period-comparison-results-error"]')).toBeNull();
  });

  it('changing period A alone re-fetches with the new range for A while period B stays put', () => {
    createComponent();
    flushOptions();
    drainComparisonRequests();
    fixture.detectChanges();

    fixture.componentInstance['onPeriodAChange']({ from: '2026-01-01', to: '2026-01-31' });

    const requests = httpMock.match((req) => req.url === STATISTICS_URL);
    expect(requests.length).toBeGreaterThan(0);
    const froms = requests.map((request) => request.request.params.get('from'));
    expect(froms).toContain('2026-01-01');
    expect(froms).toContain('2026-09-22'); // period B, untouched
    for (const request of requests) {
      request.flush(EMPTY_DASHBOARD);
    }
    drainComparisonRequests();
  });

  it('applying a common filter (sportId) sends it on both periods', () => {
    createComponent();
    flushOptions();
    drainComparisonRequests();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].patchValue({ sportId: 'sport-1' });
    fixture.componentInstance['applyFilter']();

    // 2 real HTTP requests (one per period side) - both periods happen to be "Hoje" at this
    // point, but each side still fires its own GET, never deduplicated by HttpClient.
    const requests = httpMock.match((req) => req.url === STATISTICS_URL);
    expect(requests.length).toBe(2);
    for (const request of requests) {
      expect(request.request.params.get('sportId')).toBe('sport-1');
      request.flush(EMPTY_DASHBOARD);
    }
    drainComparisonRequests();
  });

  it('shows the RFC 7807 detail when a comparison request fails', () => {
    createComponent();
    flushOptions();

    let handled = false;
    while (!handled) {
      const pending = httpMock.match((req) => [STATISTICS_URL, DAILY_URL, BANKROLL_URL, SETTINGS_URL].includes(req.url));
      for (const request of pending) {
        if (request.request.url === STATISTICS_URL && !handled) {
          request.flush({ detail: 'Filtro inválido.' }, { status: 400, statusText: 'Bad Request' });
          handled = true;
        } else if (!request.cancelled) {
          if (request.request.url === DAILY_URL) {
            request.flush([]);
          } else if (request.request.url === BANKROLL_URL) {
            request.flush({ at: request.request.params.get('at') ?? 'now', balance: 0 });
          } else if (request.request.url === SETTINGS_URL) {
            request.flush({ unitPercent: 0.01 });
          }
        }
      }
      if (!handled && pending.length === 0) {
        break;
      }
    }
    // Drain whatever the failure left behind (forkJoin cancels the siblings of the failed request).
    for (const request of httpMock.match(() => true)) {
      if (!request.cancelled) {
        request.flush({});
      }
    }
    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBe('Filtro inválido.');
  });
});
