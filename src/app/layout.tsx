import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'مِداد | MIDAD — منظومة مِداد الرقمية',
  description:
    'منظومة رقمية متكاملة تُدير أفراد المؤسسة ومشاريعها وبرامجها ووثائقها ومعرفتها من مكان واحد.',
};

const themeScript = `(function(){try{var t=localStorage.getItem('midad_theme');document.documentElement.dataset.theme=(t==='dark')?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
