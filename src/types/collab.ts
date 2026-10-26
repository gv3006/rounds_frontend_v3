/* Collaboration board: research projects and job listings. */

export interface Irb {
  status: string;
  protocol: string;
  institution: string;
  /** File name only. No upload or verification exists yet. */
  file: string;
}

export interface Project {
  id: string;
  title: string;
  specialty: string;
  stage: string;
  needs: string;
  seeking: string[];
  irb?: Irb;
  intro: string;
  tags: string[];
  kind: string;
  /** True for illustrative sample concepts (not real recruitment). */
  sample: boolean;
  authorId?: string;
  createdAt?: string;
}

export type NewProject = Omit<Project, 'id' | 'sample' | 'authorId' | 'createdAt'>;

export interface Job {
  id: string;
  title: string;
  org: string;
  specialty: string;
  position: string;
  type: string;
  mode: string;
  /** http(s) or mailto link, or ''. */
  contact?: string;
  summary: string;
  sample: boolean;
  authorId?: string;
  createdAt?: string;
}

export type NewJob = Omit<Job, 'id' | 'sample' | 'authorId' | 'createdAt'>;
