import { HttpErrorResponse } from '@angular/common/http';
import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';

import { toProblemDetail } from './problem-detail';

/**
 * Runs a read request, writing the result (or the RFC 7807 detail on error)
 * into the given signals - the load-list half of every "list + create"
 * screen (users, betting houses, and future paginated resources).
 */
export function loadInto<T>(
  request: Observable<T>,
  data: WritableSignal<T>,
  error: WritableSignal<string | null>,
  genericError: () => string,
): void {
  request.subscribe({
    next: (result) => {
      data.set(result);
      error.set(null);
    },
    error: (httpError: HttpErrorResponse) => {
      const problem = toProblemDetail(httpError);
      error.set(problem.detail ?? genericError());
    },
  });
}

/**
 * Runs a write request, toggling the given `submitting` signal and writing
 * the RFC 7807 detail into `error` on failure - the submit half of every
 * "list + create" screen.
 */
export function submitForm<T>(
  request: Observable<T>,
  submitting: WritableSignal<boolean>,
  error: WritableSignal<string | null>,
  genericError: () => string,
  onSuccess: (result: T) => void,
): void {
  submitting.set(true);
  error.set(null);
  request.subscribe({
    next: (result) => {
      submitting.set(false);
      onSuccess(result);
    },
    error: (httpError: HttpErrorResponse) => {
      submitting.set(false);
      const problem = toProblemDetail(httpError);
      error.set(problem.detail ?? genericError());
    },
  });
}
