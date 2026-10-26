/* The contract between the UI and whatever stores Rounds data. Every adapter (mock, http) implements RoundsApi;
   the UI never touches localStorage or fetch for Rounds data directly. REST mapping: docs/openapi.yaml. */
import type {
  Appraisal,
  Bookmark,
  Collection,
  Comment,
  DiscussionHighlight,
  Job,
  NewComment,
  NewJob,
  NewProject,
  NewRoleTag,
  NewThread,
  Paper,
  PaperComment,
  PaperKey,
  Preferences,
  Profile,
  Project,
  RoleTag,
  Thread,
  TopicTrend,
  User,
} from '../types';

/** Everything personal the UI needs at startup, in one round trip. */
export interface SessionState {
  user: User;
  roleTags: RoleTag[];
  preferences: Preferences;
  bookmarks: Bookmark[];
  collections: Collection[];
  appraisals: Record<PaperKey, Appraisal>;
  ratings: Record<PaperKey, number>;
  notes: Record<PaperKey, string>;
  /** Paper key → reasons the user flagged interest. */
  interests: Record<PaperKey, string[]>;
  /** Comments the user wrote, grouped by paper (for activity counts). Full threads load per paper. */
  myPaperComments: Record<PaperKey, PaperComment[]>;
}

/** Rounds-hosted paper catalogue and community signals (today: the fictional sample set). */
export interface CommunityContent {
  papers: Paper[];
  highlights: DiscussionHighlight[];
  topicTrends: TopicTrend[];
}

export type AppraisalInput = Omit<Appraisal, 'updated'>;

export interface RoundsApi {
  auth: {
    /** The signed-in user. Mock: a single local guest. Login/logout are documented but not wired to UI yet. */
    getCurrentUser(): Promise<User>;
  };
  session: {
    load(): Promise<SessionState>;
  };
  content: {
    load(): Promise<CommunityContent>;
  };
  preferences: {
    /** Partial update; returns the full stored preferences. */
    update(patch: Partial<Preferences>): Promise<Preferences>;
  };
  profile: {
    update(profile: Profile): Promise<User>;
  };
  roleTags: {
    create(input: NewRoleTag): Promise<RoleTag>;
    remove(id: string): Promise<void>;
  };
  library: {
    /** Bookmark a paper (idempotent). New bookmarks join the "reading" collection. */
    save(paper: Paper): Promise<Bookmark>;
    /** Remove a bookmark and drop it from every collection. */
    remove(key: PaperKey): Promise<void>;
  };
  collections: {
    /** Create a collection, optionally seeded with one paper (which is bookmarked too). */
    create(name: string, paper?: Paper): Promise<Collection>;
    /** Add a paper to a collection, bookmarking it if needed. */
    addPaper(collectionId: string, paper: Paper): Promise<void>;
    removePaper(collectionId: string, key: PaperKey): Promise<void>;
    /** Delete a collection. Its papers stay bookmarked. */
    remove(collectionId: string): Promise<void>;
  };
  discussions: {
    list(): Promise<Thread[]>;
    create(input: NewThread): Promise<Thread>;
    addComment(threadId: string, input: NewComment): Promise<Comment>;
  };
  paperComments: {
    list(key: PaperKey): Promise<PaperComment[]>;
    create(key: PaperKey, input: NewComment): Promise<PaperComment>;
  };
  appraisals: {
    save(key: PaperKey, input: AppraisalInput): Promise<Appraisal>;
  };
  ratings: {
    /** 1–5, or null to clear. Private to the user. */
    set(key: PaperKey, rating: number | null): Promise<void>;
  };
  notes: {
    /** Private notes; '' deletes. */
    save(key: PaperKey, text: string): Promise<void>;
  };
  interests: {
    /** Replace the reasons for a paper; [] removes the interest flag. */
    set(key: PaperKey, reasons: string[]): Promise<void>;
  };
  projects: {
    /** All visible projects, the user's own and sample concepts (`sample: true`). */
    list(): Promise<Project[]>;
    create(input: NewProject): Promise<Project>;
  };
  jobs: {
    list(): Promise<Job[]>;
    create(input: NewJob): Promise<Job>;
  };
}
