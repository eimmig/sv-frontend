import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';

import { HttpCache } from './http-cache';

export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/')) {
    return next(req);
  }
  const cache = inject(HttpCache);

  if (req.method !== 'GET') {
    cache.clear();
    return next(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            cache.clear();
          }
        },
        error: () => cache.clear(),
      }),
    );
  }

  const key = `${req.urlWithParams}|${req.headers.get('Accept-Language') ?? ''}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return of(cached);
  }
  const generation = cache.generation;
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.ok) {
        cache.set(key, event, generation);
      }
    }),
  );
};
