'use client';

import Navbar from '@/components/layout/Navbar';

export default function Header() {
  return <Navbar collapsed={false} onToggleSidebar={() => undefined} />;
}
