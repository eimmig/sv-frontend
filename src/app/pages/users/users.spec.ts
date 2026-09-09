import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Users } from './users';
import { environment } from '../../../environments/environment';

describe('Users', () => {
  let fixture: ComponentFixture<Users>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      users: {
        createTitle: 'Novo usuário',
        listTitle: 'Usuários do tenant',
        nameLabel: 'Nome',
        emailLabel: 'E-mail',
        passwordLabel: 'Senha',
        roleLabel: 'Papel',
        create: 'Criar usuário',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
        role: { ADMIN: 'Administrador', MEMBER: 'Membro' },
      },
    },
  };

  function createComponent() {
    fixture = TestBed.createComponent(Users);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Users,
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

  it('loads and renders the tenant users on creation', () => {
    createComponent();

    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([
      { id: '1', name: 'Ana', email: 'ana@acme', role: 'ADMIN', mustChangePassword: false, createdAt: '2026-01-01' },
    ]);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="users-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Ana');
  });

  it('creates a user and reloads the list', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([]);
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Bob', email: 'bob@acme', password: 'secret' });
    fixture.componentInstance['submit']();

    const createRequest = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({
      id: '2',
      name: 'Bob',
      email: 'bob@acme',
      role: 'MEMBER',
      mustChangePassword: false,
      createdAt: '2026-01-01',
    });

    const reloadRequest = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`);
    expect(reloadRequest.request.method).toBe('GET');
    reloadRequest.flush([
      { id: '2', name: 'Bob', email: 'bob@acme', role: 'MEMBER', mustChangePassword: false, createdAt: '2026-01-01' },
    ]);

    expect(fixture.componentInstance['form'].value.name).toBeFalsy();
  });

  it('shows the RFC 7807 detail when creation fails', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([]);
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Bob', email: 'bob@acme', password: 'secret' });
    fixture.componentInstance['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/users`)
      .flush({ detail: 'E-mail já cadastrado.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance['formError']()).toBe('E-mail já cadastrado.');
  });
});
