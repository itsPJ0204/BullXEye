'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Target, Users } from 'lucide-react';

export default function Onboarding() {
    const router = useRouter();
    const { updateRole } = useAuth();

    const handleRoleSelection = (role: 'coach' | 'archer') => {
        // Don't update role yet! Wait until next step completion.
        if (role === 'coach') {
            router.push('/onboarding/create-academy');
        } else {
            router.push('/onboarding/join-academy');
        }
    };

    return (
        <div className="flex flex-col h-full p-6 text-center">
            <div className="flex-1 flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-[var(--color-dark)]">Who are you?</h1>
                    <p className="text-[var(--color-dark)]/70">Select your role to get started.</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleRoleSelection('coach')}
                        className="w-full flex flex-col items-center p-6 bg-white border-2 border-transparent rounded-2xl shadow-sm hover:border-[var(--color-primary)] transition-all group"
                    >
                        <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)]/20 transition-colors">
                            <Users className="w-8 h-8 text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-dark)]">Academy Coach</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            I manage an archery academy/team & want to track my students.
                        </p>
                    </button>

                    <button
                        onClick={() => handleRoleSelection('archer')}
                        className="w-full flex flex-col items-center p-6 bg-white border-2 border-transparent rounded-2xl shadow-sm hover:border-[var(--color-primary)] transition-all group"
                    >
                        <div className="w-16 h-16 bg-[var(--color-accent)]/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent)]/30 transition-colors">
                            <Target className="w-8 h-8 text-[var(--color-dark)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-dark)]">Individual Archer</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            I want to track my own scores and join an academy (optional).
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}
