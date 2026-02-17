'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AttendancePage() {
    const { role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (role === 'coach') {
                router.replace('/dashboard/attendance/coach');
            } else if (role === 'archer') {
                router.replace('/dashboard/attendance/student');
            } else {
                router.replace('/dashboard');
            }
        }
    }, [role, isLoading, router]);

    return (
        <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        </div>
    );
}
