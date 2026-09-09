import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MustChangePasswordBanner } from './must-change-password-banner';
import { Auth } from '../auth';

describe('MustChangePasswordBanner', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.auth');
    TestBed.configureTestingModule({
      imports: [
        MustChangePasswordBanner,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': { mustChangePassword: { message: 'Troque sua senha', dismiss: 'Entendi' } },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient()],
    });
  });

  function session(mustChangePassword: boolean) {
    TestBed.inject(Auth).session.set({
      token: 't',
      userId: 'u',
      role: 'MEMBER',
      tenantSlug: 'acme',
      mustChangePassword,
    });
  }

  it('is hidden when mustChangePassword is false', () => {
    session(false);
    const fixture = TestBed.createComponent(MustChangePasswordBanner);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="must-change-password-banner"]')).toBeNull();
  });

  it('shows and can be dismissed for the session when mustChangePassword is true', () => {
    session(true);
    const fixture = TestBed.createComponent(MustChangePasswordBanner);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="must-change-password-banner"]')).toBeTruthy();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="must-change-password-dismiss"]')
      ?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="must-change-password-banner"]')).toBeNull();
  });
});
