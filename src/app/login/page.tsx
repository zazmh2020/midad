'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '@/styles/login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'تعذّر تسجيل الدخول. حاول مرة أخرى.');
        setBusy(false);
        return;
      }

      router.replace('/app');
      router.refresh();
    } catch {
      setError('تعذّر الاتصال بالخادم. تحقّق من اتصالك وحاول مجدداً.');
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-box">
          <Link className="login-back" href="/">
            <span>→</span>
            العودة للصفحة الرئيسية
          </Link>

          <h1>تسجيل الدخول</h1>
          <p className="login-intro">
            أدخل بيانات حسابك للوصول إلى مساحة مؤسستك.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                <span aria-hidden="true">!</span>
                <span>{error}</span>
              </div>
            )}

            <div className="field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <div className="password-row">
                <label htmlFor="password">كلمة المرور</label>
                <Link className="link-quiet" href="/login">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              أبقني مسجّلاً على هذا الجهاز
            </label>

            <button
              className="btn btn-primary login-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? 'جارٍ التحقق…' : 'دخول'}
            </button>
          </form>

          <p className="login-note">
            الدخول متاح لمستخدمي المؤسسات المسجّلة. لإنشاء مساحة جديدة، تواصل مع
            إدارة مِداد.
          </p>
        </div>
      </main>

      <aside className="login-aside">
        <div className="aside-brand">
          <svg className="brand-glyph" viewBox="0 0 36 36" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="34"
              height="34"
              rx="9"
              fill="none"
              stroke="var(--turquoise)"
              strokeWidth="1.5"
            />
            <path
              d="M9 25c0-8 4-12.5 9.2-12.5 3.7 0 5.7 2.2 5.7 5 0 2.5-1.7 4.3-3.8 4.3-1.5 0-2.5-.9-2.5-2.2"
              fill="none"
              stroke="var(--turquoise)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="26.5" cy="25" r="1.9" fill="var(--turquoise)" />
          </svg>

          <span>
            <span className="brand-name">مِداد</span>
            <span className="brand-sub">MIDAD</span>
          </span>
        </div>

        <div className="aside-body">
          <h2>كل ما تملكه المؤسسة، في مكان واحد.</h2>

          <p>
            الأفراد والمشاريع والبرامج والوثائق والمعرفة — منظومة واحدة بدل
            ملفات متفرقة.
          </p>

          <svg className="aside-rule" viewBox="0 0 300 14" aria-hidden="true">
            <path d="M4 9c50-7 100-7 150-2s96 5 144-2" />
          </svg>
        </div>

        <p className="aside-foot">© 2026 مِداد — منظومة رقمية للتحول المؤسسي</p>
      </aside>
    </div>
  );
}
