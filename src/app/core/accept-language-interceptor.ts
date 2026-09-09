import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { Language } from './language';

export const acceptLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  const language = inject(Language);
  return next(
    req.clone({
      setHeaders: { 'Accept-Language': language.current() },
    }),
  );
};
