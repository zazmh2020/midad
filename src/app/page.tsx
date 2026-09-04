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
import MidadAssistant from '@/components/landing/MidadAssistant';
import PricingPlans from '@/components/PricingPlans';
import { getT } from '@/lib/i18n/server';
import '@/styles/midad.css';
import '@/styles/pricing.css';

const STAR = (
  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9z" /></svg>
);

const AUDIENCES = [
  { icon: 'organization/organization-institution', t: 'المؤسسات الخيرية' },
  { icon: 'people/people-groups', t: 'المؤسسات الإنسانية' },
  { icon: 'education/education-education', t: 'المؤسسات التعليمية' },
  { icon: 'analytics/analytics-growth', t: 'المؤسسات التنموية' },
  { icon: 'education/education-quran', t: 'مراكز القرآن' },
  { icon: 'organization/organization-building', t: 'المؤسسات الوقفية' },
];


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

export default async function HomePage() {
  const { t } = await getT();
  return (
    <div className="mdl">
      <MidadHeader />

      <main>
        {/* ========== HERO ========== */}
        <section id="home" className="mdl-hero">
          <div className="mdl-wrap mdl-hero-grid">
            <div>
              <Reveal><h1>{t('hero.title1')}<br /><span className="hl">{t('hero.title2')}</span></h1></Reveal>
              <Reveal delay={0.1}>
                <p className="mdl-hero-sub">{t('hero.sub')}</p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mdl-hero-actions">
                  <Link href="/login" className="mdl-btn mdl-btn-light">{t('hero.cta.login')}</Link>
                  <a href="#systems" className="mdl-btn mdl-btn-outline-light">{t('hero.cta.explore')}</a>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mdl-hero-trust">
                  <span><strong>12</strong> {t('hero.trust.systems')}</span>
                  <span className="sep" />
                  <span><strong>100%</strong> {t('hero.trust.isolation')}</span>
                  <span className="sep" />
                  <span><strong>RTL</strong> {t('hero.trust.rtl')}</span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2} y={30}>
              <div className="mdl-hero-stage">
                {/* مكدّس بطاقات مائل: واجهات متراكبة بزوايا */}
                <div className="mdl-fan">
                  <div className="mdl-fan-card back-2"><Mockup kind="reports" /></div>
                  <div className="mdl-fan-card back-1"><Mockup kind="projects" /></div>
                  <div className="mdl-fan-card front"><Mockup kind="dashboard" /></div>
                </div>
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
              <span className="mdl-eyebrow">{t('sec.platform.eyebrow')}</span>
              <h2 className="mdl-h2">{t('sec.platform.title')}</h2>
              <p className="mdl-lead">{t('sec.platform.lead')}</p>
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

        {/* ========== SYSTEMS (interactive) ========== */}
        <section id="systems" className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.systems.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.systems.title')}</h2>
                <p className="mdl-lead">{t('sec.systems.lead')}</p>
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
                <span className="mdl-eyebrow">{t('sec.how.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.how.title')}</h2>
                <p className="mdl-lead">{t('sec.how.lead')}</p>
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
                <span className="mdl-eyebrow">{t('sec.product.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.product.title')}</h2>
                <p className="mdl-lead">{t('sec.product.lead')}</p>
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
                <span className="mdl-eyebrow">{t('sec.stories.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.stories.title')}</h2>
                <p className="mdl-lead">{t('sec.stories.lead')}</p>
                <div className="mdl-rating">
                  <span className="mdl-rating-score">4.9</span>
                  <span className="mdl-rating-stars">{STAR}{STAR}{STAR}{STAR}{STAR}</span>
                  <span className="mdl-rating-meta">{t('sec.stories.rating', { n: '+40' })}</span>
                </div>
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
                <span className="mdl-eyebrow">{t('sec.ai.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.ai.title')}</h2>
                <p className="mdl-lead">{t('sec.ai.lead')}</p>
                <div className="mdl-hero-actions">
                  <Link href="/login" className="mdl-btn mdl-btn-primary">{t('sec.ai.cta')}</Link>
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
                <span className="mdl-eyebrow">{t('sec.features.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.features.title')}</h2>
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
                <span className="mdl-eyebrow">{t('sec.security.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.security.title')}</h2>
                <p className="mdl-lead" style={{ marginBottom: '1.5rem' }}>{t('sec.security.lead')}</p>
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
              <span className="mdl-eyebrow">{t('sec.integrations.eyebrow')}</span>
              <h2 className="mdl-h2">{t('sec.integrations.title')}</h2>
              <p className="mdl-lead">{t('sec.integrations.lead')}</p>
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

        {/* ========== PRICING ========== */}
        <section id="pricing" className="mdl-section">
          <div className="mdl-wrap">
            <Reveal>
              <div className="mdl-center">
                <span className="mdl-eyebrow">{t('sec.pricing.eyebrow')}</span>
                <h2 className="mdl-h2">{t('sec.pricing.title')}</h2>
                <p className="mdl-lead">{t('sec.pricing.lead')}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mdl-pricing">
                <PricingPlans />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="mdl-cta">
          <div className="mdl-wrap mdl-cta-inner">
            <Reveal>
              <h2>{t('cta.title')}</h2>
              <p>{t('cta.lead')}</p>
              <div className="mdl-cta-actions">
                <Link href="/login" className="mdl-btn mdl-btn-light">{t('cta.login')}</Link>
                <a href="#about" className="mdl-btn mdl-btn-outline-light">{t('cta.contact')}</a>
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
              <div className="fb-name"><LogoMark size={26} className="mark" /> {t('brand')}</div>
              <p className="fb-desc">{t('footer.desc')}</p>
            </div>
            <div>
              <h5>{t('footer.col.platform')}</h5>
              <ul><li><a href="#platform">{t('footer.overview')}</a></li><li><a href="#systems">{t('nav.systems')}</a></li><li><a href="#ai">{t('nav.ai')}</a></li></ul>
            </div>
            <div>
              <h5>{t('footer.col.solutions')}</h5>
              <ul><li><a href="#platform">{t('nav.orgs')}</a></li><li><a href="#systems">{t('nav.systems')}</a></li><li><a href="#about">{t('nav.about')}</a></li></ul>
            </div>
            <div>
              <h5>{t('footer.col.support')}</h5>
              <ul><li><Link href="/login">{t('nav.login')}</Link></li><li><a href="#about">{t('footer.contact')}</a></li><li><a href="#about">{t('footer.privacy')}</a></li></ul>
            </div>
          </div>
          <div className="mdl-footer-bottom">{t('footer.rights')}</div>
        </div>
      </footer>

      <MidadAssistant />
    </div>
  );
}
