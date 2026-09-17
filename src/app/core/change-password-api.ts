import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * POST /api/v1/auth/change-password - only sends 'Authorization: Bearer' (authInterceptor), the
 * gateway injects X-User-Id/X-Tenant-Id from the token (docs/services/auth-service.md). 204 No
 * Content on success - the token itself is not reissued (its claims never carried
 * mustChangePassword), so the caller must update the local session separately (Auth.clearMustChangePassword).
 */
@Injectable({ providedIn: 'root' })
export class ChangePasswordApi {
  private readonly http = inject(HttpClient);

  change(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiGatewayUrl}/api/v1/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
