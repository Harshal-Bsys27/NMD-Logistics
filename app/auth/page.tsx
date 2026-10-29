'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';

export default function AuthRootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      startTransition(() => {
        if (user) {
          router.replace('/dashboard');
        } else {
          router.replace('/auth/signin');
        }
      });
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="surface-glass mx-auto max-w-md rounded-lg border border-border p-8">
        <p className="text-center text-lg font-semibold text-foreground">Redirecting you to the right place...</p>
      </div>
    </div>
  );
}
