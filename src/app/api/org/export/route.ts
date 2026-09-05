import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canViewEducation, canViewDonations } from '@/lib/permissions';
import { csvRow as row, csvBody } from '@/lib/csv';

function csvResponse(name: string, rows: string[]): Response {
  return new Response(csvBody(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
    },
  });
}

/** تصدير بيانات المؤسسة كـ CSV — ?type=students|donations */
export async function GET(request: Request) {
  const actor = await getOrgActor();
  if (!actor) return new Response('غير مصرّح.', { status: 403 });
  const orgId = actor.organization.id;
  const type = new URL(request.url).searchParams.get('type') ?? '';

  if (type === 'students') {
    if (!canViewEducation(actor.role)) return new Response('غير مصرّح.', { status: 403 });
    const students = await prisma.student.findMany({
      where: { organizationId: orgId }, orderBy: { name: 'asc' },
      select: { name: true, phone: true, guardianName: true, guardianPhone: true, guardianEmail: true, status: true, halaqa: { select: { name: true } } },
    });
    const rows = [row(['الاسم', 'الهاتف', 'ولي الأمر', 'هاتف ولي الأمر', 'بريد ولي الأمر', 'الحالة', 'الحلقة'])];
    for (const s of students) rows.push(row([s.name, s.phone, s.guardianName, s.guardianPhone, s.guardianEmail, s.status, s.halaqa?.name]));
    return csvResponse('students', rows);
  }

  if (type === 'donations') {
    if (!canViewDonations(actor.role)) return new Response('غير مصرّح.', { status: 403 });
    const donations = await prisma.donation.findMany({
      where: { organizationId: orgId }, orderBy: { donatedAt: 'desc' },
      select: { donorName: true, amount: true, method: true, status: true, donatedAt: true, campaign: { select: { name: true } } },
    });
    const rows = [row(['المتبرع', 'المبلغ', 'الطريقة', 'الحالة', 'التاريخ', 'الحملة'])];
    for (const d of donations) rows.push(row([d.donorName, d.amount, d.method, d.status, d.donatedAt.toISOString().slice(0, 10), d.campaign?.name]));
    return csvResponse('donations', rows);
  }

  return new Response('نوع غير معروف.', { status: 400 });
}
