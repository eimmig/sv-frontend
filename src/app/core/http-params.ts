import { HttpParams } from '@angular/common/http';

/** Builds HttpParams from a flat filter object, skipping empty/undefined values - shared by every filtered GET (statistics dashboard, statistics search). */
export function toHttpParams<T extends object>(filter: T): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filter) as [string, string | undefined][]) {
    if (value) {
      params = params.set(key, value);
    }
  }
  return params;
}
