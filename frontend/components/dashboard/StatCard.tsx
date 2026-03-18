import { LucideIcon, TrendingUp } from 'lucide-react';
import RoundedCard from '@/components/ui/RoundedCard';

interface StatCardProps {
  value: string | number;
  label: string;
  Icon: LucideIcon;
  trend?: string;
  iconBg?: string;
}

export default function StatCard({ value, label, Icon, trend, iconBg }: StatCardProps) {
  return (
    <RoundedCard padding="md">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconBg || '#F0FDF4' }}
      >
        <Icon className="w-5 h-5 text-[#22C55E]" />
      </div>
      <p className="font-black text-3xl text-[#111827] mt-3" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        {value}
      </p>
      <p className="text-sm text-[#6B7280] mt-0.5">{label}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs text-[#22C55E]">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      )}
    </RoundedCard>
  );
}
