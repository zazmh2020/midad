/** تعريفات جدول نهاية الشهر لمركز القرآن: المسميات الافتراضية والحساب والتقدير. */

export type BiLabel = { ar: string; en: string };

/** مفاتيح المسميات القابلة للتخصيص لكل مركز. */
export const SUMMARY_LABELS: Record<string, BiLabel> = {
  title: { ar: 'جدول نهاية الشهر', en: 'End of Month Table' },
  notReciteNew: { ar: 'عدد مرات عدم تسميع الدرس الجديد', en: 'Number of not reciting the new lesson' },
  notReciteLast5: { ar: 'عدد مرات عدم تسميع آخر ٥ صفحات', en: 'Number of not reciting the last 5 pages' },
  notReciteReview: { ar: 'عدد مرات عدم تسميع المراجعة', en: 'Number of not reciting the review' },
  absenceExcused: { ar: 'عدد أيام الغياب بعذر', en: 'Number of absence days with excuse' },
  absenceUnexcused: { ar: 'عدد أيام الغياب بدون عذر', en: 'Number of absence days without excuse' },
  pageNumber: { ar: 'رقم الصفحة', en: 'Page number' },
  generalScore: { ar: 'التقدير العام', en: 'General score' },
  percentage: { ar: 'النسبة', en: 'Percentage' },
};

/** الصفوف العدّية بترتيب العرض. */
export const SUMMARY_METRIC_KEYS = [
  'notReciteNew', 'notReciteLast5', 'notReciteReview', 'absenceExcused', 'absenceUnexcused',
] as const;

export type SummaryMetricKey = (typeof SUMMARY_METRIC_KEYS)[number];

/** حدود التقدير العام حسب النسبة المئوية. */
export const GENERAL_SCORE: { min: number; label: BiLabel }[] = [
  { min: 90, label: { ar: 'ممتاز', en: 'Excellent' } },
  { min: 80, label: { ar: 'جيّد جدًا', en: 'Very good' } },
  { min: 70, label: { ar: 'جيّد', en: 'Good' } },
  { min: 60, label: { ar: 'مقبول', en: 'Acceptable' } },
  { min: 0, label: { ar: 'ضعيف', en: 'Weak' } },
];

export function scoreLabel(pct: number): BiLabel {
  return (GENERAL_SCORE.find((g) => pct >= g.min) ?? GENERAL_SCORE[GENERAL_SCORE.length - 1]).label;
}

/** يدمج المسميات الافتراضية مع تخصيص المركز (overrides). */
export function mergeLabels(overrides: unknown): Record<string, BiLabel> {
  const o = (overrides && typeof overrides === 'object' ? overrides : {}) as Record<string, Partial<BiLabel>>;
  const out: Record<string, BiLabel> = {};
  for (const [k, def] of Object.entries(SUMMARY_LABELS)) {
    out[k] = { ar: o[k]?.ar?.trim() || def.ar, en: o[k]?.en?.trim() || def.en };
  }
  return out;
}

type DayData = Record<string, string> | undefined;

/** يحسب مقاييس نهاية الشهر من بيانات الأيام. */
export function computeMonthSummary(
  dateStrs: string[],
  data: Record<string, Record<string, string>>,
): Record<SummaryMetricKey, number> & { percentage: number; attendedDays: number } {
  const att = (ds: string) => (data[ds] as DayData)?.attendance ?? 'PRESENT';
  const has = (ds: string) => {
    const d = data[ds] as DayData;
    return !!(d?.newFrom || d?.reviewFrom || d?.last5From || d?.pages);
  };
  const attended = dateStrs.filter((ds) => att(ds) !== 'ABSENT' && att(ds) !== 'EXCUSED' && has(ds));
  const notReciteNew = attended.filter((ds) => !data[ds]?.newFrom).length;
  const notReciteLast5 = attended.filter((ds) => !data[ds]?.last5From).length;
  const notReciteReview = attended.filter((ds) => !data[ds]?.reviewFrom).length;
  const absenceExcused = dateStrs.filter((ds) => att(ds) === 'EXCUSED').length;
  const absenceUnexcused = dateStrs.filter((ds) => att(ds) === 'ABSENT').length;
  const opportunities = attended.length * 3;
  const missed = notReciteNew + notReciteLast5 + notReciteReview;
  const percentage = opportunities > 0 ? Math.round(((opportunities - missed) / opportunities) * 100) : 0;
  return {
    notReciteNew, notReciteLast5, notReciteReview, absenceExcused, absenceUnexcused,
    percentage, attendedDays: attended.length,
  };
}
