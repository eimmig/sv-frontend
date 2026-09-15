import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { PagedResponse } from './paged-response';
import { environment } from '../../environments/environment';

export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
}

const MAX_PAGE_SIZE = 100;

/**
 * sports/leagues/markets/tipsters (bets-service) are structurally identical
 * catalogs ({id,name} in, {id,name} out, same PagedResponse envelope) - a
 * parameterized factory instead of 4 near-copies of the same class. Takes
 * `http` as a parameter (rather than calling inject() itself) so it can be
 * built from ngOnInit, once `resourcePath` (a required input) is actually
 * available - signal inputs aren't guaranteed set yet in the constructor.
 */
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

/**
 * Not structurally identical to the 4 catalogs above (bets-service feat-016/017): TEAM has a
 * required sportId FK, so it needs its own {name, sportId} create body instead of reusing
 * catalogApi's {name}-only shape.
 */
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
