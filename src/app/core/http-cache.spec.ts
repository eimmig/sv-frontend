import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CACHE_TTL_MS, HttpCache, SETTLE_WINDOW_MS } from './http-cache';

describe('HttpCache', () => {
  let cache: HttpCache;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    cache = TestBed.inject(HttpCache);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a stored response until the TTL expires', () => {
    vi.useFakeTimers();
    cache.set('k', new HttpResponse({ body: { total: 1 } }), cache.generation);

    vi.advanceTimersByTime(CACHE_TTL_MS);
    expect(cache.get('k')?.body).toEqual({ total: 1 });

    vi.advanceTimersByTime(1);
    expect(cache.get('k')).toBeUndefined();
  });

  it('hands out a copy, so a caller mutating the body never changes the cache', () => {
    cache.set('k', new HttpResponse({ body: [3, 1, 2] }), cache.generation);

    (cache.get('k')?.body as number[]).sort((a, b) => a - b);

    expect(cache.get('k')?.body).toEqual([3, 1, 2]);
  });

  it('ignores a response whose request started before the last clear', () => {
    const generation = cache.generation;
    cache.clear();

    cache.set('k', new HttpResponse({ body: 'stale' }), generation);

    expect(cache.get('k')).toBeUndefined();
  });

  it('stores nothing right after a clear, while the backend may still be catching up', () => {
    vi.useFakeTimers();
    cache.clear();

    cache.set('k', new HttpResponse({ body: 'maybe stale' }), cache.generation);
    expect(cache.get('k')).toBeUndefined();

    vi.advanceTimersByTime(SETTLE_WINDOW_MS);
    cache.set('k', new HttpResponse({ body: 'settled' }), cache.generation);
    expect(cache.get('k')?.body).toBe('settled');
  });

  it('clear() drops every entry', () => {
    cache.set('a', new HttpResponse({ body: 1 }), cache.generation);
    cache.set('b', new HttpResponse({ body: 2 }), cache.generation);

    cache.clear();

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});
