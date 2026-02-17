'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: signInError } = await signIn(formData.email, formData.password);

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-1 flex flex-col justify-center space-y-8">
                <div className="text-center space-y-2">
                    <img src="/logo.png" alt="BullXEye" className="h-24 w-auto object-contain mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[var(--color-dark)]">Welcome Back</h1>
                    <p className="text-sm text-gray-500">Sign in to continue tracking</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                    />
                    {/* Note: In a real Magic Link flow, password might not be needed, but Supabase supports password handling too. 
              The task implies 'Login/Sign Up' flow. If using Magic Link, only email is needed. 
              But usually apps allow password. 
              The mocked AuthContext only implemented `signInWithOtp` (Magic Link) for signIn.
              However, the SignUp collected password.
              
              I should probably update `signIn` in AuthContext to support `signInWithPassword` if password is provided.
              
              Let's update AuthContext later or now. 
              For now, I'll add a password field but if AuthContext only does OTP it might be confusing.
              
              Let's check implementation of AuthContext again.
              `signIn` takes `email`. `supabase.auth.signInWithOtp`.
              
              Wait, the user requested "Login/Sign Up" and collected Password.
              So I should probably use `signInWithPassword` for login if they signed up with password.
              
              I will assume Password Login is desired.
          */}
                    <Input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                    />

                    {error && <p className="text-sm text-center text-red-500">{error}</p>}

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Signing In...' : 'Log In'}
                    </Button>
                </form>
            </div>

            <div className="mt-auto pt-6 text-center">
                <p className="text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-[var(--color-primary)] font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
