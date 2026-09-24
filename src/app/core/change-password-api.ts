import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

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
