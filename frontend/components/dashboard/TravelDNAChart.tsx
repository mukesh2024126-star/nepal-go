import RoundedCard from '@/components/ui/RoundedCard';

interface TravelDNAScores {
  adventure: number;
  cultural: number;
  nature: number;
  luxury: number;
}

interface TravelDNAChartProps {
  scores: TravelDNAScores;
}

const barColors: Record<keyof TravelDNAScores, string> = {
  adventure: 'bg-[#22C55E]',
  cultural: 'bg-blue-400',
  nature: 'bg-teal-400',
  luxury: 'bg-purple-400',
};

export default function TravelDNAChart({ scores }: TravelDNAChartProps) {
  return (
    <RoundedCard padding="md">
      <h3 className="font-bold text-base text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        Your Travel DNA
      </h3>
      <div className="space-y-3">
        {(Object.entries(scores) as [keyof TravelDNAScores, number][]).map(([key, score]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm text-[#6B7280] w-20 capitalize">{key}</span>
            <div className="flex-1 h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColors[key]}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs text-[#6B7280] w-8 text-right">{score}%</span>
          </div>
        ))}
      </div>
    </RoundedCard>
  );
}
