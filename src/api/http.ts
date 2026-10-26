/* REST adapter for the future Rounds backend. Paths and payloads are specified in docs/openapi.yaml.
   Inactive unless VITE_API_MODE=http. Auth is a session cookie (credentials: 'include'). */
import type {
  Appraisal,
  Bookmark,
  Collection,
  Comment,
  DiscussionHighlight,
  Job,
  Paper,
  PaperComment,
  Preferences,
  Project,
  RoleTag,
  Thread,
  TopicTrend,
  User,
} from '../types';
import { ApiError } from './errors';
import type { RoundsApi, SessionState } from './types';

export interface HttpOptions {
  baseUrl: string;
  timeoutMs: number;
  fetch?: typeof fetch;
}

/** List endpoints return an envelope so pagination can be added without breaking clients. */
interface ListEnvelope<T> {
  items: T[];
  nextCursor?: string | null;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function createHttpClient({ baseUrl, timeoutMs, fetch: fetchImpl = globalThis.fetch.bind(globalThis) }: HttpOptions) {
  return async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    if (!baseUrl) throw new ApiError(0, 'config', 'VITE_API_BASE_URL is not set.');
    const ctl = new AbortController(),
      timer = setTimeout(() => ctl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetchImpl(baseUrl + path, {
        method,
        credentials: 'include',
        headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctl.signal,
      });
    } catch (err) {
      const aborted = ctl.signal.aborted;
      throw new ApiError(0, aborted ? 'timeout' : 'network', aborted ? 'Request timed out' : String((err as Error)?.message || err));
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      let code = 'http_' + res.status,
        message = res.statusText || 'Request failed';
      try {
        const data = await res.json();
        if (data?.error) {
          code = data.error.code || code;
          message = data.error.message || message;
        }
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(res.status, code, message);
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  };
}

const enc = encodeURIComponent;

export function createHttpApi(options: HttpOptions): RoundsApi {
  const request = createHttpClient(options);
  const items = async <T>(path: string) => (await request<ListEnvelope<T>>('GET', path)).items;

  return {
    auth: {
      getCurrentUser: () => request<User>('GET', '/me'),
    },
    session: {
      async load(): Promise<SessionState> {
        const [user, roleTags, preferences, bookmarks, collections, appraisals, ratings, notes, interests, mine] = await Promise.all([
          request<User>('GET', '/me'),
          items<RoleTag>('/me/role-tags'),
          request<Preferences>('GET', '/me/preferences'),
          items<Bookmark>('/me/bookmarks'),
          items<Collection>('/me/collections'),
          request<SessionState['appraisals']>('GET', '/me/appraisals'),
          request<SessionState['ratings']>('GET', '/me/ratings'),
          request<SessionState['notes']>('GET', '/me/notes'),
          request<SessionState['interests']>('GET', '/me/interests'),
          items<PaperComment>('/me/paper-comments'),
        ]);
        const myPaperComments: SessionState['myPaperComments'] = {};
        for (const c of mine) (myPaperComments[c.paperKey] ||= []).push(c);
        return { user, roleTags, preferences, bookmarks, collections, appraisals, ratings, notes, interests, myPaperComments };
      },
    },
    content: {
      async load() {
        const [papers, highlights, topicTrends] = await Promise.all([
          items<Paper>('/papers'),
          items<DiscussionHighlight>('/discussions/highlights'),
          items<TopicTrend>('/topics/trending'),
        ]);
        return { papers, highlights, topicTrends };
      },
    },
    preferences: {
      update: (patch) => request<Preferences>('PATCH', '/me/preferences', patch),
    },
    profile: {
      update: (profile) => request<User>('PUT', '/me/profile', profile),
    },
    roleTags: {
      create: (input) => request<RoleTag>('POST', '/me/role-tags', input),
      remove: (id) => request<void>('DELETE', `/me/role-tags/${enc(id)}`),
    },
    library: {
      save: (paper) => request<Bookmark>('PUT', `/me/bookmarks/${enc(paper.source + ':' + paper.id)}`, { paper }),
      remove: (key) => request<void>('DELETE', `/me/bookmarks/${enc(key)}`),
    },
    collections: {
      create: (name, paper) => request<Collection>('POST', '/me/collections', paper ? { name, paper } : { name }),
      addPaper: (id, paper) => request<void>('PUT', `/me/collections/${enc(id)}/papers/${enc(paper.source + ':' + paper.id)}`, { paper }),
      removePaper: (id, key) => request<void>('DELETE', `/me/collections/${enc(id)}/papers/${enc(key)}`),
      remove: (id) => request<void>('DELETE', `/me/collections/${enc(id)}`),
    },
    discussions: {
      list: () => items<Thread>('/discussions'),
      create: (input) => request<Thread>('POST', '/discussions', input),
      addComment: (threadId, input) => request<Comment>('POST', `/discussions/${enc(threadId)}/comments`, input),
    },
    paperComments: {
      list: (key) => items<PaperComment>(`/papers/${enc(key)}/comments`),
      create: (key, input) => request<PaperComment>('POST', `/papers/${enc(key)}/comments`, input),
    },
    appraisals: {
      save: (key, input) => request<Appraisal>('PUT', `/me/appraisals/${enc(key)}`, input),
    },
    ratings: {
      set: (key, rating) =>
        rating ? request<void>('PUT', `/me/ratings/${enc(key)}`, { rating }) : request<void>('DELETE', `/me/ratings/${enc(key)}`),
    },
    notes: {
      save: (key, text) => (text ? request<void>('PUT', `/me/notes/${enc(key)}`, { text }) : request<void>('DELETE', `/me/notes/${enc(key)}`)),
    },
    interests: {
      set: (key, reasons) =>
        reasons.length ? request<void>('PUT', `/me/interests/${enc(key)}`, { reasons }) : request<void>('DELETE', `/me/interests/${enc(key)}`),
    },
    projects: {
      list: () => items<Project>('/projects'),
      create: (input) => request<Project>('POST', '/projects', input),
    },
    jobs: {
      list: () => items<Job>('/jobs'),
      create: (input) => request<Job>('POST', '/jobs', input),
    },
  };
}
