'use client';

import React, { useState, useRef } from 'react';

// World Archery Colors
const COLORS = {
    10: '#FFD700', // Gold
    9: '#FFD700',
    8: '#FF0000', // Red
    7: '#FF0000',
    6: '#0066CC', // Blue
    5: '#0066CC',
    4: '#000000', // Black
    3: '#000000',
    2: '#FFFFFF', // White
    1: '#FFFFFF',
    M: '#F0F0F0', // Miss (Background)
};

const RINGS = [
    { score: 1, radius: 50, color: COLORS[1], stroke: '#DDD' },
    { score: 2, radius: 45, color: COLORS[2], stroke: '#DDD' },
    { score: 3, radius: 40, color: COLORS[3], stroke: '#FFF' },
    { score: 4, radius: 35, color: COLORS[4], stroke: '#FFF' },
    { score: 5, radius: 30, color: COLORS[5], stroke: '#FFF' },
    { score: 6, radius: 25, color: COLORS[6], stroke: '#000' },
    { score: 7, radius: 20, color: COLORS[7], stroke: '#000' },
    { score: 8, radius: 15, color: COLORS[8], stroke: '#000' },
    { score: 9, radius: 10, color: COLORS[9], stroke: '#000' },
    { score: 10, radius: 5, color: COLORS[10], stroke: '#000' },
];

interface Shot {
    x: number;
    y: number;
    value: number | string;
    arrowNumber?: number;
}

interface TargetFaceProps {
    shots: Shot[];
    onShot: (shot: Shot) => void;
    readOnly?: boolean;
}

const LOUPE_SIZE = 120;
const OFFSET = 80;

export default function TargetFace({ shots, onShot, readOnly = false }: TargetFaceProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [magnifier, setMagnifier] = useState<{ x: number, y: number } | null>(null);
    const [pendingShot, setPendingShot] = useState<Shot | null>(null);

    // Convert screen coordinates to SVG coordinates (0-100)
    const getPoint = (clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 50, y: 50 };
        const CTM = svgRef.current.getScreenCTM();
        if (!CTM) return { x: 50, y: 50 };
        return {
            x: (clientX - CTM.e) / CTM.a,
            y: (clientY - CTM.f) / CTM.d
        };
    };

    const calculateScore = (x: number, y: number) => {
        const cx = 50, cy = 50;
        const ARROW_RADIUS = 0.8; // Tolerance
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const effectiveDist = Math.max(0, dist - ARROW_RADIUS);
        const w = 5; // Ring width

        let score = Math.max(0, 11 - Math.ceil(effectiveDist / w));
        if (score > 10) score = 10;

        let value: number | string = score;
        if (score === 10 && effectiveDist < 2.5) value = 'X';
        if (dist > 50 + ARROW_RADIUS) return { score: 0, value: 'M' };

        return { score, value };
    };

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (readOnly) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setMagnifier({ x: clientX, y: clientY });
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (readOnly) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setMagnifier({ x: clientX, y: clientY });
    };

    const handleTouchEnd = () => {
        if (readOnly || !magnifier) return;

        const point = getPoint(magnifier.x, magnifier.y);
        const { value } = calculateScore(point.x, point.y);

        // Open Modal properly instead of setting state and clearing magnifier immediately causing potential race/flicker
        setPendingShot({ x: point.x, y: point.y, value });
        setMagnifier(null);
    };

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (readOnly) return;
        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const { value } = calculateScore(x, y);
        setPendingShot({ x, y, value });
    };

    const handleArrowSelect = (arrowNumber: number) => {
        if (pendingShot) {
            onShot({ ...pendingShot, arrowNumber });
            setPendingShot(null);
        }
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center touch-none">
            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                className="w-full h-full shadow-xl rounded-full cursor-crosshair"
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={(e) => e.buttons === 1 && handleTouchMove(e)}
                onMouseUp={handleTouchEnd}
            >
                {RINGS.map((ring) => (
                    <circle key={ring.score} cx="50" cy="50" r={ring.radius} fill={ring.color} stroke={ring.stroke} strokeWidth="0.5" />
                ))}

                {/* Center X */}
                <line x1="49" y1="50" x2="51" y2="50" stroke="black" strokeWidth="0.1" opacity="0.5" />
                <line x1="50" y1="49" x2="50" y2="51" stroke="black" strokeWidth="0.1" opacity="0.5" />

                {shots.map((shot, i) => (
                    <circle key={i} cx={shot.x} cy={shot.y} r="1.5" fill="#00FF00" stroke="black" strokeWidth="0.5" />
                ))}
            </svg>

            {/* Magnifier */}
            {magnifier && (() => {
                const point = getPoint(magnifier.x, magnifier.y);
                const zoom = 4;
                const size = 100 / zoom;
                const vx = point.x - size / 2;
                const vy = point.y - size / 2;

                return (
                    <div
                        className="fixed rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white pointer-events-none z-50"
                        style={{
                            width: LOUPE_SIZE,
                            height: LOUPE_SIZE,
                            left: magnifier.x - LOUPE_SIZE / 2,
                            top: magnifier.y - LOUPE_SIZE / 2 - OFFSET,
                        }}
                    >
                        <svg viewBox={`${vx} ${vy} ${size} ${size}`} className="w-full h-full">
                            {RINGS.map((ring) => (
                                <circle key={ring.score} cx="50" cy="50" r={ring.radius} fill={ring.color} stroke={ring.stroke} strokeWidth="0.5" />
                            ))}
                            <line x1="49" y1="50" x2="51" y2="50" stroke="black" strokeWidth="0.1" opacity="0.5" />
                            <line x1="50" y1="49" x2="50" y2="51" stroke="black" strokeWidth="0.1" opacity="0.5" />

                            {shots.map((shot, i) => (
                                <circle key={i} cx={shot.x} cy={shot.y} r="1.5" fill="#00FF00" stroke="black" strokeWidth="0.5" />
                            ))}
                            <circle cx={point.x} cy={point.y} r={0.2 * (100 / size)} fill="none" stroke="red" strokeWidth="0.5" />
                        </svg>
                    </div>
                );
            })()}

            {/* Arrow Selection Modal */}
            {pendingShot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Select Arrow Number</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleArrowSelect(num);
                                    }}
                                    className="aspect-square flex items-center justify-center bg-gray-50 hover:bg-[var(--color-primary)] hover:text-white 
                                               text-gray-900 font-bold text-xl rounded-xl transition-all shadow-sm border border-gray-100
                                               active:scale-95"
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPendingShot(null);
                            }}
                            className="mt-6 w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
