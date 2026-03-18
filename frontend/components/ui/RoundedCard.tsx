import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface RoundedCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export default function RoundedCard({
  children,
  className,
  padding = 'md',
}: RoundedCardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-[20px]',
        paddingMap[padding],
        className
      )}
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
    >
      {children}
    </div>
  );
}
