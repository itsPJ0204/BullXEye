import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'default', fullWidth, ...props }, ref) => {
        const variants = {
            primary: 'bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-[0.98]',
            secondary: 'bg-[var(--color-accent)] text-[var(--color-dark)] hover:opacity-90 active:scale-[0.98]',
            outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10',
            ghost: 'hover:bg-black/5 text-[var(--color-dark)]',
        };

        const sizes = {
            default: 'h-12 px-6',
            sm: 'h-9 px-3',
            lg: 'h-14 px-8 text-lg',
            icon: 'h-10 w-10',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
                    sizes[size],
                    variants[variant],
                    fullWidth ? 'w-full' : '',
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
