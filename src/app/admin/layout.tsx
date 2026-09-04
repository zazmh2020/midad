import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import AdminShell from './AdminShell';
import '@/styles/admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // فقط مالك المنصة يصل هنا
  if (!session) redirect('/login');
  if (session.role !== 'PLATFORM_OWNER') redirect('/login');

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { avatarUrl: true },
  });

  return <AdminShell session={session} avatarUrl={me?.avatarUrl ?? null}>{children}</AdminShell>;
}
