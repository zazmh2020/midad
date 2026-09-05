import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageEducation } from '@/lib/permissions';
import { sendEmail } from '@/lib/email';

const numFmt = new Intl.NumberFormat('en-US');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** يرسل التقرير الشهري أو اليومي لطالب إلى بريد الفاعل. */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageEducation(actor.role)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const studentId = String(body?.studentId ?? '');
  const scope = body?.scope === 'day' ? 'day' : 'month';
  const ym = String(body?.ym ?? '');
  if (!studentId || !/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json({ error: 'بيانات ناقصة.' }, { status: 400 });
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId: actor.organization.id },
    select: { id: true, name: true, guardianEmail: true, halaqa: { select: { name: true } } },
  });
  if (!student) return NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 404 });

  const [year, month] = ym.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const records = await prisma.quranDailyRecord.findMany({
    where: { studentId, date: { gte: monthStart, lt: monthEnd } },
    orderBy: { date: 'asc' },
  });

  const totalPages = records.reduce((s, r) => s + (r.pages ?? 0), 0);
  const totalScore = records.reduce((s, r) => s + (r.reviewScore ?? 0) + (r.conductScore ?? 0), 0);
  const active = records.filter((r) => r.newFrom || r.reviewFrom || r.pages || r.attendance === 'ABSENT');
  const present = active.filter((r) => r.attendance !== 'ABSENT');
  const pct = active.length ? Math.round((present.length / active.length) * 100) : 0;

  const orgName = esc(actor.organization.name);
  const sName = esc(student.name);
  const halaqa = student.halaqa?.name ? ` — ${esc(student.halaqa.name)}` : '';

  let subject: string;
  let html: string;

  if (scope === 'day') {
    const todayIso = new Date().toISOString().slice(0, 10);
    const dayRec = records.find((r) => r.date.toISOString().slice(0, 10) === todayIso) ?? records[records.length - 1];
    subject = `التقرير اليومي — ${student.name}`;
    const d = dayRec
      ? `<ul>
          <li>التاريخ: ${dayRec.date.toISOString().slice(0, 10)}</li>
          <li>الدرس الجديد: ${dayRec.newFrom ?? '—'} → ${dayRec.newTo ?? '—'}</li>
          <li>المراجعة: ${dayRec.reviewFrom ?? '—'} → ${dayRec.reviewTo ?? '—'}</li>
          <li>الصفحات: ${dayRec.pages ?? '—'} · الأخطاء: ${dayRec.errors ?? '—'}</li>
          <li>المجموع: ${(dayRec.reviewScore ?? 0) + (dayRec.conductScore ?? 0)}</li>
        </ul>`
      : '<p>لا يوجد سجل لهذا اليوم.</p>';
    html = `<div dir="rtl" style="font-family:sans-serif"><h2>${orgName}</h2><p><b>${sName}</b>${halaqa}</p>${d}</div>`;
  } else {
    subject = `التقرير الشهري (${ym}) — ${student.name}`;
    html = `<div dir="rtl" style="font-family:sans-serif">
      <h2>${orgName}</h2>
      <p><b>${sName}</b>${halaqa} · ${ym}</p>
      <ul>
        <li>إجمالي الصفحات: ${numFmt.format(totalPages)}</li>
        <li>إجمالي الدرجات: ${numFmt.format(totalScore)}</li>
        <li>نسبة الحضور: ${pct}%</li>
        <li>أيام مسجّلة: ${active.length}</li>
      </ul>
    </div>`;
  }

  const to = student.guardianEmail || actor.email;
  const result = await sendEmail({ to, subject, html });
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason ?? 'send_failed' }, { status: 200 });
  }
  return NextResponse.json({ ok: true, to });
}
