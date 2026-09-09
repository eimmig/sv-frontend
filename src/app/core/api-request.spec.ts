import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';

import { loadInto, submitForm } from './api-request';

describe('loadInto', () => {
  it('writes the result and clears the error on success', () => {
    const data = signal<string[] | null>(null);
    const error = signal<string | null>('stale');
    const request = new Subject<string[]>();

    loadInto(request, data, error, () => 'generic');
    request.next(['a', 'b']);

    expect(data()).toEqual(['a', 'b']);
    expect(error()).toBeNull();
  });

  it('writes the RFC 7807 detail on error', () => {
    const data = signal<string[] | null>(null);
    const error = signal<string | null>(null);
    const request = new Subject<string[]>();

    loadInto(request, data, error, () => 'generic');
    request.error(new HttpErrorResponse({ status: 500, error: { detail: 'boom' } }));

    expect(error()).toBe('boom');
  });

  it('falls back to the generic error when the body has no detail', () => {
    const data = signal<string[] | null>(null);
    const error = signal<string | null>(null);
    const request = new Subject<string[]>();

    loadInto(request, data, error, () => 'generic');
    request.error(new HttpErrorResponse({ status: 500, error: null }));

    expect(error()).toBe('generic');
  });
});

describe('submitForm', () => {
  it('toggles submitting and calls onSuccess on success', () => {
    const submitting = signal(false);
    const error = signal<string | null>('stale');
    const request = new Subject<{ id: string }>();
    let received: { id: string } | undefined;

    submitForm(request, submitting, error, () => 'generic', (result) => (received = result));
    expect(submitting()).toBe(true);

    request.next({ id: '1' });

    expect(submitting()).toBe(false);
    expect(error()).toBeNull();
    expect(received).toEqual({ id: '1' });
  });

  it('toggles submitting off and sets the RFC 7807 detail on error', () => {
    const submitting = signal(false);
    const error = signal<string | null>(null);
    const request = new Subject<{ id: string }>();

    submitForm(request, submitting, error, () => 'generic', () => {});
    request.error(new HttpErrorResponse({ status: 409, error: { detail: 'duplicate' } }));

    expect(submitting()).toBe(false);
    expect(error()).toBe('duplicate');
  });
});
