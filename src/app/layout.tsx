import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE, dirFor } from '@/lib/i18n/config';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { CurrencyProvider } from '@/components/CurrencyProvider';
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency } from '@/lib/currency';
import LangGate from '@/components/LangGate';
import './globals.css';

export const metadata: Metadata = {
  title: 'مِداد | MIDAD — منظومة مِداد الرقمية',
  description:
    'منظومة رقمية متكاملة تُدير أفراد المؤسسة ومشاريعها وبرامجها ووثائقها ومعرفتها من مكان واحد.',
};

const themeScript = `(function(){try{var t=localStorage.getItem('midad_theme');document.documentElement.dataset.theme=(t==='dark')?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const hasChosen = isLocale(cookieLocale);
  const locale = hasChosen ? cookieLocale : DEFAULT_LOCALE;
  const cookieCurrency = store.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(cookieCurrency) ? cookieCurrency : DEFAULT_CURRENCY;

  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>
          <CurrencyProvider initialCurrency={currency}>
            {children}
            <LangGate hasChosen={hasChosen} />
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
