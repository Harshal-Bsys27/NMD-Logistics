'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import ToastContainer from '@/components/notifications/ToastContainer';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem('nmd-sidebar-collapsed') === 'true');
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('nmd-sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <>
      {isAuthRoute ? (
        <main>{children}</main>
      ) : (
        <div className="min-h-screen bg-background text-foreground">
          <Sidebar collapsed={sidebarCollapsed} />
          <div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
            <Navbar collapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
            <main className="mx-auto w-full min-w-0 px-4 py-4 md:px-6 xl:px-8 min-[1920px]:max-w-[1760px]">
              {children}
            </main>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
}