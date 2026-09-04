import Link from 'next/link';
import Reveal from '@/components/Reveal';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import MidadHeader from '@/components/landing/MidadHeader';
import Mockup from '@/components/landing/Mockup';
import SystemsShowcase from '@/components/landing/SystemsShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import ProductShowcase from '@/components/landing/ProductShowcase';
import Testimonials from '@/components/landing/Testimonials';
import MidadAIChat from '@/components/landing/MidadAIChat';
import OrgTypes from '@/components/landing/OrgTypes';
import '@/styles/midad.css';

const AUDIENCES = [
  { icon: 'organization/organization-institution', t: 'المؤسسات الخيرية' },
  { icon: 'people/people-groups', t: 'المؤسسات الإنسانية' },
  { icon: 'education/education-education', t: 'المؤسسات التعليمية' },
  { icon: 'analytics/analytics-growth', t: 'المؤسسات التنموية' },
  { icon: 'education/education-quran', t: 'مراكز القرآن' },
  { icon: 'organization/organization-building', t: 'المؤسسات الوقفية' },
];

const PROBLEMS = ['بيانات متفرقة بين ملفات وجداول', 'صعوبة متابعة المشاريع والفرق', 'تعدّد الأنظمة غير المترابطة', 'ضعف التقارير واتخاذ القرار', 'صعوبة التنسيق بين الإدارات'];

const FEATURES = [
  { icon: 'organization/organization-structure', t: 'إدارة مركزية', d: 'كل أعمال المؤسسة في مكان واحد مترابط.' },
  { icon: 'operations/operations-activities', t: 'أنظمة مرنة', d: 'فعّل فقط الوحدات التي تحتاجها.' },
  { icon: 'people/people-permissions', t: 'صلاحيات متقدمة', d: 'تحكّم كامل بأدوار المستخدمين ووصولهم.' },
  { icon: 'analytics/analytics-analytics', t: 'تقارير ذكية', d: 'بيانات واضحة تدعم قرارك.' },
  { icon: 'analytics/analytics-growth', t: 'قابلية التوسّع', d: 'تنمو المنصة مع نمو مؤسستك.' },
  { icon: 'identity/identity-digital-identity', t: 'تجربة عربية', d: 'واجهة احترافية مصمّمة RTL أولاً.' },
];

const SECURITY = [
  { icon: 'people/people-permissions', t: 'إدارة الصلاحيات' },
  { icon: 'actions/actions-lock', t: 'التحكم في الوصول' },
  { icon: 'identity/identity-security', t: 'حماية البيانات' },
  { icon: 'organization/organization-office', t: 'مساحات عمل مستقلة' },
];

const INTEGRATIONS = ['البريد الإلكتروني', 'بوابات الدفع', 'WhatsApp', 'Google Workspace', 'Microsoft', 'واجهات API'];

export default function HomePage() {
  return (
    <div className="mdl">
      <MidadHeader />

      <main>
        {/* ========== HERO ========== */}
        <section id="home" className="mdl-hero">
          <div className="mdl-wrap mdl-hero-grid">
            <div>
              <Reveal><h1>كل مؤسستك <span className="hl">في مكان واحد</span></h1></Reveal>
              <Reveal delay={0.1}>
                <p className="mdl-hero-sub">
                  منصة مِداد الرقمية تجمع إدارة المؤسسة والموارد والمشاريع والبرامج
                  والتقارير في منظومة واحدة ذكية ومرنة.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mdl-hero-actions">
                  <Link href="/login" className="mdl-btn mdl-btn-light">تسجيل الدخول</Link>
                  <a href="#systems" className="mdl-btn mdl-btn-outline-light">استكشف المنصة</a>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mdl-hero-trust">
                  <span><strong>12</strong> نظامًا</span>
                  <span className="sep" />
                  <span><strong>100%</strong> عزل للبيانات</span>
                  <span className="sep" />
                  <span><strong>RTL</strong> عربية أصيلة</span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2} y={30}>
              <div className="mdl-hero-stage">
                <Mockup kind="dashboard" />
                <div className="mdl-float mdl-float-1">
                  <span className="fic teal"><Icon name="analytics/analytics-growth" size={17} /></span>
                  <div><div className="ftitle">نسبة الإنجاز</div><div className="fval">86%</div></div>
                </div>
                <div className="mdl-float mdl-float-2">
                  <span className="fic gold"><Icon name="analytics/analytics-reports" size={17} /></span>
                  <div><div className="ftitle">تقرير جاهز</div><div className="fval">أغسطس</div></div>
                </div>
                <div className="mdl-float mdl-float-3">
                  <span className="fic teal"><Icon name="people/people-users" size={17} /></span>
                  <div><div className="ftitle">أعضاء جدد</div><div className="fval">+12</div></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== PLATFORM VALUE + AUDIENCES ========== */}
        <section id="platform" className="mdl-section">
          <div className="mdl-wrap mdl-center">
            <Reveal>
              <span className="mdl-eyebrow">منظومة واحدة</span>
              <h2 className="mdl-h2">منظومة واحدة. إمكانيات متعددة.</h2>
              <p className="mdl-lead">صُمِّمت مِداد لتجمع أهمّ احتياجات المؤسسات في بيئة رقمية واحدة مترابطة.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mdl-chips">
                {AUDIENCES.map((a) => (
                  <span key={a.t} className="mdl-chip"><Icon name={a.icon} className="ic" size={17} />{a.t}</span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== PROBLEM → SOLUTION ========== */}
        <section className="mdl-section" style={{ background: 'var(--white)' }}>
          <div className="mdl-wrap mdl-ps">
            <Reveal>
              <div>
                <span className="mdl-eyebrow">التحدّي</span>
                <h2 className="mdl-h2">عندما تتوزّع أعمال المؤسسة بين عدّة أنظمة</h2>
                <div className="mdl-problems" style={{ marginTop: '1.5rem' }}>
                  {PROBLEMS.map((p) => (
                    <div key={p} className="mdl-prob"><span className="x">✕</span><span>{p}</span></div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15} y={30}>
              <div className="mdl-solution">
                <span className="mdl-eyebrow" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>الحل</span>
                <h3>هنا تأتي مِداد</h3>
                <p>منصة واحدة تجمع أعمال المؤسسة وتمنحك رؤية أوضح وتحكّمًا أكبر — من إدارة الفرق إلى التقارير الذكية.</p>
                <a href="#systems" className="mdl-btn mdl-btn-light">اكتشف الأنظمة</a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== SYSTEMS (interactive) ========== */}
        <section id="systems" className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">الأنظمة</span>
                <h2 className="mdl-h2">كل ما تحتاجه مؤسستك</h2>
                <p className="mdl-lead">فعّل الأنظمة التي تحتاجها وابدأ العمل من مكان واحد.</p>
              </div>
            </Reveal>
            <SystemsShowcase />
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section className="mdl-section" style={{ background: 'var(--white)' }}>
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">كيف تعمل</span>
                <h2 className="mdl-h2">كيف تعمل مِداد؟</h2>
                <p className="mdl-lead">من الإعداد إلى القرار الذكي — رحلة واضحة في خمس خطوات.</p>
              </div>
            </Reveal>
            <HowItWorks />
          </div>
        </section>

        {/* ========== PRODUCT SHOWCASE ========== */}
        <section className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">المنصة</span>
                <h2 className="mdl-h2">منصة واحدة لإدارة أعمال مؤسستك</h2>
                <p className="mdl-lead">مرّر لأسفل لتكتشف واجهات مِداد واحدةً تلو الأخرى.</p>
              </div>
            </Reveal>
            <ProductShowcase />
          </div>
        </section>

        {/* ========== STORIES (v1 carousel) ========== */}
        <section className="mdl-section" style={{ background: 'var(--white)' }}>
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">قصص الجهات</span>
                <h2 className="mdl-h2">جهات حقيقية. أثرٌ ملموس.</h2>
                <p className="mdl-lead">كيف نظّمت مِداد أعمال جمعيات ومراكز حقيقية — من التقارير إلى المستفيدين.</p>
              </div>
            </Reveal>
            <Testimonials />
          </div>
        </section>

        {/* ========== MIDAD AI ========== */}
        <section id="ai" className="mdl-section mdl-ai">
          <div className="mdl-wrap mdl-ai-grid">
            <Reveal>
              <div>
                <span className="mdl-eyebrow">مِداد AI</span>
                <h2 className="mdl-h2">مساعدك الذكي لإدارة مؤسستك</h2>
                <p className="mdl-lead">احصل على رؤى ذكية، حلّل البيانات، واكتشف ما يحتاج إلى اهتمامك عبر مساعد مِداد الذكي — ضمن حدود صلاحياتك.</p>
                <div className="mdl-hero-actions">
                  <Link href="/login" className="mdl-btn mdl-btn-primary">جرّب مِداد AI</Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15} y={30}><MidadAIChat /></Reveal>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">المميزات</span>
                <h2 className="mdl-h2">مصمّمة للمؤسسات الحديثة</h2>
              </div>
            </Reveal>
            <div className="mdl-feats">
              {FEATURES.map((f, i) => (
                <Reveal key={f.t} delay={(i % 3) * 0.06}>
                  <div className="mdl-feat">
                    <span className="fi"><Icon name={f.icon} size={22} /></span>
                    <h4>{f.t}</h4>
                    <p>{f.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ========== SECURITY ========== */}
        <section className="mdl-section mdl-sec">
          <div className="mdl-wrap mdl-sec-grid">
            <Reveal>
              <div>
                <span className="mdl-eyebrow">الأمان</span>
                <h2 className="mdl-h2">بيانات مؤسستك تحت السيطرة</h2>
                <p className="mdl-lead" style={{ marginBottom: '1.5rem' }}>تحكّم دقيق بالصلاحيات والوصول، وعزل كامل لبيانات كل مؤسسة.</p>
                <div className="mdl-sec-list">
                  {SECURITY.map((s) => (
                    <div key={s.t} className="mdl-sec-item"><Icon name={s.icon} size={20} /><span>{s.t}</span></div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mdl-shield">
                <div className="mdl-shield-wrap">
                  <span className="ring" /><span className="ring two" />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" /><path d="M9 12l2 2 4-4" /></svg>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== INTEGRATIONS ========== */}
        <section className="mdl-section" style={{ background: 'var(--white)' }}>
          <div className="mdl-wrap mdl-center">
            <Reveal>
              <span className="mdl-eyebrow">التكاملات</span>
              <h2 className="mdl-h2">تتكامل مع أدوات مؤسستك</h2>
              <p className="mdl-lead">جاهزة للربط مع الخدمات التي تعتمد عليها مؤسستك.</p>
            </Reveal>
          </div>
          <div className="mdl-marquee">
            <div className="mdl-marquee-track">
              {[...INTEGRATIONS, ...INTEGRATIONS].map((n, i) => (
                <span key={i} className="mdl-int"><Icon name="actions/actions-link" size={18} />{n}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ========== ORG TYPES ========== */}
        <section id="solutions" className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">الحلول</span>
                <h2 className="mdl-h2">مِداد تناسب مؤسستك</h2>
                <p className="mdl-lead">اضغط على نوع مؤسستك لتكتشف كيف تخدمها مِداد.</p>
              </div>
            </Reveal>
            <OrgTypes />
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="mdl-cta">
          <div className="mdl-wrap mdl-cta-inner">
            <Reveal>
              <h2>مؤسستك تستحق إدارة أذكى</h2>
              <p>ابدأ رحلتك نحو إدارة رقمية أكثر تنظيمًا ومرونة مع مِداد.</p>
              <div className="mdl-cta-actions">
                <Link href="/login" className="mdl-btn mdl-btn-light">تسجيل الدخول</Link>
                <a href="#solutions" className="mdl-btn mdl-btn-outline-light">اطلب عرضًا توضيحيًا</a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ========== FOOTER ========== */}
      <footer id="about" className="mdl-footer">
        <div className="mdl-wrap">
          <div className="mdl-footer-grid">
            <div>
              <div className="fb-name"><LogoMark size={26} className="mark" /> مِداد</div>
              <p className="fb-desc">منصة رقمية متكاملة لإدارة المؤسسات والتحوّل الرقمي.</p>
            </div>
            <div>
              <h5>المنصة</h5>
              <ul><li><a href="#platform">نظرة عامة</a></li><li><a href="#systems">الأنظمة</a></li><li><a href="#ai">مِداد AI</a></li></ul>
            </div>
            <div>
              <h5>الحلول</h5>
              <ul><li><a href="#solutions">أنواع المؤسسات</a></li><li><a href="#systems">الأنظمة</a></li><li><a href="#about">عن مِداد</a></li></ul>
            </div>
            <div>
              <h5>الدعم</h5>
              <ul><li><Link href="/login">تسجيل الدخول</Link></li><li><a href="#about">تواصل معنا</a></li><li><a href="#about">سياسة الخصوصية</a></li></ul>
            </div>
          </div>
          <div className="mdl-footer-bottom">مِداد © 2026 — جميع الحقوق محفوظة</div>
        </div>
      </footer>
    </div>
  );
}
