'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Moon, Monitor, Sun } from 'lucide-react';
import { cn } from '@/utils/helpers';

type ThemeMode = 'light' | 'dark' | 'system';

const themeOptions: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('system');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme') as ThemeMode | null;
    const resolved = stored ?? 'system';
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const applyTheme = (value: ThemeMode) => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextDark = value === 'system' ? systemDark : value === 'dark';
    root.classList.toggle('dark', nextDark);
  };

  const selectTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
    setOpen(false);
  };

  const currentIcon = themeOptions.find((option) => option.value === theme)?.icon ?? Sun;
  const CurrentIcon = currentIcon;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Theme options"
        title="Theme options"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const active = option.value === theme;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectTheme(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active && 'bg-muted/80'
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
