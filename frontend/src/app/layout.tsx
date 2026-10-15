import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/common/AppLayout';

export const metadata: Metadata = {
  title: 'QuickBasket — Fresh Groceries, Fast Delivery',
  description: 'Get your daily essentials, fresh produce and more from your nearby stores. Quick. Easy. Reliable.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
