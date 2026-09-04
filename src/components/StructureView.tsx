'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Dept = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  memberCount: number;
};

type TreeNode = Dept & { children: TreeNode[]; depth: number };

function buildTree(list: Dept[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>();
  list.forEach((d) => nodes.set(d.id, { ...d, children: [], depth: 0 }));
  const roots: TreeNode[] = [];
  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const assignDepth = (node: TreeNode, depth: number) => {
    node.depth = depth;
    node.children.forEach((c) => assignDepth(c, depth + 1));
  };
  roots.forEach((r) => assignDepth(r, 0));
  return roots;
}

/** مجموعة معرّفات الوحدة وكل فروعها — تُستبعد من قائمة "الأصل" عند التعديل */
function descendantIds(id: string, list: Dept[]): Set<string> {
  const childrenOf = new Map<string, string[]>();
  list.forEach((d) => {
    if (d.parentId) {
      const arr = childrenOf.get(d.parentId) ?? [];
      arr.push(d.id);
      childrenOf.set(d.parentId, arr);
    }
  });
  const out = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const child of childrenOf.get(cur) ?? []) {
      if (!out.has(child)) { out.add(child); stack.push(child); }
    }
  }
  return out;
}

type Mode = { kind: 'closed' } | { kind: 'create'; parentId: string | null } | { kind: 'edit'; dept: Dept };

export default function StructureView({
  departments,
  canManage,
}: {
  departments: Dept[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tree = useMemo(() => buildTree(departments), [departments]);

  function flatFor(select: 'create' | 'edit', editId?: string) {
    const excluded = select === 'edit' && editId ? descendantIds(editId, departments) : new Set<string>();
    // ترتيب هرمي بسيط للعرض في القائمة المنسدلة
    const ordered: { id: string; label: string }[] = [];
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (!excluded.has(n.id)) {
          ordered.push({ id: n.id, label: `${'— '.repeat(n.depth)}${n.name}` });
          walk(n.children);
        }
      });
    };
    walk(tree);
    return ordered;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mode.kind === 'closed') return;
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const name = String(form.get('name') ?? '');
    const description = String(form.get('description') ?? '');
    const parentId = String(form.get('parentId') ?? '') || null;

    setBusy(true);
    setError('');
    try {
      const url = mode.kind === 'edit' ? `/api/org/departments/${mode.dept.id}` : '/api/org/departments';
      const method = mode.kind === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, parentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحفظ.');
      else { setMode({ kind: 'closed' }); router.refresh(); }
    } catch {
      setError('تعذّر الاتصال بالخادم.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذه الوحدة؟')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/org/departments/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'تعذّر الحذف.');
      else router.refresh();
    } catch {
      setError('تعذّر الاتصال بالخادم.');
    } finally {
      setBusy(false);
    }
  }

  function renderForm() {
    if (mode.kind === 'closed') return null;
    const editing = mode.kind === 'edit';
    const options = flatFor(editing ? 'edit' : 'create', editing ? mode.dept.id : undefined);
    const defaultParent = editing ? mode.dept.parentId ?? '' : mode.parentId ?? '';
    return (
      <form className="org-form" onSubmit={submit} key={editing ? mode.dept.id : `new-${mode.parentId}`}>
        {error && <div className="org-alert">{error}</div>}
        <div className="org-field">
          <label htmlFor="d-name">اسم الوحدة</label>
          <input id="d-name" name="name" defaultValue={editing ? mode.dept.name : ''} required />
        </div>
        <div className="org-field">
          <label htmlFor="d-desc">الوصف <span className="org-hint">اختياري</span></label>
          <textarea id="d-desc" name="description" rows={2} defaultValue={editing ? mode.dept.description ?? '' : ''} />
        </div>
        <div className="org-field">
          <label htmlFor="d-parent">الوحدة الأصل</label>
          <select id="d-parent" name="parentId" defaultValue={defaultParent}>
            <option value="">— بلا أصل (وحدة رئيسية)</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="org-form-actions">
          <button type="button" className="org-btn org-btn-outline" onClick={() => setMode({ kind: 'closed' })}>
            إلغاء
          </button>
          <button type="submit" className="org-btn org-btn-primary" disabled={busy}>
            {busy ? 'جارٍ الحفظ…' : editing ? 'حفظ' : 'إنشاء'}
          </button>
        </div>
      </form>
    );
  }

  function renderNode(node: TreeNode) {
    return (
      <li key={node.id} className="org-tree-item">
        <div className="org-tree-row">
          <div className="org-tree-info">
            <strong>{node.name}</strong>
            {node.memberCount > 0 && <span className="org-tree-count">{node.memberCount} عضو</span>}
            {node.description && <small>{node.description}</small>}
          </div>
          {canManage && (
            <div className="org-tree-actions">
              <button className="org-btn org-btn-quiet" onClick={() => { setError(''); setMode({ kind: 'create', parentId: node.id }); }}>
                + تابع
              </button>
              <button className="org-btn org-btn-quiet" onClick={() => { setError(''); setMode({ kind: 'edit', dept: node }); }}>
                تعديل
              </button>
              <button className="org-btn org-btn-danger" onClick={() => remove(node.id)} disabled={busy}>
                حذف
              </button>
            </div>
          )}
        </div>
        {node.children.length > 0 && (
          <ul className="org-tree">{node.children.map(renderNode)}</ul>
        )}
      </li>
    );
  }

  return (
    <>
      {canManage && (
        <div className="org-toolbar">
          <button
            className="org-btn org-btn-primary"
            onClick={() => { setError(''); setMode(mode.kind === 'closed' ? { kind: 'create', parentId: null } : { kind: 'closed' }); }}
          >
            {mode.kind === 'closed' ? '+ وحدة جديدة' : 'إغلاق النموذج'}
          </button>
        </div>
      )}

      {renderForm()}

      {departments.length === 0 ? (
        <div className="org-empty">لا توجد وحدات تنظيمية بعد.</div>
      ) : (
        <div className="org-panel">
          <ul className="org-tree org-tree-root">{tree.map(renderNode)}</ul>
        </div>
      )}
    </>
  );
}
