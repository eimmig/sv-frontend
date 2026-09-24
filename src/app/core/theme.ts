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
  document.documentElement.dataset['theme'] = mode;
}

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
