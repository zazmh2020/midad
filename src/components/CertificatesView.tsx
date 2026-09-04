'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';

interface Student { id: string; name: string; halaqa: string | null; sessions: number; }

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

export default function CertificatesView({ students, orgName }: { students: Student[]; orgName: string }) {
  const [active, setActive] = useState<string>(students[0]?.id ?? '');
  const cur = students.find((s) => s.id === active);
  const today = dateFmt.format(new Date());

  if (students.length === 0) {
    return <div className="mod-detail"><p style={{ color: 'var(--gray-500)' }}>لا يوجد طلاب بعد لإصدار الشهادات.</p></div>;
  }

  return (
    <div className="hub">
      <div className="hub-list">
        {students.map((s) => (
          <button key={s.id} className={`hub-item ${active === s.id ? 'is-active' : ''}`} onClick={() => setActive(s.id)}>
            <span className="hub-item-ic"><Icon name="people/people-students" size={18} /></span>
            <span className="hub-item-tx"><span className="t">{s.name}</span><span className="s">{s.halaqa ?? 'بلا حلقة'}</span></span>
            <span className={`hub-tag ${s.sessions > 0 ? 'ok' : 'muted'}`}>{s.sessions > 0 ? 'مؤهّل' : 'مبتدئ'}</span>
          </button>
        ))}
      </div>

      <div className="hub-panel">
        <AnimatePresence mode="wait">
          {cur && (
            <motion.div key={cur.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="cert-preview">
                <div className="cert-frame">
                  <div className="cert-logo"><LogoMark size={34} /></div>
                  <div className="cert-title">شهادة إتمام</div>
                  <p className="cert-sub">{orgName}</p>
                  <div className="cert-name">{cur.name}</div>
                  <p className="cert-body">
                    تشهد {orgName} بأن الطالب أعلاه قد أتمّ متطلّبات برنامج الحفظ والتسميع
                    ضمن {cur.halaqa ?? 'حلقاته'} بتفوّق والتزام، ونسأل الله له التوفيق.
                  </p>
                  <div className="cert-seal">مِداد<br />ختم</div>
                  <p className="cert-sub" style={{ marginTop: '1rem' }}>حُرّر بتاريخ {today}</p>
                </div>
              </div>
              <div className="cert-actions">
                <button className="org-btn org-btn-primary" onClick={() => window.print()}>
                  طباعة / حفظ PDF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
