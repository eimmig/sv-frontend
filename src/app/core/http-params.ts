import { HttpParams } from '@angular/common/http';

export function toHttpParams<T extends object>(filter: T): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filter) as [string, string | undefined][]) {
    if (value) {
      params = params.set(key, value);
    }
  }
  return params;
}
