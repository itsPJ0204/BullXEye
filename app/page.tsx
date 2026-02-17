'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  return (
    <main className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8">
      <div className="space-y-6 relative">
        <div className="relative inline-block pt-4 pb-0">
          <img src="/logo.png" alt="BullXEye" className="h-48 w-auto object-contain mx-auto" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Link href="/signup" className="w-full block">
          <Button fullWidth size="lg">
            Get Started
          </Button>
        </Link>
        <Link href="/login" className="w-full block">
          <Button variant="ghost" fullWidth>
            I already have an account
          </Button>
        </Link>
      </div>

      <div className="absolute bottom-6 text-xs text-center text-gray-400">
        <p>&copy; 2026 BullXEye. strictly mobile.</p>
      </div>
    </main>
  );
}
