'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { ClipboardCopy, ChevronRight } from 'lucide-react';

export default function CreateAcademy() {
    const router = useRouter();
    const { createAcademy } = useAuth();
    const [formData, setFormData] = useState({ name: '', location: '' });
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const code = await createAcademy(formData.name, formData.location);
        if (code) {
            setCreatedCode(code);
        } else {
            // In a real app we'd use a toast or error state
            console.error('Failed to create academy');
        }
        setLoading(false);
    };

    const copyToClipboard = () => {
        if (createdCode) {
            navigator.clipboard.writeText(createdCode);
            // Could add toast here
        }
    };

    const handleContinue = () => {
        router.push('/dashboard');
    };

    if (createdCode) {
        return (
            <div className="flex flex-col h-full p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="flex-1 flex flex-col justify-center items-center space-y-8">
                    <div className="space-y-2">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Academy Created!</h1>
                        <p className="text-[var(--color-dark)]/70">Share this code with your archers to join.</p>
                    </div>

                    <div className="w-full bg-white p-6 rounded-xl border-2 border-[var(--color-primary)] border-dashed relative">
                        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">JOIN CODE</p>
                        <div className="flex items-center justify-center space-x-2">
                            <span className="text-4xl font-mono font-bold tracking-wider text-[var(--color-primary)]">
                                {createdCode}
                            </span>
                            <button onClick={copyToClipboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ClipboardCopy className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <Button onClick={handleContinue} fullWidth className="group">
                        Go to Dashboard
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-1 flex flex-col justify-center space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-[var(--color-dark)]">Create Academy</h1>
                    <p className="text-[var(--color-dark)]/70">Set up your team details.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Academy Name"
                        placeholder="e.g. Eagle Eye Archery"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Location / City"
                        placeholder="e.g. New York, NY"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                    />

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Creating...' : 'Generate Join Code'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
