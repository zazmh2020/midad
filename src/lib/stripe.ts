import Stripe from 'stripe';
import type { OrgPlan } from '@/generated/prisma/client';

/* ============================================================
   تكامل Stripe للاشتراكات — يعمل فقط عند ضبط المفاتيح.
   المفاتيح المطلوبة (متغيّرات بيئة):
     STRIPE_SECRET_KEY        — المفتاح السرّي
     STRIPE_WEBHOOK_SECRET    — سرّ التحقق من الـ webhook
     STRIPE_PRICE_GROWTH      — معرّف السعر (price_...) لباقة «نمو»
     STRIPE_PRICE_PROFESSIONAL— معرّف السعر لباقة «احترافي»
   ============================================================ */

let _stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (_stripe !== undefined) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  _stripe = key ? new Stripe(key) : null;
  return _stripe;
}

export function billingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** الباقات المدفوعة التي لها سعر في Stripe (المجانية والمخصّصة تُستثنى). */
export const PLAN_PRICE_ENV: Partial<Record<OrgPlan, string>> = {
  GROWTH: 'STRIPE_PRICE_GROWTH',
  PROFESSIONAL: 'STRIPE_PRICE_PROFESSIONAL',
};

/** معرّف السعر في Stripe لباقةٍ ما (أو null إن لم تكن مدفوعة/مضبوطة). */
export function priceIdForPlan(plan: OrgPlan): string | null {
  const envName = PLAN_PRICE_ENV[plan];
  return envName ? process.env[envName] ?? null : null;
}

/** عكسيًا: أي باقة يخصّها معرّف السعر (لمعالجة الـ webhook). */
export function planForPriceId(priceId: string): OrgPlan | null {
  for (const [plan, envName] of Object.entries(PLAN_PRICE_ENV)) {
    if (process.env[envName] === priceId) return plan as OrgPlan;
  }
  return null;
}
