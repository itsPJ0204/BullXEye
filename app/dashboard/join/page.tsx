'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function JoinAcademyPage() {
    const { joinAcademy } = useAuth();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { success, error: msg } = await joinAcademy(code.trim());
            if (success) {
                router.push('/dashboard');
            } else {
                setError(msg || 'Invalid academy code or you are already a member.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto min-h-[80vh] flex flex-col justify-center">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="self-start mb-6 -ml-4 text-gray-500 hover:text-[var(--color-dark)]"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-dark)]">Join an Academy</h1>
                    <p className="text-gray-500 mt-2">
                        Enter the unique 6-character code provided by your coach to join their academy.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Academy Code"
                        placeholder="e.g. X7Y2Z9"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest uppercase font-mono h-16"
                        error={error}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        disabled={isLoading || code.length < 6}
                        className="h-12"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            'Join Academy'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
