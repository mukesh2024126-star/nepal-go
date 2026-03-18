import { MapPin, Building2 } from 'lucide-react';
import RoundedCard from '@/components/ui/RoundedCard';

interface Activity {
  time: string;
  name: string;
  durationHours: number;
  cost: number;
  difficulty: 'easy' | 'moderate' | 'hard';
}

interface Hotel {
  name: string;
  type: string;
  pricePerNight: number;
}

interface DayCardProps {
  dayNumber: number;
  date?: string;
  location: string;
  hotel: Hotel;
  activities: Activity[];
  dayTotalCost: number;
}

const hotelTypePill: Record<string, string> = {
  budget: 'bg-gray-100 text-gray-600',
  mid: 'bg-blue-100 text-blue-700',
  luxury: 'bg-yellow-100 text-yellow-700',
};

const difficultyDot: Record<string, string> = {
  easy: 'bg-green-500',
  moderate: 'bg-orange-500',
  hard: 'bg-red-500',
};

export default function DayCard({ dayNumber, date, location, hotel, activities, dayTotalCost }: DayCardProps) {
  return (
    <RoundedCard padding="none" className="overflow-hidden border-l-4 border-[#22C55E]">
      {/* Header */}
      <div className="bg-green-50 px-5 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
          {dayNumber}
        </div>
        <div>
          <p className="font-bold text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Day {dayNumber}</p>
          {date && <p className="text-xs text-[#6B7280]">{date}</p>}
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm text-[#6B7280]">
          <MapPin className="w-3 h-3" />
          {location}
        </div>
      </div>

      {/* Hotel row */}
      <div className="px-5 py-3 border-b flex items-center gap-3">
        <Building2 className="w-4 h-4 text-[#6B7280]" />
        <span className="text-xs text-[#6B7280]">Staying at:</span>
        <span className="font-medium text-sm text-[#111827]">{hotel.name}</span>
        <span className={`text-xs ml-1 px-2 py-0.5 rounded-full ${hotelTypePill[hotel.type] || 'bg-gray-100 text-gray-600'}`}>
          {hotel.type}
        </span>
        <span className="text-xs text-[#6B7280] ml-auto">NPR {hotel.pricePerNight.toLocaleString()}/night</span>
      </div>

      {/* Activities */}
      <div className="px-5 py-3 space-y-3">
        {activities.map((act) => (
          <div key={act.name} className="flex items-center gap-3">
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">{act.time}</span>
            <span className="text-sm font-medium text-[#111827] flex-1">{act.name}</span>
            <span className="text-xs text-[#6B7280]">{act.durationHours}hrs</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${difficultyDot[act.difficulty]}`} />
              <span className="text-xs text-[#6B7280]">
                {act.cost === 0 ? 'Free' : `NPR ${act.cost.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
        <span className="text-sm text-[#6B7280] font-medium">
          Day Total: NPR {dayTotalCost.toLocaleString()}
        </span>
      </div>
    </RoundedCard>
  );
}
