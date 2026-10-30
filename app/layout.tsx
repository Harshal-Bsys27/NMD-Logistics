import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { AuthProvider } from '@/hooks';
import { OperationsDataProvider } from '@/hooks/useOperationsData';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'NMD Logistics | Connected Delivery Operations',
    template: '%s | NMD Logistics',
  },
  description: 'Coordinate orders, dispatch, drivers, and delivery performance in one logistics operations workspace.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try { const savedTheme = localStorage.getItem('theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; if (savedTheme === 'dark' || ((savedTheme === 'system' || !savedTheme) && prefersDark)) document.documentElement.classList.add('dark'); } catch {}",
          }}
        />
      </head>
      <body className={inter.className}>
        <div id="root">
          <AuthProvider>
            <OperationsDataProvider>
              <AppShell>{children}</AppShell>
            </OperationsDataProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
