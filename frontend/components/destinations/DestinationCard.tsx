'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import RoundedCard from '@/components/ui/RoundedCard';
import RatingStars from '@/components/ui/RatingStars';
import PillButton from '@/components/ui/PillButton';

interface DestinationCardProps {
  id: string | number;
  slug?: string;
  name: string;
  region: string;
  description: string;
  difficulty: 'easy' | 'moderate' | 'hard' | string;
  rating: number;
  reviewCount: number;
  pricePerDay: number;
  trending?: boolean;
  matchPercent?: number;
  matchReason?: string;
  imageUrl?: string;
}

const gradients: Record<number, string> = {
  1: 'from-slate-700 via-teal-800 to-emerald-700',
  2: 'from-orange-700 via-red-700 to-rose-800',
  3: 'from-blue-700 via-cyan-600 to-teal-500',
  4: 'from-emerald-800 via-green-700 to-lime-600',
  5: 'from-purple-700 via-violet-600 to-indigo-600',
  6: 'from-amber-600 via-orange-500 to-yellow-400',
};

const difficultyMap: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-orange-100 text-orange-700',
  hard: 'bg-red-100 text-red-700',
};

export default function DestinationCard({
  id, slug, name, region, description, difficulty, rating, reviewCount, pricePerDay, trending, matchPercent, matchReason, imageUrl,
}: DestinationCardProps) {
  const numericId = typeof id === 'number' ? id : 1;
  const gradient = gradients[numericId] || gradients[1];
  const [imgFailed, setImgFailed] = useState(false);
  const detailHref = `/destinations/${slug || String(id)}`;
  const normalizedDifficulty = (difficulty || 'easy').toLowerCase();

  return (
    <RoundedCard padding="none" className="overflow-hidden">
      <div className={`relative h-48 ${(!imageUrl || imgFailed) ? `bg-gradient-to-br ${gradient}` : ''}`}>
        {imageUrl && !imgFailed && (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
        <span className={`absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full ${difficultyMap[normalizedDifficulty] || 'bg-gray-100 text-gray-700'}`}>
          {normalizedDifficulty.charAt(0).toUpperCase() + normalizedDifficulty.slice(1)}
        </span>
        {trending && (
          <span className="absolute top-3 right-3 bg-[#22C55E] text-white text-xs px-2 py-0.5 rounded-full">
            🔥 Trending
          </span>
        )}
        {matchPercent !== undefined && (
          <span className="absolute bottom-3 right-3 bg-[#22C55E] text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {matchPercent}% Match
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {name}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-[#6B7280]" />
          <span className="text-sm text-[#6B7280]">{region}</span>
        </div>
        <div className="mt-1">
          <RatingStars rating={rating} reviews={reviewCount} size="sm" />
        </div>
        <p className="text-sm text-[#6B7280] line-clamp-2 mt-2">{description}</p>
        {matchReason && <p className="text-xs italic text-[#6B7280] mt-1">{matchReason}</p>}
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm font-bold text-[#111827]">
            From NPR {pricePerDay.toLocaleString()}/day
          </span>
          <Link href={detailHref}>
            <PillButton variant="solid" size="sm">View Details</PillButton>
          </Link>
        </div>
      </div>
    </RoundedCard>
  );
}
