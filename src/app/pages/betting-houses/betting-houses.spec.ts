import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { BettingHouses } from './betting-houses';
import { formatBrl } from '../../core/currency';
import { environment } from '../../../environments/environment';

describe('BettingHouses', () => {
  let fixture: ComponentFixture<BettingHouses>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      bettingHouses: {
        createTitle: 'Nova casa de apostas',
        listTitle: 'Casas de apostas',
        nameLabel: 'Nome',
        initialBalanceLabel: 'Saldo inicial',
        balanceLabel: 'Saldo atual',
        create: 'Criar casa de apostas',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function createComponent() {
    fixture = TestBed.createComponent(BettingHouses);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  function expectListRequest() {
    return httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/betting-houses`);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BettingHouses,
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

  it('loads and renders the betting houses on creation', () => {
    createComponent();

    expectListRequest().flush({
      content: [{ id: '1', name: 'Bet365', initialBalance: 100, balance: 150, createdAt: '2026-01-01' }],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    });
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="betting-houses-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Bet365');
    expect(rows[0].textContent).toContain('R$');
  });

  it('badges the balance delta positive/negative/neutral against the initial balance', () => {
    createComponent();

    expectListRequest().flush({
      content: [
        { id: '1', name: 'Bet365', initialBalance: 100, balance: 150, createdAt: '2026-01-01' },
        { id: '2', name: 'Betano', initialBalance: 300, balance: 210, createdAt: '2026-01-01' },
        { id: '3', name: 'Sportingbet', initialBalance: 50, balance: 50, createdAt: '2026-01-01' },
      ],
      page: 0,
      size: 100,
      totalElements: 3,
      totalPages: 1,
    });
    fixture.detectChanges();

    const badges: HTMLElement[] = fixture.nativeElement.querySelectorAll('[data-testid="betting-houses-delta"]');
    expect(badges).toHaveLength(3);

    expect(badges[0].classList).toContain('badge--positive');
    expect(badges[0].textContent?.trim()).toBe(`+${formatBrl(50)}`);

    expect(badges[1].classList).toContain('badge--negative');
    expect(badges[1].textContent?.trim()).toBe(formatBrl(-90));

    expect(badges[2].classList).toContain('badge--neutral');
    expect(badges[2].textContent?.trim()).toBe(formatBrl(0));
  });

  it('creates a betting house and reloads the list', () => {
    createComponent();
    expectListRequest().flush({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Betano', initialBalance: 200 });
    fixture.componentInstance['submit']();

    const createRequest = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/betting-houses`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ id: '2', name: 'Betano', initialBalance: 200, balance: 200, createdAt: '2026-01-01' });

    expectListRequest().flush({
      content: [{ id: '2', name: 'Betano', initialBalance: 200, balance: 200, createdAt: '2026-01-01' }],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    });

    expect(fixture.componentInstance['form'].value.name).toBeFalsy();
  });

  it('shows the RFC 7807 detail when creation fails (duplicate name)', () => {
    createComponent();
    expectListRequest().flush({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Bet365', initialBalance: 100 });
    fixture.componentInstance['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/betting-houses`)
      .flush({ detail: 'Casa de apostas já cadastrada.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance['formError']()).toBe('Casa de apostas já cadastrada.');
  });
});
