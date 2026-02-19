'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (!role) {
                // If user is loaded but no role, it might be a new user OR role fetch failed/lagged.
                // We should check if we are already on onboarding, if so, don't redirect (already handled by OnboardingLayout?)
                // Actually, this is DashboardLayout. So if we are here, we are NOT in onboarding.
                // Redirect to onboarding.
                router.push('/onboarding');
            }
        }
    }, [user, role, isLoading, router]);

    // PREVENT RENDER until checks are done
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-[var(--color-primary)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
                <div>Loading App...</div>
            </div>
        );
    }

    if (!user) return null; // Redirecting to login

    // If user exists but role is missing
    if (!role) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-[var(--color-primary)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
                <div>Finalizing setup...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen relative">
            <div className="flex-1 overflow-y-auto pb-16">
                {children}
            </div>
            <BottomNav />
        </div>
    );
}
