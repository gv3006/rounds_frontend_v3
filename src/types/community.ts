/* User-generated content: discussions, comments, appraisals, library. */
import type { Paper, PaperKey, PaperRef } from './paper';

/** Author as shown on a post. The server stamps this from the signed-in user; clients never send it. */
export interface AuthorSnapshot {
  id: string;
  display: string;
  /** Self-reported licensed roles at the time of posting (all "verification pending" today). */
  roles: string[];
}

export interface Comment {
  id: string;
  body: string;
  refs: PaperRef[];
  author: AuthorSnapshot;
  createdAt: string;
}

export interface PaperComment extends Comment {
  paperKey: PaperKey;
}

export interface NewComment {
  body: string;
  refs: PaperRef[];
}

/** Self-assessed evidence summary shown at the top of a discussion. */
export interface Evidence {
  /** Oxford CEBM level '1'–'5', or ''. */
  level: string;
  /** GRADE certainty key, or ''. */
  grade: string;
  /** 1–5 stars, 0 = none. */
  rating: number;
}

export interface Thread {
  id: string;
  title: string;
  /** Specialty display name (e.g. "Cardiology"). */
  specialty: string;
  /** Structured sections keyed by ReferenceData.discussionSections keys. */
  sections: Record<string, string>;
  /** Free-text body of early threads created before structured sections existed. */
  body?: string;
  refs: PaperRef[];
  paper: PaperRef | null;
  paperKey: PaperKey;
  url: string;
  evidence: Evidence | null;
  author: AuthorSnapshot;
  createdAt: string;
  comments: Comment[];
}

export type NewThread = Pick<Thread, 'title' | 'specialty' | 'sections' | 'refs' | 'paper' | 'paperKey' | 'url' | 'evidence'>;

/** Sample "most discussed" teaser attached to a sample paper. Fictional. */
export interface DiscussionHighlight {
  /** Sample paper id (source DEMO). */
  paper: string;
  q: string;
  excerpt: string;
  replies: number;
  roles: string;
  ago: string;
}

/** `[topic, specialty id, % change vs previous 90 days]`. */
export type TopicTrend = [topic: string, specialty: string, change: number];

export interface AppraisalEntry {
  rating: string;
  comment: string;
}

export interface Appraisal {
  /** Key into ReferenceData.tools. */
  tool: string;
  domains: Record<string, AppraisalEntry>;
  level: string;
  levelNote: string;
  grade: string;
  gradeNote: string;
  updated: string;
}

export interface Bookmark {
  paperKey: PaperKey;
  /** Snapshot of the paper so the library renders without refetching. */
  paper: Paper;
  savedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  paperKeys: PaperKey[];
}
