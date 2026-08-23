import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { Role } from '@/generated/prisma/client';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const actor = await requireUser();
  if (!['PLATFORM_OWNER', 'ORG_ADMIN'].includes(actor.role)) return NextResponse.redirect(new URL('/app', request.url));
  const data = await request.formData();
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim().toLowerCase();
  const password = String(data.get('password') ?? '');
  const role = String(data.get('role') ?? '') as Role;
  const requestedOrganizationId = String(data.get('organizationId') ?? '');
  const organizationId = actor.role === 'PLATFORM_OWNER' ? requestedOrganizationId : actor.organizationId;
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || !organizationId || !['ORG_ADMIN', 'STAFF', 'MEMBER'].includes(role)) return NextResponse.redirect(new URL('/app/users/new?error=invalid', request.url));
  const organization = await prisma.organization.findFirst({ where: { id: organizationId, isActive: true }, select: { id: true } });
  if (!organization) return NextResponse.redirect(new URL('/app/users/new?error=organization', request.url));
  try { await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12), role, organizationId } }); }
  catch { return NextResponse.redirect(new URL('/app/users/new?error=exists', request.url)); }
  return NextResponse.redirect(new URL('/app/users', request.url));
}
