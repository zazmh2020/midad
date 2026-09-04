'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/Logo';
import '@/styles/login.css';

const PANEL_CHECKS = [
  'أكثر من ١٢ نظامًا متكاملًا لإدارة مؤسستك من مكان واحد',
  'تقارير ولوحات تحليلية لحظية تُبنى من بياناتك',
  'عزل كامل للبيانات وصلاحيات دقيقة تحمي كل معلومة',
];

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
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
        setError(data.error ?? 'تعذّر تسجيل الدخول.');
        setBusy(false);
        return;
      }

      window.location.href = data.redirectTo ?? window.location.origin;
    } catch {
      setError('تعذّر الاتصال بالخادم. تحقّق من اتصالك وحاول مجدداً.');
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      {/* ===== Brand Panel (right in RTL) ===== */}
      <aside className="login-panel">
        <div className="panel-inner">
          <Link href="/" className="panel-brand">
            <span className="panel-brand-name">مِداد</span>
            <span className="panel-brand-mark"><LogoMark size={24} /></span>
          </Link>

          <div className="panel-copy">
            <h2 className="panel-title">منصّتك المتكاملة لإدارة العمل غير الربحي</h2>
            <ul className="panel-checks">
              {PANEL_CHECKS.map((c) => (
                <li key={c}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-foot">موثوقة من الجمعيات والمراكز والمؤسسات التعليمية</div>
        </div>
      </aside>

      {/* ===== Form Column (left in RTL) ===== */}
      <main className="login-main">
        <div className="login-form-area">
          {/* التبويبات */}
          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={mode === 'login' ? 'is-active' : ''}
              aria-selected={mode === 'login'}
              onClick={() => setMode('login')}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              role="tab"
              className={mode === 'signup' ? 'is-active' : ''}
              aria-selected={mode === 'signup'}
              onClick={() => setMode('signup')}
            >
              إنشاء حساب
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <div className="login-greeting">
                <h1>مرحباً بعودتك</h1>
                <p>سجّل الدخول للوصول إلى حسابك في مِداد</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {error && (
                  <div className="form-error" role="alert">
                    <span>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="field">
                  <label className="field-label" htmlFor="email">البريد الإلكتروني</label>
                  <div className="field-input-wrap">
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
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="password">كلمة المرور</label>
                  <div className="field-input-wrap">
                    <input
                      id="password"
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="field-action"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                        <circle cx="10" cy="10" r="3" />
                        {showPw && <path d="M3 17L17 3" />}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="login-options">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    تذكرني
                  </label>
                  <Link className="forgot-link" href="/#contact">نسيت كلمة المرور؟</Link>
                </div>

                <button className="login-submit" type="submit" disabled={busy}>
                  {busy ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
                  {!busy && <span aria-hidden="true">←</span>}
                </button>
              </form>

              <p className="login-signup">
                ليس لديك حساب؟{' '}
                <button type="button" className="link-btn" onClick={() => setMode('signup')}>أنشئ حسابًا</button>
              </p>
            </>
          ) : (
            <>
              <div className="login-greeting">
                <h1>أنشئ حسابك</h1>
                <p>ابدأ رحلتك مع مِداد لإدارة مؤسستك</p>
              </div>

              <div className="signup-note">
                <div className="signup-note-ic">
                  <LogoMark size={24} />
                </div>
                <p>
                  حسابات المؤسسات على مِداد تُنشأ عبر إدارة المنصّة لضمان التحقّق
                  وربط كل مؤسسة ببيئتها المستقلّة.
                </p>
                <Link href="/#contact" className="login-submit">
                  تواصل معنا لإنشاء حساب
                  <span aria-hidden="true">←</span>
                </Link>
              </div>

              <p className="login-signup">
                لديك حساب بالفعل؟{' '}
                <button type="button" className="link-btn" onClick={() => setMode('login')}>سجّل الدخول</button>
              </p>
            </>
          )}

          <div className="login-foot-row">
            <Link className="topbar-home" href="/">الصفحة الرئيسية</Link>
            <span className="login-copy">مِداد © 2026</span>
          </div>
        </div>
      </main>
    </div>
  );
}
