import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface SearchableSelectOption {
  readonly id: string;
  readonly name: string;
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase();
}

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
  readonly allOptionLabel = input<string | null>(null);
  readonly errorMessage = input<string | null>(null);

  protected readonly disabled = signal(false);
  private readonly committedId = signal('');
  private readonly typedQuery = signal<string | null>(null);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly optionsWithSentinel = computed(() => {
    const sentinelLabel = this.allOptionLabel();
    const base = this.options() ?? [];
    return sentinelLabel !== null ? [{ id: '', name: sentinelLabel }, ...base] : base;
  });

  protected readonly displayValue = computed(() => this.typedQuery() ?? this.resolveName(this.committedId()));

  protected readonly filteredOptions = computed(() => {
    const needle = normalizeForSearch(this.typedQuery() ?? '');
    return this.optionsWithSentinel().filter((option) => normalizeForSearch(option.name).includes(needle));
  });

  protected onQueryInput(event: Event): void {
    this.typedQuery.set((event.target as HTMLInputElement).value);
  }

  protected onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
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
