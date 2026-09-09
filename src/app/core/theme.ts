import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'stakevault.theme';

function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function storedTheme(): ThemeMode | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

function applyExplicitTheme(mode: ThemeMode | null): void {
  if (mode === null || typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', mode);
}

/**
 * Explicit light/dark toggle, persisted in localStorage, overriding
 * `prefers-color-scheme` once the user has chosen a theme explicitly (see
 * docs/DESIGN-SYSTEM.md "Modos claro e escuro"). Until then, no `data-theme`
 * attribute is set on <html> and the `@media (prefers-color-scheme: dark)`
 * block in styles.scss decides.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  readonly current = signal<ThemeMode>(storedTheme() ?? (prefersDark() ? 'dark' : 'light'));

  constructor() {
    applyExplicitTheme(storedTheme());
  }

  toggle(): void {
    const next: ThemeMode = this.current() === 'dark' ? 'light' : 'dark';
    this.current.set(next);
    applyExplicitTheme(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }
}
