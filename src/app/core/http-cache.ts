import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

export const CACHE_TTL_MS = 5 * 60 * 1000;
export const SETTLE_WINDOW_MS = 10 * 1000;

interface CacheEntry {
  readonly response: HttpResponse<unknown>;
  readonly storedAt: number;
}

/** In-memory GET response cache, cleared by any mutation or logout (docs/sistema-de-design.md item 17). */
@Injectable({ providedIn: 'root' })
export class HttpCache {
  private readonly entries = new Map<string, CacheEntry>();
  private currentGeneration = 0;
  private clearedAt = Number.NEGATIVE_INFINITY;

  get generation(): number {
    return this.currentGeneration;
  }

  get(key: string): HttpResponse<unknown> | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }
    if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.response.clone({ body: structuredClone(entry.response.body) });
  }

  set(key: string, response: HttpResponse<unknown>, generation: number): void {
    if (generation !== this.currentGeneration || Date.now() - this.clearedAt < SETTLE_WINDOW_MS) {
      return;
    }
    this.entries.set(key, { response: response.clone({ body: structuredClone(response.body) }), storedAt: Date.now() });
  }

  clear(): void {
    this.currentGeneration++;
    this.clearedAt = Date.now();
    this.entries.clear();
  }
}
