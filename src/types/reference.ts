/* Static reference data: taxonomy, appraisal instruments, catalogs. Ships with the client today;
   a backend may serve it later, in the same shapes. */

/** `[value, label]` pair used by selects and segmented controls. */
export type Option = [value: string, label: string];

export interface Specialty {
  id: string;
  name: string;
  /** Two-letter badge. */
  short: string;
  sub: string;
  /** Europe PMC query clause for this specialty. */
  q: string;
}

export interface Journal {
  id: string;
  name: string;
  publisher: string;
  /** Specialty ids, or 'general'. The first non-general area decides a paper's specialty. */
  areas: string[];
  sub: string;
  url: string;
  /** Hotlinked representative cover; '' falls back to the designed placeholder. */
  cover: string;
  art: string;
  coverFit?: 'logo';
}

export type StudyGroup = 'research' | 'synthesis' | 'review' | 'guidance' | 'commentary' | 'notice';

export interface StudyType {
  label: string;
  short: string;
  group: StudyGroup;
  /** Typical Oxford CEBM level for the design; 0 = not applicable. */
  tier: number;
}

/** `[key, label, help, options?]` — options override the tool-wide scale for that domain. */
export type AppraisalDomain = [key: string, label: string, help: string, options?: Option[]];

export interface AppraisalTool {
  name: string;
  full: string;
  design: string;
  options: Option[];
  domains: AppraisalDomain[];
}

export interface ReferenceData {
  /** `[group, roles[]]` licensed positions offered as role tags. */
  roles: [group: string, roles: string[]][];
  seeking: string[];
  irbStatuses: string[];
  jobPositions: string[];
  jobTypes: string[];
  jobModes: string[];
  /** Demo impact tiers 1–4 by journal id. Placeholders, not Journal Impact Factors. */
  impact: Record<string, number>;
  defaultSpecJournals: Record<string, string[]>;
  /** Per specialty: `[label, Europe PMC query clause]`. */
  subtags: Record<string, Option[]>;
  levels: Option[];
  grade: Option[];
  tools: Record<string, AppraisalTool>;
  studyTypes: Record<string, StudyType>;
  pubGroups: [group: StudyGroup, label: string][];
  discussionSections: [key: string, label: string, help: string][];
}
