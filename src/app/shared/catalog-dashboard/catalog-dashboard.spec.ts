import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { CatalogDashboard } from './catalog-dashboard';
import { environment } from '../../../environments/environment';

const STATISTICS_URL = `${environment.apiGatewayUrl}/api/v1/statistics`;

function segment(id: string, name: string, roi: number, netProfit = 0, settledCount = 1) {
  return {
    dimensionId: id,
    dimensionName: name,
    metrics: { totalStaked: 0, netProfit, roi, winRate: 0, settledCount },
  };
}

describe('CatalogDashboard', () => {
  let fixture: ComponentFixture<CatalogDashboard>;
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
      catalogDashboard: {
        filtersTitle: 'Filtros',
        rankingTitle: 'Ranking',
        netProfitLabel: 'Lucro líquido',
        roiLabel: 'ROI',
        settledCountLabel: 'Apostas liquidadas',
        emptyResult: 'Nenhuma aposta liquidada encontrada nesse período.',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
        sportNameLabel: 'Esporte',
      },
    },
  };

  function flushBundle(overrides: Record<string, unknown> = {}) {
    httpMock.expectOne((req) => req.url === STATISTICS_URL).flush({
      overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0, wonCount: 0, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: null },
      bySport: [],
      byMarket: [],
      byBettingHouse: [],
      byLeague: [],
      byTipster: [],
      monthly: [],
      ...overrides,
    });
  }

  function createComponent(segmentInput: string, labelKey: string) {
    fixture = TestBed.createComponent(CatalogDashboard);
    fixture.componentRef.setInput('segment', segmentInput);
    fixture.componentRef.setInput('labelKey', labelKey);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CatalogDashboard,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => httpMock.verify());

  it('ranks rows by ROI descending, regardless of the order the API returned them in', () => {
    createComponent('bySport', 'catalogDashboard.sportNameLabel');
    flushBundle({
      bySport: [segment('sp-1', 'Baixo ROI', 0.05), segment('sp-2', 'Alto ROI', 0.5), segment('sp-3', 'ROI médio', 0.2)],
    });
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="catalog-dashboard-row"]');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('Alto ROI');
    expect(rows[1].textContent).toContain('ROI médio');
    expect(rows[2].textContent).toContain('Baixo ROI');
  });

  it('reads the segment matching the "segment" input, ignoring the other 4 arrays in the bundle', () => {
    createComponent('byTipster', 'catalogDashboard.tipsterNameLabel');
    flushBundle({
      bySport: [segment('sp-1', 'Should not appear', 0.9)],
      byTipster: [segment('tp-1', 'Ana', 0.3)],
    });
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="catalog-dashboard-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Ana');
  });

  it('renders the empty-state row, not an error, when the segment has no entries', () => {
    createComponent('bySport', 'catalogDashboard.sportNameLabel');
    flushBundle();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="catalog-dashboard-empty"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="catalog-dashboard-error"]')).toBeNull();
  });

  it('shows the RFC 7807 detail when the statistics request fails', () => {
    createComponent('bySport', 'catalogDashboard.sportNameLabel');
    httpMock
      .expectOne((req) => req.url === STATISTICS_URL)
      .flush({ detail: 'Filtro inválido.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBe('Filtro inválido.');
  });
});
