import { describe, it, expect } from 'vitest';
import { SURAHS, surahName, pageSegments, MAJOR_SEGMENTS, MINOR_SEGMENTS, MUSHAF_PAGES } from './quran';

describe('SURAHS', () => {
  it('contains all 114 surahs in order', () => {
    expect(SURAHS).toHaveLength(114);
    expect(SURAHS[0]).toBe('الفاتحة');
    expect(SURAHS[113]).toBe('الناس');
  });
});

describe('surahName', () => {
  it('maps a 1-based number to the surah name', () => {
    expect(surahName(1)).toBe('الفاتحة');
    expect(surahName(2)).toBe('البقرة');
    expect(surahName(114)).toBe('الناس');
  });
  it('returns empty for out-of-range or nullish input', () => {
    expect(surahName(0)).toBe('');
    expect(surahName(115)).toBe('');
    expect(surahName(null)).toBe('');
    expect(surahName(undefined)).toBe('');
  });
});

describe('pageSegments', () => {
  it('covers the whole mushaf with equal-size blocks and a final partial block', () => {
    const segs = pageSegments(10);
    expect(segs[0]).toEqual({ from: 1, to: 10, label: '1 – 10' });
    expect(segs.at(-1)?.to).toBe(MUSHAF_PAGES);
    // every page is covered exactly once, no gaps/overlaps
    for (let i = 1; i < segs.length; i++) expect(segs[i].from).toBe(segs[i - 1].to + 1);
  });
  it('exposes 10-page major and 5-page minor segment lists', () => {
    expect(MAJOR_SEGMENTS[0].to - MAJOR_SEGMENTS[0].from).toBe(9);
    expect(MINOR_SEGMENTS[0].to - MINOR_SEGMENTS[0].from).toBe(4);
    expect(MINOR_SEGMENTS.length).toBeGreaterThan(MAJOR_SEGMENTS.length);
  });
});
