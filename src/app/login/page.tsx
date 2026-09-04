'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogoMark } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import '@/styles/login.css';

export default function LoginPage() {
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
    <div className="lg-page">
      <div className="lg-ambient" aria-hidden="true">
        <span className="lg-blob lg-blob-1" />
        <span className="lg-blob lg-blob-2" />
        <span className="lg-grid" />
      </div>

      <ThemeToggle className="lg-theme" onDeep />


      <motion.main
        className="lg-card"
        initial={{ opacity: 0, y: 26, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <Link href="/" className="lg-brand" aria-label="مِداد">
          <span className="lg-brand-mark"><LogoMark size={26} /></span>
          <span className="lg-brand-name">مِداد</span>
        </Link>

        <div className="lg-head">
          <h1>مرحباً بعودتك</h1>
          <p>سجّل الدخول للوصول إلى مساحة عملك</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="lg-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M10 6v5M10 14v.01" /></svg>
              <span>{error}</span>
            </div>
          )}

          <label className="lg-field">
            <span className="lg-label">البريد الإلكتروني</span>
            <input
              type="email" autoComplete="email" placeholder="name@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="lg-field">
            <span className="lg-label">كلمة المرور</span>
            <span className="lg-input-wrap">
              <input
                type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="lg-eye" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'إخفاء' : 'إظهار'}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="10" cy="10" r="3" />
                  {showPw && <path d="M3 17L17 3" />}
                </svg>
              </button>
            </span>
          </label>

          <label className="lg-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            تذكّرني على هذا الجهاز
          </label>

          <button className="lg-submit" type="submit" disabled={busy}>
            {busy ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
            {!busy && <span aria-hidden="true">←</span>}
          </button>
        </form>

        <Link href="/" className="lg-home">العودة إلى الصفحة الرئيسية</Link>
      </motion.main>
    </div>
  );
}
