'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';

export default function SignUp() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        bowCategory: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.bowCategory) {
            setError('Please select a bow category');
            setLoading(false);
            return;
        }

        const { error: signUpError } = await signUp(formData.email, formData.password, {
            full_name: formData.fullName,
            bow_category: formData.bowCategory,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            // Redirect to home or dashboard (for now home, maybe a success page later)
            // Since confirmation is required usually, might want to show message.
            // But for mock/simple flow, redirect.
            router.push('/onboarding');
        }
    };

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-1 flex flex-col justify-center space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-[var(--color-dark)]">Create Account</h1>
                    <p className="text-sm text-gray-500">Join BullsEye to track your progress</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        autoComplete="name"
                    />
                    <Input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                    />
                    <Input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        minLength={6}
                    />
                    <Select
                        name="bowCategory"
                        value={formData.bowCategory}
                        onChange={handleChange}
                        options={[
                            { label: 'Indian (Generic)', value: 'Indian' },
                            { label: 'Recurve', value: 'Recurve' },
                            { label: 'Compound', value: 'Compound' },
                        ]}
                        required
                    />

                    {error && <p className="text-sm text-center text-red-500">{error}</p>}

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>
            </div>

            <div className="mt-auto pt-6 text-center">
                <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[var(--color-primary)] font-medium">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
