import { NextResponse } from 'next/server';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { getStripe } from '@/lib/stripe';

/** ينشئ رابط بوابة الفوترة (إدارة/إلغاء الاشتراك، الفواتير). */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 200 });
  if (!actor.organization.stripeCustomerId) {
    return NextResponse.json({ ok: false, reason: 'no_customer' }, { status: 200 });
  }

  const proto = new URL(request.url).protocol;
  const host = request.headers.get('host') ?? '';
  const session = await stripe.billingPortal.sessions.create({
    customer: actor.organization.stripeCustomerId,
    return_url: `${proto}//${host}/billing`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
