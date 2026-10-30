import Link from 'next/link';
import { cn } from '@/utils/helpers';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'onDark' | 'onLight';
  href?: string;
  className?: string;
  compact?: boolean;
  wordmarkClassName?: string;
}

const markSizes = {
  sm: 'h-10 w-10 rounded-[12px]',
  md: 'h-12 w-12 rounded-[14px]',
  lg: 'h-14 w-14 rounded-[16px]',
};

const wordmarkSizes = {
  sm: 'text-[18px]',
  md: 'text-[22px]',
  lg: 'text-[24px]',
};

export default function Logo({
  size = 'md',
  variant = 'onDark',
  href = '/dashboard',
  className,
  compact = false,
  wordmarkClassName,
}: LogoProps) {
  const onDark = variant === 'onDark';

  return (
    <Link
      href={href}
      aria-label="NMD Logistics dashboard"
      className={cn('group inline-flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card', className)}
    >
      <span className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-accent to-warning shadow-logo transition-transform duration-200 group-hover:-translate-y-px',
        markSizes[size],
      )}>
        <span className="pointer-events-none absolute inset-px rounded-[inherit] border border-on-brand/35" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-[inherit] bg-gradient-to-b from-on-brand/35 to-transparent" aria-hidden="true" />
        <svg viewBox="0 0 48 48" className="relative h-[72%] w-[72%]" role="img" aria-label="NMD route mark">
          <path d="M10 35V13l17 22V13" fill="none" stroke="var(--accent-foreground)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M27 35h8c3.3 0 5-1.6 5-4.1 0-2.2-1.7-3.8-4.5-3.8h-4" fill="none" stroke="var(--accent-foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M31.5 24.5 28 27.1l3.5 2.7" fill="none" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="40" cy="35" r="2" fill="var(--accent-foreground)" />
        </svg>
      </span>
      <span className={cn('min-w-0 leading-none', compact && 'hidden', wordmarkClassName)}>
          <span className={cn('block whitespace-nowrap font-extrabold tracking-tight', wordmarkSizes[size], onDark ? 'text-on-brand' : 'text-brand-900')}>
            NMD <span className={cn('font-medium', onDark ? 'text-on-brand/85' : 'text-brand-700')}>Logistics</span>
          </span>
          <span className={cn('mt-1.5 block whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.2em]', onDark ? 'text-accent' : 'text-brand-600')}>
            Operations Platform
          </span>
      </span>
    </Link>
  );
}