import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'مِداد | MIDAD — منظومة مِداد الرقمية',
  description:
    'منظومة رقمية متكاملة تُدير أفراد المؤسسة ومشاريعها وبرامجها ووثائقها ومعرفتها من مكان واحد.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
