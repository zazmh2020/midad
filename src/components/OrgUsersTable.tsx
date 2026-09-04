'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASSIGNABLE_ROLES, roleLabel } from '@/lib/permissions';

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  departmentId: string | null;
};

type Department = { id: string; name: string };

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });

export default function OrgUsersTable({
  users,
  departments,
  currentUserId,
  canManage,
}: {
  users: Row[];
  departments: Department[];
  currentUserId: string;
  canManage: boolean;
}) {
  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? '—' : '—';
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/org/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'تعذّر الحفظ.');
      } else {
        router.refresh();
      }
    } catch {
      setError('تعذّر الاتصال بالخادم.');
    } finally {
      setBusyId(null);
    }
  }

  if (users.length === 0) {
    return <div className="org-empty">لا يوجد مستخدمون بعد.</div>;
  }

  return (
    <>
      {error && <div className="org-alert">{error}</div>}
      <div className="org-table-wrap">
        <table className="org-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>الدور</th>
              <th>الوحدة</th>
              <th>آخر دخول</th>
              <th>الحالة</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const busy = busyId === u.id;
              return (
                <tr key={u.id} className={u.isActive ? '' : 'is-inactive'}>
                  <td>
                    <strong>{u.name}</strong>
                    {isSelf && <span className="org-tag-self">أنت</span>}
                    <small dir="ltr">{u.email}</small>
                  </td>
                  <td>
                    {canManage && !isSelf ? (
                      <select
                        className="org-inline-select"
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => patch(u.id, { role: e.target.value })}
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{roleLabel(r)}</option>
                        ))}
                      </select>
                    ) : (
                      roleLabel(u.role)
                    )}
                  </td>
                  <td>
                    {canManage && departments.length > 0 ? (
                      <select
                        className="org-inline-select"
                        value={u.departmentId ?? ''}
                        disabled={busy}
                        onChange={(e) => patch(u.id, { departmentId: e.target.value || null })}
                      >
                        <option value="">— بلا وحدة</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      deptName(u.departmentId)
                    )}
                  </td>
                  <td>
                    {u.lastLoginAt ? dateFmt.format(new Date(u.lastLoginAt)) : '—'}
                  </td>
                  <td>
                    <span className={`org-badge ${u.isActive ? 'is-on' : ''}`}>
                      {u.isActive ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="org-row-actions">
                      {!isSelf && (
                        <button
                          className="org-btn org-btn-quiet"
                          disabled={busy}
                          onClick={() => patch(u.id, { isActive: !u.isActive })}
                        >
                          {busy ? '…' : u.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
