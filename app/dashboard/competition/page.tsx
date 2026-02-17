'use client';

import { useEffect, useState } from 'react';
import CompetitionTimer from '@/components/competition/CompetitionTimer';
import TargetFace from '@/components/target/TargetFace';
import ScoreControl from '@/components/target/ScoreControl';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

type Step = 'setup' | 'timer' | 'scoring';

interface Shot {
    x: number;
    y: number;
    value: number | string;
}

const DISTANCES = [10, 18, 20, 30, 40, 50, 60, 70, 90];

export default function CompetitionPage() {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();

    // State
    const [step, setStep] = useState<Step>('setup');
    const [duration, setDuration] = useState<number>(180);
    const [isSaving, setIsSaving] = useState(false);

    // Session Config
    const [arrowsPerEnd, setArrowsPerEnd] = useState<3 | 6>(6);
    const [distance, setDistance] = useState<number>(18);

    // Scoring Data
    const [ends, setEnds] = useState<Shot[][]>([[]]);
    const [currentEndIndex, setCurrentEndIndex] = useState(0);

    // Profile detection
    useEffect(() => {
        if (!isLoading && profile) {
            const category = profile.bow_category || '';
            // Indian Bow = 90 seconds (1.5 min), Others = 180 seconds (3 min)
            if (category.toLowerCase().includes('indian')) {
                setDuration(90);
            } else {
                setDuration(180);
            }
        }
    }, [isLoading, profile]);

    // Handlers
    const handleStartMatch = () => {
        setStep('timer');
        setEnds([[]]);
        setCurrentEndIndex(0);
    };

    const handleTimerComplete = () => {
        setStep('scoring');
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
        // Here we decide whether to go back to timer or finish?
        // Usually competition has fixed number of ends (e.g. 10 or 20).
        // For now, let's keep it infinite until user says Stop, OR give option 
        // "Next End" vs "Finish".

        // Let's go to Timer for the NEXT end by default.
        const nextIndex = currentEndIndex + 1;
        setEnds([...ends, []]);
        setCurrentEndIndex(nextIndex);
        setStep('timer');
    };

    const handleFinishSession = async () => {
        if (!user) {
            alert('You must be logged in to save sessions.');
            return;
        }

        setIsSaving(true);

        const allShots = ends.flat();
        // Remove the last empty end if it exists and is empty (which happens if we just started a new one)
        // But wait, user might finish AFTER scoring an end.

        const validEnds = ends.filter(e => e.length > 0);
        const validShots = validEnds.flat();

        const totalScore = validShots.reduce((acc, shot) => {
            if (shot.value === 'X' || shot.value === 'M') {
                return acc + (shot.value === 'X' ? 10 : 0);
            }
            return acc + (Number(shot.value) || 0);
        }, 0);

        try {
            const { error } = await supabase
                .from('practice_sessions')
                .insert({
                    user_id: user.id,
                    distance,
                    arrows_per_end: arrowsPerEnd,
                    total_score: totalScore,
                    total_arrows: validShots.length,
                    session_data: validEnds
                });

            if (error) throw error;
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error saving session:', error);
            alert(`Failed to save session: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-[#121212]"><Loader2 className="w-8 h-8 text-[#219653] animate-spin" /></div>;
    if (!user) { router.push('/login'); return null; }


    // RENDER: SETUP
    if (step === 'setup') {
        return (
            <div className="p-6 max-w-md mx-auto min-h-[100dvh] flex flex-col justify-center bg-[#121212] text-white">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="self-start mb-6 -ml-4 text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#219653]">Competition Mode</h1>
                        <p className="text-gray-400 mt-2">Timer & Scoring Integrated.</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Timer set to <span className="text-white font-bold">{duration}s</span> based on your bow.
                        </p>
                    </div>

                    {/* Arrows per End */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Arrows per End</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setArrowsPerEnd(3)}
                                className={`p-4 rounded-xl border-2 transition-all ${arrowsPerEnd === 3 ? 'border-[#219653] bg-[#219653]/10 text-[#219653] font-bold' : 'border-gray-700 hover:border-gray-600'}`}
                            >
                                3 Arrows
                            </button>
                            <button
                                onClick={() => setArrowsPerEnd(6)}
                                className={`p-4 rounded-xl border-2 transition-all ${arrowsPerEnd === 6 ? 'border-[#219653] bg-[#219653]/10 text-[#219653] font-bold' : 'border-gray-700 hover:border-gray-600'}`}
                            >
                                6 Arrows
                            </button>
                        </div>
                    </div>

                    {/* Distance */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Distance (meters)</label>
                        <div className="grid grid-cols-4 gap-2">
                            {DISTANCES.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDistance(d)}
                                    className={`py-2 px-1 rounded-lg border text-sm transition-all ${distance === d ? 'border-[#219653] bg-[#219653] text-white font-bold shadow-md' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                                >
                                    {d}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleStartMatch}
                        className="bg-[#219653] text-white hover:bg-[#1e874b] shadow-lg h-14 text-lg font-bold"
                    >
                        START COMPETITION
                    </Button>
                </div>
            </div>
        );
    }

    // RENDER: TIMER
    if (step === 'timer') {
        return (
            <div className="h-[100dvh] w-full bg-[#121212] relative flex flex-col">
                <div className="absolute top-4 left-4 z-10">
                    <Button
                        variant="ghost"
                        onClick={() => setStep('setup')}
                        className="text-gray-500 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </div>

                <CompetitionTimer
                    durationSeconds={duration}
                    onComplete={handleTimerComplete}
                />
            </div>
        );
    }

    // RENDER: SCORING (Reuse TargetFace logic but strictly optimized for this flow)
    const currentShots = ends[currentEndIndex] || [];
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
                    onClick={() => {
                        if (confirm('Exit competition? Progress will be lost.')) router.push('/dashboard');
                    }}
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
                        <div className="text-sm font-bold text-[#219653] bg-[#219653]/10 px-2 py-0.5 rounded-full">
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
                <div className="text-center flex justify-center items-baseline gap-2 mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total:</span>
                    <span className="text-lg font-bold text-gray-900">{totalScore} <span className="text-xs text-gray-400 font-normal">/ {totalPossible}</span></span>
                </div>

                <ScoreControl
                    scores={currentShots.map(s => s.value)}
                    arrowsPerEnd={arrowsPerEnd}
                    onClearLast={handleClearLast}
                    onSubmit={handleSubmitEnd}
                />

                {/* Footer Controls */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Scoring Phase</span>
                    <Button
                        onClick={handleFinishSession}
                        size="sm"
                        disabled={isSaving || ends.flat().length === 0}
                        className="bg-red-600 text-white hover:bg-red-700 h-8 text-xs"
                    >
                        {isSaving ? 'Saving...' : 'End Competition'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
