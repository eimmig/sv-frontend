import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { Auth } from './auth';

export const adminGuard: CanActivateFn = () => {
  if (inject(Auth).isAdmin()) {
    return true;
  }
  return inject(Router).createUrlTree(['/dashboard']);
};
