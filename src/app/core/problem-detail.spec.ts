import { HttpErrorResponse } from '@angular/common/http';

import { toProblemDetail } from './problem-detail';

describe('toProblemDetail', () => {
  it('extracts the RFC 7807 fields from the error body', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        type: 'https://docs/errors/invalid-credentials',
        title: 'Credenciais inválidas',
        detail: 'E-mail ou senha incorretos.',
        status: 401,
      },
    });

    expect(toProblemDetail(error)).toEqual({
      type: 'https://docs/errors/invalid-credentials',
      title: 'Credenciais inválidas',
      detail: 'E-mail ou senha incorretos.',
      status: 401,
    });
  });

  it('falls back to the HTTP status when the body has no status field', () => {
    const error = new HttpErrorResponse({ status: 500, error: null });

    expect(toProblemDetail(error)).toEqual({
      type: undefined,
      title: undefined,
      detail: undefined,
      status: 500,
    });
  });
});
