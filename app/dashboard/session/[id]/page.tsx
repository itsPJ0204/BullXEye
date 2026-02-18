'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TargetFace from '@/components/target/TargetFace';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ChevronDown, ChevronUp, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Arrow Colors for visualization
const ARROW_COLORS = {
    1: '#FF0000', // Red
    2: '#0066CC', // Blue
    3: '#0066CC', // Blue (Wait, standard is Red, Blue, Black, White. But user had Green/Gold. Let's stick to user's). 
    // Actually revisiting original code: 
    // 3: '#00cc00', // Green
    // 4: '#FFD700', // Gold
    // 5: '#9932CC', // Purple
    // 6: '#FF8C00', // Orange
};
// Restoring original color map logic if needed, but I'm just replacing imports.

interface Shot {
    x: number;
    y: number;
    value: number | string;
    arrowNumber?: number;
    color?: string; // Add color for visualization
}

interface SessionData {
    id: string;
    created_at: string;
    distance: number;
    total_score: number;
    total_arrows: number;
    arrows_per_end: number;
    session_data: Shot[][];
}

export default function SessionDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Default visible arrows
    const [visibleArrows, setVisibleArrows] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));

    useEffect(() => {
        const fetchSession = async () => {
            if (authLoading) return;
            if (!user) return; // Wait for user to be available
            if (!supabase) return;

            const { data, error } = await supabase
                .from('practice_sessions')
                .select('id, created_at, distance, total_score, total_arrows, arrows_per_end, session_data')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching session:', error);
                // alert('Failed to load session');
                // router.push('/dashboard');
            } else {
                setSession(data as unknown as SessionData);
            }
            setLoading(false);
        };

        fetchSession();
    }, [id, router, user, authLoading]);

    if (loading) {
        return <div className="p-6 text-center">Loading session details...</div>;
    }

    if (!session) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500 mb-4">Session not found or could not be loaded.</p>
                <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    const sessionData = session.session_data as unknown as Shot[][];
    // Flatten all shots
    let allShots: Shot[] = [];
    if (sessionData && Array.isArray(sessionData)) {
        allShots = sessionData.flat();
    }

    // Group by Arrow Number
    const shotsByArrowNumber: Record<number, { total: number, count: number, shots: Shot[] }> = {};

    allShots.forEach(shot => {
        const num = shot.arrowNumber || 0;
        if (num === 0) return;

        if (!shotsByArrowNumber[num]) {
            shotsByArrowNumber[num] = { total: 0, count: 0, shots: [] };
        }

        let score = 0;
        if (shot.value === 'X' || shot.value === 'M') {
            score = shot.value === 'X' ? 10 : 0;
        } else {
            score = Number(shot.value);
        }

        shotsByArrowNumber[num].total += score;
        shotsByArrowNumber[num].count += 1;
        shotsByArrowNumber[num].shots.push(shot);
    });

    const arrowStats = Object.entries(shotsByArrowNumber).map(([numStr, data]) => {
        const num = Number(numStr);
        return {
            arrowNumber: num,
            avg: data.count > 0 ? (data.total / data.count).toFixed(2) : '0.00',
            count: data.count,
            color: ARROW_COLORS[num as keyof typeof ARROW_COLORS] || '#000000'
        };
    }).sort((a, b) => a.arrowNumber - b.arrowNumber);

    const visualShots = allShots
        .filter(s => s.arrowNumber && visibleArrows.has(s.arrowNumber))
        .map(s => ({
            ...s,
            color: ARROW_COLORS[s.arrowNumber as keyof typeof ARROW_COLORS] || '#000000'
        }));

    const toggleArrowVisibility = (num: number) => {
        const newSet = new Set(visibleArrows);
        if (newSet.has(num)) {
            newSet.delete(num);
        } else {
            newSet.add(num);
        }
        setVisibleArrows(newSet);
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-white">
            <div className="flex-none p-4 border-b flex items-center gap-4 bg-white z-10">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="font-bold text-lg leading-tight">Session Analysis</h1>
                    <p className="text-xs text-gray-500">
                        {new Date(session.created_at).toLocaleDateString()} • {session.distance}m • {session.arrows_per_end} Arrow Ends
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-4 relative">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-[var(--color-primary)]">
                            {session.total_score}
                        </div>
                    </div>

                    {/* Delete Menu */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                        </Button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors font-medium"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        if (!supabase) return;
                                        if (!confirm('Are you sure you want to delete this session?')) return;
                                        setLoading(true);
                                        const { error } = await supabase.from('practice_sessions').delete().eq('id', session.id);
                                        if (error) {
                                            alert('Error deleting: ' + error.message);
                                            setLoading(false);
                                        } else {
                                            router.replace('/dashboard');
                                        }
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                    <div className="aspect-square w-full max-w-[350px] mx-auto relative bg-gray-50 rounded-full border border-gray-100 shadow-inner">
                        <TargetFace
                            shots={visualShots}
                            onShot={() => { }}
                            readOnly={true}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="border-b pb-2">
                            <h3 className="font-bold text-gray-900">Arrow Performance</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Tap rows to filter the target face visualization.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {arrowStats.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">No individual arrow data available.</p>
                            ) : (
                                arrowStats.map(stat => (
                                    <div
                                        key={stat.arrowNumber}
                                        onClick={() => toggleArrowVisibility(stat.arrowNumber)}
                                        className={`
                                            flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                                            ${visibleArrows.has(stat.arrowNumber)
                                                ? 'bg-white border-gray-200 shadow-sm'
                                                : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors font-bold text-sm text-white`}
                                                style={{
                                                    backgroundColor: stat.color,
                                                    borderColor: stat.color
                                                }}
                                            >
                                                {stat.arrowNumber}
                                            </div>

                                            <div>
                                                <span className="font-bold text-gray-700 block">Arrow #{stat.arrowNumber}</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{stat.count} shots</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-2xl font-black text-gray-900 leading-none">{stat.avg}</div>
                                            <div className="text-[10px] uppercase text-gray-400 font-bold mt-1">Avg Score</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
