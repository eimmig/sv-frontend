import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PeriodReport } from './period-report';
import { environment } from '../../../environments/environment';

const BANKROLL_URL = `${environment.apiGatewayUrl}/api/v1/bankroll/balance`;
const SETTINGS_URL = `${environment.apiGatewayUrl}/api/v1/settings`;
const STATISTICS_URL = `${environment.apiGatewayUrl}/api/v1/statistics`;
const DAILY_URL = `${environment.apiGatewayUrl}/api/v1/statistics/daily`;

describe('PeriodReport', () => {
  let fixture: ComponentFixture<PeriodReport>;
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
      periodReport: {
        filtersTitle: 'Filtros',
        summaryTitle: 'Resumo',
        roiBankrollLabel: 'ROI Bankroll',
        averageProfitLabel: 'ROI médio diário',
        profitUnitsLabel: 'Profit (unidades)',
        profitReaisLabel: 'Profit (R$)',
        unitPercentLabel: '% Unidade',
        averageStakeLabel: 'Stake médio',
        greenRedDaysLabel: 'Dias green / red',
        greenRedEntriesLabel: 'Entradas green / red',
        evLabel: '+EV',
        indeterminate: 'Indeterminado',
        dateLabel: 'Data',
        roiPercentLabel: 'ROI %',
        roiUnitsLabel: 'ROI (unidades)',
        roiReaisLabel: 'ROI (R$)',
        betsLabel: 'Apostas',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function flushPeriodReportData(overrides: Record<string, unknown> = {}) {
    httpMock.expectOne((req) => req.url === STATISTICS_URL).flush({
      overall: {
        totalStaked: 1000,
        netProfit: 264.2,
        roi: 0.2642,
        winRate: 0.37,
        settledCount: 200,
        wonCount: 74,
        lostCount: 126,
        voidCount: 0,
        preCount: 150,
        liveCount: 50,
        avgOdd: 3.22,
      },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      monthly: [],
      ...overrides,
    });
    httpMock.expectOne((req) => req.url === DAILY_URL).flush([
      { date: '2026-09-11', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 2 },
    ]);
    for (const request of httpMock.match((req) => req.url === BANKROLL_URL)) {
      request.flush({ at: request.request.params.get('at') ?? 'now', balance: 1195.05 });
    }
    httpMock.expectOne((req) => req.url === SETTINGS_URL).flush({ unitPercent: 0.01 });
  }

  function createComponent() {
    fixture = TestBed.createComponent(PeriodReport);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PeriodReport,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => httpMock.verify());

  it('loads with the period-preset-filter default ("Hoje") and renders the summary cards', () => {
    createComponent();
    flushPeriodReportData();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="period-report-summary-cards"]')).not.toBeNull();
    const roiBankrollValue = fixture.nativeElement.querySelector(
      '[data-testid="period-report-roi-bankroll"] .kpi-card__value',
    ).textContent;
    // 264.20 / 1195.05 ≈ 22.11% (docs/STATISTICS.md reference value, en-US locale in this test env).
    expect(roiBankrollValue).toContain('22.1');
  });

  it('renders one daily table row per day fetched', () => {
    createComponent();
    flushPeriodReportData();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="period-report-daily-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('2026-09-11');
  });

  it('changing the period issues a new set of requests with the new range', () => {
    createComponent();
    flushPeriodReportData();
    fixture.detectChanges();

    fixture.componentInstance['onPeriodChange']({ from: '2026-01-01', to: '2026-01-31' });

    const request = httpMock.expectOne((req) => req.url === STATISTICS_URL);
    expect(request.request.params.get('from')).toBe('2026-01-01');
    expect(request.request.params.get('to')).toBe('2026-01-31');
    request.flush({
      overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0, wonCount: 0, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: null },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      monthly: [],
    });
    httpMock.expectOne((req) => req.url === DAILY_URL).flush([]);
    for (const bankrollRequest of httpMock.match((req) => req.url === BANKROLL_URL)) {
      bankrollRequest.flush({ at: bankrollRequest.request.params.get('at') ?? 'now', balance: 0 });
    }
    httpMock.expectOne((req) => req.url === SETTINGS_URL).flush({ unitPercent: 0.01 });
  });

  it('shows the RFC 7807 detail when the statistics request fails', () => {
    createComponent();
    httpMock
      .expectOne((req) => req.url === STATISTICS_URL)
      .flush({ detail: 'Filtro inválido.' }, { status: 400, statusText: 'Bad Request' });
    for (const request of httpMock.match(() => true)) {
      if (!request.cancelled) {
        request.flush({});
      }
    }
    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBe('Filtro inválido.');
  });
});
