import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { SearchableSelect, SearchableSelectOption, normalizeForSearch } from './searchable-select';

@Component({
  imports: [ReactiveFormsModule, SearchableSelect],
  template: `
    <form [formGroup]="form">
      <app-searchable-select
        formControlName="sportId"
        [options]="options()"
        label="Esporte"
        testId="test-sport"
        [allOptionLabel]="allOptionLabel()"
        [errorMessage]="errorMessage()"
      />
    </form>
  `,
})
class HostComponent {
  private readonly formBuilder = new FormBuilder();
  readonly options = signal<SearchableSelectOption[]>([
    { id: 'sp-1', name: 'Futebol' },
    { id: 'sp-2', name: 'Basquete' },
  ]);
  readonly allOptionLabel = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({ sportId: [''] });
}

describe('SearchableSelect', () => {
  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  function input(fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>): HTMLInputElement {
    return fixture.nativeElement.querySelector('[data-testid="test-sport"]');
  }

  it('strips case and diacritics for matching', () => {
    expect(normalizeForSearch('Brasileirão')).toBe('brasileirao');
    expect(normalizeForSearch('SÃO PAULO')).toBe('sao paulo');
  });

  it('shows the resolved name for the initial form value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form.controls.sportId.setValue('sp-1');
    fixture.detectChanges();

    expect(input(fixture).value).toBe('Futebol');
  });

  it('resolves the name once options() arrive after the initial value was set', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.options.set([]);
    fixture.componentInstance.form.controls.sportId.setValue('sp-1');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input(fixture).value).toBe('');

    fixture.componentInstance.options.set([{ id: 'sp-1', name: 'Futebol' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input(fixture).value).toBe('Futebol');
  });

  it('shows the sentinel allOptionLabel text for an empty value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.allOptionLabel.set('Todos');
    fixture.detectChanges();

    expect(input(fixture).value).toBe('Todos');
  });

  it('filters options by typed text, case+diacritic-insensitive', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.options.set([
      { id: 'l-1', name: 'Brasileirão' },
      { id: 'l-2', name: 'Premier League' },
    ]);
    fixture.detectChanges();

    const field = input(fixture);
    field.focus();
    field.value = 'brasileirao';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    const rendered = document.querySelectorAll('[role="option"]');
    expect(rendered.length).toBe(1);
    expect(rendered[0].textContent?.trim()).toBe('Brasileirão');
  });

  it('selecting an option commits the id to the form control', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const field = input(fixture);
    field.focus();
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    (document.querySelector('[role="option"]') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.form.controls.sportId.value).toBe('sp-1');
    expect(input(fixture).value).toBe('Futebol');
  });

  it('reverts the displayed text on blur without selecting an option', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form.controls.sportId.setValue('sp-1');
    fixture.detectChanges();

    const field = input(fixture);
    field.value = 'texto que nao bate com nenhuma opcao';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    field.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input(fixture).value).toBe('Futebol');
    expect(fixture.componentInstance.form.controls.sportId.value).toBe('sp-1');
  });

  it('renders the error message when set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.errorMessage.set('Campo obrigatorio');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.searchable-select__error')?.textContent?.trim()).toBe('Campo obrigatorio');
  });

  it('renders no error message by default', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.searchable-select__error')).toBeNull();
  });

  it('disables the input when the form control is disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.sportId.disable();
    fixture.detectChanges();

    expect(input(fixture).disabled).toBe(true);
  });
});
