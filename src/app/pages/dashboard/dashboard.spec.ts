import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Dashboard } from './dashboard';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    // jsdom has no ResizeObserver - ngx-echarts' autoResize needs one to init.
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;

    await TestBed.configureTestingModule({
      imports: [
        Dashboard,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              dashboard: {
                filtersTitle: 'Filtros',
                metricsTitle: 'Métricas',
                itemPlaceholder: 'Item {{n}}',
                metricsPlaceholder: 'Placeholder',
              },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders both placeholder panels', () => {
    fixture.detectChanges();
    const panels = (fixture.nativeElement as HTMLElement).querySelectorAll('app-panel');

    expect(panels.length).toBe(2);
  });
});
