import { Button } from '@/components/ui/Button';
import { RotateCw, Check, ArrowRight } from 'lucide-react';

interface Shot {
    value: string | number;
    arrowNumber?: number;
}

interface ScoreControlProps {
    shots: Shot[];
    arrowsPerEnd: number;
    onClearLast: () => void;
    onSubmit: () => void;
}

export default function ScoreControl({ shots, arrowsPerEnd, onClearLast, onSubmit }: ScoreControlProps) {
    // Fill empty slots
    const slots = Array(arrowsPerEnd).fill(null).map((_, i) => shots[i] || null);

    // Calculate total
    const endTotal = shots.reduce((acc: number, shot) => {
        const val = shot.value;
        if (val === 'X' || val === 'M') {
            return acc + (val === 'X' ? 10 : 0);
        }
        return acc + (Number(val) || 0);
    }, 0);

    const isEndComplete = shots.length === arrowsPerEnd;

    const getScoreColor = (val: string | number) => {
        if (val === 'X' || val === 10 || val === 9) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (val === 8 || val === 7) return 'bg-red-100 text-red-800 border-red-200';
        if (val === 6 || val === 5) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (val === 4 || val === 3) return 'bg-gray-800 text-white border-black';
        if (val === 2 || val === 1) return 'bg-white text-gray-800 border-gray-200';
        if (val === 'M') return 'bg-gray-100 text-gray-400 border-gray-200';
        return 'bg-gray-50 text-gray-400 border-gray-100'; // Empty
    };

    return (
        <div className="space-y-3">
            {/* Score Slots */}
            <div className="flex justify-center gap-2">
                {slots.map((shot, i) => (
                    <div key={i} className="flex flex-col items-center space-y-1">
                        <div
                            className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-bold font-mono transition-all relative ${getScoreColor(shot?.value ?? '-')}`}
                        >
                            {shot ? shot.value : '-'}
                        </div>
                        {shot?.arrowNumber && (
                            <div className="text-[10px] font-mono bg-gray-200 text-gray-600 px-1.5 rounded-sm">
                                #{shot.arrowNumber}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="text-center flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">End Total</span>
                <span className="text-2xl font-bold text-[var(--color-dark)]">{endTotal}</span>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearLast}
                    disabled={shots.length === 0}
                    className="text-gray-500 hover:text-red-500 h-9"
                >
                    <RotateCw className="w-3 h-3 mr-2" />
                    Clear Last
                </Button>

                <Button
                    onClick={onSubmit}
                    size="sm"
                    disabled={!isEndComplete}
                    className={`${isEndComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'} h-9`}
                >
                    {isEndComplete ? (
                        <>
                            Submit
                            <Check className="w-3 h-3 ml-2" />
                        </>
                    ) : (
                        `Shot ${shots.length + 1} / ${arrowsPerEnd}`
                    )}
                </Button>
            </div>
        </div>
    );
}
