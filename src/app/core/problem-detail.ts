import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemDetail {
  readonly type?: string;
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
}

export function toProblemDetail(error: HttpErrorResponse): ProblemDetail {
  const body = error.error as Partial<ProblemDetail> | null;
  return {
    type: body?.type,
    title: body?.title,
    detail: body?.detail,
    status: body?.status ?? error.status,
  };
}
