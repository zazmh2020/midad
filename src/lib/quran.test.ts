import { describe, it, expect } from 'vitest';
import { SURAHS, surahName, surahAtPage, pageStartVerse, pageEndVerse, pageSegments, MAJOR_SEGMENTS, MINOR_SEGMENTS, MUSHAF_PAGES } from './quran';

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

describe('page → verse mapping', () => {
  it('gives the first verse that starts on a page', () => {
    expect(pageStartVerse(1)).toEqual([1, 1]);   // الفاتحة ١
    expect(pageStartVerse(2)).toEqual([2, 1]);   // البقرة ١
    expect(pageStartVerse(11)).toEqual([2, 70]); // البقرة ٧٠
  });
  it('gives the last verse on a page (verse before next page starts)', () => {
    expect(pageEndVerse(1)).toEqual([1, 7]);     // الفاتحة ٧
    expect(pageEndVerse(10)).toEqual([2, 69]);   // البقرة ٦٩ (الصفحة ١١ تبدأ ٧٠)
    expect(pageEndVerse(49)).toEqual([2, 286]);  // البقرة ٢٨٦ (الصفحة ٥٠ تبدأ آل عمران ١)
    expect(pageEndVerse(604)).toEqual([114, 6]); // الناس ٦
  });
  it('surahAtPage returns the surah a page begins with', () => {
    expect(surahAtPage(1)).toBe(1);
    expect(surahAtPage(77)).toBe(4);   // النساء تبدأ ص٧٧
    expect(surahAtPage(604)).toBe(112); // الإخلاص تبدأ الصفحة الأخيرة
  });
});

describe('pageSegments', () => {
  it('labels each block with surah + verse at both ends', () => {
    const segs = pageSegments(10);
    expect(segs[0]).toEqual({ from: 1, to: 10, label: 'الفاتحة 1 - البقرة 69' });
    expect(segs.at(-1)?.to).toBe(MUSHAF_PAGES);
    expect(segs.at(-1)?.label.endsWith('الناس 6')).toBe(true);
    // every page is covered exactly once, no gaps/overlaps
    for (let i = 1; i < segs.length; i++) expect(segs[i].from).toBe(segs[i - 1].to + 1);
  });
  it('exposes 10-page major and 5-page minor segment lists', () => {
    expect(MAJOR_SEGMENTS[0].to - MAJOR_SEGMENTS[0].from).toBe(9);
    expect(MINOR_SEGMENTS[0].to - MINOR_SEGMENTS[0].from).toBe(4);
    expect(MINOR_SEGMENTS.length).toBeGreaterThan(MAJOR_SEGMENTS.length);
  });
});
