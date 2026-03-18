import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'About Us – NepalGo',
  description: 'Learn about NepalGo — the AI-powered Nepal travel planner that helps you discover, plan, and explore with confidence.',
};

const STATS = [
  { value: '50+', label: 'Destinations' },
  { value: '10K+', label: 'Itineraries Built' },
  { value: '6', label: 'Regions Covered' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const DIFFERENTIATORS = [
  {
    emoji: '🤖',
    title: 'AI-Powered Matching',
    body: 'Our content-based filtering engine matches your travel style, fitness level, and interests to the right destinations — not just popular ones.',
  },
  {
    emoji: '💰',
    title: 'Budget Prediction',
    body: 'Linear regression models trained on real traveler data give you a realistic cost estimate before you book a single thing.',
  },
  {
    emoji: '🗓️',
    title: 'Auto Itineraries',
    body: 'Pick your days and budget — our planner builds a day-by-day schedule with activities, transport, and accommodation suggestions.',
  },
];

const TEAM = [
  { name: 'Aarav Sharma', role: 'Founder & CEO', initials: 'AS', color: '#22C55E' },
  { name: 'Priya Rai', role: 'Lead Engineer', initials: 'PR', color: '#6366F1' },
  { name: 'Sujata Gurung', role: 'Design Lead', initials: 'SG', color: '#F59E0B' },
  { name: 'Bikash Thapa', role: 'ML Engineer', initials: 'BT', color: '#EC4899' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F0EBF8]">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[420px] flex items-center justify-center overflow-hidden">
        <Image src="/images/Everest.jpeg" alt="Everest" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center px-6">
          <p className="text-[#22C55E] text-sm font-semibold uppercase tracking-widest mb-3">Our Story</p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            We are NepalGo
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Born from a love of Nepal and a belief that great travel should be accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-[#111827] mb-5"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Our Mission
            </h2>
            <p className="text-[#6B7280] leading-relaxed mb-4">
              Nepal is one of the world&apos;s most breathtaking destinations — yet planning a trip here is still fragmented, confusing, and expensive. Travelers end up overwhelmed by contradictory advice, hidden costs, and generic itineraries.
            </p>
            <p className="text-[#6B7280] leading-relaxed">
              NepalGo fixes that. We combine machine learning with on-the-ground knowledge to give every traveler a personalized, budget-smart, and deeply curated Nepal experience — whether you&apos;re trekking to Everest Base Camp or sipping coffee by Phewa Lake.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {STATS.map(({ value, label }) => (
              <div key={label}
                className="bg-white rounded-[20px] p-6 text-center"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div className="text-3xl font-black text-[#22C55E] mb-1"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {value}
                </div>
                <div className="text-sm text-[#6B7280]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-black text-[#111827] text-center mb-12"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            How We&apos;re Different
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {DIFFERENTIATORS.map(({ emoji, title, body }) => (
              <div key={title}
                className="bg-[#F0EBF8] rounded-[20px] p-8">
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-bold text-lg text-[#111827] mb-3"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-[#111827] text-center mb-12"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Meet the Team
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TEAM.map(({ name, role, initials, color }) => (
            <div key={name}
              className="bg-white rounded-[20px] p-6 text-center"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-lg mx-auto mb-4"
                style={{ backgroundColor: color, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {initials}
              </div>
              <div className="font-bold text-[#111827] text-sm mb-1"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {name}
              </div>
              <div className="text-xs text-[#6B7280]">{role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-[#166534] py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Ready to Explore Nepal?
          </h2>
          <p className="text-white/75 mb-8">Create your free account and build your first itinerary in minutes.</p>
          <Link href="/auth/register"
            className="inline-block bg-[#22C55E] text-white font-bold rounded-full px-8 py-3.5 hover:bg-[#16A34A] transition-colors"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Start Planning Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
