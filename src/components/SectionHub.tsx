import Link from 'next/link';
import { getT } from '@/lib/i18n/server';

export type HubItem = {
  title: string;
  desc: string;
  href?: string; // إن غاب فالبطاقة "قريبًا"
  count?: number;
};

/** محور قسم: عنوان + وصف + شبكة بطاقات تربط بوحدات القسم */
export default async function SectionHub({
  eyebrow, title, intro, items,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: HubItem[];
}) {
  const { t } = await getT();
  return (
    <div className="org-page">
      <div className="org-page-head">
        <div>
          <span className="org-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </div>

      <div className="org-modules">
        {items.map((it) =>
          it.href ? (
            <Link key={it.title} href={it.href} className="org-module">
              <strong>
                {it.title}
                {it.count != null && <span className="org-module-count">{it.count}</span>}
              </strong>
              <span>{it.desc}</span>
            </Link>
          ) : (
            <div key={it.title} className="org-module is-soon">
              <strong>{it.title}</strong>
              <span>{it.desc} · {t('oset.soon')}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
