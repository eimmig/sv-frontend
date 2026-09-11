import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemDetail {
  readonly type?: string;
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
}

/**
 * Extracts the RFC 7807 (application/problem+json) body Java services return
 * (see docs/API-CONTRACTS.md "Formato de erro") - title/detail already arrive
 * localized per the Accept-Language sent by acceptLanguageInterceptor.
 */
export function toProblemDetail(error: HttpErrorResponse): ProblemDetail {
  const body = error.error as Partial<ProblemDetail> | null;
  return {
    type: body?.type,
    title: body?.title,
    detail: body?.detail,
    status: body?.status ?? error.status,
  };
}
