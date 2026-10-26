import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeMock } from '../domain/papers';
import { sampleDataset } from '../data/mock';
import { ApiError } from './errors';
import { createMockApi, LOCAL_USER_ID, migrateLocalData, SCHEMA_VERSION, type StorageLike } from './mock';

function memory(seed: Record<string, unknown> = {}) {
  const m = new Map(Object.entries(seed).map(([k, v]) => ['rounds-' + k, JSON.stringify(v)]));
  const storage: StorageLike = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
  return { storage, get: (k: string) => JSON.parse(m.get('rounds-' + k) ?? 'null') };
}
let n = 0;
const newId = (p: string) => `${p}-${++n}`;
const paper = (i = 0) => normalizeMock(sampleDataset.papers[i]);

describe('mock API', () => {
  let mem: ReturnType<typeof memory>;
  let api: ReturnType<typeof createMockApi>;
  beforeEach(() => {
    n = 0;
    mem = memory();
    api = createMockApi({ storage: mem.storage, newId });
  });

  it('starts a new visitor with defaults and a Reading list', async () => {
    const s = await api.session.load();
    expect(s.user.id).toBe(LOCAL_USER_ID);
    expect(s.preferences.following).toEqual(['neurology', 'cardiology', 'rehabilitation']);
    expect(s.preferences.pinned).toEqual(s.preferences.following);
    expect(s.collections).toEqual([{ id: 'reading', name: 'Reading list', paperKeys: [] }]);
    expect(mem.get('schema-version')).toBe(SCHEMA_VERSION);
  });

  it('serves the sample catalogue and collaboration samples', async () => {
    const c = await api.content.load();
    expect(c.papers).toHaveLength(sampleDataset.papers.length);
    expect(c.papers.every((p) => p.demo)).toBe(true);
    expect((await api.projects.list()).every((p) => p.sample)).toBe(true);
  });

  it('persists preference patches under the prototype keys', async () => {
    const prefs = await api.preferences.update({ following: ['oncology'], scope: 'discover' });
    expect(prefs.following).toEqual(['oncology']);
    expect(mem.get('following')).toEqual(['oncology']);
    expect(mem.get('scope')).toBe('discover');
  });

  it('saves to the Reading list once, files collections, and unsaves everywhere', async () => {
    const p = paper();
    await api.library.save(p);
    await api.library.save(p);
    let s = await api.session.load();
    expect(s.bookmarks.map((b) => b.paperKey)).toEqual(['DEMO:s01']);
    expect(s.collections[0].paperKeys).toEqual(['DEMO:s01']);

    const col = await api.collections.create('Journal club', paper(1));
    s = await api.session.load();
    expect(s.collections.find((c) => c.id === col.id)!.paperKeys).toEqual(['DEMO:s02']);
    expect(s.collections[0].paperKeys).toEqual(['DEMO:s01']); // not also filed in the Reading list

    await api.collections.addPaper(col.id, p);
    await api.library.remove('DEMO:s01');
    s = await api.session.load();
    expect(s.bookmarks.map((b) => b.paperKey)).toEqual(['DEMO:s02']);
    expect(s.collections.flatMap((c) => c.paperKeys)).toEqual(['DEMO:s02']);
  });

  it('moves papers of a deleted collection back to the Reading list and protects it', async () => {
    const col = await api.collections.create('Temp', paper());
    await api.collections.remove(col.id);
    const s = await api.session.load();
    expect(s.collections).toEqual([{ id: 'reading', name: 'Reading list', paperKeys: ['DEMO:s01'] }]);
    await expect(api.collections.remove('reading')).rejects.toBeInstanceOf(ApiError);
  });

  it('stamps author snapshots on discussions and comments', async () => {
    await api.profile.update({ display: 'Dr Test', role: 'Physician', bio: '', interests: '' });
    await api.roleTags.create({ role: 'Physician (MD)', state: 'CA', institution: '' });
    const t = await api.discussions.create({ title: 'Q', specialty: 'Cardiology', sections: { question: 'Why?' }, refs: [], paper: null, paperKey: '', url: '', evidence: null });
    expect(t.author).toEqual({ id: LOCAL_USER_ID, display: 'Dr Test', roles: ['Physician (MD)'] });
    const c = await api.discussions.addComment(t.id, { body: 'Reply', refs: [] });
    expect((await api.discussions.list())[0].comments).toEqual([c]);
    await expect(api.discussions.addComment('missing', { body: 'x', refs: [] })).rejects.toMatchObject({ status: 404 });

    const pc = await api.paperComments.create('DEMO:s01', { body: 'Nice', refs: [] });
    expect(await api.paperComments.list('DEMO:s01')).toEqual([pc]);
    expect((await api.session.load()).myPaperComments).toEqual({ 'DEMO:s01': [pc] });
  });

  it('rejects duplicate role tags and removes by id', async () => {
    const tag = await api.roleTags.create({ role: 'Pharmacist (PharmD)', state: '', institution: '' });
    expect(tag.status).toBe('pending');
    await expect(api.roleTags.create({ role: 'Pharmacist (PharmD)', state: '', institution: '' })).rejects.toMatchObject({ status: 409 });
    await api.roleTags.remove(tag.id);
    expect((await api.session.load()).roleTags).toEqual([]);
  });

  it('sets and clears private ratings, notes, and interests', async () => {
    await api.ratings.set('DEMO:s01', 4);
    await api.notes.save('DEMO:s01', 'note');
    await api.interests.set('DEMO:s01', ['Novel findings']);
    let s = await api.session.load();
    expect([s.ratings, s.notes, s.interests]).toEqual([{ 'DEMO:s01': 4 }, { 'DEMO:s01': 'note' }, { 'DEMO:s01': ['Novel findings'] }]);
    await api.ratings.set('DEMO:s01', null);
    await api.notes.save('DEMO:s01', '');
    await api.interests.set('DEMO:s01', []);
    s = await api.session.load();
    expect([s.ratings, s.notes, s.interests]).toEqual([{}, {}, {}]);
  });

  it('creates projects and jobs owned by the user, listed before samples', async () => {
    const p = await api.projects.create({ title: 'Mine', specialty: 'Neurology', stage: '', needs: '', seeking: [], intro: 'x', tags: [], kind: 'Research project' });
    expect(p).toMatchObject({ sample: false, authorId: LOCAL_USER_ID });
    expect((await api.projects.list())[0].id).toBe(p.id);
    const j = await api.jobs.create({ title: 'RA', org: 'Lab', specialty: 'Cardiology', position: '', type: '', mode: '', contact: '', summary: '' });
    expect((await api.jobs.list())[0]).toEqual(j);
  });

  it('returns fresh objects so UI mutations never leak into storage', async () => {
    const a = await api.session.load();
    a.collections[0].paperKeys.push('X:1');
    expect((await api.session.load()).collections[0].paperKeys).toEqual([]);
  });
});

describe('migrateLocalData', () => {
  it('upgrades prototype-era records once', () => {
    const mem = memory({
      profile: { display: 'Dr Old', role: 'Physician', bio: '', interests: '' },
      threads: [{ title: 'Old', specialty: 'Cardiology', sections: {}, author: 'Dr Old', tags: ['RN'], when: '2026-01-02T00:00:00Z', comments: [{ body: 'r', author: 'Dr Old', when: '2026-01-03T00:00:00Z' }] }],
      'paper-comments': { 'DEMO:s01': [{ body: 'c', refs: [], author: 'Dr Old', tags: [], when: '2026-01-04T00:00:00Z' }] },
      bookmarks: [{ source: 'MED', id: '9', title: 'A randomized controlled trial of X' }],
      collections: [{ id: 'mine', name: 'Mine', keys: [] }],
      interests: ['DEMO:s01'],
      'interest-reasons': { 'DEMO:s01': ['Novel findings'] },
      'role-tags': [{ role: 'RN', state: '', institution: '', status: 'pending', when: '2026-01-01T00:00:00Z' }],
      projects: [{ id: 'mine-1', title: 'P', sample: false }],
    });
    n = 0;
    migrateLocalData(mem.storage, newId);

    const [t] = mem.get('threads');
    expect(t).toMatchObject({ id: 'thread-2', createdAt: '2026-01-02T00:00:00Z', author: { id: LOCAL_USER_ID, display: 'Dr Old', roles: ['RN'] } });
    expect(t).not.toHaveProperty('when');
    expect(t.comments[0]).toMatchObject({ id: 'comment-3', createdAt: '2026-01-03T00:00:00Z' });
    expect(mem.get('paper-comments')['DEMO:s01'][0]).toMatchObject({ paperKey: 'DEMO:s01', author: { display: 'Dr Old' } });
    expect(mem.get('bookmarks')[0]).toMatchObject({ paperKey: 'MED:9', paper: { type: 'rct' } });
    expect(mem.get('collections')).toEqual([
      { id: 'reading', name: 'Reading list', paperKeys: ['MED:9'] },
      { id: 'mine', name: 'Mine', paperKeys: [] },
    ]);
    expect(mem.get('interests')).toEqual({ 'DEMO:s01': ['Novel findings'] });
    expect(mem.get('interest-reasons')).toBeNull();
    expect(mem.get('role-tags')[0]).toMatchObject({ id: 'role-1', createdAt: '2026-01-01T00:00:00Z' });
    expect(mem.get('projects')[0]).toMatchObject({ authorId: LOCAL_USER_ID });

    // Second run is a no-op.
    const before = JSON.stringify(mem.get('threads'));
    migrateLocalData(mem.storage, newId);
    expect(JSON.stringify(mem.get('threads'))).toBe(before);
  });
});
