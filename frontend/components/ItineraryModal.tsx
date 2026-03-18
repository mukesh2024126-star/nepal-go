'use client';

import { useEffect, useRef } from 'react';
import { X, Building2, Download } from 'lucide-react';

interface Activity {
  time: string;
  name: string;
  duration: string;
  cost: string;
}

interface Day {
  n: number;
  location: string;
  cost: number;
  hotel: { name: string; type: 'budget' | 'mid' | 'luxury' };
  activities: Activity[];
}

export interface TripData {
  name: string;
  region: string;
  days: number;
  month: string;
  cost: number;
  status: 'upcoming' | 'completed' | 'draft';
  interests: string[];
  itinerary?: Day[];
}

interface Props {
  trip: TripData | null;
  onClose: () => void;
  onDownloadPDF?: () => void;
}

const statusBadge: Record<string, string> = {
  upcoming:  'bg-[#22C55E] text-white',
  completed: 'bg-blue-100 text-blue-700',
  draft:     'bg-gray-100 text-gray-600',
};
const statusLabel: Record<string, string> = {
  upcoming: '✈️ Upcoming', completed: '✅ Completed', draft: '📝 Draft',
};
const hotelBadge: Record<string, string> = {
  budget: 'bg-gray-100 text-gray-600',
  mid:    'bg-blue-100 text-blue-700',
  luxury: 'bg-yellow-100 text-yellow-700',
};

const DEFAULT_ITINERARY: Day[] = [
  {
    n: 1, location: 'Kathmandu', cost: 4050,
    hotel: { name: 'Thamel Inn', type: 'mid' },
    activities: [
      { time: '08:00', name: 'City Walk & Garden of Dreams', duration: '2hr',   cost: 'Free' },
      { time: '10:30', name: 'Pashupatinath Temple',          duration: '2hr',   cost: 'NPR 300' },
      { time: '14:00', name: 'Boudhanath Stupa',              duration: '1.5hr', cost: 'NPR 250' },
    ],
  },
  {
    n: 2, location: 'Lukla', cost: 13800,
    hotel: { name: 'Lukla Lodge', type: 'budget' },
    activities: [
      { time: '06:00', name: 'Flight Kathmandu → Lukla', duration: '0.5hr', cost: 'NPR 12,000' },
      { time: '09:00', name: 'Trek to Phakding',         duration: '4hr',   cost: 'Free' },
    ],
  },
  {
    n: 3, location: 'Namche Bazaar', cost: 3700,
    hotel: { name: 'Namche Inn', type: 'mid' },
    activities: [
      { time: '08:00', name: 'Suspension Bridge Crossing', duration: '2hr',   cost: 'Free' },
      { time: '11:00', name: 'Namche Bazaar Market',       duration: '1.5hr', cost: 'NPR 500' },
      { time: '14:00', name: 'Sherpa Culture Museum',      duration: '1hr',   cost: 'NPR 200' },
    ],
  },
  {
    n: 4, location: 'Namche (Rest)', cost: 3000,
    hotel: { name: 'Namche Inn', type: 'mid' },
    activities: [
      { time: '07:00', name: 'Everest View Point Hike',  duration: '4hr', cost: 'Free' },
      { time: '14:00', name: 'Acclimatization Rest',     duration: '2hr', cost: 'Free' },
    ],
  },
  {
    n: 5, location: 'Tengboche', cost: 2200,
    hotel: { name: 'Monastery Lodge', type: 'budget' },
    activities: [
      { time: '08:00', name: 'Trek to Tengboche',        duration: '5hr', cost: 'Free' },
      { time: '15:00', name: 'Evening Prayer Ceremony',  duration: '1hr', cost: 'Free' },
    ],
  },
];

export default function ItineraryModal({ trip, onClose, onDownloadPDF }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!trip) return;
    // trap focus
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    firstFocusRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [trip, onClose]);

  if (!trip) return null;

  const itinerary = trip.itinerary ?? DEFAULT_ITINERARY;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog" aria-modal="true" aria-label={`${trip.name} Itinerary`}
    >
      <div
        className="bg-white rounded-[24px] w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'modalIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-teal-800 to-emerald-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-black text-2xl text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {trip.name}
              </h2>
              <p className="text-white/70 text-sm mt-1">
                📍 {trip.region} &nbsp;·&nbsp; {trip.days} Days &nbsp;·&nbsp; {trip.month}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusBadge[trip.status]}`}>
                {statusLabel[trip.status]}
              </span>
              <button ref={firstFocusRef} onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Budget split */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[['Hotels','NPR 13,500'],['Activities','NPR 13,250'],['Transport','NPR 12,000'],['Meals','NPR 7,500']].map(([l,v]) => (
              <div key={l} className="bg-white/10 rounded-[12px] px-3 py-2 text-center">
                <p className="text-white/60 text-[10px]">{l}</p>
                <p className="text-white font-bold text-xs mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-3">
            {itinerary.map(day => (
              <div key={day.n} className="rounded-[16px] overflow-hidden border border-[#F3F4F6]">
                {/* Day header */}
                <div className="bg-[#F0EBF8] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white text-xs font-bold flex items-center justify-center">
                      D{day.n}
                    </div>
                    <span className="font-semibold text-sm text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      Day {day.n} — {day.location}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#22C55E]">NPR {day.cost.toLocaleString()}</span>
                </div>

                {/* Hotel */}
                <div className="px-4 py-2.5 border-b border-[#F3F4F6] flex items-center gap-3">
                  <Building2 className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />
                  <span className="text-xs text-[#6B7280]">Staying at:</span>
                  <span className="text-sm font-medium text-[#111827]">{day.hotel.name}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${hotelBadge[day.hotel.type]}`}>
                    {day.hotel.type}
                  </span>
                </div>

                {/* Activities */}
                <div className="px-4 py-3 space-y-2">
                  {day.activities.map(act => (
                    <div key={act.name} className="flex items-center gap-3">
                      <span className="bg-[#F3F4F6] text-[#6B7280] text-xs px-2 py-0.5 rounded-full flex-shrink-0">{act.time}</span>
                      <span className="text-sm text-[#111827] flex-1">{act.name}</span>
                      <span className="text-xs text-[#9CA3AF]">{act.duration}</span>
                      <span className="text-xs font-medium text-[#22C55E]">{act.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-green-50 rounded-[16px] p-4 mt-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-[#374151]">Total Estimated Cost</p>
              <p className="text-xs text-[#6B7280]">{trip.days} days · {trip.region}</p>
            </div>
            <p className="font-black text-2xl text-[#22C55E]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              NPR {trip.cost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#F3F4F6] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={onDownloadPDF}
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button onClick={onClose}
            className="bg-[#22C55E] text-white font-bold text-sm rounded-full px-6 py-2.5 hover:bg-[#16A34A] transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
