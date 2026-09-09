import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Locale = 'pt-BR' | 'en-US' | 'es';

const STORAGE_KEY = 'stakevault.language';
const SUPPORTED_LOCALES: readonly Locale[] = ['pt-BR', 'en-US', 'es'];

function storedLocale(): Locale | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const value = localStorage.getItem(STORAGE_KEY);
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : null;
}

function browserLocale(): Locale {
  const language = typeof navigator === 'undefined' ? '' : navigator.language;
  if (language.startsWith('pt')) {
    return 'pt-BR';
  }
  if (language.startsWith('es')) {
    return 'es';
  }
  if (language.startsWith('en')) {
    return 'en-US';
  }
  return 'pt-BR';
}

/**
 * Explicit locale, persisted in localStorage, overriding the browser locale
 * once the user has chosen one explicitly (see docs/CONVENTIONS.md
 * "Internacionalização (i18n)"). Drives TranslocoService's active lang.
 */
@Injectable({ providedIn: 'root' })
export class Language {
  private readonly transloco = inject(TranslocoService);

  readonly current = signal<Locale>(storedLocale() ?? browserLocale());

  constructor() {
    this.transloco.setActiveLang(this.current());
  }

  set(locale: Locale): void {
    this.current.set(locale);
    this.transloco.setActiveLang(locale);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
    }
  }
}
