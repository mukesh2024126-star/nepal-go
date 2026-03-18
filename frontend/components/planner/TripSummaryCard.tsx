import RoundedCard from '@/components/ui/RoundedCard';
import PillButton from '@/components/ui/PillButton';

interface TripSummaryCosts {
  hotels: number;
  activities: number;
  transport: number;
  meals: number;
}

interface TripSummaryCardProps {
  destination: string;
  durationDays: number;
  travelMonth: string;
  isPeakSeason: boolean;
  hotelType: string;
  costs: TripSummaryCosts;
  totalCost: number;
  clusterName?: string;
  clusterEmoji?: string;
}

export default function TripSummaryCard({
  destination, durationDays, travelMonth, isPeakSeason, hotelType, costs, totalCost, clusterName, clusterEmoji,
}: TripSummaryCardProps) {
  return (
    <RoundedCard padding="lg" className="shadow-lg">
      <h3 className="font-bold text-lg text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Trip Summary</h3>

      <div className="space-y-2 mb-4">
        {[
          { label: 'Destination', value: destination },
          { label: 'Duration', value: `${durationDays} Days` },
          { label: 'Hotel', value: hotelType },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-[#6B7280]">{label}</span>
            <span className="font-medium text-[#111827]">{value}</span>
          </div>
        ))}
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#6B7280]">Month</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#111827]">{travelMonth}</span>
            {isPeakSeason && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Peak Season</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t my-4" />

      <div className="space-y-2">
        {[
          { label: 'Hotels', amount: costs.hotels },
          { label: 'Activities', amount: costs.activities },
          { label: 'Transport', amount: costs.transport },
          { label: 'Meals (est.)', amount: costs.meals },
        ].map(({ label, amount }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-[#6B7280]">{label}</span>
            <span className="text-[#111827]">NPR {amount.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="border-t my-4" />

      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm font-medium text-[#6B7280]">Total Estimated Cost</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">AI predicted</p>
        </div>
        <div className="text-right">
          <p className="font-black text-2xl text-[#22C55E]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            NPR {totalCost.toLocaleString()}
          </p>
        </div>
      </div>

      <PillButton variant="solid" fullWidth className="mt-4">Save This Itinerary</PillButton>
      <PillButton variant="ghost" fullWidth className="mt-2">↺ Regenerate</PillButton>

      {clusterName && (
        <div className="mt-4 border-t pt-4">
          <p className="text-xs text-[#6B7280] mb-2">Your Travel Profile</p>
          <span className="bg-green-50 text-green-700 rounded-full px-3 py-1 text-sm font-medium inline-block">
            {clusterEmoji} {clusterName}
          </span>
        </div>
      )}
    </RoundedCard>
  );
}
