import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Panel } from './panel';

@Component({
  imports: [Panel],
  template: `
    <app-panel [title]="title">
      <button panel-actions type="button">action</button>
      <p>body content</p>
    </app-panel>
  `,
})
class HostComponent {
  title: string | undefined = 'Painel de teste';
}

@Component({
  imports: [Panel],
  template: `
    <app-panel title="Filtros" [collapsible]="true" [collapseKey]="collapseKey" [badge]="badge">
      <input data-testid="kept-input" />
    </app-panel>
  `,
})
class CollapsibleHostComponent {
  collapseKey = 'spec-screen';
  badge: number | null = null;
}

@Component({
  imports: [Panel],
  template: `<app-panel [collapsible]="true" collapseKey="spec-screen"><p>body</p></app-panel>`,
})
class UntitledCollapsibleHostComponent {}

const STORAGE_KEY = 'stakevault.panelCollapsed.spec-screen';

describe('Panel', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [
        HostComponent,
        CollapsibleHostComponent,
        UntitledCollapsibleHostComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              panel: {
                collapse: 'Recolher painel',
                expand: 'Expandir painel',
                activeFilter: '1 filtro aplicado',
                activeFilters: '{{count}} filtros aplicados',
              },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  it('renders the header with title and projected actions when title is set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.panel__header h2')?.textContent).toBe('Painel de teste');
    expect(el.querySelector('[panel-actions]')).toBeTruthy();
    expect(el.querySelector('.panel__body p')?.textContent).toBe('body content');
  });

  it('omits the header entirely when no title is set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.title = undefined;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.panel__header')).toBeNull();
  });

  it('has no collapse toggle unless collapsible', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="panel-collapse-toggle"]')).toBeNull();
    expect(el.querySelector('app-panel')?.classList).not.toContain('panel-host--collapsible');
  });

  it('collapses and expands, keeping the body content and its state in the DOM', () => {
    const fixture = TestBed.createComponent(CollapsibleHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLButtonElement>('[data-testid="panel-collapse-toggle"]')!;
    const body = el.querySelector<HTMLElement>('[data-testid="panel-body"]')!;
    const input = el.querySelector<HTMLInputElement>('[data-testid="kept-input"]')!;
    input.value = 'typed';

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(body.id);
    expect(toggle.getAttribute('aria-label')).toBe('Recolher painel');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('Expandir painel');
    expect(body.hidden).toBe(true);
    expect(el.querySelector('app-panel')?.classList).toContain('panel-host--collapsed');

    toggle.click();
    fixture.detectChanges();

    expect(body.hidden).toBe(false);
    expect(el.querySelector<HTMLInputElement>('[data-testid="kept-input"]')).toBe(input);
    expect(input.value).toBe('typed');
  });

  it('remembers the collapsed state per key', () => {
    const first = TestBed.createComponent(CollapsibleHostComponent);
    first.detectChanges();
    (first.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="panel-collapse-toggle"]')!.click();
    first.detectChanges();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');

    const second = TestBed.createComponent(CollapsibleHostComponent);
    second.detectChanges();
    expect((second.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-testid="panel-body"]')!.hidden).toBe(true);

    const other = TestBed.createComponent(CollapsibleHostComponent);
    other.componentInstance.collapseKey = 'other-screen';
    other.detectChanges();
    expect((other.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-testid="panel-body"]')!.hidden).toBe(false);
  });

  it('gives each panel instance its own body id', () => {
    const first = TestBed.createComponent(CollapsibleHostComponent);
    const second = TestBed.createComponent(CollapsibleHostComponent);
    first.detectChanges();
    second.detectChanges();

    const firstId = (first.nativeElement as HTMLElement).querySelector('[data-testid="panel-body"]')!.id;
    const secondId = (second.nativeElement as HTMLElement).querySelector('[data-testid="panel-body"]')!.id;
    expect(firstId).not.toBe(secondId);
  });

  it('shows the applied filter count only while collapsed and announces it on the toggle', () => {
    const fixture = TestBed.createComponent(CollapsibleHostComponent);
    fixture.componentInstance.badge = 3;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLButtonElement>('[data-testid="panel-collapse-toggle"]')!;

    expect(el.querySelector('[data-testid="panel-badge"]')).toBeNull();

    toggle.click();
    fixture.detectChanges();

    expect(el.querySelector('[data-testid="panel-badge"]')?.textContent?.trim()).toBe('3');
    expect(toggle.getAttribute('aria-label')).toBe('Expandir painel, 3 filtros aplicados');
  });

  it('uses the singular label for a single applied filter', () => {
    const fixture = TestBed.createComponent(CollapsibleHostComponent);
    fixture.componentInstance.badge = 1;
    fixture.detectChanges();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="panel-collapse-toggle"]',
    )!;
    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-label')).toBe('Expandir painel, 1 filtro aplicado');
  });

  it('never keeps a panel without a title collapsed, since it would have no toggle', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const fixture = TestBed.createComponent(UntitledCollapsibleHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector<HTMLElement>('[data-testid="panel-body"]')!.hidden).toBe(false);
    expect(el.querySelector('app-panel')?.classList).not.toContain('panel-host--collapsed');
  });

  it('hides the badge when no filter is applied', () => {
    const fixture = TestBed.createComponent(CollapsibleHostComponent);
    fixture.componentInstance.badge = 0;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('[data-testid="panel-collapse-toggle"]')!.click();
    fixture.detectChanges();

    expect(el.querySelector('[data-testid="panel-badge"]')).toBeNull();
  });
});
