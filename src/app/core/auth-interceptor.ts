import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { Auth } from './auth';
import { Loading } from './loading';
import { toProblemDetail } from './problem-detail';

const INVALID_TOKEN_TYPE_SUFFIX = '/invalid-token';

function isInvalidToken(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 401 &&
    (toProblemDetail(error).type?.endsWith(INVALID_TOKEN_TYPE_SUFFIX) ?? false)
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.session()?.token;
  if (!token) {
    return next(req);
  }
  const loading = inject(Loading);
  const router = inject(Router);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (isInvalidToken(error) && auth.session()?.token === token) {
        auth.expireSession();
        loading.reset();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
