'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Target, CalendarDays, User } from 'lucide-react';
import { clsx } from 'clsx';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Home', href: '/dashboard', icon: Home },
        { label: 'Target', href: '/dashboard/target', icon: Target },
        { label: 'Attend', href: '/dashboard/attendance', icon: CalendarDays },
        { label: 'Profile', href: '/dashboard/profile', icon: User },
    ];

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            'flex flex-col items-center justify-center w-full h-full space-y-1',
                            isActive ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'
                        )}
                    >
                        <item.icon className={clsx('w-6 h-6', isActive ? 'stroke-[2.5px]' : 'stroke-2')} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
