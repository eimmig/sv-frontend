import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface BankrollBalance {
  readonly at: string;
  readonly balance: number;
}

@Injectable({ providedIn: 'root' })
export class BankrollApi {
  private readonly http = inject(HttpClient);

  getBalance(at?: string): Observable<BankrollBalance> {
    return this.http.get<BankrollBalance>(`${environment.apiGatewayUrl}/api/v1/bankroll/balance`, {
      params: at ? new HttpParams().set('at', at) : undefined,
    });
  }
}
