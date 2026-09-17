import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface SearchableSelectOption {
  readonly id: string;
  readonly name: string;
}

/** Case+diacritic-insensitive match ("brasileirao" finds "Brasileirão") - no precedent in this app, first free-text catalog filter. */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase();
}

/**
 * Drop-in replacement for mat-select on catalog filter fields (sport/league/market/tipster/
 * team/betting-house) - same formControlName usage via ControlValueAccessor, but filters the
 * option list as the user types instead of a closed dropdown (feat-031).
 */
@Component({
  imports: [MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  selector: 'app-searchable-select',
  styleUrl: './searchable-select.scss',
  templateUrl: './searchable-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelect),
      multi: true,
    },
  ],
})
export class SearchableSelect implements ControlValueAccessor {
  readonly options = input<SearchableSelectOption[]>([]);
  readonly label = input<string>('');
  readonly testId = input<string>('');
  /** Sentinel option (id '') rendered first, e.g. "Todos"/"Nenhum" - omit to require a real selection. */
  readonly allOptionLabel = input<string | null>(null);
  /** Already-resolved (transloco'd) validation message - rendered as mat-error inside this field's own mat-form-field. */
  readonly errorMessage = input<string | null>(null);

  protected readonly disabled = signal(false);
  private readonly committedId = signal('');
  /** null = not being edited right now, display resolves from committedId(); a string once the user starts typing. */
  private readonly typedQuery = signal<string | null>(null);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly optionsWithSentinel = computed(() => {
    const sentinelLabel = this.allOptionLabel();
    return sentinelLabel !== null ? [{ id: '', name: sentinelLabel }, ...this.options()] : this.options();
  });

  protected readonly displayValue = computed(() => this.typedQuery() ?? this.resolveName(this.committedId()));

  protected readonly filteredOptions = computed(() => {
    const needle = normalizeForSearch(this.typedQuery() ?? '');
    return this.optionsWithSentinel().filter((option) => normalizeForSearch(option.name).includes(needle));
  });

  protected onQueryInput(event: Event): void {
    this.typedQuery.set((event.target as HTMLInputElement).value);
  }

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as string;
    this.committedId.set(id);
    this.typedQuery.set(null);
    this.onChange(id);
  }

  protected onBlur(): void {
    this.typedQuery.set(null);
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.committedId.set(value ?? '');
    this.typedQuery.set(null);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  private resolveName(id: string): string {
    return this.optionsWithSentinel().find((option) => option.id === id)?.name ?? '';
  }
}
