import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { SearchStatistics } from './search-statistics';
import { environment } from '../../../environments/environment';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Same jsdom canvas gap as shared/monthly-profit-chart.spec.ts - equity-curve-chart is nested here once results render. */
function stubCanvasContext(): void {
  const noop = () => {};
  const context: Record<string, unknown> = {};
  const proxy = new Proxy(context, {
    get: (target, prop) => {
      if (prop === 'canvas' || prop in target) {
        return target[prop as string];
      }
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: noop });
      }
      if (prop === 'measureText') {
        return () => ({ width: 0 });
      }
      return noop;
    },
    set: (target, prop, value) => {
      target[prop as string] = value;
      return true;
    },
  });
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    context['canvas'] = this;
    return proxy;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

describe('SearchStatistics', () => {
  let fixture: ComponentFixture<SearchStatistics>;
  let httpMock: HttpTestingController;

  // jsdom's navigator.language is 'en-US', which Language defaults to absent
  // a stored preference (see core/language.ts) - the fixture matches that
  // active lang, same reasoning as dashboard.spec.ts's en-US tab-label comment.
  const langs = {
    'en-US': {
      searchStatistics: {
        filtersTitle: 'Filters',
        resultsTitle: 'Results',
        sportLabel: 'Sport',
        leagueLabel: 'League',
        teamLabel: 'Team',
        bettingHouseLabel: 'Betting house',
        marketLabel: 'Market',
        tipsterLabel: 'Tipster',
        fromLabel: 'From',
        toLabel: 'To',
        filterAll: 'All',
        requiredError: 'Required',
        search: 'Search',
        emptyBeforeSearch: 'Choose a sport and league, then search.',
        emptyResult: 'No settled bets for this combination.',
        betCountLabel: 'Bets',
        totalStakedLabel: 'Total staked',
        netProfitLabel: 'Net profit',
        roiLabel: 'ROI',
        winRateLabel: 'Win rate',
        avgOddLabel: 'Average odd',
        maxDrawdownLabel: 'Max drawdown',
        sharpeRatioLabel: 'Sharpe ratio',
        sharpeIndeterminate: 'Indeterminate',
        genericError: 'Something went wrong. Please try again.',
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

  function flushSearch(overrides: Record<string, unknown> = {}) {
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/search`).flush({
      summary: {
        betCount: 5,
        totalStaked: 500,
        netProfit: 50,
        roi: 0.1,
        winRate: 0.6,
        avgOdd: 1.87,
        maxDrawdown: 20,
        sharpeRatio: 0.42,
      },
      timeline: [{ date: '2026-01-03', cumulativeProfit: 30 }],
      ...overrides,
    });
  }

  function createComponent() {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    fixture = TestBed.createComponent(SearchStatistics);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchStatistics,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['en-US'], defaultLang: 'en-US' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows the "never searched" empty state before any submit', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="search-statistics-empty-before-search"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="search-statistics-cards"]')).toBeNull();
  });

  it('keeps the submit button disabled until sport and league are chosen', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="search-statistics-submit"]',
    );
    expect(button?.disabled).toBe(true);

    fixture.componentInstance['filterForm'].controls.sportId.setValue('sports-1');
    fixture.componentInstance['filterForm'].controls.leagueId.setValue('leagues-1');
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams`).flush([]);

    expect(button?.disabled).toBe(false);
  });

  it('resets and refetches team options when sport changes', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].controls.sportId.setValue('sp-1');
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams` && req.params.get('sportId') === 'sp-1')
      .flush([{ id: 'tm-1', name: 'Flamengo' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance['teamOptions']()).toEqual([{ id: 'tm-1', name: 'Flamengo' }]);

    fixture.componentInstance['filterForm'].controls.teamId.setValue('tm-1');
    fixture.componentInstance['filterForm'].controls.sportId.setValue('sp-2');
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams` && req.params.get('sportId') === 'sp-2')
      .flush([{ id: 'tm-2', name: 'Vasco' }]);
    fixture.detectChanges();

    expect(fixture.componentInstance['teamOptions']()).toEqual([{ id: 'tm-2', name: 'Vasco' }]);
    expect(fixture.componentInstance['filterForm'].controls.teamId.value).toBe('');
  });

  it('ignores a stale team response from a sport the user already navigated away from', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].controls.sportId.setValue('sp-1');
    const staleRequest = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams` && req.params.get('sportId') === 'sp-1',
    );
    fixture.componentInstance['filterForm'].controls.sportId.setValue('sp-2');
    const freshRequest = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams` && req.params.get('sportId') === 'sp-2',
    );

    freshRequest.flush([{ id: 'tm-2', name: 'Vasco' }]);
    if (!staleRequest.cancelled) {
      staleRequest.flush([{ id: 'tm-1', name: 'Flamengo' }]);
    }
    fixture.detectChanges();

    expect(fixture.componentInstance['teamOptions']()).toEqual([{ id: 'tm-2', name: 'Vasco' }]);
  });

  it('shows the zero-results empty state distinctly from "never searched"', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();
    fixture.componentInstance['filterForm'].controls.sportId.setValue('sports-1');
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams`).flush([]);
    fixture.componentInstance['filterForm'].controls.leagueId.setValue('leagues-1');
    fixture.componentInstance['search']();
    flushSearch({ summary: { betCount: 0, totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, avgOdd: 0, maxDrawdown: 0, sharpeRatio: null } });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="search-statistics-empty-before-search"]')).toBeNull();
    expect(el.querySelector('[data-testid="search-statistics-empty-result"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="search-statistics-cards"]')).toBeNull();
  });

  it('renders all summary cards, including betCount, on a real result', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();
    fixture.componentInstance['filterForm'].controls.sportId.setValue('sports-1');
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams`).flush([]);
    fixture.componentInstance['filterForm'].controls.leagueId.setValue('leagues-1');
    fixture.componentInstance['search']();
    flushSearch();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="search-statistics-bet-count"]')?.textContent).toContain('5');
    expect(el.querySelector('[data-testid="search-statistics-total-staked"]')?.textContent).toContain('R$');
    expect(el.querySelector('[data-testid="search-statistics-avg-odd"]')?.textContent).toContain('1.87');
  });

  it('renders a localized placeholder instead of "null" when sharpeRatio is indeterminate', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();
    fixture.componentInstance['filterForm'].controls.sportId.setValue('sports-1');
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams`).flush([]);
    fixture.componentInstance['filterForm'].controls.leagueId.setValue('leagues-1');
    fixture.componentInstance['search']();
    flushSearch({ summary: { betCount: 1, totalStaked: 10, netProfit: 1, roi: 0.1, winRate: 1, avgOdd: 1.5, maxDrawdown: 0, sharpeRatio: null } });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="search-statistics-sharpe-ratio"]')?.textContent).toContain('Indeterminate');
  });

  it('shows an RFC7807 error message when the search request fails', () => {
    createComponent();
    flushOptions();
    fixture.detectChanges();
    fixture.componentInstance['filterForm'].controls.sportId.setValue('sports-1');
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/teams`).flush([]);
    fixture.componentInstance['filterForm'].controls.leagueId.setValue('leagues-1');
    fixture.componentInstance['search']();
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics/search`).flush(
      { title: 'Erro', detail: 'Combinação inválida.' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="search-statistics-result-error"]')?.textContent).toContain('Combinação inválida.');
  });
});
