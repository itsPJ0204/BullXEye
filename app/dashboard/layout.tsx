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
                router.push('/onboarding');
            }
        }
    }, [user, role, isLoading, router]);

    if (isLoading || !user || !role) {
        return <div className="h-screen flex items-center justify-center text-[var(--color-primary)]">Loading...</div>;
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
