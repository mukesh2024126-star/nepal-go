'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DayCard from '@/components/planner/DayCard';
import TripSummaryCard from '@/components/planner/TripSummaryCard';
import PillButton from '@/components/ui/PillButton';
import { aiAPI, destinationsAPI } from '@/lib/api';

function PlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const destinationSlug = searchParams.get('destination') || '';
  const daysParam = Number(searchParams.get('days')) || 5;
  const budgetTier = searchParams.get('budget_tier') || searchParams.get('budget') || '';
  const hotelTypeParam = searchParams.get('hotel_type') || 'mid';
  const interestsParam = searchParams.get('interests') || '';
  const travelMonthParam = searchParams.get('travel_month') || '';

  const [itinerary, setItinerary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinationName, setDestinationName] = useState(destinationSlug || '');
  const [totalCost, setTotalCost] = useState(0);
  const [costs, setCosts] = useState({ hotels: 0, activities: 0, transport: 0, meals: 0 });
  const [travelMonth, setTravelMonth] = useState(travelMonthParam || 'October');
  const [generatedData, setGeneratedData] = useState<Record<string, any> | null>(null);

  const loadItinerary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let destinationId = '';
      if (destinationSlug) {
        const destData = await destinationsAPI.getBySlug(destinationSlug);
        destinationId = destData?.id || '';
        if (destData?.name) setDestinationName(destData.name);
      }

      const payload: Record<string, unknown> = {
        num_days: daysParam,
        hotel_type: hotelTypeParam,
        interests: interestsParam ? interestsParam.split(',') : [],
      };
      if (destinationId) payload.destination_id = destinationId;
      if (budgetTier) payload.budget_tier = budgetTier;
      if (travelMonthParam) payload.travel_month = travelMonthParam;

      const data = await aiAPI.generateItinerary(payload);
      setGeneratedData(data);

      const days = data?.schedule?.days || data?.schedule || data?.itinerary || data?.days;
      if (!Array.isArray(days) || days.length === 0) {
        throw new Error('No itinerary days returned');
      }

      setItinerary(days);
      setTotalCost(data?.predicted_budget || data?.total_cost || 0);
      setCosts(data?.budget_breakdown || { hotels: 0, activities: 0, transport: 0, meals: 0 });
      if (data?.travel_month) setTravelMonth(data.travel_month);
      if (data?.destination_name) setDestinationName(data.destination_name);
    } catch {
      setError('Itinerary generation is temporarily unavailable. Please try again in a few minutes.');
      setItinerary([]);
    } finally {
      setLoading(false);
    }
  }, [destinationSlug, daysParam, budgetTier, hotelTypeParam, interestsParam, travelMonthParam]);

  useEffect(() => {
    loadItinerary();
  }, [loadItinerary]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await aiAPI.saveItinerary(generatedData || {
        destination_name: destinationName,
        num_days: itinerary.length,
        schedule: { days: itinerary },
        predicted_budget: computedTotal,
      });
      setSaved(true);
      setError(null);
    } catch {
      setError('Failed to save itinerary. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const computedTotal = itinerary.reduce((sum, d) => sum + (d.dayTotalCost || d.day_total_cost || d.cost || 0), 0) || totalCost;

  return (
    <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <p className="text-sm text-[#6B7280]"><Link href="/" className="hover:text-[#111827]">Home</Link> / {destinationName || 'Destination'} / Itinerary</p>
        <div className="flex justify-between items-start mt-2">
          <div>
            <h1 className="font-black text-3xl text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Your {itinerary.length || daysParam}-Day {destinationName || 'Nepal'} Itinerary
            </h1>
            <p className="text-[#6B7280] mt-1">AI-generated and optimized for your preferences</p>
          </div>
          <div className="flex gap-3 mt-1">
            <PillButton variant="outline" onClick={() => router.push('/plan')}>Edit Preferences</PillButton>
            <PillButton variant="solid" onClick={handleSave} disabled={saving || saved || itinerary.length === 0}>{saved ? '✅ Saved!' : saving ? 'Saving...' : 'Save Itinerary'}</PillButton>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12 flex gap-8">
        <div className="flex-1 relative">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full border-4 border-[#E5E7EB] border-t-[#22C55E] animate-spin mx-auto" />
              <p className="font-bold text-lg text-[#111827] mt-6" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Generating your itinerary…</p>
              <p className="text-sm text-[#6B7280] mt-2">Optimizing for your preferences</p>
            </div>
          ) : error ? (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-[16px] p-4">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-3"><PillButton variant="outline" size="sm" onClick={loadItinerary}>Retry</PillButton></div>
            </div>
          ) : (
            <>
              <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#22C55E] opacity-30 z-0" />
              <div className="space-y-6 relative z-10">{itinerary.map((day: any, idx: number) => <DayCard key={day.dayNumber || day.day_number || idx} {...day} />)}</div>
            </>
          )}
        </div>

        <div className="w-80 flex-shrink-0">
          <div className="sticky top-24">
            <TripSummaryCard
              destination={destinationName || 'Nepal'}
              durationDays={itinerary.length || daysParam}
              travelMonth={travelMonth}
              isPeakSeason={['Oct', 'Nov', 'Mar', 'Apr', 'October', 'November', 'March', 'April'].some(m => travelMonth.includes(m))}
              hotelType="Mid-range"
              costs={costs}
              totalCost={computedTotal}
              clusterName="Adventure Backpacker"
              clusterEmoji="🏔️"
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0EBF8]" />}>
      <PlanContent />
    </Suspense>
  );
}
