import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/header/Header'
import Sidebar from '@/components/sidebar/Sidebar'
import ToastContainer from '@/components/notifications/ToastContainer'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NMD Logistics Management System',
  description: 'Production-ready logistics operations management platform',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div id="root">
          <Header />
          <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
            <Sidebar />
            <main className="flex-1 min-h-[calc(100vh-64px)]">{children}</main>
          </div>
          <ToastContainer />
        </div>
      </body>
    </html>
  );
}
