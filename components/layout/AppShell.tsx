'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/header/Header';
import Sidebar from '@/components/sidebar/Sidebar';
import ToastContainer from '@/components/notifications/ToastContainer';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');

  return (
    <>
      {isAuthRoute ? (
        <main>{children}</main>
      ) : (
        <>
          <Header />
          <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
            <Sidebar />
            <main className="min-h-[calc(100vh-64px)] flex-1">{children}</main>
          </div>
        </>
      )}
      <ToastContainer />
    </>
  );
}