'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ATTENDANCE_STATUSES } from '@/lib/permissions';
import { SURAHS, MAJOR_SEGMENTS, MINOR_SEGMENTS } from '@/lib/quran';
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
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]); // أحدث نسخة للحفظ المؤجَّل
  const [sending, setSending] = useState<'month' | 'day' | null>(null);
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function sendReport(scope: 'month' | 'day') {
    if (sending) return;
    setSending(scope); setSendMsg(null);
    try {
      const res = await fetch('/api/org/education/monthly/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedId, ym, scope }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) setSendMsg({ ok: true, text: t('qm.sentTo', { email: d.to }) });
      else if (d.reason === 'not_configured') setSendMsg({ ok: false, text: t('qm.emailNotConfigured') });
      else setSendMsg({ ok: false, text: t('qm.sendFailed') });
    } catch { setSendMsg({ ok: false, text: t('form.netErr') }); }
    finally { setSending(null); }
  }

  function navigate(next: { student?: string; ym?: string }) {
    const params = new URLSearchParams({ student: next.student ?? selectedId, ym: next.ym ?? ym });
    router.push(`${pathname}?${params.toString()}`);
  }

  async function save(dateStr: string) {
    if (!canManage) return;
    const row = dataRef.current[dateStr]; // أحدث حالة (يتفادى إغلاقًا قديمًا عند التعديل السريع)
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

  // تعيين حقلين معًا (لمقاطع المراجعة: من/إلى)
  function setRange(dateStr: string, fromField: string, toField: string, encoded: string) {
    const [from, to] = encoded ? encoded.split('-') : ['', ''];
    setData((d) => ({ ...d, [dateStr]: { ...d[dateStr], [fromField]: from, [toField]: to } }));
    clearTimeout(timers.current[dateStr]);
    timers.current[dateStr] = setTimeout(() => save(dateStr), 600);
  }
  const rangeVal = (dateStr: string, fromField: string, toField: string) => {
    const f = data[dateStr]?.[fromField], t2 = data[dateStr]?.[toField];
    return f && t2 ? `${f}-${t2}` : '';
  };

  // خلية قائمة السور (الدرس) — تُخزَّن رقم السورة في newFrom
  const surahCell = (r: Row) => (
    <select className="qm-in qm-surah" disabled={!canManage}
      value={data[r.dateStr]?.newFrom ?? ''} onChange={(e) => set(r.dateStr, 'newFrom', e.target.value)}>
      <option value="">—</option>
      {SURAHS.map((name, i) => <option key={i} value={i + 1}>{i + 1}. {name}</option>)}
    </select>
  );
  // خلية مقطع المراجعة (كبرى/صغرى)
  const segCell = (r: Row, segs: typeof MAJOR_SEGMENTS, fromField: string, toField: string) => (
    <select className="qm-in qm-seg" disabled={!canManage}
      value={rangeVal(r.dateStr, fromField, toField)} onChange={(e) => setRange(r.dateStr, fromField, toField, e.target.value)}>
      <option value="">—</option>
      {segs.map((s) => <option key={s.from} value={`${s.from}-${s.to}`}>{s.label}</option>)}
    </select>
  );

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
        <div><strong>{studentName}</strong>{halaqaName && <span> — {halaqaName}</span>}</div>
        {canManage && selectedId && (
          <div className="qm-send">
            <button className="org-btn org-btn-outline" disabled={!!sending} onClick={() => sendReport('day')}>
              {sending === 'day' ? t('qm.sending') : t('qm.sendDaily')}
            </button>
            <button className="org-btn org-btn-primary" disabled={!!sending} onClick={() => sendReport('month')}>
              {sending === 'month' ? t('qm.sending') : t('qm.sendMonthly')}
            </button>
          </div>
        )}
      </div>
      {sendMsg && <div className={`qm-sendmsg ${sendMsg.ok ? 'is-ok' : 'is-err'}`}>{sendMsg.text}</div>}

      <div className="qm-wrap">
        <table className="qm-table">
          <thead>
            <tr>
              <th>{t('qm.col.date')}</th>
              <th>{t('qm.col.day')}</th>
              <th>{t('qm.col.attendance')}</th>
              <th className="qm-g-new">{t('qm.col.lesson')}</th>
              <th className="qm-g-review">{t('qm.col.major')}</th>
              <th className="qm-g-last5">{t('qm.col.minor')}</th>
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
                  <td>{surahCell(r)}</td>
                  <td>{segCell(r, MAJOR_SEGMENTS, 'reviewFrom', 'reviewTo')}</td>
                  <td>{segCell(r, MINOR_SEGMENTS, 'last5From', 'last5To')}</td>
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
