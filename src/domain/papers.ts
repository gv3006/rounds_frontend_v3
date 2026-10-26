/* Paper model: live and sample records are normalized to one shape before display.
   Pure functions only — no DOM or app state — so they can move server-side unchanged. */
import { journals } from '../data/catalog';
import type { SamplePaperRecord } from '../data/mock';
import type { EuropePmcRecord, Journal, Paper, PaperKey } from '../types';

type Loose = Partial<EuropePmcRecord> & Partial<Paper> & { journal?: string };

export const paperKey = (p: { source: string; id: string }): PaperKey => p.source + ':' + p.id;

/** Strip markup and entities, collapse whitespace. */
export const fmt = (s: unknown): string =>
  s ? String(s).replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim() : '';
export const trim = (s: string, n: number): string => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
export const isoDay = (d: Date): string => d.toISOString().slice(0, 10);
export const todayISO = (): string => isoDay(new Date());

export const journalById = (id: string | undefined): Journal | undefined => journals.find((j) => j.id === id);
export const journalIdForPaper = (p: Loose): string => {
  const actual = String(p.journalInfo?.journal?.title || p.journalTitle || p.journal || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return journals.find((j) => j.name.toLowerCase().replace(/[^a-z0-9]/g, '') === actual)?.id || '';
};

// Specialty assignment: a specialty journal decides; otherwise keywords are scored (title hits count triple).
// Weak matches fall back to "General medicine" instead of being forced into an unrelated specialty.
const specWords: Record<string, string[]> = {
  cardiology: ['cardiac', 'coronary', 'heart failure', 'atrial fibrillation', 'cardiovascular', 'myocardial', 'arrhythm', 'aortic', 'hypertension'],
  neurology: ['stroke', 'neurolog', 'epilep', 'seizure', 'dementia', 'alzheimer', 'parkinson', 'multiple sclerosis', 'migraine', 'neuropath'],
  oncology: ['cancer', 'tumor', 'tumour', 'carcinoma', 'oncolog', 'lymphoma', 'leukemia', 'leukaemia', 'metasta', 'chemotherapy'],
  rehabilitation: ['rehabilitation', 'physiotherap', 'physical therapy', 'low back pain', 'spinal cord injury', 'functional recovery', 'physiatr'],
  orthopedics: ['fracture', 'orthop', 'arthroplasty', 'cruciate', 'rotator cuff', 'osteoarthritis'],
  psychiatry: ['depress', 'psychiatr', 'anxiety', 'schizophren', 'bipolar', 'psychosis', 'suicid', 'substance use'],
  pediatrics: ['pediatric', 'paediatric', 'infant', 'neonat', 'children', 'adolescen', 'preterm'],
  dermatology: ['dermat', 'psoriasis', 'eczema', 'melanoma', 'acne'],
  surgery: ['surgical', 'surgery', 'postoperative', 'laparoscop', 'resection'],
  emergency: ['emergency department', 'cardiac arrest', 'resuscitation', 'prehospital', 'trauma'],
  radiology: ['radiolog', 'magnetic resonance', 'computed tomography', 'ultrasonograph', 'mammograph'],
  infectious: ['infection', 'antibiotic', 'antimicrobial', 'sepsis', 'hiv', 'tuberculosis', 'vaccin', 'covid', 'influenza'],
  obgyn: ['pregnan', 'obstetric', 'gynecolog', 'gynaecolog', 'preeclampsia', 'maternal'],
  anesthesiology: ['anesthe', 'anaesthe', 'analgesi', 'nerve block', 'intubation'],
  internal: ['diabetes', 'kidney', 'renal', 'copd', 'asthma', 'cirrhosis', 'hospital medicine', 'multimorbidity'],
};
export function inferSpec(p: Loose): string {
  const j = journalById(p.journalId || journalIdForPaper(p));
  if (j && !j.areas.includes('general')) return j.areas[0];
  const ti = fmt(p.title).toLowerCase(),
    body = (fmt(p.abstractText) + ' ' + (p.keywords || []).join(' ')).toLowerCase();
  let best = 'general',
    top = 0;
  for (const [id, words] of Object.entries(specWords)) {
    let n = 0;
    for (const w of words) {
      if (ti.includes(w)) n += 3;
      if (body.includes(w)) n++;
    }
    if (n > top) {
      top = n;
      best = id;
    }
  }
  return top >= 3 ? best : 'general';
}
export const attachSpec = (p: Loose): string => p.specialty || inferSpec(p);

// Europe PMC → study type: indexed publication types first, then wording in the title and abstract.
export function classifyType(p: Loose): string {
  const pt = (p.pubTypeList?.pubType || []).map((x) => String(x).toLowerCase()),
    has = (s: string) => pt.some((x) => x.includes(s)),
    ti = fmt(p.title).toLowerCase(),
    tx = ti + ' ' + fmt(p.abstractText).slice(0, 1500).toLowerCase();
  if (has('erratum') || has('retraction') || /^(correction|erratum|retraction|expression of concern)\b/.test(ti)) return 'notice';
  if (has('editorial')) return 'editorial';
  if (has('letter')) return 'letter';
  if (has('comment')) return 'comment';
  if (has('guideline') || has('consensus') || /consensus statement|practice guideline|scientific statement/.test(ti)) return 'guideline';
  if (has('meta-analysis') || /meta-?analys/.test(ti)) return 'meta';
  if (has('systematic review') || /systematic review/.test(ti)) return 'sr';
  if (has('randomized controlled trial') || /randomi[sz]ed (controlled |clinical )?trial|randomly (assigned|allocated)/.test(tx)) return 'rct';
  if (has('case reports') || /case report|case series/.test(ti)) return 'caseseries';
  if (/diagnostic accuracy|sensitivity and specificity/.test(tx)) return 'diagnostic';
  if (/case-control|case control/.test(tx)) return 'casecontrol';
  if (/cross-sectional/.test(tx)) return 'cross';
  if (has('observational study') || /\bcohort\b|registry|target trial emulation/.test(tx)) return 'cohort';
  if (has('review')) return 'review';
  // Unindexed items without a real abstract are usually news or front-matter, not original research.
  return fmt(p.abstractText).length < 200 ? 'brief' : 'research';
}

export const titleKey = (p: Loose): string => fmt(p.title).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
// Europe PMC often returns an article alongside news items or duplicates with the same title; keep the record with the fullest abstract.
export function dedupe<T extends Loose>(rows: T[], existing: Loose[] = []): T[] {
  const seen = new Set(existing.map(titleKey)),
    best = new Map<string, T>();
  for (const p of rows) {
    const t = titleKey(p),
      o = best.get(t);
    if (!o || fmt(p.abstractText).length > fmt(o.abstractText).length) best.set(t, p);
  }
  return rows.filter((p) => best.get(titleKey(p)) === p && !seen.has(titleKey(p)));
}

export function inferN(text: unknown): number {
  const m = fmt(text).match(
    /\b(?:n\s*=\s*|total of\s+|including\s+|included\s+|enrolled\s+|among\s+)(\d{1,3}(?:,\d{3})+|\d{2,7})\s+(?:patients|participants|adults|children|infants|individuals|women|men|subjects|people|veterans|pregnancies|residents)\b/i,
  );
  return m ? +m[1].replace(/,/g, '') : 0;
}
export function inferFinding(text: unknown): string {
  const m = fmt(text).match(/\b(?:conclusions?(?: and relevance)?|interpretation)\s*[:.]\s*(.{40,})$/i);
  return m ? trim(m[1], 280) : '';
}

// Online-first records can carry a future print date: show the earliest date that has already happened and flag the issue date separately.
export function pickDate(p: Loose): { date: string; ahead: string } {
  const today = todayISO(),
    all = [p.firstPublicationDate, p.electronicPublicationDate, p.firstIndexDate].filter((d): d is string => /^\d{4}-\d{2}-\d{2}/.test(d || '')).sort(),
    past = all.filter((d) => d <= today),
    print = p.journalInfo?.printPublicationDate || '';
  return {
    date: past[0] || (p.pubYear && p.pubYear <= today.slice(0, 4) ? p.pubYear + '-01-01' : ''),
    ahead: /^\d{4}-\d{2}/.test(print) && print > today ? print : '',
  };
}

/** Normalize a Europe PMC record. `specialty` overrides inference (used on specialty pages). */
export function normalizeLive(p: Loose & { id: string; source: string }, specialty?: string): Paper {
  const { date, ahead } = pickDate(p),
    kw = (p.keywordList?.keyword || []).map(fmt).filter(Boolean);
  const n: Paper = {
    ...(p as EuropePmcRecord),
    title: p.title || '',
    authorString: p.authorString || '',
    date,
    printAhead: ahead,
    type: classifyType(p),
    journalId: journalIdForPaper(p),
    journalTitle: p.journalInfo?.journal?.title || p.journalTitle || '',
    n: inferN(p.abstractText),
    finding: inferFinding(p.abstractText),
    findingSource: 'abstract',
    topics: kw.slice(0, 3),
    keywords: kw,
    specialty: '',
  };
  n.specialty = specialty || inferSpec(n);
  return n;
}

// Sample papers store "days ago" so the dataset stays current whenever the prototype is opened.
export function normalizeMock(m: SamplePaperRecord, now = Date.now()): Paper {
  const d = new Date(now - m.ago * 864e5),
    c = m.c || [0, 0, 0, 0];
  return {
    source: 'DEMO',
    id: m.id,
    demo: true,
    title: m.title,
    authorString: m.authors || '',
    journalId: m.j,
    journalTitle: journalById(m.j)?.name || '',
    date: isoDay(d),
    firstPublicationDate: isoDay(d),
    pubYear: String(d.getUTCFullYear()),
    printAhead: m.printAhead ? isoDay(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m.printAhead, 1))) : '',
    type: m.type,
    n: m.n || 0,
    k: m.k || 0,
    specialty: m.spec,
    sub: m.sub || '',
    topics: m.topics || [],
    citedByCount: m.cites || 0,
    isOpenAccess: m.oa ? 'Y' : 'N',
    finding: m.finding || '',
    findingSource: 'sample',
    abstractText: m.abstract || '',
    pop: m.pop || '',
    outcome: m.outcome || '',
    signals: m.signals || [],
    about: m.about || '',
    community: { saves: c[0] || 0, discussions: c[1] || 0, appraisals: c[2] || 0, interested: c[3] || 0, rob: m.rob || null },
  };
}
