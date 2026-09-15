import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MonthlyDrawdownGrid } from './monthly-drawdown-grid';
import { environment } from '../../../../environments/environment';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Same jsdom canvas gap as shared/monthly-profit-chart.spec.ts - the grid renders real
 *  app-monthly-drawdown-chart children (echarts). */
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
const BANKROLL_URL = `${environment.apiGatewayUrl}/api/v1/bankroll/balance`;
const SETTINGS_URL = `${environment.apiGatewayUrl}/api/v1/settings`;

describe('MonthlyDrawdownGrid', () => {
  let fixture: ComponentFixture<MonthlyDrawdownGrid>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      monthlyDrawdown: {
        fromLabel: 'Mês inicial',
        toLabel: 'Mês final',
        emptyResult: 'Nenhum mês no intervalo selecionado.',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function flushLoad(daily: { date: string; netProfit: number; totalStaked: number; roi: number; betCount: number }[] = []) {
    httpMock.expectOne((req) => req.url === DAILY_URL).flush(daily);
    httpMock.expectOne((req) => req.url === BANKROLL_URL && !req.params.has('at')).flush({ at: 'now', balance: 1000 });
    httpMock.expectOne((req) => req.url === SETTINGS_URL).flush({ unitPercent: 0.01 });
  }

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

  it('loads the current month by default and requests the whole-month range', () => {
    fixture.detectChanges();

    const request = httpMock.expectOne((req) => req.url === DAILY_URL);
    const from = request.request.params.get('from')!;
    const to = request.request.params.get('to')!;
    expect(from.endsWith('-01')).toBe(true);
    expect(from.slice(0, 7)).toBe(to.slice(0, 7)); // same month by default

    request.flush([]);
    httpMock.expectOne((req) => req.url === BANKROLL_URL && !req.params.has('at')).flush({ at: 'now', balance: 1000 });
    httpMock.expectOne((req) => req.url === SETTINGS_URL).flush({ unitPercent: 0.01 });
    fixture.detectChanges();

    const charts = fixture.nativeElement.querySelectorAll('[data-testid="monthly-drawdown-chart-title"]');
    expect(charts).toHaveLength(1);
  });

  it('renders one mini-chart per month across a multi-month range', () => {
    fixture.detectChanges();
    flushLoad();
    fixture.detectChanges();

    // Both fields batched behind applyFilter() (like dashboard.ts's own filterForm) - one
    // request set, not one per field change (see monthly-drawdown-grid.ts's class comment).
    fixture.componentInstance['filterForm'].setValue({ fromMonth: '2026-01', toMonth: '2026-03' });
    fixture.componentInstance['applyFilter']();
    flushLoad([{ date: '2026-02-10', netProfit: 50, totalStaked: 100, roi: 0.5, betCount: 1 }]);
    fixture.detectChanges();

    const charts = fixture.nativeElement.querySelectorAll('[data-testid="monthly-drawdown-chart-title"]');
    expect(charts).toHaveLength(3);
  });

  it('changing the range issues a new request with the recalculated from/to only after applyFilter()', () => {
    fixture.detectChanges();
    flushLoad();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].setValue({ fromMonth: '2026-06', toMonth: '2026-06' });
    httpMock.expectNone((req) => req.url === DAILY_URL);

    fixture.componentInstance['applyFilter']();
    const request = httpMock.expectOne((req) => req.url === DAILY_URL);
    expect(request.request.params.get('from')).toBe('2026-06-01');
    expect(request.request.params.get('to')).toBe('2026-06-30');
    request.flush([]);
    httpMock.expectOne((req) => req.url === BANKROLL_URL && !req.params.has('at')).flush({ at: 'now', balance: 1000 });
    httpMock.expectOne((req) => req.url === SETTINGS_URL).flush({ unitPercent: 0.01 });
  });

  it('shows the empty-result message when the range resolves to no months (end before start)', () => {
    fixture.detectChanges();
    flushLoad();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].setValue({ fromMonth: '2026-06', toMonth: '2026-01' });
    fixture.componentInstance['applyFilter']();
    flushLoad();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="monthly-drawdown-empty"]')).toBeTruthy();
  });

  it('does not reload while the form is invalid (a required field cleared)', () => {
    fixture.detectChanges();
    flushLoad();
    fixture.detectChanges();

    fixture.componentInstance['filterForm'].patchValue({ fromMonth: '' });
    fixture.componentInstance['applyFilter']();

    // expectNone() IS the real assertion (a network request is a side effect, not a return
    // value) - the redundant expect() below only satisfies SonarCloud's typescript:S2699
    // (does not recognize HttpTestingController's own assertion methods as assertions).
    expect(fixture.componentInstance['filterForm'].invalid).toBe(true);
    httpMock.expectNone((req) => req.url === DAILY_URL);
  });

  it('shows the RFC 7807 detail when the daily statistics request fails', () => {
    fixture.detectChanges();

    httpMock
      .expectOne((req) => req.url === DAILY_URL)
      .flush({ detail: 'Intervalo inválido.' }, { status: 400, statusText: 'Bad Request' });
    for (const request of httpMock.match(() => true)) {
      if (!request.cancelled) {
        request.flush({});
      }
    }
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="monthly-drawdown-error"]').textContent).toContain('Intervalo inválido.');
  });
});
