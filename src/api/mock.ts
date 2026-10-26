/* Mock adapter: the fictional sample dataset plus this browser's localStorage, behind the same RoundsApi
   a real backend implements. Storage keys keep the prototype's `rounds-*` names so existing data survives;
   migrateLocalData() upgrades older records (ids, timestamps, author snapshots) once. */
import { defaultJournalIds, journals } from '../data/catalog';
import { defaultProfile, sampleDataset, sampleJobs, sampleProjects } from '../data/mock';
import { normalizeLive, normalizeMock, paperKey } from '../domain/papers';
import type {
  Appraisal,
  AuthorSnapshot,
  Bookmark,
  Collection,
  Comment,
  Job,
  Paper,
  PaperComment,
  Preferences,
  Profile,
  Project,
  RoleTag,
  Thread,
  User,
} from '../types';
import { ApiError } from './errors';
import type { RoundsApi, SessionState } from './types';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface MockOptions {
  storage?: StorageLike;
  latencyMs?: number;
  /** Override for tests. */
  newId?: (prefix: string) => string;
}

export const LOCAL_USER_ID = 'local';
export const SCHEMA_VERSION = 1;
const PREFIX = 'rounds-';
export const READING_LIST_ID = 'reading';

const defaultNewId = (prefix: string) =>
  prefix + '-' + (globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

// Preferences live under the prototype's original keys.
const prefKeys: Record<keyof Preferences, string> = {
  following: 'following',
  pinned: 'pinned-specs',
  feedJournals: 'journal-feed',
  specJournals: 'spec-journals',
  journalTopics: 'journal-topics',
  specJournalTopics: 'spec-journal-topics',
  dataMode: 'data-mode',
  scope: 'scope',
};
const DEFAULT_FOLLOWING = ['neurology', 'cardiology', 'rehabilitation'];

function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
}
function browserStorage(): StorageLike {
  try {
    return globalThis.localStorage ?? memoryStorage();
  } catch {
    return memoryStorage(); // storage blocked (privacy mode, sandboxed frame)
  }
}

function createStore(storage: StorageLike) {
  return {
    read<T>(key: string, fallback: T): T {
      try {
        return (JSON.parse(storage.getItem(PREFIX + key) as string) as T) ?? fallback;
      } catch {
        return fallback;
      }
    },
    // Like the prototype, a full or blocked store doesn't break the session: the UI keeps its in-memory copy.
    write(key: string, val: unknown) {
      try {
        storage.setItem(PREFIX + key, JSON.stringify(val));
      } catch (err) {
        console.warn('Rounds: could not persist', key, err);
      }
    },
    remove(key: string) {
      try {
        storage.removeItem(PREFIX + key);
      } catch {
        /* ignore */
      }
    },
  };
}
type Store = ReturnType<typeof createStore>;

/* ---------- One-time upgrade of prototype-era localStorage ---------- */

type Legacy = Record<string, any>;

export function migrateLocalData(storage: StorageLike, newId: (prefix: string) => string = defaultNewId): void {
  const db = createStore(storage);
  if (db.read('schema-version', 0) >= SCHEMA_VERSION) return;
  const now = new Date().toISOString(),
    profile = db.read<Profile>('profile', defaultProfile);
  const author = (x: Legacy): AuthorSnapshot =>
    x.author && typeof x.author === 'object' ? x.author : { id: LOCAL_USER_ID, display: x.author || profile.display, roles: x.tags || [] };
  const comment = (c: Legacy): Comment => ({
    id: c.id || newId('comment'),
    body: c.body || '',
    refs: c.refs || [],
    author: author(c),
    createdAt: c.createdAt || c.when || now,
  });

  db.write(
    'role-tags',
    db.read<Legacy[]>('role-tags', []).map(
      (r): RoleTag => ({
        id: r.id || newId('role'),
        role: r.role,
        state: r.state || '',
        institution: r.institution || '',
        status: r.status || 'pending',
        createdAt: r.createdAt || r.when || now,
      }),
    ),
  );

  db.write(
    'threads',
    db.read<Legacy[]>('threads', []).map((t): Thread => {
      const { when: _when, tags: _tags, author: _author, ...rest } = t;
      return {
        ...rest,
        id: t.id || newId('thread'),
        title: t.title || '',
        specialty: t.specialty || '',
        sections: t.sections || {},
        refs: t.refs || [],
        paper: t.paper || null,
        paperKey: t.paperKey || '',
        url: t.url || '',
        evidence: t.evidence || null,
        author: author(t),
        createdAt: t.createdAt || t.when || now,
        comments: (t.comments || []).map(comment),
      };
    }),
  );

  const pc = db.read<Record<string, Legacy[]>>('paper-comments', {});
  db.write(
    'paper-comments',
    Object.fromEntries(Object.entries(pc).map(([k, list]) => [k, list.map((c): PaperComment => ({ ...comment(c), paperKey: k }))])),
  );

  // Bookmarks used to be bare paper objects (some saved before normalization existed).
  const bookmarks = db.read<Legacy[]>('bookmarks', []).map((b): Bookmark => {
    if (b.paperKey && b.paper) return b as Bookmark;
    const paper = (b.type ? b : normalizeLive(b as Paper)) as Paper;
    return { paperKey: paperKey(paper), paper, savedAt: '' };
  });
  db.write('bookmarks', bookmarks);

  const collections = db
    .read<Legacy[]>('collections', [])
    .map((c): Collection => ({ id: c.id, name: c.name, paperKeys: c.paperKeys || c.keys || [] }));
  db.write('collections', withReadingList(collections, bookmarks));

  const interests = db.read<unknown>('interests', {});
  if (Array.isArray(interests)) {
    const reasons = db.read<Record<string, string[]>>('interest-reasons', {});
    db.write('interests', Object.fromEntries(interests.map((k: string) => [k, reasons[k] || []])));
    db.remove('interest-reasons');
  }

  for (const key of ['projects', 'jobs'])
    db.write(
      key,
      db.read<Legacy[]>(key, []).map((x) => ({ ...x, sample: false, authorId: x.authorId || LOCAL_USER_ID, createdAt: x.createdAt || now })),
    );

  db.write('schema-version', SCHEMA_VERSION);
}

/** The Reading list always exists, and every bookmark not in any collection belongs to it. */
function withReadingList(collections: Collection[], bookmarks: Bookmark[]): Collection[] {
  const out = collections.some((c) => c.id === READING_LIST_ID)
    ? collections
    : [{ id: READING_LIST_ID, name: 'Reading list', paperKeys: [] }, ...collections];
  const reading = out.find((c) => c.id === READING_LIST_ID)!;
  for (const b of bookmarks) if (!out.some((c) => c.paperKeys.includes(b.paperKey))) reading.paperKeys.push(b.paperKey);
  return out;
}

/* ---------- Adapter ---------- */

export function createMockApi({ storage = browserStorage(), latencyMs = 0, newId = defaultNewId }: MockOptions = {}): RoundsApi {
  migrateLocalData(storage, newId);
  const db: Store = createStore(storage);
  const delay = () => (latencyMs ? new Promise((r) => setTimeout(r, latencyMs)) : Promise.resolve());
  const now = () => new Date().toISOString();

  const getProfile = () => db.read<Profile>('profile', defaultProfile);
  const getUser = (): User => ({ id: LOCAL_USER_ID, ...getProfile() });
  const getRoleTags = () => db.read<RoleTag[]>('role-tags', []);
  const authorSnapshot = (): AuthorSnapshot => ({ id: LOCAL_USER_ID, display: getProfile().display, roles: getRoleTags().map((r) => r.role) });
  const getPreferences = (): Preferences => {
    const following = db.read(prefKeys.following, DEFAULT_FOLLOWING);
    return {
      following,
      pinned: db.read(prefKeys.pinned, following),
      feedJournals: db.read(prefKeys.feedJournals, defaultJournalIds).filter((id) => journals.some((j) => j.id === id)),
      specJournals: db.read(prefKeys.specJournals, {}),
      journalTopics: db.read(prefKeys.journalTopics, {}),
      specJournalTopics: db.read(prefKeys.specJournalTopics, {}),
      dataMode: db.read(prefKeys.dataMode, 'demo'),
      scope: db.read(prefKeys.scope, 'foryou'),
    };
  };
  const getBookmarks = () => db.read<Bookmark[]>('bookmarks', []);
  const getCollections = () => withReadingList(db.read<Collection[]>('collections', []), getBookmarks());
  const getThreads = () => db.read<Thread[]>('threads', []);
  const getPaperComments = () => db.read<Record<string, PaperComment[]>>('paper-comments', {});

  const ensureBookmark = (paper: Paper): Bookmark => {
    const key = paperKey(paper),
      list = getBookmarks(),
      found = list.find((b) => b.paperKey === key);
    if (found) return found;
    const b: Bookmark = { paperKey: key, paper, savedAt: now() };
    db.write('bookmarks', [...list, b]);
    return b;
  };
  // Edits apply to the stored list; orphaned bookmarks are filed into the Reading list only afterwards.
  const editCollections = (fn: (cols: Collection[]) => void) => {
    const cols = withReadingList(db.read<Collection[]>('collections', []), []);
    fn(cols);
    db.write('collections', withReadingList(cols, getBookmarks()));
  };
  const collectionOr404 = (cols: Collection[], id: string) => {
    const c = cols.find((x) => x.id === id);
    if (!c) throw new ApiError(404, 'not_found', 'Collection not found');
    return c;
  };
  const editMap = <T>(key: string, k: string, value: T | null) => {
    const m = db.read<Record<string, T>>(key, {});
    if (value === null) delete m[k];
    else m[k] = value;
    db.write(key, m);
  };
  // Every call resolves asynchronously, like the network, and returns fresh objects the UI may mutate.
  const call = async <T>(fn: () => T): Promise<T> => {
    await delay();
    return fn();
  };

  return {
    auth: {
      getCurrentUser: () => call(getUser),
    },
    session: {
      load: () =>
        call((): SessionState => {
          const comments = getPaperComments(),
            myPaperComments: SessionState['myPaperComments'] = {};
          for (const [k, list] of Object.entries(comments)) {
            const mine = list.filter((c) => c.author.id === LOCAL_USER_ID);
            if (mine.length) myPaperComments[k] = mine;
          }
          return {
            user: getUser(),
            roleTags: getRoleTags(),
            preferences: getPreferences(),
            bookmarks: getBookmarks(),
            collections: getCollections(),
            appraisals: db.read('appraisals', {}),
            ratings: db.read('paper-ratings', {}),
            notes: db.read('paper-notes', {}),
            interests: db.read('interests', {}),
            myPaperComments,
          };
        }),
    },
    content: {
      load: () =>
        call(() => ({
          papers: sampleDataset.papers.map((p) => normalizeMock(p)),
          highlights: structuredClone(sampleDataset.discussions),
          topicTrends: structuredClone(sampleDataset.topicTrends),
        })),
    },
    preferences: {
      update: (patch) =>
        call(() => {
          for (const [k, v] of Object.entries(patch) as [keyof Preferences, unknown][]) if (k in prefKeys && v !== undefined) db.write(prefKeys[k], v);
          return getPreferences();
        }),
    },
    profile: {
      update: (profile) =>
        call(() => {
          if (!profile.display?.trim()) throw new ApiError(422, 'invalid', 'Display name is required.');
          const { display, role, bio, interests } = profile;
          db.write('profile', { display, role, bio, interests });
          return getUser();
        }),
    },
    roleTags: {
      create: (input) =>
        call(() => {
          const tags = getRoleTags();
          if (tags.some((r) => r.role === input.role)) throw new ApiError(409, 'duplicate', 'You already have that role tag');
          const tag: RoleTag = { id: newId('role'), ...input, status: 'pending', createdAt: now() };
          db.write('role-tags', [...tags, tag]);
          return tag;
        }),
      remove: (id) => call(() => db.write('role-tags', getRoleTags().filter((r) => r.id !== id))),
    },
    library: {
      save: (paper) =>
        call(() => {
          const isNew = !getBookmarks().some((b) => b.paperKey === paperKey(paper)),
            b = ensureBookmark(paper);
          if (isNew)
            editCollections((cols) => {
              const reading = cols.find((c) => c.id === READING_LIST_ID)!;
              if (!reading.paperKeys.includes(b.paperKey)) reading.paperKeys.push(b.paperKey);
            });
          return b;
        }),
      remove: (key) =>
        call(() => {
          db.write('bookmarks', getBookmarks().filter((b) => b.paperKey !== key));
          editCollections((cols) => cols.forEach((c) => (c.paperKeys = c.paperKeys.filter((x) => x !== key))));
        }),
    },
    collections: {
      create: (name, paper) =>
        call(() => {
          const clean = name.trim();
          if (!clean) throw new ApiError(422, 'invalid', 'Collection name is required.');
          const c: Collection = { id: newId('col'), name: clean.slice(0, 40), paperKeys: paper ? [paperKey(paper)] : [] };
          if (paper) ensureBookmark(paper);
          editCollections((cols) => void cols.push(c));
          return c;
        }),
      addPaper: (id, paper) =>
        call(() => {
          ensureBookmark(paper);
          editCollections((cols) => {
            const c = collectionOr404(cols, id),
              k = paperKey(paper);
            if (!c.paperKeys.includes(k)) c.paperKeys.push(k);
          });
        }),
      removePaper: (id, key) =>
        call(() =>
          editCollections((cols) => {
            const c = collectionOr404(cols, id);
            c.paperKeys = c.paperKeys.filter((x) => x !== key);
          }),
        ),
      remove: (id) =>
        call(() => {
          if (id === READING_LIST_ID) throw new ApiError(400, 'protected', 'The Reading list can’t be deleted.');
          // Papers stay bookmarked; any left without a collection rejoin the Reading list.
          editCollections((cols) => cols.splice(cols.indexOf(collectionOr404(cols, id)), 1));
        }),
    },
    discussions: {
      list: () => call(getThreads),
      create: (input) =>
        call(() => {
          if (!input.title.trim()) throw new ApiError(422, 'invalid', 'A title is required.');
          const t: Thread = { ...input, id: newId('thread'), author: authorSnapshot(), createdAt: now(), comments: [] };
          db.write('threads', [...getThreads(), t]);
          return t;
        }),
      addComment: (threadId, input) =>
        call(() => {
          const threads = getThreads(),
            t = threads.find((x) => x.id === threadId);
          if (!t) throw new ApiError(404, 'not_found', 'Discussion not found');
          const c: Comment = { id: newId('comment'), body: input.body, refs: input.refs, author: authorSnapshot(), createdAt: now() };
          t.comments = [...(t.comments || []), c];
          db.write('threads', threads);
          return c;
        }),
    },
    paperComments: {
      list: (key) => call(() => getPaperComments()[key] || []),
      create: (key, input) =>
        call(() => {
          const all = getPaperComments(),
            c: PaperComment = { id: newId('comment'), paperKey: key, body: input.body, refs: input.refs, author: authorSnapshot(), createdAt: now() };
          all[key] = [...(all[key] || []), c];
          db.write('paper-comments', all);
          return c;
        }),
    },
    appraisals: {
      save: (key, input) =>
        call(() => {
          const a: Appraisal = { ...input, updated: now() };
          editMap('appraisals', key, a);
          return a;
        }),
    },
    ratings: {
      set: (key, rating) => call(() => editMap('paper-ratings', key, rating || null)),
    },
    notes: {
      save: (key, text) => call(() => editMap('paper-notes', key, text || null)),
    },
    interests: {
      set: (key, reasons) => call(() => editMap('interests', key, reasons.length ? reasons : null)),
    },
    projects: {
      list: () => call((): Project[] => [...db.read<Project[]>('projects', []), ...structuredClone(sampleProjects)]),
      create: (input) =>
        call(() => {
          const p: Project = { ...input, id: newId('project'), sample: false, authorId: LOCAL_USER_ID, createdAt: now() };
          db.write('projects', [p, ...db.read<Project[]>('projects', [])]);
          return p;
        }),
    },
    jobs: {
      list: () => call((): Job[] => [...db.read<Job[]>('jobs', []), ...structuredClone(sampleJobs)]),
      create: (input) =>
        call(() => {
          const j: Job = { ...input, id: newId('job'), sample: false, authorId: LOCAL_USER_ID, createdAt: now() };
          db.write('jobs', [j, ...db.read<Job[]>('jobs', [])]);
          return j;
        }),
    },
  };
}
