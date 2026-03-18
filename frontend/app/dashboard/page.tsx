'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Plus, Map, Heart, Star, Settings, LogOut,
  CheckCircle2, ChevronDown, Building2, Calendar, Wallet, MapPin,
  Trash2, Eye, HeartOff,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PillButton from '@/components/ui/PillButton';
import CountUpNumber from '@/components/CountUpNumber';
import ItineraryModal, { type TripData } from '@/components/ItineraryModal';
import { useToast } from '@/components/ToastProvider';
import { userAPI, aiAPI, savedAPI, clusterAPI, authAPI, destinationsAPI } from '@/lib/api';

// ─── Static Data ─────────────────────────────────────────────────────────────

const DESTINATIONS = [
  { id: 'everest',    name: 'Everest Base Camp', region: 'Khumbu',  gradient: 'from-slate-700 via-teal-800 to-emerald-700' },
  { id: 'pokhara',   name: 'Pokhara',            region: 'Gandaki', gradient: 'from-blue-700 via-cyan-600 to-teal-500' },
  { id: 'chitwan',   name: 'Chitwan',             region: 'Bagmati', gradient: 'from-emerald-800 via-green-700 to-lime-600' },
  { id: 'annapurna', name: 'Annapurna',           region: 'Gandaki', gradient: 'from-orange-700 via-red-700 to-rose-800' },
  { id: 'mustang',   name: 'Upper Mustang',       region: 'Gandaki', gradient: 'from-amber-700 via-orange-700 to-yellow-600' },
  { id: 'kathmandu', name: 'Kathmandu',           region: 'Bagmati', gradient: 'from-purple-700 via-violet-700 to-indigo-600' },
];

const INTERESTS = [
  { id: 'trekking',    emoji: '🥾', label: 'Trekking' },
  { id: 'cultural',    emoji: '🏛️', label: 'Cultural Sites' },
  { id: 'wildlife',    emoji: '🦏', label: 'Wildlife & Safari' },
  { id: 'adventure',   emoji: '🪂', label: 'Adventure Sports' },
  { id: 'spiritual',   emoji: '🛕', label: 'Spiritual & Temples' },
  { id: 'photography', emoji: '📸', label: 'Photography' },
  { id: 'nature',      emoji: '🌿', label: 'Nature & Hiking' },
  { id: 'luxury',      emoji: '💎', label: 'Luxury & Wellness' },
  { id: 'food',        emoji: '🍜', label: 'Local Food & Culture' },
];

const BUDGET_PRESETS = [
  { id: 'budget',  label: 'Budget',    range: 'NPR 5K – 15K/day',  emoji: '🎒', desc: 'Hostels & local food' },
  { id: 'mid',     label: 'Mid-Range', range: 'NPR 15K – 35K/day', emoji: '🏨', desc: 'Comfortable hotels' },
  { id: 'premium', label: 'Premium',   range: 'NPR 35K – 60K/day', emoji: '🌟', desc: 'Quality stays & tours' },
  { id: 'luxury',  label: 'Luxury',    range: 'NPR 60K+/day',      emoji: '💎', desc: 'Top resorts & private guides' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const QUICK_DAYS = [3, 5, 7, 10, 14];
const TIPS = [
  'Analyzing your interests…',
  'Matching destinations…',
  'Optimizing your schedule…',
  'Calculating budget…',
  'Almost ready!',
];



const TRIP_GRADIENTS: Record<string, string> = {
  'Everest Base Camp': 'from-slate-700 to-emerald-700',
  'Pokhara Lakeside':  'from-blue-600 to-cyan-500',
  'Chitwan Safari':    'from-emerald-700 to-green-500',
};



const NAV_LINKS = [
  { id: 'overview',      Icon: LayoutDashboard, label: 'Overview' },
  { id: 'plan-new-trip', Icon: Plus,            label: 'Plan New Trip' },
  { id: 'itineraries',   Icon: Map,             label: 'My Itineraries' },
  { id: 'saved',         Icon: Heart,           label: 'Saved Places' },
  { id: 'reviews',       Icon: Star,            label: 'My Reviews' },
  { id: 'preferences',   Icon: Settings,        label: 'Preferences' },
];


const hotelBadge: Record<string, string> = {
  budget: 'bg-gray-100 text-gray-600',
  mid:    'bg-blue-100 text-blue-700',
  luxury: 'bg-yellow-100 text-yellow-700',
};

const statusBadge: Record<string, string> = {
  upcoming:  'bg-[#22C55E] text-white',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  draft:     'bg-gray-100 text-gray-600',
};
const statusLabel: Record<string, string> = {
  upcoming: '✈️ Upcoming', completed: '✅ Completed', cancelled: '❌ Cancelled', draft: '📝 Draft',
};

const STEPS = ['Destination', 'Interests', 'Budget', 'Itinerary'];

// ─── Trip Card Sub-component ──────────────────────────────────────────────────

function TripCard({ trip, onView, onDelete }: { trip: TripData; onView: () => void; onDelete: () => void }) {
  const grad = TRIP_GRADIENTS[trip.name] ?? 'from-slate-600 to-teal-600';
  return (
    <div className="bg-white rounded-[20px] overflow-hidden hover:shadow-md transition-shadow"
         style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div className={`h-32 relative bg-gradient-to-br ${grad}`}>
        <div className="absolute inset-0 bg-black/20" />
        <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[trip.status] || statusBadge.draft}`}>
          {statusLabel[trip.status] || '📝 Draft'}
        </span>
        <p className="absolute bottom-3 left-3 text-white font-bold text-base z-10"
           style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{trip.name}</p>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-[#6B7280]">{trip.region}</p>
            <p className="text-sm text-[#374151] font-medium mt-0.5">{trip.days} Days · {trip.month}</p>
          </div>
          <span className="font-bold text-sm text-[#22C55E]">NPR {trip.cost.toLocaleString()}</span>
        </div>
        <div className="flex gap-1 flex-wrap mt-2">
          {trip.interests.map(i => (
            <span key={i} className="rounded-full bg-[#F3F4F6] text-xs px-2 py-0.5 text-[#374151]">{i}</span>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={onView}
                  className="flex-1 bg-[#22C55E] text-white rounded-full py-2 text-xs font-semibold hover:bg-green-600 transition-colors cursor-pointer">
            View Itinerary
          </button>
          <button onClick={onDelete}
                  className="w-9 h-9 flex items-center justify-center border border-red-200 rounded-full text-red-400 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab]               = useState('overview');
  const plannerRef                               = useRef<HTMLDivElement>(null);

  // Data state
  const [trips, setTrips]             = useState<TripData[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [savedCount, setSavedCount]   = useState(0);
  const [userProfile, setUserProfile] = useState<{ id: string; full_name: string; email: string; cluster_label?: string; scores?: Record<string, number>; travel_style?: string; preferred_difficulty?: string; preferred_budget_tier?: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);

  // Modal
  const [modalTrip, setModalTrip] = useState<TripData | null>(null);

  // Animation flags
  const [statsVisible, setStatsVisible] = useState(false);
  const [dnaAnimated, setDnaAnimated]   = useState(false);

  // Planner state
  const [currentStep, setCurrentStep]             = useState(1);
  const [selectedDest, setSelectedDest]           = useState('');
  const [days, setDays]                           = useState(3);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty]               = useState('moderate');
  const [travelMonth, setTravelMonth]             = useState('');
  const [selectedBudget, setSelectedBudget]       = useState('');
  const [customBudget, setCustomBudget]           = useState('');
  const [hotelType, setHotelType]                 = useState('mid');

  // Step 4
  const [isGenerating, setIsGenerating] = useState(false);
  const [tipIndex, setTipIndex]         = useState(0);
  const [openDays, setOpenDays]         = useState<Set<number>>(new Set([1]));
  const [generatedItinerary, setGeneratedItinerary] = useState<any | null>(null);
  const [generationError, setGenerationError] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');

  // Preferences
  const [prefStyle,      setPrefStyle]      = useState('adventure');
  const [prefBudget,     setPrefBudget]     = useState('mid');
  const [prefDifficulty, setPrefDifficulty] = useState('moderate');

  const mapApiItineraryToTrip = (item: any): TripData => {
    const rawStatus = String(item.status || 'Upcoming').toLowerCase();
    const status: TripData['status'] = rawStatus === 'completed'
      ? 'completed'
      : rawStatus === 'upcoming'
        ? 'upcoming'
        : 'draft';

    return {
      name: item.destination_name || 'Trip',
      region: item.region || 'Nepal',
      days: item.num_days || 0,
      month: item.travel_month || 'TBD',
      cost: item.predicted_budget || 0,
      status,
      interests: Array.isArray(item.interests) ? item.interests : [],
      itinerary: item.actual_schedule?.days || item.schedule?.days || [],
    };
  };

  // Fetch user itineraries on mount
  const [clusterData, setClusterData] = useState<{ name: string; emoji: string } | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{ name: string; region: string; dest: string; g: string }>>([
    { name: 'Upper Mustang',   region: 'Gandaki', dest: 'mustang', g: 'from-amber-500 to-orange-500' },
    { name: 'Langtang Valley', region: 'Bagmati', dest: 'everest', g: 'from-teal-500 to-cyan-500' },
    { name: 'Ilam Tea Garden', region: 'Koshi',   dest: 'pokhara', g: 'from-green-500 to-lime-500' },
  ]);
  const [recoLoading, setRecoLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setTripsLoading(true);
      try {
        const data = await userAPI.getItineraries();
        if (data && Array.isArray(data)) {
          setTrips(data.map(mapApiItineraryToTrip));
        }
      } catch {
        
      } finally {
        setTripsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setProfileLoading(true);
      try {
        const me = await authAPI.me();
        const profile = await userAPI.getProfile();
        const merged = {
          id: me?.id || profile?.id,
          full_name: me?.full_name || profile?.full_name || 'Traveler',
          email: me?.email || profile?.email || 'traveler@nepalgo.com',
          cluster_label: profile?.cluster_label,
          scores: profile?.scores,
          travel_style: profile?.travel_style,
          preferred_difficulty: profile?.preferred_difficulty,
          preferred_budget_tier: profile?.preferred_budget_tier,
        };
        setUserProfile(merged);
        if (merged.id) {
          try {
            const c = await clusterAPI.getProfile(merged.id);
            setClusterData({ name: c?.cluster_label || merged.cluster_label || 'Adventure Backpacker', emoji: '🏔️' });
          } catch {
            setClusterData({ name: merged.cluster_label || 'Adventure Backpacker', emoji: '🏔️' });
          }
        }
      } catch {
        router.push('/auth/login');
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      setSavedLoading(true);
      try {
        const saved = await savedAPI.getAll();
        if (Array.isArray(saved)) {
          setSavedPlaces(saved.map((s: any, idx: number) => ({
            id: s.destination?.id || s.id || idx,
            name: s.destination?.name || 'Destination',
            region: s.destination?.region || 'Nepal',
            desc: s.destination?.short_description || '',
            gradient: 'from-emerald-700 to-green-500',
            destinationId: s.destination?.id,
            slug: s.destination?.slug,
          })) as any);
          setSavedCount(saved.length);
        }
      } catch {}
      finally { setSavedLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    (async () => {
      setRecoLoading(true);
      try {
        const rec = await aiAPI.recommend({
          interests: [userProfile.travel_style || 'Adventure'],
          difficulty: userProfile.preferred_difficulty || 'Moderate',
          budget_tier: userProfile.preferred_budget_tier || 'Mid-Range',
          travel_month: new Date().toLocaleString('default', { month: 'long' }),
          num_days: 5,
        });
        const recs = rec?.recommendations || [];
        setRecommendations(recs.slice(0, 3).map((r: any, idx: number) => ({
          name: r.name,
          region: r.region,
          dest: r.slug || r.id,
          g: idx === 0 ? 'from-amber-500 to-orange-500' : idx === 1 ? 'from-teal-500 to-cyan-500' : 'from-green-500 to-lime-500',
          match: r.match_score,
          reason: r.match_reason,
        })) as any);
      } catch {}
      setRecoLoading(false);
    })();
  }, [userProfile]);

  useEffect(() => {
    const t1 = setTimeout(() => setStatsVisible(true), 200);
    const t2 = setTimeout(() => setDnaAnimated(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);


  const scrollToPlanner = () => {
    setActiveTab('plan-new-trip');
    setTimeout(() => plannerRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleInterest = (id: string) =>
    setSelectedInterests(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const toggleOpenDay = (n: number) =>
    setOpenDays(prev => {
      const s = new Set(prev);
      if (s.has(n)) s.delete(n); else s.add(n);
      return s;
    });

  const resetForm = () => {
    setCurrentStep(1); setSelectedDest('');
    setSelectedInterests(new Set()); setSelectedBudget(''); setCustomBudget('');
    setGeneratedItinerary(null); setGenerationError(''); setSelectedDestinationId('');
  };


  const resolveDestinationId = async () => {
    if (selectedDestinationId) return selectedDestinationId;
    const selected = DESTINATIONS.find((d) => d.id === selectedDest);
    if (!selected) throw new Error('Please select a destination');
    const result = await destinationsAPI.getAll({ search: selected.name });
    const list = Array.isArray(result) ? result : (result?.destinations || []);
    const found = list.find((d: any) => (d.name || '').toLowerCase() === selected.name.toLowerCase()) || list[0];
    if (!found?.id) throw new Error('Destination not found');
    setSelectedDestinationId(found.id);
    return found.id as string;
  };

  const runGenerateItinerary = async () => {
    setGenerationError('');
    setIsGenerating(true);
    setTipIndex(0);
    const iv = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 800);
    try {
      const destination_id = await resolveDestinationId();
      const payload = {
        destination_id,
        num_days: days,
        interests: Array.from(selectedInterests),
        difficulty,
        travel_month: travelMonth || new Date().toLocaleString('default', { month: 'long' }),
        budget_tier: selectedBudget || 'mid',
        hotel_type: hotelType,
      };
      const result = await aiAPI.generateItinerary(payload);
      setGeneratedItinerary(result);
      setOpenDays(new Set([1]));
      setCurrentStep(4);
    } catch {
      setGenerationError('Itinerary generation failed. Please try again.');
    } finally {
      clearInterval(iv);
      setIsGenerating(false);
    }
  };

  const handleSaveItinerary = async () => {
    try {
      const destination_id = await resolveDestinationId();
      if (!generatedItinerary) throw new Error('No itinerary generated');
      await aiAPI.saveItinerary({
        destination_id,
        destination_name: generatedItinerary.destination || destLabel,
        region: generatedItinerary.region || DESTINATIONS.find(d => d.id === selectedDest)?.region || '—',
        num_days: days,
        travel_month: travelMonth || new Date().toLocaleString('default', { month: 'long' }),
        budget_tier: selectedBudget || 'mid',
        hotel_type: hotelType,
        interests: Array.from(selectedInterests),
        difficulty,
        predicted_budget: generatedItinerary.predicted_budget || 0,
        schedule: generatedItinerary.schedule || { days: [] },
      });
      const data = await userAPI.getItineraries();
      if (Array.isArray(data)) setTrips(data.map(mapApiItineraryToTrip));
      showToast('Trip saved successfully', 'success');
      resetForm();
    } catch {
      showToast('Failed to save trip. Please try again.', 'error');
    }
  };

  const handleDeleteTrip = useCallback(async (tripName: string) => {
    if (window.confirm(`Delete "${tripName}"? This cannot be undone.`)) {
      const trip = trips.find(t => t.name === tripName);
      if (trip && (trip as TripData & { id?: string }).id) {
        try {
          await userAPI.deleteItinerary((trip as TripData & { id?: string }).id!);
        } catch {
          // still remove locally
        }
      }
      setTrips(prev => prev.filter(t => t.name !== tripName));
      showToast('Trip deleted', 'info');
    }
  }, [showToast, trips]);

  const handleUnsavePlace = async (placeId: number | string) => {
    const item = (savedPlaces as any[]).find((p: any) => p.id === placeId);
    try {
      if (item?.destinationId) {
        await savedAPI.unsave(item.destinationId);
      }
    } catch {}
    setSavedPlaces(prev => prev.filter((p: any) => p.id !== placeId));
    setSavedCount(c => Math.max(0, c - 1));
    showToast('Removed from saved places', 'info');
  };

  const handleRegenerate = async () => {
    await runGenerateItinerary();
    if (!generationError) showToast('Itinerary regenerated!', 'success');
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('nepal_token');
    document.cookie = 'nepal_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/auth/login');
  };

  const destLabel   = DESTINATIONS.find(d => d.id === selectedDest)?.name ?? '—';
  const budgetLabel = BUDGET_PRESETS.find(b => b.id === selectedBudget)?.label
    ?? (customBudget ? `NPR ${Number(customBudget).toLocaleString()}` : '—');
  const currentTrip = trips[0] ?? null;
  const tripsPlanned = trips.length;
  const daysExplored = trips.reduce((sum, t: any) => sum + (t.days || t.num_days || 0), 0);
  const totalBudgetNpr = trips.reduce((sum, t: any) => sum + (t.cost || t.predicted_budget || 0), 0);
  const dnaRows: [string, number, string][] = [
    ['adventure', userProfile?.scores?.adventure ?? 90, 'bg-[#22C55E]'],
    ['cultural', userProfile?.scores?.cultural ?? 55, 'bg-blue-400'],
    ['nature', userProfile?.scores?.nature ?? 70, 'bg-teal-400'],
    ['luxury', userProfile?.scores?.luxury ?? 15, 'bg-purple-400'],
  ];
  const generatedDays = (generatedItinerary?.schedule?.days || generatedItinerary?.schedule || []) as any[];
  const generatedBudget = generatedItinerary?.predicted_budget || 0;

  const PlannerSection = (
    <div ref={plannerRef} id="plan-new-trip">
      <h2 className="font-bold text-xl text-[#111827] mb-1"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Plan a New Trip</h2>
      <p className="text-sm text-[#6B7280] mb-6">Fill in your preferences and we&apos;ll generate a personalized itinerary</p>
      <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, idx) => {
            const step = idx + 1; const done = step < currentStep; const active = step === currentStep;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${done ? 'bg-[#22C55E] text-white' : active ? 'bg-[#22C55E] text-white ring-4 ring-green-100' : 'bg-[#F3F4F6] text-[#9CA3AF]'}`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : step}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${done || active ? 'text-[#22C55E]' : 'text-[#9CA3AF]'}`}>{label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${step < currentStep ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* STEP 1 */}
        {currentStep === 1 && (
          <div>
            <h3 className="font-bold text-lg text-[#111827]"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Where do you want to go?</h3>
            <p className="text-sm text-[#6B7280] mt-1 mb-6">Pick your destination and how long you&apos;ll be traveling</p>
            <p className="text-sm font-medium text-[#374151] mb-3">Choose Destination</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DESTINATIONS.map(dest => (
                <div key={dest.id} onClick={() => setSelectedDest(dest.id)}
                     className={`relative cursor-pointer rounded-[16px] overflow-hidden h-28 transition-all
                       ${selectedDest === dest.id ? 'ring-2 ring-[#22C55E] ring-offset-2' : 'hover:opacity-90'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${dest.gradient}`} />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute bottom-2 left-3 z-10">
                    <p className="text-white font-bold text-sm">{dest.name}</p>
                    <p className="text-white/70 text-xs">{dest.region}</p>
                  </div>
                  {selectedDest === dest.id && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-[#374151] mt-6 mb-3">How many days?</p>
            <div className="flex items-center">
              <button onClick={() => setDays(d => Math.max(1, d - 1))}
                      className="rounded-l-full border border-[#E5E7EB] w-11 h-11 flex items-center justify-center text-[#6B7280] hover:bg-gray-50 transition-colors text-lg">−</button>
              <div className="border-t border-b border-[#E5E7EB] w-16 h-11 flex items-center justify-center font-black text-lg text-[#111827]"
                   style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{days}</div>
              <button onClick={() => setDays(d => Math.min(30, d + 1))}
                      className="rounded-r-full border border-[#E5E7EB] w-11 h-11 flex items-center justify-center text-[#6B7280] hover:bg-gray-50 transition-colors text-lg">+</button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {QUICK_DAYS.map(n => (
                <button key={n} onClick={() => setDays(n)}
                        className={`rounded-full text-xs px-3 py-1.5 cursor-pointer font-medium transition-colors
                          ${days === n ? 'bg-[#22C55E] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-gray-200'}`}>
                  {n} Days
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <PillButton variant="solid" size="md" disabled={!selectedDest} onClick={() => selectedDest && setCurrentStep(2)}>
                Next: Pick Interests →
              </PillButton>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div>
            <h3 className="font-bold text-lg text-[#111827]"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>What are your interests?</h3>
            <p className="text-sm text-[#6B7280] mt-1 mb-6">Select everything that excites you — we&apos;ll match activities accordingly</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERESTS.map(({ id, emoji, label }) => {
                const sel = selectedInterests.has(id);
                return (
                  <div key={id} onClick={() => toggleInterest(id)}
                       className={`relative cursor-pointer rounded-[16px] p-4 border-2 transition-all flex items-center gap-3
                         ${sel ? 'border-[#22C55E] bg-green-50' : 'border-[#E5E7EB] bg-white hover:border-gray-300'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${sel ? 'bg-[#22C55E]/10' : 'bg-[#F3F4F6]'}`}>{emoji}</div>
                    <span className="font-medium text-sm text-[#111827]">{label}</span>
                    {sel && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-[#22C55E]" />}
                  </div>
                );
              })}
            </div>
            {selectedInterests.size === 0 && (
              <p className="text-xs text-orange-500 mt-2">Select at least one interest to continue</p>
            )}
            <p className="text-sm font-medium text-[#374151] mt-6 mb-3">Preferred Difficulty</p>
            <div className="flex gap-3 flex-wrap">
              {[['easy','🟢 Easy'],['moderate','🟡 Moderate'],['challenging','🔴 Challenging']].map(([val,lbl]) => (
                <button key={val} onClick={() => setDifficulty(val)}
                        className={`rounded-full px-5 py-2.5 text-sm font-medium border-2 cursor-pointer transition-all
                          ${difficulty === val ? 'border-[#22C55E] bg-green-50 text-[#22C55E]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-[#374151] mt-6 mb-3">When are you traveling?</p>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map(m => (
                <button key={m} onClick={() => setTravelMonth(m)}
                        className={`rounded-full text-xs px-3 py-1.5 cursor-pointer font-medium transition-colors
                          ${travelMonth === m ? 'bg-[#22C55E] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-gray-200'}`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <PillButton variant="outline" size="md" onClick={() => setCurrentStep(1)}>← Back</PillButton>
              <PillButton variant="solid" size="md" disabled={selectedInterests.size === 0}
                          onClick={() => selectedInterests.size > 0 && setCurrentStep(3)}>
                Next: Set Budget →
              </PillButton>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div>
            <h3 className="font-bold text-lg text-[#111827]"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>What&apos;s your budget?</h3>
            <p className="text-sm text-[#6B7280] mt-1 mb-6">Set your total trip budget. We&apos;ll optimize everything to fit.</p>
            <p className="text-sm font-medium text-[#374151] mb-3">Quick Select</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BUDGET_PRESETS.map(({ id, label, range, emoji, desc }) => {
                const sel = selectedBudget === id;
                return (
                  <div key={id} onClick={() => setSelectedBudget(id)}
                       className={`cursor-pointer rounded-[16px] p-4 border-2 text-center transition-all
                         ${sel ? 'border-[#22C55E] bg-green-50' : 'border-[#E5E7EB] bg-white hover:border-gray-300'}`}>
                    <div className="text-2xl">{emoji}</div>
                    <p className="font-bold text-sm text-[#111827] mt-1"
                       style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{label}</p>
                    <p className="text-xs text-[#22C55E] font-medium mt-0.5">{range}</p>
                    <p className="text-xs text-[#6B7280] mt-1">{desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm font-medium text-[#374151] mt-6 mb-2">Or enter a custom total budget</p>
            <div className="flex items-center">
              <span className="text-sm font-bold text-[#374151] bg-[#F3F4F6] rounded-l-full px-4 py-3 border border-r-0 border-[#E5E7EB]">NPR</span>
              <input type="number" value={customBudget} onChange={e => setCustomBudget(e.target.value)}
                     placeholder="e.g. 50000"
                     className="flex-1 rounded-r-full border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white" />
            </div>
            <div className="mt-6 bg-[#F0EBF8] rounded-[16px] p-4">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Trip Preview</p>
              <div className="grid grid-cols-3 gap-3">
                {[[destLabel,'Destination'],[`${days} Days`,'Duration'],[budgetLabel,'Budget']].map(([v,l]) => (
                  <div key={l} className="text-center">
                    <p className="font-black text-base text-[#111827]"
                       style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{v}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm font-medium text-[#374151] mt-4 mb-2">Hotel Preference</p>
            <div className="flex gap-3 flex-wrap">
              {[['budget','🏕️ Budget'],['mid','🏨 Mid-Range'],['luxury','✨ Luxury']].map(([val,lbl]) => (
                <button key={val} onClick={() => setHotelType(val)}
                        className={`rounded-full px-5 py-2.5 text-sm font-medium border-2 cursor-pointer transition-all
                          ${hotelType === val ? 'border-[#22C55E] bg-green-50 text-[#22C55E]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-end mt-8">
              <PillButton variant="outline" size="md" onClick={() => setCurrentStep(2)}>← Back</PillButton>
              <div className="flex flex-col items-end gap-1">
                <PillButton variant="solid" size="lg" onClick={runGenerateItinerary}>🤖 Generate My Itinerary</PillButton>
                <span className="text-xs text-[#9CA3AF]">Powered by AI</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div>
            {isGenerating ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full border-4 border-[#E5E7EB] border-t-[#22C55E] animate-spin mx-auto" />
                <p className="font-bold text-lg text-[#111827] mt-6"
                   style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Generating your itinerary…</p>
                <p className="text-sm text-[#6B7280] mt-2">{TIPS[tipIndex]}</p>
              </div>
            ) : (
              <div>
                {generationError && (
                  <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-[16px] p-4 mb-6">
                    <p className="text-sm text-red-700">{generationError}</p>
                    <PillButton variant="outline" size="sm" onClick={runGenerateItinerary}>Retry</PillButton>
                  </div>
                )}
                {!generationError && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-[16px] p-4 mb-6">
                  <CheckCircle2 className="w-6 h-6 text-[#22C55E] flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[#111827]"
                       style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Your itinerary is ready!</p>
                    <p className="text-sm text-[#6B7280]">{days}-day {destLabel} trip · {budgetLabel} budget</p>
                  </div>
                </div>
                )}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[[destLabel,'Destination'],[`${days} Days`,'Duration'],[travelMonth || 'TBD','Month'],[budgetLabel,'Budget']].map(([v,l]) => (
                    <div key={l} className="bg-[#F0EBF8] rounded-[16px] p-3 text-center">
                      <p className="font-black text-base text-[#111827]"
                         style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{v}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                {generatedDays.length === 0 && !generationError && <p className="text-sm text-[#6B7280]">No itinerary generated yet.</p>}
                <div className="space-y-3">
                  {generatedDays.map((day: any, idx: number) => {
                    const dayNum = day.n || day.day_number || day.dayNumber || (idx + 1);
                    const open = openDays.has(dayNum);
                    return (
                      <div key={dayNum} className="rounded-[16px] overflow-hidden">
                        <button onClick={() => toggleOpenDay(dayNum)}
                                className="w-full flex items-center justify-between cursor-pointer bg-[#F0EBF8] px-4 py-3 hover:bg-green-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white text-xs font-bold flex items-center justify-center">D{dayNum}</div>
                            <span className="font-semibold text-sm text-[#111827]"
                                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                              Day {dayNum} — {day.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-[#22C55E]">NPR {day.cost.toLocaleString()}</span>
                            <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {open && (
                          <div className="bg-white border border-t-0 border-[#E5E7EB] rounded-b-[16px] px-4 py-3 space-y-3">
                            <div className="flex items-center gap-3 pb-3 border-b border-[#F3F4F6]">
                              <Building2 className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                              <span className="text-xs text-[#6B7280]">Staying at:</span>
                              <span className="text-sm font-medium text-[#111827]">{day.hotel.name}</span>
                              <span className={`text-xs rounded-full px-2 py-0.5 ml-1 ${hotelBadge[day.hotel.type]}`}>{day.hotel.type}</span>
                            </div>
                            <div className="space-y-2">
                              {(day.activities || []).map((act: any) => (
                                <div key={act.name} className="flex items-center gap-3">
                                  <span className="bg-[#F3F4F6] text-[#6B7280] text-xs px-2 py-0.5 rounded-full flex-shrink-0">{act.time}</span>
                                  <span className="text-sm font-medium text-[#111827] flex-1">{act.name}</span>
                                  <span className="text-xs text-[#9CA3AF]">{act.duration}</span>
                                  <span className="text-xs font-medium text-[#22C55E]">{act.cost}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-green-50 rounded-[16px] p-4 mt-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[#374151]">Total Estimated Cost</p>
                    <p className="text-xs text-[#6B7280]">Based on your preferences</p>
                  </div>
                  <p className="font-black text-2xl text-[#22C55E]"
                     style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>NPR {generatedBudget.toLocaleString()}</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <PillButton variant="solid"   size="lg" className="flex-1" onClick={handleSaveItinerary}>💾 Save This Itinerary</PillButton>
                  <PillButton variant="outline" size="lg" className="flex-1" onClick={handleRegenerate}>↺ Regenerate</PillButton>
                  <PillButton variant="ghost"   size="sm" onClick={resetForm}>✏️ Edit</PillButton>
                </div>
                <p onClick={resetForm} className="text-xs text-[#9CA3AF] text-center mt-3 cursor-pointer hover:text-[#6B7280]">Start over</p>
                <div className="flex mt-8 pt-4 border-t">
                  <PillButton variant="outline" size="md" onClick={() => setCurrentStep(3)}>← Back to Budget</PillButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      {modalTrip && (
        <ItineraryModal
          trip={modalTrip}
          onClose={() => setModalTrip(null)}
          onDownloadPDF={() => showToast('PDF export coming soon', 'info')}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">

        {/* ════════ SIDEBAR ═════════════════════════════════════════════════ */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-[20px] sticky top-24 p-5 space-y-1"
               style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22C55E] to-teal-500 text-white text-2xl font-black flex items-center justify-center">
                {(userProfile?.full_name || 'Traveler').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <p className="font-black text-lg text-[#111827] mt-3"
                 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{profileLoading ? 'Loading...' : (userProfile?.full_name || 'Traveler')}</p>
              <p className="text-sm text-[#6B7280]">{profileLoading ? '...' : (userProfile?.email || 'traveler@nepalgo.com')}</p>
              <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full mt-2">
                {`${clusterData?.emoji || '🏔️'} ${clusterData?.name || 'Adventure Backpacker'}`}
              </span>
            </div>
            <div className="border-t my-4" />
            {NAV_LINKS.map(({ id, Icon, label }) => (
              <button key={id}
                onClick={() => { setActiveTab(id); if (id === 'plan-new-trip') scrollToPlanner(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                  activeTab === id ? 'bg-green-50 text-[#22C55E] font-semibold' : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]'
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
            <div className="border-t mt-4 pt-4" />
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* ════════ MAIN CONTENT ════════════════════════════════════════════ */}
        <div className="flex-1 space-y-8">

          {/* Greeting */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-black text-2xl text-[#111827]"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Good morning, {(userProfile?.full_name || 'Friend').split(' ')[0]} 👋</h1>
              <p className="text-sm text-[#6B7280] mt-1">Ready for your next Nepal adventure?</p>
            </div>
            <PillButton variant="solid" size="sm" onClick={scrollToPlanner}>+ Plan New Trip</PillButton>
          </div>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  [Map,      'bg-green-50',  'text-[#22C55E]',  tripsPlanned, '', 'Trips Planned'],
                  [Calendar, 'bg-blue-50',   'text-blue-500',   daysExplored, '', 'Days Explored'],
                  [Wallet,   'bg-orange-50', 'text-orange-500', totalBudgetNpr, '', 'Total Budget (NPR)'],
                  [MapPin,   'bg-purple-50', 'text-purple-500', savedCount,   '', 'Destinations Saved'],
                ] as const).map(([Icon, bg, ic, val, suf, lbl]) => (
                  <div key={lbl} className="bg-white rounded-[20px] p-5"
                       style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${ic}`} />
                    </div>
                    <p className="font-black text-3xl text-[#111827] mt-3"
                       style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      {statsVisible ? <CountUpNumber target={val as number} suffix={suf as string} duration={1200} /> : '0'}
                    </p>
                    <p className="text-sm text-[#6B7280] mt-0.5">{lbl}</p>
                  </div>
                ))}
              </div>

              {/* Current Trip */}
              {currentTrip ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-xl text-[#111827]"
                        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Your Current Trip</h2>
                    <button onClick={() => setActiveTab('itineraries')}
                            className="text-sm text-[#22C55E] cursor-pointer font-medium hover:underline">View All Trips →</button>
                  </div>
                  <div className="bg-white rounded-[20px] overflow-hidden"
                       style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <div className={`relative h-40 bg-gradient-to-r ${TRIP_GRADIENTS[currentTrip.name] ?? 'from-slate-700 to-teal-600'}`}>
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute bottom-4 left-5 z-10">
                        <p className="font-black text-2xl text-white"
                           style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{currentTrip.name}</p>
                        <div className="flex gap-2 mt-1 items-center">
                          <span className="text-white/80 text-xs">📍 {currentTrip.region}</span>
                          <span className="text-white/50">•</span>
                          <span className="text-white/80 text-xs">{currentTrip.days} Days</span>
                          <span className="text-white/50">•</span>
                          <span className="text-white/80 text-xs">{currentTrip.month}</span>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusBadge[currentTrip.status] || statusBadge.draft}`}>
                          {statusLabel[currentTrip.status] || '📝 Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex gap-6">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Trip Highlights</p>
                          <div className="grid grid-cols-3 gap-3">
                            {[[`${currentTrip.days}`,'Days'],[`NPR ${Math.round((currentTrip.cost || 0)/1000)}K`,'Budget'],[(currentTrip as any).difficulty || '—','Difficulty']].map(([v,l]) => (
                              <div key={l} className="bg-[#F0EBF8] rounded-[12px] p-3 text-center">
                                <p className="font-black text-lg text-[#111827]"
                                   style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{v}</p>
                                <p className="text-xs text-[#6B7280] mt-0.5">{l}</p>
                              </div>
                            ))}
                          </div>
                          {currentTrip.itinerary && currentTrip.itinerary.length > 0 && (
                            <>
                              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mt-4 mb-2">Day Preview</p>
                              <div className="overflow-x-auto flex gap-2 pb-1" style={{ scrollbarWidth: 'none' }}>
                                {currentTrip.itinerary.map(d => (
                                  <button key={d.n} onClick={() => setModalTrip(currentTrip)}
                                          className="flex-shrink-0 bg-[#F3F4F6] rounded-full px-3 py-1.5 text-xs font-medium text-[#374151] cursor-pointer hover:bg-green-50 hover:text-[#22C55E] transition-colors">
                                    Day {d.n} · {d.location}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        {(currentTrip as any).budget_breakdown && (
                        <div className="w-48 flex-shrink-0">
                          <div className="bg-[#F0EBF8] rounded-[16px] p-4">
                            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Budget Split</p>
                            <div className="space-y-2">
                              {Object.entries((currentTrip as any).budget_breakdown).map(([l,v]) => (
                                <div key={l} className="flex justify-between text-xs">
                                  <span className="text-[#6B7280] capitalize">{l}</span>
                                  <span className="font-medium text-[#111827]">NPR {Number(v).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t mt-2 pt-2 flex justify-between">
                              <span className="font-semibold text-sm text-[#374151]">Total</span>
                              <span className="font-black text-sm text-[#22C55E]">NPR {currentTrip.cost.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                      <div className="border-t pt-4 mt-4 flex gap-3">
                        <PillButton variant="solid"   size="sm" className="flex-1" onClick={() => setModalTrip(currentTrip)}>View Full Itinerary</PillButton>
                        <PillButton variant="outline" size="sm" className="flex-1" onClick={scrollToPlanner}>Edit Trip</PillButton>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[20px] p-10 text-center"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <div className="text-6xl">🗺️</div>
                  <p className="font-black text-xl text-[#111827] mt-4"
                     style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>No trips planned yet</p>
                  <p className="text-sm text-[#6B7280] mt-2">Start planning your first Nepal adventure</p>
                  <div className="mt-6">
                    <PillButton variant="solid" size="lg" onClick={scrollToPlanner}>Plan My First Trip →</PillButton>
                  </div>
                </div>
              )}

              {/* Past Trips */}
              {trips.length > 1 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-xl text-[#111827]"
                        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>My Trips</h2>
                    <button onClick={() => setActiveTab('itineraries')}
                            className="text-sm text-[#22C55E] cursor-pointer font-medium hover:underline">View All →</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trips.slice(1, 4).map(trip => (
                      <TripCard key={trip.name} trip={trip}
                        onView={() => setModalTrip(trip)}
                        onDelete={() => handleDeleteTrip(trip.name)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Travel Profile */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <p className="font-bold text-base text-[#111827] mb-4"
                     style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Your Travel DNA</p>
                <div className="space-y-3">
                    {dnaRows.map(([key, pct, color]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm text-[#6B7280] w-20 capitalize">{key}</span>
                        <div className="flex-1 h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
                               style={{ width: dnaAnimated ? `${pct}%` : '0%' }} />
                        </div>
                        <span className="text-xs text-[#6B7280] w-8 text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-4 pt-4">
                    <p className="text-xs text-[#6B7280] font-medium">Matched Profile</p>
                    <span className="inline-block bg-green-50 text-green-700 rounded-full px-3 py-1 text-sm font-medium mt-1">
                      {clusterData?.emoji || '🏔️'} {clusterData?.name || 'Adventure Backpacker'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <p className="font-bold text-base text-[#111827] mb-1"
                     style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Recommended For You</p>
                  <p className="text-xs text-[#6B7280] mb-4">Based on your {(clusterData?.name || 'Adventure Backpacker')} profile</p>
                <div className="space-y-3">
                    {recoLoading && Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-2 bg-gray-200 rounded w-1/2 mt-2" />
                        </div>
                      </div>
                    ))}
                    {(!recoLoading ? recommendations : []).map((rec: any) => (
                      <div key={rec.name} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rec.g} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111827]">{rec.name}</p>
                          <p className="text-xs text-[#6B7280]">{rec.region}</p>
                          {(rec as any).reason && <p className="text-[11px] italic text-[#6B7280]">{(rec as any).reason}</p>}
                          {(rec as any).match && <span className="inline-block mt-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{Math.round((rec as any).match)}% match</span>}
                        </div>
                        <PillButton variant="ghost" size="sm"
                          onClick={() => { setSelectedDest(rec.dest); scrollToPlanner(); }}>Plan →</PillButton>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {PlannerSection}
            </>
          )}

          {/* ── PLAN NEW TRIP TAB ─────────────────────────────────────────── */}
          {activeTab === 'plan-new-trip' && PlannerSection}

          {/* ── MY ITINERARIES TAB ────────────────────────────────────────── */}
          {activeTab === 'itineraries' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-black text-xl text-[#111827]"
                      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>My Itineraries</h2>
                  <p className="text-sm text-[#6B7280] mt-1">{trips.length} trips planned</p>
                </div>
                <PillButton variant="solid" size="sm" onClick={scrollToPlanner}>+ Plan New</PillButton>
              </div>
              {tripsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[20px] p-6 animate-pulse" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : trips.length === 0 ? (
                <div className="bg-white rounded-[20px] p-10 text-center"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <div className="text-5xl mb-3">🗺️</div>
                  <p className="font-bold text-[#111827]">No itineraries yet</p>
                  <p className="text-sm text-[#6B7280] mt-1 mb-4">Plan your first trip to get started</p>
                  <PillButton variant="solid" size="md" onClick={scrollToPlanner}>Plan a Trip</PillButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map(trip => (
                    <div key={trip.name} className="bg-white rounded-[20px] overflow-hidden"
                         style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                      <div className="flex">
                        <div className={`w-32 flex-shrink-0 bg-gradient-to-br ${TRIP_GRADIENTS[trip.name] ?? 'from-slate-600 to-teal-600'} relative`}>
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl"
                               style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{trip.days}d</div>
                        </div>
                        <div className="flex-1 p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-lg text-[#111827]"
                                   style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{trip.name}</p>
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadge[trip.status] || statusBadge.draft}`}>
                                  {statusLabel[trip.status] || '📝 Draft'}
                                </span>
                              </div>
                              <p className="text-sm text-[#6B7280] mt-0.5">📍 {trip.region} · {trip.days} Days · {trip.month}</p>
                              <div className="flex gap-1 flex-wrap mt-2">
                                {trip.interests.map(i => (
                                  <span key={i} className="rounded-full bg-[#F3F4F6] text-xs px-2 py-0.5 text-[#374151]">{i}</span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <p className="font-black text-xl text-[#22C55E]"
                                 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                NPR {trip.cost.toLocaleString()}
                              </p>
                              <p className="text-xs text-[#6B7280]">total budget</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => setModalTrip(trip)}
                                    className="flex items-center gap-1.5 bg-[#22C55E] text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-green-600 transition-colors cursor-pointer">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button onClick={() => handleDeleteTrip(trip.name)}
                                    className="flex items-center gap-1.5 border border-red-200 text-red-500 rounded-full px-4 py-2 text-xs font-semibold hover:bg-red-50 transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SAVED PLACES TAB ─────────────────────────────────────────── */}
          {activeTab === 'saved' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-black text-xl text-[#111827]"
                      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Saved Places</h2>
                  <p className="text-sm text-[#6B7280] mt-1">{savedPlaces.length} destinations saved</p>
                </div>
              </div>
              {savedLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[20px] h-48 animate-pulse" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                  ))}
                </div>
              ) : savedPlaces.length === 0 ? (
                <div className="bg-white rounded-[20px] p-10 text-center"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <div className="text-5xl mb-3">❤️</div>
                  <p className="font-bold text-[#111827]">No saved places yet</p>
                  <p className="text-sm text-[#6B7280] mt-1">Browse destinations and save your favourites</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {savedPlaces.map(place => (
                    <div key={place.id} className="bg-white rounded-[20px] overflow-hidden"
                         style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                      <div className={`h-36 relative bg-gradient-to-br ${place.gradient}`}>
                        <div className="absolute inset-0 bg-black/25" />
                        <p className="absolute bottom-3 left-4 text-white font-black text-lg z-10"
                           style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{place.name}</p>
                        <span className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full z-10">
                          📍 {place.region}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-[#6B7280]">{place.desc}</p>
                        <div className="flex gap-2 mt-3">
                          <PillButton variant="solid" size="sm" className="flex-1" onClick={scrollToPlanner}>Plan Trip</PillButton>
                          <button onClick={() => handleUnsavePlace(place.id)}
                                  className="flex items-center gap-1 border border-red-200 text-red-400 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-red-50 transition-colors cursor-pointer">
                            <HeartOff className="w-3.5 h-3.5" /> Unsave
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY REVIEWS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'reviews' && (
            <div>
              <div className="mb-6">
                <h2 className="font-black text-xl text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>My Reviews</h2>
                <p className="text-sm text-[#6B7280] mt-1">Your reviews appear here after posting destination reviews</p>
              </div>
              <div className="bg-white rounded-[20px] p-10 text-center" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <p className="font-bold text-[#111827]">No review history yet</p>
                <p className="text-sm text-[#6B7280] mt-1">Your reviews will appear here after you review destinations you have visited.</p>
                <div className="mt-4"><Link href="/destinations"><PillButton variant="solid" size="sm">Browse Destinations</PillButton></Link></div>
              </div>
            </div>
          )}

          {/* ── PREFERENCES TAB ─────────────────────────────────────────────── */}
          {activeTab === 'preferences' && (
            <div>
              <div className="mb-6">
                <h2 className="font-black text-xl text-[#111827]"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Travel Preferences</h2>
                <p className="text-sm text-[#6B7280] mt-1">These help us personalise your trip recommendations</p>
              </div>
              <div className="bg-white rounded-[20px] p-6 space-y-8"
                   style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                {/* Travel Style */}
                <div>
                  <p className="font-semibold text-[#111827] mb-1">Travel Style</p>
                  <p className="text-xs text-[#6B7280] mb-3">How would you describe your travel personality?</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'adventure', emoji: '🧗', label: 'Adventure Seeker' },
                      { id: 'culture',   emoji: '🏛️', label: 'Culture Explorer' },
                      { id: 'nature',    emoji: '🌿', label: 'Nature Lover' },
                      { id: 'luxury',    emoji: '💎', label: 'Luxury Traveler' },
                    ].map(({ id, emoji, label }) => (
                      <label key={id}
                             className={`flex flex-col items-center gap-2 p-4 rounded-[16px] border-2 cursor-pointer transition-all
                               ${prefStyle === id ? 'border-[#22C55E] bg-green-50' : 'border-[#E5E7EB] hover:border-gray-300'}`}>
                        <input type="radio" name="style" value={id} checked={prefStyle === id}
                               onChange={() => setPrefStyle(id)} className="sr-only" />
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-xs font-medium text-center text-[#111827]">{label}</span>
                        {prefStyle === id && <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />}
                      </label>
                    ))}
                  </div>
                </div>
                {/* Budget Tier */}
                <div>
                  <p className="font-semibold text-[#111827] mb-1">Default Budget Tier</p>
                  <p className="text-xs text-[#6B7280] mb-3">We&apos;ll use this as your default when generating trips</p>
                  <div className="flex gap-3 flex-wrap">
                    {[['budget','🎒 Budget'],['mid','🏨 Mid-Range'],['premium','🌟 Premium'],['luxury','💎 Luxury']].map(([val,lbl]) => (
                      <button key={val} onClick={() => setPrefBudget(val)}
                              className={`rounded-full px-5 py-2.5 text-sm font-medium border-2 cursor-pointer transition-all
                                ${prefBudget === val ? 'border-[#22C55E] bg-green-50 text-[#22C55E]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Difficulty */}
                <div>
                  <p className="font-semibold text-[#111827] mb-1">Preferred Difficulty</p>
                  <p className="text-xs text-[#6B7280] mb-3">How challenging do you like your trips?</p>
                  <div className="flex gap-3 flex-wrap">
                    {[['easy','🟢 Easy'],['moderate','🟡 Moderate'],['challenging','🔴 Challenging'],['extreme','⚡ Extreme']].map(([val,lbl]) => (
                      <button key={val} onClick={() => setPrefDifficulty(val)}
                              className={`rounded-full px-5 py-2.5 text-sm font-medium border-2 cursor-pointer transition-all
                                ${prefDifficulty === val ? 'border-[#22C55E] bg-green-50 text-[#22C55E]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Notifications */}
                <div>
                  <p className="font-semibold text-[#111827] mb-3">Notifications</p>
                <div className="space-y-3">
                    {[
                      ['Deal Alerts',      'Get notified about Nepal travel deals'],
                      ['Trip Reminders',   'Reminders 7 days before your trip'],
                      ['New Destinations', 'When we add new destinations near your saved ones'],
                    ].map(([title, desc]) => (
                      <div key={title} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#111827]">{title}</p>
                          <p className="text-xs text-[#6B7280]">{desc}</p>
                        </div>
                        <div className="w-11 h-6 bg-[#22C55E] rounded-full relative cursor-pointer flex-shrink-0">
                          <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <PillButton variant="solid" size="lg"
                    onClick={async () => {
                      try {
                        await userAPI.updatePreferences({
                          travel_style: prefStyle.charAt(0).toUpperCase() + prefStyle.slice(1),
                          preferred_difficulty: prefDifficulty,
                          preferred_budget_tier: prefBudget,
                        });
                        showToast('Preferences saved', 'success');
                        if (userProfile?.id) {
                          const c = await clusterAPI.getProfile(userProfile.id);
                          setClusterData({ name: c?.cluster_label || clusterData?.name || 'Adventure Backpacker', emoji: '🏔️' });
                        }
                      } catch {
                        showToast('Failed to save preferences.', 'error');
                      }
                    }}>
                    Save Preferences
                  </PillButton>
                </div>
              </div>
            </div>
          )}

        </div>{/* /main */}
      </div>{/* /flex */}

      <Footer />
    </div>
  );
}
