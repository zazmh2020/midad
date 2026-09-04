'use client';

import { useEffect, useRef, useState } from 'react';

interface Msg { role: 'user' | 'ai'; text: string }

const SUGGESTIONS = [
  'ما هي أنظمة مِداد؟',
  'كيف أبدأ؟',
  'ما الفرق بين الباقات؟',
];

/* مساعد مِداد مختصّ بالمنصّة فقط: يجيب عمّا يخصّها، ويرفض بلطف ما خرج عنها. */

// كلمات تدلّ على أنّ السؤال متعلّق بمِداد أو بإدارة المؤسسات
const ON_TOPIC = /مِداد|مداد|midad|المنصّ|المنصة|النظام|نظام|أنظمة|وحدة|ميزة|مميز|باقة|باقات|سعر|اشترا|تكلفة|مجان|مؤسس|جمعي|منظم|مركز|قرآن|حلق|طلاب|حفظ|تعليم|مستفيد|متطوع|موظف|موارد|مشروع|برنامج|حمل|تبرع|مالية|تمويل|تقرير|تحليل|وثيق|مستند|هوية|أمان|صلاحي|تكامل|دعم|حساب|دخول|اشتراك|لوحة|إدارة|تسجيل|بدء|ابدأ|كيف|ما هي|وش|شنو|ماذا|شهادة|مسابقة/;

function reply(q: string): string {
  const t = q.trim();
  if (/سعر|باقة|باقات|اشترا|تكلفة|مجان/.test(t))
    return 'لدى مِداد أربع باقات: انطلاقة (مجانية)، نمو، تمكين، وأثر للمؤسسات الكبيرة. تصفّح قسم «الباقات» للتفاصيل، وابدأ مجانًا في أي وقت.';
  if (/نظام|أنظمة|وحدة|ميزة|مميزات/.test(t))
    return 'تشمل مِداد إدارة المؤسسة والموارد البشرية والمشاريع والمستفيدين والتعليم والمالية والتقارير وإدارة الوثائق، إضافةً إلى مساعد مِداد AI. فعّل ما تحتاجه فقط.';
  if (/تبرع|حمل|مالية|تمويل/.test(t))
    return 'نظام المالية والتبرعات في مِداد يدير الحملات والمتبرعين والعمليات المالية مع تقارير جاهزة للربط.';
  if (/تعليم|حلق|قرآن|طلاب|حفظ|شهادة|مسابقة/.test(t))
    return 'نظام التعليم يدير الحلقات والطلاب والحضور وتقدّم الحفظ والتقييم والمسابقات والشهادات — مناسب لمراكز القرآن والمراكز التعليمية.';
  if (/مستفيد|حالات|خدم/.test(t))
    return 'نظام المستفيدين في مِداد يحفظ سجل الحالات والخدمات المقدَّمة بمستويات وصول آمنة تحمي خصوصية بياناتهم.';
  if (/أمان|صلاحي|خصوصي|حماية|عزل/.test(t))
    return 'مِداد توفّر تحكّمًا دقيقًا بالصلاحيات والوصول وعزلًا كاملًا لبيانات كل مؤسسة عن غيرها.';
  if (/تكامل|ربط|api|واتس|بريد/i.test(t))
    return 'تتكامل مِداد مع البريد الإلكتروني وبوابات الدفع وWhatsApp وGoogle وMicrosoft عبر واجهات API.';
  if (/ابدأ|بداية|تسجيل|حساب|كيف|دخول/.test(t))
    return 'ابدأ بتسجيل الدخول ثم إعداد بيانات مؤسستك وهيكلها، وفعّل الأنظمة التي تحتاجها. تُنشأ حسابات الجهات عبر إدارة المنصّة.';
  if (ON_TOPIC.test(t))
    return 'سؤال ممتاز عن مِداد! يمكنني مساعدتك في الأنظمة والباقات وكيفية البدء والأمان والتكاملات. حدّد ما تريد معرفته بالتفصيل، أو سجّل الدخول لتجربة المساعد الكامل داخل مؤسستك.';
  // خارج نطاق المنصّة — رفض لطيف وإعادة توجيه
  return 'أنا مساعد مِداد المتخصّص، وأجيب فقط عمّا يخصّ المنصّة: الأنظمة، الباقات، كيفية البدء، الأمان والتكاملات. اسألني عن أي شيء متعلّق بمِداد وسأكون سعيدًا بمساعدتك 🙏';
}

export default function MidadAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'ai', text: 'مرحبًا! أنا مساعد مِداد الذكي 👋 كيف أساعدك في التعرّف على المنصّة؟' },
  ]);
  const [q, setQ] = useState('');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, typing, open]);

  function send(text: string) {
    const t = text.trim();
    if (!t || typing) return;
    setMsgs((m) => [...m, { role: 'user', text: t }]);
    setQ('');
    setTyping(true);
    const answer = reply(t);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: 'ai', text: answer }]);
    }, 900);
  }

  return (
    <div className="mdl-asst">
      {open && (
        <div className="mdl-asst-panel" role="dialog" aria-label="مساعد مِداد الذكي">
          <div className="mdl-asst-head">
            <span className="mdl-asst-ava">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /></svg>
            </span>
            <div className="mdl-asst-head-tx"><b>مِداد AI</b><span>مساعدك الذكي</span></div>
            <button className="mdl-asst-x" onClick={() => setOpen(false)} aria-label="إغلاق">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
            </button>
          </div>

          <div className="mdl-asst-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`mdl-asst-msg ${m.role}`}>{m.text}</div>
            ))}
            {typing && <div className="mdl-asst-msg ai"><span className="mdl-typing"><i /><i /><i /></span></div>}
            {msgs.length <= 1 && !typing && (
              <div className="mdl-asst-sugs">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="mdl-asst-sug" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <form className="mdl-asst-input" onSubmit={(e) => { e.preventDefault(); send(q); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب سؤالك…" aria-label="سؤالك" />
            <button type="submit" aria-label="إرسال" disabled={!q.trim() || typing}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4L3 11l6 2 2 6z" /></svg>
            </button>
          </form>
        </div>
      )}

      <button className={`mdl-asst-fab ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)} aria-label="مساعد مِداد الذكي">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z" /></svg>
        )}
      </button>
    </div>
  );
}
