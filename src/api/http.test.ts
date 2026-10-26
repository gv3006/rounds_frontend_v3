import { describe, expect, it, vi } from 'vitest';
import { ApiError, describeError } from './errors';
import { createHttpApi, createHttpClient } from './http';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('http client', () => {
  it('sends JSON with credentials to the base URL', async () => {
    const fetch = vi.fn(async () => json(200, { ok: true }));
    const request = createHttpClient({ baseUrl: 'https://api.test/v1', timeoutMs: 1000, fetch });
    await expect(request('POST', '/discussions', { title: 'Q' })).resolves.toEqual({ ok: true });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/v1/discussions');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', body: '{"title":"Q"}' });
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('maps error bodies to ApiError', async () => {
    const request = createHttpClient({
      baseUrl: 'https://api.test',
      timeoutMs: 1000,
      fetch: async () => json(422, { error: { code: 'invalid', message: 'Title is required' } }),
    });
    const err = await request('POST', '/discussions', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, code: 'invalid', message: 'Title is required' });
    expect(describeError(err)).toBe('Title is required');
  });

  it('reports network failures and timeouts as status 0', async () => {
    const offline = createHttpClient({ baseUrl: 'https://api.test', timeoutMs: 1000, fetch: async () => Promise.reject(new TypeError('Failed to fetch')) });
    await expect(offline('GET', '/me')).rejects.toMatchObject({ status: 0, code: 'network' });

    const slow = createHttpClient({
      baseUrl: 'https://api.test',
      timeoutMs: 10,
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))),
    });
    await expect(slow('GET', '/me')).rejects.toMatchObject({ status: 0, code: 'timeout' });
  });

  it('refuses to run without a base URL', async () => {
    await expect(createHttpClient({ baseUrl: '', timeoutMs: 10 })('GET', '/me')).rejects.toMatchObject({ code: 'config' });
  });

  it('returns undefined for 204 responses', async () => {
    const request = createHttpClient({ baseUrl: 'https://api.test', timeoutMs: 1000, fetch: async () => new Response(null, { status: 204 }) });
    await expect(request('DELETE', '/me/bookmarks/x')).resolves.toBeUndefined();
  });
});

describe('http adapter', () => {
  it('encodes paper keys in paths and uses DELETE to clear values', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    const api = createHttpApi({ baseUrl: 'https://api.test', timeoutMs: 1000, fetch });
    await api.ratings.set('DOI:10.1/a b', null);
    await api.notes.save('MED:1', 'text');
    const calls = fetch.mock.calls as unknown as [string, RequestInit][];
    expect(calls.map(([u, i]) => `${i.method} ${u}`)).toEqual([
      'DELETE https://api.test/me/ratings/DOI%3A10.1%2Fa%20b',
      'PUT https://api.test/me/notes/MED%3A1',
    ]);
  });

  it('assembles the session from the per-resource endpoints', async () => {
    const bodies: Record<string, unknown> = {
      '/me': { id: 'u1', display: 'A', role: '', bio: '', interests: '' },
      '/me/role-tags': { items: [] },
      '/me/preferences': { following: [] },
      '/me/bookmarks': { items: [] },
      '/me/collections': { items: [{ id: 'reading', name: 'Reading list', paperKeys: [] }] },
      '/me/appraisals': {},
      '/me/ratings': {},
      '/me/notes': {},
      '/me/interests': {},
      '/me/paper-comments': { items: [{ id: 'c1', paperKey: 'MED:1' }, { id: 'c2', paperKey: 'MED:1' }] },
    };
    const api = createHttpApi({ baseUrl: 'https://x', timeoutMs: 1000, fetch: async (url) => json(200, bodies[String(url).slice('https://x'.length)]) });
    const s = await api.session.load();
    expect(s.user.id).toBe('u1');
    expect(s.collections[0].id).toBe('reading');
    expect(s.myPaperComments['MED:1'].map((c) => c.id)).toEqual(['c1', 'c2']);
  });
});
