import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Dashboard } from './dashboard';
import { Auth } from '../../core/auth';
import { environment } from '../../../environments/environment';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

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

const BANKROLL_URL = `${environment.apiGatewayUrl}/api/v1/bankroll/balance`;
const SETTINGS_URL = `${environment.apiGatewayUrl}/api/v1/settings`;
const STATISTICS_URL = `${environment.apiGatewayUrl}/api/v1/statistics`;
const DAILY_STATISTICS_URL = `${environment.apiGatewayUrl}/api/v1/statistics/daily`;

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
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
      dashboard: {
        filtersTitle: 'Filtros',
        metricsTitle: 'Métricas',
        bettingHouseLabel: 'Casa de apostas',
        sportLabel: 'Esporte',
        leagueLabel: 'Liga',
        marketLabel: 'Mercado',
        tipsterLabel: 'Tipster',
        filterAll: 'Todas',
        applyFilter: 'Aplicar',
        unitPercentLabel: 'Unidade (% da banca)',
        unitPercentSave: 'Salvar',
        unitPercentSuccess: 'Percentual de unidade atualizado.',
        nameLabel: 'Nome',
        totalStakedLabel: 'Total apostado',
        netProfitLabel: 'Lucro líquido',
        roiLabel: 'ROI',
        winRateLabel: 'Taxa de acerto',
        settledCountLabel: 'Apostas liquidadas',
        wonLostLabel: 'Vitórias / derrotas',
        preLiveLabel: 'Pré / live',
        avgOddLabel: 'Odd média',
        balanceFromLabel: 'Saldo inicial',
        balanceToLabel: 'Saldo final',
        unitsStakedLabel: 'Unidades apostadas',
        indeterminate: 'Indeterminado',
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

  function flushDashboardData(overrides: Record<string, unknown> = {}) {
    httpMock.expectOne((req) => req.url === STATISTICS_URL).flush({
      overall: {
        totalStaked: 1000,
        netProfit: 150,
        roi: 0.15,
        winRate: 0.6,
        settledCount: 10,
        wonCount: 6,
        lostCount: 4,
        voidCount: 0,
        preCount: 8,
        liveCount: 2,
        avgOdd: 1.9,
      },
      bySport: [{ dimensionId: 'sports-1', dimensionName: 'sports', metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 } }],
      byMarket: [],
      byBettingHouse: [],
      monthly: [{ year: 2026, month: 1, metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 } }],
      ...overrides,
    });

    for (const request of httpMock.match((req) => req.url === BANKROLL_URL && req.params.has('at'))) {
      request.flush({ at: request.request.params.get('at')!, balance: 1000 });
    }
    for (const request of httpMock.match((req) => req.url === BANKROLL_URL && !req.params.has('at'))) {
      request.flush({ at: 'now', balance: 2000 });
    }
    for (const request of httpMock.match((req) => req.url === SETTINGS_URL)) {
      request.flush({ unitPercent: 0.01 });
    }
    for (const request of httpMock.match((req) => req.url === DAILY_STATISTICS_URL)) {
      request.flush([]);
    }
  }

  function createComponent() {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    fixture = TestBed.createComponent(Dashboard);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  function setAdminSession() {
    TestBed.inject(Auth).session.set({
      token: 't',
      userId: 'u1',
      role: 'ADMIN',
      tenantSlug: 'tenant',
      mustChangePassword: false,
    });
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
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    }).compileComponents();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads options and overall metrics on creation, defaulting to the "Hoje" period', () => {
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    const total = fixture.nativeElement.querySelector('[data-testid="dashboard-total-staked"]');
    const roi = fixture.nativeElement.querySelector('[data-testid="dashboard-roi"]');
    expect(total.textContent).toContain('R$');
    expect(roi.textContent).toContain('%');
  });

  it('fetches per-day profit with the dashboard filters when the period spans up to 31 days', () => {
    createComponent();
    flushOptions();
    flushDashboardData();

    fixture.componentInstance['filterForm'].patchValue({ sportId: 'sports-1' });
    fixture.componentInstance['onPeriodChange']({ from: '2020-03-01', to: '2020-03-31' });

    const daily = httpMock.expectOne(
      (req) => req.url === DAILY_STATISTICS_URL && req.params.get('from') === '2020-03-01',
    );
    expect(daily.request.params.get('to')).toBe('2020-03-31');
    expect(daily.request.params.get('sportId')).toBe('sports-1');
    flushDashboardData();
  });

  it('does not fetch per-day profit when the period spans more than 31 days', () => {
    createComponent();
    flushOptions();
    flushDashboardData();

    fixture.componentInstance['onPeriodChange']({ from: '2020-03-01', to: '2020-04-01' });

    expect(httpMock.match((req) => req.url === DAILY_STATISTICS_URL && req.params.get('from') === '2020-03-01')).toHaveLength(0);
    flushDashboardData();
  });

  it('colors net profit/ROI negative when overall metrics show a loss', () => {
    createComponent();
    flushOptions();
    flushDashboardData({ overall: { totalStaked: 1000, netProfit: -150, roi: -0.15, winRate: 0.4, settledCount: 10, wonCount: 4, lostCount: 6, voidCount: 0, preCount: 5, liveCount: 5, avgOdd: 1.8 } });
    fixture.detectChanges();

    const netProfitCard = fixture.nativeElement.querySelector('[data-testid="dashboard-net-profit"]');
    const roiCard = fixture.nativeElement.querySelector('[data-testid="dashboard-roi"]');
    expect(netProfitCard.classList).toContain('kpi-card--negative');
    expect(roiCard.classList).toContain('kpi-card--negative');
  });

  it('renders segmented breakdown rows', () => {
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="dashboard-by-sport-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('sports');
  });

  function cardValue(testId: string): string {
    return fixture.nativeElement.querySelector(`[data-testid="${testId}"] .kpi-card__value`).textContent;
  }

  it('renders the new won/lost, PRE/LIVE, avg odd, and balance cards', () => {
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    expect(cardValue('dashboard-won-lost')).toContain('6 / 4');
    expect(cardValue('dashboard-pre-live')).toContain('8 / 2');
    expect(cardValue('dashboard-avg-odd')).toContain('1.90');
    expect(cardValue('dashboard-balance-from')).toContain('R$');
    expect(cardValue('dashboard-balance-to')).toContain('R$');
  });

  it('computes unidades apostadas from totalStaked, current balance, and unitPercent', () => {
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    expect(cardValue('dashboard-units-staked')).toContain('50.00');
  });

  it('renders the indeterminate placeholder for unidades apostadas when the current balance is zero', () => {
    createComponent();
    flushOptions();
    httpMock.expectOne((req) => req.url === STATISTICS_URL).flush({
      overall: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10, wonCount: 6, lostCount: 4, voidCount: 0, preCount: 8, liveCount: 2, avgOdd: 1.9 },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      monthly: [],
    });
    for (const request of httpMock.match((req) => req.url === BANKROLL_URL && req.params.has('at'))) {
      request.flush({ at: request.request.params.get('at')!, balance: 1000 });
    }
    for (const request of httpMock.match((req) => req.url === BANKROLL_URL && !req.params.has('at'))) {
      request.flush({ at: 'now', balance: 0 });
    }
    for (const request of httpMock.match((req) => req.url === SETTINGS_URL)) {
      request.flush({ unitPercent: 0.01 });
    }
    for (const request of httpMock.match((req) => req.url === DAILY_STATISTICS_URL)) {
      request.flush([]);
    }
    fixture.detectChanges();

    expect(cardValue('dashboard-units-staked')).not.toMatch(/\d/);
  });

  it('applying the filter issues a new statistics request with the chosen betting house', () => {
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].patchValue({ bettingHouseId: 'bh-1' });
    fixture.componentInstance['applyFilter']();

    const request = httpMock.expectOne((req) => req.url === STATISTICS_URL);
    expect(request.request.params.get('bettingHouseId')).toBe('bh-1');
    request.flush({
      overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0, wonCount: 0, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: null },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      monthly: [],
    });
    for (const bankrollRequest of httpMock.match((req) => req.url === BANKROLL_URL)) {
      bankrollRequest.flush({ at: bankrollRequest.request.params.get('at') ?? 'now', balance: 0 });
    }
    httpMock.expectOne((req) => req.url === SETTINGS_URL).flush({ unitPercent: 0.01 });
    httpMock.expectOne((req) => req.url === DAILY_STATISTICS_URL).flush([]);
  });

  it('shows the RFC 7807 detail when the statistics request fails', () => {
    createComponent();
    flushOptions();
    httpMock
      .expectOne((req) => req.url === STATISTICS_URL)
      .flush({ detail: 'Filtro inválido.' }, { status: 400, statusText: 'Bad Request' });
    for (const request of httpMock.match((req) => req.url === DAILY_STATISTICS_URL)) {
      if (!request.cancelled) {
        request.flush([]);
      }
    }
    for (const request of httpMock.match(() => true)) {
      if (!request.cancelled) {
        request.flush({});
      }
    }
    fixture.detectChanges();

    expect(fixture.componentInstance['dashboardError']()).toBe('Filtro inválido.');
  });

  it('does not render the unit config field for a non-admin session', () => {
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-unit-percent-form"]')).toBeNull();
  });

  it('renders the unit config field pre-filled with the loaded unitPercent, as a percent, for an admin session', () => {
    setAdminSession();
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="dashboard-unit-percent-input"]');
    expect(input).not.toBeNull();
    expect(input.value).toBe('1');
  });

  it('saves the unit config field and shows a success message', () => {
    setAdminSession();
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    fixture.componentInstance['unitPercentForm'].setValue({ unitPercent: 2 });
    fixture.componentInstance['unitPercentForm'].markAsDirty();
    fixture.componentInstance['submitUnitPercent']();

    const request = httpMock.expectOne((req) => req.url === SETTINGS_URL && req.method === 'PATCH');
    expect(request.request.body).toEqual({ unitPercent: 0.02 });
    request.flush({ unitPercent: 0.02 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-unit-percent-success"]')).not.toBeNull();
  });

  it('shows the RFC 7807 detail when saving the unit config field fails', () => {
    setAdminSession();
    createComponent();
    flushOptions();
    flushDashboardData();
    fixture.detectChanges();

    fixture.componentInstance['unitPercentForm'].setValue({ unitPercent: 2 });
    fixture.componentInstance['unitPercentForm'].markAsDirty();
    fixture.componentInstance['submitUnitPercent']();

    httpMock
      .expectOne((req) => req.url === SETTINGS_URL && req.method === 'PATCH')
      .flush({ detail: 'Acesso restrito a administradores.' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.componentInstance['unitPercentError']()).toBe('Acesso restrito a administradores.');
  });
});
