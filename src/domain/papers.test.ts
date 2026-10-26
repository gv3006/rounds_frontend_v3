import { describe, expect, it } from 'vitest';
import { sampleDataset } from '../data/mock';
import { classifyType, dedupe, inferFinding, inferN, normalizeLive, normalizeMock, paperKey } from './papers';

describe('normalizeMock', () => {
  it('maps a sample record to the Paper shape with community stats', () => {
    const raw = sampleDataset.papers[0];
    const now = Date.UTC(2026, 9, 25);
    const p = normalizeMock(raw, now);
    expect(paperKey(p)).toBe('DEMO:' + raw.id);
    expect(p.demo).toBe(true);
    expect(p.findingSource).toBe('sample');
    expect(p.date).toBe(new Date(now - raw.ago * 864e5).toISOString().slice(0, 10));
    expect(p.community).toEqual({ saves: raw.c![0], discussions: raw.c![1], appraisals: raw.c![2], interested: raw.c![3], rob: raw.rob });
    expect(p.journalTitle).not.toBe('');
  });
});

describe('normalizeLive', () => {
  const record = {
    id: '123',
    source: 'MED',
    title: 'A randomized controlled trial of early mobilisation after stroke',
    journalTitle: 'Stroke',
    firstPublicationDate: '2026-01-05',
    abstractText: 'We enrolled 412 patients. Conclusions: Early mobilisation was safe and improved functional recovery at 90 days in this cohort.',
    pubTypeList: { pubType: ['Randomized Controlled Trial'] },
    keywordList: { keyword: ['stroke', 'rehabilitation'] },
  };

  it('classifies, infers sample size and finding, and assigns specialty from the journal', () => {
    const p = normalizeLive(record);
    expect(p.type).toBe('rct');
    expect(p.n).toBe(412);
    expect(p.finding).toMatch(/^Early mobilisation was safe/);
    expect(p.journalId).toBe('stroke');
    expect(p.specialty).toBe('neurology');
    expect(p.topics).toEqual(['stroke', 'rehabilitation']);
  });

  it('honours an explicit specialty override', () => {
    expect(normalizeLive(record, 'rehabilitation').specialty).toBe('rehabilitation');
  });
});

describe('helpers', () => {
  it('classifyType recognises notices and briefs', () => {
    expect(classifyType({ title: 'Correction to: something' })).toBe('notice');
    expect(classifyType({ title: 'News in brief', abstractText: 'short' })).toBe('brief');
  });

  it('inferN and inferFinding return empty values when absent', () => {
    expect(inferN('no numbers here')).toBe(0);
    expect(inferFinding('no conclusion')).toBe('');
  });

  it('dedupe keeps the record with the fullest abstract and skips existing titles', () => {
    const a = { title: 'Same title', abstractText: 'short' },
      b = { title: 'Same  title', abstractText: 'a much longer abstract' },
      c = { title: 'Other' };
    expect(dedupe([a, b, c])).toEqual([b, c]);
    expect(dedupe([c], [{ title: 'Other' }])).toEqual([]);
  });
});
