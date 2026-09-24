import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { PagedResponse } from './paged-response';
import { environment } from '../../environments/environment';

export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
}

const MAX_PAGE_SIZE = 100;

export function catalogApi(
  http: HttpClient,
  resourcePath: string,
): {
  list(): Observable<CatalogEntry[]>;
  create(name: string): Observable<CatalogEntry>;
} {
  const url = `${environment.apiGatewayUrl}/api/v1/${resourcePath}`;

  return {
    list: () =>
      http
        .get<PagedResponse<CatalogEntry>>(url, {
          params: new HttpParams().set('page', 0).set('size', MAX_PAGE_SIZE),
        })
        .pipe(map((page) => page.content)),
    create: (name: string) => http.post<CatalogEntry>(url, { name }),
  };
}

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly sportId: string;
}

export function teamsApi(http: HttpClient): {
  list(): Observable<Team[]>;
  create(name: string, sportId: string): Observable<Team>;
} {
  const url = `${environment.apiGatewayUrl}/api/v1/teams`;

  return {
    list: () =>
      http
        .get<PagedResponse<Team>>(url, { params: new HttpParams().set('page', 0).set('size', MAX_PAGE_SIZE) })
        .pipe(map((page) => page.content)),
    create: (name: string, sportId: string) => http.post<Team>(url, { name, sportId }),
  };
}
