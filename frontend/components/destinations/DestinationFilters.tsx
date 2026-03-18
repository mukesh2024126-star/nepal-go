'use client';

import { useState } from 'react';
import RoundedCard from '@/components/ui/RoundedCard';
import TagPill from '@/components/ui/TagPill';
import PillButton from '@/components/ui/PillButton';

interface FilterState {
  categories: string[];
  regions: string[];
  difficulty: string;
  minBudget: string;
  maxBudget: string;
  seasons: string[];
}

interface DestinationFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DestinationFilters({ onFilterChange }: DestinationFiltersProps) {
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [seasons, setSeasons] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, setSet: (s: Set<string>) => void, val: string) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setSet(next);
  };

  const clearAll = () => {
    setCategories(new Set());
    setRegions(new Set());
    setDifficulty('');
    setMinBudget('');
    setMaxBudget('');
    setSeasons(new Set());
    onFilterChange({ categories: [], regions: [], difficulty: '', minBudget: '', maxBudget: '', seasons: [] });
  };

  const applyFilters = () => {
    onFilterChange({
      categories: [...categories],
      regions: [...regions],
      difficulty,
      minBudget,
      maxBudget,
      seasons: [...seasons],
    });
  };

  return (
    <RoundedCard padding="md" className="sticky top-24">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Filters</h3>
        <button onClick={clearAll} className="text-sm text-[#22C55E] cursor-pointer hover:text-[#16A34A]">Clear All</button>
      </div>

      {/* Category */}
      <div className="border-b pb-4 mb-4">
        <p className="font-semibold text-sm text-[#111827] mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {['Trekking', 'Cultural', 'Wildlife', 'Adventure', 'Spiritual', 'Luxury'].map((c) => (
            <TagPill key={c} label={c} active={categories.has(c)} onClick={() => toggle(categories, setCategories, c)} />
          ))}
        </div>
      </div>

      {/* Region */}
      <div className="border-b pb-4 mb-4">
        <p className="font-semibold text-sm text-[#111827] mb-2">Region</p>
        <div className="flex flex-wrap gap-2">
          {['Kathmandu Valley', 'Pokhara', 'Chitwan', 'Mustang', 'Everest', 'Langtang'].map((r) => (
            <TagPill key={r} label={r} active={regions.has(r)} onClick={() => toggle(regions, setRegions, r)} />
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="border-b pb-4 mb-4">
        <p className="font-semibold text-sm text-[#111827] mb-2">Difficulty</p>
        <div className="flex gap-2">
          {['Easy', 'Moderate', 'Hard'].map((d) => (
            <TagPill key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(difficulty === d ? '' : d)} />
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="border-b pb-4 mb-4">
        <p className="font-semibold text-sm text-[#111827] mb-2">Budget/Day (NPR)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
            className="w-24 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#22C55E]"
          />
          <span className="text-[#6B7280]">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            className="w-24 text-sm px-3 py-1.5 rounded-full border border-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#22C55E]"
          />
        </div>
      </div>

      {/* Best Season */}
      <div className="pb-2 mb-4">
        <p className="font-semibold text-sm text-[#111827] mb-2">Best Season</p>
        <div className="flex flex-wrap gap-1">
          {months.map((m) => (
            <TagPill key={m} label={m} size="sm" active={seasons.has(m)} onClick={() => toggle(seasons, setSeasons, m)} />
          ))}
        </div>
      </div>

      <PillButton variant="solid" fullWidth onClick={applyFilters}>Apply Filters</PillButton>
    </RoundedCard>
  );
}
