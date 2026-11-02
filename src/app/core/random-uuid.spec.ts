import { randomUuid } from './random-uuid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUuid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds a version 4 UUID from getRandomValues outside a secure context', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });

    const values = Array.from({ length: 50 }, () => randomUuid());

    values.forEach((value) => expect(value).toMatch(UUID_V4));
    expect(new Set(values).size).toBe(values.length);
  });

  it('sets the version and variant bits even when every random byte is 0xff', () => {
    vi.stubGlobal('crypto', { getRandomValues: (bytes: Uint8Array) => bytes.fill(0xff) });

    expect(randomUuid()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });
});
