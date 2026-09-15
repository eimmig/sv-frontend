import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TeamManager } from './team-manager';
import { environment } from '../../../environments/environment';

describe('TeamManager', () => {
  let fixture: ComponentFixture<TeamManager>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      catalogs: {
        createTitle: 'Nova entrada',
        listTitle: 'Cadastradas',
        nameLabel: 'Nome',
        sportFieldLabel: 'Esporte',
        create: 'Adicionar',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
      },
    },
  };

  function flushInitialLoad(sports: { id: string; name: string }[] = [{ id: 'sp-1', name: 'Futebol' }]) {
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/sports`)
      .flush({ content: sports, page: 0, size: 100, totalElements: sports.length, totalPages: 1 });
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/teams`)
      .flush({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TeamManager,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamManager);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads sports and teams on init', () => {
    flushInitialLoad();
    fixture.detectChanges();

    const options = fixture.componentInstance['options']();
    expect(options.sports).toHaveLength(1);
    expect(options.teams).toHaveLength(0);
  });

  it('renders each team next to its sport name', () => {
    httpMock
      .expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/sports`)
      .flush({
        content: [{ id: 'sp-1', name: 'Futebol' }],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      });
    httpMock.expectOne((req) => req.url === `${environment.apiGatewayUrl}/api/v1/teams`).flush({
      content: [{ id: 'tm-1', name: 'Flamengo', sportId: 'sp-1' }],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    });
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="team-manager-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Flamengo');
    expect(rows[0].textContent).toContain('Futebol');
  });

  it('creates a team scoped by sport and reloads the list', () => {
    flushInitialLoad();
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Flamengo', sportId: 'sp-1' });
    fixture.componentInstance['submit']();

    const createRequest = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/teams`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({ name: 'Flamengo', sportId: 'sp-1' });
    createRequest.flush({ id: 'tm-1', name: 'Flamengo', sportId: 'sp-1' });

    flushInitialLoad();

    expect(fixture.componentInstance['form'].value.name).toBeFalsy();
  });

  it('shows the RFC 7807 detail when creation fails (duplicate name for the sport)', () => {
    flushInitialLoad();
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Flamengo', sportId: 'sp-1' });
    fixture.componentInstance['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/teams`)
      .flush({ detail: 'Time já cadastrado para este esporte.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance['formError']()).toBe('Time já cadastrado para este esporte.');
  });
});
