import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageSettings } from '@/lib/permissions';
import { ORG_MODULES, isOrgModule } from '@/lib/modules';
import { logAudit } from '@/lib/audit';

/** تعيين الوحدات المعطّلة للمؤسسة (مدير المؤسسة فقط). */
export async function PATCH(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageSettings(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.disabledModules)) {
    return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  }

  // عزل: نقبل فقط مفاتيح وحدات معروفة، بلا تكرار
  const raw: string[] = (body.disabledModules as unknown[]).map((x) => String(x));
  const disabled = [...new Set(raw)].filter(isOrgModule);
  if (disabled.length > ORG_MODULES.length) {
    return NextResponse.json({ error: 'قيمة غير صالحة.' }, { status: 400 });
  }

  await prisma.organization.update({
    where: { id: actor.organization.id }, // عزل: دائمًا مؤسسة الفاعل
    data: { disabledModules: disabled },
  });

  await logAudit(actor.organization.id, actor.name, "updated", "modules", disabled.length ? disabled.join(", ") : "—");
  return NextResponse.json({ ok: true });
}
