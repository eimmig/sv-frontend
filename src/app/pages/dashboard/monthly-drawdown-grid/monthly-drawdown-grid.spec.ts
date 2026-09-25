import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MonthlyDrawdownGrid } from './monthly-drawdown-grid';
import { StatisticsFilter } from '../../../core/statistics-api';
import { environment } from '../../../../environments/environment';

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

const DAILY_URL = `${environment.apiGatewayUrl}/api/v1/statistics/daily`;

describe('MonthlyDrawdownGrid', () => {
  let fixture: ComponentFixture<MonthlyDrawdownGrid>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      monthlyDrawdown: {
        emptyResult: 'Nenhum mês no intervalo selecionado.',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  beforeEach(async () => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    stubCanvasContext();
    await TestBed.configureTestingModule({
      imports: [
        MonthlyDrawdownGrid,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyDrawdownGrid);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function setInputs(filter: StatisticsFilter, bankrollNow = 1000, unitPercent = 0.01): void {
    fixture.componentRef.setInput('filter', filter);
    fixture.componentRef.setInput('bankrollNow', bankrollNow);
    fixture.componentRef.setInput('unitPercent', unitPercent);
  }

  it('does not call the daily endpoint while the filter has no from/to yet (before the dashboard applies one)', () => {
    setInputs({});
    fixture.detectChanges();

    httpMock.expectNone((req) => req.url === DAILY_URL);
    expect(fixture.nativeElement.querySelector('[data-testid="monthly-drawdown-empty"]')).toBeTruthy();
  });

  it('requests the daily endpoint with the exact from/to of the inherited filter, including segment filters', () => {
    setInputs({ from: '2026-09-01', to: '2026-09-30', sportId: 'sp-1' });
    fixture.detectChanges();

    const request = httpMock.expectOne((req) => req.url === DAILY_URL);
    expect(request.request.params.get('from')).toBe('2026-09-01');
    expect(request.request.params.get('to')).toBe('2026-09-30');
    expect(request.request.params.get('sportId')).toBe('sp-1');
    request.flush([]);
    fixture.detectChanges();

    const charts = fixture.nativeElement.querySelectorAll('[data-testid="monthly-drawdown-chart-title"]');
    expect(charts).toHaveLength(1);
  });

  it('renders one mini-chart per calendar month spanned by a multi-month filter', () => {
    setInputs({ from: '2026-01-01', to: '2026-03-31' });
    fixture.detectChanges();

    httpMock.expectOne((req) => req.url === DAILY_URL).flush([{ date: '2026-02-10', netProfit: 50, totalStaked: 100, roi: 0.5, betCount: 1 }]);
    fixture.detectChanges();

    const charts = fixture.nativeElement.querySelectorAll('[data-testid="monthly-drawdown-chart-title"]');
    expect(charts).toHaveLength(3);
    const frame = fixture.nativeElement.querySelector('[data-testid="monthly-drawdown-chart-frame"]');
    expect(frame.querySelectorAll('[data-testid="monthly-drawdown-chart-frame-legend"] li')).toHaveLength(1);
  });

  it('reloads with a new request when the inherited filter changes', () => {
    setInputs({ from: '2026-06-01', to: '2026-06-30' });
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url === DAILY_URL).flush([]);
    fixture.detectChanges();

    setInputs({ from: '2026-07-01', to: '2026-07-31' });
    fixture.detectChanges();

    const request = httpMock.expectOne((req) => req.url === DAILY_URL);
    expect(request.request.params.get('from')).toBe('2026-07-01');
    expect(request.request.params.get('to')).toBe('2026-07-31');
    request.flush([]);
  });

  it('recomputes displayed months from bankrollNow/unitPercent without a new HTTP request when only those change (the filter reference is unchanged)', () => {
    const filter: StatisticsFilter = { from: '2026-09-01', to: '2026-09-01' };
    setInputs(filter, 1000, 0.01);
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url === DAILY_URL).flush([{ date: '2026-09-01', netProfit: 100, totalStaked: 100, roi: 1, betCount: 1 }]);
    fixture.detectChanges();

    expect(fixture.componentInstance['months']()[0].days[0]).toBeCloseTo(10);

    setInputs(filter, 2000, 0.01);
    fixture.detectChanges();

    httpMock.expectNone((req) => req.url === DAILY_URL);
    expect(fixture.componentInstance['months']()[0].days[0]).toBeCloseTo(5);
  });

  it('shows the empty-result message when the filter resolves to no months (to before from)', () => {
    setInputs({ from: '2026-06-01', to: '2026-01-01' });
    fixture.detectChanges();

    httpMock.expectOne((req) => req.url === DAILY_URL).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="monthly-drawdown-empty"]')).toBeTruthy();
  });

  it('shows the RFC 7807 detail when the daily statistics request fails', () => {
    setInputs({ from: '2026-09-01', to: '2026-09-30' });
    fixture.detectChanges();

    httpMock.expectOne((req) => req.url === DAILY_URL).flush({ detail: 'Intervalo inválido.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="monthly-drawdown-error"]').textContent).toContain('Intervalo inválido.');
  });
});
