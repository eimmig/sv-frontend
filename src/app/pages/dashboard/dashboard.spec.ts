import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Dashboard } from './dashboard';
import { environment } from '../../../environments/environment';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/**
 * jsdom has no real 2D canvas (getContext('2d') returns null without the
 * native `canvas` package, which this project doesn't install) - zrender
 * (echarts' renderer, behind app-monthly-profit-chart) dereferences that
 * context unconditionally on init and dispose, throwing during test cleanup.
 * A permissive proxy (every method a no-op, every property settable) is
 * enough for echarts to run its full lifecycle without crashing; it isn't
 * asserting pixels, just that nothing throws. See monthly-profit-chart.spec.ts.
 */
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

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      dashboard: {
        filtersTitle: 'Filtros',
        metricsTitle: 'Métricas',
        bettingHouseLabel: 'Casa de apostas',
        sportLabel: 'Esporte',
        leagueLabel: 'Liga',
        marketLabel: 'Mercado',
        tipsterLabel: 'Tipster',
        fromLabel: 'De',
        toLabel: 'Até',
        filterAll: 'Todas',
        applyFilter: 'Aplicar',
        nameLabel: 'Nome',
        totalStakedLabel: 'Total apostado',
        netProfitLabel: 'Lucro líquido',
        roiLabel: 'ROI',
        winRateLabel: 'Taxa de acerto',
        settledCountLabel: 'Apostas liquidadas',
        bySportTitle: 'Por esporte',
        byMarketTitle: 'Por mercado',
        byBettingHouseTitle: 'Por casa de apostas',
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
    for (const resource of ['sports', 'leagues', 'markets', 'tipsters'] as const) {
      httpMock
        .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/${resource}`)
        .flush({ content: [{ id: `${resource}-1`, name: resource }], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    }
  }

  function flushStatistics(overrides: Record<string, unknown> = {}) {
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics`).flush({
      overall: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 },
      bySport: [{ dimensionId: 'sports-1', dimensionName: 'sports', metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 } }],
      byMarket: [],
      byBettingHouse: [],
      monthly: [{ year: 2026, month: 1, metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 } }],
      ...overrides,
    });
  }

  function createComponent() {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    fixture = TestBed.createComponent(Dashboard);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Dashboard,
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
  });

  it('loads options and overall metrics on creation', () => {
    createComponent();
    flushOptions();
    flushStatistics();
    fixture.detectChanges();

    const total = fixture.nativeElement.querySelector('[data-testid="dashboard-total-staked"]');
    const roi = fixture.nativeElement.querySelector('[data-testid="dashboard-roi"]');
    expect(total.textContent).toContain('R$');
    expect(roi.textContent).toContain('%');
  });

  it('colors net profit/ROI negative when overall metrics show a loss', () => {
    createComponent();
    flushOptions();
    flushStatistics({ overall: { totalStaked: 1000, netProfit: -150, roi: -0.15, winRate: 0.4, settledCount: 10 } });
    fixture.detectChanges();

    const netProfitCard = fixture.nativeElement.querySelector('[data-testid="dashboard-net-profit"]');
    const roiCard = fixture.nativeElement.querySelector('[data-testid="dashboard-roi"]');
    expect(netProfitCard.classList).toContain('kpi-card--negative');
    expect(roiCard.classList).toContain('kpi-card--negative');
  });

  it('renders segmented breakdown rows', () => {
    createComponent();
    flushOptions();
    flushStatistics();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="dashboard-by-sport-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('sports');
  });

  it('applying the filter issues a new statistics request with the chosen betting house', () => {
    createComponent();
    flushOptions();
    flushStatistics();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].patchValue({ bettingHouseId: 'bh-1' });
    fixture.componentInstance['applyFilter']();

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics`,
    );
    expect(request.request.params.get('bettingHouseId')).toBe('bh-1');
    request.flush({
      overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0 },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      monthly: [],
    });
  });

  it('shows the RFC 7807 detail when the statistics request fails', () => {
    createComponent();
    flushOptions();
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/statistics`)
      .flush({ detail: 'Filtro inválido.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.componentInstance['dashboardError']()).toBe('Filtro inválido.');
  });
});
