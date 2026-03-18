'use client';

import { useState } from 'react';
import { LayoutGrid, Search, MapPin, CircleDollarSign } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchParams {
  category: string;
  query: string;
  location: string;
  budget: string;
}

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className }: SearchBarProps) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('All Nepal');
  const [budget, setBudget] = useState('Any Budget');

  const handleSearch = () => {
    onSearch({ category, query, location, budget });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div
      className={clsx(
        'flex items-center bg-white rounded-full overflow-hidden max-w-3xl w-full',
        className
      )}
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
    >
      {/* Category */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
        <LayoutGrid className="w-4 h-4 text-[#9CA3AF]" />
        <div className="flex flex-col">
          <span className="text-[10px] text-[#9CA3AF] leading-none">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-none outline-none bg-transparent text-sm text-[#111827] cursor-pointer mt-0.5 min-w-[80px]"
          >
            {['All', 'Trekking', 'Cultural', 'Wildlife', 'Adventure', 'Spiritual', 'Luxury'].map(
              (opt) => (
                <option key={opt}>{opt}</option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-[#E5E7EB] flex-shrink-0" />

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-0">
        <Search className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What are you looking for?"
          className="border-none outline-none bg-transparent text-sm text-[#111827] placeholder-[#9CA3AF] w-full"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-[#E5E7EB] flex-shrink-0" />

      {/* Location */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
        <MapPin className="w-4 h-4 text-[#9CA3AF]" />
        <div className="flex flex-col">
          <span className="text-[10px] text-[#9CA3AF] leading-none">Location</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-none outline-none bg-transparent text-sm text-[#111827] cursor-pointer mt-0.5 min-w-[90px]"
          >
            {['All Nepal', 'Kathmandu', 'Pokhara', 'Chitwan', 'Everest', 'Mustang', 'Langtang'].map(
              (opt) => (
                <option key={opt}>{opt}</option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-[#E5E7EB] flex-shrink-0" />

      {/* Budget */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
        <CircleDollarSign className="w-4 h-4 text-[#9CA3AF]" />
        <div className="flex flex-col">
          <span className="text-[10px] text-[#9CA3AF] leading-none">Budget (NPR)</span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="border-none outline-none bg-transparent text-sm text-[#111827] cursor-pointer mt-0.5 min-w-[90px]"
          >
            {['Any Budget', 'Under 5K', '5K–15K', '15K–30K', '30K+'].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="bg-[#22C55E] hover:bg-[#16A34A] rounded-full p-3 m-1.5 flex-shrink-0 transition-colors duration-200 cursor-pointer"
      >
        <Search className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
