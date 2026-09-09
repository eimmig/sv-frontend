import { TestBed } from '@angular/core/testing';

import { Theme } from './theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.theme');
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('does not set data-theme until the user makes an explicit choice', () => {
    TestBed.inject(Theme);

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('toggle() sets data-theme and persists the choice', () => {
    const theme = TestBed.inject(Theme);

    theme.toggle();

    const first = theme.current();
    expect(document.documentElement.getAttribute('data-theme')).toBe(first);
    expect(localStorage.getItem('stakevault.theme')).toBe(first);

    theme.toggle();

    expect(theme.current()).not.toBe(first);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme.current());
  });

  it('a fresh service picks up a theme persisted by a previous instance', () => {
    localStorage.setItem('stakevault.theme', 'dark');

    const theme = TestBed.inject(Theme);

    expect(theme.current()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
