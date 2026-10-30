'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  create: 'New Order',
  drivers: 'Drivers',
  assignments: 'Assignments',
  reports: 'Reports',
  analytics: 'Analytics',
  status: 'Status',
  'api-docs': 'API Docs',
  settings: 'Settings',
  help: 'Help & Support',
  'getting-started': 'Getting Started',
};

function breadcrumbLabel(segment: string, previousSegment?: string) {
  const knownLabel = routeLabels[segment];
  if (knownLabel) return knownLabel;
  if (previousSegment === 'orders') return `Order ${segment.slice(0, 8).toUpperCase()}`;
  if (previousSegment === 'drivers') return `Driver ${segment.slice(0, 8).toUpperCase()}`;
  if (previousSegment === 'assignments') return `Assignment ${segment.slice(0, 8).toUpperCase()}`;
  return segment;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    segment,
    label: breadcrumbLabel(segment, segments[index - 1]),
    href: `/${segments.slice(0, index + 1).join('/')}`,
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="text-on-brand/60">/</span>}
            {index === crumbs.length - 1 ? (
              <span aria-current="page" className="truncate font-semibold text-on-brand">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="truncate text-on-brand/75 transition hover:text-on-brand">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}