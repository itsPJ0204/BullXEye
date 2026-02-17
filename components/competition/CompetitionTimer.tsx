'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface CompetitionTimerProps {
    durationSeconds: number; // 90 or 180
    onComplete: () => void;
}

type TimerState = 'idle' | 'get_ready' | 'shooting' | 'finished';

export default function CompetitionTimer({ durationSeconds, onComplete }: CompetitionTimerProps) {
    const [state, setState] = useState<TimerState>('idle');
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [isMuted, setIsMuted] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // Audio Generator (Whistle Simulation)
    const playWhistle = (count: number) => {
        if (isMuted) return;

        // Initialize AudioContext on first user interaction if possible, 
        // but here we might need to assume it's created on "Start" click.
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        const now = ctx.currentTime;

        for (let i = 0; i < count; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine'; // Whistle-ish
            osc.frequency.setValueAtTime(2800, now + i * 0.8); // High pitch
            osc.frequency.linearRampToValueAtTime(2200, now + i * 0.8 + 0.1); // Drop pitch slightly

            gain.gain.setValueAtTime(0, now + i * 0.8);
            gain.gain.linearRampToValueAtTime(1.0, now + i * 0.8 + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.8 + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.8);
            osc.stop(now + i * 0.8 + 0.5);
        }
    };

    const handleStart = () => {
        // Initialize Audio Context explicitly on user gesture
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // 1 Whistle -> Get Ready
        playWhistle(2); // Actually standard is 2 whistles to go to line? 
        // User request: 
        // Phase 1: "Get Ready" -> 1 Whistle. 10s count.
        // Phase 2: "Shooting" -> 2 Whistles.

        playWhistle(1);
        setState('get_ready');
        setTimeLeft(10);

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Transition to Shooting
                    // We need to clear this interval and start the next phase differently 
                    // OR handle phase transition inside the tick.
                    // Doing inside tick is safer for continuity.
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Effect to monitor state transitions based on time
    useEffect(() => {
        if (state === 'get_ready' && timeLeft === 0) {
            // Transition to Shooting
            setState('shooting');
            setTimeLeft(durationSeconds);
            playWhistle(2); // User req: 2 whistles for shooting
        } else if (state === 'shooting') {
            if (timeLeft === 30) {
                // Warning
                playWhistle(1); // User req: 1 whistle warning
            }
            if (timeLeft === 0) {
                // Finished
                if (intervalRef.current) clearInterval(intervalRef.current);
                setState('finished');
                playWhistle(3); // User req: 3 whistles end
            }
        }
    }, [timeLeft, state, durationSeconds]);


    const handleStop = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState('idle');
        setTimeLeft(durationSeconds);
    };


    // Formatting
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Colors
    const getTextColor = () => {
        if (state === 'idle') return 'text-[#F8F9FA]';
        if (state === 'get_ready') return 'text-orange-500';
        if (state === 'shooting') {
            if (timeLeft <= 30) return 'text-[#F2C94C]'; // Warning Color
            return 'text-[#219653]'; // Shooting green or just white? User said Off-White, changing to gold at 30.
            // Let's stick to user request: Off-White mainly, Gold at 30s.
        }
        if (state === 'finished') return 'text-red-600';
        return 'text-[#F8F9FA]';
    };

    // Main text content
    const getPhaseText = () => {
        if (state === 'idle') return 'READY?';
        if (state === 'get_ready') return 'STEP TO THE LINE';
        if (state === 'shooting') return 'SHOOT';
        if (state === 'finished') return 'ARROWS DOWN';
        return '';
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#121212] p-6 text-center">

            {/* Status Text (Top) */}
            <div className={`text-2xl font-bold tracking-widest uppercase mb-8 transition-colors duration-300 ${state === 'finished' ? 'text-red-500' : 'text-gray-400'}`}>
                {getPhaseText()}
            </div>

            {/* Main Timer Display */}
            <div className={`text-[120px] leading-none font-mono font-bold tabular-nums mb-12 transition-colors duration-300 ${state === 'shooting' && timeLeft <= 30 ? 'text-[#F2C94C]' :
                state === 'finished' ? 'text-red-600' : 'text-[#F8F9FA]'
                }`}>
                {formatTime(timeLeft)}
            </div>

            {/* Controls */}
            <div className="w-full max-w-xs space-y-4">
                {state === 'idle' || state === 'finished' ? (
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleStart}
                        className="bg-[#219653] hover:bg-[#1e874b] text-white h-16 text-xl font-bold tracking-wider rounded-2xl shadow-[0_0_20px_rgba(33,150,83,0.3)]"
                    >
                        <Play className="w-6 h-6 mr-2 fill-current" />
                        START MATCH
                    </Button>
                ) : (
                    <div className="space-y-4 w-full">
                        {state === 'shooting' && (
                            <Button
                                fullWidth
                                size="lg"
                                onClick={() => {
                                    if (intervalRef.current) clearInterval(intervalRef.current);
                                    setState('finished');
                                    // playWhistle(3); // Maybe simulate end? Usually 3 whistles end session.
                                    // User wants to finish early to proceed to scoring.
                                    // Let's assume standard "Time's Up" procedure applies.
                                    playWhistle(3);
                                    setTimeLeft(0);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-16 text-xl font-bold tracking-wider rounded-2xl"
                            >
                                FINISH END
                            </Button>
                        )}

                        <Button
                            fullWidth
                            size="lg"
                            variant="secondary"
                            onClick={handleStop}
                            className="bg-red-600 text-white hover:bg-red-700 h-16 text-xl font-bold tracking-wider rounded-2xl"
                        >
                            STOP / RESET
                        </Button>
                    </div>
                )}

                {state === 'finished' && (
                    <Button
                        fullWidth
                        variant="secondary"
                        onClick={onComplete}
                        className="bg-gray-800 text-white hover:bg-gray-700 h-14"
                    >
                        Proceed to Scoring
                    </Button>
                )}
            </div>

            {/* Audio Toggle */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
        </div>
    );
}
