'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentAttendancePage() {
    const { user, academy } = useAuth();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !supabase || code.length !== 4) return;

        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            // 1. Find Session
            const { data: session, error: sessionError } = await supabase
                .from('attendance_sessions')
                .select('id')
                .eq('code', code)
                .eq('is_active', true)
                .eq('academy_id', academy?.id)
                .maybeSingle();

            if (sessionError || !session) {
                setStatus('error');
                setMessage('Invalid code or session expired.');
                setIsLoading(false);
                return;
            }

            // 2. Mark Attendance
            const { error: insertError } = await supabase
                .from('attendance_records')
                .insert([{
                    session_id: session.id,
                    student_id: user.id,
                    status: 'present'
                }]);

            if (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    setStatus('error');
                    setMessage('You have already marked attendance for this session.');
                } else {
                    setStatus('error');
                    setMessage('Failed to mark attendance. Please try again.');
                }
            } else {
                setStatus('success');
                setMessage('Attendance marked successfully!');
                setCode('');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto min-h-[60vh] flex flex-col justify-center">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="self-start mb-6 -ml-4 text-gray-500 hover:text-[var(--color-dark)]"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[var(--color-dark)]">Mark Attendance</h1>
                <p className="text-gray-500 mt-2">Enter the 4-digit code provided by your coach.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Input
                    label="Session Code"
                    placeholder="0000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="text-center text-3xl tracking-[1em] font-mono h-20"
                    maxLength={4}
                    inputMode="numeric"
                />

                {status === 'error' && (
                    <div className="flex items-center justify-center text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                        <XCircle className="w-4 h-4 mr-2" />
                        {message}
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex items-center justify-center text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {message}
                    </div>
                )}

                <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading || code.length !== 4}
                    className="h-14 text-lg"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        status === 'success' ? 'Marked!' : 'Submit'
                    )}
                </Button>
            </form>
        </div>
    );
}
