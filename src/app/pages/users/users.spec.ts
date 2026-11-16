import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

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
        usernameLabel: 'Usuário',
        usernameHint: 'Vira @{{slug}} automaticamente',
        passwordLabel: 'Senha',
        roleLabel: 'Papel',
        create: 'Criar usuário',
        genericError: 'Não foi possível completar a operação. Tente novamente.',
        role: { ADMIN: 'Administrador', MEMBER: 'Membro' },
        deleteOrganization: {
          title: 'Excluir organização',
          description: 'Apaga tudo.',
          confirmLabel: 'Digite {{slug}} para confirmar',
          button: 'Excluir organização',
          genericError: 'Não foi possível excluir a organização. Tente novamente.',
        },
      },
    },
  };

  function createComponent() {
    fixture = TestBed.createComponent(Users);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.setItem(
      'stakevault.auth',
      JSON.stringify({ token: 'v4.local.test', userId: 'admin-1', role: 'ADMIN', tenantSlug: 'acme', mustChangePassword: false }),
    );
    await TestBed.configureTestingModule({
      imports: [
        Users,
        TranslocoTestingModule.forRoot({
          langs,
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('stakevault.auth');
  });

  function deleteButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[data-testid="users-delete-organization-button"]');
  }

  function typeConfirmation(text: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="users-delete-confirmation"]');
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('loads and renders the tenant users on creation', () => {
    createComponent();

    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([
      { id: '1', name: 'Ana Souza', email: 'ana@acme', role: 'ADMIN', mustChangePassword: false, createdAt: '2026-01-01' },
      { id: '2', name: 'Bob', email: 'bob@acme', role: 'MEMBER', mustChangePassword: false, createdAt: '2026-01-01' },
    ]);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="users-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Ana Souza');

    const avatars: HTMLElement[] = fixture.nativeElement.querySelectorAll('[data-testid="users-avatar"]');
    expect(avatars[0].textContent?.trim()).toBe('AS');
    expect(avatars[1].textContent?.trim()).toBe('B');

    const roleBadges: HTMLElement[] = fixture.nativeElement.querySelectorAll('[data-testid="users-role-badge"]');
    expect(roleBadges[0].classList).toContain('users__role--admin');
    expect(roleBadges[1].classList).not.toContain('users__role--admin');
  });

  it('creates a user and reloads the list', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([]);
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Bob', username: 'bob', password: 'secret' });
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

  it('keeps the delete button disabled until the organization identifier is typed', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([]);
    fixture.detectChanges();

    expect(deleteButton().disabled).toBe(true);
    typeConfirmation('acm');
    expect(deleteButton().disabled).toBe(true);
    typeConfirmation('acme');
    expect(deleteButton().disabled).toBe(false);
  });

  it('deletes the organization, ends the session and goes to the login page', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([]);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    typeConfirmation('acme');
    deleteButton().click();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/organization`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(localStorage.getItem('stakevault.auth')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { organizationDeleted: 1 } });
  });

  it('shows the server detail and keeps the session when the deletion fails', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([]);
    fixture.detectChanges();

    typeConfirmation('acme');
    deleteButton().click();
    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/organization`)
      .flush({ detail: 'Um serviço não confirmou a exclusão.' }, { status: 502, statusText: 'Bad Gateway' });
    fixture.detectChanges();

    const error: HTMLElement = fixture.nativeElement.querySelector('[data-testid="users-delete-error"]');
    expect(error.textContent).toContain('Um serviço não confirmou a exclusão.');
    expect(localStorage.getItem('stakevault.auth')).not.toBeNull();
  });

  it('shows the RFC 7807 detail when creation fails', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/users`).flush([]);
    fixture.detectChanges();

    fixture.componentInstance['form'].setValue({ name: 'Bob', username: 'bob', password: 'secret' });
    fixture.componentInstance['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/users`)
      .flush({ detail: 'E-mail já cadastrado.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance['formError']()).toBe('E-mail já cadastrado.');
  });
});
