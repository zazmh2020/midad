import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewEducation } from '@/lib/permissions';
import SectionHub, { type HubItem } from '@/components/SectionHub';

export const dynamic = 'force-dynamic';

export default async function EducationHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);

  if (!canViewEducation(user.role)) redirect(`/org/${org.slug}`);
  const base = `/org/${org.slug}/education`;
  const w = { organizationId: org.id };
  const quran = org.type === 'MOSQUE';

  const [teachers, students, halaqat, memos] = await Promise.all([
    prisma.teacher.count({ where: w }),
    prisma.student.count({ where: w }),
    prisma.halaqa.count({ where: w }),
    prisma.memorizationEntry.count({ where: w }),
  ]);

  const items: HubItem[] = [
    { title: 'الطلاب', desc: 'ملفات الطلاب وأولياء أمورهم.', href: `${base}/students`, count: students },
    { title: 'المعلمون', desc: 'المعلمون وتخصصاتهم.', href: `${base}/teachers`, count: teachers },
    { title: quran ? 'الحلقات' : 'الفصول', desc: quran ? 'حلقات التحفيظ ومواعيدها.' : 'الفصول والمجموعات.', href: `${base}/halaqat`, count: halaqat },
    { title: 'الحضور', desc: 'تسجيل الحضور والغياب.', href: `${base}/attendance` },
    { title: quran ? 'الحفظ والتسميع' : 'الواجبات', desc: quran ? 'خطط الحفظ والتسميع والتقدير.' : 'متابعة الواجبات.', href: `${base}/memorization`, count: memos },
    { title: 'التقييم والشهادات', desc: 'الاختبارات والدرجات والشهادات.' },
  ];

  return (
    <SectionHub
      eyebrow="العمل المؤسسي"
      title="التعليم"
      intro={quran ? 'النظام التعليمي والحلقات القرآنية.' : 'النظام التعليمي وإدارة الطلاب والمعلمين.'}
      items={items}
    />
  );
}
