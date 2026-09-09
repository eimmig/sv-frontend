import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { Auth } from './auth';

/** Defense in depth for UX only - the backend already returns 403 for non-admin callers. */
export const adminGuard: CanActivateFn = () => {
  if (inject(Auth).isAdmin()) {
    return true;
  }
  return inject(Router).createUrlTree(['/dashboard']);
};
