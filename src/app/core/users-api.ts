import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Role } from './auth';
import { environment } from '../../environments/environment';

export interface UserSummary {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly mustChangePassword: boolean;
  readonly createdAt: string;
}

export interface CreateUserInput {
  readonly name: string;
  readonly username: string;
  readonly password: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  list(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${environment.apiGatewayUrl}/api/v1/users`);
  }

  create(input: CreateUserInput): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${environment.apiGatewayUrl}/api/v1/users`, input);
  }

  /** Apaga a organizacao do admin e todos os dados dela (epic-065). Irreversivel. */
  deleteOrganization(): Observable<void> {
    return this.http.delete<void>(`${environment.apiGatewayUrl}/api/v1/organization`);
  }
}
