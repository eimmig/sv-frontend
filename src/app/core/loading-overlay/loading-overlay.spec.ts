import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Loading } from '../loading';
import { LoadingOverlay } from './loading-overlay';

describe('LoadingOverlay', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LoadingOverlay,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              loadingOverlay: { ariaLabel: 'Carregando', title: 'Arka', desc: 'Descrição', tagline: 'GESTÃO DE BANCA' },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(LoadingOverlay);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders nothing while no loading is visible', () => {
    expect(render().querySelector('[data-testid="loading-overlay"]')).toBeNull();
  });

  it('announces the loading state with a localized label while visible', () => {
    TestBed.inject(Loading).visible.set(true);
    const el = render();

    const overlay = el.querySelector('[data-testid="loading-overlay"]');
    expect(overlay?.getAttribute('role')).toBe('status');
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('Carregando');
  });

  it('marks the overlay as leaving during the fade-out', () => {
    const loading = TestBed.inject(Loading);
    loading.visible.set(true);
    loading.leaving.set(true);

    expect(render().querySelector('.loading-overlay--leaving')).not.toBeNull();
  });
});
