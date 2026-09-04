import { redirect } from 'next/navigation';

// الأسعار الآن قسم ضمن الصفحة الرئيسية — نوجّه الروابط القديمة إليه
export default function PricingRedirect() {
  redirect('/#pricing');
}
