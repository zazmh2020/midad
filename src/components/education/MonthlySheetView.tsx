'use client';

import { useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ATTENDANCE_STATUSES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Row = {
  day: number; dateStr: string; weekday: number;
  attendance: string;
  newFrom: number | null; newTo: number | null; newNote: string | null;
  reviewFrom: number | null; reviewTo: number | null;
  last5From: number | null; last5To: number | null;
  listener: string | null; pages: number | null;
  errors: number | null; alerts: number | null;
  reviewScore: number | null; conductScore: number | null;
  notes: string | null; exists: boolean;
};
type Student = { id: string; name: string; halaqa: string | null };

const NUM_FIELDS = ['newFrom', 'newTo', 'reviewFrom', 'reviewTo', 'last5From', 'last5To', 'pages', 'errors', 'alerts', 'reviewScore', 'conductScore'] as const;

export default function MonthlySheetView({
  students, selectedId, studentName, halaqaName, ym, rows, canManage,
}: {
  students: Student[]; selectedId: string; studentName: string; halaqaName: string | null;
  ym: string; rows: Row[]; canManage: boolean;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const wdFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar', { weekday: 'short' });

  const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  const [data, setData] = useState<Record<string, Record<string, string>>>(() => {
    const out: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      out[r.dateStr] = {
        attendance: r.attendance,
        newFrom: toStr(r.newFrom), newTo: toStr(r.newTo), newNote: toStr(r.newNote),
        reviewFrom: toStr(r.reviewFrom), reviewTo: toStr(r.reviewTo),
        last5From: toStr(r.last5From), last5To: toStr(r.last5To),
        listener: toStr(r.listener), pages: toStr(r.pages),
        errors: toStr(r.errors), alerts: toStr(r.alerts),
        reviewScore: toStr(r.reviewScore), conductScore: toStr(r.conductScore),
        notes: toStr(r.notes),
      };
    }
    return out;
  });
  const [saved, setSaved] = useState<Record<string, 'saving' | 'ok' | 'err'>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function navigate(next: { student?: string; ym?: string }) {
    const params = new URLSearchParams({ student: next.student ?? selectedId, ym: next.ym ?? ym });
    router.push(`${pathname}?${params.toString()}`);
  }

  async function save(dateStr: string) {
    if (!canManage) return;
    const row = data[dateStr];
    setSaved((s) => ({ ...s, [dateStr]: 'saving' }));
    try {
      const res = await fetch('/api/org/education/monthly', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedId, date: dateStr, ...row }),
      });
      setSaved((s) => ({ ...s, [dateStr]: res.ok ? 'ok' : 'err' }));
    } catch { setSaved((s) => ({ ...s, [dateStr]: 'err' })); }
  }

  function set(dateStr: string, field: string, value: string) {
    setData((d) => ({ ...d, [dateStr]: { ...d[dateStr], [field]: value } }));
    clearTimeout(timers.current[dateStr]);
    timers.current[dateStr] = setTimeout(() => save(dateStr), 600);
  }

  const total = (dateStr: string) =>
    (Number(data[dateStr]?.reviewScore) || 0) + (Number(data[dateStr]?.conductScore) || 0);

  // ملخّص الشهر
  const presentDays = rows.filter((r) => (data[r.dateStr]?.attendance ?? 'PRESENT') !== 'ABSENT' && (data[r.dateStr]?.newFrom || data[r.dateStr]?.reviewFrom || data[r.dateStr]?.pages)).length;
  const activeDays = rows.filter((r) => data[r.dateStr]?.newFrom || data[r.dateStr]?.reviewFrom || data[r.dateStr]?.pages || data[r.dateStr]?.attendance === 'ABSENT').length;
  const totalPages = rows.reduce((s, r) => s + (Number(data[r.dateStr]?.pages) || 0), 0);
  const totalScore = rows.reduce((s, r) => s + total(r.dateStr), 0);
  const attendancePct = activeDays ? Math.round((presentDays / activeDays) * 100) : 0;

  const numCell = (r: Row, field: (typeof NUM_FIELDS)[number]) => (
    <input
      type="number" className="qm-in qm-num" disabled={!canManage}
      value={data[r.dateStr]?.[field] ?? ''} onChange={(e) => set(r.dateStr, field, e.target.value)}
    />
  );

  return (
    <>
      <div className="qm-toolbar">
        <label className="qm-tool">
          <span>{t('qm.student')}</span>
          <select value={selectedId} onChange={(e) => navigate({ student: e.target.value })}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.halaqa ? ` — ${s.halaqa}` : ''}</option>
            ))}
          </select>
        </label>
        <label className="qm-tool">
          <span>{t('qm.month')}</span>
          <input type="month" value={ym} onChange={(e) => e.target.value && navigate({ ym: e.target.value })} />
        </label>
        <div className="qm-summary">
          <span>{t('qm.sumPages', { n: totalPages })}</span>
          <span>{t('qm.sumScore', { n: totalScore })}</span>
          <span>{t('qm.sumAttendance', { n: attendancePct })}</span>
        </div>
      </div>

      <div className="qm-meta">
        <strong>{studentName}</strong>{halaqaName && <span> — {halaqaName}</span>}
      </div>

      <div className="qm-wrap">
        <table className="qm-table">
          <thead>
            <tr>
              <th>{t('qm.col.date')}</th>
              <th>{t('qm.col.day')}</th>
              <th>{t('qm.col.attendance')}</th>
              <th colSpan={2} className="qm-g-new">{t('qm.col.newLesson')}</th>
              <th colSpan={2} className="qm-g-review">{t('qm.col.review')}</th>
              <th colSpan={2} className="qm-g-last5">{t('qm.col.last5')}</th>
              <th>{t('qm.col.pages')}</th>
              <th>{t('qm.col.errors')}</th>
              <th>{t('qm.col.alerts')}</th>
              <th>{t('qm.col.listener')}</th>
              <th>{t('qm.col.reviewScore')}</th>
              <th>{t('qm.col.conduct')}</th>
              <th>{t('qm.col.total')}</th>
              <th>{t('qm.col.notes')}</th>
              <th aria-label="status" />
            </tr>
            <tr className="qm-subhead">
              <th /><th /><th />
              <th className="qm-g-new">{t('qm.from')}</th><th className="qm-g-new">{t('qm.to')}</th>
              <th className="qm-g-review">{t('qm.from')}</th><th className="qm-g-review">{t('qm.to')}</th>
              <th className="qm-g-last5">{t('qm.from')}</th><th className="qm-g-last5">{t('qm.to')}</th>
              <th /><th /><th /><th /><th /><th /><th /><th /><th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const wd = wdFmt.format(new Date(`${r.dateStr}T00:00:00Z`));
              const absent = data[r.dateStr]?.attendance === 'ABSENT';
              const st = saved[r.dateStr];
              return (
                <tr key={r.dateStr} className={absent ? 'qm-absent' : ''}>
                  <td className="qm-date">{r.day}</td>
                  <td className="qm-wd">{wd}</td>
                  <td>
                    <select className="qm-in qm-att" disabled={!canManage}
                      value={data[r.dateStr]?.attendance ?? 'PRESENT'}
                      onChange={(e) => set(r.dateStr, 'attendance', e.target.value)}>
                      {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{t(`status.attendance.${s}`)}</option>)}
                    </select>
                  </td>
                  <td>{numCell(r, 'newFrom')}</td>
                  <td>{numCell(r, 'newTo')}</td>
                  <td>{numCell(r, 'reviewFrom')}</td>
                  <td>{numCell(r, 'reviewTo')}</td>
                  <td>{numCell(r, 'last5From')}</td>
                  <td>{numCell(r, 'last5To')}</td>
                  <td>{numCell(r, 'pages')}</td>
                  <td>{numCell(r, 'errors')}</td>
                  <td>{numCell(r, 'alerts')}</td>
                  <td>
                    <input className="qm-in qm-txt" disabled={!canManage}
                      value={data[r.dateStr]?.listener ?? ''} onChange={(e) => set(r.dateStr, 'listener', e.target.value)} />
                  </td>
                  <td>{numCell(r, 'reviewScore')}</td>
                  <td>{numCell(r, 'conductScore')}</td>
                  <td className="qm-total">{total(r.dateStr) || ''}</td>
                  <td>
                    <input className="qm-in qm-txt" disabled={!canManage}
                      value={data[r.dateStr]?.notes ?? ''} onChange={(e) => set(r.dateStr, 'notes', e.target.value)} />
                  </td>
                  <td className="qm-status">
                    {st === 'saving' && <span className="qm-dot qm-dot-saving" title={t('qm.saving')} />}
                    {st === 'ok' && <span className="qm-dot qm-dot-ok" title={t('form.saved')} />}
                    {st === 'err' && <span className="qm-dot qm-dot-err" title={t('form.saveErr')} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canManage && <p className="qm-hint">{t('qm.autosave')}</p>}
    </>
  );
}
