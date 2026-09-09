import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { ActiveLocale } from './active-locale';

export const acceptLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  const activeLocale = inject(ActiveLocale);
  return next(
    req.clone({
      setHeaders: { 'Accept-Language': activeLocale.current() },
    }),
  );
};
