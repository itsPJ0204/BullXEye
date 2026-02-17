'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function JoinAcademy() {
    const router = useRouter();
    const { joinAcademy, updateRole } = useAuth();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const success = await joinAcademy(code.toUpperCase());
        if (success) {
            router.push('/dashboard');
        } else {
            setError('Invalid code. Please check and try again.');
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        // Set role to archer (without academy)
        await updateRole('archer');
        router.push('/dashboard');
    };

    return (
        <div className="flex flex-col h-full p-6 text-center">
            <div className="flex-1 flex flex-col justify-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-[var(--color-dark)]">Join Academy</h1>
                    <p className="text-[var(--color-dark)]/70">Enter the code shared by your coach.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <Input
                            placeholder="ENTER 6-DIGIT CODE"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            maxLength={8}
                            className="text-center text-2xl tracking-widest uppercase font-mono h-16"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 font-medium animate-pulse">{error}</p>}

                    <Button type="submit" fullWidth disabled={loading || code.length < 3}>
                        {loading ? 'Joining...' : 'Join Team'}
                    </Button>
                </form>
            </div>

            <div className="mt-auto pt-6">
                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[var(--color-off-white)] px-2 text-gray-500">Or</span>
                    </div>
                </div>
                <Button variant="ghost" fullWidth onClick={handleSkip}>
                    Skip & Train Solo
                </Button>
            </div>
        </div>
    );
}
