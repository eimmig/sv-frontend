import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ChangePassword } from './change-password';
import { environment } from '../../../environments/environment';

describe('ChangePassword', () => {
  let fixture: ComponentFixture<ChangePassword>;
  let httpMock: HttpTestingController;

  const langs = {
    'pt-BR': {
      changePassword: {
        title: 'Trocar senha',
        currentPasswordLabel: 'Senha atual',
        newPasswordLabel: 'Nova senha',
        confirmPasswordLabel: 'Confirmar nova senha',
        passwordMismatchError: 'As senhas não conferem.',
        submit: 'Trocar senha',
        genericError: 'Não foi possível trocar a senha. Tente novamente.',
        successMessage: 'Senha trocada com sucesso.',
      },
    },
  };

  function createComponent() {
    fixture = TestBed.createComponent(ChangePassword);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  function setField(testid: string, value: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(async () => {
    localStorage.removeItem('stakevault.language');
    localStorage.setItem(
      'stakevault.auth',
      JSON.stringify({
        token: 'v4.local.test',
        userId: 'test-user',
        role: 'MEMBER',
        tenantSlug: 'acme',
        mustChangePassword: true,
      }),
    );
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    await TestBed.configureTestingModule({
      imports: [
        ChangePassword,
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
    delete (navigator as { language?: string }).language;
  });

  it('does not call the API until the user submits', () => {
    createComponent();
    httpMock.expectNone(`${environment.apiGatewayUrl}/api/v1/auth/change-password`);
  });

  it('disables submit when the new password and confirmation do not match', () => {
    createComponent();

    setField('change-password-current', 'old-pass');
    setField('change-password-new', 'new-pass-1');
    setField('change-password-confirm', 'new-pass-2');
    fixture.detectChanges();

    const submit: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="change-password-submit"]');
    expect(submit.disabled).toBe(true);
    const mismatch: HTMLElement = fixture.nativeElement.querySelector('[data-testid="change-password-mismatch"]');
    expect(mismatch.textContent).toContain('não conferem');
  });

  it('changes the password, clears the form, shows a confirmation and clears mustChangePassword', () => {
    createComponent();

    setField('change-password-current', 'old-pass');
    setField('change-password-new', 'new-pass');
    setField('change-password-confirm', 'new-pass');
    fixture.detectChanges();

    fixture.componentInstance['submit']();

    const request = httpMock.expectOne(`${environment.apiGatewayUrl}/api/v1/auth/change-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ currentPassword: 'old-pass', newPassword: 'new-pass' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.componentInstance['success']()).toBe(true);
    expect(fixture.componentInstance['form'].value.currentPassword).toBeFalsy();
    const stored = JSON.parse(localStorage.getItem('stakevault.auth')!);
    expect(stored.mustChangePassword).toBe(false);
  });

  it('shows the RFC 7807 detail when the current password is wrong', () => {
    createComponent();

    setField('change-password-current', 'wrong-pass');
    setField('change-password-new', 'new-pass');
    setField('change-password-confirm', 'new-pass');
    fixture.detectChanges();

    fixture.componentInstance['submit']();

    httpMock
      .expectOne(`${environment.apiGatewayUrl}/api/v1/auth/change-password`)
      .flush({ detail: 'A senha atual informada não confere.' }, { status: 401, statusText: 'Unauthorized' });

    expect(fixture.componentInstance['formError']()).toBe('A senha atual informada não confere.');
  });
});
