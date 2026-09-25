import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { Loading } from './loading';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/')) {
    return next(req);
  }
  const loading = inject(Loading);
  const epoch = loading.begin();
  return next(req).pipe(finalize(() => loading.end(epoch)));
};
