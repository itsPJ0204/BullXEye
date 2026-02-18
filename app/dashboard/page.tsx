'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Plus, CheckCircle, Target, Trash2, LogOut, MoreVertical, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
    const { academy, role, joinedAcademies, switchAcademy, refreshUserData, profile } = useAuth();
    const router = useRouter();
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [showAcademyMenu, setShowAcademyMenu] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    // Helper to get initials if name exists
    const getFirstName = (name: string) => name.split(' ')[0];
    const rawName = profile?.full_name || (role === 'coach' ? 'Coach' : 'Archer');
    const displayName = getFirstName(rawName);

    useEffect(() => {
        const fetchSessions = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('practice_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setRecentSessions(data);
        };

        fetchSessions();
    }, []);

    const toggleSessionSelection = (sessionId: string) => {
        const newSelected = new Set(selectedSessions);
        if (newSelected.has(sessionId)) {
            newSelected.delete(sessionId);
        } else {
            newSelected.add(sessionId);
        }
        setSelectedSessions(newSelected);
    };

    const handleDeleteSelected = async () => {
        if (!supabase) return;
        if (selectedSessions.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedSessions.size} selected session(s)?`)) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('practice_sessions')
                .delete()
                .in('id', Array.from(selectedSessions));

            if (error) throw error;

            setRecentSessions(prev => prev.filter(s => !selectedSessions.has(s.id)));
            setSelectedSessions(new Set());
        } catch (error: any) {
            console.error('Error deleting sessions:', error);
            alert('Failed to delete sessions: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <div className="mb-0">
                        <img src="/logo.png" alt="BullXEye" className="h-20 w-auto object-contain object-left" />
                    </div>
                </div>

                {/* User Profile Tag */}
                <div className={`
                    flex items-center space-x-3 px-4 py-2 rounded-full shadow-md border border-white/20
                    ${role === 'coach'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500'}
                `}>
                    <div className="flex flex-col items-end mr-1">
                        <span className="text-white font-bold text-sm leading-tight">
                            {displayName}
                        </span>
                        <span className="text-white/80 text-[10px] uppercase tracking-wider font-semibold">
                            {role}
                        </span>
                    </div>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                        {role === 'coach' ? (
                            <Crown className="w-4 h-4 text-white" />
                        ) : (
                            <Target className="w-4 h-4 text-white" />
                        )}
                    </div>
                </div>
            </header>

            {academy ? (
                <div className="space-y-4">
                    <div className="bg-[var(--color-primary)] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-bold">{academy.name}</h2>
                                    <p className="opacity-90 text-sm">{academy.location}</p>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAcademyMenu(!showAcademyMenu)}
                                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        <MoreVertical className="w-5 h-5 text-white" />
                                    </button>

                                    {showAcademyMenu && (
                                        <div className="absolute right-0 top-8 bg-white text-gray-800 rounded-lg shadow-xl py-2 w-48 z-50">
                                            {role === 'coach' ? (
                                                <button
                                                    onClick={async () => {
                                                        setShowAcademyMenu(false);
                                                        if (!supabase) return;
                                                        if (confirm('Are you sure you want to DELETE this academy? All data will be lost. This cannot be undone.')) {
                                                            const name = prompt(`Type the academy name to confirm deletion:\n\n${academy.name}`);

                                                            if (!name || name.trim() !== academy.name.trim()) {
                                                                alert(`Name does not match.\nExpected: "${academy.name}"\nTyped: "${name}"`);
                                                                return;
                                                            }

                                                            const { error } = await supabase.from('academies').delete().eq('id', academy.id);
                                                            if (error) {
                                                                alert('Failed to delete academy: ' + error.message);
                                                            } else {
                                                                // Refresh context then router
                                                                await refreshUserData();
                                                                alert('Academy deleted.');
                                                            }
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Academy
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        setShowAcademyMenu(false);
                                                        if (!supabase) return;
                                                        if (confirm('Are you sure you want to leave this academy?')) {
                                                            const { data: { user } } = await supabase.auth.getUser();
                                                            if (!user) return;

                                                            const { error } = await supabase
                                                                .from('academy_members')
                                                                .delete()
                                                                .eq('academy_id', academy.id)
                                                                .eq('user_id', user.id);

                                                            if (error) {
                                                                alert('Failed to leave academy: ' + error.message);
                                                            } else {
                                                                // Refresh context
                                                                await refreshUserData();
                                                                alert('Left academy successfully.');
                                                            }
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                >
                                                    <LogOut className="w-4 h-4 mr-2" /> Leave Academy
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {role === 'coach' && (
                                <div className="mt-4 pt-4 border-t border-white/20">
                                    <p className="text-xs uppercase opacity-70 mb-1">Join Code</p>
                                    <p className="font-mono text-xl font-bold tracking-wider">{academy.code}</p>
                                </div>
                            )}
                        </div>
                        {/* Decorative circle */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
                    </div>

                    {joinedAcademies.length > 1 && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2 font-medium">Switch Academy</p>
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {joinedAcademies.map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => switchAcademy(a.id)}
                                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${academy.id === a.id
                                            ? 'bg-[var(--color-dark)] text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {a.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-100 p-6 rounded-2xl border-dashed border-2 border-gray-300 text-center">
                    <p className="text-gray-500">No Academy Joined</p>
                </div>
            )}

            {role === 'coach' && (
                <div className="mb-6">
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={() => router.push('/onboarding/create-academy')}
                        className="border-dashed border-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Academy
                    </Button>
                </div>
            )}

            {role !== 'coach' && (
                <div className="space-y-4 mb-6">
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={() => router.push('/dashboard/join')}
                        className="border-dashed border-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Join Another Academy
                    </Button>
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={() => router.push('/dashboard/attendance')}
                        className="border-dashed border-2"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Attendance
                    </Button>
                </div>
            )
            }

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Recent Activity</h3>
                    {selectedSessions.size > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteSelected}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isDeleting}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete ({selectedSessions.size})
                        </Button>
                    )}
                </div>
                <div className="space-y-3">
                    {recentSessions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No recent activity.</p>
                    ) : (
                        recentSessions.map((session) => (
                            <div key={session.id} className={`flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 group relative transition-colors ${selectedSessions.has(session.id) ? 'bg-blue-50 border-blue-200' : ''}`}>
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedSessions.has(session.id)}
                                        onChange={() => toggleSessionSelection(session.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                                    />
                                </div>
                                <div
                                    className={`relative z-0 flex items-center w-full ${selectedSessions.has(session.id) || 'group-hover:pl-6'} transition-all duration-200`}
                                >
                                    <div className="w-12 h-12 bg-orange-100 rounded-lg mr-4 flex flex-col items-center justify-center text-orange-600 font-bold flex-shrink-0">
                                        <span className="text-sm">Avg</span>
                                        <span className="text-lg leading-none">{(session.total_score / session.total_arrows).toFixed(1)}</span>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-medium text-[var(--color-dark)] truncate">{session.total_arrows} Arrows</h4>
                                        <p className="text-xs text-gray-400 truncate">
                                            {new Date(session.created_at).toLocaleDateString()} • {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="ml-auto text-right pl-2 flex-shrink-0">
                                        <div className="font-bold text-gray-700 text-lg">
                                            {session.total_score}
                                        </div>
                                        <div className="text-xs text-gray-400 font-medium">
                                            {session.distance}m
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Overlay for Mobile - Make the whole card clickable for selection if logical, or keeps specific checkbox behavior */}
                                {/* Keeping specific checkbox behavior for precision, but ensuring touch targets are good */}
                                <div
                                    className="absolute inset-0 cursor-pointer z-0"
                                    onClick={() => toggleSessionSelection(session.id)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
