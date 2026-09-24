import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FADE_MS, Loading, SEQUENCE_MS, SHOW_DELAY_MS } from './loading';

describe('Loading', () => {
  let loading: Loading;

  function mockReducedMotion(matches: boolean): void {
    vi.stubGlobal('matchMedia', () => ({ matches }));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    mockReducedMotion(false);
    TestBed.configureTestingModule({});
    loading = TestBed.inject(Loading);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('never shows the overlay for a request shorter than the show delay', () => {
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS - 1);
    loading.end();
    vi.runAllTimers();

    expect(loading.visible()).toBe(false);
  });

  it('shows the overlay once a request outlasts the show delay', () => {
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);

    expect(loading.visible()).toBe(true);
  });

  it('keeps the overlay until the logo sequence finishes, then fades out', () => {
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS + 100);
    loading.end();

    vi.advanceTimersByTime(SEQUENCE_MS - 101);
    expect(loading.visible()).toBe(true);
    expect(loading.leaving()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(loading.leaving()).toBe(true);

    vi.advanceTimersByTime(FADE_MS);
    expect(loading.visible()).toBe(false);
    expect(loading.leaving()).toBe(false);
  });

  it('stays visible while any of several overlapping requests is still pending', () => {
    loading.begin();
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    loading.end();
    vi.advanceTimersByTime(SEQUENCE_MS + FADE_MS);

    expect(loading.visible()).toBe(true);

    loading.end();
    vi.runAllTimers();
    expect(loading.visible()).toBe(false);
  });

  it('cancels the exit when a new request starts while the overlay is leaving', () => {
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    loading.end();
    vi.advanceTimersByTime(SEQUENCE_MS);
    expect(loading.leaving()).toBe(true);

    loading.begin();
    vi.advanceTimersByTime(FADE_MS * 2);

    expect(loading.visible()).toBe(true);
    expect(loading.leaving()).toBe(false);
  });

  it('hides right away under prefers-reduced-motion, with no sequence to wait for', () => {
    mockReducedMotion(true);
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    loading.end();
    vi.advanceTimersByTime(1);

    expect(loading.visible()).toBe(false);
  });
});
