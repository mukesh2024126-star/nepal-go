'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DestinationCard from '@/components/destinations/DestinationCard';
import DestinationFilters from '@/components/destinations/DestinationFilters';
import TagPill from '@/components/ui/TagPill';
import PillButton from '@/components/ui/PillButton';
import RoundedCard from '@/components/ui/RoundedCard';
import { destinationsAPI, aiAPI } from '@/lib/api';

const aiInterests = ['Adventure', 'Cultural', 'Wildlife', 'Trekking', 'Photography', 'Spiritual', 'Luxury'];

function DestinationsContent() {
  const searchParams = useSearchParams();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('Most Popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [aiSelected, setAiSelected] = useState<string[]>([]);
  const [showingAI, setShowingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const toggleAI = (tag: string) => {
    setAiSelected((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (showingAI) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { ...filters, search, page: String(currentPage) } as any;
        if (sortBy === 'Rating') params.sort = 'rating';
        if (sortBy === 'Price Low-High') params.sort = 'price_asc';
        const result = await destinationsAPI.getAll(params);
        const list = Array.isArray(result) ? result : (result?.destinations || []);
        setDestinations(list);
        setTotal(result?.total ?? list.length);
        setTotalPages(result?.total_pages ?? 1);
      } catch {
        setError('Failed to load destinations. Please retry.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, search, currentPage, sortBy, showingAI]);

  const handleAIRecommend = async () => {
    if (aiSelected.length === 0) return;
    setAiLoading(true);
    setShowingAI(true);
    try {
      const result = await aiAPI.recommend({
        interests: aiSelected,
        difficulty: filters.difficulty || 'Moderate',
        budget_tier: 'Mid-Range',
        travel_month: new Date().toLocaleString('default', { month: 'long' }),
        num_days: 5,
      });
      const recs = result?.recommendations || [];
      setDestinations(recs);
      setTotal(recs.length);
    } catch {
      setError('Failed to fetch AI recommendations.');
    } finally {
      setAiLoading(false);
    }
  };

  const clearAll = () => {
    setFilters({});
    setSearch('');
    setCurrentPage(1);
    setShowingAI(false);
    setAiSelected([]);
  };

  const handleFilterChange = (f: { categories?: string[]; regions?: string[]; difficulty?: string; minBudget?: string; maxBudget?: string }) => {
    const next: Record<string, string> = {};
    if (f.categories?.length) next.category = f.categories[0];
    if (f.regions?.length) next.region = f.regions[0];
    if (f.difficulty) next.difficulty = f.difficulty;
    if (f.maxBudget) next.budget_max = f.maxBudget;
    setFilters(next);
    setCurrentPage(1);
  };

  const pageNumbers = useMemo(() => {
    const max = Math.min(totalPages, 5);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: max }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-[#6B7280]"><Link href="/" className="hover:text-[#111827]">Home</Link> / Destinations</p>
          <h1 className="font-black text-3xl text-[#111827] mt-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Explore Nepal</h1>
          <p className="text-sm text-[#6B7280]">Showing {total} destinations</p>
          <div className="mt-3 flex gap-2">
            <input type="text" placeholder="Search destinations..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full max-w-md rounded-full border border-[#E5E7EB] px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#22C55E] bg-white" />
            <PillButton variant="outline" size="sm" onClick={clearAll}>Clear all filters</PillButton>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <RoundedCard padding="md" className="border-l-4 border-[#22C55E] mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Find Your Perfect Match</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">Select your interests and let AI find the best destinations</p>
            </div>
            <div className="flex gap-2 flex-wrap">{aiInterests.map((tag) => <TagPill key={tag} label={tag} active={aiSelected.includes(tag)} onClick={() => toggleAI(tag)} />)}</div>
            <PillButton variant="solid" size="sm" onClick={handleAIRecommend} disabled={aiLoading || aiSelected.length === 0}>{aiLoading ? 'Finding...' : 'Get AI Recommendations'}</PillButton>
          </div>
        </RoundedCard>

        {showingAI && <div className="mb-4"><PillButton variant="outline" size="sm" onClick={() => setShowingAI(false)}>← Show All Destinations</PillButton></div>}
        {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-[16px] p-4"><p className="text-sm text-red-600">{error}</p></div>}

        <div className="flex gap-8">
          <div className="w-72 flex-shrink-0"><DestinationFilters onFilterChange={handleFilterChange} /></div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-[#6B7280]">{total} destinations found</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#6B7280]">Sort by:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-full border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#111827] outline-none focus:ring-1 focus:ring-[#22C55E] bg-white">
                  {['Most Popular', 'Rating', 'Price Low-High'].map((opt) => <option key={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-5">{[1,2,3,4].map((i) => <div key={i} className="bg-white rounded-[20px] overflow-hidden animate-pulse" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}><div className="h-40 bg-gray-200" /><div className="p-4 space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /><div className="h-3 bg-gray-200 rounded w-full" /></div></div>)}</div>
            ) : (
              <>
                <div id="destinations-grid" className="grid grid-cols-2 gap-5">
                  {destinations.map((d: any) => (
                    <DestinationCard
                      key={d.id || d.slug || d.name}
                      id={d.id || d.slug || d.name}
                      slug={d.slug}
                      name={d.name}
                      region={d.region}
                      description={d.short_description || d.description || d.match_reason || ''}
                      difficulty={(d.difficulty || 'easy').toLowerCase()}
                      rating={d.rating || 0}
                      reviewCount={d.review_count || d.reviewCount || 0}
                      pricePerDay={d.base_price_per_day || d.pricePerDay || 0}
                      trending={d.trending}
                      imageUrl={d.image_url}
                      matchPercent={showingAI ? Math.round(d.match_score || 0) : undefined}
                      matchReason={showingAI ? d.match_reason : undefined}
                    />
                  ))}
                </div>
                {destinations.length === 0 && <div className="text-center py-12"><p className="text-4xl mb-3">🔍</p><p className="font-bold text-[#111827]">No destinations found</p></div>}
              </>
            )}

            {!showingAI && totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); document.getElementById('destinations-grid')?.scrollIntoView({ behavior: 'smooth' }); }} disabled={currentPage === 1}
                  className="rounded-full px-3 h-9 border border-[#E5E7EB] disabled:opacity-50">Previous</button>
                {pageNumbers.map((page) => (
                  <button key={page} onClick={() => { setCurrentPage(page); document.getElementById('destinations-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className={`rounded-full w-9 h-9 border ${currentPage === page ? 'bg-[#22C55E] text-white border-[#22C55E]' : 'bg-white border-[#E5E7EB]'}`}>{page}</button>
                ))}
                <button onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); document.getElementById('destinations-grid')?.scrollIntoView({ behavior: 'smooth' }); }} disabled={currentPage === totalPages}
                  className="rounded-full px-3 h-9 border border-[#E5E7EB] disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function DestinationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0EBF8]" />}>
      <DestinationsContent />
    </Suspense>
  );
}
