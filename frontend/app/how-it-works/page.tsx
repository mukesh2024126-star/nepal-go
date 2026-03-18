import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Wallet, Route, Cpu, Users, LineChart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PillButton from '@/components/ui/PillButton';
import RoundedCard from '@/components/ui/RoundedCard';

export const metadata: Metadata = {
  title: 'How It Works – NepalGo',
  description: 'See how NepalGo uses AI to match you to the perfect Nepal destinations and build personalized itineraries.',
};

const STEPS = [
  {
    number: '01',
    title: 'Set your travel vibe',
    body: 'Pick destination, number of days, interests, difficulty, budget tier, and travel month. NepalGo turns this into your planning profile.',
    icon: Sparkles,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    number: '02',
    title: 'Get ranked destination matches',
    body: 'Our recommendation engine scores Nepal destinations against your profile, then explains why each destination fits you.',
    icon: Route,
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    number: '03',
    title: 'Generate a day-by-day itinerary',
    body: 'AI creates a practical schedule with activities, hotels, and movement between places — designed around your days and comfort level.',
    icon: Cpu,
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    number: '04',
    title: 'Review budget and save the trip',
    body: 'See estimated cost breakdowns, refine your plan, then save it to your dashboard so you can revisit or regenerate anytime.',
    icon: Wallet,
    accent: 'from-amber-500 to-orange-500',
  },
];

const PILLARS = [
  {
    icon: Users,
    title: 'Personalized, not generic',
    body: 'Your interests and travel style shape recommendations and itinerary logic.',
  },
  {
    icon: LineChart,
    title: 'Data-driven decisions',
    body: 'Matching and budget prediction use structured signals from destination and trip data.',
  },
  {
    icon: ShieldCheck,
    title: 'Built for Nepal travel',
    body: 'The flow and suggestions are tuned specifically for Nepal destinations and realities.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F0EBF8]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      <section className="pt-24 pb-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[28px] p-8 md:p-12 relative overflow-hidden" style={{ boxShadow: '0 8px 34px rgba(0,0,0,0.08)' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#22C55E]/10" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-400/10" />

            <p className="text-[#22C55E] text-xs font-bold uppercase tracking-[0.22em] mb-4">How NepalGo Works</p>
            <h1 className="text-4xl md:text-5xl font-black text-[#111827] leading-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Real planning flow.
              <br />
              Your style, your budget, your Nepal trip.
            </h1>
            <p className="text-[#6B7280] mt-5 max-w-2xl text-base md:text-lg">
              NepalGo combines recommendation logic, budget prediction, and itinerary generation into one smooth planning experience — without losing your aesthetic or control.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plan"><PillButton variant="solid" size="md">Try Trip Planner</PillButton></Link>
              <Link href="/destinations"><PillButton variant="outline" size="md">Browse Destinations</PillButton></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-5">
          {STEPS.map(({ number, title, body, icon: Icon, accent }) => (
            <RoundedCard key={number} padding="lg" className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accent}`} />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F0EBF8] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#9CA3AF] tracking-wider">STEP {number}</p>
                  <h3 className="font-black text-xl text-[#111827] mt-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{title}</h3>
                  <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">{body}</p>
                </div>
              </div>
            </RoundedCard>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-[24px] p-8 md:p-10" style={{ boxShadow: '0 8px 34px rgba(0,0,0,0.08)' }}>
          <h2 className="text-3xl font-black text-[#111827] text-center" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Why this feels better than a generic AI page
          </h2>
          <p className="text-[#6B7280] text-center mt-2">Same NepalGo theme, cleaner hierarchy, and clearer decision points.</p>

          <div className="grid md:grid-cols-3 gap-5 mt-8">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[18px] bg-[#F0EBF8] p-5 border border-[#E5E7EB]">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#22C55E]" />
                </div>
                <h3 className="font-bold text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{title}</h3>
                <p className="text-sm text-[#6B7280] mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#166534] py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Ready to build your next Nepal trip?
          </h2>
          <p className="text-white/80 mb-8">Start planning now and save your itinerary to your dashboard.</p>
          <Link href="/auth/register" className="inline-block">
            <PillButton variant="solid" size="lg">Get Started Free</PillButton>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
