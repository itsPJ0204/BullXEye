'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (role && pathname === '/onboarding') {
                // Only redirect to dashboard if on the main selection screen
                // and already have a role. Allow sub-routes (create/join) to proceed.
                router.push('/dashboard');
            }
        }
    }, [user, role, isLoading, router, pathname]);

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center text-[var(--color-primary)]">Loading...</div>;
    }

    if (!user) {
        return null; // Will redirect to login
    }

    // Attempting to visit /onboarding while having a role -> Redirect handled by useEffect
    // But visiting /onboarding/create-academy etc should be allowed even if role exists
    if (role && pathname === '/onboarding') {
        return null; // Will redirect to dashboard
    }

    return (
        <div className="h-screen bg-[var(--color-background)]">
            {children}
        </div>
    );
}
