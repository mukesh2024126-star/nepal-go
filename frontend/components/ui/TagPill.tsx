'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TagPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}

export default function TagPill({
  label,
  active = false,
  onClick,
  icon,
  size = 'md',
}: TagPillProps) {
  return (
    <span
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200 select-none',
        size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1',
        active
          ? 'bg-[#22C55E] text-white'
          : 'bg-[#F3F4F6] text-[#374151] hover:bg-gray-200',
        onClick && 'cursor-pointer'
      )}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
