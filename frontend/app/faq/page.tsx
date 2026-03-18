'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const FAQS = [
  {
    category: 'Getting Started',
    items: [
      { q: 'Is NepalGo free to use?', a: 'Yes! Creating an account and building itineraries is completely free. We may offer premium features in the future, but the core planning tools will always be free.' },
      { q: 'Do I need an account to browse destinations?', a: 'No — you can browse all destinations without signing up. You\'ll need an account to save itineraries, leave reviews, and access the full planner.' },
      { q: 'How do I build my first itinerary?', a: 'Head to the Plan page, answer a quick quiz about your preferences, and our AI will generate a personalized day-by-day itinerary instantly. No manual planning needed.' },
    ],
  },
  {
    category: 'Destinations & Planning',
    items: [
      { q: 'How does the AI recommendation system work?', a: 'We use content-based filtering to match your travel style, fitness level, interests, and budget against 30+ attributes of each destination. The result is a ranked list of destinations most likely to make your trip unforgettable.' },
      { q: 'How accurate is the budget prediction?', a: 'Our linear regression model is trained on real trip data from 10K+ travelers. Predictions are accurate within ±8% for standard itineraries. Actual costs vary based on season, group size, and personal spending habits.' },
      { q: 'Can I customize the generated itinerary?', a: 'Absolutely. Every itinerary is a starting point. You can swap hotels, add or remove activities, change the number of days, and adjust your budget. The planner updates estimates in real-time.' },
      { q: 'What if my destination isn\'t listed?', a: 'We currently cover 50+ destinations across 6 regions of Nepal. We\'re adding new destinations regularly. Use the Contact page to suggest a destination.' },
    ],
  },
  {
    category: 'Account & Privacy',
    items: [
      { q: 'How is my data used?', a: 'Your travel preferences are used only to personalize your experience on NepalGo. We never sell your data. See our Privacy Policy for full details.' },
      { q: 'Can I delete my account?', a: 'Yes. Go to your Dashboard settings and select "Delete Account". All your data will be permanently removed within 30 days.' },
      { q: 'Is my payment information stored?', a: 'NepalGo does not process payments. We are a planning tool only — all bookings are made directly with hotels and tour operators.' },
    ],
  },
];

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const toggle = (key: string) => setOpenItem(prev => prev === key ? null : key);

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item => item.q.toLowerCase().includes(search.toLowerCase()) ||
              item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12 px-6 text-center">
        <p className="text-[#22C55E] text-sm font-semibold uppercase tracking-widest mb-3">Help Center</p>
        <h1 className="text-4xl font-black text-[#111827] mb-4"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Frequently Asked Questions
        </h1>
        <p className="text-[#6B7280] mb-8 max-w-md mx-auto">
          Everything you need to know about planning your Nepal trip with NepalGo.
        </p>
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..." 
            className="w-full border border-[#E5E7EB] rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] cursor-pointer text-lg">
              ×
            </button>
          )}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-[#6B7280]">No results for &quot;{search}&quot;. Try different keywords.</p>
          </div>
        ) : (
          filtered.map(cat => (
            <div key={cat.category} className="mb-10">
              <h2 className="font-black text-lg text-[#111827] mb-4"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.items.map(item => {
                  const key = `${cat.category}-${item.q}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={key}
                      className="bg-white rounded-[16px] overflow-hidden"
                      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-[#111827] pr-4">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 text-[#6B7280] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 text-sm text-[#6B7280] leading-relaxed border-t border-[#F3F4F6] pt-4">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Still stuck? */}
        <div className="bg-white rounded-[20px] p-8 text-center mt-4"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <p className="text-2xl mb-3">💬</p>
          <h3 className="font-bold text-[#111827] mb-2"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Still have questions?
          </h3>
          <p className="text-sm text-[#6B7280] mb-4">We&apos;re happy to help. Reach out and we&apos;ll get back to you within 24 hours.</p>
          <a href="/contact"
            className="inline-block bg-[#22C55E] text-white font-bold rounded-full px-6 py-2.5 text-sm hover:bg-[#16A34A] transition-colors"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Contact Us
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
