import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { CatalogManager } from './catalog-manager';
import { environment } from '../../../environments/environment';

describe('CatalogManager', () => {
  let fixture: ComponentFixture<CatalogManager>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      catalogs: {
        nameLabel: 'Nome',
        create: 'Adicionar',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function createComponent(resourcePath: string) {
    fixture = TestBed.createComponent(CatalogManager);
    fixture.componentRef.setInput('resourcePath', resourcePath);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  function expectListRequest(resourcePath: string) {
    return httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/${resourcePath}`);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CatalogManager,
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

  it('loads and renders the catalog entries for the given resourcePath on init', () => {
    createComponent('sports');

    expectListRequest('sports').flush({
      content: [{ id: '1', name: 'Futebol' }],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    });
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="catalog-manager-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Futebol');
  });

  it('creates an entry and reloads the list', () => {
    createComponent('leagues');
    expectListRequest('leagues').flush({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Brasileirão' });
    fixture.componentInstance['submit']();

    const createRequest = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/leagues`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ id: '1', name: 'Brasileirão' });

    expectListRequest('leagues').flush({
      content: [{ id: '1', name: 'Brasileirão' }],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    });

    expect(fixture.componentInstance['form'].value.name).toBeFalsy();
  });

  it('shows the RFC 7807 detail when creation fails (duplicate name)', () => {
    createComponent('markets');
    expectListRequest('markets').flush({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Handicap' });
    fixture.componentInstance['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/markets`)
      .flush({ detail: 'Mercado já cadastrado.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance['formError']()).toBe('Mercado já cadastrado.');
  });
});
