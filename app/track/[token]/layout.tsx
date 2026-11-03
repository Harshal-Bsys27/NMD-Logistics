import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track your delivery',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomerTrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
