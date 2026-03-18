'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface PillButtonProps {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

export default function PillButton({
  variant = 'solid',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  className,
  type = 'button',
  fullWidth = false,
}: PillButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus:outline-none cursor-pointer';

  const variants = {
    solid: 'bg-[#22C55E] text-white hover:bg-[#16A34A] disabled:opacity-50',
    outline:
      'border border-[#22C55E] text-[#22C55E] hover:bg-green-50 disabled:opacity-50',
    ghost: 'text-[#6B7280] hover:text-[#111827] disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {loading && (
        <svg
          className="animate-spin w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
