import { NextResponse } from 'next/server';
import { OrgType } from '@/generated/prisma/client';
import { requirePlatformOwner } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) { await requirePlatformOwner(); const data = await request.formData(); const name = String(data.get('name') ?? '').trim(); const slug = String(data.get('slug') ?? '').trim().toLowerCase(); const type = String(data.get('type') ?? '') as OrgType; if (!name || !/^[a-z0-9-]+$/.test(slug) || !Object.values(OrgType).includes(type)) return NextResponse.redirect(new URL('/app/organizations/new?error=invalid', request.url)); try { await prisma.organization.create({ data: { name, slug, type } }); } catch { return NextResponse.redirect(new URL('/app/organizations/new?error=exists', request.url)); } return NextResponse.redirect(new URL('/app/organizations', request.url)); }
