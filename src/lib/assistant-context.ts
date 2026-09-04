import type { Organization, User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import {
  canViewUsers, canViewProjects, canViewPrograms, canViewCampaigns,
  canViewDonations, canViewBeneficiaries, canViewStructure, canViewKnowledge,
  canViewDocuments, roleLabel, projectStatusLabel, programStatusLabel,
  campaignStatusLabel, beneficiaryStatusLabel, beneficiaryCategoryLabel,
} from '@/lib/permissions';

const numFmt = new Intl.NumberFormat('en-US');

/**
 * يبني سياقًا نصيًا لمؤسسة الفاعل يحوي فقط ما يحقّ لدوره الاطّلاع عليه.
 * هذا هو حدّ الأمان: المساعد لا يرى إلا ما يُدرج هنا، فلا يكشف المحجوب.
 */
export async function buildAssistantContext(
  actor: User & { organization: Organization },
): Promise<string> {
  const org = actor.organization;
  const where = { organizationId: org.id };
  const lines: string[] = [];

  lines.push(`المؤسسة: ${org.name} (المعرّف الفرعي: ${org.slug})`);
  lines.push(`دور المستخدم الحالي: ${roleLabel(actor.role)}`);
  lines.push('');

  // الهيكل التنظيمي
  if (canViewStructure(actor.role)) {
    const depts = await prisma.department.findMany({
      where, orderBy: { name: 'asc' },
      select: { name: true, parent: { select: { name: true } }, _count: { select: { members: true } } },
    });
    if (depts.length) {
      lines.push('# الوحدات التنظيمية');
      for (const d of depts) {
        const parent = d.parent ? ` (تتبع: ${d.parent.name})` : '';
        lines.push(`- ${d.name}${parent} — ${d._count.members} عضو`);
      }
      lines.push('');
    }
  }

  // المستخدمون
  if (canViewUsers(actor.role)) {
    const users = await prisma.user.findMany({
      where, orderBy: { createdAt: 'asc' },
      select: { name: true, role: true, isActive: true, department: { select: { name: true } } },
    });
    if (users.length) {
      lines.push('# المستخدمون');
      for (const u of users) {
        const dept = u.department ? ` — ${u.department.name}` : '';
        lines.push(`- ${u.name} (${roleLabel(u.role)}${u.isActive ? '' : '، موقوف'})${dept}`);
      }
      lines.push('');
    }
  }

  // المشاريع
  if (canViewProjects(actor.role)) {
    const projects = await prisma.project.findMany({
      where, orderBy: { createdAt: 'desc' },
      select: { name: true, status: true, department: { select: { name: true } } },
    });
    if (projects.length) {
      lines.push('# المشاريع');
      for (const p of projects) {
        const dept = p.department ? ` — ${p.department.name}` : '';
        lines.push(`- ${p.name} (${projectStatusLabel(p.status)})${dept}`);
      }
      lines.push('');
    }
  }

  // البرامج
  if (canViewPrograms(actor.role)) {
    const programs = await prisma.program.findMany({
      where, orderBy: { createdAt: 'desc' },
      select: { name: true, status: true, capacity: true },
    });
    if (programs.length) {
      lines.push('# البرامج');
      for (const p of programs) {
        const cap = p.capacity != null ? `، السعة ${numFmt.format(p.capacity)}` : '';
        lines.push(`- ${p.name} (${programStatusLabel(p.status)}${cap})`);
      }
      lines.push('');
    }
  }

  // الحملات
  if (canViewCampaigns(actor.role)) {
    const campaigns = await prisma.campaign.findMany({
      where, orderBy: { createdAt: 'desc' },
      select: { name: true, status: true, goalAmount: true },
    });
    if (campaigns.length) {
      lines.push('# الحملات');
      for (const c of campaigns) {
        const goal = c.goalAmount != null ? `، الهدف ${numFmt.format(c.goalAmount)}` : '';
        lines.push(`- ${c.name} (${campaignStatusLabel(c.status)}${goal})`);
      }
      lines.push('');
    }
  }

  // التبرعات (حسّاسة)
  if (canViewDonations(actor.role)) {
    const [count, received] = await Promise.all([
      prisma.donation.count({ where }),
      prisma.donation.aggregate({ where: { ...where, status: 'RECEIVED' }, _sum: { amount: true } }),
    ]);
    lines.push('# التبرعات');
    lines.push(`- عدد العمليات: ${numFmt.format(count)}`);
    lines.push(`- إجمالي المستلَم: ${numFmt.format(received._sum.amount ?? 0)}`);
    lines.push('');
  }

  // المستفيدون (حسّاسة)
  if (canViewBeneficiaries(actor.role)) {
    const byStatus = await prisma.beneficiary.groupBy({ by: ['status'], where, _count: true });
    const byCat = await prisma.beneficiary.groupBy({ by: ['category'], where, _count: true });
    const total = byStatus.reduce((s, r) => s + r._count, 0);
    if (total) {
      lines.push('# المستفيدون');
      lines.push(`- الإجمالي: ${numFmt.format(total)}`);
      lines.push(`- حسب الحالة: ${byStatus.map((r) => `${beneficiaryStatusLabel(r.status)} ${r._count}`).join('، ')}`);
      lines.push(`- حسب التصنيف: ${byCat.map((r) => `${beneficiaryCategoryLabel(r.category)} ${r._count}`).join('، ')}`);
      lines.push('');
    }
  }

  // قاعدة المعرفة — المنشور للجميع، والمسودّات لمن يدير
  if (canViewKnowledge(actor.role)) {
    const canDrafts = actor.role === 'ORG_ADMIN' || actor.role === 'STAFF';
    const articles = await prisma.knowledgeArticle.findMany({
      where: { ...where, ...(canDrafts ? {} : { isPublished: true }) },
      orderBy: { updatedAt: 'desc' },
      select: { title: true, category: true, isPublished: true, body: true },
    });
    if (articles.length) {
      lines.push('# قاعدة المعرفة');
      for (const a of articles) {
        const cat = a.category ? ` [${a.category}]` : '';
        const draft = a.isPublished ? '' : ' (مسودّة)';
        // مقتطف من المحتوى ليتمكن المساعد من التلخيص
        const excerpt = a.body.slice(0, 500).replace(/\s+/g, ' ');
        lines.push(`- ${a.title}${cat}${draft}: ${excerpt}`);
      }
      lines.push('');
    }
  }

  // الوثائق — البيانات الوصفية فقط
  if (canViewDocuments(actor.role)) {
    const docs = await prisma.document.findMany({
      where, orderBy: { createdAt: 'desc' },
      select: { name: true, category: true, fileName: true },
    });
    if (docs.length) {
      lines.push('# الوثائق');
      for (const d of docs) {
        const cat = d.category ? ` [${d.category}]` : '';
        lines.push(`- ${d.name}${cat} (${d.fileName})`);
      }
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}
