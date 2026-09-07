import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { canViewFinance, canManageFinance } from '@/lib/permissions';
import FinanceView from '@/components/FinanceView';
import { getT, getLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function FinancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, org } = await requireOrgAccess(slug);
  const { t } = await getT();
  const locale = await getLocale();
  if (!canViewFinance(user)) redirect(`/org/${org.slug}`);

  const w = { organizationId: org.id };
  const [byKind, rows] = await Promise.all([
    prisma.financeTransaction.groupBy({ by: ['kind'], where: w, _sum: { amount: true } }),
    prisma.financeTransaction.findMany({
      where: w,
      orderBy: { date: 'desc' },
      take: 300,
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const income = Number(byKind.find((k) => k.kind === 'INCOME')?._sum.amount ?? 0);
  const expense = Number(byKind.find((k) => k.kind === 'EXPENSE')?._sum.amount ?? 0);

  // مخطّط آخر 6 أشهر
  const monthFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { month: 'short' });
  const now = new Date();
  const buckets: { key: string; label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthFmt.format(d), income: 0, expense: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const r of rows) {
    const d = new Date(r.date);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const i = idx.get(k);
    if (i !== undefined) {
      if (r.kind === 'INCOME') buckets[i].income += Number(r.amount);
      else buckets[i].expense += Number(r.amount);
    }
  }

  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{t('hub.corp')}</span>
          <h1>{t('onav.finance')}</h1>
          <p>{t('fin.sub', { org: org.name })}</p>
        </div>
      </div>
      <FinanceView
        canManage={canManageFinance(user)}
        summary={{ income, expense, net: income - expense }}
        monthly={buckets.map((b) => ({ label: b.label, income: b.income, expense: b.expense }))}
        transactions={rows.map((r) => ({
          id: r.id, kind: r.kind, category: r.category, amount: Number(r.amount),
          date: r.date.toISOString(), description: r.description, by: r.createdBy?.name ?? null,
        }))}
      />
    </div>
  );
}
