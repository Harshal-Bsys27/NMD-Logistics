'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/helpers';
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
          <Navbar collapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
          <Sidebar collapsed={sidebarCollapsed} />
          <main className={cn(
            'min-h-[calc(100vh-var(--navbar-height))] min-w-0 px-4 py-6 transition-[margin] duration-200 md:px-6 xl:px-8 min-[1920px]:max-w-[1800px]',
            sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[264px]',
          )}>
            {children}
          </main>
        </div>
      )}
      <ToastContainer />
    </>
  );
}