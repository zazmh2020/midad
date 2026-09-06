import { NextResponse } from 'next/server';
import type { OrgPlan } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { getStripe, priceIdForPlan } from '@/lib/stripe';

/** ينشئ جلسة دفع Stripe لترقية اشتراك المؤسسة. */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 200 });

  const body = await request.json().catch(() => null);
  const plan = String(body?.plan ?? '') as OrgPlan;
  const priceId = priceIdForPlan(plan);
  if (!priceId) return NextResponse.json({ error: 'الباقة غير متاحة للدفع.' }, { status: 400 });

  const org = actor.organization;
  const proto = new URL(request.url).protocol;
  const host = request.headers.get('host') ?? '';
  const base = `${proto}//${host}`;

  // عميل Stripe للمؤسسة (يُنشأ مرة واحدة)
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: actor.email,
      metadata: { organizationId: org.id, slug: org.slug },
    });
    customerId = customer.id;
    await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing?status=success`,
    cancel_url: `${base}/billing?status=cancel`,
    metadata: { organizationId: org.id, plan },
    subscription_data: { metadata: { organizationId: org.id, plan } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
