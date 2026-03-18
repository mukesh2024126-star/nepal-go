'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, SlidersHorizontal, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SearchBar from '@/components/ui/SearchBar';
import TagPill from '@/components/ui/TagPill';
import PillButton from '@/components/ui/PillButton';
import RoundedCard from '@/components/ui/RoundedCard';
import RatingStars from '@/components/ui/RatingStars';
import { destinationsAPI } from '@/lib/api';

interface Destination {
  name: string;
  slug?: string;
  region: string;
  difficulty: string;
  rating: number;
  review_count?: number;
  reviews?: number;
  base_price_per_day?: number;
  price?: number;
  image_url?: string;
  image?: string;
  trending?: boolean;
}

const fallbackDestinations = [
  { name: 'Everest Base Camp', region: 'Khumbu',  difficulty: 'hard',     rating: 4.9, reviews: 487, price: 8500, trending: true,  image: '/images/Everest.jpeg' },
  { name: 'Pokhara Lakeside',  region: 'Gandaki', difficulty: 'easy',     rating: 4.7, reviews: 892, price: 3500, trending: true,  image: '/images/Pokhara.jpg' },
  { name: 'Chitwan Safari',    region: 'Bagmati', difficulty: 'easy',     rating: 4.6, reviews: 634, price: 5000, trending: false, image: '/images/chitwan.jpg' },
  { name: 'Annapurna Circuit', region: 'Gandaki', difficulty: 'hard',     rating: 4.8, reviews: 312, price: 6200, trending: false, image: '/images/Annapurna.jpg' },
];

const difficultyConfig: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-orange-100 text-orange-700',
  hard: 'bg-red-100 text-red-700',
};

const categories = [
  { name: 'Adventure Sports', image: '/images/Everest.jpeg' },
  { name: 'Cultural Sites',   image: '/images/Pokhara.jpg' },
  { name: 'Wildlife & Nature',image: '/images/chitwan.jpg' },
  { name: 'Luxury Resorts',   image: '/images/Annapurna.jpg' },
];

const searchTags = ['Trekking', 'Paragliding', 'Rafting', 'Cultural Tour', 'Wildlife Safari', 'Meditation', 'Everest Trek', 'Pokhara', 'Chitwan'];

const howItWorks = [
  { step: 1, icon: <SlidersHorizontal className="w-8 h-8 text-[#22C55E] mx-auto mt-4" />, title: 'Tell Us Your Style', desc: 'Choose your destination, days, interests and budget.' },
  { step: 2, icon: <Sparkles className="w-8 h-8 text-[#22C55E] mx-auto mt-4" />, title: 'AI Builds Your Plan', desc: 'Our AI generates a personalized day-by-day itinerary.' },
  { step: 3, icon: <MapPin className="w-8 h-8 text-[#22C55E] mx-auto mt-4" />, title: 'Go Explore Nepal', desc: 'Download your plan and head off on your adventure.' },
];

export default function HomePage() {
  const [activeTag, setActiveTag] = useState('Paragliding');
  const [destinations, setDestinations] = useState<Destination[]>(fallbackDestinations);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await destinationsAPI.getFeatured();
        const list = Array.isArray(data) ? data : (data?.destinations || []);
        if (list.length > 0) {
          setDestinations(list);
        }
      } catch {
        // keep fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (params: { destination?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params.destination) query.set('search', params.destination);
    if (params.category) query.set('category', params.category);
    router.push(`/destinations${query.toString() ? `?${query.toString()}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[680px] flex items-center justify-center pb-20">
        {/* Background image */}
        <Image
          src="/images/main.jpg"
          alt="Nepal landscape"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Decorative circles — overflow clipped on their own wrapper, NOT on the section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full border-2 border-white opacity-5" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full border-2 border-white opacity-5" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full">
          <span className="text-white/70 uppercase tracking-widest text-sm mb-4">
            Discover Nepal&apos;s Hidden Gems
          </span>
          <h1 className="font-black text-5xl md:text-7xl text-white leading-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Explore Nepal,<br />Your Way
          </h1>
          <Link href="/plan" className="mt-8 inline-flex">
            <PillButton variant="solid" size="lg">
              Start Planning <ArrowRight className="w-4 h-4" />
            </PillButton>
          </Link>
        </div>

        {/* Search bar — floats -28px below the hero bottom edge */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-30">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* POPULAR SEARCHES — pt-16 reserves space for the floating search bar */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="md:flex gap-12">
          <div className="md:w-80 flex-shrink-0 mb-8 md:mb-0">
            <h2 className="font-black text-4xl text-[#111827] leading-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Popular<br />searches
            </h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTags.map((tag) => (
                <TagPill key={tag} label={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)} />
              ))}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <RoundedCard key={cat.name} padding="md">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full mx-auto overflow-hidden relative">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                  <p className="font-bold mt-3 text-sm text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    {cat.name}
                  </p>
                </div>
              </RoundedCard>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED DESTINATIONS */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-3xl text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Top Destinations</h2>
          <Link href="/destinations"><PillButton variant="ghost">View all →</PillButton></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-[20px] overflow-hidden animate-pulse" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {destinations.slice(0, 4).map((dest) => {
              const price = dest.base_price_per_day || dest.price || 3500;
              const reviews = dest.review_count || dest.reviews || 0;
              const image = dest.image_url || dest.image || '/images/Everest.jpeg';
              const difficulty = (dest.difficulty || 'easy').toLowerCase();
              const slug = dest.slug || dest.name.toLowerCase().replace(/\s+/g, '-');
              return (
                <RoundedCard key={dest.name} padding="none" className="overflow-hidden">
                  <div className="relative h-44">
                    <Image
                      src={image}
                      alt={dest.name}
                      fill
                      className="object-cover object-center"
                    />
                    {/* subtle dark gradient so badges stay readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                    {dest.trending && (
                      <span className="absolute top-3 right-3 bg-[#22C55E] text-white text-xs px-2 py-0.5 rounded-full z-10">🔥 Trending</span>
                    )}
                    <span className={`absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full z-10 ${difficultyConfig[difficulty] || 'bg-gray-100 text-gray-700'}`}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-base text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{dest.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-[#6B7280]" />
                      <span className="text-sm text-[#6B7280]">{dest.region}</span>
                    </div>
                    <div className="mt-1.5"><RatingStars rating={dest.rating} reviews={reviews} size="sm" /></div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm font-bold text-[#111827]">From NPR {price.toLocaleString()}/day</span>
                      <Link href={`/destinations/${slug}`}><PillButton variant="solid" size="sm">View</PillButton></Link>
                    </div>
                  </div>
                </RoundedCard>
              );
            })}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center">
          <h2 className="font-black text-3xl text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Plan Your Perfect Nepal Trip</h2>
          <p className="text-[#6B7280] mt-2">Three simple steps to your dream adventure</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorks.map(({ step, icon, title, desc }) => (
            <RoundedCard key={step} padding="lg" className="text-center">
              <div className="w-10 h-10 bg-[#22C55E] rounded-full text-white font-bold flex items-center justify-center mx-auto text-sm">{step}</div>
              {icon}
              <h3 className="font-bold text-lg mt-3 text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{title}</h3>
              <p className="text-[#6B7280] text-sm mt-1">{desc}</p>
            </RoundedCard>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
