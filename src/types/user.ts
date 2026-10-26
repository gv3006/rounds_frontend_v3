/* The signed-in user, their self-reported credentials, and their feed preferences. */

export interface Profile {
  display: string;
  /** Self-reported professional role. */
  role: string;
  bio: string;
  interests: string;
}

export interface User extends Profile {
  id: string;
}

export type RoleTagStatus = 'pending' | 'verified' | 'rejected';

export interface RoleTag {
  id: string;
  role: string;
  state: string;
  institution: string;
  /** Always 'pending' until a verification service exists. */
  status: RoleTagStatus;
  createdAt: string;
}

export type NewRoleTag = Pick<RoleTag, 'role' | 'state' | 'institution'>;

export interface Preferences {
  /** Followed specialty ids (drive "For you"). */
  following: string[];
  /** Specialty ids pinned to the top of the sidebar. */
  pinned: string[];
  /** Journal ids on the "Your feed" shelf. */
  feedJournals: string[];
  /** Custom journal shelf per specialty id; missing = Rounds defaults. */
  specJournals: Record<string, string[]>;
  /** Your-feed tags narrowing a general journal to specialty ids. */
  journalTopics: Record<string, string[]>;
  /** Per specialty id: journal id → subtopic labels. */
  specJournalTopics: Record<string, Record<string, string[]>>;
  dataMode: 'demo' | 'live';
  scope: 'foryou' | 'discover';
}
