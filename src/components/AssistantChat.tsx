'use client';

import { useRef, useState, type FormEvent } from 'react';

type Msg = { role: 'user' | 'assistant'; text: string };

const SUGGESTIONS = [
  'كم عدد المشاريع الجارية؟',
  'لخّص لي حالة الحملات.',
  'ما إجمالي التبرعات المستلَمة؟',
  'ما الوحدات التنظيمية الموجودة؟',
];

export default function AssistantChat({ ready }: { ready: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setError('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/org/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'تعذّر الحصول على إجابة.');
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: data.answer }]);
        requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
      }
    } catch {
      setError('تعذّر الاتصال بالخادم.');
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  if (!ready) {
    return (
      <div className="org-alert">
        المساعد الذكي غير مُعدّ بعد. أضِف <code dir="ltr">ANTHROPIC_API_KEY</code> في ملف <code dir="ltr">.env</code> لتفعيله.
      </div>
    );
  }

  return (
    <div className="org-assistant">
      <div className="org-chat" ref={listRef}>
        {messages.length === 0 ? (
          <div className="org-chat-empty">
            <p>ابدأ بسؤال، أو جرّب:</p>
            <div className="org-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="org-suggestion" onClick={() => ask(s)} disabled={busy}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`org-bubble org-bubble-${m.role}`}>{m.text}</div>
          ))
        )}
        {busy && <div className="org-bubble org-bubble-assistant is-typing">…يفكّر</div>}
      </div>

      {error && <div className="org-alert">{error}</div>}

      <form className="org-chat-input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك عن مؤسستك…"
          disabled={busy}
        />
        <button type="submit" className="org-btn org-btn-primary" disabled={busy || !input.trim()}>
          إرسال
        </button>
      </form>
      <p className="org-hint" style={{ marginTop: '0.5rem' }}>
        يجيب المساعد من بيانات مؤسستك فقط، وضمن حدود صلاحياتك.
      </p>
    </div>
  );
}
