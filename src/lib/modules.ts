/**
 * وحدات المؤسسة القابلة للتفعيل/الإيقاف.
 * المخزَّن على المؤسسة هو قائمة «المعطّلة»؛ فالمفعّل = كل ما ليس معطّلًا.
 * الأساسيات (لوحة التحكم، المؤسسة، الهوية، الإعدادات، الإدارة) لا تُعطَّل.
 */
export const ORG_MODULES = [
  'operations',
  'resources',
  'education',
  'documents',
  'knowledge',
  'reports',
  'assistant',
  'content',
] as const;

export type OrgModule = (typeof ORG_MODULES)[number];

/** مفتاح ترجمة اسم الوحدة (يعاد استخدام مفاتيح التنقّل الموجودة). */
export const MODULE_LABEL_KEY: Record<OrgModule, string> = {
  operations: 'onav.operations',
  resources: 'onav.resources',
  education: 'onav.education',
  documents: 'onav.documents',
  knowledge: 'onav.knowledge',
  reports: 'onav.reports',
  assistant: 'onav.assistant',
  content: 'onav.content',
};

/** مفتاح ترجمة وصف مختصر للوحدة. */
export const MODULE_DESC_KEY: Record<OrgModule, string> = {
  operations: 'mod.desc.operations',
  resources: 'mod.desc.resources',
  education: 'mod.desc.education',
  documents: 'mod.desc.documents',
  knowledge: 'mod.desc.knowledge',
  reports: 'mod.desc.reports',
  assistant: 'mod.desc.assistant',
  content: 'mod.desc.content',
};

export function isOrgModule(value: string): value is OrgModule {
  return (ORG_MODULES as readonly string[]).includes(value);
}

/** هل الوحدة مفعّلة لهذه المؤسسة؟ */
export function moduleEnabled(disabled: string[] | null | undefined, m: OrgModule): boolean {
  return !(disabled ?? []).includes(m);
}
