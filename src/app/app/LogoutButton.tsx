'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <button className="btn btn-ink" onClick={handleLogout} disabled={busy}>
      {busy ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
    </button>
  );
}
