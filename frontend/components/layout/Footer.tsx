'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Instagram, Twitter, Youtube, ArrowRight } from 'lucide-react';

const EXPLORE = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About Us' },
  { href: '/plan', label: 'Plan a Trip' },
];
const SUPPORT = [
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <span className="font-black text-xl text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              NepalGo
            </span>
            <p className="text-sm text-[#6B7280] mt-3 leading-relaxed">
              AI-powered travel planning for Nepal. Discover, plan, and explore with confidence.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { Icon: Twitter,   href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Youtube,   href: '#' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href}
                  className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:border-[#22C55E] hover:text-[#22C55E] transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-bold text-sm text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Explore</h4>
            <ul className="space-y-2.5">
              {EXPLORE.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-sm text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Support</h4>
            <ul className="space-y-2.5">
              {SUPPORT.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-sm text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Stay Updated</h4>
            <p className="text-sm text-[#6B7280] mb-3">Get Nepal travel tips and new features in your inbox.</p>
            {subscribed ? (
              <div className="bg-green-50 border border-green-200 rounded-[12px] px-4 py-3 text-sm text-green-700 font-medium">
                ✅ You&apos;re subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white"
                />
                <button type="submit"
                  className="w-9 h-9 rounded-full bg-[#22C55E] text-white flex items-center justify-center hover:bg-[#16A34A] transition-colors flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] mt-10 pt-6 text-center text-sm text-[#9CA3AF]">
          © {new Date().getFullYear()} NepalGo. Built for Nepal travelers.
        </div>
      </div>
    </footer>
  );
}
