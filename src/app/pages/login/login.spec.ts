import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { Login } from './login';
import { Auth } from '../../core/auth';
import { environment } from '../../../environments/environment';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.removeItem('stakevault.auth');
    await TestBed.configureTestingModule({
      imports: [
        Login,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              login: {
                title: 'Entrar',
                slugLabel: 'Organização',
                emailLabel: 'E-mail',
                passwordLabel: 'Senha',
                submit: 'Entrar',
                genericError: 'Não foi possível entrar. Tente novamente.',
              },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('keeps submit disabled until all fields are valid', () => {
    expect(component['form'].valid).toBe(false);

    component['form'].setValue({ slug: 'acme', email: 'ana@acme', password: 'secret' });

    expect(component['form'].valid).toBe(true);
  });

  it('navigates to /dashboard on successful login', () => {
    component['form'].setValue({ slug: 'acme', email: 'ana@acme', password: 'secret' });

    component['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/auth/login`)
      .flush({ token: 't', userId: 'u', role: 'MEMBER', mustChangePassword: false });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(TestBed.inject(Auth).isAuthenticated()).toBe(true);
  });

  it('shows the RFC 7807 detail on invalid credentials', () => {
    component['form'].setValue({ slug: 'acme', email: 'ana@acme', password: 'wrong' });

    component['submit']();

    httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/auth/login`).flush(
      {
        type: 'https://docs/errors/invalid-credentials',
        title: 'Credenciais inválidas',
        detail: 'E-mail ou senha incorretos.',
        status: 401,
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(component['errorMessage']()).toBe('E-mail ou senha incorretos.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
