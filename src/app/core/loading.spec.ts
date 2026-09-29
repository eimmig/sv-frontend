import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FADE_MS, Loading, SHOW_DELAY_MS } from './loading';

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

  it('starts fading out as soon as the request ends, with no artificial minimum', () => {
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS + 100);
    loading.end();

    expect(loading.leaving()).toBe(true);
    expect(loading.visible()).toBe(true);

    vi.advanceTimersByTime(FADE_MS);
    expect(loading.visible()).toBe(false);
    expect(loading.leaving()).toBe(false);
  });

  it('stays visible while any of several overlapping requests is still pending', () => {
    loading.begin();
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    loading.end();
    vi.advanceTimersByTime(FADE_MS);

    expect(loading.visible()).toBe(true);

    loading.end();
    vi.runAllTimers();
    expect(loading.visible()).toBe(false);
  });

  it('cancels the exit when a new request starts while the overlay is leaving', () => {
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    loading.end();
    expect(loading.leaving()).toBe(true);

    loading.begin();
    vi.advanceTimersByTime(FADE_MS * 2);

    expect(loading.visible()).toBe(true);
    expect(loading.leaving()).toBe(false);
  });

  it('hides right away under prefers-reduced-motion, with no fade to wait for', () => {
    mockReducedMotion(true);
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    loading.end();
    vi.advanceTimersByTime(1);

    expect(loading.visible()).toBe(false);
  });

  it('reset() hides a visible overlay at once and forgets pending requests', () => {
    loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    expect(loading.visible()).toBe(true);

    loading.reset();

    expect(loading.visible()).toBe(false);
    expect(loading.leaving()).toBe(false);

    loading.end();
    vi.advanceTimersByTime(FADE_MS);
    expect(loading.visible()).toBe(false);
  });

  it('reset() cancels an overlay that was about to show', () => {
    loading.begin();

    loading.reset();
    vi.advanceTimersByTime(SHOW_DELAY_MS);

    expect(loading.visible()).toBe(false);
  });

  it('ignores the end of a request that started before reset()', () => {
    const stale = loading.begin();
    loading.reset();
    const current = loading.begin();
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    expect(loading.visible()).toBe(true);

    loading.end(stale);
    vi.advanceTimersByTime(FADE_MS);
    expect(loading.visible()).toBe(true);

    loading.end(current);
    vi.advanceTimersByTime(FADE_MS);
    expect(loading.visible()).toBe(false);
  });
});
