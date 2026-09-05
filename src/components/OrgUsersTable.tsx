'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASSIGNABLE_ROLES } from '@/lib/permissions';
import { useLocale } from '@/lib/i18n/LocaleProvider';

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
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
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
        setError(data.error ?? t('ousers.saveErr'));
      } else {
        router.refresh();
      }
    } catch {
      setError(t('ousers.netErr'));
    } finally {
      setBusyId(null);
    }
  }

  if (users.length === 0) {
    return <div className="org-empty">{t('ousers.none')}</div>;
  }

  return (
    <>
      {error && <div className="org-alert">{error}</div>}
      <div className="org-table-wrap">
        <table className="org-table">
          <thead>
            <tr>
              <th>{t('ousers.th.user')}</th>
              <th>{t('ousers.th.role')}</th>
              <th>{t('ousers.th.unit')}</th>
              <th>{t('ousers.th.lastLogin')}</th>
              <th>{t('ousers.th.status')}</th>
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
                    {isSelf && <span className="org-tag-self">{t('ousers.you')}</span>}
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
                          <option key={r} value={r}>{t(`role.${r}`)}</option>
                        ))}
                      </select>
                    ) : (
                      t(`role.${u.role}`)
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
                        <option value="">{t('ousers.noUnit')}</option>
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
                      {u.isActive ? t('ousers.active') : t('ousers.suspended')}
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
                          {busy ? '…' : u.isActive ? t('ousers.disable') : t('ousers.enable')}
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
