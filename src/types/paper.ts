/* The normalized paper record every view renders. Sample records, Europe PMC records and (later)
   Rounds API records all arrive in this shape. */

/** `${source}:${id}`, e.g. `DEMO:s01`, `MED:39012345`, `DOI:10.1000/xyz`. Stable identity across the app and API. */
export type PaperKey = string;

export interface CommunityStats {
  saves: number;
  discussions: number;
  appraisals: number;
  interested: number;
  /** Community risk-of-bias judgements `[low, some concerns, high]`, or null when none. */
  rob: [low: number, some: number, high: number] | null;
}

export interface Paper {
  /** 'DEMO' for the fictional sample set; Europe PMC source codes ('MED', 'PMC', …) for live records. */
  source: string;
  id: string;
  /** True for fictional sample records. The UI must keep labelling these. */
  demo?: boolean;
  title: string;
  authorString: string;
  journalId: string;
  journalTitle: string;
  /** Earliest publication date that has already happened (YYYY-MM-DD), or ''. */
  date: string;
  firstPublicationDate?: string;
  pubYear?: string;
  /** Future print-issue date for online-first records, or ''. */
  printAhead: string;
  /** Key into ReferenceData.studyTypes. */
  type: string;
  /** Participants (0 = unknown). */
  n: number;
  /** Studies pooled, for syntheses. */
  k?: number;
  /** Specialty id, or 'general'. */
  specialty: string;
  sub?: string;
  topics: string[];
  keywords?: string[];
  citedByCount?: number;
  isOpenAccess?: 'Y' | 'N';
  finding: string;
  /** 'sample' = written for the demo; 'abstract' = parsed from the abstract's conclusion. */
  findingSource: 'sample' | 'abstract';
  abstractText?: string;
  pop?: string;
  outcome?: string;
  signals?: string[];
  /** For commentary: id of the paper it discusses (same source). */
  about?: string;
  doi?: string;
  pmid?: string;
  /** Rounds community activity. Absent for live Europe PMC records. */
  community?: CommunityStats;
  /** Live records keep their raw Europe PMC fields alongside the normalized ones. */
  [raw: string]: unknown;
}

/** A citation as stored inside discussions and comments. */
export interface PaperRef {
  key: PaperKey;
  source: string;
  id: string;
  doi: string;
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
}

/** Raw record from the Europe PMC search API (`resultType=core`). Only fields Rounds reads are typed. */
export interface EuropePmcRecord {
  id: string;
  source: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  journalInfo?: { journal?: { title?: string }; printPublicationDate?: string };
  pubYear?: string;
  firstPublicationDate?: string;
  electronicPublicationDate?: string;
  firstIndexDate?: string;
  abstractText?: string;
  pubTypeList?: { pubType?: string[] };
  keywordList?: { keyword?: string[] };
  citedByCount?: number;
  isOpenAccess?: 'Y' | 'N';
  doi?: string;
  pmid?: string;
  [raw: string]: unknown;
}
