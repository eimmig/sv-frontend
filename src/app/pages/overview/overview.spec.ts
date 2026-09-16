import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { Overview } from './overview';
import { environment } from '../../../environments/environment';

const BANKROLL_URL = `${environment.apiGatewayUrl}/api/v1/bankroll/balance`;
const SETTINGS_URL = `${environment.apiGatewayUrl}/api/v1/settings`;
const STATISTICS_URL = `${environment.apiGatewayUrl}/api/v1/statistics`;
const DAILY_URL = `${environment.apiGatewayUrl}/api/v1/statistics/daily`;

describe('Overview', () => {
  let fixture: ComponentFixture<Overview>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      overview: {
        summaryTitle: 'Visão geral',
        lucroTotalLabel: 'Lucro Total (U)',
        preLiveLabel: 'Pré / Live (U)',
        lucroMedioMensalLabel: 'Lucro Médio Mensal (U)',
        roiLabel: 'ROI',
        monthLabel: 'Mês',
        saldoComecoLabel: 'Saldo Começo',
        saldoFinalLabel: 'Saldo Final',
        entradasLabel: 'Entradas',
        vitoriasPerdasLabel: 'Vitórias / Perdas',
        oddMediaLabel: 'Odd Média',
        winRateLabel: 'WR%',
        profitReaisLabel: 'Profit (R$)',
        profitUnidadesLabel: 'Profit (U)',
        indeterminate: 'Indeterminado',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function createComponent() {
    fixture = TestBed.createComponent(Overview);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  function flushBase(daily: unknown[], byBetType: unknown[] = [], monthly: unknown[] = []) {
    httpMock.expectOne((req) => req.url === STATISTICS_URL).flush({
      overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0, wonCount: 0, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: null },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      byLeague: [],
      byTipster: [],
      byBetType,
      monthly,
    });
    httpMock.expectOne((req) => req.url === DAILY_URL).flush(daily);
    httpMock.expectOne((req) => req.url === BANKROLL_URL && !req.params.has('at')).flush({ at: 'now', balance: 1000 });
    httpMock.expectOne((req) => req.url === SETTINGS_URL).flush({ unitPercent: 0.01 });
  }

  beforeEach(async () => {
    localStorage.removeItem('stakevault.language');
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    // monthlyTable() resolves "the current year" from a real new Date() - freeze the clock so
    // it always matches the 2026 fixtures below, regardless of which real day the suite runs on
    // (same fix as pages/period-report/period-report.spec.ts).
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    await TestBed.configureTestingModule({
      imports: [
        Overview,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  // ignoreCancelled: true - when the statistics request errors, forkJoin cancels the other 3
  // in-flight requests it was still waiting on; a cancelled request is not a leak to flag.
  afterEach(() => {
    httpMock.verify({ ignoreCancelled: true });
    vi.useRealTimers();
    delete (navigator as { language?: string }).language;
  });

  it('fetches saldoInicioHistorico once, at the earliest settled-bet date', () => {
    createComponent();
    flushBase([
      { date: '2026-01-10', totalStaked: 100, netProfit: 100, roi: 1, betCount: 1 },
      { date: '2026-02-05', totalStaked: 100, netProfit: 100, roi: 1, betCount: 1 },
    ]);

    const atRequest = httpMock.expectOne((req) => req.url === BANKROLL_URL && req.params.get('at') === '2026-01-10');
    atRequest.flush({ at: '2026-01-10', balance: 800 });
  });

  it('skips the saldoInicioHistorico call for a tenant with no settled bet, reusing saldoAtual', () => {
    createComponent();
    flushBase([]);
    fixture.detectChanges();

    // No further "at=" request should have been made - httpMock.verify() in afterEach proves it.
    expect(fixture.componentInstance['lucroTotalUnidades']()).toBeNull();
  });

  it('renders the 4 lifetime cards (Lucro Total, Pré/Live, Lucro Médio Mensal, ROI)', () => {
    createComponent();
    flushBase(
      [
        { date: '2026-01-10', totalStaked: 100, netProfit: 100, roi: 0.5, betCount: 1 },
        { date: '2026-02-05', totalStaked: 100, netProfit: -20, roi: -0.2, betCount: 1 },
      ],
      [
        { dimensionId: 'PRE', dimensionName: 'PRE', metrics: { totalStaked: 100, netProfit: 70, roi: 0.1, winRate: 0.5, settledCount: 1 } },
        { dimensionId: 'LIVE', dimensionName: 'LIVE', metrics: { totalStaked: 100, netProfit: 10, roi: 0.1, winRate: 0.5, settledCount: 1 } },
      ],
    );
    httpMock.expectOne((req) => req.url === BANKROLL_URL && req.params.get('at') === '2026-01-10').flush({ at: '2026-01-10', balance: 900 });
    fixture.detectChanges();

    // 100 / (1000 * 0.01) = 10, then -20 / 10 = -2 -> total 8.
    const total = fixture.nativeElement.querySelector('[data-testid="overview-lucro-total"]');
    expect(total.textContent).toContain('8,00');

    // pre 70/10 = 7,00, live 10/10 = 1,00
    const preLive = fixture.nativeElement.querySelector('[data-testid="overview-pre-live"]');
    expect(preLive.textContent).toContain('7,00');
    expect(preLive.textContent).toContain('1,00');

    // 8 / 12 = 0,666...
    const mensal = fixture.nativeElement.querySelector('[data-testid="overview-lucro-medio-mensal"]');
    expect(mensal.textContent).toContain('0,67');

    // (0.5 + -0.2) / 2 = 0.15 = 15%
    const roi = fixture.nativeElement.querySelector('[data-testid="overview-roi"]');
    expect(roi.textContent).toContain('15');
  });

  it('renders 12 monthly rows, merging monthly BetMetrics and ignoring a different year', () => {
    createComponent();
    flushBase(
      [{ date: '2026-03-10', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 1 }],
      [],
      [
        { year: 2026, month: 3, metrics: { totalStaked: 100, netProfit: 50, roi: 0.5, winRate: 0.6, settledCount: 5, wonCount: 3, lostCount: 2, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: 1.8 } },
        // Same month number (3) but a different year - must not leak into this year's table.
        { year: 2025, month: 3, metrics: { totalStaked: 999, netProfit: 999, roi: 9, winRate: 1, settledCount: 99, wonCount: 99, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: 9 } },
      ],
    );
    httpMock.expectOne((req) => req.url === BANKROLL_URL && req.params.get('at') === '2026-03-10').flush({ at: '2026-03-10', balance: 1000 });
    fixture.detectChanges();

    const rows: HTMLElement[] = fixture.nativeElement.querySelectorAll('[data-testid="overview-monthly-row"]');
    expect(rows).toHaveLength(12);
    expect(rows[2].textContent).toContain('5'); // entradas
    expect(rows[2].textContent).toContain('3 / 2'); // vitorias / perdas
    expect(rows[0].textContent).not.toContain('99'); // january must stay zeroed
  });

  it('shows the RFC 7807 detail when the statistics request fails', () => {
    createComponent();
    httpMock.expectOne((req) => req.url === STATISTICS_URL).flush({ detail: 'Filtro inválido.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBe('Filtro inválido.');
  });
});
