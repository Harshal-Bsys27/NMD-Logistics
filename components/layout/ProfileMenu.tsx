'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, CircleUserRound, FileCode2, HelpCircle, LogOut, Settings, UserRound } from 'lucide-react';
import { authService } from '@/services/auth';
import { cn } from '@/utils/helpers';

const profileItems = [
  { label: 'My Profile', href: '/settings', icon: UserRound },
  { label: 'Account Settings', href: '/settings', icon: Settings },
  { label: 'Preferences', href: '/settings', icon: CircleUserRound },
  { label: 'Help & Support', href: '/help', icon: HelpCircle },
  { label: 'API Docs', href: '/api-docs', icon: FileCode2, adminOnly: true },
];

export default function ProfileMenu() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    const confirmed = window.confirm('Sign out of NMD Logistics?');
    if (!confirmed) return;
    const { error } = await authService.signOut();
    if (!error) {
      setOpen(false);
      router.replace('/auth/signin');
      router.refresh();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open profile menu"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-xs font-semibold text-primary-foreground">
          HB
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold text-foreground">Harshal</p>
          <p className="text-[11px] text-muted-foreground">Admin</p>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center gap-3 border-b border-border p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-sm font-semibold text-primary-foreground">
              HB
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Harshal Barhate</p>
              <p className="truncate text-xs text-muted-foreground">harshal@nmdlogistics.com</p>
            </div>
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">Admin</span>
          </div>
          <div className="p-2">
            {profileItems.map((item) => {
              const Icon = item.icon;
              const isVisible = !item.adminOnly || true;
              if (!isVisible) return null;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
