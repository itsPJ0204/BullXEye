'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function Profile() {
    const { user, role, academy, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <div className="p-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[var(--color-dark)]">Profile</h1>
                <p className="text-gray-500">Manage your account settings</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div>
                    <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">Email</label>
                    <p className="font-medium text-[var(--color-dark)]">{user?.email}</p>
                </div>

                <div>
                    <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">Role</label>
                    <p className="font-medium text-[var(--color-dark)] capitalize">{role}</p>
                </div>

                {academy && (
                    <div>
                        <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">Academy</label>
                        <p className="font-medium text-[var(--color-dark)]">{academy.name}</p>
                        <p className="text-sm text-gray-500">{academy.location}</p>
                    </div>
                )}
            </div>

            <Button variant="outline" fullWidth onClick={handleSignOut} className="text-red-500 border-red-500 hover:bg-red-50">
                Sign Out
            </Button>
        </div>
    );
}
