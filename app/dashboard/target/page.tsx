'use client';

import { useState, useEffect } from 'react';
import TargetFace from '@/components/target/TargetFace';
import ScoreControl from '@/components/target/ScoreControl';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

type Step = 'setup' | 'scoring';

interface Shot {
    x: number;
    y: number;
    value: number | string;
    arrowNumber?: number;
}

const DISTANCES = [10, 18, 20, 30, 40, 50, 60, 70, 90];

export default function TargetPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<Step>('setup');
    const [isSaving, setIsSaving] = useState(false);

    // Session Config
    const [arrowsPerEnd, setArrowsPerEnd] = useState<3 | 6>(6);
    const [distance, setDistance] = useState<number>(18);

    // Session State
    // ends is an array of arrays of Shots. ends[0] is the first end.
    const [ends, setEnds] = useState<Shot[][]>([[]]);
    const [currentEndIndex, setCurrentEndIndex] = useState(0);

    // Persistence Logic
    useEffect(() => {
        const savedState = localStorage.getItem('bullseye_scoring_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);

                // Check if state is stale (older than 30 minutes)
                const now = Date.now();
                const staleThreshold = 30 * 60 * 1000; // 30 minutes

                if (parsed.timestamp && (now - parsed.timestamp > staleThreshold)) {
                    // State is stale, clear it and remain in setup
                    localStorage.removeItem('bullseye_scoring_state');
                    return;
                }

                // Only restore if we are not already in a session (or maybe always restore?)
                // Let's restore if step is 'setup' (default) to resume
                if (parsed.step === 'scoring') {
                    setStep('scoring');
                    setDistance(parsed.distance);
                    setArrowsPerEnd(parsed.arrowsPerEnd);
                    setEnds(parsed.ends);
                    setCurrentEndIndex(parsed.currentEndIndex);
                }
            } catch (e) {
                console.error('Failed to parse (or stale) scoring state', e);
                localStorage.removeItem('bullseye_scoring_state');
            }
        }
    }, []);

    useEffect(() => {
        if (step === 'scoring') {
            const stateToSave = {
                step,
                distance,
                arrowsPerEnd,
                ends,
                currentEndIndex,
                timestamp: Date.now()
            };
            localStorage.setItem('bullseye_scoring_state', JSON.stringify(stateToSave));
        }
    }, [step, distance, arrowsPerEnd, ends, currentEndIndex]);

    const handleStart = () => {
        setStep('scoring');
        // Initial state for new session
        setEnds([[]]);
        setCurrentEndIndex(0);
        // Clear old state potentially (though the effect will overwrite it immediately)
    };

    const handleShot = (shot: Shot) => {
        const currentShots = ends[currentEndIndex] || [];
        if (currentShots.length >= arrowsPerEnd) return;

        const newEnds = [...ends];
        newEnds[currentEndIndex] = [...currentShots, shot];
        setEnds(newEnds);
    };

    const handleClearLast = () => {
        const currentShots = ends[currentEndIndex] || [];
        if (currentShots.length === 0) return;

        const newEnds = [...ends];
        newEnds[currentEndIndex] = currentShots.slice(0, -1);
        setEnds(newEnds);
    };

    const handleSubmitEnd = () => {
        // Auto-advance
        const nextIndex = currentEndIndex + 1;

        // If we represent a new end, ensure it exists in the array
        if (nextIndex >= ends.length) {
            setEnds([...ends, []]);
        }

        setCurrentEndIndex(nextIndex);
    };

    const handlePrevEnd = () => {
        if (currentEndIndex > 0) {
            setCurrentEndIndex(currentEndIndex - 1);
        }
    };

    const handleNextEnd = () => {
        if (currentEndIndex < ends.length - 1) {
            setCurrentEndIndex(currentEndIndex + 1);
        }
    };

    const handleFinishSession = async () => {
        if (!user || !supabase) {
            alert('You must be logged in to save sessions.');
            return;
        }

        setIsSaving(true);

        const allShots = ends.flat();
        const totalScore = allShots.reduce((acc, shot) => {
            if (shot.value === 'X' || shot.value === 'M') {
                return acc + (shot.value === 'X' ? 10 : 0);
            }
            return acc + (Number(shot.value) || 0);
        }, 0);

        try {
            const { error } = await supabase.from('practice_sessions').insert([
                {
                    user_id: user.id,
                    distance,
                    arrows_per_end: arrowsPerEnd,
                    total_score: totalScore,
                    total_arrows: allShots.length,
                    session_data: ends,
                }
            ]);

            setIsSaving(false);

            if (error) {
                alert('Error saving session: ' + error.message);
            } else {
                localStorage.removeItem('bullseye_scoring_state');
                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error('Error saving session:', error);
            alert(`Failed to save session: ${error.message}`);
        } finally {
            // setIsSaving(false); // This line is now handled above in both success and error paths
        }
    };

    if (step === 'setup') {
        return (
            <div className="p-6 max-w-md mx-auto min-h-[70vh] flex flex-col justify-center">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="self-start mb-6 -ml-4 text-gray-500 hover:text-[var(--color-dark)]"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                </Button>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-dark)]">New Practice</h1>
                        <p className="text-gray-500 mt-2">Configure your session.</p>

                        <div className="mt-4">
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => router.push('/dashboard/competition')}
                                className="border-[#219653] text-[#219653] hover:bg-[#219653] hover:text-white"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Switch to Competition Mode
                            </Button>
                        </div>
                    </div>

                    {/* Arrows per End */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Arrows per End</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setArrowsPerEnd(3)}
                                className={`p-4 rounded-xl border-2 transition-all ${arrowsPerEnd === 3 ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-bold' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                3 Arrows
                            </button>
                            <button
                                onClick={() => setArrowsPerEnd(6)}
                                className={`p-4 rounded-xl border-2 transition-all ${arrowsPerEnd === 6 ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-bold' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                6 Arrows
                            </button>
                        </div>
                    </div>

                    {/* Distance */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Distance (meters)</label>
                        <div className="grid grid-cols-4 gap-2">
                            {DISTANCES.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDistance(d)}
                                    className={`py-2 px-1 rounded-lg border text-sm transition-all ${distance === d ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white font-bold shadow-md' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {d}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleStart}
                        className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 shadow-lg"
                    >
                        Start Session
                    </Button>
                </div>
            </div>
        );
    }

    const currentShots = ends[currentEndIndex] || [];

    // Calculate Running Totals
    const allShots = ends.flat();
    const totalScore = allShots.reduce((acc, shot) => {
        if (shot.value === 'X' || shot.value === 'M') {
            return acc + (shot.value === 'X' ? 10 : 0);
        }
        return acc + (Number(shot.value) || 0);
    }, 0);

    const totalPossible = allShots.length * 10;

    return (
        <div className="h-[100dvh] flex flex-col p-1 w-full mx-auto overflow-hidden bg-white">
            <header className="flex-none flex items-center justify-between px-2 pt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('setup')}
                    className="text-gray-400 -ml-2 h-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Exit
                </Button>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {distance}m
                        </div>
                        <div className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
                            End {currentEndIndex + 1}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-1">
                <TargetFace
                    shots={currentShots}
                    onShot={handleShot}
                    readOnly={currentShots.length >= arrowsPerEnd}
                />
            </div>

            <div className="flex-none space-y-1 px-2 pb-2 bg-white z-10">
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">End {currentEndIndex + 1}</h2>
                        <div className="text-sm text-gray-500">
                            {ends[currentEndIndex]?.length || 0} / {arrowsPerEnd} Arrows
                        </div>
                    </div>

                    <ScoreControl
                        shots={ends[currentEndIndex] || []}
                        arrowsPerEnd={arrowsPerEnd}
                        onClearLast={handleClearLast}
                        onSubmit={handleSubmitEnd}
                    />
                </div>

                {/* Previous Ends History (Mini) */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevEnd}
                        disabled={currentEndIndex === 0}
                        className="text-gray-500 h-8"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                    </Button>

                    {/* Only show Next if we are browsing history (not on the latest end) */}
                    {currentEndIndex < ends.length - 1 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNextEnd}
                            className="text-gray-500 h-8"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinishSession}
                            size="sm"
                            disabled={isSaving || ends.flat().length === 0}
                            className="bg-[var(--color-dark)] text-white hover:bg-black h-8 text-xs"
                        >
                            {isSaving ? 'Saving...' : 'Finish Practice'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
