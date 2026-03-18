'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RoundedCard from '@/components/ui/RoundedCard';
import PillButton from '@/components/ui/PillButton';
import RatingStars from '@/components/ui/RatingStars';
import { destinationsAPI, aiAPI, reviewsAPI } from '@/lib/api';

const monthSeasons: Record<string, { color: string; label: string }> = {
  Jan: { color: 'bg-gray-100 text-gray-500', label: 'Jan' },
  Feb: { color: 'bg-gray-100 text-gray-500', label: 'Feb' },
  Mar: { color: 'bg-green-100 text-green-700', label: 'Mar' },
  Apr: { color: 'bg-green-100 text-green-700', label: 'Apr' },
  May: { color: 'bg-yellow-100 text-yellow-700', label: 'May' },
  Jun: { color: 'bg-yellow-100 text-yellow-700', label: 'Jun' },
  Jul: { color: 'bg-red-100 text-red-700', label: 'Jul' },
  Aug: { color: 'bg-red-100 text-red-700', label: 'Aug' },
  Sep: { color: 'bg-yellow-100 text-yellow-700', label: 'Sep' },
  Oct: { color: 'bg-green-100 text-green-700', label: 'Oct' },
  Nov: { color: 'bg-green-100 text-green-700', label: 'Nov' },
  Dec: { color: 'bg-gray-100 text-gray-500', label: 'Dec' },
};

const fallbackActivities = [
  { emoji: '🥾', name: 'Summit Trek', duration: '6hrs', cost: 5000, difficulty: 'hard' },
  { emoji: '📸', name: 'Photography Tour', duration: '3hrs', cost: 1500, difficulty: 'easy' },
  { emoji: '🏛️', name: 'Monastery Visit', duration: '2hrs', cost: 500, difficulty: 'easy' },
  { emoji: '🧗', name: 'Acclimatization Hike', duration: '4hrs', cost: 0, difficulty: 'moderate' },
  { emoji: '🚁', name: 'Helicopter Tour', duration: '1hr', cost: 25000, difficulty: 'easy' },
  { emoji: '🧘', name: 'Yoga & Meditation', duration: '1.5hrs', cost: 800, difficulty: 'easy' },
];

const fallbackHotels = [
  { name: 'Mountain View Lodge', type: 'mid', pricePerNight: 3500, rating: 4.6, gradient: 'from-teal-600 to-emerald-700' },
  { name: 'Base Camp Luxury Resort', type: 'luxury', pricePerNight: 8000, rating: 4.8, gradient: 'from-amber-600 to-yellow-500' },
  { name: 'Sherpa Budget House', type: 'budget', pricePerNight: 1200, rating: 4.3, gradient: 'from-slate-600 to-gray-500' },
];

const fallbackReviews = [
  { initials: 'RK', name: 'Raju Kumar', date: 'October 2024', rating: 5, comment: 'An absolutely incredible journey to the roof of the world. Every moment was unforgettable.' },
  { initials: 'PS', name: 'Priya Sharma', date: 'September 2024', rating: 5, comment: 'Life-changing experience. The views, the culture, the people — all beyond words.' },
  { initials: 'MT', name: 'Michael Torres', date: 'November 2024', rating: 4, comment: 'Challenging but worth every step. Guides were professional and supportive throughout.' },
];

const fallbackDestination = {
  id: '',
  name: 'Everest Base Camp Trek',
  slug: 'everest-base-camp',
  region: 'Khumbu',
  difficulty: 'Hard',
  rating: 4.9,
  reviewCount: 487,
  pricePerDay: 8500,
  description: 'Everest Base Camp Trek is one of the most iconic trekking routes in the world. The journey takes you through the heart of the Khumbu region, passing ancient monasteries, Sherpa villages, and dramatic Himalayan landscapes.',
  descriptionExtra: [
    'You will trek through rhododendron forests, cross high suspension bridges, and acclimatize at Namche Bazaar before reaching the legendary Base Camp at 5,364 meters above sea level.',
    'The trek rewards adventurers with world-class mountain views including Everest, Lhotse, Nuptse, and Ama Dablam, making it a bucket-list experience for trekkers worldwide.',
  ],
  highlights: [
    'Best trekking destination in the world',
    'Stunning Himalayan panoramas',
    'Rich Sherpa culture and heritage',
    'Diverse flora and fauna',
    'Experienced local guides',
    'Accessible via Lukla flight',
  ],
};

const hotelTypeBadge: Record<string, string> = {
  budget: 'bg-gray-100 text-gray-600',
  mid: 'bg-blue-100 text-blue-700',
  luxury: 'bg-yellow-100 text-yellow-700',
};

const avatarColors = ['bg-green-400', 'bg-blue-400', 'bg-purple-400'];

const tabs = ['Overview', 'Activities', 'Hotels', 'Reviews'];

interface DestinationData {
  id: string;
  name: string;
  slug: string;
  region: string;
  difficulty: string;
  rating: number;
  reviewCount: number;
  pricePerDay: number;
  description: string;
  descriptionExtra?: string[];
  highlights?: string[];
  image_url?: string;
}

interface BudgetPrediction {
  estimated_cost: number;
  breakdown?: { hotels?: number; activities?: number; transport?: number; meals?: number };
}

export default function DestinationDetailPage() {
  const params = useParams();
  const slug = params?.id as string;

  const [activeTab, setActiveTab] = useState('Overview');
  const [days, setDays] = useState(5);
  const [hotelType, setHotelType] = useState('Mid-range');
  const [selectedMonth, setSelectedMonth] = useState('Oct');

  const [destination, setDestination] = useState<DestinationData>(fallbackDestination);
  const [activities, setActivities] = useState(fallbackActivities);
  const [hotels, setHotels] = useState(fallbackHotels);
  const [reviews, setReviews] = useState(fallbackReviews);
  const [highlights, setHighlights] = useState(fallbackDestination.highlights);

  const [loading, setLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetResult, setBudgetResult] = useState<BudgetPrediction | null>(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const data = await destinationsAPI.getBySlug(slug);
        if (data) {
          setDestination({
            id: data.id || '',
            name: data.name || fallbackDestination.name,
            slug: data.slug || slug,
            region: data.region || fallbackDestination.region,
            difficulty: data.difficulty || fallbackDestination.difficulty,
            rating: data.rating ?? fallbackDestination.rating,
            reviewCount: data.review_count ?? data.reviewCount ?? fallbackDestination.reviewCount,
            pricePerDay: data.base_price_per_day ?? data.pricePerDay ?? fallbackDestination.pricePerDay,
            description: data.description || fallbackDestination.description,
            descriptionExtra: data.descriptionExtra || fallbackDestination.descriptionExtra,
            highlights: data.highlights || fallbackDestination.highlights,
            image_url: data.image_url || '',
          });
          if (data.activities?.length) setActivities(data.activities);
          if (data.hotels?.length) setHotels(data.hotels);
          if (data.highlights?.length) setHighlights(data.highlights);

          // Fetch reviews separately
          if (data.id) {
            try {
              const reviewData = await reviewsAPI.getByDestination(data.id);
              const list = reviewData?.reviews || [];
              if (Array.isArray(list) && list.length > 0) {
                setReviews(list.map((r: { user_full_name?: string; created_at?: string; rating: number; comment?: string; user_initials?: string }) => ({
                  initials: r.user_initials || (r.user_full_name || 'U').slice(0, 2).toUpperCase(),
                  name: r.user_full_name || 'Traveler',
                  date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recent',
                  rating: r.rating,
                  comment: r.comment || '',
                })));
              }
            } catch {
              // keep fallback reviews
            }
          }
        }
      } catch {
        // keep fallback data
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handlePredictBudget = async () => {
    setBudgetLoading(true);
    try {
      const hotelTypeMap: Record<string, string> = { 'Budget': 'budget', 'Mid-range': 'mid', 'Luxury': 'luxury' };
      const data = await aiAPI.predictBudget({
        destination_id: destination.id,
        num_days: days,
        hotel_type: hotelTypeMap[hotelType] || 'mid',
        travel_month: selectedMonth,
        interests: [],
      });
      setBudgetResult(data);
    } catch {
      // Fallback estimate
      const baseRate = destination.pricePerDay || 8500;
      setBudgetResult({ estimated_cost: baseRate * days });
    } finally {
      setBudgetLoading(false);
    }
  };

  const scrollTo = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const estimatedCost = budgetResult?.estimated_cost ?? (destination.pricePerDay * days);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-[420px] bg-gray-200 rounded-[20px]" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden h-[420px]">
        {destination.image_url ? (
          <Image src={destination.image_url} alt={destination.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-800" />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute bottom-6 left-6 z-10">
          <h1 className="font-black text-4xl text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {destination.name}
          </h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="bg-white/20 backdrop-blur text-white text-xs px-3 py-1 rounded-full">{destination.region} Region</span>
            <span className="bg-red-500/80 text-white text-xs px-3 py-1 rounded-full">{destination.difficulty}</span>
            <span className="text-white/90 text-sm">⭐ {destination.rating} ({destination.reviewCount} reviews)</span>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10">
          <RoundedCard padding="sm" className="shadow-xl w-52">
            <p className="text-xs text-[#6B7280]">From</p>
            <p className="font-black text-lg text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              NPR {destination.pricePerDay.toLocaleString()}/day
            </p>
            <Link href={`/plan?destination=${destination.slug}`}>
              <PillButton variant="solid" size="sm" fullWidth className="mt-2">Plan This Trip</PillButton>
            </Link>
          </RoundedCard>
        </div>
      </section>

      {/* STICKY TAB BAR */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-6 flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); scrollTo(tab.toLowerCase()); }}
              className={`px-6 py-4 text-sm font-medium cursor-pointer border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#22C55E] text-[#22C55E]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        {/* Left */}
        <div className="flex-1 space-y-10">
          {/* Overview */}
          <div id="overview">
            <RoundedCard padding="lg">
              <h2 className="font-bold text-xl text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>About</h2>
              <p className="text-[#6B7280] text-sm leading-relaxed mt-3">{destination.description}</p>
              {destination.descriptionExtra?.map((p, i) => (
                <p key={i} className="text-[#6B7280] text-sm leading-relaxed mt-3">{p}</p>
              ))}

              <h3 className="font-bold text-lg mt-6 mb-3 text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Trip Highlights</h3>
              <div className="grid grid-cols-2 gap-2">
                {highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#6B7280]">{h}</span>
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-lg mt-6 mb-3 text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Best Time to Visit</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(monthSeasons).map(([month, { color }]) => (
                  <span key={month} className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>{month}</span>
                ))}
              </div>
            </RoundedCard>
          </div>

          {/* Activities */}
          <div id="activities">
            <h2 className="font-bold text-xl text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Available Activities</h2>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                {activities.map((act) => (
                  <RoundedCard key={act.name} padding="sm" className="w-44 flex-shrink-0 text-center">
                    <div className="text-3xl">{act.emoji}</div>
                    <p className="font-medium text-sm mt-2 text-[#111827]">{act.name}</p>
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full mt-1 inline-block">{act.duration}</span>
                    <p className="text-[#22C55E] font-bold text-sm mt-1">
                      {act.cost === 0 ? 'Free' : `NPR ${act.cost.toLocaleString()}`}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${act.difficulty === 'easy' ? 'bg-green-100 text-green-700' : act.difficulty === 'moderate' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {act.difficulty}
                    </span>
                  </RoundedCard>
                ))}
              </div>
            </div>
          </div>

          {/* Hotels */}
          <div id="hotels">
            <h2 className="font-bold text-xl text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Where to Stay</h2>
            <div className="grid grid-cols-3 gap-4">
              {hotels.map((hotel) => (
                <RoundedCard key={hotel.name} padding="none" className="overflow-hidden">
                  <div className={`h-36 bg-gradient-to-br ${hotel.gradient || 'from-teal-600 to-emerald-700'} relative`}>
                    <span className={`absolute top-2 left-2 text-xs rounded-full px-2 py-0.5 font-medium ${hotelTypeBadge[hotel.type] || 'bg-gray-100 text-gray-600'}`}>
                      {hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1)}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-[#111827]">{hotel.name}</p>
                    <p className="text-[#22C55E] font-bold text-sm">NPR {hotel.pricePerNight.toLocaleString()}/night</p>
                    <div className="mt-1"><RatingStars rating={hotel.rating} size="sm" /></div>
                  </div>
                </RoundedCard>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div id="reviews">
            <h2 className="font-bold text-xl text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Traveler Reviews</h2>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-black text-5xl text-[#22C55E]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{destination.rating}</span>
              <RatingStars rating={destination.rating} />
              <span className="text-[#6B7280]">({destination.reviewCount} reviews)</span>
            </div>
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <RoundedCard key={r.name} padding="md">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center font-bold text-sm`}>
                        {r.initials}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[#111827]">{r.name}</p>
                        <p className="text-xs text-[#6B7280]">{r.date}</p>
                      </div>
                    </div>
                    <RatingStars rating={r.rating} size="sm" />
                  </div>
                  <p className="text-sm text-[#6B7280] mt-2">{r.comment}</p>
                </RoundedCard>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0">
          <RoundedCard padding="lg" className="sticky top-24 space-y-4">
            <h3 className="font-bold text-lg text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Plan Your Trip</h3>

            {/* Days stepper */}
            <div>
              <p className="text-sm text-[#6B7280]">Number of Days</p>
              <div className="flex items-center gap-3 mt-1">
                <button onClick={() => setDays(Math.max(1, days - 1))} className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center hover:bg-gray-50 cursor-pointer">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-lg text-[#111827] w-8 text-center">{days}</span>
                <button onClick={() => setDays(days + 1)} className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center hover:bg-gray-50 cursor-pointer">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Hotel type */}
            <div>
              <p className="text-sm text-[#6B7280] mb-1">Hotel Type</p>
              <div className="flex gap-2">
                {['Budget', 'Mid-range', 'Luxury'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setHotelType(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                      hotelType === t
                        ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel month */}
            <div>
              <p className="text-sm text-[#6B7280] mb-1">Travel Month</p>
              <div className="flex flex-wrap gap-1">
                {Object.keys(monthSeasons).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      selectedMonth === m ? 'bg-[#22C55E] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <PillButton variant="solid" size="lg" fullWidth onClick={handlePredictBudget} disabled={budgetLoading}>
              {budgetLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Predicting...
                </span>
              ) : 'Predict My Budget'}
            </PillButton>

            {/* Result */}
            <div className="bg-green-50 rounded-[16px] p-4">
              <p className="text-xs text-[#6B7280]">Estimated Cost</p>
              <p className="font-black text-2xl text-[#22C55E]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                NPR {estimatedCost.toLocaleString()}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">{days} days · {hotelType} hotel · 3 activities</p>
            </div>
          </RoundedCard>
        </div>
      </div>

      <Footer />
    </div>
  );
}
