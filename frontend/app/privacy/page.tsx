import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy – NepalGo',
  description: 'NepalGo privacy policy — how we collect, use, and protect your data.',
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `When you create an account, we collect your name and email address. When you use the planner, we collect your travel preferences (season, budget, interests, fitness level) to generate personalized recommendations. We do not collect payment information — NepalGo is a planning tool only.

We also collect standard server logs (IP address, browser type, pages visited) to improve performance and fix bugs. These logs are automatically deleted after 30 days.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your travel preferences are used exclusively to:
• Generate personalized destination recommendations using our AI models
• Build and save your itineraries
• Improve the accuracy of our budget prediction model (using anonymized, aggregated data only)

We do not use your data for advertising. We do not sell your data to third parties. Period.`,
  },
  {
    title: '3. Data Storage & Security',
    body: `Your data is stored on servers located in the European Union and backed up daily. We use industry-standard encryption (TLS 1.3) for all data in transit and AES-256 for data at rest.

Access to user data is restricted to core engineering staff on a need-to-know basis. We conduct security audits quarterly.`,
  },
  {
    title: '4. Cookies',
    body: `We use a single authentication cookie (nepal_token) to keep you logged in. This cookie expires after 7 days or when you log out. We do not use tracking cookies or third-party advertising cookies.`,
  },
  {
    title: '5. Third-Party Services',
    body: `NepalGo uses the following third-party services:
• Vercel — hosting and CDN
• Upstash — session management

Each of these services has its own privacy policy. We recommend reviewing them if you have specific concerns.`,
  },
  {
    title: '6. Your Rights',
    body: `You have the right to:
• Access all data we hold about you (email hello@nepalgo.com)
• Correct any inaccurate data
• Delete your account and all associated data
• Export your itinerary data in JSON format

To exercise any of these rights, contact us at hello@nepalgo.com. We respond within 5 business days.`,
  },
  {
    title: '7. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we do, we will notify registered users by email and update the "Last Updated" date below. Continued use of NepalGo after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F0EBF8]">
      <Navbar />

      <section className="pt-24 pb-12 px-6 text-center">
        <h1 className="text-4xl font-black text-[#111827] mb-3"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-[#9CA3AF]">Last updated: January 2025</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-[20px] p-8 md:p-12" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <p className="text-[#6B7280] leading-relaxed mb-8 pb-8 border-b border-[#F3F4F6]">
            NepalGo (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
            This policy explains what information we collect, how we use it, and what choices you have.
            If you have questions, email us at{' '}
            <a href="mailto:hello@nepalgo.com" className="text-[#22C55E] hover:underline">
              hello@nepalgo.com
            </a>.
          </p>

          <div className="space-y-10">
            {SECTIONS.map(({ title, body }) => (
              <div key={title}>
                <h2 className="font-black text-lg text-[#111827] mb-3"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {title}
                </h2>
                <div className="text-[#6B7280] text-sm leading-relaxed whitespace-pre-line">
                  {body}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-[#F3F4F6] text-center">
            <p className="text-sm text-[#9CA3AF] mb-4">Questions about this policy?</p>
            <Link href="/contact"
              className="inline-block border border-[#22C55E] text-[#22C55E] font-bold rounded-full px-6 py-2.5 text-sm hover:bg-[#22C55E] hover:text-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
