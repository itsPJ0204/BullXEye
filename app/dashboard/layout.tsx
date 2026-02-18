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
        if (typeof window !== 'undefined') {
            console.log('DashboardLayout Loading State:', { isLoading, hasUser: !!user, hasRole: !!role });
        }
        return (
            <div className="h-screen flex flex-col items-center justify-center text-[var(--color-primary)]">
                <div>Loading...</div>
                <div className="text-xs text-gray-400 mt-2">
                    {isLoading ? 'Auth Loading...' : !user ? 'No User' : !role ? 'No Role' : 'Redirecting...'}
                </div>
                {/* Failsafe Logout */}
                <button
                    onClick={() => {
                        window.location.href = '/login';
                        // Force hard reload to clear state
                        // supabase.auth.signOut(); // Can't easily access auth here without context, but simple redirect helps break loop.
                    }}
                    className="mt-8 text-xs text-red-400 hover:text-red-600 underline cursor-pointer"
                >
                    Stuck? Click here to return to login.
                </button>
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
