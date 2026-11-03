'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/helpers';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');
  const isPublicLanding = pathname === '/';
  const isPublicCustomerPage = pathname.startsWith('/feedback/') || pathname.startsWith('/track/');

  useEffect(() => {
    if (isAuthRoute || isPublicLanding || isPublicCustomerPage) return;
    setSidebarCollapsed(localStorage.getItem('nmd-sidebar-collapsed') === 'true');
  }, [isAuthRoute, isPublicLanding, isPublicCustomerPage]);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('nmd-sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <>
      {isAuthRoute || isPublicLanding || isPublicCustomerPage ? (
        <main>{children}</main>
      ) : (
        <div className="min-h-screen bg-background text-foreground">
          <Navbar collapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
          <Sidebar collapsed={sidebarCollapsed} />
          <main className={cn(
            'min-h-[calc(100dvh-var(--navbar-height))] min-w-0 w-full transition-[margin,width] duration-200',
            sidebarCollapsed
              ? 'lg:ml-[76px] lg:w-[calc(100%-76px)]'
              : 'lg:ml-[264px] lg:w-[calc(100%-264px)]',
          )}>
            {children}
          </main>
        </div>
      )}
    </>
  );
}