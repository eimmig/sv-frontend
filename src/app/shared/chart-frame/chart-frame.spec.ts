import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ChartFrame } from './chart-frame';

describe('ChartFrame', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ChartFrame,
        TranslocoTestingModule.forRoot({
          langs: { 'pt-BR': { chartFrame: { helpLabel: 'O que este gráfico mostra?' } } },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  function render(legend = [{ label: 'Lucro líquido (R$)', colorToken: '--color-brand' }]) {
    const fixture = TestBed.createComponent(ChartFrame);
    fixture.componentRef.setInput('title', 'Lucro líquido');
    fixture.componentRef.setInput('help', 'Soma do lucro das apostas liquidadas.');
    fixture.componentRef.setInput('legend', legend);
    fixture.componentRef.setInput('testId', 'profit-chart-frame');
    fixture.detectChanges();
    return fixture;
  }

  it('shows the title and a legend entry colored by its theme token', () => {
    const el = render().nativeElement as HTMLElement;

    expect(el.querySelector('h3')?.textContent).toContain('Lucro líquido');
    const legend = el.querySelector('[data-testid="profit-chart-frame-legend"]');
    expect(legend?.textContent).toContain('Lucro líquido (R$)');
    expect(legend?.querySelector<HTMLElement>('.chart-frame__swatch')?.style.background).toBe('var(--color-brand)');
  });

  it('reveals and hides the explanation from the "?" button, reflecting it in aria-expanded', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLButtonElement>('[data-testid="profit-chart-frame-help-toggle"]')!;

    expect(toggle.getAttribute('aria-label')).toBe('O que este gráfico mostra?');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('[data-testid="profit-chart-frame-help"]')).toBeNull();

    toggle.click();
    fixture.detectChanges();
    const help = el.querySelector('[data-testid="profit-chart-frame-help"]');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(help?.textContent).toContain('Soma do lucro das apostas liquidadas.');
    expect(toggle.getAttribute('aria-controls')).toBe(help?.id);

    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="profit-chart-frame-help"]')).toBeNull();
  });

  it('omits the legend list when there is nothing to label', () => {
    const el = render([]).nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="profit-chart-frame-legend"]')).toBeNull();
  });
});
