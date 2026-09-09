import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Catalogs } from './catalogs';

describe('Catalogs', () => {
  let fixture: ComponentFixture<Catalogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Catalogs,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              catalogs: {
                nameLabel: 'Nome',
                create: 'Adicionar',
                genericError: 'Erro',
                sports: { title: 'Esportes' },
                leagues: { title: 'Ligas' },
                markets: { title: 'Mercados' },
                tipsters: { title: 'Tipsters' },
              },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Catalogs);
  });

  it('renders a tab group with the 4 catalog tabs', () => {
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('[data-testid="catalogs-tabs"] .mdc-tab');
    expect(tabs.length).toBeGreaterThanOrEqual(4);
  });
});
